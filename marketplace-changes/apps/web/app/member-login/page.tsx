"use client";

import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { functions } from "@/lib/firebase-functions";

export default function MemberLoginPage() {
  const { login, signup } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberId, setMemberId] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/marketplace");
    } catch (err: any) {
      setError(err.message ?? "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setBusy(true);
    setError(null);
    try {
      await signup(email, password);
      const link = httpsCallable(functions, "linkMemberAccount");
      await link({ memberId, phone });
      router.push("/marketplace");
    } catch (err: any) {
      setError(err.message ?? "Could not create your account. Check your Member ID and phone number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 text-white">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <BrandLogo className="h-10 w-20" />
          <div>
            <p className="text-lg font-black">ELITE FITNESS</p>
            <p className="text-xs text-white/55">Marketplace member account</p>
          </div>
        </div>

        <div className="mb-5 flex gap-2 rounded-lg border border-white/10 p-1">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-[#E10600] text-white" : "text-white/60"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-[#E10600] text-white" : "text-white/60"}`}
          >
            Create Account
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 outline-none focus:border-[#E10600]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 outline-none focus:border-[#E10600]"
          />

          {mode === "signup" && (
            <>
              <p className="pt-1 text-xs text-white/50">
                Enter the Member ID and phone number staff registered for you at the front desk.
              </p>
              <input
                placeholder="Member ID (e.g. EF-2026-000123)"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 outline-none focus:border-[#E10600]"
              />
              <input
                placeholder="Phone number on file"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 outline-none focus:border-[#E10600]"
              />
            </>
          )}

          {error && <p className="text-sm text-[#ffb4b4]">{error}</p>}

          <Button
            className="w-full justify-center"
            disabled={busy}
            onClick={mode === "signin" ? handleSignIn : handleSignUp}
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
