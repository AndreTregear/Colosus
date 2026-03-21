import type { Rule } from '../shared/types.js';

export function matchRule(
  text: string,
  jid: string,
  isGroup: boolean,
  rules: Rule[],
): Rule | null {
  for (const rule of rules) {
    // Scope filter
    if (rule.scope === 'private' && isGroup) continue;
    if (rule.scope === 'group' && !isGroup) continue;
    if (rule.scopeJid && rule.scopeJid !== jid) continue;

    // Pattern match
    let matched = false;
    switch (rule.matchType) {
      case 'exact':
        matched = text.toLowerCase() === rule.pattern.toLowerCase();
        break;
      case 'contains':
        matched = text.toLowerCase().includes(rule.pattern.toLowerCase());
        break;
      case 'regex':
        try {
          matched = new RegExp(rule.pattern, 'i').test(text);
        } catch {
          matched = false;
        }
        break;
    }

    if (matched) return rule;
  }
  return null;
}
