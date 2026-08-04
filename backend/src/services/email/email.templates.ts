import { env } from '../../config/env';

export interface EmailTemplateData {
  title?: string;
  name?: string;
  code?: string;
  resetLink?: string;
  message?: string;
  subject?: string;
}

export const emailTemplates = {
  otp: ({ name, code }: EmailTemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #d97706, #b45309); padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
        .content { padding: 32px; text-align: center; }
        .otp-box { background: #0f172a; border: 2px dashed #f59e0b; border-radius: 12px; font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #fbbf24; padding: 20px; margin: 24px 0; display: inline-block; }
        .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏢 RoomBae Enterprise</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Hello ${name || 'User'}, use the following single-use verification code to complete your security verification:</p>
          <div class="otp-box">${code}</div>
          <p style="color: #94a3b8; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} RoomBae Enterprise. All rights reserved. Zero-Trust Security System.
        </div>
      </div>
    </body>
    </html>
  `,

  welcome: ({ name }: EmailTemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
        .header { background: linear-gradient(135deg, #d97706, #b45309); padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 32px; line-height: 1.6; }
        .btn { display: inline-block; background: #f59e0b; color: #0f172a; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
        .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to RoomBae 🎉</h1>
        </div>
        <div class="content">
          <h2>Hello ${name || 'Valued Resident'},</h2>
          <p>We are thrilled to welcome you to the RoomBae Enterprise Ecosystem! Your account is fully verified and ready for use.</p>
          <p>You can now manage your stay, pay rent digitally, log complaints, and view your rental agreement seamlessly.</p>
          <div style="text-align: center;">
            <a href="${env.FRONTEND_URL}" class="btn">Explore RoomBae Portal</a>
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} RoomBae Enterprise. Premium PG Management.
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: ({ name, resetLink }: EmailTemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 32px; text-align: center; line-height: 1.6; }
        .btn { display: inline-block; background: #ef4444; color: #ffffff; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
        .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your RoomBae Password</h2>
          <p>Hello ${name || 'User'}, we received a request to reset your password. Click the button below to specify a new password:</p>
          <a href="${resetLink}" class="btn">Reset Password Now</a>
          <p style="color: #94a3b8; font-size: 14px;">If you did not request a password reset, please ignore this email or contact support immediately.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} RoomBae Enterprise Security.
        </div>
      </div>
    </body>
    </html>
  `,

  notification: ({ name, subject, message }: EmailTemplateData) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0284c7, #0369a1); padding: 24px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
        .content { padding: 32px; line-height: 1.6; }
        .footer { background: #0f172a; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #334155; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📢 ${subject || 'RoomBae Notification'}</h1>
        </div>
        <div class="content">
          <h2>Hi ${name || 'Resident'},</h2>
          <p>${message}</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} RoomBae Enterprise Notifications.
        </div>
      </div>
    </body>
    </html>
  `
};
