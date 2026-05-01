/**
 * Tests for bot/rules-engine.ts — rule matching logic.
 */
import { describe, it, expect } from 'vitest';
import { matchRule } from '../src/bot/rules-engine.js';
import type { Rule } from '../src/shared/types.js';

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 1,
    pattern: 'hello',
    reply: 'Hi there!',
    matchType: 'contains',
    scope: 'all',
    priority: 1,
    enabled: true,
    scopeJid: undefined,
    ...overrides,
  } as Rule;
}

describe('rules-engine', () => {
  describe('matchType: exact', () => {
    it('should match exact text (case-insensitive)', () => {
      const rule = makeRule({ matchType: 'exact', pattern: 'hola' });
      expect(matchRule('hola', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
      expect(matchRule('HOLA', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
      expect(matchRule('Hola', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should not match partial text on exact', () => {
      const rule = makeRule({ matchType: 'exact', pattern: 'hola' });
      expect(matchRule('hola amigo', '51999@s.whatsapp.net', false, [rule])).toBeNull();
    });

    it('should not match empty text', () => {
      const rule = makeRule({ matchType: 'exact', pattern: 'hola' });
      expect(matchRule('', '51999@s.whatsapp.net', false, [rule])).toBeNull();
    });
  });

  describe('matchType: contains', () => {
    it('should match substring', () => {
      const rule = makeRule({ matchType: 'contains', pattern: 'precio' });
      expect(matchRule('cual es el precio?', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should be case-insensitive', () => {
      const rule = makeRule({ matchType: 'contains', pattern: 'menu' });
      expect(matchRule('Dame el MENU', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should not match when substring absent', () => {
      const rule = makeRule({ matchType: 'contains', pattern: 'precio' });
      expect(matchRule('quiero ordenar', '51999@s.whatsapp.net', false, [rule])).toBeNull();
    });
  });

  describe('matchType: regex', () => {
    it('should match regex pattern', () => {
      const rule = makeRule({ matchType: 'regex', pattern: '^hola\\b' });
      expect(matchRule('hola amigo', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should be case-insensitive', () => {
      const rule = makeRule({ matchType: 'regex', pattern: 'pago|yape' });
      expect(matchRule('quiero pagar con YAPE', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should handle invalid regex gracefully', () => {
      const rule = makeRule({ matchType: 'regex', pattern: '[invalid(' });
      expect(matchRule('anything', '51999@s.whatsapp.net', false, [rule])).toBeNull();
    });
  });

  describe('scope filtering', () => {
    it('should skip private-only rule in group', () => {
      const rule = makeRule({ scope: 'private' });
      expect(matchRule('hello', '120363@g.us', true, [rule])).toBeNull();
    });

    it('should match private-only rule in DM', () => {
      const rule = makeRule({ scope: 'private' });
      expect(matchRule('hello', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
    });

    it('should skip group-only rule in DM', () => {
      const rule = makeRule({ scope: 'group' });
      expect(matchRule('hello', '51999@s.whatsapp.net', false, [rule])).toBeNull();
    });

    it('should match group-only rule in group', () => {
      const rule = makeRule({ scope: 'group' });
      expect(matchRule('hello', '120363@g.us', true, [rule])).toBe(rule);
    });

    it('should match all scope everywhere', () => {
      const rule = makeRule({ scope: 'all' });
      expect(matchRule('hello', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
      expect(matchRule('hello', '120363@g.us', true, [rule])).toBe(rule);
    });
  });

  describe('scopeJid filtering', () => {
    it('should match only the specified JID', () => {
      const rule = makeRule({ scopeJid: '51999@s.whatsapp.net' });
      expect(matchRule('hello', '51999@s.whatsapp.net', false, [rule])).toBe(rule);
      expect(matchRule('hello', '51888@s.whatsapp.net', false, [rule])).toBeNull();
    });
  });

  describe('priority ordering', () => {
    it('should return first matching rule (rules are pre-sorted by priority)', () => {
      const rules = [
        makeRule({ id: 1, pattern: 'hi', matchType: 'contains', reply: 'first', priority: 1 }),
        makeRule({ id: 2, pattern: 'hi', matchType: 'contains', reply: 'second', priority: 2 }),
      ];
      const result = matchRule('hi there', '51999@s.whatsapp.net', false, rules);
      expect(result?.reply).toBe('first');
    });
  });

  describe('no match', () => {
    it('should return null when no rules match', () => {
      const rules = [
        makeRule({ pattern: 'foo', matchType: 'exact' }),
        makeRule({ pattern: 'bar', matchType: 'contains' }),
      ];
      expect(matchRule('baz', '51999@s.whatsapp.net', false, rules)).toBeNull();
    });

    it('should return null for empty rules array', () => {
      expect(matchRule('hello', '51999@s.whatsapp.net', false, [])).toBeNull();
    });
  });
});
