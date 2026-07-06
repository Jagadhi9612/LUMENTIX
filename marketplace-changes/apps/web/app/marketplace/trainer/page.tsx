"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { collection, getDocs, query, where } from "firebase/firestore";
import { MemberGuard } from "@/components/auth/member-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { functions } from "@/lib/firebase-functions";
import { db } from "@/lib/firebase-firestore";
import { getRecord } from "@/lib/firestore-service";
import { parseAvailability, formatINR } from "@/lib/marketplace";
import type { Booking, Trainer } from "@/lib/firebase-types";

function nextDates(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function TrainerProfileInner() {
  const params = useSearchParams();
  const trainerId = params.get("id");
  const dates = useMemo(() => nextDates(7), []);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [bookedSlots, setBookedSlots] = useState<Booking[]>([]);
  const [booking, setBooking] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!trainerId) return;
    getRecord<Trainer>("trainers", trainerId).then((t) => {
      setTrainer(t);
      setLoading(false);
    });
  }, [trainerId]);

  useEffect(() => {
    if (!trainerId) return;
    getDocs(query(collection(db, "bookings"), where("trainerId", "==", trainerId), where("date", "==", selectedDate))).then((snap) => {
      setBookedSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking).filter((b) => b.status === "pending" || b.status === "confirmed"));
    });
  }, [trainerId, selectedDate]);

  async function handleBook(startTime: string, endTime: string) {
    if (!trainerId) return;
    setBooking(startTime);
    setMessage(null);
    try {
      const createBooking = httpsCallable(functions, "createBooking");
      await createBooking({ trainerId, date: selectedDate, startTime, endTime });
      setMessage("Session booked! Staff will confirm shortly.");
      const snap = await getDocs(query(collection(db, "bookings"), where("trainerId", "==", trainerId), where("date", "==", selectedDate)));
      setBookedSlots(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking).filter((b) => b.status === "pending" || b.status === "confirmed"));
    } catch (err: any) {
      setMessage(err.message ?? "Could not book this slot.");
    } finally {
      setBooking(null);
    }
  }

  if (loading) return <p className="text-white/55">Loading…</p>;
  if (!trainer) return <p className="text-white/55">Trainer not found.</p>;

  const dayOfWeek = new Date(selectedDate).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const daySlots = parseAvailability(trainer.availabilityText).filter((s) => s.dayOfWeek === dayOfWeek);
  const isTaken = (startTime: string) => bookedSlots.some((b) => b.startTime === startTime);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="aspect-[4/5] overflow-hidden p-0">
        {trainer.photoUrl && <img src={trainer.photoUrl} alt={trainer.name} className="h-full w-full object-cover" />}
      </Card>

      <div>
        <h1 className="text-2xl font-black">{trainer.name}</h1>
        <p className="mt-1 text-sm text-white/55">{trainer.experience} yrs experience · {trainer.specialization}</p>
        {trainer.bio && <p className="mt-4 leading-relaxed text-white/70">{trainer.bio}</p>}
        <p className="mt-4 text-lg font-bold">{formatINR(trainer.pricePerSession ?? 0)} / session</p>

        <div className="mt-6">
          <h2 className="mb-3 font-black">Book a Session</h2>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
            {dates.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                  selectedDate === d ? "bg-[#E10600] text-white" : "border border-white/12 bg-white/8 text-white/70"
                }`}
              >
                {new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
              </button>
            ))}
          </div>

          {daySlots.length === 0 ? (
            <p className="text-sm text-white/55">No availability on this day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {daySlots.map((s) => (
                <button
                  key={s.startTime}
                  disabled={isTaken(s.startTime) || booking === s.startTime}
                  onClick={() => handleBook(s.startTime, s.endTime)}
                  className={`rounded-lg border py-2 text-sm ${
                    isTaken(s.startTime) ? "cursor-not-allowed border-white/8 text-white/25" : "border-white/12 text-white/80 hover:border-[#E10600]"
                  }`}
                >
                  {s.startTime}
                </button>
              ))}
            </div>
          )}
          {message && <p className="mt-3 text-sm text-white/60">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default function TrainerProfilePage() {
  return (
    <MemberGuard>
      <main className="min-h-screen bg-[#050505] px-5 py-8 text-white">
        <div className="mx-auto max-w-5xl">
          <Suspense fallback={<p className="text-white/55">Loading…</p>}>
            <TrainerProfileInner />
          </Suspense>
        </div>
      </main>
    </MemberGuard>
  );
}
