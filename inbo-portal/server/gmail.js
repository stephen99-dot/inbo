const https = require('https');
const db = require('./database');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://inbo.onrender.com/api/auth/gmail/callback';

// ── OAuth URL ─────────────────────────────────────────────────────────────────
function getAuthUrl(userId) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: userId
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

// ── Token exchange ────────────────────────────────────────────────────────────
async function exchangeCode(code) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Refresh access token ──────────────────────────────────────────────────────
async function refreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token'
    }).toString();

    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Get valid access token for user ──────────────────────────────────────────
async function getAccessToken(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user?.gmail_refresh_token) throw new Error('Gmail not connected');

  // Check if existing token is still valid (expires_at stored as unix ms)
  if (user.gmail_token_expires && Date.now() < user.gmail_token_expires - 60000) {
    return user.gmail_access_token;
  }

  // Refresh
  const tokens = await refreshToken(user.gmail_refresh_token);
  if (tokens.error) throw new Error('Failed to refresh Gmail token');

  const expires = Date.now() + (tokens.expires_in * 1000);
  db.prepare('UPDATE users SET gmail_access_token = ?, gmail_token_expires = ? WHERE id = ?')
    .run(tokens.access_token, expires, userId);

  return tokens.access_token;
}

// ── Gmail API request helper ──────────────────────────────────────────────────
async function gmailRequest(userId, path, method = 'GET', body = null) {
  const token = await getAccessToken(userId);
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'gmail.googleapis.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Fetch inbox emails ────────────────────────────────────────────────────────
async function fetchEmails(userId, maxResults = 30) {
  const list = await gmailRequest(userId, `/gmail/v1/users/me/messages?maxResults=${Math.min(maxResults, 500)}&labelIds=INBOX`);
  if (!list.messages) return [];

  const emails = [];
  for (const msg of list.messages.slice(0, maxResults)) {
    try {
      const full = await gmailRequest(userId, `/gmail/v1/users/me/messages/${msg.id}?format=full`);
      const headers = full.payload?.headers || [];
      const get = name => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const from = get('From');
      const fromMatch = from.match(/^(.*?)\s*<(.+)>$/) || [null, from, from];
      const fromName = fromMatch[1]?.trim().replace(/^"|"$/g, '') || from;
      const fromEmail = fromMatch[2]?.trim() || from;

      // Get body
      let body = '';
      const getPart = (part) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf8');
        }
        if (part.parts) { for (const p of part.parts) { const r = getPart(p); if (r) return r; } }
        return '';
      };
      body = getPart(full.payload);
      if (!body && full.payload?.body?.data) {
        body = Buffer.from(full.payload.body.data, 'base64').toString('utf8');
      }

      emails.push({
        message_id: msg.id,
        from_name: fromName,
        from_email: fromEmail,
        subject: get('Subject'),
        body_preview: body.substring(0, 200).replace(/\n/g, ' '),
        full_body: body.substring(0, 5000),
        date: get('Date'),
        thread_id: full.threadId
      });
    } catch {}
  }
  return emails;
}

// ── Create Gmail draft ────────────────────────────────────────────────────────
async function createGmailDraft(userId, { to, subject, body, threadId }) {
  const user = db.prepare('SELECT gmail_email FROM users WHERE id = ?').get(userId);
  const fromEmail = user?.gmail_email || '';

  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : 'Re: ' + subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body
  ];
  const raw = Buffer.from(emailLines.join('\r\n')).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const draftBody = { message: { raw, ...(threadId ? { threadId } : {}) } };
  const result = await gmailRequest(userId, '/gmail/v1/users/me/drafts', 'POST', draftBody);
  return result;
}

// ── Send email ────────────────────────────────────────────────────────────────
async function sendEmail(userId, { to, subject, body, threadId }) {
  const user = db.prepare('SELECT gmail_email FROM users WHERE id = ?').get(userId);
  const fromEmail = user?.gmail_email || '';

  const emailLines = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: ${subject.startsWith('Re:') ? subject : 'Re: ' + subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body
  ];
  const raw = Buffer.from(emailLines.join('\r\n')).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const sendBody = { raw, ...(threadId ? { threadId } : {}) };
  const result = await gmailRequest(userId, '/gmail/v1/users/me/messages/send', 'POST', sendBody);
  if (result.error) throw new Error(`Gmail send error: ${JSON.stringify(result.error)}`);
  console.log('Email sent successfully:', result.id, result.labelIds);
  return result;
}

module.exports = { getAuthUrl, exchangeCode, fetchEmails, createGmailDraft, sendEmail, gmailRequest };
