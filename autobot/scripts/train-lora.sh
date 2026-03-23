#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# OpenClaw-RL LoRA Training Script for Yaya Platform
# ═══════════════════════════════════════════════════════════════
#
# Trains a LoRA adapter on conversation trajectories using GRPO.
# Designed for 2× RTX A5000 (24GB each).
#
# Usage:
#   bash scripts/train-lora.sh                    # Full training
#   bash scripts/train-lora.sh --dry-run          # Validate data only
#   bash scripts/train-lora.sh --output /path     # Custom output dir
#   bash scripts/train-lora.sh --run-id 42        # Custom run ID
#
# Prerequisites:
#   pip install unsloth trl transformers datasets peft accelerate
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Config ──
BASE_MODEL="${RL_BASE_MODEL:-Qwen/Qwen3.5-27B-AWQ}"
ROLLOUT_DIR="${RL_ROLLOUT_DIR:-/tmp/rl-rollouts}"
OUTPUT_DIR="${RL_OUTPUT_DIR:-/tmp/rl-adapters}"
RUN_ID="${RL_RUN_ID:-$(date +%s)}"
DRY_RUN=false
LORA_RANK=16
LORA_ALPHA=32
LORA_DROPOUT=0.05
LEARNING_RATE="2e-4"
NUM_EPOCHS=1
BATCH_SIZE=2
MAX_SEQ_LENGTH=2048
GRADIENT_ACCUMULATION=4

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run) DRY_RUN=true; shift ;;
    --output) OUTPUT_DIR="$2"; shift 2 ;;
    --run-id) RUN_ID="$2"; shift 2 ;;
    --base-model) BASE_MODEL="$2"; shift 2 ;;
    --rollout-dir) ROLLOUT_DIR="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

ADAPTER_PATH="$OUTPUT_DIR/run-$RUN_ID"

echo "═══════════════════════════════════════════════"
echo "  OpenClaw-RL LoRA Training"
echo "═══════════════════════════════════════════════"
echo "  Base model:    $BASE_MODEL"
echo "  Rollout dir:   $ROLLOUT_DIR"
echo "  Output:        $ADAPTER_PATH"
echo "  Run ID:        $RUN_ID"
echo "  LoRA rank:     $LORA_RANK"
echo "  LoRA alpha:    $LORA_ALPHA"
echo "  Batch size:    $BATCH_SIZE × $GRADIENT_ACCUMULATION (eff: $((BATCH_SIZE * GRADIENT_ACCUMULATION)))"
echo "  Epochs:        $NUM_EPOCHS"
echo "  LR:            $LEARNING_RATE"
echo "  Dry run:       $DRY_RUN"
echo "═══════════════════════════════════════════════"

# ── Validate rollout data ──
ROLLOUT_FILES=$(find "$ROLLOUT_DIR" -name "*.jsonl" 2>/dev/null | sort)
if [ -z "$ROLLOUT_FILES" ]; then
  echo "❌ No JSONL files found in $ROLLOUT_DIR"
  exit 1
fi

TOTAL_LINES=0
TOTAL_POSITIVE=0
TOTAL_NEGATIVE=0
for f in $ROLLOUT_FILES; do
  LINES=$(wc -l < "$f")
  POS=$(grep -c '"reward":1' "$f" 2>/dev/null || echo 0)
  NEG=$(grep -c '"reward":-1' "$f" 2>/dev/null || echo 0)
  TOTAL_LINES=$((TOTAL_LINES + LINES))
  TOTAL_POSITIVE=$((TOTAL_POSITIVE + POS))
  TOTAL_NEGATIVE=$((TOTAL_NEGATIVE + NEG))
  echo "  📄 $f: $LINES trajectories ($POS positive, $NEG negative)"
done

echo ""
echo "  Total trajectories: $TOTAL_LINES"
echo "  Total positive turns: $TOTAL_POSITIVE"
echo "  Total negative turns: $TOTAL_NEGATIVE"
echo ""

if [ "$TOTAL_LINES" -lt 10 ]; then
  echo "❌ Need at least 10 trajectories for training (got $TOTAL_LINES)"
  exit 1
fi

if [ "$DRY_RUN" = true ]; then
  echo "✅ Dry run: data validation passed ($TOTAL_LINES trajectories)"
  echo "   Run without --dry-run to start training."
  exit 0
fi

# ── Create output directory ──
mkdir -p "$ADAPTER_PATH"

# ── Launch training ──
echo "🚀 Starting LoRA training..."

python3 -c "
import json
import os
import sys

# ── Load and convert trajectories to chat format ──
rollout_dir = '$ROLLOUT_DIR'
adapter_path = '$ADAPTER_PATH'
base_model = '$BASE_MODEL'

print('Loading trajectories...')
trajectories = []
for fname in sorted(os.listdir(rollout_dir)):
    if not fname.endswith('.jsonl'):
        continue
    with open(os.path.join(rollout_dir, fname)) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                traj = json.loads(line)
                trajectories.append(traj)
            except json.JSONDecodeError:
                continue

print(f'Loaded {len(trajectories)} trajectories')

# Convert to SFT chat format (positive examples only for SFT phase)
# For GRPO, we'd need the full reward signals, but SFT is the first step
train_data = []
for traj in trajectories:
    messages = []
    for turn in traj.get('turns', []):
        role = turn.get('role', 'user')
        content = turn.get('content', '')
        reward = turn.get('reward')
        
        # For SFT: only include turns from positive conversations
        messages.append({'role': role, 'content': content})
    
    # Only use trajectories with at least one positive reward
    has_positive = any(t.get('reward', 0) > 0 for t in traj.get('turns', []))
    if has_positive and len(messages) >= 2:
        train_data.append({'messages': messages})

print(f'Prepared {len(train_data)} training conversations')

if len(train_data) < 5:
    print('❌ Not enough positive training data')
    sys.exit(1)

# Save as JSON for the trainer
data_path = os.path.join(adapter_path, 'train_data.json')
with open(data_path, 'w') as f:
    json.dump(train_data, f, ensure_ascii=False, indent=2)
print(f'Saved training data to {data_path}')

# ── Try Unsloth (fast) or fall back to standard HF ──
try:
    from unsloth import FastLanguageModel
    import torch
    
    print('Loading model with Unsloth...')
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model,
        max_seq_length=$MAX_SEQ_LENGTH,
        dtype=torch.float16,
        load_in_4bit=True,
    )
    
    model = FastLanguageModel.get_peft_model(
        model,
        r=$LORA_RANK,
        lora_alpha=$LORA_ALPHA,
        lora_dropout=$LORA_DROPOUT,
        bias='none',
        use_gradient_checkpointing='unsloth',
        random_state=42,
    )
    
    print('Model loaded with Unsloth LoRA')
    USE_UNSLOTH = True

except ImportError:
    print('Unsloth not available, using standard transformers + peft...')
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, TaskType
    import torch
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type='nf4',
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )
    
    print('Loading model...')
    model = AutoModelForCausalLM.from_pretrained(
        base_model,
        quantization_config=bnb_config,
        device_map='auto',
        trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=$LORA_RANK,
        lora_alpha=$LORA_ALPHA,
        lora_dropout=$LORA_DROPOUT,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
        bias='none',
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    USE_UNSLOTH = False

# ── Prepare dataset ──
from datasets import Dataset

dataset = Dataset.from_list(train_data)
print(f'Dataset: {len(dataset)} conversations')

# ── Train with SFT first (then GRPO in future iterations) ──
from trl import SFTTrainer, SFTConfig

sft_config = SFTConfig(
    output_dir=adapter_path,
    num_train_epochs=$NUM_EPOCHS,
    per_device_train_batch_size=$BATCH_SIZE,
    gradient_accumulation_steps=$GRADIENT_ACCUMULATION,
    learning_rate=$LEARNING_RATE,
    lr_scheduler_type='cosine',
    warmup_steps=10,
    weight_decay=0.01,
    logging_steps=5,
    save_strategy='epoch',
    bf16=False,
    fp16=True,
    max_seq_length=$MAX_SEQ_LENGTH,
    optim='paged_adamw_8bit',
    max_grad_norm=0.3,
    seed=42,
)

trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    args=sft_config,
)

print('Starting training...')
trainer.train()

# ── Save adapter ──
model.save_pretrained(adapter_path)
tokenizer.save_pretrained(adapter_path)
print(f'✅ LoRA adapter saved to {adapter_path}')

# Save training metadata
import datetime
meta = {
    'run_id': '$RUN_ID',
    'base_model': base_model,
    'adapter_path': adapter_path,
    'trajectories': len(trajectories),
    'train_conversations': len(train_data),
    'lora_rank': $LORA_RANK,
    'lora_alpha': $LORA_ALPHA,
    'completed_at': datetime.datetime.now().isoformat(),
}
with open(os.path.join(adapter_path, 'training_meta.json'), 'w') as f:
    json.dump(meta, f, indent=2)
print(f'Training metadata saved')
"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Training complete!"
echo "  Adapter: $ADAPTER_PATH"
echo "═══════════════════════════════════════════════"
