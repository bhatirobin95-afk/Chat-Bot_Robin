/* Epax Solar Chat Widget — embed with: <script src="widget.js"></script> */
(function () {
  const BOT_URL = (window.EPAX_BOT_URL || '').replace(/\/$/, '');
  const BRAND = '#1a3a5c';
  const ACCENT = '#f5a623';

  const css = `
    #epax-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${BRAND}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18); transition: transform 0.2s;
    }
    #epax-chat-btn:hover { transform: scale(1.08); }
    #epax-chat-btn svg { width: 26px; height: 26px; fill: white; }
    #epax-chat-badge {
      position: absolute; top: -4px; right: -4px;
      background: ${ACCENT}; color: white; font-size: 10px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif;
    }
    #epax-chat-window {
      position: fixed; bottom: 92px; right: 24px; z-index: 99999;
      width: 360px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex; flex-direction: column; overflow: hidden; max-height: calc(100vh - 110px);
      transition: opacity 0.2s, transform 0.2s;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #epax-chat-window.hidden { opacity: 0; transform: translateY(12px); pointer-events: none; }
    .epax-header {
      background: ${BRAND}; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; color: white;
    }
    .epax-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: ${ACCENT}; display: flex; align-items: center;
      justify-content: center; font-size: 16px; flex-shrink: 0;
    }
    .epax-header-text h4 { font-size: 14px; font-weight: 600; margin: 0; }
    .epax-header-text p { font-size: 11px; opacity: 0.75; margin: 0; }
    .epax-online { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; margin-left: auto; flex-shrink: 0; }
    .epax-close-btn {
      margin-left: 8px; background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.7); font-size: 18px; line-height: 1; padding: 2px 4px;
    }
    .epax-messages {
      flex: 1; overflow-y: auto; padding: 14px; min-height: 120px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f8f8f6; min-height: 120px; max-height: 220px;
    }
    .epax-msg { display: flex; gap: 7px; max-width: 88%; }
    .epax-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .epax-bubble {
      padding: 9px 13px; font-size: 13px; line-height: 1.5;
      border-radius: 4px 14px 14px 14px; color: #222; background: #fff;
      border: 1px solid #e8e8e4;
    }
    .epax-msg.user .epax-bubble {
      background: ${BRAND}; color: white; border: none;
      border-radius: 14px 4px 14px 14px;
    }
    .epax-icon {
      width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 700;
    }
    .epax-msg.bot .epax-icon { background: ${ACCENT}; color: white; }
    .epax-msg.user .epax-icon { background: ${BRAND}; color: white; }
    .epax-typing span {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: #aaa; margin: 0 2px;
      animation: epax-bounce 1.2s infinite;
    }
    .epax-typing span:nth-child(2) { animation-delay: .2s; }
    .epax-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes epax-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .epax-quick-replies {
      display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 12px;
      background: #fff; border-top: 1px solid #eee;
    }
    .epax-qr {
      font-size: 11px; padding: 5px 10px; border-radius: 20px;
      border: 1px solid ${BRAND}; background: transparent; color: ${BRAND};
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .epax-qr:hover { background: ${BRAND}; color: white; }
    .epax-input-row {
      display: flex; gap: 7px; padding: 10px 12px; background: #fff;
      border-top: 1px solid #eee;
    }
    .epax-input {
      flex: 1; padding: 9px 12px; border: 1px solid #ddd; border-radius: 20px;
      font-size: 13px; outline: none; font-family: inherit; color: #222; background: #fafafa;
    }
    .epax-input:focus { border-color: ${BRAND}; }
    .epax-send {
      width: 34px; height: 34px; border-radius: 50%; background: ${BRAND}; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: opacity .15s;
    }
    .epax-send:hover { opacity: .85; }
    .epax-send svg { fill: white; width: 14px; height: 14px; }
    .epax-lead-form {
      padding: 12px 14px; background: #f0f4fa; border-top: 1px solid #dde5f0; overflow-y: auto; max-height: 260px; flex-shrink: 0;
    }
    .epax-lead-form h5 {
      font-size: 11px; font-weight: 600; color: #666; margin: 0 0 8px;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .epax-field {
      width: 100%; padding: 8px 10px; margin-bottom: 6px; font-size: 12px;
      border: 1px solid #cdd6e2; border-radius: 8px; font-family: inherit;
      background: white; color: #222; box-sizing: border-box;
    }
    .epax-field:focus { outline: none; border-color: ${BRAND}; }
    .epax-fields-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .epax-submit {
      width: 100%; padding: 8px; background: ${ACCENT}; color: white;
      border: none; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: opacity .15s;
    }
    .epax-submit:hover { opacity: .9; }
    .epax-success {
      padding: 10px 14px; text-align: center; font-size: 13px;
      color: #166534; background: #dcfce7; border-top: 1px solid #bbf7d0;
    }
    @media (max-width: 420px) {
      #epax-chat-window { width: calc(100vw - 20px); right: 10px; bottom: 80px; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.id = 'epax-chat-btn';
  btn.setAttribute('aria-label', 'Chat with Epax Solar');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    <div id="epax-chat-badge">1</div>`;
  document.body.appendChild(btn);

  const win = document.createElement('div');
  win.id = 'epax-chat-window';
  win.className = 'hidden';
  win.innerHTML = `
    <div class="epax-header">
      <div class="epax-avatar">☀</div>
      <div class="epax-header-text">
        <h4>Epax Solar Assistent</h4>
        <p>PV-Großhandel · Deggendorf</p>
      </div>
      <div class="epax-online"></div>
      <button class="epax-close-btn" id="epax-close">✕</button>
    </div>
    <div class="epax-messages" id="epax-msgs"></div>
    <div class="epax-quick-replies" id="epax-qrs">
      <button class="epax-qr" data-q="Was verkauft Epax Solar?">Produkte</button>
      <button class="epax-qr" data-q="Welche Wechselrichter führen Sie?">Wechselrichter</button>
      <button class="epax-qr" data-q="Ich brauche ein Angebot">Angebot</button>
      <button class="epax-qr" data-q="How do I place an order?">Order</button>
    </div>
    <div class="epax-input-row">
      <input class="epax-input" id="epax-input" placeholder="Frage stellen..." />
      <button class="epax-send" id="epax-send-btn">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
    <div class="epax-lead-form" id="epax-lead-form" style="display:none">
      <h5>Kontakt hinterlassen</h5>
      <div class="epax-fields-2">
        <input class="epax-field" id="epax-name" placeholder="Name *" />
        <input class="epax-field" id="epax-email" placeholder="E-Mail *" type="email"/>
      </div>
      <div class="epax-fields-2">
        <input class="epax-field" id="epax-company" placeholder="Firma" />
        <input class="epax-field" id="epax-phone" placeholder="Telefon" />
      </div>
      <select class="epax-field" id="epax-interest">
        <option value="">Interesse...</option>
        <option>Module</option>
        <option>Wechselrichter</option>
        <option>Batteriespeicher</option>
        <option>Komplettsystem</option>
        <option>E-Mobilität</option>
        <option>Sonstiges</option>
      </select>
      <button class="epax-submit" id="epax-submit">Anfrage senden ☀</button>
    </div>
    <div class="epax-success" id="epax-success" style="display:none">
      ✓ Danke! Unser Team meldet sich bald bei Ihnen.
    </div>`;
  document.body.appendChild(win);

  let open = false;
  let msgCount = 0;
  let leadFormShown = false;
  const history = [];

  function toggleChat() {
    open = !open;
    win.classList.toggle('hidden', !open);
    document.getElementById('epax-chat-badge').style.display = 'none';
    if (open && msgCount === 0) addMsg('Hallo! Willkommen bei Epax Solar – Ihrem PV-Großhändler in Deggendorf. Wie kann ich Ihnen helfen?', 'bot');
  }

  btn.addEventListener('click', toggleChat);
  document.getElementById('epax-close').addEventListener('click', (e) => { e.stopPropagation(); toggleChat(); });

  document.getElementById('epax-qrs').addEventListener('click', e => {
    if (e.target.dataset.q) sendMessage(e.target.dataset.q);
  });

  document.getElementById('epax-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage(e.target.value);
  });
  document.getElementById('epax-send-btn').addEventListener('click', () => {
    sendMessage(document.getElementById('epax-input').value);
  });

  document.getElementById('epax-submit').addEventListener('click', submitLead);

  function addMsg(text, role) {
    const msgs = document.getElementById('epax-msgs');
    const div = document.createElement('div');
    div.className = 'epax-msg ' + role;
    div.innerHTML = `
      <div class="epax-icon">${role === 'bot' ? 'ES' : 'Sie'}</div>
      <div class="epax-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    msgCount++;
    if (msgCount >= 3 && !leadFormShown) {
      leadFormShown = true;
      document.getElementById('epax-lead-form').style.display = 'block';
    }
  }

  function showTyping() {
    const msgs = document.getElementById('epax-msgs');
    const div = document.createElement('div');
    div.className = 'epax-msg bot'; div.id = 'epax-typing';
    div.innerHTML = `<div class="epax-icon">ES</div><div class="epax-bubble epax-typing"><span></span><span></span><span></span></div>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('epax-typing');
    if (t) t.remove();
  }

  async function sendMessage(text) {
    text = (text || '').trim();
    if (!text) return;
    document.getElementById('epax-input').value = '';
    addMsg(text, 'user');
    history.push({ role: 'user', content: text });
    showTyping();

    try {
      const res = await fetch(BOT_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-6) })
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || 'Entschuldigung, etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.';
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
    } catch (e) {
      removeTyping();
      addMsg('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.', 'bot');
    }
  }

  async function submitLead() {
    const name = document.getElementById('epax-name').value.trim();
    const email = document.getElementById('epax-email').value.trim();
    if (!name || !email) { alert('Bitte Name und E-Mail angeben.'); return; }
    try {
      await fetch(BOT_URL + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email,
          company: document.getElementById('epax-company').value,
          phone: document.getElementById('epax-phone').value,
          interest: document.getElementById('epax-interest').value
        })
      });
      document.getElementById('epax-lead-form').style.display = 'none';
      document.getElementById('epax-success').style.display = 'block';
      addMsg(`Danke, ${name}! Ihre Daten wurden gespeichert. Unser Team meldet sich bald.`, 'bot');
    } catch (e) {
      alert('Fehler beim Speichern. Bitte versuchen Sie es später erneut.');
    }
  }
})();
