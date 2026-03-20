FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir faster-whisper flask

COPY server.py .

ENV WHISPER_MODEL=large-v3-turbo \
    WHISPER_DEVICE=cuda \
    WHISPER_COMPUTE=int8 \
    WHISPER_GPU=0 \
    WHISPER_PORT=9100

EXPOSE 9100

CMD ["python", "server.py"]
