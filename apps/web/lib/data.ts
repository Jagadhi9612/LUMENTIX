import {
  Activity,
  BadgeIndianRupee,
  Bell,
  CalendarDays,
  CreditCard,
  Dumbbell,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards
} from "lucide-react";

export const metrics = [
  { label: "Today's Revenue", value: 184500, change: "+18%", icon: BadgeIndianRupee },
  { label: "Active Members", value: 1284, change: "+42", icon: Users },
  { label: "Renewals Due", value: 78, change: "7 days", icon: CalendarDays },
  { label: "Cash Flow", value: 542000, change: "+11%", icon: WalletCards }
];

export const dashboardModules = [
  { title: "Members", count: "1,428", detail: "active, frozen, expired and suspended profiles", icon: Users },
  { title: "Payments", count: "Rs 18.4L", detail: "cash, UPI, card, cheque and split receipts", icon: CreditCard },
  { title: "Attendance", count: "642", detail: "QR, barcode and manual check-ins today", icon: Activity },
  { title: "Packages", count: "24", detail: "plans, offers, GST and freeze rules", icon: PackageCheck },
  { title: "Trainers", count: "18", detail: "shifts, assignments, salaries and performance", icon: Dumbbell },
  { title: "Reports", count: "32", detail: "revenue, expenses, membership and outstanding", icon: ReceiptText },
  { title: "Notifications", count: "156", detail: "expiry, birthday, payment and offers", icon: Bell },
  { title: "Security", count: "RBAC", detail: "roles, audit logs and protected actions", icon: ShieldCheck }
];

export const revenueSeries = [
  { month: "Jan", revenue: 920000, expenses: 420000, members: 884 },
  { month: "Feb", revenue: 1080000, expenses: 452000, members: 934 },
  { month: "Mar", revenue: 1245000, expenses: 484000, members: 1002 },
  { month: "Apr", revenue: 1390000, expenses: 510000, members: 1086 },
  { month: "May", revenue: 1580000, expenses: 544000, members: 1198 },
  { month: "Jun", revenue: 1845000, expenses: 598000, members: 1284 }
];

export const recentMembers = [
  { id: "ELT-2026-0001", name: "Ananya Sharma", plan: "Elite Annual", trainer: "Vikram Rao", status: "Active", due: "19 Jun 2027" },
  { id: "ELT-2026-0002", name: "Rohan Mehta", plan: "Strength PT", trainer: "Karan Gill", status: "Active", due: "02 Dec 2026" },
  { id: "ELT-2026-0003", name: "Nisha Varma", plan: "Corporate", trainer: "Sara Khan", status: "Renewal", due: "26 Jun 2026" },
  { id: "ELT-2026-0004", name: "Arjun Reddy", plan: "Quarterly", trainer: "Vikram Rao", status: "Frozen", due: "11 Aug 2026" }
];

export const payments = [
  { invoice: "ELT-INV-20260619-0001", member: "Ananya Sharma", method: "UPI", amount: 58408, status: "Paid" },
  { invoice: "ELT-INV-20260619-0002", member: "Rohan Mehta", method: "Card", amount: 32000, status: "Paid" },
  { invoice: "ELT-INV-20260618-0008", member: "Nisha Varma", method: "Split", amount: 12000, status: "Partial" },
  { invoice: "ELT-INV-20260618-0007", member: "Arjun Reddy", method: "Cash", amount: 18500, status: "Paid" }
];

export const packages = [
  { name: "Monthly", price: "Rs 4,999", duration: "30 days", badge: "Starter", color: "#E10600" },
  { name: "Quarterly", price: "Rs 13,999", duration: "90 days", badge: "Popular", color: "#16A34A" },
  { name: "Elite Annual", price: "Rs 54,999", duration: "365 days", badge: "Best Value", color: "#FACC15" }
];
