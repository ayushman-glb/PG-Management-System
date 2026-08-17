import {
  OtpEmailData,
  WelcomeEmailData,
  PasswordResetEmailData,
  PaymentReceiptEmailData,
  InvoiceEmailData,
  PaymentFailedEmailData,
  RefundEmailData,
  BookingConfirmationEmailData,
  ComplaintEmailData,
  SupportReplyEmailData,
  MarketingCampaignData,
} from './email.types';
import { env } from '../../config/env';

/**
 * Shared Bento UI Email Shell Layout
 */
function bentoWrapper(content: string, options?: { preheader?: string; categoryBadge?: string }): string {
  const currentYear = new Date().getFullYear();
  const frontendUrl = env.FRONTEND_URL || 'https://ayushman-glb.github.io/PG-Management-System';
  const supportEmail = env.MAIL_FROM_EMAIL || 'ayushman@globussoft.in';

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>RoomBae</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .bento-card { padding: 24px 16px !important; }
      .bento-cell { display: block !important; width: 100% !important; margin-bottom: 12px !important; }
      .otp-digit-box { font-size: 28px !important; letter-spacing: 8px !important; padding: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #f3f4f6;">
  ${options?.preheader ? `<div style="display: none; max-height: 0px; overflow: hidden;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f17; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 32px 12px;">
        
        <!-- Outer Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding-bottom: 24px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <div style="display: inline-flex; align-items: center; text-decoration: none;">
                      <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                        <span style="color: #f59e0b;">Room</span>Bae
                      </span>
                      <span style="margin-left: 8px; padding: 2px 8px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 6px; font-size: 10px; font-weight: 700; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.5px;">
                        Enterprise
                      </span>
                    </div>
                  </td>
                  ${options?.categoryBadge ? `
                  <td align="right" style="vertical-align: middle;">
                    <span style="padding: 4px 10px; background: #1f2937; border: 1px solid #374151; border-radius: 20px; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${options.categoryBadge}
                    </span>
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Bento Card Body -->
          <tr>
            <td>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <tr>
                  <td class="bento-card" style="padding: 36px 32px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
                This email was sent via RoomBae Gmail Production Gateway.<br>
                For support, reach out to <a href="mailto:${supportEmail}" style="color: #f59e0b; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                &copy; ${currentYear} RoomBae PG Management System. All rights reserved. Zero-Trust Security.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export const emailTemplates = {
  // 1. OTP Verification
  otpVerification: (data: OtpEmailData) => {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          🔐
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Security Verification Code</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
          Hello <strong style="color: #f3f4f6;">${data.name || 'Resident'}</strong>, use the one-time password below to authenticate your RoomBae account:
        </p>
      </div>

      <!-- Bento OTP Box -->
      <div style="background: #0f172a; border: 2px dashed #f59e0b; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
        <div class="otp-digit-box" style="font-size: 40px; font-weight: 800; letter-spacing: 14px; color: #fbbf24; font-family: monospace; padding-left: 14px;">
          ${data.otp}
        </div>
        <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">
          ⏱ Valid for ${data.expiresInMinutes || 10} minutes
        </div>
      </div>

      <!-- Bento Security Info Grid -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 24px;">
        <tr>
          <td style="padding: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid #1f2937; border-radius: 12px;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.4;">
              🛡 <strong>Security Notice:</strong> Never share this OTP with anyone. RoomBae staff will never ask for your verification code over the phone or email.
            </p>
          </td>
        </tr>
      </table>
    `;
    return bentoWrapper(content, { preheader: `Your RoomBae OTP is ${data.otp}`, categoryBadge: 'Security OTP' });
  },

  // 2. Welcome Email
  welcome: (data: WelcomeEmailData) => {
    const loginUrl = data.loginUrl || `${env.FRONTEND_URL}/auth`;
    const content = `
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.2)); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 16px; font-size: 28px; margin-bottom: 16px;">
          🎉
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Welcome to RoomBae!</h1>
        <p style="margin: 0; font-size: 15px; color: #9ca3af; line-height: 1.5;">
          Hello <strong style="color: #f3f4f6;">${data.name}</strong>, your account is fully verified and ready.
        </p>
      </div>

      <!-- Bento 2x2 Feature Grid -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
        <tr>
          <td class="bento-cell" width="48%" style="padding: 16px; background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; vertical-align: top;">
            <div style="font-size: 20px; margin-bottom: 8px;">💳</div>
            <strong style="color: #ffffff; font-size: 14px; display: block; margin-bottom: 4px;">Zero-Fee Payments</strong>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4;">Pay rent, view digital GST invoices, and download automated receipts instantly.</span>
          </td>
          <td width="4%">&nbsp;</td>
          <td class="bento-cell" width="48%" style="padding: 16px; background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; vertical-align: top;">
            <div style="font-size: 20px; margin-bottom: 8px;">⚡</div>
            <strong style="color: #ffffff; font-size: 14px; display: block; margin-bottom: 4px;">Smart Helpdesk</strong>
            <span style="color: #9ca3af; font-size: 12px; line-height: 1.4;">Raise maintenance tickets with priority tracking and real-time SLA updates.</span>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f172a; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);">
          Access RoomBae Portal &rarr;
        </a>
      </div>
    `;
    return bentoWrapper(content, { preheader: 'Welcome to RoomBae Enterprise PG Management', categoryBadge: 'Welcome' });
  },

  // 3. Password Reset
  passwordReset: (data: PasswordResetEmailData) => {
    const resetUrl = data.resetLink || `${env.FRONTEND_URL}/auth?mode=reset&email=${encodeURIComponent(data.email)}`;
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          🔑
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Reset Your Password</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.5;">
          We received a request to reset the password for your RoomBae account (${data.email}).
        </p>
      </div>

      ${data.otp ? `
      <div style="background: #0f172a; border: 2px dashed #ef4444; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 10px; color: #f87171; font-family: monospace;">
          ${data.otp}
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #ef4444;">Expires in ${data.expiresInMinutes || 10} minutes</div>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: #ef4444; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px;">
          Set New Password
        </a>
      </div>

      <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px;">
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `;
    return bentoWrapper(content, { preheader: 'Reset your RoomBae password', categoryBadge: 'Security' });
  },

  // 4. Payment Receipt
  paymentReceipt: (data: PaymentReceiptEmailData) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.amount);
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          ✅
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Payment Successful</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Thank you, ${data.name}. Your rent payment has been received.</p>
      </div>

      <!-- Bento Transaction Amount Box -->
      <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</span>
        <div style="font-size: 36px; font-weight: 800; color: #34d399; margin: 6px 0;">${formattedAmount}</div>
        <span style="display: inline-block; padding: 2px 10px; background: rgba(16, 185, 129, 0.2); border-radius: 20px; font-size: 11px; font-weight: 700; color: #34d399;">
          STATUS: COMPLETED
        </span>
      </div>

      <!-- Bento Detail Rows -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px;">Invoice Number:</td>
          <td align="right" style="padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px; border-top: 1px solid #1f2937;">Transaction ID:</td>
          <td align="right" style="padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px; font-family: monospace; border-top: 1px solid #1f2937;">${data.transactionId}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px; border-top: 1px solid #1f2937;">Payment Method:</td>
          <td align="right" style="padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px; border-top: 1px solid #1f2937;">${data.paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #9ca3af; font-size: 13px; border-top: 1px solid #1f2937;">Date & Time:</td>
          <td align="right" style="padding: 8px 0; color: #ffffff; font-weight: 600; font-size: 13px; border-top: 1px solid #1f2937;">${new Date(data.paymentDate).toLocaleString('en-IN')}</td>
        </tr>
      </table>
    `;
    return bentoWrapper(content, { preheader: `Payment Receipt: ${formattedAmount} for ${data.invoiceNumber}`, categoryBadge: 'Payment Receipt' });
  },

  // 5. Invoice with PDF Notification
  invoice: (data: InvoiceEmailData) => {
    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.totalAmount);
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          📄
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Rental Invoice #${data.invoiceNumber}</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Due Date: <strong>${new Date(data.dueDate).toLocaleDateString('en-IN')}</strong></p>
      </div>

      <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Base Accommodation Fee:</td>
            <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px;">₹${data.breakdown.baseRent.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">CGST (9%):</td>
            <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px;">₹${data.breakdown.cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">SGST (9%):</td>
            <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px;">₹${data.breakdown.sgst.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 2px solid #374151;">
            <td style="padding: 12px 0 0 0; color: #ffffff; font-weight: 700; font-size: 15px;">Total Amount:</td>
            <td align="right" style="padding: 12px 0 0 0; color: #f59e0b; font-weight: 800; font-size: 18px;">${formattedTotal}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 12px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 10px; text-align: center;">
        <span style="font-size: 12px; color: #93c5fd;">📎 Your official GST Tax Invoice PDF is attached to this email.</span>
      </div>
    `;
    return bentoWrapper(content, { preheader: `Invoice #${data.invoiceNumber}: ${formattedTotal}`, categoryBadge: 'Tax Invoice' });
  },

  // 6. Payment Failed
  paymentFailed: (data: PaymentFailedEmailData) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.amount);
    const retryUrl = data.retryUrl || `${env.FRONTEND_URL}/billing`;
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          ⚠️
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Payment Attempt Failed</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Hello ${data.name}, your payment attempt of <strong style="color: #f87171;">${formattedAmount}</strong> could not be processed.</p>
      </div>

      <div style="background: #0f172a; border: 1px solid #374151; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">Reason:</div>
        <div style="font-size: 14px; color: #f87171; font-weight: 600; margin-top: 4px;">${data.failureReason || 'Transaction declined by issuer or payment gateway.'}</div>
      </div>

      <div style="text-align: center;">
        <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: #0f172a; font-weight: 700; text-decoration: none; border-radius: 10px;">
          Retry Payment Now
        </a>
      </div>
    `;
    return bentoWrapper(content, { preheader: 'Important: Payment attempt failed', categoryBadge: 'Payment Alert' });
  },

  // 7. Refund Confirmation
  refundConfirmation: (data: RefundEmailData) => {
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.refundAmount);
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          💸
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Refund Processed</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Your refund of <strong style="color: #34d399;">${formattedAmount}</strong> has been initiated.</p>
      </div>

      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 16px;">
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Refund Reference ID:</td>
          <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px; font-family: monospace;">${data.refundId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Original Transaction:</td>
          <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px; font-family: monospace;">${data.originalTransactionId}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Estimated Arrival:</td>
          <td align="right" style="color: #34d399; font-weight: 600; font-size: 13px;">5-7 Business Days</td>
        </tr>
      </table>
    `;
    return bentoWrapper(content, { preheader: `Refund Confirmed: ${formattedAmount}`, categoryBadge: 'Refund' });
  },

  // 8. Booking Confirmation
  bookingConfirmation: (data: BookingConfirmationEmailData) => {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          🏠
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Room Allocation Confirmed</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Congratulations ${data.name}! Your stay at <strong>${data.propertyName}</strong> is secured.</p>
      </div>

      <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Property Address:</td>
            <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px;">${data.propertyAddress}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Allocated Room / Bed:</td>
            <td align="right" style="color: #f59e0b; font-weight: 700; font-size: 13px;">Room ${data.roomNumber}${data.bedNumber ? ` (Bed ${data.bedNumber})` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Move-In Date:</td>
            <td align="right" style="color: #ffffff; font-weight: 600; font-size: 13px;">${new Date(data.moveInDate).toLocaleDateString('en-IN')}</td>
          </tr>
        </table>
      </div>
    `;
    return bentoWrapper(content, { preheader: `Booking Confirmed for ${data.propertyName}`, categoryBadge: 'Booking' });
  },

  // 9. Complaint Update
  complaintUpdate: (data: ComplaintEmailData) => {
    const isResolved = data.status.toUpperCase() === 'RESOLVED';
    const statusColor = isResolved ? '#10b981' : '#f59e0b';
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          🛠
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Ticket Update: ${data.ticketCode}</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Regarding: <strong>"${data.title}"</strong></p>
      </div>

      <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 12px; color: #9ca3af;">Current Status:</span>
          <span style="padding: 4px 10px; background: rgba(245, 158, 11, 0.15); border-radius: 12px; font-size: 12px; font-weight: 700; color: ${statusColor};">
            ● ${data.status}
          </span>
        </div>
        ${data.resolutionNotes ? `
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #1f2937;">
          <span style="font-size: 12px; color: #9ca3af; font-weight: 600;">Resolution Notes:</span>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #f3f4f6; line-height: 1.4;">${data.resolutionNotes}</p>
        </div>
        ` : ''}
      </div>
    `;
    return bentoWrapper(content, { preheader: `Update on Ticket ${data.ticketCode}: ${data.status}`, categoryBadge: 'Helpdesk' });
  },

  // 10. Support Reply
  supportReply: (data: SupportReplyEmailData) => {
    const content = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; font-size: 24px; margin-bottom: 16px;">
          💬
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff;">Support Reply: ${data.ticketCode}</h1>
        <p style="margin: 0; font-size: 14px; color: #9ca3af;">Response from <strong>${data.repliedBy}</strong></p>
      </div>

      <div style="background: #0f172a; border-left: 4px solid #3b82f6; border-radius: 0 14px 14px 0; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #f3f4f6; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
      </div>
    `;
    return bentoWrapper(content, { preheader: `Support Reply on ${data.ticketCode}`, categoryBadge: 'Support Reply' });
  },

  // 11. Newsletter
  newsletter: (data: { title: string; edition: string; highlights: Array<{ title: string; description: string }> }) => {
    const highlightsHtml = data.highlights.map(h => `
      <div style="background: #0f172a; border: 1px solid #1f2937; border-radius: 14px; padding: 18px; margin-bottom: 14px;">
        <strong style="font-size: 15px; color: #fbbf24; display: block; margin-bottom: 4px;">${h.title}</strong>
        <p style="margin: 0; font-size: 13px; color: #9ca3af; line-height: 1.5;">${h.description}</p>
      </div>
    `).join('');

    const content = `
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 700; color: #ffffff;">${data.title}</h1>
        <span style="font-size: 12px; font-weight: 600; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">Edition: ${data.edition}</span>
      </div>
      ${highlightsHtml}
    `;
    return bentoWrapper(content, { preheader: data.title, categoryBadge: 'Newsletter' });
  },

  // 12. Marketing Campaign
  marketingCampaign: (data: MarketingCampaignData) => {
    const content = `
      ${data.bannerUrl ? `
      <div style="margin: -36px -32px 24px -32px; overflow: hidden;">
        <img src="${data.bannerUrl}" alt="${data.title}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
      </div>
      ` : ''}
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${data.headline}</h1>
      </div>
      <div style="font-size: 14px; color: #d1d5db; line-height: 1.7; margin-bottom: 28px;">
        ${data.content}
      </div>
      ${data.ctaText && data.ctaUrl ? `
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="${data.ctaUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #f59e0b, #d97706); color: #0f172a; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px;">
          ${data.ctaText} &rarr;
        </a>
      </div>
      ` : ''}
    `;
    return bentoWrapper(content, { preheader: data.subject, categoryBadge: 'Announcements' });
  },
};
