"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MemberGuard } from "@/components/auth/member-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { getRecord } from "@/lib/firestore-service";
import { addToCart, formatINR } from "@/lib/marketplace";
import type { Product } from "@/lib/firebase-types";

function ProductDetailInner() {
  const params = useSearchParams();
  const productId = params.get("id");
  const { user } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    getRecord<Product>("products", productId).then((p) => {
      setProduct(p);
      setLoading(false);
    });
  }, [productId]);

  async function handleAddToCart() {
    if (!user || !product) return;
    setAdding(true);
    setMessage(null);
    try {
      await addToCart(user.uid, product, qty);
      setMessage("Added to cart.");
    } catch (err: any) {
      setMessage(err.message ?? "Could not add to cart.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p className="text-white/55">Loading…</p>;
  if (!product) return <p className="text-white/55">Product not found.</p>;

  const images = product.imagesText?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="aspect-square overflow-hidden p-0">
        {images[0] && <img src={images[0]} alt={product.name} className="h-full w-full object-cover" />}
      </Card>

      <div>
        <h1 className="text-2xl font-black">{product.name}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-black">{formatINR(product.price)}</span>
          {product.compareAtPrice ? <span className="text-base text-white/40 line-through">{formatINR(product.compareAtPrice)}</span> : null}
        </div>
        <p className="mt-4 leading-relaxed text-white/70">{product.description}</p>

        {!product.isDigital && (
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-white/12">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-white/70">−</button>
              <span className="px-4 text-sm font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 text-white/70">+</button>
            </div>
          </div>
        )}

        <Button className="mt-4 w-full justify-center" disabled={adding || product.stock === 0} onClick={handleAddToCart}>
          {product.stock === 0 ? "Out of stock" : adding ? "Adding…" : "Add to Cart"}
        </Button>

        {message && <p className="mt-3 text-sm text-white/60">{message}</p>}

        <Link href="/marketplace/cart" className="mt-4 block text-sm text-[#E10600] underline">
          Go to cart →
        </Link>
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="text-white/55">Loading…</p>}>
            <ProductDetailInner />
          </Suspense>
        </div>
      </main>
    </MemberGuard>
  );
}
