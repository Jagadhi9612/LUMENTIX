"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, Lock, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApp } from "@/components/providers";
import { isFirebaseConfigured } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  remember: z.boolean()
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, resetPassword, toast } = useApp();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@elite.in", password: "", remember: true }
  });

  return (
    <main className="elite-grid grid min-h-screen place-items-center bg-[#050505] px-5 py-10 text-white">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="mb-7 flex items-center justify-center gap-3">
          <BrandLogo className="h-14 w-32" />
          <span>
            <span className="block text-xl font-black">ELITE FITNESS</span>
            <span className="text-xs text-white/55">Train Strong. Live Elite.</span>
          </span>
        </Link>
        <Card>
          <div className="mb-7 flex items-start justify-between gap-5">
            <div>
              <h1 className="text-2xl font-black">Staff Login</h1>
              <p className="mt-2 text-sm text-white/58">Secure access for admin, manager, receptionist, trainer and accountant roles.</p>
            </div>
            <ShieldCheck className="text-[#16A34A]" />
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(async (values) => {
              if (!isFirebaseConfigured()) {
                toast("Firebase env vars are missing. Add them to .env.local.", "error");
                return;
              }
              try {
                await login(values.email, values.password);
                toast("Signed in successfully", "success");
                window.location.href = "/staff/dashboard";
              } catch (error) {
                toast(error instanceof Error ? error.message : "Login failed", "error");
              }
            })}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/70">Email</span>
              <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3">
                <Mail size={18} className="text-white/42" />
                <input className="h-12 w-full bg-transparent outline-none" {...register("email")} />
              </span>
              {errors.email && <span className="mt-1 block text-xs text-[#DC2626]">{errors.email.message}</span>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white/70">Password</span>
              <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3">
                <Lock size={18} className="text-white/42" />
                <input className="h-12 w-full bg-transparent outline-none" type="password" {...register("password")} />
                <Eye size={18} className="text-white/42" />
              </span>
              {errors.password && <span className="mt-1 block text-xs text-[#DC2626]">{errors.password.message}</span>}
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/65">
                <input type="checkbox" className="size-4 accent-[#E10600]" {...register("remember")} />
                Remember me
              </label>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-semibold text-[#E10600]"
                onClick={async () => {
                  const email = getValues("email");
                  if (!email) {
                    toast("Enter your staff email first.", "error");
                    return;
                  }
                  try {
                    await resetPassword(email);
                    toast("Password reset email sent.", "success");
                  } catch (error) {
                    toast(error instanceof Error ? error.message : "Password reset failed", "error");
                  }
                }}
              >
                <RotateCcw size={14} /> Forgot password
              </button>
            </div>

            <Button className="w-full" disabled={isSubmitting}>
              Enter Command Center
            </Button>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
