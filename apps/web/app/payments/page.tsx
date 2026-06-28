"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { paymentDefaults, paymentFields, paymentSchema, type Payment } from "@/lib/module-config";

export default function PaymentsPage() {
  return (
    <ModuleManager<Payment>
      title="Payments"
      subtitle="Collection dashboard for cash, UPI, card, bank transfer, invoices, receipts, partials, advances and refunds"
      collectionName="payments"
      schema={paymentSchema}
      fields={[...paymentFields]}
      defaultValues={paymentDefaults}
      searchKeys={["memberId", "memberName", "invoiceNumber", "method", "status"]}
      columns={[
        { key: "invoiceNumber", label: "Invoice" },
        { key: "memberName", label: "Member" },
        { key: "method", label: "Method" },
        { key: "amount", label: "Amount" },
        { key: "paidAmount", label: "Paid" },
        { key: "pendingAmount", label: "Payment Due" },
        { key: "membershipEnd", label: "Last Day" },
        { key: "status", label: "Status" },
        { key: "paidAt", label: "Paid At" }
      ]}
      actions={[
        { label: "Mark Paid", value: { status: "Paid", pendingAmount: 0 } },
        { label: "Refund", value: { status: "Refunded" } }
      ]}
      layout="wide"
    />
  );
}
