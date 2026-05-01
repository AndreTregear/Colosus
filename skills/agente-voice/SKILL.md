# agente-voice — Voice-First Interaction

## Description
Manages voice-first communication with customers. Decides when to respond with voice notes vs text, handles the full voice pipeline (Whisper STT → LLM → Kokoro TTS), and adapts to LATAM voice note culture where customers routinely send 1-2 minute voice messages instead of typing. The voice skill makes Agente feel human — customers hear a warm, natural voice that matches the conversational tone of the business.

## When to Use
- Customer sends a voice note (always transcribe, decide if response should be voice)
- Agent needs to respond and must choose between voice, text, or both
- Customer explicitly requests voice ("háblame", "dime", "explícame")
- Multilingual context where language detection is needed (tourist markets)

## Modality Decision Matrix

### RESPOND WITH VOICE when:
- **Customer sent a voice note** — always reciprocate the modality. If they spoke, speak back.
- **Long explanation (>200 chars)** — voice is easier to consume than reading a wall of text on a phone screen
- **Emotional context** — congratulations on a purchase, empathy for a complaint, celebrating a milestone
- **Customer explicitly asks** — "háblame", "dime", "explícame por voz", "mándame un audio"
- **Instructions or directions** — step-by-step instructions are easier to follow by voice
- **Relationship building** — first interaction with a new customer, voice feels warmer

### RESPOND WITH TEXT when:
- **Structured data** — prices, product lists, order details, invoices, tracking numbers
- **Links or reference numbers** — anything the customer needs to copy/paste or click
- **Customer sent text** — reciprocate the modality
- **Short confirmations** — "Listo, tu pedido está confirmado", "Recibido, gracias"
- **System information** — account details, payment instructions, business hours
- **Numbers and amounts** — "S/150.00", order #12345, phone numbers

### RESPOND WITH BOTH when:
- **Complex information** — voice summary of the situation + text with the specific details
- **Order confirmation** — warm voice acknowledgment + text with order number, total, delivery date
- **Problem resolution** — empathetic voice explaining the solution + text with action items/next steps
- **Onboarding** — voice welcome + text with setup instructions and links

## MCP Tools Required
- `voice-mcp` — Primary: transcribe_audio, synthesize_speech, voice_reply, detect_language, get_available_voices
- `whatsapp-mcp` — Send voice notes and text messages via send_media (audio type)

## Voice Pipeline Flow

### Inbound Voice Note
```
1. Customer sends voice note via WhatsApp
2. WhatsApp delivers .ogg audio file
3. Call transcribe_audio with the audio file
4. Whisper returns Spanish text
5. Text enters normal agent processing
6. Agent decides response modality (see matrix above)
```

### Outbound Voice Reply
```
1. Agent decides to respond with voice
2. Agent composes response text (natural, conversational Spanish)
3. Call voice_reply with the response text
4. Kokoro TTS generates speech → converts to OGG Opus
5. Send via whatsapp-mcp send_media (media_type: audio)
6. Customer receives a voice note from the business
```

### Language Detection (Multilingual Markets)
```
1. Audio arrives from a tourist area (e.g., Cusco, Miraflores)
2. Call detect_language on the audio
3. If Spanish → normal flow
4. If English → transcribe in English, respond in English
5. If other → transcribe with auto-detection, respond in detected language
```

## Voice Style Guidelines

### Tone
- **Warm and conversational** — like talking to a friendly shopkeeper, not a robot
- **Natural pace** — not too fast, not too slow. Speed 1.0 is default.
- **Confident but not pushy** — the voice should feel helpful, not salesy

### Content for Voice
- Keep voice responses concise (15-45 seconds ideal, max 60 seconds)
- Use natural speech patterns, not written-text-read-aloud
- Include verbal pauses and transitions: "Mira...", "A ver...", "Entonces..."
- Address the customer by name when known
- End with a clear next step or question

### What NOT to say in voice
- Long lists of items or prices (use text for these)
- URLs, email addresses, or reference numbers
- Anything the customer needs to write down
- Legal disclaimers or terms and conditions

## Spanish Voice Interaction Examples

### Customer sends voice note asking about a product
```
Customer (voice): "Hola, quería saber si tienen disponible la camiseta negra
talla M que vi la semana pasada, y cuánto cuesta"

Agent response (voice):
"¡Hola! Sí, la camiseta negra talla M está disponible.
Te la tenemos a cuarenta y cinco soles.
¿Te la separo o quieres que te mande más detalles por mensaje?"

Agent response (text):
"Camiseta negra — Talla M
Precio: S/45.00
Stock: 3 unidades disponibles"
```

### Customer sends voice note with a complaint
```
Customer (voice): "Oye me llegó el pedido pero está incompleto,
pedí tres cosas y solo me llegaron dos, no es la primera vez que pasa"

Agent response (voice):
"Ay, disculpa mucho el inconveniente. Entiendo tu frustración,
y tienes toda la razón en reclamar. Déjame revisar tu pedido
ahora mismo para ver qué artículo falta y coordinar el envío
lo antes posible. ¿Me das un momentito?"
```

### Customer asks for directions (tourist in Cusco)
```
Customer (voice, English): "Hi, how do I get to your store from Plaza de Armas?"

Agent detects language: English
Agent response (voice, English):
"Hey! So from Plaza de Armas, walk down Calle Plateros for about two blocks.
You'll see a blue door on your right, right next to the pharmacy.
That's us! It's about a five minute walk. See you soon!"

Agent response (text):
"📍 Calle Plateros 234, a 2 cuadras de Plaza de Armas
🚶 ~5 min caminando"
```

### Customer sends text, agent responds with text
```
Customer (text): "precio del arroz 5kg?"

Agent response (text):
"Arroz 5kg — S/18.50
Stock disponible ✅
¿Te lo separo?"
```

## Cultural Context: Voice Notes in LATAM

Voice notes are the dominant communication mode in Latin America. Key behaviors:
- People send 2-minute voice notes instead of typing a sentence
- Voice notes are sent while walking, driving, cooking — hands-free communication
- Voice is considered warmer and more personal than text
- Businesses that respond with voice notes are perceived as more trustworthy and personal
- Not responding to a voice note with voice can feel cold or dismissive
- Many customers, especially older ones, strongly prefer voice over text
- Voice notes are also common for sharing stories, complaints, and emotional context

The agent should embrace this culture — voice notes are not an inconvenience, they're the preferred modality.

## Voice Selection Guide

For LATAM Spanish markets, prefer Spanish-language voices:
- `ef_dora` — Female, warm Spanish voice (recommended for most businesses)
- `em_alex` — Male, clear Spanish voice

For English-speaking tourists:
- `af_heart` — Female, warm and friendly (default)
- `am_adam` — Male, deep and confident

The business owner can configure their preferred voice during onboarding. The default should match the personality of the business.
