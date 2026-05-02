-- RL Training metadata (Hermes-RL pipeline)

-- Training run history — one row per LoRA fine-tuning job
CREATE TABLE IF NOT EXISTS rl_training_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',
    trajectories_count INT NOT NULL DEFAULT 0,
    adapter_path TEXT,
    base_model TEXT,
    metrics JSONB DEFAULT '{}',
    error TEXT
);

-- A/B tests — compare candidate LoRA adapters against current production
CREATE TABLE IF NOT EXISTS rl_ab_tests (
    id SERIAL PRIMARY KEY,
    base_adapter TEXT NOT NULL,
    candidate_adapter TEXT NOT NULL,
    traffic_split NUMERIC(3,2) NOT NULL DEFAULT 0.10,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',
    base_metrics JSONB DEFAULT '{}',
    candidate_metrics JSONB DEFAULT '{}',
    result TEXT
);
