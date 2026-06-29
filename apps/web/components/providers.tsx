"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { usePathname } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import { auth } from "@/lib/firebase-auth";

type Toast = { id: string; title: string; tone: "success" | "error" | "info" };

type AppContextValue = {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  toast: (title: string, tone?: Toast["tone"]) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const needsAuth = pathname === "/login" || pathname.startsWith("/staff") || pathname.startsWith("/members") || pathname.startsWith("/payments") || pathname.startsWith("/reports") || pathname.startsWith("/attendance") || pathname.startsWith("/packages") || pathname.startsWith("/trainers") || pathname.startsWith("/expenses") || pathname.startsWith("/notifications") || pathname.startsWith("/settings");

    if (!needsAuth) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    if (!isFirebaseConfigured()) {
      setAuthLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
  }, [pathname]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      authLoading,
      login: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      logout: () => signOut(auth),
      resetPassword: async (email) => {
        await sendPasswordResetEmail(auth, email);
      },
      toast: (title, tone = "info") => {
        const id = crypto.randomUUID();
        setToasts((items) => [...items, { id, title, tone }]);
        window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3600);
      }
    }),
    [authLoading, user]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border px-4 py-3 text-sm font-semibold shadow-2xl ${
              item.tone === "success"
                ? "border-[#16A34A]/40 bg-[#16A34A]/16 text-white"
                : item.tone === "error"
                  ? "border-[#DC2626]/40 bg-[#DC2626]/18 text-white"
                  : "border-white/12 bg-[#111111] text-white"
            }`}
          >
            {item.title}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside AppProviders");
  }
  return context;
}
