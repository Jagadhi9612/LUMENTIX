"use client";

// Parallel to components/auth/staff-guard.tsx, but for the MEMBER role
// instead of staff roles. Members sign in/create an account at
// /member-login, which links their Firebase Auth account to an existing
// `members` record via the linkMemberAccount Cloud Function.

import { doc, getDoc } from "firebase/firestore";
import { Lock, LogIn, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isFirebaseConfigured } from "@/lib/firebase";
import { db } from "@/lib/firebase-firestore";

export function MemberGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const [roleLoading, setRoleLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRole() {
      if (!user || !isFirebaseConfigured()) {
        setIsMember(false);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);
      try {
        const token = await user.getIdTokenResult(true);
        if (token.claims.role === "MEMBER") {
          if (active) setIsMember(true);
          return;
        }
        // Staff accounts can also browse/shop — treat any recognized role as allowed.
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const role = snapshot.exists() ? snapshot.data().role : null;
        if (active) setIsMember(Boolean(role));
      } catch (error) {
        console.warn("Member role check failed", error);
        if (active) setIsMember(false);
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
          <h1 className="mt-4 text-2xl font-black">Checking Your Account</h1>
          <p className="mt-2 text-sm text-white/58">One moment while we verify your session.</p>
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
          <p className="mt-2 text-sm leading-6 text-white/60">Add the `NEXT_PUBLIC_FIREBASE_*` values to `.env.local` to enable the marketplace.</p>
        </Card>
      </main>
    );
  }

  if (!user || !isMember) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
        <Card className="max-w-md text-center">
          <Lock className="mx-auto text-[#E10600]" size={40} />
          <h1 className="mt-4 text-2xl font-black">Member Account Required</h1>
          <p className="mt-2 text-sm text-white/58">Sign in or create a member account to shop the marketplace and book trainers.</p>
          <Link className="mt-5 inline-flex" href="/member-login">
            <Button>
              <LogIn size={18} /> Member Sign In
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
