"use client";

import { doc, getDoc } from "firebase/firestore";
import { Lock, LogIn, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase";
import { db } from "@/lib/firebase-firestore";

const STAFF_ROLES = ["SUPER_ADMIN", "GYM_MANAGER", "RECEPTIONIST", "TRAINER", "ACCOUNTANT"];

export function StaffGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const [roleLoading, setRoleLoading] = useState(false);
  const [staffRole, setStaffRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user || !isFirebaseConfigured()) {
        setStaffRole(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      try {
        const token = await user.getIdTokenResult(true);
        const tokenRole = typeof token.claims.role === "string" ? token.claims.role : null;
        if (tokenRole && STAFF_ROLES.includes(tokenRole)) {
          if (active) setStaffRole(tokenRole);
          return;
        }

        const snapshot = await getDoc(doc(db, "users", user.uid));
        const role = snapshot.exists() && typeof snapshot.data().role === "string" ? snapshot.data().role : null;
        if (active) setStaffRole(role);
      } catch (error) {
        console.warn("Staff role check failed", error);
        if (active) setStaffRole(null);
      } finally {
        if (active) setRoleLoading(false);
      }
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || roleLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <Card className="max-w-md text-center">
          <ShieldAlert className="mx-auto text-[#E10600]" size={38} />
          <h1 className="mt-4 text-2xl font-black">Checking Staff Access</h1>
          <p className="mt-2 text-sm text-white/58">Please wait while Elite Fitness verifies this staff session.</p>
        </Card>
      </main>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <Card className="max-w-lg text-center">
          <Lock className="mx-auto text-[#FACC15]" size={40} />
          <h1 className="mt-4 text-2xl font-black">Firebase Required</h1>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Add the `NEXT_PUBLIC_FIREBASE_*` values to `.env.local`, then create the Firebase Authentication user
            `admin@elite.in` with password `admin@elite`.
          </p>
          <Link className="mt-5 inline-flex" href="/dashboard">
            <Button variant="secondary">Back to Member App</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <Card className="max-w-md text-center">
          <Lock className="mx-auto text-[#E10600]" size={40} />
          <h1 className="mt-4 text-2xl font-black">Staff Login Required</h1>
          <p className="mt-2 text-sm text-white/58">Only Firebase staff users can open admin dashboards and member records.</p>
          <Link className="mt-5 inline-flex" href="/login">
            <Button>
              <LogIn size={18} /> Staff Login
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!staffRole || !STAFF_ROLES.includes(staffRole)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <Card className="max-w-md text-center">
          <ShieldAlert className="mx-auto text-[#FACC15]" size={40} />
          <h1 className="mt-4 text-2xl font-black">Staff Role Required</h1>
          <p className="mt-2 text-sm text-white/58">
            This account is signed in, but it does not have a staff role in Firebase yet.
          </p>
          <Link className="mt-5 inline-flex" href="/dashboard">
            <Button variant="secondary">Back to Member App</Button>
          </Link>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
