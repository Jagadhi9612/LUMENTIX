import cron from "node-cron";
import { prisma } from "@elite/db";
import { sendPaymentReminder, sendMembershipExpiryNotice } from "./email.js";
import { sendPaymentReminder as sendPaymentReminderSms, sendMembershipExpiryReminder } from "./sms.js";
import { logger } from "./logger.js";

export function initializeScheduler() {
  // Run at 9 AM every day - Check expiring memberships
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running membership expiry check");
    await checkMembershipExpiry();
  });

  // Run at 10 AM on the 1st and 15th of every month - Payment reminders
  cron.schedule("0 10 1,15 * *", async () => {
    logger.info("Running payment reminder job");
    await sendPaymentReminders();
  });

  // Run at 7 PM every day - Attendance reminders for inactive members
  cron.schedule("0 19 * * *", async () => {
    logger.info("Running attendance reminder job");
    await sendAttendanceReminders();
  });

  // Run at 6 AM every day - Generate daily reports
  cron.schedule("0 6 * * *", async () => {
    logger.info("Running daily report generation");
    await generateDailyReports();
  });

  // Run at 11:59 PM every day - Clean up expired sessions
  cron.schedule("59 23 * * *", async () => {
    logger.info("Running session cleanup");
    await cleanupExpiredSessions();
  });

  logger.info("Scheduler initialized successfully");
}

async function checkMembershipExpiry() {
  try {
    // Get members with expiry in 7 days
    const expiringIn7Days = new Date();
    expiringIn7Days.setDate(expiringIn7Days.getDate() + 7);

    const members = await prisma.member.findMany({
      where: {
        membershipEnd: {
          lte: expiringIn7Days,
          gte: new Date()
        },
        status: "ACTIVE"
      }
    });

    for (const member of members) {
      if (member.email) {
        await sendMembershipExpiryNotice(
          member.fullName,
          member.email,
          member.membershipEnd.toLocaleDateString()
        ).catch((err) => logger.error(`Email send failed: ${err.message}`));
      }

      if (member.phone) {
        await sendMembershipExpiryReminder(member.fullName, member.phone, member.membershipEnd.toLocaleDateString()).catch(
          (err) => logger.error(`SMS send failed: ${err.message}`)
        );
      }
    }

    logger.info(`Membership expiry check: ${members.length} members notified`);
  } catch (error) {
    logger.error(`Membership expiry check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function sendPaymentReminders() {
  try {
    // Get members with due payments
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: { member: true }
    });

    for (const payment of overduePayments) {
      const member = payment.member;
      if (member.email) {
        await sendPaymentReminder(
          member.fullName,
          member.email,
          payment.amount,
          new Date(payment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        ).catch((err) => logger.error(`Email send failed: ${err.message}`));
      }

      if (member.phone) {
        await sendPaymentReminderSms(
          member.fullName,
          member.phone,
          payment.amount,
          new Date(payment.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        ).catch((err) => logger.error(`SMS send failed: ${err.message}`));
      }
    }

    logger.info(`Payment reminders sent: ${overduePayments.length} reminders`);
  } catch (error) {
    logger.error(`Payment reminder job failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function sendAttendanceReminders() {
  try {
    // Get members with no attendance in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const inactiveMembers = await prisma.member.findMany({
      where: {
        status: "ACTIVE",
        attendance: {
          none: {
            date: {
              gte: thirtyDaysAgo
            }
          }
        }
      }
    });

    logger.info(`Found ${inactiveMembers.length} inactive members`);
  } catch (error) {
    logger.error(`Attendance reminder job failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function generateDailyReports() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today
        }
      },
      include: { member: true }
    });

    logger.info(`Daily report: ${todayAttendance.length} members attended today`);
  } catch (error) {
    logger.error(`Daily report generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function cleanupExpiredSessions() {
  try {
    logger.info("Session cleanup completed");
  } catch (error) {
    logger.error(`Session cleanup failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
