#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Hermes-RL LoRA Training Script for Yaya Platform
# ═══════════════════════════════════════════════════════════════
#
# Trains a LoRA adapter on conversation trajectories.
# Designed for 2x RTX A5000 (24GB each).
#
# Usage:
#   bash scripts/train-lora.sh                    # Full training
#   bash scripts/train-lora.sh --dry-run          # Validate data only
#   bash scripts/train-lora.sh --output /path     # Custom output dir
#   bash scripts/train-lora.sh --run-id 42        # Custom run ID
#
# Prerequisites:
#   pip install unsloth trl transformers datasets peft accelerate bitsandbytes
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

echo "==============================================="
echo "  Hermes-RL LoRA Training"
echo "==============================================="
echo "  Base model:    $BASE_MODEL"
echo "  Rollout dir:   $ROLLOUT_DIR"
echo "  Output:        $ADAPTER_PATH"
echo "  Run ID:        $RUN_ID"
echo "  LoRA rank:     $LORA_RANK"
echo "  LoRA alpha:    $LORA_ALPHA"
echo "  Batch size:    $BATCH_SIZE x $GRADIENT_ACCUMULATION (eff: $((BATCH_SIZE * GRADIENT_ACCUMULATION)))"
echo "  Epochs:        $NUM_EPOCHS"
echo "  LR:            $LEARNING_RATE"
echo "  Dry run:       $DRY_RUN"
echo "==============================================="

# ── Validate rollout data using Python (reliable counting) ──
ROLLOUT_FILES=$(find "$ROLLOUT_DIR" -name "*.jsonl" 2>/dev/null | sort)
if [ -z "$ROLLOUT_FILES" ]; then
  echo "ERROR: No JSONL files found in $ROLLOUT_DIR"
  exit 1
fi

STATS=$(python3 -c "
import json, os, sys
d = sys.argv[1]
total = pos = neg = 0
for fname in sorted(os.listdir(d)):
    if not fname.endswith('.jsonl'): continue
    fp = os.path.join(d, fname)
    lines = [l for l in open(fp).readlines() if l.strip()]
    p = n = 0
    for l in lines:
        for t in json.loads(l).get('turns', []):
            r = t.get('reward')
            if r == 1: p += 1
            elif r == -1: n += 1
    total += len(lines)
    pos += p; neg += n
    print(f'  {fname}: {len(lines)} trajectories ({p} positive, {n} negative)', file=sys.stderr)
print(f'{total} {pos} {neg}')
" "$ROLLOUT_DIR" 2>&1)

# Last line has the counts, earlier lines are per-file details
echo "$STATS" | head -n -1
COUNTS=$(echo "$STATS" | tail -1)
TOTAL_LINES=$(echo "$COUNTS" | awk '{print $1}')
TOTAL_POSITIVE=$(echo "$COUNTS" | awk '{print $2}')
TOTAL_NEGATIVE=$(echo "$COUNTS" | awk '{print $3}')

echo ""
echo "  Total trajectories: $TOTAL_LINES"
echo "  Total positive turns: $TOTAL_POSITIVE"
echo "  Total negative turns: $TOTAL_NEGATIVE"
echo ""

if [ "$TOTAL_LINES" -lt 10 ]; then
  echo "ERROR: Need at least 10 trajectories for training (got $TOTAL_LINES)"
  exit 1
fi

if [ "$DRY_RUN" = true ]; then
  echo "OK: Dry run passed ($TOTAL_LINES trajectories, $TOTAL_POSITIVE positive, $TOTAL_NEGATIVE negative)"
  exit 0
fi

# ── Create output directory ──
mkdir -p "$ADAPTER_PATH"

# ── Launch training ──
echo "Starting LoRA training..."

python3 << TRAINEOF
import json, os, sys, datetime

rollout_dir = "$ROLLOUT_DIR"
adapter_path = "$ADAPTER_PATH"
base_model = "$BASE_MODEL"

# Load trajectories
print("Loading trajectories...")
trajectories = []
for fname in sorted(os.listdir(rollout_dir)):
    if not fname.endswith(".jsonl"): continue
    with open(os.path.join(rollout_dir, fname)) as f:
        for line in f:
            line = line.strip()
            if not line: continue
            try:
                trajectories.append(json.loads(line))
            except json.JSONDecodeError:
                continue

print(f"Loaded {len(trajectories)} trajectories")

# Convert to chat format (positive examples only for SFT)
train_data = []
for traj in trajectories:
    messages = []
    for turn in traj.get("turns", []):
        messages.append({"role": turn["role"], "content": turn["content"]})
    has_positive = any(t.get("reward", 0) > 0 for t in traj.get("turns", []))
    if has_positive and len(messages) >= 2:
        train_data.append({"messages": messages})

print(f"Prepared {len(train_data)} training conversations")
if len(train_data) < 5:
    print("ERROR: Not enough positive training data")
    sys.exit(1)

# Save training data
data_path = os.path.join(adapter_path, "train_data.json")
with open(data_path, "w") as f:
    json.dump(train_data, f, ensure_ascii=False, indent=2)
print(f"Saved training data to {data_path}")

# Try loading model
try:
    from unsloth import FastLanguageModel
    import torch
    print("Loading model with Unsloth...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=base_model, max_seq_length=$MAX_SEQ_LENGTH,
        dtype=torch.float16, load_in_4bit=True,
    )
    model = FastLanguageModel.get_peft_model(
        model, r=$LORA_RANK, lora_alpha=$LORA_ALPHA,
        lora_dropout=$LORA_DROPOUT, bias="none",
        use_gradient_checkpointing="unsloth", random_state=42,
    )
    print("Unsloth LoRA model ready")
except ImportError:
    print("Unsloth not available, using transformers + peft...")
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, TaskType
    import torch
    bnb = BitsAndBytesConfig(
        load_in_4bit=True, bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True,
    )
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        base_model, quantization_config=bnb, device_map="auto", trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(base_model, trust_remote_code=True)
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM, r=$LORA_RANK, lora_alpha=$LORA_ALPHA,
        lora_dropout=$LORA_DROPOUT,
        target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"],
        bias="none",
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

# Prepare dataset
from datasets import Dataset
dataset = Dataset.from_list(train_data)
print(f"Dataset: {len(dataset)} conversations")

# Train
from trl import SFTTrainer, SFTConfig
sft_config = SFTConfig(
    output_dir=adapter_path, num_train_epochs=$NUM_EPOCHS,
    per_device_train_batch_size=$BATCH_SIZE,
    gradient_accumulation_steps=$GRADIENT_ACCUMULATION,
    learning_rate=$LEARNING_RATE, lr_scheduler_type="cosine",
    warmup_steps=10, weight_decay=0.01, logging_steps=5,
    save_strategy="epoch", bf16=False, fp16=True,
    max_seq_length=$MAX_SEQ_LENGTH, optim="paged_adamw_8bit",
    max_grad_norm=0.3, seed=42,
)
trainer = SFTTrainer(model=model, tokenizer=tokenizer, train_dataset=dataset, args=sft_config)

print("Training started...")
trainer.train()

# Save
model.save_pretrained(adapter_path)
tokenizer.save_pretrained(adapter_path)
print(f"LoRA adapter saved to {adapter_path}")

meta = {
    "run_id": "$RUN_ID", "base_model": base_model,
    "adapter_path": adapter_path, "trajectories": len(trajectories),
    "train_conversations": len(train_data),
    "lora_rank": $LORA_RANK, "lora_alpha": $LORA_ALPHA,
    "completed_at": datetime.datetime.now().isoformat(),
}
with open(os.path.join(adapter_path, "training_meta.json"), "w") as f:
    json.dump(meta, f, indent=2)
print("Training complete!")
TRAINEOF

echo ""
echo "==============================================="
echo "  Training complete!"
echo "  Adapter: $ADAPTER_PATH"
echo "==============================================="
