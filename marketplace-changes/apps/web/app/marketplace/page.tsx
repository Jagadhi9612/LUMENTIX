"use client";

import { orderBy, where, type QueryConstraint } from "firebase/firestore";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { MemberGuard } from "@/components/auth/member-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { formatINR } from "@/lib/marketplace";
import type { Product, ProductCategory } from "@/lib/firebase-types";

const CATEGORIES: { value: ProductCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "supplements", label: "Supplements" },
  { value: "equipment", label: "Equipment" },
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "diet-plans", label: "Diet Plans" },
  { value: "workout-plans", label: "Workout Plans" }
];

export default function MarketplacePage() {
  const [category, setCategory] = useState<ProductCategory | "all">("all");

  const constraints = useMemo<QueryConstraint[]>(() => {
    const base: QueryConstraint[] = [where("active", "==", true)];
    if (category !== "all") base.push(where("category", "==", category));
    return [...base, orderBy("updatedAt", "desc")];
  }, [category]);

  const { data: products, loading } = useRealtimeCollection<Product>("products", constraints);

  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-10 w-20" />
              <div>
                <h1 className="text-2xl font-black">Marketplace</h1>
                <p className="text-xs text-white/55">Supplements, gear, plans, and trainer sessions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/marketplace/trainers">
                <Button variant="secondary">Book a Trainer</Button>
              </Link>
              <Link href="/marketplace/cart">
                <Button variant="secondary">
                  <ShoppingCart size={18} /> Cart
                </Button>
              </Link>
              <Link href="/account/orders">
                <Button variant="ghost">My Orders</Button>
              </Link>
            </div>
          </div>

          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === c.value ? "bg-[#E10600] text-white" : "border border-white/12 bg-white/8 text-white/70 hover:bg-white/12"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {loading && <p className="text-white/55">Loading products…</p>}
          {!loading && products.length === 0 && (
            <Card className="py-16 text-center text-white/55">No products here yet. Check back soon.</Card>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const image = p.imagesText?.split(",")[0]?.trim();
              return (
                <Link key={p.id} href={`/marketplace/product?id=${p.id}`}>
                  <Card className="h-full overflow-hidden p-0 transition hover:border-[#E10600]/40">
                    <div className="aspect-square bg-white/5">
                      {image && <img src={image} alt={p.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold">{formatINR(p.price)}</span>
                        {p.compareAtPrice ? <span className="text-xs text-white/40 line-through">{formatINR(p.compareAtPrice)}</span> : null}
                      </div>
                      {p.stock === 0 && <p className="mt-1 text-xs text-[#ffb4b4]">Out of stock</p>}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </MemberGuard>
  );
}
