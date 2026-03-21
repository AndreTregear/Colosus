# NeMo Guardrails — AI Safety

Slim Docker wrapper for [NVIDIA NeMo Guardrails](https://github.com/NVIDIA/NeMo-Guardrails), the LLM guardrails framework.

## Quick start

```bash
cp .env.example .env
# Add guardrail configs to ./config/
docker compose up -d
```

## Upstream

- **Package:** `nemoguardrails==0.21.0` (PyPI)
- **Source:** https://github.com/NVIDIA/NeMo-Guardrails
- **Docs:** https://docs.nvidia.com/nemo/guardrails/

## Config

Place your Colang guardrail definitions in the `config/` directory. The server mounts this directory and loads all configs at startup.

## Why slim?

We use NeMo Guardrails as a pip-installed service. The full source repo (33MB with examples/benchmarks) was removed — we only need the PyPI package + our guardrail configs.
