require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@society.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminName = process.env.ADMIN_NAME || 'Society Admin';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (existing) {
  console.log('Admin user already exists:', adminEmail);
} else {
  const hash = bcrypt.hashSync(adminPassword, 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')
  `).run(adminName, adminEmail, hash);
  console.log('Admin user created:', adminEmail);
}

console.log('Default overdue threshold: 7 days');
console.log('Seed complete.');
