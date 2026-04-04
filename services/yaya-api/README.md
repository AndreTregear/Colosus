# Yaya Platform - API Service

WhatsApp business assistant platform for small businesses in Peru.

## Features

- WhatsApp Business API integration via Baileys
- AI-powered chat with business tools (revenue, expenses, orders, products)
- Audio-native conversations with vLLM-Omni integration
- SQLite database for business data
- Express REST API
- Real-time messaging via Server-Sent Events

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the server:
```bash
npm run dev
```

## Audio-Native Conversations

This platform supports audio-native WhatsApp conversations using vLLM-Omni with Qwen3-Omni model. See [README-OMNI.md](README-OMNI.md) for detailed setup instructions.

### Quick Enable
```bash
# In your .env file
OMNI_ENABLED=true
OMNI_API_URL=http://localhost:8091/v1
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npx tsx test-omni.ts` - Test vLLM-Omni integration

## Architecture

- `server.ts` - Express HTTP server
- `whatsapp.ts` - WhatsApp gateway (Baileys)
- `ai.ts` - Traditional AI chat (OpenAI-compatible)
- `omni.ts` - vLLM-Omni audio-native chat
- `db.ts` - SQLite database layer
- `onboarding.ts` - User onboarding flow

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `OMNI_ENABLED` - Enable audio-native conversations (default: false)
- `AI_API_URL` - AI model endpoint
- `DB_PATH` - SQLite database path
- `PORT` - HTTP server port

## License

Private - Yaya Platform