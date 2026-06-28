"use client";

import { Activity, BadgeIndianRupee, Bell, CreditCard, FileText, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StaffGuard } from "@/components/auth/staff-guard";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import type { Attendance, Member, NotificationRecord, Payment } from "@/lib/module-config";
import { currency } from "@/lib/utils";

function norm(value: unknown) {
  return String(value ?? "").toLowerCase();
}

function row(label: string, value: unknown) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 min-w-0 break-words font-bold">{String(value || "-")}</p>
    </div>
  );
}

export default function MemberDetailsPage() {
  const members = useRealtimeCollection<Member>("members");
  const payments = useRealtimeCollection<Payment>("payments");
  const attendance = useRealtimeCollection<Attendance>("attendance");
  const notifications = useRealtimeCollection<NotificationRecord>("notifications");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSelectedId(params.get("id") || "");
  }, []);

  const matches = useMemo(() => {
    const search = norm(query);
    return members.data
      .filter((member) => {
        if (!search) {
          return true;
        }
        return [member.fullName, member.memberId, member.phone, member.email].some((value) => norm(value).includes(search));
      })
      .slice(0, 12);
  }, [members.data, query]);

  const selected = members.data.find((member) => member.id === selectedId) || matches[0] || null;
  const memberPayments = selected ? payments.data.filter((payment) => payment.memberId === selected.memberId).sort((a, b) => norm(b.paidAt).localeCompare(norm(a.paidAt))) : [];
  const memberAttendance = selected ? attendance.data.filter((item) => item.memberId === selected.memberId).sort((a, b) => norm(b.checkInAt).localeCompare(norm(a.checkInAt))).slice(0, 12) : [];
  const memberNotifications = selected ? notifications.data.filter((item) => item.memberId === selected.memberId).sort((a, b) => norm(b.createdAt).localeCompare(norm(a.createdAt))).slice(0, 12) : [];
  const paidTotal = memberPayments.reduce((sum, payment) => sum + Number(payment.paidAmount || 0), 0);
  const pendingTotal = memberPayments.reduce((sum, payment) => sum + Number(payment.pendingAmount || 0), 0);

  return (
    <StaffGuard>
      <main className="flex min-h-screen overflow-x-hidden bg-[#050505] text-white">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/90 px-4 py-4 backdrop-blur md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 break-words">
                <p className="text-sm text-white/50">Search one member and see the full subscription, payment and attendance story</p>
                <h1 className="text-2xl font-black md:text-3xl">Member Details</h1>
              </div>
              <div className="flex h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-white/6 px-3 xl:max-w-xl">
                <Search size={18} className="text-white/40" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search name, phone or member ID..." />
              </div>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-7">
            <Card>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">Search Results</h2>
                  <p className="text-sm text-white/50">{matches.length} matching members</p>
                </div>
                <Link href="/members" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto">Back To Members</Button>
                </Link>
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {matches.map((member) => (
                  <button
                    key={member.id}
                    className={`rounded-lg border p-3 text-left transition ${selected?.id === member.id ? "border-[#E10600] bg-[#E10600]/12" : "border-white/10 bg-white/[0.04] hover:border-white/25"}`}
                    onClick={() => setSelectedId(member.id)}
                  >
                    <p className="font-bold">{member.fullName}</p>
                    <p className="text-xs text-white/50">{member.memberId} / {member.phone}</p>
                    <p className="mt-2 text-xs text-white/62">Last day: {member.membershipEnd || "-"}</p>
                  </button>
                ))}
              </div>
              {!members.loading && matches.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-white/55">No member found.</div>}
            </Card>

            {selected && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card>
                    <UserRound className="text-[#E10600]" />
                    <p className="mt-4 text-sm text-white/55">Member</p>
                    <h2 className="mt-1 min-w-0 break-words text-2xl font-black">{selected.fullName}</h2>
                    <p className="text-sm text-white/50">{selected.memberId}</p>
                  </Card>
                  <Card>
                    <CreditCard className="text-[#FACC15]" />
                    <p className="mt-4 text-sm text-white/55">Subscription Last Day</p>
                    <h2 className="mt-1 text-2xl font-black">{selected.membershipEnd || "-"}</h2>
                    <p className="text-sm text-white/50">{selected.packageName || "No package"}</p>
                  </Card>
                  <Card>
                    <BadgeIndianRupee className="text-[#16A34A]" />
                    <p className="mt-4 text-sm text-white/55">Paid / Pending</p>
                    <h2 className="mt-1 text-2xl font-black">{currency(paidTotal)}</h2>
                    <p className="text-sm text-[#FACC15]">Pending {currency(pendingTotal)}</p>
                  </Card>
                  <Card>
                    <Bell className="text-[#E10600]" />
                    <p className="mt-4 text-sm text-white/55">Latest Payment</p>
                    <h2 className="mt-1 text-2xl font-black">{selected.latestPaymentStatus || "No Payment"}</h2>
                    <p className="text-sm text-white/50">{selected.latestInvoice || "-"}</p>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <Card>
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-xl font-black">Profile</h2>
                      <Link href={`/members/card?id=${selected.id}`} className="w-full sm:w-auto">
                        <Button variant="secondary" className="w-full sm:w-auto"><FileText size={18} /> Card</Button>
                      </Link>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {row("Phone", selected.phone)}
                      {row("Emergency Contact", selected.emergencyContact)}
                      {row("Address", [selected.address, selected.addressLine2, selected.area, selected.city].filter(Boolean).join(", "))}
                      {row("Trainer", selected.trainer)}
                      {row("Status", selected.status)}
                      {row("Joining Date", selected.joiningDate)}
                      {row("Membership Start", selected.membershipStart)}
                      {row("Latest Payment Date", selected.latestPaymentDate)}
                      {row("Notes", selected.notes)}
                      {row("Medical Conditions", selected.medicalConditions)}
                    </div>
                  </Card>

                  <Card>
                    <h2 className="mb-5 text-xl font-black">Payment History</h2>
                    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="text-left text-white/45">
                          <tr>
                            <th className="py-3">Invoice</th>
                            <th>Type</th>
                            <th>Paid At</th>
                            <th>Amount</th>
                            <th>Paid</th>
                            <th>Pending</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {memberPayments.map((payment) => (
                            <tr key={payment.id} className="border-t border-white/8">
                              <td className="py-4">{payment.invoiceNumber}</td>
                              <td>{payment.type}</td>
                              <td>{payment.paidAt}</td>
                              <td>{currency(Number(payment.amount || 0))}</td>
                              <td>{currency(Number(payment.paidAmount || 0))}</td>
                              <td>{currency(Number(payment.pendingAmount || 0))}</td>
                              <td>{payment.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {memberPayments.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-white/55">No payment history yet.</div>}
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <div className="mb-5 flex items-center gap-2">
                      <Activity className="text-[#16A34A]" />
                      <h2 className="text-xl font-black">Attendance History</h2>
                    </div>
                    <div className="space-y-2">
                      {memberAttendance.map((item) => (
                        <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3 sm:flex-row sm:items-center sm:justify-between">
                          <span>{item.checkInAt}</span>
                          <span className="text-sm text-white/55">{item.source} / {item.status}</span>
                        </div>
                      ))}
                      {memberAttendance.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-white/55">No attendance records yet.</div>}
                    </div>
                  </Card>

                  <Card>
                    <div className="mb-5 flex items-center gap-2">
                      <Bell className="text-[#E10600]" />
                      <h2 className="text-xl font-black">Reminders</h2>
                    </div>
                    <div className="space-y-2">
                      {memberNotifications.map((item) => (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-bold">{item.title}</p>
                            <span className="text-xs text-white/45">{item.createdAt} / {item.deliveryStatus || item.audience || "-"}</span>
                          </div>
                          <p className="mt-2 text-sm text-white/62">{item.message}</p>
                        </div>
                      ))}
                      {memberNotifications.length === 0 && <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-white/55">No reminders yet.</div>}
                    </div>
                  </Card>
                </section>
              </>
            )}
          </div>
        </section>
      </main>
    </StaffGuard>
  );
}
