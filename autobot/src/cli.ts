import { Command } from 'commander';
import { createWebServer } from './web/server.js';
import { startBot, stopBot } from './bot/connection.js';
import * as rulesRepo from './db/pg-rules-repo.js';
import * as messagesRepo from './db/pg-messages-repo.js';
import { WEB_PORT } from './config.js';

const program = new Command();

// Single-tenant mode uses a default tenant ID
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

program
  .name('autobot')
  .description('WhatsApp auto-reply bot')
  .version('1.0.0');

program
  .command('start')
  .description('Start the bot and web dashboard')
  .option('-p, --port <number>', 'Dashboard port', String(WEB_PORT))
  .option('--no-dashboard', 'Start bot without web dashboard')
  .action(async (opts) => {
    if (opts.dashboard) {
      createWebServer(Number(opts.port));
    }
    await startBot();

    // Graceful shutdown
    const shutdown = () => {
      stopBot().then(() => {
        process.exit(0);
      }).catch(() => process.exit(1));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  });

// --- Rules subcommands ---
const rules = program.command('rules').description('Manage auto-reply rules');

rules
  .command('list')
  .description('List all rules')
  .action(async () => {
    const allRules = await rulesRepo.getAllRules(DEFAULT_TENANT_ID);
    if (allRules.length === 0) {
      console.log('No rules configured. Add one with: autobot rules add');
      return;
    }
    console.table(allRules.map(r => ({
      ID: r.id,
      Name: r.name,
      Pattern: r.pattern,
      Type: r.matchType,
      Reply: r.reply.length > 40 ? r.reply.substring(0, 40) + '...' : r.reply,
      Scope: r.scope,
      Priority: r.priority,
      Enabled: r.enabled ? 'Yes' : 'No',
    })));
  });

rules
  .command('add')
  .description('Add a new auto-reply rule')
  .requiredOption('-n, --name <name>', 'Rule name')
  .requiredOption('-p, --pattern <pattern>', 'Match pattern')
  .requiredOption('-r, --reply <text>', 'Reply text')
  .option('-t, --type <type>', 'Match type: exact|contains|regex', 'contains')
  .option('-s, --scope <scope>', 'Scope: all|private|group', 'all')
  .option('--priority <n>', 'Priority (lower = higher)', '100')
  .action(async (opts) => {
    if (opts.type === 'regex') {
      try {
        new RegExp(opts.pattern);
      } catch (e) {
        console.error(`Invalid regex pattern: ${(e as Error).message}`);
        return;
      }
    }

    const rule = await rulesRepo.createRule(DEFAULT_TENANT_ID, {
      name: opts.name,
      pattern: opts.pattern,
      reply: opts.reply,
      matchType: opts.type,
      scope: opts.scope,
      scopeJid: null,
      enabled: true,
      priority: Number(opts.priority),
    });
    console.log(`Rule created with ID ${rule.id}`);
  });

rules
  .command('remove')
  .description('Remove a rule by ID')
  .argument('<id>', 'Rule ID')
  .action(async (id) => {
    const deleted = await rulesRepo.deleteRule(DEFAULT_TENANT_ID, Number(id));
    if (deleted) {
      console.log(`Rule ${id} deleted.`);
    } else {
      console.error(`Rule ${id} not found.`);
    }
  });

rules
  .command('toggle')
  .description('Enable/disable a rule')
  .argument('<id>', 'Rule ID')
  .action(async (id) => {
    const rule = await rulesRepo.getRuleById(DEFAULT_TENANT_ID, Number(id));
    if (!rule) {
      console.error('Rule not found');
      return;
    }
    await rulesRepo.updateRule(DEFAULT_TENANT_ID, rule.id, { enabled: !rule.enabled });
    console.log(`Rule ${id} is now ${rule.enabled ? 'disabled' : 'enabled'}.`);
  });

// --- Logs ---
program
  .command('logs')
  .description('View recent message log')
  .option('-n, --count <number>', 'Number of entries', '20')
  .action(async (opts) => {
    const { conversations } = await messagesRepo.getConversationList(DEFAULT_TENANT_ID, Number(opts.count), 0);
    if (conversations.length === 0) {
      console.log('No messages logged yet.');
      return;
    }
    console.table(conversations.map(c => ({
      Time: c.lastMessageAt,
      JID: c.jid.substring(0, 20),
      Dir: c.lastMessageDirection,
      Body: c.lastMessage.length > 50 ? c.lastMessage.substring(0, 50) + '...' : c.lastMessage,
      Unread: c.unreadCount,
    })));
  });

program.parse();
