const db = require('../db');

function getOverdueDays() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('overdue_days');
  return parseInt(row?.value || '7', 10);
}

function refreshOverdueFlags() {
  const days = getOverdueDays();
  db.prepare(`
    UPDATE complaints
    SET is_overdue = 1, updated_at = datetime('now')
    WHERE status != 'Resolved'
      AND julianday('now') - julianday(created_at) > ?
      AND is_overdue = 0
  `).run(days);
}

function addHistory(complaintId, status, actorId, note = null) {
  db.prepare(`
    INSERT INTO complaint_history (complaint_id, status, note, actor_id)
    VALUES (?, ?, ?, ?)
  `).run(complaintId, status, note, actorId);
}

module.exports = { getOverdueDays, refreshOverdueFlags, addHistory };
