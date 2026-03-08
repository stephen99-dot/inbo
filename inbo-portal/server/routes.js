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

router.patch('/emails/:id', verifyToken, (req, res) => {
  const { status, draft_approved, draft_content } = req.body;
  const email = db.prepare('SELECT * FROM emails WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });

  const updates = [];
  const params = [];
  if (status) { updates.push('status = ?'); params.push(status); }
  if (draft_approved !== undefined) { updates.push('draft_approved = ?'); params.push(draft_approved ? 1 : 0); }
  if (draft_content !== undefined) { updates.push('draft_content = ?'); params.push(draft_content); }

  if (updates.length) {
    params.push(req.params.id);
    db.prepare(`UPDATE emails SET ${updates.join(', ')} WHERE id = ?`).run(...params);
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

// ─── HELPER ────────────────────────────────────────────────────────────────────
function safeUser(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

module.exports = router;
