import { z } from "zod";
import type { Attendance, Expense, GymPackage, Member, NotificationRecord, Payment, Trainer } from "./firebase-types";

export const gymAddress = {
  name: "ELITE FITNESS",
  line1: "LALACHERUV",
  city: "RAJAHMUNDRY",
  state: "ANDHRA PRADESH"
};

export const memberSchema = z.object({
  memberId: z.string().optional(),
  fullName: z.string().min(2),
  gender: z.string().optional(),
  dob: z.string().optional(),
  age: z.coerce.number().min(0).optional(),
  phone: z.string().min(8),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(2),
  addressLine2: z.string().optional(),
  area: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  emergencyContact: z.string().min(8),
  occupation: z.string().optional(),
  bloodGroup: z.string().optional(),
  height: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  bmi: z.coerce.number().min(0).optional(),
  medicalConditions: z.string().optional(),
  trainer: z.string().optional(),
  packageName: z.string().optional(),
  joiningDate: z.string().optional(),
  membershipStart: z.string().optional(),
  membershipEnd: z.string().optional(),
  latestPaymentStatus: z.enum(["Paid", "Partial", "Pending", "Refunded", "No Payment"]).optional(),
  latestPaymentDate: z.string().optional(),
  latestInvoice: z.string().optional(),
  latestPaymentId: z.string().optional(),
  pendingAmount: z.coerce.number().min(0).optional(),
  lastRenewalPaymentId: z.string().optional(),
  initialPaymentMethod: z.enum(["Cash", "UPI", "Card", "Bank Transfer"]).optional(),
  initialPaymentStatus: z.enum(["Paid", "Partial", "Pending"]).optional(),
  initialPaymentAmount: z.coerce.number().min(0).optional(),
  initialPaidAmount: z.coerce.number().min(0).optional(),
  initialPendingAmount: z.coerce.number().min(0).optional(),
  initialPaidAt: z.string().optional(),
  initialInvoiceNumber: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Suspended", "Frozen", "Expired"]).optional(),
  notes: z.string().optional(),
  lockerNumber: z.string().optional()
});

export const memberDefaults = {
  memberId: "",
  fullName: "",
  gender: "Female",
  dob: "",
  age: 18,
  phone: "",
  whatsapp: "",
  email: "",
  address: gymAddress.line1,
  addressLine2: "",
  area: "Lalachervu",
  city: "Rajahmundry",
  state: "Andhra Pradesh",
  pinCode: "",
  emergencyContact: "",
  occupation: "",
  bloodGroup: "",
  height: 170,
  weight: 70,
  bmi: 24.2,
  medicalConditions: "",
  trainer: "",
  packageName: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  membershipStart: new Date().toISOString().slice(0, 10),
  membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  latestPaymentStatus: "No Payment",
  latestPaymentDate: "",
  latestInvoice: "",
  latestPaymentId: "",
  pendingAmount: 0,
  lastRenewalPaymentId: "",
  initialPaymentMethod: "UPI",
  initialPaymentStatus: "Paid",
  initialPaymentAmount: 0,
  initialPaidAmount: 0,
  initialPendingAmount: 0,
  initialPaidAt: new Date().toISOString().slice(0, 10),
  initialInvoiceNumber: `EF-INV-${Date.now()}`,
  status: "Active",
  notes: "",
  lockerNumber: ""
};

export const memberFields = [
  { name: "fullName", label: "Full Name", required: true },
  { name: "phone", label: "Phone", required: true },
  { name: "emergencyContact", label: "Emergency Contact", required: true },
  { name: "address", label: "Address", required: true },
  { name: "packageName", label: "Package" },
  { name: "membershipStart", label: "Membership Start", type: "date" },
  { name: "membershipEnd", label: "Membership End", type: "date" },
  { name: "initialPaymentAmount", label: "Subscription Amount", type: "number" },
  { name: "initialPaidAmount", label: "Paid Amount", type: "number" },
  { name: "initialPendingAmount", label: "Pending Amount", type: "number" },
  { name: "initialPaymentMethod", label: "Payment Method", type: "select", options: ["Cash", "UPI", "Card", "Bank Transfer"] },
  { name: "initialPaymentStatus", label: "Payment Status", type: "select", options: ["Paid", "Partial", "Pending"] },
  { name: "initialPaidAt", label: "Payment Date", type: "date" },
  { name: "initialInvoiceNumber", label: "Invoice Number" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Inactive", "Suspended", "Frozen", "Expired"] },
  { name: "trainer", label: "Trainer" },
  { name: "gender", label: "Gender", type: "select", options: ["Female", "Male", "Other"] },
  { name: "dob", label: "DOB", type: "date" },
  { name: "age", label: "Age", type: "number" },
  { name: "whatsapp", label: "WhatsApp" },
  { name: "email", label: "Email", type: "email" },
  { name: "addressLine2", label: "Address Line 2" },
  { name: "area", label: "Area" },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "pinCode", label: "PIN Code" },
  { name: "occupation", label: "Occupation" },
  { name: "bloodGroup", label: "Blood Group" },
  { name: "height", label: "Height", type: "number" },
  { name: "weight", label: "Weight", type: "number" },
  { name: "bmi", label: "BMI", type: "number" },
  { name: "medicalConditions", label: "Medical Conditions", type: "textarea" },
  { name: "joiningDate", label: "Joining Date", type: "date" },
  { name: "lockerNumber", label: "Locker Number" },
  { name: "notes", label: "Notes", type: "textarea" }
] as const;

export const packageSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  durationDays: z.coerce.number().positive(),
  price: z.coerce.number().positive(),
  discount: z.coerce.number().min(0),
  gst: z.coerce.number().min(0),
  facilities: z.string().min(2),
  trainerIncluded: z.boolean(),
  color: z.string().min(4),
  status: z.enum(["Active", "Inactive"])
});

export const packageDefaults = { name: "Monthly", description: "", durationDays: 30, price: 0, discount: 0, gst: 18, facilities: "", trainerIncluded: false, color: "#E10600", status: "Active" };

export const packageFields = [
  { name: "name", label: "Name", type: "select", options: ["Monthly", "Quarterly", "Half Yearly", "6 Months", "Yearly", "Premium", "Elite", "Personal Training", "Corporate", "Student"] },
  { name: "description", label: "Description", type: "textarea" },
  { name: "durationDays", label: "Duration Days", type: "number" },
  { name: "price", label: "Price", type: "number" },
  { name: "discount", label: "Discount", type: "number" },
  { name: "gst", label: "GST", type: "number" },
  { name: "facilities", label: "Facilities", type: "textarea" },
  { name: "trainerIncluded", label: "Trainer Included", type: "checkbox" },
  { name: "color", label: "Color Badge" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
] as const;

export const paymentSchema = z.object({
  memberId: z.string().min(2),
  memberName: z.string().min(2),
  method: z.enum(["Cash", "UPI", "Card", "Bank Transfer"]),
  type: z.enum(["Admission", "Renewal", "Partial", "Advance", "Refund"]),
  amount: z.coerce.number(),
  paidAmount: z.coerce.number(),
  pendingAmount: z.coerce.number(),
  invoiceNumber: z.string().min(2),
  status: z.enum(["Paid", "Partial", "Pending", "Refunded"]),
  paidAt: z.string().min(4),
  membershipStart: z.string().optional(),
  membershipEnd: z.string().optional()
});

export const paymentDefaults = { memberId: "", memberName: "", method: "UPI", type: "Admission", amount: 0, paidAmount: 0, pendingAmount: 0, invoiceNumber: `EF-INV-${Date.now()}`, status: "Paid", paidAt: new Date().toISOString().slice(0, 10) };

export const paymentFields = [
  { name: "memberId", label: "Member ID" },
  { name: "memberName", label: "Member Name" },
  { name: "method", label: "Method", type: "select", options: ["Cash", "UPI", "Card", "Bank Transfer"] },
  { name: "type", label: "Payment Type", type: "select", options: ["Admission", "Renewal", "Partial", "Advance", "Refund"] },
  { name: "amount", label: "Amount", type: "number" },
  { name: "paidAmount", label: "Paid Amount", type: "number" },
  { name: "pendingAmount", label: "Pending Amount", type: "number" },
  { name: "invoiceNumber", label: "Invoice Number" },
  { name: "status", label: "Status", type: "select", options: ["Paid", "Partial", "Pending", "Refunded"] },
  { name: "paidAt", label: "Paid At", type: "date" }
] as const;

export const attendanceSchema = z.object({
  memberId: z.string().min(2),
  memberName: z.string().min(2),
  source: z.enum(["QR", "Barcode", "Manual"]),
  status: z.enum(["Checked In", "Checked Out", "Late", "Missed"]),
  checkInAt: z.string().min(4),
  checkOutAt: z.string().optional()
});

export const attendanceDefaults = { memberId: "", memberName: "", source: "Manual", status: "Checked In", checkInAt: new Date().toISOString().slice(0, 16), checkOutAt: "" };

export const attendanceFields = [
  { name: "memberId", label: "Member ID" },
  { name: "memberName", label: "Member Name" },
  { name: "source", label: "Source", type: "select", options: ["QR", "Barcode", "Manual"] },
  { name: "status", label: "Status", type: "select", options: ["Checked In", "Checked Out", "Late", "Missed"] },
  { name: "checkInAt", label: "Check In At", type: "date" },
  { name: "checkOutAt", label: "Check Out At", type: "date" }
] as const;

export const trainerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  specialization: z.string().min(2),
  experience: z.coerce.number().min(0),
  salary: z.coerce.number().min(0),
  certificates: z.string().optional(),
  assignedMembers: z.string().optional(),
  status: z.enum(["Active", "Inactive"])
});

export const trainerDefaults = { name: "", phone: "", email: "", specialization: "", experience: 0, salary: 0, certificates: "", assignedMembers: "", status: "Active" };

export const trainerFields = [
  { name: "name", label: "Name" },
  { name: "phone", label: "Phone" },
  { name: "email", label: "Email", type: "email" },
  { name: "specialization", label: "Specialization" },
  { name: "experience", label: "Experience", type: "number" },
  { name: "salary", label: "Salary", type: "number" },
  { name: "certificates", label: "Certificates", type: "textarea" },
  { name: "assignedMembers", label: "Assigned Members", type: "textarea" },
  { name: "status", label: "Status", type: "select", options: ["Active", "Inactive"] }
] as const;

export const expenseSchema = z.object({ category: z.string().min(2), amount: z.coerce.number().min(0), vendor: z.string().optional(), description: z.string().min(2), spentAt: z.string().min(4) });
export const expenseDefaults = { category: "Electricity", amount: 0, vendor: "", description: "", spentAt: new Date().toISOString().slice(0, 10) };
export const expenseFields = [
  { name: "category", label: "Category", type: "select", options: ["Electricity", "Rent", "Equipment", "Salary", "Maintenance", "Marketing", "Cleaning", "Water", "Internet", "Miscellaneous"] },
  { name: "amount", label: "Amount", type: "number" },
  { name: "vendor", label: "Vendor" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "spentAt", label: "Spent At", type: "date" }
] as const;

export const notificationSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.enum(["Membership Expiry", "Birthday Wish", "Payment Reminder", "Offer", "System Alert"]),
  read: z.boolean(),
  createdAt: z.string().min(4),
  memberId: z.string().optional(),
  memberName: z.string().optional(),
  membershipEnd: z.string().optional(),
  paymentStatus: z.enum(["Paid", "Partial", "Pending", "Refunded", "No Payment"]).optional(),
  paymentId: z.string().optional(),
  paymentUrl: z.string().optional(),
  reminderWindow: z.enum(["morning", "evening"]).optional(),
  scheduledFor: z.string().optional(),
  deliveryStatus: z.enum(["queued", "sent", "skipped", "failed"]).optional(),
  audience: z.enum(["staff", "member", "both"]).optional(),
  pendingAmount: z.coerce.number().min(0).optional(),
  paymentAction: z.string().optional()
});
export const notificationDefaults = { title: "", message: "", type: "System Alert", read: false, createdAt: new Date().toISOString().slice(0, 10) };
export const notificationFields = [
  { name: "title", label: "Title" },
  { name: "message", label: "Message", type: "textarea" },
  { name: "type", label: "Type", type: "select", options: ["Membership Expiry", "Birthday Wish", "Payment Reminder", "Offer", "System Alert"] },
  { name: "read", label: "Read", type: "checkbox" },
  { name: "createdAt", label: "Created At", type: "date" },
  { name: "memberId", label: "Member ID" },
  { name: "memberName", label: "Member Name" },
  { name: "membershipEnd", label: "Membership End", type: "date" },
  { name: "paymentStatus", label: "Payment Status", type: "select", options: ["Paid", "Partial", "Pending", "Refunded", "No Payment"] },
  { name: "paymentUrl", label: "Payment URL" },
  { name: "reminderWindow", label: "Reminder Window", type: "select", options: ["morning", "evening"] },
  { name: "scheduledFor", label: "Scheduled For" },
  { name: "deliveryStatus", label: "Delivery Status", type: "select", options: ["queued", "sent", "skipped", "failed"] },
  { name: "audience", label: "Audience", type: "select", options: ["staff", "member", "both"] },
  { name: "pendingAmount", label: "Pending Amount", type: "number" },
  { name: "paymentAction", label: "Payment Action" }
] as const;

export type { Attendance, Expense, GymPackage, Member, NotificationRecord, Payment, Trainer };
