"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { notificationDefaults, notificationFields, notificationSchema, type NotificationRecord } from "@/lib/module-config";

export default function NotificationsPage() {
  return (
    <ModuleManager<NotificationRecord>
      title="Notifications"
      subtitle="Realtime notification center for expiry, birthday, payment, offer and system alerts"
      collectionName="notifications"
      schema={notificationSchema}
      fields={[...notificationFields]}
      defaultValues={notificationDefaults}
      searchKeys={["title", "message", "type", "memberId", "memberName", "paymentStatus"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        { key: "memberName", label: "Member" },
        { key: "membershipEnd", label: "Expiry" },
        { key: "paymentStatus", label: "Payment" },
        { key: "pendingAmount", label: "Pending" },
        { key: "audience", label: "Audience" },
        { key: "deliveryStatus", label: "Delivery" },
        { key: "createdAt", label: "Created" }
      ]}
      actions={[
        { label: "Mark Read", value: { read: true } },
        { label: "Mark Unread", value: { read: false } }
      ]}
    />
  );
}
