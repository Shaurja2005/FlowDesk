const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

/**
 * sendEmail — sends a transactional email via Nodemailer.
 * Silently fails if SMTP credentials are missing (non-blocking).
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured — skipping email send');
    return;
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FlowDesk <noreply@flowdesk.app>',
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
};

/**
 * Email templates
 */
const welcomeEmail = (name) => ({
  subject: 'Welcome to FlowDesk 🚀',
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#6C63FF">Welcome to FlowDesk, ${name}!</h1>
      <p>Your account has been created successfully. Start managing your projects today.</p>
      <a href="${process.env.CLIENT_URL}" style="background:#6C63FF;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
        Open FlowDesk
      </a>
    </div>
  `,
});

const taskAssignedEmail = (assigneeName, taskTitle, projectTitle) => ({
  subject: `You've been assigned a task: ${taskTitle}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#6C63FF">New Task Assignment</h2>
      <p>Hi ${assigneeName},</p>
      <p>You've been assigned the task <strong>${taskTitle}</strong> in project <strong>${projectTitle}</strong>.</p>
      <a href="${process.env.CLIENT_URL}/tasks" style="background:#6C63FF;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">
        View Task
      </a>
    </div>
  `,
});

module.exports = { sendEmail, welcomeEmail, taskAssignedEmail };
