const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'inbo-dev-secret-change-in-prod';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hello@getinbo.io';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

async function register(email, password, fullName, company, phone) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  const role = email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'client';

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, company, phone, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), hash, fullName, company || null, phone || null, role);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return { user, token: generateToken(user) };
}

async function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) throw new Error('Invalid email or password');
  if (user.suspended) throw new Error('Account suspended. Contact support.');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password');

  return { user, token: generateToken(user) };
}

module.exports = { register, login, verifyToken, requireAdmin, generateToken };
