"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { attendanceDefaults, attendanceFields, attendanceSchema, type Attendance } from "@/lib/module-config";

export default function AttendancePage() {
  return (
    <ModuleManager<Attendance>
      title="Attendance"
      subtitle="Realtime check-in, check-out, QR-ready, barcode-ready and manual attendance operations"
      collectionName="attendance"
      schema={attendanceSchema}
      fields={[...attendanceFields]}
      defaultValues={attendanceDefaults}
      searchKeys={["memberId", "memberName", "source", "status"]}
      columns={[
        { key: "memberId", label: "Member ID" },
        { key: "memberName", label: "Member" },
        { key: "source", label: "Source" },
        { key: "checkInAt", label: "Check In" },
        { key: "checkOutAt", label: "Check Out" },
        { key: "status", label: "Status" }
      ]}
      actions={[
        { label: "Check Out", value: { status: "Checked Out", checkOutAt: new Date().toISOString().slice(0, 16) } },
        { label: "Late", value: { status: "Late" } }
      ]}
    />
  );
}
