import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.js";

let transporter: Transporter;

export function initializeEmailService() {
  if (!config.email.user || !config.email.password) {
    console.warn("Email service not configured - using log transport");
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      logger: true
    });
    return;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password
    }
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateData?: Record<string, unknown>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!transporter) {
    console.warn("Email service not initialized");
    return;
  }

  try {
    await transporter.sendMail({
      from: `${config.email.fromName} <${config.email.from}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export async function sendWelcomeEmail(memberName: string, email: string, memberId: string): Promise<void> {
  const html = `
    <h2>Welcome to Elite Fitness!</h2>
    <p>Hi ${memberName},</p>
    <p>Welcome to our premium gym community. Your member ID is: <strong>${memberId}</strong></p>
    <p>You can access your member portal to view your membership details, attendance, and trainer information.</p>
    <p>Best regards,<br/>Elite Fitness Team</p>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Elite Fitness",
    html
  });
}

export async function sendPaymentReminder(
  memberName: string,
  email: string,
  amount: number,
  dueDate: string
): Promise<void> {
  const html = `
    <h2>Payment Reminder</h2>
    <p>Hi ${memberName},</p>
    <p>This is a reminder that your payment of <strong>₹${amount}</strong> is due on <strong>${dueDate}</strong>.</p>
    <p>Please make the payment at your earliest convenience to continue your membership benefits.</p>
    <p>Best regards,<br/>Elite Fitness Team</p>
  `;

  await sendEmail({
    to: email,
    subject: "Payment Reminder - Elite Fitness",
    html
  });
}

export async function sendAttendanceReminder(memberName: string, email: string): Promise<void> {
  const html = `
    <h2>Attendance Reminder</h2>
    <p>Hi ${memberName},</p>
    <p>We haven't seen you at the gym in a while. Come back and stay fit!</p>
    <p>Visit us soon and make the most of your membership.</p>
    <p>Best regards,<br/>Elite Fitness Team</p>
  `;

  await sendEmail({
    to: email,
    subject: "We Miss You - Elite Fitness",
    html
  });
}

export async function sendMembershipExpiryNotice(
  memberName: string,
  email: string,
  expiryDate: string
): Promise<void> {
  const html = `
    <h2>Membership Expiry Notice</h2>
    <p>Hi ${memberName},</p>
    <p>Your membership with Elite Fitness will expire on <strong>${expiryDate}</strong>.</p>
    <p>Please renew your membership to continue enjoying our premium facilities and services.</p>
    <p>Best regards,<br/>Elite Fitness Team</p>
  `;

  await sendEmail({
    to: email,
    subject: "Membership Expiry Notice - Elite Fitness",
    html
  });
}
