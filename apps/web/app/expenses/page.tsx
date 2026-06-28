"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { expenseDefaults, expenseFields, expenseSchema, type Expense } from "@/lib/module-config";

export default function ExpensesPage() {
  return (
    <ModuleManager<Expense>
      title="Expenses"
      subtitle="Expense dashboard for electricity, rent, equipment, salary, maintenance, marketing, cleaning, water and internet"
      collectionName="expenses"
      schema={expenseSchema}
      fields={[...expenseFields]}
      defaultValues={expenseDefaults}
      searchKeys={["category", "vendor", "description"]}
      columns={[
        { key: "category", label: "Category" },
        { key: "vendor", label: "Vendor" },
        { key: "amount", label: "Amount" },
        { key: "description", label: "Description" },
        { key: "spentAt", label: "Spent At" }
      ]}
    />
  );
}
