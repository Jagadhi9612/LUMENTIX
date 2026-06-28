"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { StaffGuard } from "@/components/auth/staff-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { currency } from "@/lib/utils";
import type { Attendance, Expense, Member, Payment, Trainer } from "@/lib/module-config";

export default function ReportsPage() {
  const [chartsReady, setChartsReady] = useState(false);
  const members = useRealtimeCollection<Member>("members");
  const payments = useRealtimeCollection<Payment>("payments");
  const expenses = useRealtimeCollection<Expense>("expenses");
  const attendance = useRealtimeCollection<Attendance>("attendance");
  const trainers = useRealtimeCollection<Trainer>("trainers");

  const revenue = payments.data.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const expenseTotal = expenses.data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activeMembers = members.data.filter((item) => item.status === "Active").length;
  const chartData = [
    { label: "Revenue", value: revenue },
    { label: "Expenses", value: expenseTotal },
    { label: "Profit", value: revenue - expenseTotal },
    { label: "Attendance", value: attendance.data.length },
    { label: "Trainers", value: trainers.data.length },
    { label: "Members", value: activeMembers }
  ];

  useEffect(() => {
    setChartsReady(true);
  }, []);

  function exportReport() {
    const csv = chartData.map((item) => `${item.label},${item.value}`).join("\n");
    const url = URL.createObjectURL(new Blob([`Metric,Value\n${csv}`], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "elite-fitness-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <StaffGuard>
      <main className="flex min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <Sidebar />
        <section className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/90 px-4 py-4 backdrop-blur md:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 break-words">
              <p className="text-sm text-white/50">Revenue, expense, attendance, membership, trainer, package, renewal and profit reports</p>
              <h1 className="text-2xl font-black md:text-3xl">Reports</h1>
            </div>
            <div className="grid w-full gap-2 sm:flex sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto" onClick={exportReport}><Download size={18} /> Export</Button>
              <Button variant="secondary" className="w-full sm:w-auto" onClick={() => window.print()}><Printer size={18} /> Print</Button>
            </div>
          </div>
        </header>
        <div className="space-y-6 p-4 md:p-7">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {chartData.slice(0, 4).map((item) => (
              <Card key={item.label}>
                <p className="text-sm text-white/55">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.label.includes("Revenue") || item.label.includes("Expenses") || item.label.includes("Profit") ? currency(item.value) : item.value}</p>
              </Card>
            ))}
          </section>
          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="min-w-0">
              <h2 className="mb-5 text-xl font-black">Profit and Loss</h2>
              <div className="h-64 min-w-0 sm:h-80">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={chartData.slice(0, 3)}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
                      <YAxis stroke="rgba(255,255,255,0.55)" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                      <Area dataKey="value" stroke="#E10600" fill="#E1060033" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg bg-white/[0.04]" />
                )}
              </div>
            </Card>
            <Card className="min-w-0">
              <h2 className="mb-5 text-xl font-black">Operations</h2>
              <div className="h-64 min-w-0 sm:h-80">
                {chartsReady ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={chartData.slice(3)}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.55)" />
                      <YAxis stroke="rgba(255,255,255,0.55)" />
                      <Tooltip contentStyle={{ background: "#111111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8 }} />
                      <Bar dataKey="value" fill="#E10600" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full rounded-lg bg-white/[0.04]" />
                )}
              </div>
            </Card>
          </section>
        </div>
        </section>
      </main>
    </StaffGuard>
  );
}
