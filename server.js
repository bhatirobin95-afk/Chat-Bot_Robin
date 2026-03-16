const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Config ──────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'epax2024';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const DATA_FILE = path.join(__dirname, 'data', 'leads.json');
const SESSIONS_FILE = path.join(__dirname, 'data', 'sessions.json');
const PORT = process.env.PORT || 3000;

// ── Data helpers ─────────────────────────────────────────────────────────────
function readLeads() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function writeLeads(leads) { fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2)); }
function readSessions() {
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '{}');
  try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8')); } catch { return {}; }
}
function writeSessions(s) { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2)); }

// ── Auth middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'No token' });
  const sessions = readSessions();
  const session = sessions[token];
  if (!session || Date.now() > session.expires) return res.status(401).json({ error: 'Session expired' });
  next();
}

// ── PUBLIC: Chat ─────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 400,
          system: `You are the friendly sales assistant for Epax Solar GmbH, a B2B PV wholesale supplier in Deggendorf, Bavaria, Germany.

Products:
- Modules: Trina Solar, JA Solar, Aiko
- Inverters: SMA, Fronius, Kostal, Sungrow, RCT-Power, GoodWe, Huawei
- Battery Storage: BYD (HVB/HVM/HVS), Sungrow (SBH/SBR), RCT-Power, SMA, Huawei, Fenecon, Fronius, GoodWe
- Mounting: roof, flat-roof, facade, integration systems; brands: various
- PV Accessories: Lapp/BYD cables, Stäubli/BYD connectors, Huawei/Tigo optimizers
- E-Mobility: Fronius, Huawei, Kostal, SMA, Sungrow wallboxes

Context: B2B wholesale for installers/electricians/project developers.
Website: epax-solar.de | Phone: +49 991 99899011 | Location: Deggendorf, Bavaria

Rules: Keep answers to 2-4 sentences. Be warm, professional, solution-focused.
If someone asks for a quote or needs more info, invite them to leave contact details.
Respond in the SAME language the user writes in (German or English).`,
          messages: [
            ...history.slice(-6),
            { role: 'user', content: message }
          ]
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || fallbackResponse(message);
      return res.json({ reply });
    } catch (e) {
      console.error('Claude API error:', e.message);
    }
  }
  res.json({ reply: fallbackResponse(message) });
});

function fallbackResponse(msg) {
  const q = msg.toLowerCase();
  if (q.match(/modul|panel|trina|ja solar|aiko/)) return 'Wir führen Module von Trina Solar, JA Solar und Aiko. Für welches Projekt suchen Sie Module – Wohngebäude oder Gewerbe?';
  if (q.match(/inverter|wechselrichter|sma|fronius|kostal|sungrow|huawei|goodwe|rct/)) return 'Unser Wechselrichter-Sortiment umfasst SMA, Fronius, Kostal, Sungrow, RCT-Power, GoodWe und Huawei. Welche Leistungsklasse benötigen Sie?';
  if (q.match(/speicher|storage|byd|batterie|battery|fenecon/)) return 'Batteriespeicher führen wir von BYD, Sungrow, RCT-Power, SMA, Huawei, Fenecon, Fronius und GoodWe. Soll ich bei der Dimensionierung helfen?';
  if (q.match(/e.?mobil|ev|wallbox|lad/)) return 'Für E-Mobilität bieten wir Wallboxen von Fronius, Huawei, Kostal, SMA und Sungrow an. Kombinieren Sie das mit einer PV-Anlage?';
  if (q.match(/preis|price|kosten|cost|quote|angebot/)) return 'Für ein individuelles Angebot hinterlassen Sie gerne Ihre Kontaktdaten – unser Vertriebsteam meldet sich umgehend!';
  if (q.match(/bestell|order|kauf|buy/)) return 'Bestellungen über epax-solar.de oder Tel. +49 991 99899011. Kann ich bei der Produktauswahl helfen?';
  if (q.match(/hallo|hi|hello|guten|hey|servus/)) return 'Hallo! Willkommen bei Epax Solar – Ihrem PV-Großhändler in Deggendorf. Wie kann ich Ihnen heute helfen?';
  return 'Gute Frage! Unser Vertriebsteam kann das am besten beantworten. Möchten Sie Ihre Kontaktdaten hinterlassen?';
}

// ── PUBLIC: Save lead ─────────────────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const { name, email, company, phone, interest, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const leads = readLeads();
  const lead = {
    id: crypto.randomUUID(),
    name, email,
    company: company || '',
    phone: phone || '',
    interest: interest || '',
    message: message || '',
    score: scoreLeadFn(interest, message),
    createdAt: new Date().toISOString(),
    status: 'new'
  };
  leads.unshift(lead);
  writeLeads(leads);
  res.json({ success: true, id: lead.id });
});

function scoreLeadFn(interest, message) {
  if (!interest && !message) return 'cold';
  const combined = ((interest || '') + ' ' + (message || '')).toLowerCase();
  if (combined.match(/full system|komplett|großprojekt|large|commercial|gewerbe|angebot|quote/)) return 'hot';
  if (combined.match(/storage|speicher|inverter|wechselrichter|module|projekt|system/)) return 'warm';
  return 'cold';
}

// ── ADMIN: Login/Logout ───────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Falsches Passwort' });
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = readSessions();
  sessions[token] = { createdAt: Date.now(), expires: Date.now() + 8 * 60 * 60 * 1000 };
  writeSessions(sessions);
  res.json({ token });
});

app.post('/api/admin/logout', requireAuth, (req, res) => {
  const sessions = readSessions();
  delete sessions[req.headers['x-admin-token']];
  writeSessions(sessions);
  res.json({ success: true });
});

// ── ADMIN: Leads CRUD ─────────────────────────────────────────────────────────
app.get('/api/admin/leads', requireAuth, (req, res) => {
  const leads = readLeads();
  const { score, status, search } = req.query;
  let filtered = leads;
  if (score) filtered = filtered.filter(l => l.score === score);
  if (status) filtered = filtered.filter(l => l.status === status);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.company || '').toLowerCase().includes(s)
    );
  }
  res.json({ leads: filtered, total: leads.length });
});

app.patch('/api/admin/leads/:id', requireAuth, (req, res) => {
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  leads[idx] = { ...leads[idx], ...req.body };
  writeLeads(leads);
  res.json(leads[idx]);
});

app.delete('/api/admin/leads/:id', requireAuth, (req, res) => {
  let leads = readLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  writeLeads(leads);
  res.json({ success: true });
});

app.get('/api/admin/export', requireAuth, (req, res) => {
  const leads = readLeads();
  const header = 'Name,Email,Firma,Telefon,Interesse,Score,Status,Datum\n';
  const rows = leads.map(l =>
    [l.name, l.email, l.company, l.phone, l.interest, l.score, l.status,
     new Date(l.createdAt).toLocaleDateString('de-DE')]
    .map(v => `"${(v||'').replace(/"/g,'""')}"`)
    .join(',')
  ).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="epax-leads.csv"');
  res.send('\uFEFF' + header + rows);
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const leads = readLeads();
  res.json({
    total: leads.length,
    hot: leads.filter(l => l.score === 'hot').length,
    warm: leads.filter(l => l.score === 'warm').length,
    cold: leads.filter(l => l.score === 'cold').length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    thisWeek: leads.filter(l => Date.now() - new Date(l.createdAt) < 7*24*60*60*1000).length
  });
});

// Serve admin SPA
app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => console.log(`\n✅ Epax Solar Bot running → http://localhost:${PORT}\n📊 Admin dashboard → http://localhost:${PORT}/admin\n`));
