"use client";

import { Activity, BadgeIndianRupee, Bell, ChartNoAxesCombined, Dumbbell, FileSearch, LayoutDashboard, LogOut, Package, ReceiptText, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useApp } from "@/components/providers";

const nav = [
  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
  { label: "Members", href: "/members", icon: Users },
  { label: "Member Details", href: "/members/details", icon: FileSearch },
  { label: "Packages", href: "/packages", icon: Package },
  { label: "Payments", href: "/payments", icon: BadgeIndianRupee },
  { label: "Attendance", href: "/attendance", icon: Activity },
  { label: "Trainers", href: "/trainers", icon: Dumbbell },
  { label: "Expenses", href: "/expenses", icon: ReceiptText },
  { label: "Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useApp();

  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-[#080808]/95 px-4 py-5 lg:block">
      <Link href="/" className="mb-8 flex items-center gap-3 rounded-lg px-2">
        <BrandLogo className="h-11 w-24" />
        <span>
          <span className="block text-lg font-black tracking-wide">ELITE FITNESS</span>
          <span className="text-xs text-white/55">Train Strong. Live Elite.</span>
        </span>
      </Link>
      <nav className="space-y-1">
        {nav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
              pathname === item.href ? "bg-[#E10600] text-white" : "text-white/68 hover:bg-white/8 hover:text-white"
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-3">
        <p className="truncate text-xs text-white/45">{user?.email ?? "Staff session"}</p>
        <button
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-sm font-semibold text-white/72 hover:bg-white/8 hover:text-white"
          onClick={async () => {
            await logout();
            window.location.href = "/dashboard";
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}
