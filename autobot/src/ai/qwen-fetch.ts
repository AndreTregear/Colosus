/**
 * Fetch wrapper that injects `chat_template_kwargs.enable_thinking = false`
 * into chat-completion request bodies for the Qwen3.6 hybrid model. Without
 * this flag the model spends all completion tokens on `reasoning_content` and
 * returns `content: null`, which times out every agent call.
 */
export const qwenNoThinkFetch: typeof fetch = async (input, init) => {
  if (init?.method === 'POST' && typeof init.body === 'string') {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('/chat/completions')) {
      try {
        const body = JSON.parse(init.body);
        body.chat_template_kwargs = { ...body.chat_template_kwargs, enable_thinking: false };
        init = { ...init, body: JSON.stringify(body) };
      } catch {
        // body wasn't JSON — pass through unchanged
      }
    }
  }
  return fetch(input as Parameters<typeof fetch>[0], init);
};
