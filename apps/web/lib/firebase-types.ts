export type Status = "Active" | "Inactive" | "Suspended" | "Frozen" | "Expired" | "Pending" | "Paid" | "Partial" | "Refunded";

export type BaseRecord = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Member = BaseRecord & {
  memberId: string;
  photoUrl?: string;
  fullName: string;
  gender?: string;
  dob?: string;
  age?: number;
  phone: string;
  whatsapp?: string;
  email?: string;
  address: string;
  addressLine2?: string;
  area?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  emergencyContact: string;
  occupation?: string;
  bloodGroup?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  medicalConditions?: string;
  trainer?: string;
  packageName?: string;
  joiningDate?: string;
  membershipStart?: string;
  membershipEnd?: string;
  latestPaymentStatus?: "Paid" | "Partial" | "Pending" | "Refunded" | "No Payment";
  latestPaymentDate?: string;
  latestInvoice?: string;
  latestPaymentId?: string;
  pendingAmount?: number;
  lastRenewalPaymentId?: string;
  status?: Status;
  notes?: string;
  lockerNumber?: string;
  documents?: string[];
};

export type GymPackage = BaseRecord & {
  name: string;
  description: string;
  durationDays: number;
  price: number;
  discount: number;
  gst: number;
  facilities: string;
  trainerIncluded: boolean;
  color: string;
  status: "Active" | "Inactive";
};

export type Payment = BaseRecord & {
  memberId: string;
  memberName: string;
  method: "Cash" | "UPI" | "Card" | "Bank Transfer";
  type: "Admission" | "Renewal" | "Partial" | "Advance" | "Refund";
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  invoiceNumber: string;
  status: Status;
  paidAt: string;
  membershipStart?: string;
  membershipEnd?: string;
};

export type Attendance = BaseRecord & {
  memberId: string;
  memberName: string;
  source: "QR" | "Barcode" | "Manual";
  status: "Checked In" | "Checked Out" | "Late" | "Missed";
  checkInAt: string;
  checkOutAt?: string;
};

export type Trainer = BaseRecord & {
  name: string;
  phone: string;
  email: string;
  specialization: string;
  experience: number;
  salary: number;
  certificates: string;
  assignedMembers: string;
  status: "Active" | "Inactive";
};

export type Expense = BaseRecord & {
  category: string;
  amount: number;
  vendor: string;
  description: string;
  spentAt: string;
};

export type NotificationRecord = BaseRecord & {
  title: string;
  message: string;
  type: "Membership Expiry" | "Birthday Wish" | "Payment Reminder" | "Offer" | "System Alert";
  read: boolean;
  createdAt: string;
  memberId?: string;
  memberName?: string;
  membershipEnd?: string;
  paymentStatus?: "Paid" | "Partial" | "Pending" | "Refunded" | "No Payment";
  paymentId?: string;
  paymentUrl?: string;
  reminderWindow?: "morning" | "evening";
  scheduledFor?: string;
  deliveryStatus?: "queued" | "sent" | "skipped" | "failed";
  audience?: "staff" | "member" | "both";
  pendingAmount?: number;
  paymentAction?: string;
};

export type GymSettings = BaseRecord & {
  gymName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  businessHours: string;
  invoicePrefix: string;
  gst: number;
  upiId?: string;
  renewalPaymentUrl?: string;
  logoUrl?: string;
};
