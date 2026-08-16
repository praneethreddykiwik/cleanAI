import nodemailer from 'nodemailer';
import { logger } from './logger';
import { addJob } from './bullmq';

const isSmtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

if (isSmtpConfigured) {
  logger.info('SMTP Mail Service initialized successfully.');
} else {
  logger.warn('SMTP configurations missing. Email dispatches will fall back to logging.');
}

export type EmailTemplateName =
  | 'WELCOME'
  | 'VERIFY_EMAIL'
  | 'PASSWORD_RESET'
  | 'BOOKING_CONFIRMATION'
  | 'BOOKING_UPDATE'
  | 'INVOICE'
  | 'PAYMENT_RECEIPT'
  | 'VENDOR_APPROVAL'
  | 'SUPPORT_REPLY';

export interface EmailPayload {
  to: string;
  subject: string;
  template: EmailTemplateName;
  context: Record<string, any>;
}

// ----------------------------------------------------
// HTML Email Templates Builder
// ----------------------------------------------------
function buildEmailTemplate(template: EmailTemplateName, context: Record<string, any>): string {
  const brandColor = '#4f46e5';
  const logo = 'Criska CleanAI';

  const baseHeader = `
    <div style="background-color: ${brandColor}; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: white; margin: 0; font-family: sans-serif; font-size: 22px;">${logo}</h1>
    </div>
  `;

  const baseFooter = `
    <div style="text-align: center; padding: 16px; font-size: 11px; color: #71717a; font-family: sans-serif; border-top: 1px solid #e4e4e7; margin-top: 24px;">
      <p style="margin: 0;">© ${new Date().getFullYear()} CleanAI Platform. All rights reserved.</p>
      <p style="margin: 4px 0 0 0;">Bangalore, Karnataka, India.</p>
    </div>
  `;

  let body = '';

  switch (template) {
    case 'WELCOME':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Welcome, ${context.name}!</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Thank you for joining CleanAI. We connect you with top verified local vendors for premium home cleaning services.
        </p>
      `;
      break;
    case 'VERIFY_EMAIL':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Verify Your Email Address</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Please use the link below to verify your email address and activate your account profile:
        </p>
        <div style="margin: 20px 0;">
          <a href="${context.url}" style="background-color: ${brandColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 13px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
      `;
      break;
    case 'PASSWORD_RESET':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Reset Your Password</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          You requested a password reset. Click the button below to configure a new password. If you didn't request this, ignore this email.
        </p>
        <div style="margin: 20px 0;">
          <a href="${context.url}" style="background-color: ${brandColor}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-family: sans-serif; font-size: 13px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
      `;
      break;
    case 'BOOKING_CONFIRMATION':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Booking Confirmed! 🎉</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Your service booking <strong>#${context.bookingNumber}</strong> has been confirmed.
        </p>
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; font-family: sans-serif; font-size: 13px; color: #27272a; margin-top: 16px;">
          <p style="margin: 0 0 6px 0;"><strong>Service:</strong> ${context.serviceName}</p>
          <p style="margin: 0 0 6px 0;"><strong>Scheduled:</strong> ${context.date} (${context.time})</p>
          <p style="margin: 0;"><strong>Total Amount:</strong> ₹${context.amount}</p>
        </div>
      `;
      break;
    case 'BOOKING_UPDATE':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Booking Update Alert</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Booking <strong>#${context.bookingNumber}</strong> status changed: <strong>${context.status}</strong>.
        </p>
        <p style="color: #71717a; font-family: sans-serif; font-size: 13px; font-style: italic;">
          Notes: ${context.notes || 'No notes left.'}
        </p>
      `;
      break;
    case 'INVOICE':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Tax Invoice Issued</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Invoice <strong>#${context.invoiceNumber}</strong> has been generated for service booking #${context.bookingNumber}.
        </p>
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; font-family: sans-serif; font-size: 13px; color: #27272a; margin-top: 16px;">
          <p style="margin: 0 0 6px 0;"><strong>Platform Fee:</strong> ₹${context.platformFee}</p>
          <p style="margin: 0 0 6px 0;"><strong>Tax (GST):</strong> ₹${context.gstAmount}</p>
          <p style="margin: 0;"><strong>Paid Total:</strong> ₹${context.amount}</p>
        </div>
      `;
      break;
    case 'PAYMENT_RECEIPT':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Payment Receipt</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Payment received for order <strong>#${context.paymentId}</strong>.
        </p>
      `;
      break;
    case 'VENDOR_APPROVAL':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">Vendor Account Approved! 🚀</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Congratulations! Your vendor profile has been verified and approved by the admin board. You can now bid on and accept cleaning bookings.
        </p>
      `;
      break;
    case 'SUPPORT_REPLY':
      body = `
        <h2 style="color: #18181b; font-family: sans-serif; font-size: 18px;">New Support Message</h2>
        <p style="color: #3f3f46; font-family: sans-serif; font-size: 14px; line-height: 1.5;">
          Our support desk has replied to your query:
        </p>
        <p style="background-color: #f4f4f5; padding: 12px; border-radius: 6px; font-family: sans-serif; font-size: 13px; color: #27272a; font-style: italic;">
          "${context.message}"
        </p>
      `;
      break;
  }

  return `
    <div style="background-color: #fafafa; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      ${baseHeader}
      <div style="background-color: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e4e4e7; border-top: none;">
        ${body}
        ${baseFooter}
      </div>
    </div>
  `;
}

// ----------------------------------------------------
// Public Dispatch Helpers
// ----------------------------------------------------

/**
 * Queue email dispatch asynchronously using BullMQ
 */
export async function queueEmail(payload: EmailPayload) {
  logger.info(`[Email Service] Queueing email dispatch to ${payload.to}`);
  await addJob('EmailQueue', 'send-email', payload);
}

/**
 * Synchronous dispatch (usually invoked inside the BullMQ Worker)
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const htmlContent = buildEmailTemplate(payload.template, payload.context);

  if (!isSmtpConfigured || !transporter) {
    logger.info(`[SMTP Mock Dispatch] To: ${payload.to} | Subject: ${payload.subject}`);
    logger.debug(`[SMTP Mock Body]:\n${htmlContent}`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"CleanAI Support" <support@cleanai.com>',
      to: payload.to,
      subject: payload.subject,
      html: htmlContent,
    });
    logger.info(`[SMTP Mailer] Sent email to ${payload.to}. Message ID: ${info.messageId}`);
    return true;
  } catch (err: any) {
    logger.error(`[SMTP Mailer] Failed to deliver email to ${payload.to}:`, err);
    throw err;
  }
}
