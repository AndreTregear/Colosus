FROM python:3.12-slim

WORKDIR /app

# Install system deps for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install GPU-accelerated TTS
RUN pip install --no-cache-dir \
    kokoro>=0.9 \
    flask>=3.0 \
    gunicorn>=22.0 \
    soundfile \
    numpy \
    torch \
    gevent

COPY server.py .

ENV TTS_PORT=9200 \
    TTS_WORKERS=4 \
    TTS_DEVICE=cuda \
    TTS_DEFAULT_VOICE=af_heart \
    TTS_DEFAULT_LANG=a

EXPOSE 9200

# Gunicorn with gevent workers for parallel requests
CMD ["gunicorn", "--bind", "0.0.0.0:9200", "--workers", "1", "--threads", "4", "--worker-class", "gthread", "--timeout", "120", "server:app"]
