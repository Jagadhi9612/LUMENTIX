import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore, type DocumentData } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { z } from "zod";
import { createHash } from "node:crypto";

initializeApp();

const db = getFirestore();

const STAFF_ROLES = ["SUPER_ADMIN", "GYM_MANAGER", "RECEPTIONIST", "TRAINER", "ACCOUNTANT"] as const;
const SYSTEM_ROLES = ["SUPER_ADMIN", "GYM_MANAGER"] as const;

const auditSchema = z.object({
  action: z.string().trim().min(2).max(80),
  entity: z.string().trim().min(2).max(80),
  entityId: z.string().trim().max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

const staffClaimSchema = z.object({
  uid: z.string().trim().min(8),
  role: z.enum(STAFF_ROLES),
  displayName: z.string().trim().max(120).optional()
});

const memberDeviceSchema = z.object({
  memberId: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(24),
  token: z.string().trim().min(20),
  platform: z.string().trim().max(400).optional()
});

type PaymentStatus = "Paid" | "Partial" | "Pending" | "Refunded" | "No Payment";

type LatestPayment = {
  id: string;
  status: PaymentStatus;
  paidAt: string;
  type: string;
  pendingAmount: number;
  invoiceNumber?: string;
};

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } }) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in with a Firebase staff account.");
  }

  return request.auth;
}

async function getRole(uid: string, token: Record<string, unknown>) {
  if (typeof token.role === "string") {
    return token.role;
  }

  const userSnapshot = await db.collection("users").doc(uid).get();
  return userSnapshot.exists ? userSnapshot.get("role") : null;
}

async function requireSystemRole(request: { auth?: { uid: string; token: Record<string, unknown> } }) {
  const auth = requireAuth(request);
  const role = await getRole(auth.uid, auth.token);

  if (!SYSTEM_ROLES.includes(role as (typeof SYSTEM_ROLES)[number])) {
    throw new HttpsError("permission-denied", "Only system administrators can perform this action.");
  }

  return { uid: auth.uid, role };
}

function digits(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}

function phoneMatches(input: string, stored: unknown) {
  const left = digits(input);
  const right = digits(stored);
  return left.length >= 8 && right.length >= 8 && left.slice(-8) === right.slice(-8);
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(value: unknown) {
  const raw = String(value || "").slice(0, 10);
  const date = raw ? new Date(`${raw}T00:00:00.000Z`) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function addDays(date: Date, days: number) {
  const output = new Date(date);
  output.setUTCDate(output.getUTCDate() + days);
  return output;
}

function reminderWindow(date = new Date()) {
  return date.getHours() < 12 ? "morning" : "evening";
}

function tokenDocId(memberId: string, token: string) {
  const hash = createHash("sha256").update(token).digest("hex").slice(0, 24);
  return `${memberId.replace(/[^a-zA-Z0-9_-]/g, "-")}_${hash}`;
}

async function getPaymentSettings() {
  const snapshot = await db.collection("settings").limit(1).get();
  const settings = snapshot.empty ? {} : snapshot.docs[0].data();
  const paymentUrl = typeof settings.renewalPaymentUrl === "string" ? settings.renewalPaymentUrl.trim() : "";
  const upiId = typeof settings.upiId === "string" ? settings.upiId.trim() : "";

  return {
    paymentUrl,
    upiId,
    renewalUrl:
      paymentUrl ||
      (upiId
        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(String(settings.gymName || "ELITE FITNESS"))}&cu=INR`
        : "")
  };
}

async function getLatestPayment(memberId: string): Promise<LatestPayment | null> {
  const snapshot = await db.collection("payments").where("memberId", "==", memberId).limit(25).get();
  if (snapshot.empty) {
    return null;
  }

  const payments = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: String(data.status || "No Payment") as PaymentStatus,
        paidAt: String(data.paidAt || data.createdAt || ""),
        type: String(data.type || ""),
        pendingAmount: Number(data.pendingAmount || 0),
        invoiceNumber: String(data.invoiceNumber || "")
      };
    })
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));

  return payments[0];
}

async function getPackageDuration(memberPackage: unknown) {
  const packageName = String(memberPackage || "").trim();
  if (!packageName) {
    return 30;
  }

  const snapshot = await db.collection("packages").where("name", "==", packageName).limit(1).get();
  if (snapshot.empty) {
    return 30;
  }

  const duration = Number(snapshot.docs[0].get("durationDays") || 30);
  return Number.isFinite(duration) && duration > 0 ? duration : 30;
}

async function applyPaidSubscription(paymentId: string, payment: DocumentData, before?: DocumentData) {
  const status = String(payment.status || "");
  const type = String(payment.type || "");
  const memberId = String(payment.memberId || "").trim();

  if (status !== "Paid" || !["Admission", "Renewal"].includes(type) || !memberId) {
    return { applied: false, reason: "not-paid-subscription" };
  }

  if (
    before &&
    String(before.status || "") === "Paid" &&
    String(before.type || "") === type &&
    String(before.memberId || "") === memberId &&
    String(before.paidAt || "") === String(payment.paidAt || "")
  ) {
    return { applied: false, reason: "already-paid" };
  }

  const memberSnapshot = await db.collection("members").where("memberId", "==", memberId).limit(1).get();
  if (memberSnapshot.empty) {
    return { applied: false, reason: "member-not-found" };
  }

  const memberDoc = memberSnapshot.docs[0];
  const member = memberDoc.data();
  const paidDate = parseDateKey(payment.paidAt || payment.createdAt);
  const currentEnd = member.membershipEnd ? parseDateKey(member.membershipEnd) : null;
  const durationDays = await getPackageDuration(member.packageName);
  const baseStart =
    type === "Renewal" && currentEnd && currentEnd >= paidDate
      ? addDays(currentEnd, 1)
      : paidDate;
  const membershipStart = todayKey(baseStart);
  const membershipEnd = todayKey(addDays(baseStart, durationDays - 1));
  const pendingAmount = Number(payment.pendingAmount || 0);

  await memberDoc.ref.set(
    {
      membershipStart,
      membershipEnd,
      status: "Active",
      latestPaymentStatus: "Paid",
      latestPaymentDate: todayKey(paidDate),
      latestInvoice: String(payment.invoiceNumber || ""),
      latestPaymentId: paymentId,
      pendingAmount,
      ...(type === "Renewal" ? { lastRenewalPaymentId: paymentId } : {}),
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await db.collection("payments").doc(paymentId).set(
    {
      membershipStart,
      membershipEnd,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await db.collection("notifications").doc(`staff-payment-${paymentId}`).set(
    {
      title: "Subscription payment received",
      message: `${String(member.fullName || payment.memberName || "Member")} paid ${String(payment.type || "subscription")} fee. Last day is ${membershipEnd}.`,
      type: "Payment Reminder",
      audience: "staff",
      read: false,
      memberId,
      memberName: String(member.fullName || payment.memberName || ""),
      membershipEnd,
      paymentStatus: "Paid",
      paymentId,
      pendingAmount,
      paymentAction: "Subscription extended",
      deliveryStatus: "queued",
      createdAt: todayKey(),
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { applied: true, memberId, membershipEnd };
}

function notificationMessage(fullName: string, membershipEnd: string, paymentStatus: PaymentStatus, hasPaymentUrl: boolean) {
  const paymentCopy = hasPaymentUrl ? "Tap Pay/Renew Plan to complete your renewal." : "Please pay at the gym or contact staff to renew.";
  return `Hi ${fullName}, your Elite Fitness plan expires on ${membershipEnd}. Payment status: ${paymentStatus}. ${paymentCopy}`;
}

function webSafeReminderLink(url: string) {
  return url.startsWith("https://") || url.startsWith("http://") ? url : "https://elite-fitness-2026.web.app/dashboard";
}

export const health = onRequest({ cors: true, invoker: "public" }, (_request, response) => {
  response.json({
    status: "ok",
    service: "elite-fitness-functions",
    timestamp: new Date().toISOString()
  });
});

export const recordAudit = onCall({ cors: true, invoker: "public" }, async (request) => {
  const auth = requireAuth(request);
  const payload = auditSchema.parse(request.data);

  await db.collection("auditLogs").add({
    action: payload.action,
    entity: payload.entity,
    entityId: payload.entityId ?? "",
    metadata: payload.metadata ?? {},
    uid: auth.uid,
    email: typeof auth.token.email === "string" ? auth.token.email : "",
    source: "cloud-function",
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const syncStaffClaims = onCall({ cors: true, invoker: "public" }, async (request) => {
  await requireSystemRole(request);
  const payload = staffClaimSchema.parse(request.data);
  const user = await getAuth().getUser(payload.uid);

  await getAuth().setCustomUserClaims(payload.uid, {
    role: payload.role,
    staff: true
  });

  await db.collection("users").doc(payload.uid).set(
    {
      email: user.email ?? "",
      displayName: payload.displayName ?? user.displayName ?? "",
      role: payload.role,
      staff: true,
      updatedAt: new Date().toISOString(),
      serverUpdatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await db.collection("auditLogs").add({
    action: "SYNC_STAFF_CLAIMS",
    entity: "users",
    entityId: payload.uid,
    metadata: { role: payload.role },
    uid: request.auth?.uid ?? "",
    email: typeof request.auth?.token.email === "string" ? request.auth.token.email : "",
    source: "cloud-function",
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, uid: payload.uid, role: payload.role };
});

export const registerMemberDevice = onCall({ cors: true, invoker: "public" }, async (request) => {
  const payload = memberDeviceSchema.parse(request.data);
  const snapshot = await db.collection("members").where("memberId", "==", payload.memberId).limit(1).get();

  if (snapshot.empty) {
    throw new HttpsError("not-found", "No member found for this member ID.");
  }

  const memberDoc = snapshot.docs[0];
  const member = memberDoc.data();
  if (!phoneMatches(payload.phone, member.phone) && !phoneMatches(payload.phone, member.whatsapp)) {
    throw new HttpsError("permission-denied", "Member ID and phone number do not match.");
  }

  const fullName = String(member.fullName || "Elite Member");
  const membershipEnd = String(member.membershipEnd || "");
  const latestPayment = await getLatestPayment(payload.memberId);
  const settings = await getPaymentSettings();

  await db.collection("memberDevices").doc(tokenDocId(payload.memberId, payload.token)).set(
    {
      memberId: payload.memberId,
      memberDocId: memberDoc.id,
      phoneLast4: digits(payload.phone).slice(-4),
      token: payload.token,
      platform: payload.platform || "",
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  await db.collection("auditLogs").add({
    action: "REGISTER_MEMBER_DEVICE",
    entity: "memberDevices",
    entityId: payload.memberId,
    metadata: { memberId: payload.memberId, phoneLast4: digits(payload.phone).slice(-4) },
    uid: "",
    email: "",
    source: "cloud-function",
    createdAt: FieldValue.serverTimestamp()
  });

  const paymentStatus = latestPayment?.status ?? "No Payment";

  return {
    memberId: payload.memberId,
    fullName,
    membershipEnd,
    paymentStatus,
    paymentId: latestPayment?.id ?? "",
    paymentUrl: settings.renewalUrl,
    reminderMessage: membershipEnd
      ? notificationMessage(fullName, membershipEnd, paymentStatus, Boolean(settings.renewalUrl))
      : "Your device is linked. Staff will add membership expiry date before reminders can start."
  };
});

export const syncSubscriptionFromPayment = onDocumentWritten("payments/{paymentId}", async (event) => {
  const after = event.data?.after.exists ? event.data.after.data() : null;
  if (!after) {
    return;
  }

  const before = event.data?.before.exists ? event.data.before.data() : undefined;
  const result = await applyPaidSubscription(event.params.paymentId, after, before);
  logger.info("Payment subscription sync completed", result);
});

export const checkMembershipExpiry = onSchedule(
  { schedule: "0 9,18 * * *", timeZone: "Asia/Kolkata" },
  async () => {
    const today = new Date();
    const soon = new Date(today);
    soon.setDate(today.getDate() + 7);
    const runDate = todayKey(today);
    const windowName = reminderWindow(today);
    const settings = await getPaymentSettings();

    const snapshot = await db
      .collection("members")
      .where("status", "==", "Active")
      .where("membershipEnd", ">=", todayKey(today))
      .where("membershipEnd", "<=", todayKey(soon))
      .limit(250)
      .get();

    let sent = 0;
    let skippedNoDevice = 0;
    let failed = 0;

    for (const memberDoc of snapshot.docs) {
      const member = memberDoc.data();
      const memberId = String(member.memberId || memberDoc.id);
      const fullName = String(member.fullName || "Elite Member");
      const membershipEnd = String(member.membershipEnd || "");
      const latestPayment = await getLatestPayment(memberId);

      const paymentStatus = latestPayment?.status ?? "No Payment";
      const pendingAmount = Number(latestPayment?.pendingAmount || member.pendingAmount || 0);
      const message = notificationMessage(fullName, membershipEnd, paymentStatus, Boolean(settings.renewalUrl));
      const notificationId = `expiry-${memberId.replace(/[^a-zA-Z0-9_-]/g, "-")}-${runDate}-${windowName}`;
      const staffNotificationId = `staff-${notificationId}`;
      const devices = await db.collection("memberDevices").where("memberId", "==", memberId).where("active", "==", true).limit(25).get();
      const tokens = devices.docs.map((doc) => String(doc.get("token") || "")).filter(Boolean);
      const baseNotification = {
        title: "Plan expiring soon",
        message,
        type: "Membership Expiry",
        read: false,
        memberId,
        memberName: fullName,
        membershipEnd,
        paymentStatus,
        paymentId: latestPayment?.id ?? "",
        paymentUrl: settings.renewalUrl,
        reminderWindow: windowName,
        scheduledFor: `${runDate} ${windowName}`,
        pendingAmount,
        paymentAction: paymentStatus === "Paid" ? "Collect next renewal" : "Collect pending payment",
        createdAt: runDate,
        updatedAt: new Date().toISOString(),
        serverUpdatedAt: FieldValue.serverTimestamp()
      };

      await db.collection("notifications").doc(staffNotificationId).set(
        {
          ...baseNotification,
          title: "Admin renewal follow-up",
          message: `${fullName} (${memberId}, ${String(member.phone || "no phone")}) plan last day is ${membershipEnd}. Payment status: ${paymentStatus}. Pending: ${pendingAmount}.`,
          audience: "staff",
          deliveryStatus: "queued"
        },
        { merge: true }
      );

      if (!tokens.length) {
        skippedNoDevice += 1;
        await db.collection("notifications").doc(notificationId).set(
          {
            ...baseNotification,
            audience: "member",
            deliveryStatus: "skipped",
            deliveryNote: "Member has not linked a device for app notifications."
          },
          { merge: true }
        );
        continue;
      }

      try {
        const response = await getMessaging().sendEachForMulticast({
          tokens,
          notification: {
            title: "Plan expiring soon",
            body: message
          },
          data: {
            url: webSafeReminderLink(settings.renewalUrl),
            tag: notificationId,
            memberId,
            membershipEnd,
            paymentStatus
          },
          webpush: {
            fcmOptions: {
              link: webSafeReminderLink(settings.renewalUrl)
            }
          }
        });

        sent += response.successCount;
        failed += response.failureCount;
        await db.collection("notifications").doc(notificationId).set(
          {
            ...baseNotification,
            audience: "member",
            deliveryStatus: response.successCount > 0 ? "sent" : "failed",
            deliverySuccessCount: response.successCount,
            deliveryFailureCount: response.failureCount
          },
          { merge: true }
        );
      } catch (error) {
        failed += 1;
        await db.collection("notifications").doc(notificationId).set(
          {
            ...baseNotification,
            audience: "member",
            deliveryStatus: "failed",
            deliveryError: error instanceof Error ? error.message : "Unknown send failure"
          },
          { merge: true }
        );
      }
    }

    await db.collection("systemJobs").add({
      name: "checkMembershipExpiry",
      status: "completed",
      matchedMembers: snapshot.size,
      sent,
      skippedNoDevice,
      failed,
      runDate,
      reminderWindow: windowName,
      createdAt: FieldValue.serverTimestamp()
    });

    logger.info("Membership expiry reminders completed", { matchedMembers: snapshot.size, sent, skippedNoDevice, failed });
  }
);

export const dailyFirestoreExport = onSchedule(
  { schedule: "every day 02:00", timeZone: "Asia/Kolkata" },
  async () => {
    await db.collection("systemJobs").add({
      name: "dailyFirestoreExport",
      status: "recorded",
      note: "Configure a Google Cloud Storage export bucket before enabling managed exports.",
      createdAt: FieldValue.serverTimestamp()
    });

    logger.info("Daily Firestore export checkpoint recorded", {
      recordedAt: Timestamp.now().toDate().toISOString()
    });
  }
);
