const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db('users')
      .insert({ email, password_hash, name, tier_status: 'free', role: 'user' })
      .returning(['id', 'email', 'name', 'tier_status', 'role', 'sub_end_date']);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tier_status: user.tier_status },
      process.env.JWT_SECRET || 'mainbooks-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
   const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    // Check if sub is still valid
    let tier_status = user.tier_status;
    if (tier_status === 'premium' && user.sub_end_date && new Date(user.sub_end_date) < new Date()) {
      tier_status = 'free';
      await db('users').where({ id: user.id }).update({ tier_status: 'free' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tier_status },
      process.env.JWT_SECRET || 'mainbooks-secret',
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user.id, email: user.email, name: user.name, tier_status, role: user.role, sub_end_date: user.sub_end_date },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'email', 'name', 'tier_status', 'role', 'sub_end_date')
      .first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = { register, login, getMe };
