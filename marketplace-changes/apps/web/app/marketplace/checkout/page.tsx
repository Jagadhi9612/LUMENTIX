"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MemberGuard } from "@/components/auth/member-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOrder, formatINR } from "@/lib/marketplace";
import { payForOrder } from "@/lib/razorpay-client";
import type { MarketplaceOrder } from "@/lib/firebase-types";

function CheckoutInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const router = useRouter();
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);
  const [status, setStatus] = useState<"idle" | "paying" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId).then(setOrder);
  }, [orderId]);

  function handlePay() {
    if (!orderId) return;
    setStatus("paying");
    setError(null);
    payForOrder(
      orderId,
      () => {
        setStatus("success");
        setTimeout(() => router.push("/account/orders"), 1500);
      },
      (msg) => {
        setStatus("error");
        setError(msg);
      }
    );
  }

  if (!orderId) return <p className="text-white/55">No order specified.</p>;
  if (!order) return <p className="text-white/55">Loading order…</p>;

  if (status === "success") {
    return (
      <Card className="py-16 text-center">
        <p className="text-lg font-black">Payment successful 🎉</p>
        <p className="mt-1 text-white/55">Redirecting to your orders…</p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="mb-4 font-black">Payment</h2>
      <div className="space-y-2 text-sm text-white/70">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>GST</span><span>{formatINR(order.tax)}</span></div>
        <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-base font-bold text-white"><span>Total</span><span>{formatINR(order.total)}</span></div>
      </div>
      {error && <p className="mt-3 text-sm text-[#ffb4b4]">{error}</p>}
      <Button className="mt-4 w-full justify-center" disabled={status === "paying"} onClick={handlePay}>
        {status === "paying" ? "Opening payment…" : `Pay ${formatINR(order.total)}`}
      </Button>
      <p className="mt-3 text-center text-xs text-white/40">Secured by Razorpay · UPI, cards, netbanking</p>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-black">Checkout</h1>
          <Suspense fallback={<p className="text-white/55">Loading…</p>}>
            <CheckoutInner />
          </Suspense>
        </div>
      </main>
    </MemberGuard>
  );
}
