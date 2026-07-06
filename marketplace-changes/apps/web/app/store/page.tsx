"use client";

import { ModuleManager } from "@/components/modules/module-manager";
import { productDefaults, productFields, productSchema } from "@/lib/module-config";
import type { Product } from "@/lib/firebase-types";

export default function StorePage() {
  return (
    <ModuleManager<Product>
      title="Store"
      subtitle="Marketplace product catalog — supplements, equipment, apparel, diet & workout plans"
      collectionName="products"
      schema={productSchema}
      fields={[...productFields]}
      defaultValues={productDefaults}
      searchKeys={["name", "category", "sku"]}
      columns={[
        { key: "name", label: "Product" },
        { key: "category", label: "Category" },
        { key: "price", label: "Price" },
        { key: "stock", label: "Stock" },
        { key: "active", label: "Active" }
      ]}
      actions={[
        { label: "Deactivate", value: { active: false } },
        { label: "Activate", value: { active: true } }
      ]}
    />
  );
}
