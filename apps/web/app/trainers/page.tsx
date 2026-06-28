"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { trainerDefaults, trainerFields, trainerSchema, type Trainer } from "@/lib/module-config";

export default function TrainersPage() {
  return (
    <ModuleManager<Trainer>
      title="Trainers"
      subtitle="Trainer dashboard for profiles, assignments, salary, certificates, attendance and specialization"
      collectionName="trainers"
      schema={trainerSchema}
      fields={[...trainerFields]}
      defaultValues={trainerDefaults}
      searchKeys={["name", "phone", "email", "specialization", "status"]}
      columns={[
        { key: "name", label: "Trainer" },
        { key: "phone", label: "Phone" },
        { key: "specialization", label: "Specialization" },
        { key: "experience", label: "Experience" },
        { key: "salary", label: "Salary" },
        { key: "status", label: "Status" }
      ]}
      actions={[
        { label: "Deactivate", value: { status: "Inactive" } },
        { label: "Activate", value: { status: "Active" } }
      ]}
    />
  );
}
