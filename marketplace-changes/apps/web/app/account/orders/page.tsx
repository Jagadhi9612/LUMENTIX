"use client";

import { where } from "firebase/firestore";
import { useMemo } from "react";
import { MemberGuard } from "@/components/auth/member-guard";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { formatINR } from "@/lib/marketplace";
import type { MarketplaceOrder } from "@/lib/firebase-types";

const STATUS_LABEL: Record<MarketplaceOrder["status"], string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  processing: "Processing",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded"
};

function OrdersInner() {
  const { user } = useApp();
  const constraints = useMemo(() => (user ? [where("uid", "==", user.uid)] : []), [user]);
  const { data: orders, loading } = useRealtimeCollection<MarketplaceOrder>("orders", constraints, { enabled: Boolean(user) });

  if (loading) return <p className="text-white/55">Loading orders…</p>;
  if (orders.length === 0) return <Card className="py-16 text-center text-white/55">No orders yet.</Card>;

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Card key={order.id}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
              <p className="text-sm text-white/55">{order.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatINR(order.total)}</p>
              <p className="text-xs text-white/55">{STATUS_LABEL[order.status]}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-2xl font-black">My Orders</h1>
          <OrdersInner />
        </div>
      </main>
    </MemberGuard>
  );
}
