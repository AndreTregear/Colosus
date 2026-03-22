// Yaya Platform — Agent Chat Page (with WhatsApp QR + status)
import { apiFetch, apiGet, apiPost, esc, formatTime, getToken } from '../shared/api.js';

let loaded = false;
let waStatus = { status: 'disconnected', phoneNumber: null };
let qrPollTimer = null;

export function mount(container) {
  container.innerHTML = `
    <!-- WhatsApp Connection Panel -->
    <div id="wa-panel" class="wa-panel">
      <div class="wa-panel-header">
        <div class="wa-status-row">
          <span class="wa-status-dot" id="wa-dot"></span>
          <span id="wa-status-text">Desconectado</span>
          <span id="wa-phone" class="wa-phone"></span>
        </div>
      </div>

      <div id="wa-qr-section" class="wa-qr-section">
        <div class="wa-qr-placeholder" id="wa-qr-placeholder">
          <div class="wa-qr-icon">📱</div>
          <h3>Conecta tu WhatsApp</h3>
          <p>Conecta tu número de WhatsApp para que Yaya pueda responder a tus clientes automáticamente.</p>
          <button class="btn btn-primary" id="btn-wa-connect">Conectar WhatsApp</button>
        </div>
        <div class="wa-qr-display hidden" id="wa-qr-display">
          <p class="wa-qr-label">Escanea con WhatsApp para conectar</p>
          <img id="wa-qr-img" class="wa-qr-img" alt="QR Code" />
          <p class="wa-qr-hint">Abre WhatsApp → Menú → Dispositivos vinculados → Vincular dispositivo</p>
        </div>
      </div>

      <div id="wa-connected-bar" class="wa-connected-bar hidden">
        <span>✅ WhatsApp conectado</span>
        <button class="btn btn-sm btn-danger" id="btn-wa-disconnect">Desconectar</button>
      </div>
    </div>

    <!-- WhatsApp Messages Feed -->
    <div id="wa-messages-section" class="wa-messages-section hidden">
      <div class="wa-messages-header">
        <h4>💬 Mensajes WhatsApp</h4>
        <span class="wa-msg-count" id="wa-msg-count"></span>
      </div>
      <div class="wa-messages-list" id="wa-messages-list"></div>
    </div>

    <!-- Agent Chat (always visible) -->
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-avatar">🤖</div>
        <div class="chat-info">
          <h3>Yaya — Tu Asistente</h3>
          <p>Pregúntame sobre tu negocio</p>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        <div class="chat-bubble assistant">
          ¡Hola! Soy Yaya, tu asistente de negocio. 🧡<br>
          Puedo ayudarte con ventas, gastos, pedidos y más. ¿En qué te puedo ayudar?
          <span class="time">${formatTime(new Date())}</span>
        </div>
      </div>

      <div class="chat-typing" id="chat-typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>

      <div class="chat-quick-actions">
        <button class="quick-action-btn" data-msg="Dame el resumen del día">📋 Resumen del día</button>
        <button class="quick-action-btn" data-msg="¿Cuánto gané hoy?">💰 ¿Cuánto gané?</button>
        <button class="quick-action-btn" data-msg="¿Hay pagos pendientes?">⏳ Pagos pendientes</button>
        <button class="quick-action-btn" data-msg="¿Cuáles son mis productos más vendidos?">🏆 Top productos</button>
      </div>

      <div class="chat-input-area">
        <textarea id="chat-input" class="chat-input" placeholder="Escribe tu mensaje..." rows="1"></textarea>
        <button id="chat-send" class="chat-send" title="Enviar">➤</button>
      </div>
    </div>
  `;

  setupChat();
  setupWA();
  if (!loaded) {
    loadHistory();
    loaded = true;
  }
  checkWaStatus();
}

export function unmount() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer);
    qrPollTimer = null;
  }
}

// ── WhatsApp connection management ────────────────────────

async function checkWaStatus() {
  try {
    const data = await apiGet('/whatsapp/status');
    updateWaUI(data);
  } catch { /* not connected */ }
}

function updateWaUI(data) {
  waStatus = data;
  const dot = document.getElementById('wa-dot');
  const text = document.getElementById('wa-status-text');
  const phone = document.getElementById('wa-phone');
  const qrSection = document.getElementById('wa-qr-section');
  const connectedBar = document.getElementById('wa-connected-bar');
  const msgSection = document.getElementById('wa-messages-section');

  if (!dot) return;

  // Status dot color
  dot.className = 'wa-status-dot';
  if (data.status === 'connected') {
    dot.classList.add('connected');
    text.textContent = 'Conectado';
    phone.textContent = data.phoneNumber ? `+${data.phoneNumber}` : '';
    qrSection.classList.add('hidden');
    connectedBar.classList.remove('hidden');
    msgSection.classList.remove('hidden');
    loadWaMessages();
    stopQrPoll();
  } else if (data.status === 'connecting') {
    dot.classList.add('connecting');
    text.textContent = 'Conectando...';
    phone.textContent = '';
    connectedBar.classList.add('hidden');
    msgSection.classList.add('hidden');
  } else {
    dot.classList.add('disconnected');
    text.textContent = 'Desconectado';
    phone.textContent = '';
    qrSection.classList.remove('hidden');
    connectedBar.classList.add('hidden');
    msgSection.classList.add('hidden');
    stopQrPoll();
    // Show connect button, hide QR
    document.getElementById('wa-qr-placeholder')?.classList.remove('hidden');
    document.getElementById('wa-qr-display')?.classList.add('hidden');
  }
}

function setupWA() {
  document.getElementById('btn-wa-connect')?.addEventListener('click', connectWA);
  document.getElementById('btn-wa-disconnect')?.addEventListener('click', disconnectWA);
}

async function connectWA() {
  try {
    document.getElementById('btn-wa-connect').disabled = true;
    document.getElementById('btn-wa-connect').textContent = 'Conectando...';
    await apiPost('/whatsapp/connect', {});

    // Start polling for QR
    document.getElementById('wa-qr-placeholder')?.classList.add('hidden');
    document.getElementById('wa-qr-display')?.classList.remove('hidden');
    startQrPoll();
  } catch (err) {
    document.getElementById('btn-wa-connect').disabled = false;
    document.getElementById('btn-wa-connect').textContent = 'Conectar WhatsApp';
    console.error('WA connect error:', err);
  }
}

async function disconnectWA() {
  try {
    await apiPost('/whatsapp/disconnect', {});
    updateWaUI({ status: 'disconnected', phoneNumber: null });
  } catch (err) {
    console.error('WA disconnect error:', err);
  }
}

function startQrPoll() {
  stopQrPoll();
  pollQR(); // immediate first poll
  qrPollTimer = setInterval(pollQR, 2000);
}

function stopQrPoll() {
  if (qrPollTimer) {
    clearInterval(qrPollTimer);
    qrPollTimer = null;
  }
}

async function pollQR() {
  try {
    const data = await apiGet('/whatsapp/qr');
    if (data.qr) {
      const img = document.getElementById('wa-qr-img');
      if (img) img.src = data.qr;
      document.getElementById('wa-qr-placeholder')?.classList.add('hidden');
      document.getElementById('wa-qr-display')?.classList.remove('hidden');
    } else if (data.status === 'connected') {
      stopQrPoll();
      checkWaStatus();
    }
  } catch { /* ignore */ }
}

async function loadWaMessages() {
  try {
    const data = await apiGet('/whatsapp/messages?limit=30');
    const list = document.getElementById('wa-messages-list');
    const count = document.getElementById('wa-msg-count');
    if (!list) return;

    const messages = data.data || [];
    count.textContent = `${messages.length} mensajes`;

    list.innerHTML = messages.map(m => `
      <div class="wa-msg ${m.from_me ? 'wa-msg-out' : 'wa-msg-in'}">
        <div class="wa-msg-name">${esc(m.from_me ? 'Yaya' : m.contact_name)}</div>
        <div class="wa-msg-text">${esc(m.content)}</div>
        <div class="wa-msg-time">${formatTime(m.created_at)}</div>
      </div>
    `).join('');

    list.scrollTop = list.scrollHeight;
  } catch { /* no messages */ }
}

// Called from app.js SSE handler
export function onWaMessage(msg) {
  const list = document.getElementById('wa-messages-list');
  if (!list) return;

  const div = document.createElement('div');
  div.className = `wa-msg ${msg.from_me ? 'wa-msg-out' : 'wa-msg-in'}`;
  div.innerHTML = `
    <div class="wa-msg-name">${esc(msg.from_me ? 'Yaya' : msg.contact_name)}</div>
    <div class="wa-msg-text">${esc(msg.content)}</div>
    <div class="wa-msg-time">${formatTime(msg.created_at)}</div>
  `;
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;

  // Update count
  const count = document.getElementById('wa-msg-count');
  if (count) {
    const n = list.children.length;
    count.textContent = `${n} mensajes`;
  }
}

export function onWaStatusChange(data) {
  updateWaUI(data);
}

// ── Agent Chat ────────────────────────────────────────────

function setupChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  sendBtn.addEventListener('click', () => sendMessage());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  // Quick action buttons
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.msg;
      if (msg) {
        input.value = msg;
        sendMessage();
      }
    });
  });
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  addBubble('user', text);
  showTyping(true);

  try {
    // Try streaming first
    const token = getToken();
    const res = await fetch('/api/v1/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // SSE streaming
      showTyping(false);
      const bubbleEl = addBubble('assistant', '');
      const contentEl = bubbleEl.querySelector('.bubble-text');
      let fullText = '';

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullText += data.content;
              contentEl.textContent = fullText;
              scrollToBottom();
            }
          } catch { /* skip non-JSON lines */ }
        }
      }
      if (!fullText) contentEl.textContent = '(Sin respuesta)';
    } else {
      // Regular JSON response
      const data = await res.json();
      showTyping(false);
      addBubble('assistant', data.content || data.message || '(Sin respuesta)');
    }
  } catch (err) {
    showTyping(false);
    addBubble('assistant', 'Error: ' + err.message);
  }
}

function addBubble(role, text) {
  const messages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = `<span class="bubble-text">${esc(text)}</span><span class="time">${formatTime(new Date())}</span>`;
  messages.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function showTyping(show) {
  const el = document.getElementById('chat-typing');
  if (el) el.classList.toggle('active', show);
  if (show) scrollToBottom();
}

function scrollToBottom() {
  const messages = document.getElementById('chat-messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

async function loadHistory() {
  try {
    const data = await apiGet('/agent/history?limit=50&offset=0');
    const messages = data.messages || data || [];
    if (!messages.length) return;

    const container = document.getElementById('chat-messages');
    // Keep the welcome message, add history before it
    const welcome = container.firstElementChild;

    messages.reverse().forEach(msg => {
      if (msg.role === 'tool') return;
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`;
      bubble.innerHTML = `<span class="bubble-text">${esc(msg.content)}</span><span class="time">${formatTime(msg.created_at)}</span>`;
      container.insertBefore(bubble, welcome);
    });

    scrollToBottom();
  } catch { /* no history yet */ }
}
