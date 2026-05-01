/**
 * Sanitize text for TTS — strip formatting that would be read literally.
 *
 * KEEP: periods, commas, question marks, exclamation marks, colons, semicolons,
 *       numbers, decimals (3.5), hyphens in words, quotes for emphasis.
 * STRIP: markdown (*bold*, #headers, `code`, [links]), emoji, HTML tags.
 */

export function sanitizeForTTS(text: string): string {
  return (
    text
      // Remove markdown bold/italic: **text** → text, *text* → text
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/_{1,2}(.*?)_{1,2}/g, '$1')

      // Remove markdown headers: ## Header → Header
      .replace(/^#{1,6}\s+/gm, '')

      // Remove markdown code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]*)`/g, '$1')

      // Remove markdown links: [text](url) → text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

      // Remove markdown images: ![alt](url) → alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')

      // Remove markdown list markers at start of line (but NOT "3.5" mid-sentence)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+(?=[A-ZÁÉÍÓÚa-záéíóú])/gm, '')

      // Remove markdown horizontal rules: --- or ***
      .replace(/^[-*_]{3,}$/gm, '')

      // Remove markdown blockquotes: > text → text
      .replace(/^>\s+/gm, '')

      // Remove HTML tags
      .replace(/<[^>]+>/g, '')

      // Remove only formatting characters (NOT periods, commas, colons, etc.)
      .replace(/[*_~`#|\\[\]{}<>]/g, '')

      // Remove emoji
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '')

      // Clean up whitespace
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}
