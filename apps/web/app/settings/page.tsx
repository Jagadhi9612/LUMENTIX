"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { z } from "zod";
import type { GymSettings } from "@/lib/firebase-types";

const settingsSchema = z.object({
  gymName: z.string().min(2),
  addressLine1: z.string().min(2),
  addressLine2: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  businessHours: z.string().min(2),
  invoicePrefix: z.string().min(2),
  gst: z.coerce.number().min(0),
  upiId: z.string().optional(),
  renewalPaymentUrl: z.string().url().optional().or(z.literal(""))
});

const settingsDefaults = {
  gymName: "ELITE FITNESS",
  addressLine1: "LALACHERUV",
  addressLine2: "RAJAHMUNDRY",
  city: "RAJAHMUNDRY",
  state: "ANDHRA PRADESH",
  phone: "",
  email: "",
  businessHours: "5:00 AM - 10:00 PM",
  invoicePrefix: "EF-INV",
  gst: 18,
  upiId: "",
  renewalPaymentUrl: ""
};

const settingsFields = [
  { name: "gymName", label: "Gym Name" },
  { name: "addressLine1", label: "Address" },
  { name: "addressLine2", label: "Address Line 2" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "businessHours", label: "Business Hours" },
  { name: "invoicePrefix", label: "Invoice Prefix" },
  { name: "gst", label: "GST", type: "number" },
  { name: "upiId", label: "UPI ID" },
  { name: "renewalPaymentUrl", label: "Renewal Payment URL" }
] as const;

export default function SettingsPage() {
  return (
    <ModuleManager<GymSettings>
      title="Settings"
      subtitle="Gym profile, invoice settings, tax settings, Firebase configuration, backup and restore controls"
      collectionName="settings"
      schema={settingsSchema}
      fields={[...settingsFields]}
      defaultValues={settingsDefaults}
      searchKeys={["gymName", "city", "state", "email"]}
      columns={[
        { key: "gymName", label: "Gym" },
        { key: "addressLine1", label: "Address" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "invoicePrefix", label: "Invoice" },
        { key: "gst", label: "GST" }
      ]}
      uploadPath={() => "settings"}
    />
  );
}
