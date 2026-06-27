import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from './logger.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!env.email.host || !env.email.user) {
    logger.warn('Email transport not configured; emails will be skipped.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.password },
  });
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) return { skipped: true };
  try {
    const info = await t.sendMail({
      from: env.email.from,
      to,
      subject,
      html,
      text,
    });
    logger.info('Email sent', { to, subject, id: info.messageId });
    return info;
  } catch (err) {
    logger.error('Email send failed', { error: err.message });
    return { error: err.message };
  }
};

export const sendSubscriptionReceipt = (user, subscription, payment) =>
  sendEmail({
    to: user.email,
    subject: 'Your SBC Classes subscription is active',
    html: `
      <h2>Hi ${user.name},</h2>
      <p>Thank you for subscribing to <b>${subscription.planName || subscription.type}</b>.</p>
      <p>Order ID: <code>${payment.gatewayOrderId}</code></p>
      <p>Amount paid: ₹${(payment.amount / 100).toFixed(2)}</p>
      <p>Valid until: <b>${new Date(subscription.expiryDate).toDateString()}</b></p>
      <p>You can now access your batch content from your dashboard.</p>
    `,
  });
