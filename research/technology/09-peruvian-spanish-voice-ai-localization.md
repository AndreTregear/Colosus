# Peruvian Spanish Voice AI & Localization Requirements

**Classification:** Technology — Product Design  
**Date:** March 21, 2026  
**Research Cycle:** 6  
**Word Target:** 1,500+  

---

## 1. WHY THIS MATTERS FOR YAYA

The Conversational CEO vision depends on Yaya understanding and producing natural Peruvian Spanish — not generic "español neutro" or Castilian. Research from Collexa Tech (February 2026) demonstrates that voice AI pilots matching regional voices report up to 70% resolution rates and CSATs above 90%, while mismatched accents cause call drops and trust erosion. For a WhatsApp-native platform where voice notes are a primary input modality, getting Peruvian Spanish right is existential.

**Key statistic:** 62% of WhatsApp daily users globally send voice notes (SQ Magazine, 2025). In LATAM, where Argentina leads at 29.5 hours/month on WhatsApp and Colombia at 25.75 hours/month, voice-first behavior is the norm, not the exception. Peru's 26M WhatsApp users are heavy voice note senders — the platform must handle this input natively.

---

## 2. PERUVIAN SPANISH: FIVE DIALECTS, ONE COUNTRY

Peru has five recognized Spanish dialects (Wikipedia — Peruvian Spanish), each with distinct characteristics that affect speech recognition:

### 2.1 Peruvian Coastal Spanish (Costeño)

- **Where:** Lima, Trujillo, Arequipa (Yaya's primary market)
- **Key features:** Clear, neutral pronunciation; considered one of the "purest" LATAM dialects; no debuccalization of /s/ between vowels; clear /r/ and /ɾ/ pronunciation
- **STT implications:** Favorable for standard Spanish ASR models; Lima accent is well-represented in training data
- **Business relevance:** Yaya's Phase 1 users (beauty salons in Miraflores/San Borja) will primarily speak this dialect

### 2.2 Andean-Coastal Spanish (Ribereño-Andino)

- **Where:** Lima outskirts, migration corridors (the majority of Lima's population)
- **Key features:** Mix of Andean and Coastal patterns; weakened consonants /b/, /d/, /g/ in intervocalic positions; vowel confusion (/e/↔/i/, /o/↔/u/); accelerated speech with Andean intonation
- **STT implications:** Higher WER expected due to consonant weakening and vowel merging; this is the speech pattern of most micro-entrepreneurs in Lima's periphery
- **Business relevance:** As Yaya expands beyond Miraflores to broader Lima (Comas, San Juan de Lurigancho, Villa El Salvador), this dialect becomes the majority

### 2.3 Andean Spanish (Serrano)

- **Where:** Cusco, Puno, Huancavelica, Ayacucho
- **Key features:** Slow rhythm, grave accent; assibilation of /r/; strong Quechua influence on vocabulary and syntax; "loísmo"; diminutive-heavy speech
- **STT implications:** Most challenging for standard Spanish ASR; phonetic patterns diverge significantly from training data; vowel confusion is systematic
- **Business relevance:** Phase 3+ (rural/agricultural expansion); lower priority for initial deployment

### 2.4 Amazonic Spanish

- **Where:** Loreto, Ucayali, Madre de Dios
- **Key features:** Distinctive tonal structure; confusion of /x/ with /f/ ("San Juan" → "San Fan"); aspirated /p/, /t/, /k/; unique rhythmic patterns
- **STT implications:** Hardest dialect for any standard model; tonal variation creates unique challenges
- **Business relevance:** Later expansion; acopiador/cooperative verticals

### 2.5 Equatorial Spanish

- **Where:** Tumbes, Piura (northern coast)
- **Key features:** Closer to Ecuadorian Spanish; /s/ aspiration more common
- **STT implications:** Moderate difficulty; shares features with broader LATAM models
- **Business relevance:** Northern Peru agricultural expansion

---

## 3. PERUVIAN SLANG (JERGA) IN BUSINESS CONTEXTS

Yaya's NLU must handle Peruvian business slang naturally. Key terms that will appear in business WhatsApp conversations:

### 3.1 Essential Business Vocabulary

| Peruvian Term | Standard Spanish | English | Context |
|---|---|---|---|
| chamba | trabajo | work/job | "No tengo chamba" = No work |
| plata | dinero | money | Universal across Peru |
| misio | sin dinero | broke | "Estoy misio" = I'm broke |
| jato | casa | house/place | "Nos vemos en mi jato" |
| pata / causa | amigo | friend/buddy | "Mi pata Carlos" = My friend Carlos |
| bacán / chévere / paja | genial | cool/great | "¡Qué bacán tu negocio!" |
| yapa | extra gratis | free extra | Market/retail context: "¿Me das la yapa?" |
| porfa / xfa | por favor | please | WhatsApp text abbreviation |
| cole | colegio | school | Education vertical relevance |
| seño | señora | ma'am | Market/salon address form |

### 3.2 WhatsApp Text Abbreviations (Peruvian)

Yaya must parse these in text messages:
- **PQ** = ¿por qué? (why?)
- **D1 / De uno** = of course / right away
- **xfa / xfis** = por favor (please)
- **tqm / tkm** = te quiero mucho (love you)
- **pe / pue** = pues (well/so) — uniquely Peruvian truncation

### 3.3 Cultural Communication Patterns

- **Heavy use of diminutives:** "cafecito", "ratito", "ahorita" — conveys warmth, not literal smallness. Yaya should mirror this pattern
- **"Ya" as multipurpose word:** Agreement ("ya"), urgency ("¡ya!"), disbelief ("yaaa pues"), farewell ("ya, chau"). Context-dependent parsing required
- **"Nomás pues":** Uniquely Peruvian intensifier/softener. "Dile nomás pues" = Just tell them
- **Present perfect for recent past:** "He vendido tres hoy" (I've sold three today) vs. "Vendí tres hoy" — Peruvians prefer the former, unlike Mexicans
- **Usted in business:** Even casual business conversations may use "usted" to show respect — Yaya should default to "usted" with new users and switch to "tú" only when the user does

---

## 4. SPEECH-TO-TEXT TECHNOLOGY ASSESSMENT

### 4.1 Current STT Landscape (March 2026)

Based on Northflank's comprehensive 2026 benchmarks:

| Model | WER (avg) | Languages | Speed | Best For |
|---|---|---|---|---|
| Canary Qwen 2.5B | 5.63% | English only | 418x RTF | — |
| IBM Granite Speech 8B | 5.85% | EN + ES + FR + DE | — | Enterprise ASR |
| Whisper Large V3 | 7.4% | 99+ languages | Baseline | **Multilingual (Yaya's choice)** |
| Whisper V3 Turbo | 7.75% | 99+ languages | 6x faster | **Speed-critical (voice notes)** |
| Distil-Whisper | ~8% | English only | 6x faster | — |

### 4.2 Whisper Performance on Peruvian Spanish

- **General Spanish accuracy:** Whisper Large V3 is among the best for Spanish, with Spanish being a "high-resource" language in its training data
- **Clear speech (quiet room):** 95%+ accuracy (ThreadRecap, 2026)
- **Normal background noise (cafe, street):** 90-95% accuracy
- **Heavy noise (construction, market):** 80-90% accuracy
- **Heavy slang or code-switching:** Lower accuracy — this is Yaya's primary risk area

Google's 2020 research on crowdsourced Latin American Spanish TTS confirmed that multidialectal models outperform monodialectal baselines for Peruvian Spanish. Their open-source datasets for AR, CL, CO, PE, PR, and VE Spanish remain available for fine-tuning.

### 4.3 Recommended STT Pipeline for Yaya

**Phase 1 (MVP — Month 1-6):**
- Use Whisper Large V3 Turbo for voice note transcription (6x speed, 99+ languages)
- Deploy on c.yaya.sh (2× RTX A5000) — sufficient VRAM for Whisper + LLM concurrent inference
- Estimated latency: <2 seconds for 30-second voice note
- Add post-processing layer for Peruvian slang normalization (e.g., "misio" → intent: "no_money", "chamba" → intent: "work")

**Phase 2 (Optimization — Month 6-12):**
- Fine-tune Whisper on Peruvian Spanish voice data collected from Phase 1 users (with consent)
- Target: 2-4% WER improvement on Peruvian dialect → 10-15% improvement in intent recognition accuracy
- Integrate Google's open-source PE Spanish dataset for initial fine-tuning baseline

**Phase 3 (Production Scale — Month 12+):**
- Evaluate IBM Granite Speech (if Spanish support improves) for enterprise-grade accuracy
- Consider deploying Moonshine (27M parameters) for edge/mobile scenarios if Yaya builds a companion app

### 4.4 Voice Note Processing Architecture

```
WhatsApp Voice Note (.opus, typically 5-60 seconds)
  ↓
Audio extraction & normalization (ffmpeg, resample to 16kHz)
  ↓
Language detection (Whisper automatic — confirm es-PE)
  ↓
STT transcription (Whisper V3 Turbo, local GPU)
  ↓
Peruvian slang normalization layer
  ↓
Intent recognition + entity extraction (LLM — Qwen 3.5-27B)
  ↓
Business action (create invoice, check inventory, schedule appointment)
  ↓
Response generation (text + optional TTS for voice reply)
```

---

## 5. TEXT-TO-SPEECH: YAYA'S VOICE

### 5.1 Voice Selection Criteria

Yaya's TTS voice must:
1. Sound **naturally Peruvian** — Coastal/Lima accent, not Castilian or Mexican
2. Be **warm but professional** — matching the salon/business context
3. Support **diminutives naturally** — "listo tu facturita" not "lista tu factura"
4. Handle **Peruvian currency and numbers** — "ciento veinte soles" not "ciento veinte"

### 5.2 TTS Technology Options

- **ElevenLabs:** Best quality, supports Spanish, but accent control is limited. Cost: $0.15-0.30/1K characters. At scale (500 users × 10 voice responses/day × 100 chars), ~$225/month
- **Local TTS (Coqui/XTTS):** Open source, can fine-tune on Peruvian voice. Zero marginal cost. Quality improving rapidly
- **Google Cloud TTS:** Supports es-PE locale specifically. $4/million characters. Reliable but cloud-dependent
- **Whisper + XTTS pipeline:** Transcribe → process → respond in voice. Fully local deployment possible on c.yaya.sh

### 5.3 Recommendation

Start with Google Cloud TTS (es-PE locale) for quality guarantee, transition to local XTTS deployment when fine-tuned Peruvian voice model is ready (Month 6-9). This aligns with the local-infrastructure cost moat strategy.

---

## 6. CULTURAL LOCALIZATION BEYOND LANGUAGE

### 6.1 Time and Calendar

- Peruvian business hours: 9 AM - 6 PM, but salons often operate 9 AM - 9 PM
- Saturday is a major salon day (often busiest)
- "Ahorita" means "in a moment" but could be 5 minutes or 2 hours — Yaya should ask for specific times
- National holidays affect scheduling: Fiestas Patrias (July 28-29), Santa Rosa de Lima (Aug 30)

### 6.2 Numbers and Money

- Currency format: S/ 49.90 (with S/ prefix, not after)
- "Lucas" = 1,000 soles ("Vendí cinco lucas hoy" = I sold S/5,000 today)
- IGV is always 18% — Yaya should handle tax-inclusive and tax-exclusive calculations seamlessly
- Yape/Plin amounts typically in whole numbers (S/ 10, S/ 20, S/ 50)

### 6.3 Trust-Building Communication

- Start formal (usted), transition to informal only after user initiates
- Use emoji sparingly but warmly (✅, 💰, 📊) — mirrors Peruvian WhatsApp style
- Acknowledge voice notes: "Escuché tu nota de voz..." before responding
- Never hallucinate numbers — "No tengo esa información, déjame verificar" is always better than a wrong number
- Use "pe" naturally: "¿Algo más, pe?" signals cultural fluency

---

## 7. KEY RISKS AND MITIGATIONS

| Risk | Severity | Mitigation |
|---|---|---|
| Voice notes in noisy environments (market, street) | High | Noise-robust Whisper + fallback to "No entendí bien, ¿podrías repetir?" |
| Quechua code-switching | Medium | Maintain Quechua glossary for common business terms (papa, cancha, etc.) |
| Regional accent mismatch (Andean users in Lima) | High | Fine-tune on Andean-Coastal dialect data; this is the majority speech pattern |
| Slang evolution (jerga changes fast among youth) | Low | Quarterly slang dictionary updates from user conversations |
| TTS accent sounds "too perfect" / robotic | Medium | Use conversational-pace TTS with natural pauses; A/B test with users |

---

## 8. IMPLEMENTATION PRIORITIES

1. **Month 1:** Deploy Whisper V3 Turbo on c.yaya.sh for voice note transcription
2. **Month 1:** Build Peruvian slang normalization dictionary (100+ terms)
3. **Month 2:** Implement Google Cloud TTS (es-PE) for voice responses
4. **Month 3:** Begin collecting (with consent) voice note data from pilot salon users
5. **Month 6:** Fine-tune Whisper on collected Peruvian Spanish data
6. **Month 9:** Transition TTS to local XTTS with fine-tuned Peruvian voice
7. **Month 12:** Evaluate accuracy across dialects; prepare for multi-dialect support

---

*This document provides the technical specification for Peruvian Spanish voice AI localization. It should be read alongside technology/07 (Conversational CEO Product Spec) and technology/08 (Peru Payment Integration). Sources: Northflank STT benchmarks (2026), Google Research (2020 LREC), Collexa Tech (2026), Wikipedia Peruvian Spanish, ThreadRecap (2026), SQ Magazine WhatsApp Statistics (2025).*
