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
  // Optional marketplace-facing fields — additive, existing Trainer records
  // work fine without these (booking UI just shows fewer details).
  bio?: string;
  photoUrl?: string;
  pricePerSession?: number;
  bookable?: boolean;
  // Simple "Mon 06:00-07:00, Wed 06:00-07:00" text format — kept as plain
  // text rather than a nested array so it fits the existing ModuleManager
  // form (text/number/date/select/textarea fields only). Parsed by
  // lib/marketplace.ts at render time.
  availabilityText?: string;
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

export type ProductCategory = "supplements" | "equipment" | "apparel" | "accessories" | "diet-plans" | "workout-plans";

export type Product = BaseRecord & {
  name: string;
  description: string;
  category: ProductCategory;
  imagesText?: string; // comma-separated URLs; split with .split(",").map(s => s.trim())
  price: number; // rupees, matches GymPackage/Payment convention (no paise)
  compareAtPrice?: number;
  stock: number; // -1 = unlimited (digital goods)
  isDigital: boolean;
  active: boolean;
  sku?: string;
  ratingAvg?: number;
  ratingCount?: number;
};

export type MarketplaceOrderStatus = "pending_payment" | "paid" | "processing" | "delivered" | "cancelled" | "refunded";

export type MarketplaceOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type MarketplaceOrder = BaseRecord & {
  uid: string; // Firebase Auth uid of the buying member
  memberId?: string; // linked members/{doc}.memberId, if account is linked
  items: MarketplaceOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: MarketplaceOrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Cart = BaseRecord & {
  uid: string;
  items: CartItem[];
};

export type TrainerAvailabilitySlot = { dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; startTime: string; endTime: string };

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Booking = BaseRecord & {
  uid: string;
  memberId?: string;
  trainerId: string;
  trainerName: string;
  date: string; // "2026-07-10"
  startTime: string;
  endTime: string;
  status: BookingStatus;
  price: number;
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
