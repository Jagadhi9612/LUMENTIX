"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberGuard } from "@/components/auth/member-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { getCart, updateCartItemQty, computeTotals, createOrderFromCart, formatINR } from "@/lib/marketplace";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-firestore";
import type { Cart } from "@/lib/firebase-types";

function CartInner() {
  const { user } = useApp();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    setCart(await getCart(user.uid));
  }

  useEffect(() => {
    if (!user) return;
    refresh().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleQty(productId: string, qty: number) {
    if (!user) return;
    await updateCartItemQty(user.uid, productId, qty);
    await refresh();
  }

  async function handleCheckout() {
    if (!user) return;
    setCheckingOut(true);
    setError(null);
    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const memberId = userSnap.exists() ? userSnap.data().memberId : undefined;
      const orderId = await createOrderFromCart(user.uid, memberId);
      router.push(`/marketplace/checkout?orderId=${orderId}`);
    } catch (err: any) {
      setError(err.message ?? "Could not start checkout.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) return <p className="text-white/55">Loading cart…</p>;
  if (!cart || cart.items.length === 0) return <Card className="py-16 text-center text-white/55">Your cart is empty.</Card>;

  const { subtotal, tax, total } = computeTotals(cart.items);

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-3 md:col-span-2">
        {cart.items.map((item) => (
          <Card key={item.productId} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-white/55">{formatINR(item.price)}</p>
            </div>
            <div className="flex items-center rounded-lg border border-white/12">
              <button onClick={() => handleQty(item.productId, item.quantity - 1)} className="px-3 py-1 text-white/70">−</button>
              <span className="px-3 text-sm font-semibold">{item.quantity}</span>
              <button onClick={() => handleQty(item.productId, item.quantity + 1)} className="px-3 py-1 text-white/70">+</button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 font-black">Order Summary</h2>
        <div className="space-y-2 text-sm text-white/70">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="flex justify-between"><span>GST (18%)</span><span>{formatINR(tax)}</span></div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>Total</span><span>{formatINR(total)}</span></div>
        </div>
        {error && <p className="mt-3 text-sm text-[#ffb4b4]">{error}</p>}
        <Button className="mt-4 w-full justify-center" disabled={checkingOut} onClick={handleCheckout}>
          {checkingOut ? "Preparing checkout…" : "Proceed to Checkout"}
        </Button>
      </Card>
    </div>
  );
}

export default function CartPage() {
  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-black">Your Cart</h1>
          <CartInner />
        </div>
      </main>
    </MemberGuard>
  );
}
