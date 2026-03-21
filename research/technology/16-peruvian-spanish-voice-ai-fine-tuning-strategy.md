# Peruvian Spanish Voice AI: Fine-Tuning Strategy for Financial Accuracy

**Research Document #16 (Technology)**
**Date:** March 21, 2026
**Category:** Technology / Voice AI / NLP
**Relevance:** Critical — voice notes are Yaya's primary input interface; financial term accuracy is non-negotiable

---

## Executive Summary

Yaya's core value proposition depends on accurately transcribing a Peruvian salon owner's voice note: "Hoy le hice un balayage a la señora Martínez, cobré ciento ochenta soles, pagó con Yape." One misheard number — "ciento" becomes "cien," or "ochenta" becomes "sesenta" — and the financial record is wrong, eroding trust permanently. This document analyzes Whisper's capabilities for Peruvian Spanish, identifies the specific failure modes for financial vocabulary, and provides a concrete fine-tuning strategy.

---

## 1. Whisper's Baseline Performance on Spanish

### 1.1 Training Data

OpenAI's Whisper was trained on 680,000 hours of labeled audio data, of which **11,100 hours are Spanish** (FUTO Whisper Training Data Breakdown). Spanish is the 4th most-represented language in Whisper's training set, after English (438K hours), Chinese (23K hours), and German (13K hours).

However, "Spanish" in Whisper's training data is a broad category encompassing:
- Castilian Spanish (Spain)
- Mexican Spanish (the largest Latin American source)
- Argentine Spanish
- Colombian Spanish
- And smaller contributions from other regions

**Peruvian Spanish is likely underrepresented** in the training data. Peru's media output is smaller than Mexico's, Argentina's, or Spain's, and Andean Spanish dialects have distinctive features that diverge from the Latin American Spanish most prevalent in Whisper's training set.

### 1.2 Andean/Peruvian Spanish Distinctive Features

Peruvian Spanish, particularly the variety spoken by Lima's working class and provincial migrants (Yaya's target market), has several features that may challenge standard ASR:

**Phonological:**
- Seseo (universal in Latin America — /s/ and /z/ merge)
- Weakened or aspirated /s/ at end of syllables ("entonces" → "entonce")
- Quechua substrate influences on vowel quality (/e/ → [ɪ], /o/ → [ʊ])
- Characteristic intonation pattern distinct from Mexican or Argentine Spanish
- /rr/ tends to be assibilated in highland varieties

**Lexical (salon/business-specific):**
- "Yape" / "Yapear" (digital payment verb, not in any dictionary)
- "Boleta" (receipt/invoice — specific Peruvian tax document)
- "Factura" (formal invoice, different from boleta)
- "RUC" (tax ID number — Registro Único de Contribuyentes)
- "Soles" / "Solcitos" (currency, diminutive)
- "Balayage," "keratina," "brushing," "mechas" (salon services — loanwords)
- "Propina" (tip), "vuelto" (change), "cuenta" (bill/account)
- "Turno" (appointment), "cita" (appointment, more formal)

**Numerical patterns (critical for financial accuracy):**
- Currency amounts: "ciento ochenta soles" (S/180)
- Prices often stated without "soles": "cobré doscientos" (I charged 200)
- Quantities: "tres clientes" (3 clients)
- Percentages: "el veinte por ciento de descuento" (20% discount)
- Phone numbers (for client booking): digit-by-digit or in pairs

### 1.3 Expected Failure Modes

Based on Whisper fine-tuning literature and the specific characteristics above:

| Failure Mode | Example | Impact | Frequency |
|---|---|---|---|
| Number confusion | "ochenta" (80) → "sesenta" (60) | **Critical** — wrong financial record | Medium |
| New vocab miss | "Yape" → "Llape" or "Jape" | Medium — wrong payment method | High initially |
| Salon terms | "balayage" → "balance" or "ballaje" | Low — wrong service name | Medium |
| Background noise | Salon has music, dryers, conversation | High — entire transcription fails | High |
| Rapid speech | Working-class Lima rapid delivery | Medium — words dropped | Medium |
| Code-switching | "La cliente quiere highlights" | Low — cosmetic | Low |
| Quechua-influenced vowels | "me pidió" sounds like "me pedió" | Low — semantic context resolves | Low |

---

## 2. Fine-Tuning Strategy

### 2.1 Model Selection

**Recommended base model:** `openai/whisper-large-v3` (1.55B parameters)

**Why large-v3 over smaller models:**
- Financial accuracy requires maximum model capacity
- Numbers and currency amounts need the full attention mechanism
- Self-hosted on c.yaya.sh (2× RTX A5000, 24GB each) — can run large-v3 inference
- The accuracy difference between whisper-small (244M) and whisper-large (1.55B) is roughly 30-50% WER reduction

**Alternative for real-time:** `openai/whisper-medium` (769M) if latency is critical. Can run on a single A5000.

**Inference framework:** `faster-whisper` (CTranslate2-based) for 4x speed improvement with int8 quantization, while maintaining accuracy.

### 2.2 Training Data Sources

Building a Peruvian Spanish fine-tuning dataset requires combining several sources:

#### Source 1: Synthetic Voice Notes (ElevenLabs or XTTS)
Generate synthetic salon business voice notes covering:
- Price declarations: "Cobré ciento cincuenta soles por el corte y tinte"
- Payment method: "La señora pagó con Yape" / "Pagó en efectivo"
- Client names: Common Peruvian names (María, José, Carmen, Luis)
- Service descriptions: All common salon services
- Daily summaries: "Hoy atendí ocho clientes, vendí en total mil doscientos soles"

**Target:** 500-1,000 synthetic utterances (5-10 hours after augmentation)

**Voice profiles:** Female 35-50 (salon owner demographic), Lima accent, moderate speech rate, varied background noise levels.

#### Source 2: Mozilla Common Voice (Spanish)
- Filter for Latin American speakers
- ~500+ hours available for Spanish overall
- Provides diverse accent exposure
- Won't have financial vocabulary but provides base robustness

#### Source 3: Custom Recording Sessions
- Record 5-10 actual salon owners in Lima speaking naturally about their daily business
- 30-60 minutes each = 2.5-10 hours of authentic data
- This is the **gold standard** — real speakers, real vocabulary, real noise
- **Cost:** ~$50-100 per session (pay participants), total ~$250-500

#### Source 4: Peruvian Media Transcription
- Peruvian YouTube channels about beauty/salon business
- Radio programs discussing small business topics
- SUNAT informational videos about tax compliance
- Pseudo-label with Whisper-large-v3, then manually correct

**Total training data target:** 15-30 hours (sufficient for domain adaptation fine-tuning)

### 2.3 Fine-Tuning Methodology

Based on current best practices from HuggingFace and recent papers (Timmel et al., 2024; ACL VarDial 2025):

#### Step 1: Prepare Data Pipeline
```python
# Key hyperparameters for Peruvian Spanish financial fine-tuning
config = {
    "base_model": "openai/whisper-large-v3",
    "language": "es",
    "task": "transcribe",
    
    # Training params
    "learning_rate": 1e-5,  # Conservative for large model
    "batch_size": 8,  # Per GPU
    "gradient_accumulation_steps": 4,
    "epochs": 3,  # Avoid catastrophic forgetting
    "warmup_steps": 500,
    
    # LoRA/PEFT for efficiency
    "use_peft": True,
    "lora_r": 32,
    "lora_alpha": 64,
    "lora_target_modules": ["q_proj", "v_proj"],
    
    # Data
    "max_audio_length": 30,  # seconds
    "sample_rate": 16000,
}
```

#### Step 2: Long-Form Data Generation
Following Timmel et al. (2024), concatenate sentence-level samples into 30-second chunks with timestamps. This preserves Whisper's ability to handle long-form audio (critical — voice notes can be 30-60 seconds).

Key techniques:
- **Timestamp correction** via Silero VAD
- **Noise overlapping** with salon ambient sounds (hair dryers, music, conversation)
- **Speaker retention** (same speaker across concatenated segments)

#### Step 3: Financial Vocabulary Augmentation
Create a focused dataset of financial utterances with deliberate variations:

```
"cobré ciento ochenta soles" → S/180
"cobré cien soles" → S/100  
"fueron doscientos cincuenta" → S/250
"le cobré sesenta y cinco" → S/65
"vendí por trescientos veinte" → S/320
"pagó con Yape ciento cuarenta" → S/140
"en efectivo, cien solcitos" → S/100
"su vuelto es quince soles" → S/15
```

Generate each with:
- 3 different voice profiles
- 3 noise levels (quiet, moderate, salon-busy)
- 2 speaking speeds
= 18 variations per utterance × 200 base utterances = **3,600 financial training samples**

#### Step 4: Evaluation Metrics
Standard WER is insufficient. Define custom metrics:

1. **Financial WER (F-WER):** WER computed only on financial terms (numbers, currency, payment methods)
2. **Number Exact Match (NEM):** Binary — did the number transcribe exactly correctly?
3. **Critical Error Rate (CER-F):** Percentage of utterances where a financial value was wrong
4. **Noise-Degraded Accuracy:** WER at different SNR levels (salon environment)

**Target thresholds:**
| Metric | Target | Acceptable | Unacceptable |
|---|---|---|---|
| Overall WER | <10% | <15% | >20% |
| Financial WER | <5% | <8% | >10% |
| Number Exact Match | >95% | >90% | <85% |
| Critical Error Rate | <2% | <5% | >8% |

### 2.4 Catastrophic Forgetting Prevention

Fine-tuning on a small domain-specific dataset risks the model "forgetting" its general Spanish capabilities. Mitigations:

1. **LoRA/PEFT:** Train only adapter weights, not the full model. Preserves base knowledge.
2. **Mixed training data:** Include 30% general Spanish data alongside domain-specific data.
3. **Early stopping:** Monitor both domain-specific and general WER; stop if general WER degrades >2%.
4. **Language tag preservation:** Always use `language="es"` during training to maintain Spanish capability.

### 2.5 Post-Processing Pipeline (Complementary to Fine-Tuning)

Even with a fine-tuned model, add a post-processing layer:

```python
class FinancialTranscriptProcessor:
    def process(self, raw_text: str) -> StructuredTransaction:
        # 1. Number normalization
        #    "ciento ochenta" → 180
        #    "doscientos cincuenta" → 250
        
        # 2. Currency detection
        #    "soles" / "solcitos" / implicit (after number) → PEN
        
        # 3. Payment method extraction
        #    "Yape" / "efectivo" / "tarjeta" / "Plin" → PaymentMethod
        
        # 4. Service recognition
        #    "balayage" / "corte" / "tinte" / "keratina" → ServiceType
        
        # 5. Confidence scoring
        #    If ASR confidence < 0.8 on a number → flag for user confirmation
        
        # 6. LLM verification (Qwen3.5-27B)
        #    Send transcript to LLM for structured extraction
        #    Cross-check numbers between ASR and LLM interpretation
```

This two-stage approach (fine-tuned Whisper → LLM structured extraction) provides redundant accuracy checking on financial data.

---

## 3. Infrastructure Requirements

### 3.1 Training Infrastructure

**Hardware:** c.yaya.sh (i9-10900X, 2× RTX A5000 24GB, 125GB RAM)

| Component | Requirement | Available | Status |
|---|---|---|---|
| GPU VRAM | 24GB (whisper-large-v3 with PEFT) | 2× 24GB | ✅ Sufficient |
| GPU compute | ~10-20 hours for fine-tuning | Available | ✅ |
| Storage | ~50GB for datasets + checkpoints | Available | ✅ |
| Framework | PyTorch + HuggingFace Transformers | Can install | ✅ |

**Estimated training time:** 10-20 hours on a single A5000 with PEFT/LoRA

### 3.2 Inference Infrastructure

**Production inference with faster-whisper:**
- Model: whisper-large-v3 fine-tuned, int8 quantized
- Hardware: Single A5000 (24GB)
- Latency: <2 seconds for a 30-second voice note
- Throughput: ~15 concurrent transcriptions
- Memory: ~4GB VRAM with int8

**Scaling consideration:** At 1,000 users, assuming 10 voice notes per user per day = 10,000 transcriptions/day = ~7 per minute average. Well within single-GPU capacity.

---

## 4. Alternative Approaches

### 4.1 Google Cloud Speech-to-Text
- Supports Spanish (Latin American) with custom vocabulary
- $0.006 per 15 seconds = ~$0.024 per voice note
- At 1,000 users × 10 notes/day = $240/day = **$7,200/month**
- **Verdict:** Too expensive. Self-hosted is 10-50x cheaper.

### 4.2 Azure Speech Services
- Similar pricing to Google: ~$1/audio hour
- Custom speech models available with 5+ hours of training data
- **Verdict:** Good accuracy, but cost-prohibitive at scale.

### 4.3 OpenAI Whisper API
- $0.006 per minute
- 1,000 users × 10 notes × 0.5 min = 5,000 min/day = $30/day = **$900/month**
- **Verdict:** More reasonable, but still 10-20x more than self-hosted.

### 4.4 Existing Fine-Tuned Models
- `shraavb/spanish-slang-whisper` (HuggingFace): Fine-tuned on Spain, Mexico, Argentina, Chile slang. **No Peru, no financial vocabulary.** Base is whisper-small (too small for financial accuracy).
- No existing Peruvian Spanish financial fine-tuned model found.
- **Verdict:** Must fine-tune our own model.

---

## 5. Data Collection Plan

### Phase 1: Synthetic Data (Week 1-2 of development)
1. Write 200 base financial utterances covering all common salon transactions
2. Generate with ElevenLabs or XTTS in 3 voice profiles
3. Add noise augmentation at 3 levels
4. Result: ~3,600 training samples, ~5 hours

### Phase 2: Public Data Curation (Week 2-3)
1. Download Mozilla Common Voice Spanish dataset
2. Filter for Latin American speakers
3. Curate 10 hours of diverse Spanish audio
4. Pseudo-label Peruvian YouTube beauty business content (5 hours)
5. Result: ~15 hours additional training data

### Phase 3: Real-World Recording (Concurrent with pilot)
1. During Customer Zero pilot, record (with consent) actual voice notes
2. Manually transcribe with exact financial figures
3. This becomes the highest-quality fine-tuning and evaluation data
4. Result: Growing dataset, target 5-10 hours over 3 months

### Phase 4: Continuous Learning
1. Every manually-corrected transcription becomes training data
2. Monthly re-fine-tune with accumulated real-world data
3. Financial accuracy should improve steadily over first 6 months

---

## 6. Key Insights

1. **Numbers are the hardest part.** "Ciento" vs "cien," "ochenta" vs "sesenta" — a single phoneme difference creates a completely different financial record. The fine-tuning dataset must heavily oversample numerical expressions.

2. **Salon noise is a real adversary.** Hair dryers produce broadband noise at 70-80 dB. Background music, client conversations, and running water all compete with the voice note. Noise-augmented training is essential.

3. **Self-hosted beats cloud by 10-50x in cost.** This is the same conclusion as strategy/19 (unit economics) but now quantified for voice AI specifically: cloud ASR at scale would be $900-7,200/month vs. ~$50-100/month for self-hosted electricity/depreciation.

4. **The two-stage pipeline (Whisper → LLM) provides redundant financial accuracy.** Even if Whisper transcribes "sesenta" instead of "ochenta," the LLM can flag the discrepancy if the context suggests a different amount.

5. **Real salon recordings during pilot are gold.** The single most valuable fine-tuning data will come from Customer Zero. Plan to record (with consent) and manually verify every voice note during the first month.

6. **LoRA/PEFT makes this feasible on existing hardware.** Full fine-tuning of whisper-large-v3 would require multiple A100s. With LoRA, a single A5000 is sufficient.

---

*Sources: OpenAI Whisper paper (Radford et al., 2022), FUTO Whisper Training Data Breakdown, HuggingFace Fine-Tune Whisper blog (2022), ACL VarDial 2025 (Torgbi et al.), Timmel et al. 2024 (Swiss German fine-tuning), shraavb/spanish-slang-whisper (HuggingFace), OWSM paper (Jung et al., 2023)*
