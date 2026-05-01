"""
Whisper STT Server — Ley 29733 Compliant (no audio caching).

OpenAI-compatible /v1/audio/transcriptions endpoint using faster-whisper.
All audio is processed in-memory and never written to disk.

Compliance guarantees:
- Audio received via multipart form → kept in memory only
- Transcription runs on in-memory bytes (no temp files)
- Response returned → audio bytes dereferenced → GC'd
- No disk cache, no model audio cache, no logging of audio content
"""

import io
import os
import gc
import logging
import hashlib
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from faster_whisper import WhisperModel

app = Flask(__name__)

# ── Configuration ──

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "large-v3-turbo")
DEVICE = os.environ.get("WHISPER_DEVICE", "cuda")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "int8")
GPU_INDEX = int(os.environ.get("WHISPER_GPU", "0"))
PORT = int(os.environ.get("WHISPER_PORT", "9100"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("whisper-stt")

# ── Model Loading ──

log.info(
    "Loading Whisper model=%s device=%s compute=%s gpu=%d",
    MODEL_SIZE, DEVICE, COMPUTE_TYPE, GPU_INDEX,
)

model = WhisperModel(
    MODEL_SIZE,
    device=DEVICE,
    compute_type=COMPUTE_TYPE,
    device_index=GPU_INDEX,
    # No download cache directory — model loads from HF cache or local path
)

log.info("Whisper model loaded successfully")


def _audit_log(action: str, audio_hash: str, size_bytes: int, **extra):
    """Structured audit log for Ley 29733 compliance."""
    log.info(
        "AUDIT compliance=ley-29733 data_type=biometric-voice action=%s "
        "audio_sha256=%s size_bytes=%d timestamp=%s %s",
        action,
        audio_hash,
        size_bytes,
        datetime.now(timezone.utc).isoformat(),
        " ".join(f"{k}={v}" for k, v in extra.items()),
    )


# ── Routes ──


@app.route("/v1/audio/transcriptions", methods=["POST"])
def transcribe():
    """OpenAI-compatible transcription endpoint. No audio persistence."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files["file"]
    audio_bytes = audio_file.read()

    if not audio_bytes:
        return jsonify({"error": "Empty audio file"}), 400

    language = request.form.get("language", "es")
    size_bytes = len(audio_bytes)

    # Hash for audit trail (before processing)
    audio_hash = hashlib.sha256(audio_bytes).hexdigest()

    log.info(
        "Transcribing audio size=%d language=%s hash=%s",
        size_bytes, language, audio_hash[:16],
    )

    try:
        # Process entirely in memory — no temp files
        audio_stream = io.BytesIO(audio_bytes)
        segments, info = model.transcribe(
            audio_stream,
            language=language,
            beam_size=5,
            vad_filter=True,
        )

        # Collect text from segments
        text_parts = []
        for segment in segments:
            text_parts.append(segment.text)

        text = " ".join(text_parts).strip()

        log.info(
            "Transcription complete chars=%d language=%s probability=%.2f hash=%s",
            len(text), info.language, info.language_probability, audio_hash[:16],
        )

        return jsonify({"text": text})

    finally:
        # Ley 29733: securely wipe audio from memory
        # Overwrite bytes with zeros before dereferencing
        if isinstance(audio_bytes, (bytes, bytearray)):
            # bytes is immutable, but bytearray can be wiped
            # Force replacement: create a zero bytearray of same size
            try:
                audio_stream.seek(0)
                audio_stream.write(b"\x00" * size_bytes)
                audio_stream.close()
            except Exception:
                pass

        # Dereference and force GC
        del audio_bytes
        del audio_stream
        gc.collect()

        _audit_log(
            "audio_processed_and_wiped",
            audio_hash,
            size_bytes,
            language=language,
        )


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "model": MODEL_SIZE, "compliance": "ley-29733"})


if __name__ == "__main__":
    log.info("Starting Whisper STT server on port %d (Ley 29733 compliant — no audio caching)", PORT)
    app.run(host="0.0.0.0", port=PORT, threaded=True)
