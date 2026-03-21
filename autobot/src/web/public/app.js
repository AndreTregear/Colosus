const API = '';

// --- State ---
let currentPanel = 'connect';
let messagesPage = 0;
const PAGE_SIZE = 50;

// --- Navigation ---
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = btn.dataset.panel;
    document.getElementById(`panel-${panel}`).classList.add('active');
    currentPanel = panel;
    if (panel === 'rules') loadRules();
    if (panel === 'messages') loadMessages();
  });
});

// --- Status Polling ---
async function pollStatus() {
  try {
    const res = await fetch(`${API}/api/status`);
    const status = await res.json();
    updateStatusUI(status);
  } catch { /* ignore */ }
}

function updateStatusUI(status) {
  const badge = document.getElementById('connection-badge');
  const phone = document.getElementById('phone-number');

  badge.className = 'badge';
  if (status.connection === 'open') {
    badge.textContent = 'Connected';
    badge.classList.add('badge-connected');
  } else if (status.running) {
    badge.textContent = 'Connecting';
    badge.classList.add('badge-connecting');
  } else {
    badge.textContent = 'Disconnected';
    badge.classList.add('badge-disconnected');
  }

  phone.textContent = status.phoneNumber ? `+${status.phoneNumber}` : '';

  // Stats
  document.getElementById('stat-uptime').textContent = formatUptime(status.uptime);
  document.getElementById('stat-messages').textContent = status.messagesHandled;
  document.getElementById('stat-rules').textContent = status.rulesCount;

  // Auto-reply toggle
  document.getElementById('toggle-autoreply').checked = status.autoReplyEnabled;
}

function formatUptime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// --- QR Polling ---
async function pollQR() {
  try {
    const res = await fetch(`${API}/api/qr`);
    const data = await res.json();
    const loading = document.getElementById('qr-loading');
    const img = document.getElementById('qr-image');
    const connected = document.getElementById('qr-connected');

    if (data.status === 'connected') {
      loading.style.display = 'none';
      img.style.display = 'none';
      connected.style.display = 'flex';
    } else if (data.qr) {
      loading.style.display = 'none';
      img.style.display = 'block';
      img.src = data.qr;
      connected.style.display = 'none';
    } else {
      loading.style.display = 'flex';
      img.style.display = 'none';
      connected.style.display = 'none';
    }
  } catch { /* ignore */ }
}

// --- Bot Controls ---
document.getElementById('btn-start').addEventListener('click', async () => {
  await fetch(`${API}/api/status/start`, { method: 'POST' });
});

document.getElementById('btn-stop').addEventListener('click', async () => {
  await fetch(`${API}/api/status/stop`, { method: 'POST' });
});

document.getElementById('toggle-autoreply').addEventListener('change', async (e) => {
  await fetch(`${API}/api/status/toggle-autoreply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: e.target.checked }),
  });
});

// --- Rules ---
async function loadRules() {
  try {
    const res = await fetch(`${API}/api/rules`);
    const rules = await res.json();
    renderRules(rules);
  } catch { /* ignore */ }
}

function renderRules(rules) {
  const tbody = document.getElementById('rules-body');
  if (rules.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No rules yet. Add one to get started!</td></tr>';
    return;
  }
  tbody.innerHTML = rules.map(r => `
    <tr>
      <td>${esc(r.name)}</td>
      <td class="truncate" title="${esc(r.pattern)}">${esc(r.pattern)}</td>
      <td>${r.matchType}</td>
      <td class="truncate" title="${esc(r.reply)}">${esc(r.reply)}</td>
      <td>${r.scope}</td>
      <td>${r.priority}</td>
      <td>
        <input type="checkbox" ${r.enabled ? 'checked' : ''} onchange="toggleRule(${r.id}, this.checked)" style="width:20px;height:14px;">
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editRule(${r.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteRule(${r.id})">Del</button>
      </td>
    </tr>
  `).join('');
}

async function toggleRule(id, enabled) {
  await fetch(`${API}/api/rules/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

async function deleteRule(id) {
  if (!confirm('Delete this rule?')) return;
  await fetch(`${API}/api/rules/${id}`, { method: 'DELETE' });
  loadRules();
}

async function editRule(id) {
  const res = await fetch(`${API}/api/rules/${id}`);
  const rule = await res.json();
  document.getElementById('modal-title').textContent = 'Edit Rule';
  document.getElementById('rule-id').value = rule.id;
  document.getElementById('rule-name').value = rule.name;
  document.getElementById('rule-pattern').value = rule.pattern;
  document.getElementById('rule-match-type').value = rule.matchType;
  document.getElementById('rule-reply').value = rule.reply;
  document.getElementById('rule-scope').value = rule.scope;
  document.getElementById('rule-priority').value = rule.priority;
  document.getElementById('rule-scope-jid').value = rule.scopeJid || '';
  document.getElementById('rule-modal').style.display = 'flex';
}

// Add Rule button
document.getElementById('btn-add-rule').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Add Rule';
  document.getElementById('rule-form').reset();
  document.getElementById('rule-id').value = '';
  document.getElementById('rule-priority').value = '100';
  document.getElementById('rule-modal').style.display = 'flex';
});

// Modal close
document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('rule-modal').style.display = 'none';
});
document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('rule-modal').style.display = 'none';
});

// Save rule
document.getElementById('rule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('rule-id').value;
  const data = {
    name: document.getElementById('rule-name').value,
    pattern: document.getElementById('rule-pattern').value,
    matchType: document.getElementById('rule-match-type').value,
    reply: document.getElementById('rule-reply').value,
    scope: document.getElementById('rule-scope').value,
    priority: Number(document.getElementById('rule-priority').value),
    scopeJid: document.getElementById('rule-scope-jid').value || null,
    enabled: true,
  };

  if (id) {
    await fetch(`${API}/api/rules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } else {
    await fetch(`${API}/api/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  document.getElementById('rule-modal').style.display = 'none';
  loadRules();
});

// --- Messages ---
async function loadMessages() {
  try {
    const res = await fetch(`${API}/api/messages?limit=${PAGE_SIZE}&offset=${messagesPage * PAGE_SIZE}`);
    const data = await res.json();
    renderMessages(data.messages);
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
    document.getElementById('page-info').textContent = `Page ${messagesPage + 1} of ${totalPages}`;
    document.getElementById('btn-prev-page').disabled = messagesPage === 0;
    document.getElementById('btn-next-page').disabled = (messagesPage + 1) >= totalPages;
  } catch { /* ignore */ }
}

function renderMessages(messages) {
  const tbody = document.getElementById('messages-body');
  if (messages.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty">No messages yet.</td></tr>';
    return;
  }
  tbody.innerHTML = messages.map(m => `
    <tr>
      <td>${formatTime(m.timestamp)}</td>
      <td class="truncate" title="${esc(m.jid)}">${esc(m.pushName || m.jid)}</td>
      <td class="${m.direction === 'incoming' ? 'dir-in' : 'dir-out'}">${m.direction === 'incoming' ? 'IN' : 'OUT'}</td>
      <td class="truncate" title="${esc(m.body)}">${esc(m.body)}</td>
      <td>${m.matchedRuleId ?? '-'}</td>
    </tr>
  `).join('');
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

document.getElementById('btn-refresh-messages').addEventListener('click', loadMessages);
document.getElementById('btn-prev-page').addEventListener('click', () => {
  if (messagesPage > 0) { messagesPage--; loadMessages(); }
});
document.getElementById('btn-next-page').addEventListener('click', () => {
  messagesPage++;
  loadMessages();
});

// --- Helpers ---
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// --- Polling loops ---
setInterval(pollStatus, 5000);
setInterval(pollQR, 2000);
pollStatus();
pollQR();
