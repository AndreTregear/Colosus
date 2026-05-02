// Yaya Dashboard — Agent Chat Page (Hermes via merchant-ai)
import { esc, formatTime } from '../shared/api.js';

let loaded = false;

export function mount(container) {
  container.innerHTML = `
    <!-- Agent Chat -->
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
}

export function unmount() {}

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
    // Call autobot's merchant-ai chat endpoint (routes through Hermes)
    const res = await fetch('/api/merchant-ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const data = await res.json();
    showTyping(false);
    addBubble('assistant', data.reply || data.content || data.message || '(Sin respuesta)');
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
