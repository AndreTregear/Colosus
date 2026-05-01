// Agente Dashboard — Voice Mode (server-side ASR, works in all browsers)
import { esc, formatTime } from '../shared/api.js';

let recorder = null;
let chunks = [];
let state = 'idle'; // idle | recording | processing | speaking
let currentAudio = null;

export function mount(container) {
  container.innerHTML = `
    <div class="voice-container">
      <div class="voice-status" id="voice-status">
        <div class="voice-avatar">🤖</div>
        <p class="voice-title">Habla con tu Agente</p>
        <p class="voice-subtitle" id="voice-subtitle">Toca el micrófono para comenzar</p>
      </div>

      <div class="voice-transcript" id="voice-transcript"></div>

      <div class="voice-controls">
        <button id="voice-mic" class="voice-mic-btn" aria-label="Hablar">
          <svg class="mic-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="23"/>
            <line x1="8" x2="16" y1="23" y2="23"/>
          </svg>
          <svg class="stop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
          <div class="mic-pulse"></div>
        </button>
        <p class="voice-hint" id="voice-hint">Toca para hablar</p>
      </div>
    </div>
  `;

  document.getElementById('voice-mic').addEventListener('click', handleMicClick);
}

export function unmount() {
  stopRecording();
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
}

function handleMicClick() {
  if (state === 'idle') startRecording();
  else if (state === 'recording') stopRecording();
  else if (state === 'speaking') { currentAudio?.pause(); updateUI('idle'); }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType });
      processAudio(blob);
    };

    recorder.start();
    state = 'recording';
    updateUI('recording');
  } catch (err) {
    addTurn('system', 'No se pudo acceder al micrófono. Permite el acceso en tu navegador.');
  }
}

function stopRecording() {
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
    state = 'processing';
    updateUI('processing');
  }
}

async function processAudio(blob) {
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'voice.webm');

    const res = await fetch('/api/agente/voice', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();

    if (data.transcription) addTurn('user', data.transcription);
    if (data.response) {
      const timingStr = data.timings ? ` (${data.timings.totalMs || data.timings.llmMs || '?'}ms)` : '';
      addTurn('assistant', data.response + timingStr);
    }

    if (data.audio) {
      state = 'speaking';
      updateUI('speaking');
      const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
      currentAudio = new Audio(URL.createObjectURL(audioBlob));
      currentAudio.onended = () => { state = 'idle'; updateUI('idle'); };
      currentAudio.onerror = () => { state = 'idle'; updateUI('idle'); };
      await currentAudio.play().catch(() => { state = 'idle'; updateUI('idle'); });
    } else {
      state = 'idle';
      updateUI('idle');
    }
  } catch (err) {
    addTurn('system', 'Error: ' + err.message);
    state = 'idle';
    updateUI('idle');
  }
}

function updateUI(s) {
  const btn = document.getElementById('voice-mic');
  const hint = document.getElementById('voice-hint');
  const sub = document.getElementById('voice-subtitle');
  const mic = btn?.querySelector('.mic-icon');
  const stop = btn?.querySelector('.stop-icon');
  if (!btn) return;

  btn.classList.remove('listening', 'processing', 'speaking');

  const states = {
    recording: { cls: 'listening', mic: false, stop: true, hint: 'Escuchando... toca para enviar', sub: 'Grabando audio...' },
    processing: { cls: 'processing', mic: true, stop: false, hint: 'Procesando...', sub: 'Transcribiendo y respondiendo...' },
    speaking: { cls: 'speaking', mic: true, stop: false, hint: 'Toca para detener', sub: 'Reproduciendo respuesta...' },
    idle: { cls: '', mic: true, stop: false, hint: 'Toca para hablar', sub: 'Toca el micrófono para comenzar' },
  };

  const cfg = states[s] || states.idle;
  if (cfg.cls) btn.classList.add(cfg.cls);
  if (mic) mic.style.display = cfg.mic ? 'block' : 'none';
  if (stop) stop.style.display = cfg.stop ? 'block' : 'none';
  if (hint) hint.textContent = cfg.hint;
  if (sub) sub.textContent = cfg.sub;
}

function addTurn(role, text) {
  const el = document.getElementById('voice-transcript');
  if (!el) return;
  const label = role === 'user' ? 'Tú' : role === 'assistant' ? 'Agente' : 'Sistema';
  const icon = role === 'user' ? '👤' : role === 'assistant' ? '🤖' : 'ℹ️';
  const div = document.createElement('div');
  div.className = `voice-turn voice-turn-${role}`;
  div.innerHTML = `
    <div class="voice-turn-header">
      <span class="voice-turn-icon">${icon}</span>
      <span class="voice-turn-label">${label}</span>
      <span class="voice-turn-time">${formatTime(new Date())}</span>
    </div>
    <p class="voice-turn-text">${esc(text)}</p>
  `;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function base64ToBlob(b64, type) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}
