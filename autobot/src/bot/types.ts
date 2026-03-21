import type { WASocket } from '@whiskeysockets/baileys';

export interface BotInstance {
  socket: WASocket | null;
  status: 'stopped' | 'connecting' | 'connected';
  autoReplyEnabled: boolean;
  startedAt: Date | null;
  messagesHandled: number;
}
