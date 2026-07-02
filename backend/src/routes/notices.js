const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { notifyImportantNotice } = require('../services/email');

const router = express.Router();

router.get('/', authMiddleware, (_req, res) => {
  const notices = db.prepare(`
    SELECT n.*, u.name AS author_name
    FROM notices n JOIN users u ON n.created_by = u.id
    ORDER BY n.is_important DESC, n.created_at DESC
  `).all();
  res.json({ notices });
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { title, content, is_important } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const important = is_important ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO notices (title, content, is_important, created_by) VALUES (?, ?, ?, ?)
  `).run(title, content, important, req.user.id);

  const notice = db.prepare(`
    SELECT n.*, u.name AS author_name
    FROM notices n JOIN users u ON n.created_by = u.id WHERE n.id = ?
  `).get(result.lastInsertRowid);

  if (important) {
    const residents = db.prepare('SELECT email FROM users WHERE role = ?').all('resident');
    for (const r of residents) {
      await notifyImportantNotice(r.email, title, content);
    }
  }

  res.status(201).json({ notice });
});

module.exports = router;
