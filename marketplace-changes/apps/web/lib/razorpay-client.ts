// Elite Fitness — Marketplace payments.
// Calls the createMarketplaceOrder / verifyMarketplacePayment callables in
// apps/api rather than any Next.js API route — the web app is a static
// export (next.config.ts: output: "export"), so there is no server runtime
// to host API routes in. Firebase Cloud Functions is the only backend.

import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase-functions";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function payForOrder(orderId: string, onSuccess: () => void, onFailure: (message: string) => void) {
  const loaded = await loadRazorpayScript();
  if (!loaded) return onFailure("Could not load the payment gateway. Check your connection.");

  try {
    const createOrder = httpsCallable<{ orderId: string }, { razorpayOrderId: string; amount: number; currency: string; keyId: string }>(
      functions,
      "createMarketplaceOrder"
    );
    const { data } = await createOrder({ orderId });

    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: "Elite Fitness",
      description: "Marketplace order",
      order_id: data.razorpayOrderId,
      theme: { color: "#E10600" },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const verify = httpsCallable(functions, "verifyMarketplacePayment");
          await verify({ orderId, ...response });
          onSuccess();
        } catch (err: any) {
          onFailure(err?.message ?? "Payment could not be verified. Contact staff if you were charged.");
        }
      },
      modal: { ondismiss: () => onFailure("Payment cancelled.") }
    });

    rzp.on("payment.failed", (resp: any) => onFailure(resp.error?.description ?? "Payment failed."));
    rzp.open();
  } catch (err: any) {
    onFailure(err?.message ?? "Could not start payment.");
  }
}
