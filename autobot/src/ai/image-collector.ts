/**
 * Scan Mastra agent step results for send_product_image tool calls
 * and collect image metadata for the queue worker to send via WhatsApp.
 *
 * Mastra LLMStepResult.toolResults is ToolResultChunk[] where each chunk is:
 *   { type: 'tool-result', payload: { toolName: string, result: unknown } }
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collectImageResults(steps: any[]): Array<{ imagePath: string; caption: string }> {
  const images: Array<{ imagePath: string; caption: string }> = [];

  for (const step of steps) {
    const toolResults = step.toolResults ?? [];
    for (const chunk of toolResults) {
      // Mastra ToolResultChunk: { type: 'tool-result', payload: { toolName, result } }
      const toolName = chunk.payload?.toolName ?? chunk.toolName ?? chunk.name;
      const rawResult = chunk.payload?.result ?? chunk.result ?? chunk.output;

      if (toolName === 'send_product_image' && rawResult != null) {
        try {
          const content = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
          const data = JSON.parse(content);
          if (data.sendImage && data.imagePath) {
            images.push({ imagePath: data.imagePath, caption: data.caption || '' });
          }
        } catch {
          // Not parseable or missing fields — skip
        }
      }
    }
  }

  return images;
}
