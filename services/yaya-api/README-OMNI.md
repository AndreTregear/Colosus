# vLLM-Omni Integration for Audio-Native WhatsApp Conversations

This integration adds support for audio-native conversations using **vLLM-Omni** serving **Qwen3-Omni** model, enabling direct audio-to-audio communication through WhatsApp.

## Overview

The integration provides two modes of operation:

1. **Traditional Mode** (`OMNI_ENABLED=false`): Uses Whisper for speech-to-text transcription → text-based AI → Kokoro TTS for text-to-speech
2. **Omni Mode** (`OMNI_ENABLED=true`): Direct audio-to-audio processing with Qwen3-Omni model

## Files Added/Modified

### New Files
- `omni.ts` - Core vLLM-Omni client module
- `test-omni.ts` - Integration test script
- `README-OMNI.md` - This documentation

### Modified Files
- `whatsapp.ts` - Updated message handling for audio processing
- `ai.ts` - Exported tools and functions for reuse in omni.ts
- `db.ts` - Fixed crypto imports
- `.env.example` - Added omni-related environment variables

## Environment Variables

Add these to your `.env` file:

```bash
# vLLM-Omni integration for audio-native conversations
OMNI_ENABLED=false                                    # Enable/disable omni mode
OMNI_API_URL=http://localhost:8091/v1                # vLLM-Omni server endpoint
OMNI_API_KEY=EMPTY                                   # API key for vLLM-Omni
OMNI_MODEL=Qwen/Qwen3-Omni-30B-A3B-Instruct         # Model name
OMNI_SPEAKER=chelsie                                 # TTS speaker voice

# TTS and Whisper endpoints (used when OMNI_ENABLED=false)
TTS_URL=http://localhost:9400                        # Kokoro TTS server
WHISPER_URL=https://ai.yaya.sh/v1                    # Whisper transcription
WHISPER_API_KEY=megustalaia                          # Whisper API key
```

## Setup Instructions

### 1. Install Dependencies

Dependencies are already included in `package.json`. Ensure ffmpeg is installed for audio conversion:

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y ffmpeg

# macOS
brew install ffmpeg

# CentOS/RHEL
sudo yum install -y ffmpeg
```

### 2. Start vLLM-Omni Server

Start the vLLM-Omni server with Qwen3-Omni model:

```bash
# Example command (adjust paths as needed)
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-Omni-30B-A3B-Instruct \
  --enable-auto-tool-choice \
  --tool-call-parser hermes \
  --port 8091 \
  --host 0.0.0.0
```

### 3. Enable Omni Mode

Set `OMNI_ENABLED=true` in your environment and restart the application.

### 4. Test the Integration

```bash
# Run the test script
tsx test-omni.ts

# Or test manually by building and running
npm run build
npm start
```

## How It Works

### Voice Message Processing

**Traditional Mode:**
1. WhatsApp voice message → Download OGG audio
2. Send to Whisper API → Get text transcription
3. Process text with AI model → Get text response
4. Send text to Kokoro TTS → Generate audio
5. Send audio response to WhatsApp

**Omni Mode:**
1. WhatsApp voice message → Download OGG audio
2. Convert to base64 and send directly to Qwen3-Omni
3. Get both text and audio response from model
4. Convert WAV audio to OGG/Opus for WhatsApp
5. Send audio response to WhatsApp

### Text Message Processing

**Traditional Mode:**
- Text → AI model → Text response

**Omni Mode:**
- Text → Qwen3-Omni (text-only modality) → Text response
- No audio generation for text-only conversations

### Tool Calling

Both modes support the same business tools (revenue, expenses, products, orders, etc.). In omni mode:

1. Tool calls use `modalities: ["text"]` to avoid generating audio for intermediate responses
2. Only the final response includes audio output
3. Tool execution reuses the same functions from `ai.ts`

## Audio Format Handling

The integration handles multiple audio format conversions:

- **Input**: WhatsApp OGG → Base64 OGG (for vLLM-Omni)
- **Output**: Model WAV → OGG/Opus (for WhatsApp)
- **Fallback**: Text if audio processing fails

## Error Handling

- Graceful fallback to text mode if audio processing fails
- Proper error logging for debugging
- Maintains conversation flow even with audio conversion errors

## Performance Considerations

- Audio processing adds latency compared to text-only
- Use appropriate bitrates for voice (32k recommended)
- Monitor vLLM-Omni server performance and scaling
- Consider caching audio responses for repeated queries

## Troubleshooting

### Common Issues

1. **FFmpeg not found**
   - Install ffmpeg system-wide
   - Ensure it's in PATH

2. **vLLM-Omni connection failed**
   - Check OMNI_API_URL is correct
   - Verify vLLM-Omni server is running
   - Check firewall/network access

3. **Audio conversion errors**
   - Verify input audio format is supported
   - Check ffmpeg supports libopus codec
   - Monitor audio buffer sizes

4. **WhatsApp audio not playing**
   - Ensure OGG/Opus format is correct
   - Check `ptt: true` flag is set
   - Verify mimetype is 'audio/ogg; codecs=opus'

### Debug Mode

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

This will show detailed audio processing logs in the console.

## API Reference

### `omni.ts` Module

#### `chatOmni(userId, userMessage, audioBase64?, audioFormat?)`
Main chat function for omni integration.

**Parameters:**
- `userId`: User identifier
- `userMessage`: Text message (can be empty for audio-only)
- `audioBase64?`: Base64-encoded audio data
- `audioFormat?`: Audio format (wav, ogg, mp3, etc.)

**Returns:**
```typescript
{
  text: string;           // Text response
  audioBase64?: string;   // Base64 WAV audio response
  audioFormat?: string;   // Audio format (always 'wav')
}
```

#### `isOmniEnabled()`
Check if omni mode is active.

#### `convertOggToWav(oggBuffer)`
Convert OGG buffer to WAV for model input.

#### `convertWavToOpus(wavBase64)`
Convert base64 WAV to OGG/Opus buffer for WhatsApp.

## Future Enhancements

- Support for more audio formats
- Audio quality optimization
- Streaming audio responses
- Voice cloning for personalized responses
- Multi-language TTS support
- Audio emotion detection and response