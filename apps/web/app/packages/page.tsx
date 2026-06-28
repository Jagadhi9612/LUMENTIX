"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { packageDefaults, packageFields, packageSchema, type GymPackage } from "@/lib/module-config";

export default function PackagesPage() {
  return (
    <ModuleManager<GymPackage>
      title="Packages"
      subtitle="Package dashboard for Monthly, Quarterly, Half Yearly, Yearly, Premium, Elite, PT, Corporate and Student plans"
      collectionName="packages"
      schema={packageSchema}
      fields={[...packageFields]}
      defaultValues={packageDefaults}
      searchKeys={["name", "description", "facilities", "status"]}
      columns={[
        { key: "name", label: "Package" },
        { key: "durationDays", label: "Days" },
        { key: "price", label: "Price" },
        { key: "discount", label: "Discount" },
        { key: "gst", label: "GST" },
        { key: "status", label: "Status" }
      ]}
      actions={[
        { label: "Deactivate", value: { status: "Inactive" } },
        { label: "Activate", value: { status: "Active" } }
      ]}
    />
  );
}
