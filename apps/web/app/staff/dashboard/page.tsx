"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, BadgeIndianRupee, Bell, Download, Filter, Plus, Search, UserRoundPlus, Users, WalletCards } from "lucide-react";
import Link from "next/link";
import { StaffGuard } from "@/components/auth/staff-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { currency } from "@/lib/utils";
import type { Attendance, Expense, GymPackage, Member, Payment, Trainer } from "@/lib/module-config";

export default function DashboardPage() {
  const [chartsReady, setChartsReady] = useState(false);
  const members = useRealtimeCollection<Member>("members");
  const payments = useRealtimeCollection<Payment>("payments");
  const expenses = useRealtimeCollection<Expense>("expenses");
  const attendance = useRealtimeCollection<Attendance>("attendance");
  const packages = useRealtimeCollection<GymPackage>("packages");
  const trainers = useRealtimeCollection<Trainer>("trainers");

  useEffect(() => {
    setChartsReady(true);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const revenue = payments.data.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
  const expenseTotal = expenses.data.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const activeMembers = members.data.filter((member) => member.status === "Active").length;
  const renewalsDue = members.data.filter((member) => member.membershipEnd && member.membershipEnd <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)).length;
  const todaysAttendance = attendance.data.filter((item) => item.checkInAt?.slice(0, 10) === today).length;
  const revenueSeries = ["Members", "Payments", "Expenses", "Profit"].map((label) => ({
    month: label,
    revenue: label === "Payments" ? revenue : label === "Profit" ? Math.max(0, revenue - expenseTotal) : members.data.length,
    expenses: label === "Expenses" ? expenseTotal : 0,
    members: label === "Members" ? activeMembers : label === "Payments" ? payments.data.length : label === "Expenses" ? expenses.data.length : attendance.data.length
  }));
  const metrics = [
    { label: "Total Revenue", value: revenue, change: `${payments.data.length} payments`, icon: BadgeIndianRupee },
    { label: "Active Members", value: activeMembers, change: `${members.data.length} total`, icon: Users },
    { label: "Renewals Due", value: renewalsDue, change: "7 days", icon: Bell },
    { label: "Cash Flow", value: revenue - expenseTotal, change: `${expenses.data.length} expenses`, icon: WalletCards }
  ];
  const dashboardModules = [
    { title: "Members", count: members.data.length, detail: "active, frozen, expired and suspended profiles", icon: Users },
    { title: "Payments", count: payments.data.length, detail: "cash, UPI, card, bank transfer and receipts", icon: BadgeIndianRupee },
    { title: "Attendance", count: todaysAttendance, detail: "QR, barcode and manual check-ins today", icon: Activity },
    { title: "Packages", count: packages.data.length, detail: "plans, offers, GST and freeze rules", icon: Plus },
    { title: "Trainers", count: trainers.data.length, detail: "shifts, assignments, salaries and performance", icon: UserRoundPlus },
    { title: "Reports", count: revenue > expenseTotal ? "Profit" : "Review", detail: "revenue, expenses, membership and outstanding", icon: Download },
    { title: "Notifications", count: renewalsDue, detail: "expiry, birthday, payment and offers", icon: Bell },
    { title: "Security", count: "RBAC", detail: "Firebase rules, auth guards and audit logs", icon: Filter }
  ];
  const recentMembers = [...members.data].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? ""))).slice(0, 6);
  const recentPayments = [...payments.data].sort((a, b) => String(b.paidAt ?? "").localeCompare(String(a.paidAt ?? ""))).slice(0, 6);

  return (
    <StaffGuard>
      <main className="flex min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <Sidebar />
        <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/86 px-4 py-4 backdrop-blur md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 break-words">
              <p className="text-sm text-white/50">Friday, 19 June 2026</p>
              <h1 className="text-2xl font-black md:text-3xl">Command Center</h1>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 sm:min-w-64">
                <Search size={18} className="text-white/40" />
                <input className="w-full bg-transparent text-sm outline-none" placeholder="Search members, invoices, trainers..." />
              </div>
              <Button variant="secondary" className="w-full sm:w-auto"><Filter size={18} /> Filters</Button>
              <Link href="/members" className="w-full sm:w-auto"><Button className="w-full sm:w-auto"><Plus size={18} /> New Member</Button></Link>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 md:p-7">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.div key={metric.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <span className="grid size-12 place-items-center rounded-lg bg-[#E10600]/16 text-[#E10600]">
                      <metric.icon size={22} />
                    </span>
                    <span className="rounded-full bg-[#16A34A]/12 px-3 py-1 text-xs font-bold text-[#16A34A]">{metric.change}</span>
                  </div>
                  <p className="mt-5 text-sm text-white/55">{metric.label}</p>
                  <p className="mt-1 text-3xl font-black">{typeof metric.value === "number" && metric.value > 10000 ? currency(metric.value) : metric.value}</p>
                </Card>
              </motion.div>
            ))}
          </section>

          <section className="grid min-w-0 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 break-words">
                  <h2 className="text-xl font-black">Revenue, Expenses and Growth</h2>
                  <p className="text-sm text-white/50">Monthly financial and membership trend</p>
                </div>
                <Button variant="secondary" className="w-full sm:w-auto"><Download size={18} /> Export</Button>
              </div>
              <div className="h-64 min-w-0 sm:h-80">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={revenueSeries}>
                      <defs>
                        <linearGradient id="eliteRevenue" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#E10600" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#E10600" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" />
                      <YAxis stroke="rgba(255,255,255,0.55)" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#E10600" fill="url(#eliteRevenue)" strokeWidth={3} />
                      <Area type="monotone" dataKey="expenses" stroke="#FACC15" fill="transparent" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg bg-white/[0.04]" />
                )}
              </div>
            </Card>

            <Card className="min-w-0">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-black">Attendance</h2>
                <Bell className="text-[#E10600]" />
              </div>
              <div className="h-64 min-w-0 sm:h-80">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={revenueSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.55)" />
                      <YAxis stroke="rgba(255,255,255,0.55)" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                      <Bar dataKey="members" fill="#E10600" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg bg-white/[0.04]" />
                )}
              </div>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardModules.map((module) => (
              <Card key={module.title} className="transition hover:-translate-y-1 hover:border-[#E10600]/50">
                <module.icon className="text-[#E10600]" />
                <p className="mt-5 text-2xl font-black">{module.count}</p>
                <h3 className="mt-1 font-bold">{module.title}</h3>
                <p className="mt-2 text-sm text-white/55">{module.detail}</p>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black">Recent Members</h2>
                <Button variant="secondary" className="w-full sm:w-auto"><UserRoundPlus size={18} /> Add</Button>
              </div>
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="text-left text-white/45">
                    <tr>
                      <th className="py-3">Member</th>
                      <th>Plan</th>
                      <th>Trainer</th>
                      <th>Status</th>
                      <th>Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map((member) => (
                      <tr key={member.id} className="border-t border-white/8">
                        <td className="py-4">
                          <p className="font-bold">{member.fullName}</p>
                          <p className="text-xs text-white/45">{member.memberId}</p>
                        </td>
                        <td>{member.packageName || "-"}</td>
                        <td>{member.trainer}</td>
                        <td><span className="rounded-full bg-white/8 px-3 py-1 text-xs">{member.status}</span></td>
                        <td className="text-white/62">{member.membershipEnd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-black">Recent Payments</h2>
                <Button variant="secondary" className="w-full sm:w-auto"><Download size={18} /> PDF</Button>
              </div>
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-3 rounded-lg border border-white/8 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 break-words">
                      <p className="font-bold">{payment.memberName}</p>
                      <p className="text-xs text-white/45">{payment.invoiceNumber} / {payment.method}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-black">{currency(Number(payment.paidAmount || 0))}</p>
                      <p className={payment.status === "Paid" ? "text-xs text-[#16A34A]" : "text-xs text-[#FACC15]"}>{payment.status}</p>
                    </div>
                  </div>
                ))}
                {!payments.loading && recentPayments.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-5 text-center text-white/55 sm:p-8">No live payment records yet.</div>}
              </div>
            </Card>
          </section>
        </div>
        </section>
      </main>
    </StaffGuard>
  );
}
