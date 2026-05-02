export interface ModelConfig {
  id: string
  name: string
  apiBase: string
  apiKey: string
  model: string
  tag: 'local' | 'hpc'
}

export const MODELS: ModelConfig[] = [
  {
    id: 'qwen3.5-35b-a3b-local',
    name: 'Qwen 3.5 35B-A3B (Local)',
    apiBase: process.env.YAYA_LLM_URL || process.env.VLLM_API_BASE || 'http://localhost:8000/v1',
    apiKey: process.env.YAYA_LLM_KEY || process.env.VLLM_API_KEY || 'welcometothepresent',
    model: process.env.YAYA_LLM_MODEL || process.env.VLLM_MODEL || 'cyankiwi/Qwen3.6-35B-A3B-AWQ-4bit',
    tag: 'local',
  },
  {
    id: 'qwen3.5-122b-hpc',
    name: 'Qwen 3.5 122B (HPC)',
    apiBase: process.env.HPC_GPU1_URL || 'http://localhost:18080/v1',
    apiKey: process.env.HPC_API_KEY || '',
    model: 'qwen3.5-122b',
    tag: 'hpc',
  },
]

export const DEFAULT_MODEL_ID = 'qwen3.5-35b-a3b-local'

/** Quick check — can we reach this model endpoint? */
async function isReachable(m: ModelConfig): Promise<boolean> {
  try {
    const c = new AbortController()
    const t = setTimeout(() => c.abort(), 2000)
    const r = await fetch(`${m.apiBase}/models`, {
      headers: m.apiKey ? { Authorization: `Bearer ${m.apiKey}` } : {},
      signal: c.signal,
    })
    clearTimeout(t)
    return r.ok
  } catch {
    return false
  }
}

/**
 * Auto-select the best available model.
 *   hint = 'fast'  → local first (for voice, quick responses)
 *   hint = 'smart' → HPC first (for complex tasks, deep analysis)
 *   hint = model ID → try that specific model first
 * Always falls back to whatever is reachable.
 */
export async function pickModel(hint: 'fast' | 'smart' | string = 'fast'): Promise<ModelConfig> {
  const local = MODELS.find(m => m.tag === 'local')!
  const hpc = MODELS.find(m => m.tag === 'hpc')!

  // Specific model requested
  if (hint !== 'fast' && hint !== 'smart') {
    const specific = MODELS.find(m => m.id === hint)
    if (specific && await isReachable(specific)) return specific
  }

  if (hint === 'smart') {
    // Prefer HPC for quality, fall back to local
    if (await isReachable(hpc)) return hpc
    return local
  }

  // 'fast' — prefer local (lower latency), fall back to HPC
  if (await isReachable(local)) return local
  if (await isReachable(hpc)) return hpc
  return local // return local anyway, let the caller handle errors
}
