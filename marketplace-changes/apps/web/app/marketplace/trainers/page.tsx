"use client";

import Link from "next/link";
import { MemberGuard } from "@/components/auth/member-guard";
import { Card } from "@/components/ui/card";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { bookableTrainers, formatINR } from "@/lib/marketplace";
import type { Trainer } from "@/lib/firebase-types";

export default function TrainerMarketplacePage() {
  const { data: allTrainers, loading } = useRealtimeCollection<Trainer>("trainers");
  const trainers = bookableTrainers(allTrainers);

  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-black">Book a Trainer</h1>

          {loading && <p className="text-white/55">Loading trainers…</p>}
          {!loading && trainers.length === 0 && (
            <Card className="py-16 text-center text-white/55">No trainers open for booking yet.</Card>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {trainers.map((t) => (
              <Link key={t.id} href={`/marketplace/trainer?id=${t.id}`}>
                <Card className="h-full overflow-hidden p-0 transition hover:border-[#E10600]/40">
                  <div className="aspect-[4/5] bg-white/5">
                    {t.photoUrl && <img src={t.photoUrl} alt={t.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-xs text-white/55">{t.specialization}</p>
                    <p className="mt-2 text-sm font-bold">{formatINR(t.pricePerSession ?? 0)}/session</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </MemberGuard>
  );
}
