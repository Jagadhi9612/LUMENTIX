"use client";

import QRCode from "qrcode";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { StaffGuard } from "@/components/auth/staff-guard";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRecord } from "@/lib/firestore-service";
import type { Member } from "@/lib/module-config";
import { gymAddress } from "@/lib/module-config";

function MembershipCard() {
  const id = useSearchParams().get("id");
  const [member, setMember] = useState<Member | null>(null);
  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    getRecord<Member>("members", id).then(async (record) => {
      setMember(record);
      if (record) {
        setQr(await QRCode.toDataURL(`${record.memberId}|${record.fullName}|${record.membershipEnd}`));
      }
    });
  }, [id]);

  return (
    <main className="grid min-h-screen place-items-center overflow-x-hidden bg-[#050505] p-4 text-white sm:p-5">
      <Card className="w-full max-w-xl">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 break-words">
            <p className="text-sm text-white/55">{gymAddress.line1}, {gymAddress.city}, {gymAddress.state}</p>
            <h1 className="text-2xl font-black">Membership Card</h1>
          </div>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.print()}>Print</Button>
        </div>
        {member ? (
          <div className="rounded-lg border border-white/10 bg-black p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 break-words">
                <div className="flex items-center gap-3">
                  <BrandLogo className="size-14" mark />
                  <p className="text-sm font-bold text-[#E10600]">ELITE FITNESS</p>
                </div>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{member.fullName}</h2>
                <p className="mt-2 text-white/62">{member.memberId}</p>
                <p className="mt-4 text-sm text-white/62">Package: {member.packageName || "-"}</p>
                <p className="text-sm text-white/62">Valid Until: {member.membershipEnd}</p>
                <p className="text-sm text-white/62">Emergency: {member.emergencyContact}</p>
              </div>
              {qr && <img src={qr} alt="Membership QR code" className="size-28 self-center rounded-lg bg-white p-2 sm:size-32 sm:self-start" />}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-5 text-center text-white/55 sm:p-8">Member record not found.</div>
        )}
      </Card>
    </main>
  );
}

export default function MembershipCardPage() {
  return (
    <StaffGuard>
      <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#050505] text-white">Loading card...</main>}>
        <MembershipCard />
      </Suspense>
    </StaffGuard>
  );
}
