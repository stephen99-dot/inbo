const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('./database');
const { register, login, verifyToken, requireAdmin } = require('./auth');

// ─── AUTH ──────────────────────────────────────────────────────────────────────
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, company, phone } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ error: 'Missing required fields' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const result = await register(email, password, fullName, company, phone);
    res.json({ token: result.token, user: safeUser(result.user) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    const result = await login(email, password);
    res.json({ token: result.token, user: safeUser(result.user) });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.get('/auth/me', verifyToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(safeUser(user));
});

// ─── EMAILS ────────────────────────────────────────────────────────────────────
router.get('/emails', verifyToken, (req, res) => {
  const { category, status, limit = 50 } = req.query;
  let query = 'SELECT * FROM emails WHERE user_id = ?';
  const params = [req.user.id];
  if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }
  if (status && status !== 'all') { query += ' AND status = ?'; params.push(status); }
  query += ' ORDER BY received_at DESC LIMIT ?';
  params.push(parseInt(limit));
  const emails = db.prepare(query).all(...params);
  res.json(emails);
});

router.get('/emails/:id', verifyToken, (req, res) => {
  const email = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  // Mark as read
  db.prepare('UPDATE emails SET status = ? WHERE id = ?').run('read', email.id);
  res.json(email);
});

router.patch('/emails/:id', verifyToken, async (req, res) => {
  const { status, draft_approved, draft_content, has_draft } = req.body;
  const email = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (draft_approved !== undefined) { updates.push('draft_approved = ?'); params.push(draft_approved ? 1 : 0); }
  if (draft_content !== undefined) { updates.push('draft_content = ?'); params.push(draft_content); }
  if (has_draft !== undefined) { updates.push('has_draft = ?'); params.push(has_draft ? 1 : 0); }

  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  // If approving, actually send via Gmail
  if (draft_approved && draft_content) {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (user.gmail_connected) {
        console.log('Sending email - to:', email.from_email, 'thread_id:', email.thread_id, 'message_id:', email.message_id);
        await sendEmail(req.user.id, {
          to: email.from_email,
          subject: email.subject,
          body: draft_content,
          threadId: email.thread_id || null
        });
        console.log(`Email sent to ${email.from_email}: "${email.subject}"`);
      }
    } catch (err) {
      console.error('Send error:', err.message);
      return res.status(500).json({ error: 'Draft saved but failed to send: ' + err.message });
    }
  }

  res.json({ success: true });
});

// Seed demo emails for new users
router.post('/emails/seed-demo', verifyToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM emails WHERE user_id = ?').get(req.user.id);
  if (existing) return res.json({ message: 'Already has emails' });

  const demoEmails = [
    { from_name: 'Sarah Connolly', from_email: 'sarah@penncontracting.co.uk', subject: 'Thursday site visit — please confirm by noon', body_preview: 'Hi, just following up on the site visit scheduled for Thursday...', full_body: 'Hi,\n\nJust following up on the site visit scheduled for Thursday at 10am. Can you confirm attendance? We need final numbers for the site manager by noon today.\n\nThanks,\nSarah', category: 'urgent', has_draft: 1, draft_content: 'Hi Sarah,\n\nConfirmed — I\'ll be there Thursday at 10am.\n\nThanks,\n' + req.user.full_name },
    { from_name: 'Jamie Cheffings', from_email: 'jamie@heritagesurveys.co.uk', subject: 'Heritage survey — revised programme attached', body_preview: 'Please find attached the revised programme for the heritage survey...', full_body: 'Hi,\n\nPlease find attached the revised programme for the heritage survey at the Devon site. Could you review and confirm you\'re happy with the updated timelines?\n\nKind regards,\nJamie', category: 'reply_needed', has_draft: 1, draft_content: 'Hi Jamie,\n\nThanks for sending this over. I\'ve reviewed the revised programme and the timelines look fine. Happy to proceed.\n\nBest,\n' + req.user.full_name },
    { from_name: 'Paul Metalwork', from_email: 'paul@paulmetalwork.co.uk', subject: 'Updated steel specs — Lot 3', body_preview: 'Hi, just sending over the updated steel specs for your records...', full_body: 'Hi,\n\nJust sending over the updated steel specs for Lot 3 for your records. No action needed from your end.\n\nCheers,\nPaul', category: 'fyi', has_draft: 0 },
    { from_name: 'Marius QS', from_email: 'marius@enfield-build.co.uk', subject: 'BOQ sign-off — Enfield project', body_preview: 'Following up on the BOQ for the Enfield project...', full_body: 'Hi,\n\nJust following up on the BOQ for the Enfield residential. Are we close to sign-off? Client is asking for timeline.\n\nThanks,\nMarius', category: 'reply_needed', has_draft: 1, draft_content: 'Hi Marius,\n\nApologies for the delay. The BOQ is with our team and should be ready for sign-off by end of week. I\'ll send it over as soon as it\'s done.\n\nBest,\n' + req.user.full_name },
    { from_name: 'Sandeep Sira', from_email: 'sandeep@siragroup.co.uk', subject: 'Phase 2 — programme update', body_preview: 'Quick update on Phase 2 programme...', full_body: 'Hi,\n\nJust a quick update — Phase 2 is progressing well. Foundation work is ahead of schedule. I\'ll have a full update report by Friday.\n\nSandeep', category: 'fyi', has_draft: 0 },
    { from_name: 'LinkedIn', from_email: 'notifications@linkedin.com', subject: 'You have 3 new connection requests', body_preview: 'See who wants to connect with you on LinkedIn...', full_body: 'You have 3 new connection requests waiting.', category: 'marketing', has_draft: 0 },
  ];

  const stmt = db.prepare(`
    INSERT INTO emails (id, user_id, from_name, from_email, subject, body_preview, full_body, category, status, has_draft, draft_content, received_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' hours'))
  `);

  demoEmails.forEach((e, i) => {
    stmt.run(uuidv4(), req.user.id, e.from_name, e.from_email, e.subject, e.body_preview, e.full_body, e.category, i === 0 ? 'unread' : 'unread', e.has_draft ? 1 : 0, e.draft_content || null, i * 2);
  });

  res.json({ success: true, count: demoEmails.length });
});

// ─── DASHBOARD STATS ───────────────────────────────────────────────────────────
router.get('/stats', verifyToken, (req, res) => {
  const uid = req.user.id;
  const total = db.prepare('SELECT COUNT(*) as c FROM emails WHERE user_id = ?').get(uid).c;
  const unread = db.prepare('SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND status = ?').get(uid, 'unread').c;
  const drafts = db.prepare('SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND has_draft = 1 AND draft_approved = 0').get(uid).c;
  const urgent = db.prepare('SELECT COUNT(*) as c FROM emails WHERE user_id = ? AND category = ?').get(uid, 'urgent').c;
  res.json({ total, unread, drafts, urgent });
});

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────
router.get('/notifications', verifyToken, (req, res) => {
  const notes = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(req.user.id);
  res.json(notes);
});

router.patch('/notifications/:id/read', verifyToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

router.patch('/notifications/read-all', verifyToken, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

// ─── PROFILE ───────────────────────────────────────────────────────────────────
router.patch('/profile', verifyToken, (req, res) => {
  const { full_name, company, phone } = req.body;
  db.prepare('UPDATE users SET full_name = ?, company = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(full_name, company, phone, req.user.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json(safeUser(user));
});

// ─── ADMIN ─────────────────────────────────────────────────────────────────────
router.get('/admin/users', verifyToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, full_name, company, role, plan, plan_status, suspended, gmail_connected, outlook_connected, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

router.patch('/admin/users/:id', verifyToken, requireAdmin, (req, res) => {
  const { plan, suspended, role, bonus_credits } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const updates = [];
  const params = [];
  if (plan !== undefined) { updates.push('plan = ?'); params.push(plan); }
  if (suspended !== undefined) { updates.push('suspended = ?'); params.push(suspended ? 1 : 0); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (bonus_credits !== undefined) { updates.push('bonus_credits = ?'); params.push(parseInt(bonus_credits)); }

  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);
  }
  res.json({ success: true });
});

router.delete('/admin/users/:id', verifyToken, requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  db.prepare('DELETE FROM emails WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/admin/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, fullName, company, role } = req.body;
    const { register: reg } = require('./auth');
    const result = await reg(email, password, fullName, company, null);
    if (role === 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(result.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin/stats', verifyToken, requireAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE role != ?').get('admin').c;
  const totalEmails = db.prepare('SELECT COUNT(*) as c FROM emails').get().c;
  const gmailConnected = db.prepare('SELECT COUNT(*) as c FROM users WHERE gmail_connected = 1').get().c;
  const newToday = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").get().c;
  res.json({ totalUsers, totalEmails, gmailConnected, newToday });
});

// ─── GMAIL OAUTH ───────────────────────────────────────────────────────────────
const { getAuthUrl, exchangeCode, fetchEmails, createGmailDraft, sendEmail } = require('./gmail');

router.get('/auth/gmail', verifyToken, (req, res) => {
  const url = getAuthUrl(req.user.id);
  res.json({ url });
});

router.get('/auth/gmail/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;
  console.log('Gmail callback received:', { code: !!code, userId, error });
  if (error || !code) return res.redirect('/#/settings/integrations?error=gmail_denied');

  try {
    const tokens = await exchangeCode(code);
    console.log('Token exchange result:', { error: tokens.error, hasAccess: !!tokens.access_token, hasRefresh: !!tokens.refresh_token });
    if (tokens.error) throw new Error(tokens.error + ': ' + tokens.error_description);

    // Get user's Gmail address
    const https = require('https');
    const gmailEmail = await new Promise((resolve) => {
      const req2 = https.request({
        hostname: 'www.googleapis.com',
        path: '/oauth2/v2/userinfo',
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }, res2 => {
        let d = '';
        res2.on('data', c => d += c);
        res2.on('end', () => { try { resolve(JSON.parse(d).email); } catch { resolve(''); } });
      });
      req2.end();
    });
    console.log('Gmail email:', gmailEmail, 'updating user:', userId);

    const expires = Date.now() + (tokens.expires_in * 1000);
    const result = db.prepare(`UPDATE users SET
      gmail_connected = 1,
      gmail_email = ?,
      gmail_access_token = ?,
      gmail_refresh_token = ?,
      gmail_token_expires = ?
      WHERE id = ?`
    ).run(gmailEmail, tokens.access_token, tokens.refresh_token, expires, userId);
    console.log('DB update result:', result);

    // Sync inbox
    try {
      const emails = await fetchEmails(userId, 50);
      for (const e of emails) {
        const exists = db.prepare('SELECT id FROM emails WHERE user_id = ? AND message_id = ?').get(userId, e.message_id);
        if (!exists) {
          const { v4: uuid } = require('uuid');
          db.prepare(`INSERT INTO emails (id, user_id, message_id, thread_id, provider, from_name, from_email, subject, body_preview, full_body, category, status)
            VALUES (?, ?, ?, ?, 'gmail', ?, ?, ?, ?, ?, 'uncategorised', 'unread')`
          ).run(uuid(), userId, e.message_id, e.thread_id, e.from_name, e.from_email, e.subject, e.body_preview, e.full_body);
        }
      }
    } catch {}

    // Start Gmail push notifications watch
    try {
      await startGmailWatch(userId);
    } catch (err) {
      console.error('Watch start error:', err.message);
    }

    res.redirect('/#/settings/integrations?success=gmail');
  } catch (err) {
    res.redirect(`/#/settings/integrations?error=${encodeURIComponent(err.message)}`);
  }
});

router.post('/gmail/sync', verifyToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    console.log('Sync request - gmail_connected:', user.gmail_connected, 'has_refresh_token:', !!user.gmail_refresh_token);
    if (!user.gmail_connected) return res.status(400).json({ error: 'Gmail not connected' });

    const { full } = req.body;
    const limit = full ? 500 : 50;

    const emails = await fetchEmails(req.user.id, limit);
    console.log('Fetched emails count:', emails.length);
    let added = 0;
    for (const e of emails) {
      const exists = db.prepare('SELECT id FROM emails WHERE user_id = ? AND message_id = ?').get(req.user.id, e.message_id);
      if (!exists) {
        db.prepare(`INSERT INTO emails (id, user_id, message_id, thread_id, provider, from_name, from_email, subject, body_preview, full_body, category, status)
          VALUES (?, ?, ?, ?, 'gmail', ?, ?, ?, ?, ?, 'uncategorised', 'unread')`
        ).run(require('uuid').v4(), req.user.id, e.message_id, e.thread_id, e.from_name, e.from_email, e.subject, e.body_preview, e.full_body);
        added++;
      }
    }
    console.log('Sync complete - added:', added);
    res.json({ synced: emails.length, added });
  } catch (err) {
    console.error('Sync error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── CHAT ──────────────────────────────────────────────────────────────────────
router.get('/chat/conversations', verifyToken, (req, res) => {
  const convos = db.prepare(
    'SELECT id, title, created_at FROM chat_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(req.user.id);
  res.json(convos);
});

router.post('/chat/conversations', verifyToken, (req, res) => {
  const id = uuidv4();
  const { title } = req.body;
  db.prepare(
    'INSERT INTO chat_conversations (id, user_id, title) VALUES (?, ?, ?)'
  ).run(id, req.user.id, title || 'New conversation');
  res.json({ id, title: title || 'New conversation' });
});

router.get('/chat/conversations/:id/messages', verifyToken, (req, res) => {
  const convo = db.prepare('SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!convo) return res.status(404).json({ error: 'Not found' });
  const messages = db.prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages);
});

router.post('/chat/conversations/:id/messages', verifyToken, async (req, res) => {
  const convo = db.prepare('SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!convo) return res.status(404).json({ error: 'Not found' });

  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  const userMsgId = uuidv4();
  db.prepare('INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(userMsgId, req.params.id, 'user', message);

  const msgCount = db.prepare('SELECT COUNT(*) as c FROM chat_messages WHERE conversation_id = ?').get(req.params.id).c;
  if (msgCount <= 1) {
    const shortTitle = message.length > 40 ? message.substring(0, 40) + '...' : message;
    db.prepare('UPDATE chat_conversations SET title = ? WHERE id = ?').run(shortTitle, req.params.id);
  }

  const history = db.prepare('SELECT role, content FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC').all(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // ── Tools ──
  const tools = [
    {
      name: 'search_emails',
      description: 'Search the user\'s emails by sender name, email address, subject, or keywords in the body. Use this whenever the user mentions a person or topic to find related emails.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term — name, email address, subject keyword, or body keyword' },
          limit: { type: 'number', description: 'Max results to return, default 5' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_email',
      description: 'Get the full content of a specific email by its ID.',
      input_schema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'The email ID' }
        },
        required: ['email_id']
      }
    },
    {
      name: 'create_draft',
      description: 'Create a draft reply to an email. This saves it to the user\'s Drafts in both Inbo and Gmail (if connected) so they can review, edit and send it.',
      input_schema: {
        type: 'object',
        properties: {
          email_id: { type: 'string', description: 'ID of the email being replied to' },
          draft_content: { type: 'string', description: 'The full draft reply text' }
        },
        required: ['email_id', 'draft_content']
      }
    },
    {
      name: 'list_emails',
      description: 'List recent emails, optionally filtered by category (urgent, reply_needed, fyi, marketing, uncategorised) or status (unread, read).',
      input_schema: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Filter by category' },
          status: { type: 'string', description: 'Filter by status: unread or read' },
          limit: { type: 'number', description: 'Max results, default 10' }
        }
      }
    }
  ];

  // ── Tool execution ──
  const executeTool = async (toolName, toolInput) => {
    if (toolName === 'search_emails') {
      const q = `%${toolInput.query}%`;
      const limit = toolInput.limit || 5;
      const emails = db.prepare(`SELECT id, from_name, from_email, subject, body_preview, category, status, received_at
        FROM emails WHERE user_id = ? AND (from_name LIKE ? OR from_email LIKE ? OR subject LIKE ? OR body_preview LIKE ?)
        ORDER BY received_at DESC LIMIT ?`).all(req.user.id, q, q, q, q, limit);
      return emails.length > 0
        ? emails.map(e => `ID: ${e.id}\nFrom: ${e.from_name} <${e.from_email}>\nSubject: ${e.subject}\nCategory: ${e.category}\nStatus: ${e.status}\nPreview: ${e.body_preview}`).join('\n\n')
        : 'No emails found matching that search.';
    }

    if (toolName === 'get_email') {
      const email = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(toolInput.email_id, req.user.id);
      if (!email) return 'Email not found.';
      return `ID: ${email.id}\nFrom: ${email.from_name} <${email.from_email}>\nSubject: ${email.subject}\nStatus: ${email.status}\nCategory: ${email.category}\n\nBody:\n${email.full_body || email.body_preview}`;
    }

    if (toolName === 'list_emails') {
      let query = 'SELECT id, from_name, from_email, subject, body_preview, category, status FROM emails WHERE user_id = ?';
      const params = [req.user.id];
      if (toolInput.category) { query += ' AND category = ?'; params.push(toolInput.category); }
      if (toolInput.status) { query += ' AND status = ?'; params.push(toolInput.status); }
      query += ' ORDER BY received_at DESC LIMIT ?';
      params.push(toolInput.limit || 10);
      const emails = db.prepare(query).all(...params);
      return emails.length > 0
        ? emails.map(e => `ID: ${e.id}\nFrom: ${e.from_name} <${e.from_email}>\nSubject: ${e.subject}\nCategory: ${e.category} | ${e.status}`).join('\n\n')
        : 'No emails found.';
    }

    if (toolName === 'create_draft') {
      const email = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(toolInput.email_id, req.user.id);
      if (!email) return 'Email not found.';

      db.prepare('UPDATE emails SET has_draft = 1, draft_content = ?, draft_approved = 0 WHERE id = ?')
        .run(toolInput.draft_content, toolInput.email_id);

      // Push to Gmail if connected
      if (user.gmail_connected && user.gmail_refresh_token) {
        try {
          await createGmailDraft(req.user.id, {
            to: email.from_email,
            subject: email.subject,
            body: toolInput.draft_content,
            threadId: email.message_id
          });
          return `Draft created and saved to your Gmail Drafts folder. You can review and edit it in the Drafts page or directly in Gmail.`;
        } catch (e) {
          return `Draft saved to Inbo Drafts (Gmail sync failed: ${e.message}). You can review it in the Drafts page.`;
        }
      }

      return `Draft saved to your Inbo Drafts page. You can review, edit and approve it there. Connect Gmail in Settings to also sync drafts to Gmail.`;
    }

    return 'Unknown tool.';
  };

  // ── Agentic loop ──
  try {
    let fullResponse = '';
    let messages = history.map(m => ({ role: m.role, content: m.content }));
    const systemPrompt = `You are Inbo, an AI email assistant. You help users manage their inbox, draft replies, summarise threads, and stay on top of communications.

User: ${user.full_name} (${user.gmail_email || user.email})
Gmail connected: ${user.gmail_connected ? 'Yes' : 'No'}

When the user asks to draft a reply:
1. Use search_emails or get_email to find the relevant email first
2. Write a professional reply matching their tone
3. Use create_draft to save it — this puts it in their Drafts page and Gmail Drafts if connected

Be concise and helpful. Always use tools before answering questions about specific emails.`;

    const runLoop = async () => {
      const https = require('https');
      const body = JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages
      });

      return new Promise((resolve, reject) => {
        const apiReq = https.request({
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(body)
          }
        }, (apiRes) => {
          let data = '';
          apiRes.on('data', c => data += c);
          apiRes.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { reject(new Error('Parse error')); }
          });
        });
        apiReq.on('error', reject);
        apiReq.write(body);
        apiReq.end();
      });
    };

    let iterations = 0;
    while (iterations < 5) {
      iterations++;
      const response = await runLoop();

      if (response.error) {
        res.write(`data: ${JSON.stringify({ text: `Error: ${response.error.message}` })}\n\n`);
        break;
      }

      // Stream any text blocks
      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          fullResponse += block.text;
          // Stream word by word
          const words = block.text.split(' ');
          for (const word of words) {
            res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`);
          }
        }
      }

      // If tool use needed
      if (response.stop_reason === 'tool_use') {
        const toolUses = response.content.filter(b => b.type === 'tool_use');
        messages.push({ role: 'assistant', content: response.content });

        const toolResults = [];
        for (const toolUse of toolUses) {
          res.write(`data: ${JSON.stringify({ tool: toolUse.name })}\n\n`);
          const result = await executeTool(toolUse.name, toolUse.input);
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
        }
        messages.push({ role: 'user', content: toolResults });
        continue;
      }

      break;
    }

    // Save final response
    if (fullResponse) {
      db.prepare('INSERT INTO chat_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, 'assistant', fullResponse);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    res.write(`data: ${JSON.stringify({ text: 'Something went wrong: ' + err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

router.delete('/chat/conversations/:id', verifyToken, (req, res) => {
  const convo = db.prepare('SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!convo) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(req.params.id);
  db.prepare('DELETE FROM chat_conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/gmail/draft-all', verifyToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user.gmail_connected) return res.status(400).json({ error: 'Gmail not connected' });

    // Get unread emails with no draft yet
    const emails = db.prepare(`
      SELECT * FROM emails 
      WHERE user_id = ? AND has_draft = 0 AND status = 'unread'
      ORDER BY received_at DESC LIMIT 20
    `).all(req.user.id);

    res.json({ processing: emails.length });

    // Process in background
    (async () => {
      let drafted = 0;
      for (const email of emails) {
        try {
          // Categorise first
          const category = await categoriseEmail(email);
          db.prepare('UPDATE emails SET category = ? WHERE id = ?').run(category, email.id);

          if (category === 'urgent' || category === 'reply_needed') {
            const draft = await autoDraftReply(user, email);
            if (draft) {
              db.prepare('UPDATE emails SET has_draft = 1, draft_content = ? WHERE id = ?').run(draft, email.id);

              if (user.gmail_refresh_token) {
                try {
                  await createGmailDraft(user.id, {
                    to: email.from_email,
                    subject: email.subject,
                    body: draft,
                    threadId: email.message_id
                  });
                } catch {}
              }
              drafted++;
              console.log(`Drafted reply for: "${email.subject}"`);
            }
          }
        } catch (err) {
          console.error('Draft error for email:', email.subject, err.message);
        }
      }

      // Notify user
      if (drafted > 0) {
        db.prepare(`INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, 'draft', ?, ?)`)
          .run(uuidv4(), user.id, `${drafted} drafts ready`, `Inbo created ${drafted} draft replies. Review them in Drafts or Gmail.`);
      }
      console.log(`Bulk draft complete: ${drafted} drafts created`);
    })();

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/gmail/webhook', async (req, res) => {
  // Acknowledge immediately so Pub/Sub doesn't retry
  res.status(200).send('OK');

  try {
    const message = req.body?.message;
    if (!message?.data) return;

    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    const { emailAddress, historyId } = data;
    if (!emailAddress) return;

    // Find user by gmail email
    const user = db.prepare('SELECT * FROM users WHERE gmail_email = ? AND gmail_connected = 1').get(emailAddress);
    if (!user) return;

    console.log(`Webhook: new email for ${emailAddress}, historyId: ${historyId}`);
    await processNewEmails(user);
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

// ─── GMAIL WATCH (start listening for new emails) ─────────────────────────────
router.post('/gmail/watch', verifyToken, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user.gmail_connected) return res.status(400).json({ error: 'Gmail not connected' });

    const result = await startGmailWatch(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PROCESS NEW EMAILS ───────────────────────────────────────────────────────
async function processNewEmails(user) {
  try {
    const { fetchEmails, createGmailDraft } = require('./gmail');
    const emails = await fetchEmails(user.id, 10);

    for (const e of emails) {
      const exists = db.prepare('SELECT id FROM emails WHERE user_id = ? AND message_id = ?').get(user.id, e.message_id);
      if (exists) continue;

      const emailId = uuidv4();

      // Auto-categorise with Claude
      const category = await categoriseEmail(e);

      db.prepare(`INSERT INTO emails (id, user_id, message_id, thread_id, provider, from_name, from_email, subject, body_preview, full_body, category, status)
        VALUES (?, ?, ?, ?, 'gmail', ?, ?, ?, ?, ?, ?, 'unread')`
      ).run(emailId, user.id, e.message_id, e.thread_id, e.from_name, e.from_email, e.subject, e.body_preview, e.full_body, category);

      console.log(`Processed email from ${e.from_name}: "${e.subject}" → ${category}`);

      // Auto-draft reply for urgent/reply_needed emails
      if (category === 'urgent' || category === 'reply_needed') {
        try {
          const draft = await autoDraftReply(user, e);
          if (draft) {
            db.prepare('UPDATE emails SET has_draft = 1, draft_content = ? WHERE id = ?').run(draft, emailId);

            // Push draft to Gmail
            await createGmailDraft(user.id, {
              to: e.from_email,
              subject: e.subject,
              body: draft,
              threadId: e.message_id
            });

            console.log(`Auto-drafted reply for: "${e.subject}"`);

            // Notify user
            db.prepare(`INSERT INTO notifications (id, user_id, type, title, message) VALUES (?, ?, 'draft', ?, ?)`
            ).run(uuidv4(), user.id, `Draft ready: ${e.subject}`, `Inbo drafted a reply to ${e.from_name}. Review it in Drafts or Gmail.`);
          }
        } catch (err) {
          console.error('Auto-draft error:', err.message);
        }
      }
    }
  } catch (err) {
    console.error('processNewEmails error:', err.message);
  }
}

// ─── AUTO CATEGORISE ─────────────────────────────────────────────────────────
async function categoriseEmail(email) {
  try {
    const https = require('https');
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      system: 'Categorise this email into exactly one of: urgent, reply_needed, fyi, marketing, uncategorised. Reply with only the category word, nothing else.',
      messages: [{
        role: 'user',
        content: `From: ${email.from_name} <${email.from_email}>\nSubject: ${email.subject}\n\n${email.body_preview}`
      }]
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    const text = result?.content?.[0]?.text?.trim().toLowerCase() || 'uncategorised';
    const valid = ['urgent', 'reply_needed', 'fyi', 'marketing', 'uncategorised'];
    return valid.includes(text) ? text : 'uncategorised';
  } catch {
    return 'uncategorised';
  }
}

// ─── AUTO DRAFT REPLY ─────────────────────────────────────────────────────────
async function autoDraftReply(user, email) {
  try {
    const https = require('https');
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You are an AI assistant drafting email replies on behalf of ${user.full_name}. Write professional, concise replies. Do not include a subject line. Just write the reply body.`,
      messages: [{
        role: 'user',
        content: `Draft a reply to this email:\n\nFrom: ${email.from_name} <${email.from_email}>\nSubject: ${email.subject}\n\n${email.full_body || email.body_preview}`
      }]
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    return result?.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

// ─── START GMAIL WATCH ────────────────────────────────────────────────────────
async function startGmailWatch(userId) {
  const { gmailRequest } = require('./gmail');
  const topicName = process.env.GOOGLE_PUBSUB_TOPIC;

  const result = await gmailRequest(userId, '/gmail/v1/users/me/watch', 'POST', {
    topicName,
    labelIds: ['INBOX']
  });

  if (result.expiration) {
    db.prepare('UPDATE users SET gmail_watch_expiry = ? WHERE id = ?').run(parseInt(result.expiration), userId);
    console.log(`Gmail watch started for user ${userId}, expires: ${new Date(parseInt(result.expiration))}`);
  }

  return result;
}

// ─── HELPER ────────────────────────────────────────────────────────────────────
function safeUser(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

module.exports = router;
