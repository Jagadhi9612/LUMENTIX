// Elite Fitness — Marketplace client helpers.
// Built on top of the existing lib/firestore-service.ts CRUD helpers so it
// follows the same conventions as every other module (members, packages...).

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase-firestore";
import { createRecord, getRecord } from "./firestore-service";
import type { Cart, CartItem, MarketplaceOrder, Product, Trainer, TrainerAvailabilitySlot } from "./firebase-types";

const TAX_RATE = 0.18; // GST 18% — adjust per category if your gym needs a split rate

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function computeTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

// ---------- Cart ----------
// Cart doc id == uid, same one-active-cart-per-user model used elsewhere.

export async function getCart(uid: string): Promise<Cart | null> {
  const snap = await getDoc(doc(db, "carts", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Cart) : null;
}

export async function addToCart(uid: string, product: Product, quantity = 1): Promise<void> {
  if (product.stock !== -1 && product.stock < quantity) throw new Error("Out of stock");

  const ref = doc(db, "carts", uid);
  const snap = await getDoc(ref);
  const newItem: CartItem = { productId: product.id, name: product.name, price: product.price, quantity };

  if (!snap.exists()) {
    await setDoc(ref, { uid, items: [newItem], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    return;
  }

  const cart = snap.data() as Cart;
  const items = [...cart.items];
  const idx = items.findIndex((i) => i.productId === product.id);
  if (idx >= 0) items[idx].quantity += quantity;
  else items.push(newItem);
  await updateDoc(ref, { items, updatedAt: new Date().toISOString() });
}

export async function updateCartItemQty(uid: string, productId: string, quantity: number): Promise<void> {
  const ref = doc(db, "carts", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const cart = snap.data() as Cart;
  const items =
    quantity <= 0
      ? cart.items.filter((i) => i.productId !== productId)
      : cart.items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
  await updateDoc(ref, { items, updatedAt: new Date().toISOString() });
}

// ---------- Orders ----------

/**
 * Creates an order in `pending_payment` status from the cart. Stock is not
 * touched here — it's decremented only on payment capture, server-side, so
 * an abandoned checkout never holds inventory hostage. See
 * verifyMarketplacePayment in apps/api/src/index.ts.
 */
export async function createOrderFromCart(uid: string, memberId?: string): Promise<string> {
  const cart = await getCart(uid);
  if (!cart || cart.items.length === 0) throw new Error("Your cart is empty.");

  for (const item of cart.items) {
    const product = await getRecord<Product>("products", item.productId);
    if (!product || !product.active) throw new Error(`${item.name} is no longer available.`);
    if (product.stock !== -1 && product.stock < item.quantity) throw new Error(`${item.name} has insufficient stock.`);
  }

  const { subtotal, tax, total } = computeTotals(cart.items);

  return createRecord("orders", {
    uid,
    memberId: memberId ?? "",
    items: cart.items,
    subtotal,
    tax,
    total,
    status: "pending_payment"
  });
}

export async function getOrder(orderId: string): Promise<MarketplaceOrder | null> {
  return getRecord<MarketplaceOrder>("orders", orderId);
}

// ---------- Trainer availability ----------
// availabilityText uses the plain-text format "Mon 06:00-07:00, Wed 06:00-07:00"
// so it fits the existing ModuleManager textarea field — no schema migration
// needed for a nested array type.

const DAY_MAP: Record<string, TrainerAvailabilitySlot["dayOfWeek"]> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};

export function parseAvailability(text?: string): TrainerAvailabilitySlot[] {
  if (!text) return [];
  return text
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [dayRaw, range] = chunk.split(/\s+/, 2);
      const [startTime, endTime] = (range || "").split("-");
      const dayOfWeek = DAY_MAP[dayRaw?.toLowerCase().slice(0, 3)];
      if (dayOfWeek === undefined || !startTime || !endTime) return null;
      return { dayOfWeek, startTime, endTime };
    })
    .filter((slot): slot is TrainerAvailabilitySlot => slot !== null);
}

export function bookableTrainers(trainers: Trainer[]): Trainer[] {
  return trainers.filter((t) => t.bookable && t.status === "Active");
}
