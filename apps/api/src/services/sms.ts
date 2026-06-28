import twilio from "twilio";
import { config } from "../config.js";

let twilioClient: ReturnType<typeof twilio> | null;

export function initializeSmsService() {
  if (!config.sms.accountSid || !config.sms.authToken) {
    console.warn("SMS service not configured - skipping Twilio initialization");
    return;
  }

  twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
}

export interface SmsOptions {
  to: string;
  message: string;
}

export async function sendSms(options: SmsOptions): Promise<void> {
  if (!twilioClient || !config.sms.phoneNumber) {
    console.warn("SMS service not configured");
    return;
  }

  try {
    await twilioClient.messages.create({
      body: options.message,
      from: config.sms.phoneNumber,
      to: options.to
    });
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}

export async function sendAttendanceReminder(memberName: string, phone: string): Promise<void> {
  const message = `Hi ${memberName}, We haven't seen you at Elite Fitness in a while! Come back and achieve your fitness goals. Visit us soon!`;
  await sendSms({ to: phone, message });
}

export async function sendPaymentReminder(
  memberName: string,
  phone: string,
  amount: number,
  dueDate: string
): Promise<void> {
  const message = `Hi ${memberName}, Reminder: Your Elite Fitness payment of ₹${amount} is due on ${dueDate}. Please make the payment at the earliest.`;
  await sendSms({ to: phone, message });
}

export async function sendMembershipExpiryReminder(
  memberName: string,
  phone: string,
  expiryDate: string
): Promise<void> {
  const message = `Hi ${memberName}, Your Elite Fitness membership will expire on ${expiryDate}. Renew now to continue enjoying premium facilities!`;
  await sendSms({ to: phone, message });
}

export async function sendWelcomeSms(memberName: string, phone: string, memberId: string): Promise<void> {
  const message = `Welcome to Elite Fitness, ${memberName}! Your Member ID is ${memberId}. Start your fitness journey with us today!`;
  await sendSms({ to: phone, message });
}
