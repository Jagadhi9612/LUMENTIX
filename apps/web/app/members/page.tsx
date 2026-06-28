"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { memberDefaults, memberFields, memberSchema, type Member } from "@/lib/module-config";

export default function MembersPage() {
  return (
    <ModuleManager<Member>
      title="Members"
      subtitle="Member dashboard, profile operations, alerts, history, membership controls and document uploads"
      collectionName="members"
      schema={memberSchema}
      fields={[...memberFields]}
      defaultValues={memberDefaults}
      searchKeys={["memberId", "fullName", "phone", "email", "packageName", "trainer"]}
      columns={[
        { key: "memberId", label: "Member ID" },
        { key: "fullName", label: "Name" },
        { key: "phone", label: "Phone" },
        { key: "packageName", label: "Package" },
        { key: "membershipEnd", label: "Paid Until" },
        { key: "latestPaymentStatus", label: "Payment" },
        { key: "pendingAmount", label: "Pending" },
        { key: "status", label: "Status" }
      ]}
      actions={[
        { label: "Suspend", value: { status: "Suspended" } },
        { label: "Activate", value: { status: "Active" } },
        { label: "Freeze", value: { status: "Frozen" } },
        { label: "Renew", value: { status: "Active", membershipStart: new Date().toISOString().slice(0, 10), membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) } }
      ]}
      layout="wide"
      detailPath={(record) => `/members/details?id=${record.id}`}
      uploadPath={(record) => `member-documents/${record.id}`}
    />
  );
}
