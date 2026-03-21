#!/usr/bin/env python3
"""
High-performance Kokoro TTS server with GPU acceleration.
OpenAI-compatible API for drop-in replacement.
Designed for parallel processing and scale.

Architecture:
- Model loaded once on GPU, shared across all requests
- Thread-safe inference with request queuing
- Concurrent request handling via gunicorn gthread workers
- Audio format conversion (WAV, MP3, OGG/Opus for WhatsApp)
- Batch synthesis support for multiple segments
"""

import os
import io
import time
import uuid
import logging
import tempfile
import subprocess
import threading
from pathlib import Path

import numpy as np
import soundfile as sf
from flask import Flask, request, jsonify, send_file, Response

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tts-server")

app = Flask(__name__)

# ── Configuration ──────────────────────────────────────
TTS_PORT = int(os.environ.get("TTS_PORT", "9200"))
TTS_DEVICE = os.environ.get("TTS_DEVICE", "cuda")
TTS_DEFAULT_VOICE = os.environ.get("TTS_DEFAULT_VOICE", "af_heart")
TTS_DEFAULT_LANG = os.environ.get("TTS_DEFAULT_LANG", "a")
TTS_API_KEY = os.environ.get("TTS_API_KEY", "megustalaia")
OUTPUT_DIR = os.environ.get("TTS_OUTPUT_DIR", "/tmp/tts-output")

Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

# ── Thread-safe model singleton ────────────────────────
_model_lock = threading.Lock()
_pipeline = None


def get_pipeline():
    """Lazy-load Kokoro pipeline once, thread-safe."""
    global _pipeline
    if _pipeline is None:
        with _model_lock:
            if _pipeline is None:
                import kokoro
                logger.info(f"Loading Kokoro TTS model on {TTS_DEVICE}...")
                start = time.time()
                _pipeline = kokoro.KPipeline(lang_code=TTS_DEFAULT_LANG)
                logger.info(f"Kokoro loaded in {time.time() - start:.1f}s")
    return _pipeline


# ── Inference lock for GPU serialization ───────────────
_inference_lock = threading.Lock()


def synthesize(text: str, voice: str = None, speed: float = 1.0) -> np.ndarray:
    """Thread-safe synthesis. Serializes GPU access."""
    voice = voice or TTS_DEFAULT_VOICE
    pipeline = get_pipeline()

    with _inference_lock:
        start = time.time()
        audio_chunks = []
        for _, _, audio in pipeline(text, voice=voice, speed=speed):
            audio_chunks.append(audio)

        if not audio_chunks:
            raise ValueError("No audio generated")

        # Concatenate all chunks
        import torch
        if isinstance(audio_chunks[0], torch.Tensor):
            full_audio = torch.cat(audio_chunks, dim=-1).cpu().numpy()
        else:
            full_audio = np.concatenate(audio_chunks, axis=-1)

        elapsed = time.time() - start
        duration = len(full_audio) / 24000
        rtf = elapsed / duration if duration > 0 else 0
        logger.info(f"Synthesized {len(text)} chars → {duration:.1f}s audio in {elapsed:.2f}s (RTF: {rtf:.2f}x)")

    return full_audio


def audio_to_format(audio: np.ndarray, fmt: str = "wav", sample_rate: int = 24000) -> io.BytesIO:
    """Convert numpy audio to requested format."""
    buf = io.BytesIO()

    if fmt in ("wav", "pcm"):
        sf.write(buf, audio, sample_rate, format="WAV")
        buf.seek(0)
        return buf

    # For mp3, ogg, opus — use ffmpeg
    wav_buf = io.BytesIO()
    sf.write(wav_buf, audio, sample_rate, format="WAV")
    wav_buf.seek(0)

    fmt_map = {
        "mp3": ["-f", "mp3", "-codec:a", "libmp3lame", "-q:a", "2"],
        "ogg": ["-f", "ogg", "-codec:a", "libvorbis", "-q:a", "4"],
        "opus": ["-f", "ogg", "-codec:a", "libopus", "-b:a", "48k"],
        "ogg_opus": ["-f", "ogg", "-codec:a", "libopus", "-b:a", "48k"],
    }

    ffmpeg_args = fmt_map.get(fmt, fmt_map["mp3"])

    proc = subprocess.run(
        ["ffmpeg", "-i", "pipe:0", "-y"] + ffmpeg_args + ["pipe:1"],
        input=wav_buf.read(),
        capture_output=True,
        timeout=30,
    )

    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg error: {proc.stderr.decode()[:500]}")

    buf = io.BytesIO(proc.stdout)
    buf.seek(0)
    return buf


# ── Auth middleware ─────────────────────────────────────
def check_auth():
    if not TTS_API_KEY:
        return True
    auth = request.headers.get("Authorization", "")
    return auth == f"Bearer {TTS_API_KEY}" or auth == TTS_API_KEY


# ── API Routes ─────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "ok": True,
        "model": "kokoro-82m",
        "device": TTS_DEVICE,
        "default_voice": TTS_DEFAULT_VOICE,
    })


@app.route("/v1/audio/speech", methods=["POST"])
@app.route("/api/v1/audio/speech", methods=["POST"])
def openai_speech():
    """OpenAI-compatible TTS endpoint."""
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    text = data.get("input", "")
    voice = data.get("voice", TTS_DEFAULT_VOICE)
    speed = float(data.get("speed", 1.0))
    response_format = data.get("response_format", "mp3")

    if not text:
        return jsonify({"error": "No input text provided"}), 400

    try:
        audio = synthesize(text, voice=voice, speed=speed)
        buf = audio_to_format(audio, fmt=response_format)

        content_types = {
            "wav": "audio/wav",
            "mp3": "audio/mpeg",
            "ogg": "audio/ogg",
            "opus": "audio/ogg; codecs=opus",
            "ogg_opus": "audio/ogg; codecs=opus",
        }

        return Response(
            buf.read(),
            mimetype=content_types.get(response_format, "audio/mpeg"),
            headers={"Content-Disposition": f"attachment; filename=speech.{response_format}"},
        )
    except Exception as e:
        logger.error(f"Synthesis failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/v1/audio/voices", methods=["GET"])
@app.route("/api/v1/audio/voices", methods=["GET"])
def list_voices():
    """List available voices."""
    voices = [
        {"id": "af_heart", "name": "Heart", "language": "en/es", "gender": "female", "style": "warm"},
        {"id": "af_bella", "name": "Bella", "language": "en/es", "gender": "female", "style": "professional"},
        {"id": "af_sarah", "name": "Sarah", "language": "en/es", "gender": "female", "style": "friendly"},
        {"id": "am_adam", "name": "Adam", "language": "en/es", "gender": "male", "style": "neutral"},
        {"id": "am_michael", "name": "Michael", "language": "en/es", "gender": "male", "style": "deep"},
        {"id": "bf_emma", "name": "Emma", "language": "en", "gender": "female", "style": "british"},
    ]
    return jsonify({"voices": voices})


@app.route("/v1/audio/whatsapp", methods=["POST"])
@app.route("/api/v1/audio/whatsapp", methods=["POST"])
def whatsapp_voice_note():
    """
    Generate a WhatsApp-ready voice note (OGG Opus format).
    This is the key endpoint for Yaya Platform voice replies.
    Returns the audio file saved to disk + the file path.
    """
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    voice = data.get("voice", TTS_DEFAULT_VOICE)
    speed = float(data.get("speed", 1.0))

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        audio = synthesize(text, voice=voice, speed=speed)
        buf = audio_to_format(audio, fmt="ogg_opus")

        # Save to file for WhatsApp MCP to pick up
        filename = f"voice_{uuid.uuid4().hex[:12]}.ogg"
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(buf.read())

        duration = len(audio) / 24000

        return jsonify({
            "ok": True,
            "file_path": filepath,
            "filename": filename,
            "duration_seconds": round(duration, 1),
            "format": "ogg/opus",
            "size_bytes": os.path.getsize(filepath),
        })
    except Exception as e:
        logger.error(f"WhatsApp voice note failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/v1/audio/batch", methods=["POST"])
@app.route("/api/v1/audio/batch", methods=["POST"])
def batch_synthesis():
    """
    Batch synthesis for multiple texts.
    Useful for generating all appointment reminders at once.
    """
    if not check_auth():
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    voice = data.get("voice", TTS_DEFAULT_VOICE)
    speed = float(data.get("speed", 1.0))

    if not items:
        return jsonify({"error": "No items provided"}), 400

    results = []
    for item in items:
        text = item.get("text", "") if isinstance(item, dict) else str(item)
        item_id = item.get("id", str(len(results))) if isinstance(item, dict) else str(len(results))

        try:
            audio = synthesize(text, voice=voice, speed=speed)
            buf = audio_to_format(audio, fmt="ogg_opus")

            filename = f"batch_{uuid.uuid4().hex[:8]}.ogg"
            filepath = os.path.join(OUTPUT_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(buf.read())

            results.append({
                "id": item_id,
                "ok": True,
                "file_path": filepath,
                "duration_seconds": round(len(audio) / 24000, 1),
            })
        except Exception as e:
            results.append({"id": item_id, "ok": False, "error": str(e)})

    return jsonify({"results": results, "total": len(results), "success": sum(1 for r in results if r["ok"])})


# ── Startup ────────────────────────────────────────────
if __name__ == "__main__":
    # Pre-load model
    get_pipeline()
    app.run(host="0.0.0.0", port=TTS_PORT, threaded=True)
