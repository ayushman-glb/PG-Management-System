import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT, 10),
  secure: parseInt(env.SMTP_PORT, 10) === 465, // false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify SMTP Connection on Startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Unable to connect to Brevo SMTP:', error.message);
  } else {
    console.log('✅ Brevo SMTP Connected successfully');
  }
});
