const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

async function sendEmail(to, subject, text) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[Email skipped - SMTP not configured] To: ${to} | ${subject}`);
    return;
  }

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function notifyStatusChange(userEmail, complaintId, newStatus, note) {
  const subject = `Complaint #${complaintId} status updated to ${newStatus}`;
  const text = [
    `Your complaint #${complaintId} has been updated.`,
    `New status: ${newStatus}`,
    note ? `Note: ${note}` : '',
    '',
    'Log in to the Society Maintenance Tracker to view details.',
  ].filter(Boolean).join('\n');

  await sendEmail(userEmail, subject, text);
}

async function notifyImportantNotice(userEmail, title, content) {
  const subject = `Important Notice: ${title}`;
  const text = [`Important notice posted on the society notice board:`, '', title, '', content].join('\n');
  await sendEmail(userEmail, subject, text);
}

module.exports = { sendEmail, notifyStatusChange, notifyImportantNotice };
