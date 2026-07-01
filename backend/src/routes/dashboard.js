const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { refreshOverdueFlags, getOverdueDays } = require('../services/complaints');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), (_req, res) => {
  refreshOverdueFlags();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM complaints GROUP BY status
  `).all();

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) AS count FROM complaints GROUP BY category
  `).all();

  const overdueCount = db.prepare(`
    SELECT COUNT(*) AS count FROM complaints WHERE is_overdue = 1 AND status != 'Resolved'
  `).get().count;

  const total = db.prepare('SELECT COUNT(*) AS count FROM complaints').get().count;

  res.json({
    total,
    overdueCount,
    overdueThresholdDays: getOverdueDays(),
    byStatus: Object.fromEntries(byStatus.map(r => [r.status, r.count])),
    byCategory: Object.fromEntries(byCategory.map(r => [r.category, r.count])),
  });
});

router.get('/settings/overdue-days', authMiddleware, (_req, res) => {
  res.json({ overdueDays: getOverdueDays() });
});

router.put('/settings/overdue-days', authMiddleware, requireRole('admin'), (req, res) => {
  const { overdueDays } = req.body;
  const days = parseInt(overdueDays, 10);
  if (!days || days < 1) {
    return res.status(400).json({ error: 'overdueDays must be a positive number' });
  }

  db.prepare(`
    INSERT INTO settings (key, value) VALUES ('overdue_days', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(String(days));

  refreshOverdueFlags();
  res.json({ overdueDays: days });
});

module.exports = router;
