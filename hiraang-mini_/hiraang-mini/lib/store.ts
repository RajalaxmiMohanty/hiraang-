"use client";

import {
  Customer,
  InventoryItem,
  Invoice,
  InvoicePayment,
  Settings,
  Counters,
  PaymentStatus,
  CATEGORY_CODES,
  Category,
} from "@/types/inventory";
import { createSeedData, createDefaultSettings } from "@/lib/seed";
import { numberToWords } from "@/lib/calculations";
import { uid } from "@/lib/utils";

const PREFIX = "hiraang-mini:";
const KEYS = {
  customers: `${PREFIX}customers`,
  inventory: `${PREFIX}inventory`,
  invoices: `${PREFIX}invoices`,
  settings: `${PREFIX}settings`,
  counters: `${PREFIX}counters`,
  seeded: `${PREFIX}seeded`,
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function read<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeeded(): void {
  if (!canUseStorage()) return;
  if (localStorage.getItem(KEYS.seeded) === "1") return;
  const seed = createSeedData();
  write(KEYS.customers, seed.customers);
  write(KEYS.inventory, seed.inventory);
  write(KEYS.invoices, seed.invoices);
  write(KEYS.settings, seed.settings);
  write(KEYS.counters, seed.counters);
  localStorage.setItem(KEYS.seeded, "1");
}

export function resetToSeed(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEYS.seeded);
  Object.values(KEYS).forEach((k) => {
    if (k !== KEYS.seeded) localStorage.removeItem(k);
  });
  ensureSeeded();
}

export function getSettings(): Settings {
  ensureSeeded();
  return read(KEYS.settings, createDefaultSettings());
}

export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}

export function getCustomers(): Customer[] {
  ensureSeeded();
  return read<Customer[]>(KEYS.customers, []);
}

export function saveCustomers(customers: Customer[]): void {
  write(KEYS.customers, customers);
}

export function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Customer {
  const customers = getCustomers();
  const customer: Customer = {
    ...data,
    id: uid(),
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  saveCustomers(customers);
  return customer;
}

export function updateCustomer(
  id: string,
  data: Omit<Customer, "id" | "createdAt" | "updatedAt">
): Customer {
  const customers = getCustomers();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error("Customer not found");
  const updated: Customer = {
    ...customers[idx],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  customers[idx] = updated;
  saveCustomers(customers);
  return updated;
}

export function deleteCustomer(id: string): void {
  saveCustomers(getCustomers().filter((c) => c.id !== id));
}

export function searchCustomers(q: string): Customer[] {
  const query = q.toLowerCase().trim();
  if (!query) return getCustomers();
  return getCustomers().filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
  );
}

export function getInventory(): InventoryItem[] {
  ensureSeeded();
  return read<InventoryItem[]>(KEYS.inventory, []);
}

export function saveInventory(items: InventoryItem[]): void {
  write(KEYS.inventory, items);
}

export function getCounters(): Counters {
  ensureSeeded();
  return read<Counters>(KEYS.counters, {
    nextInvoiceSeq: 1,
    skuSequences: {},
  });
}

export function saveCounters(counters: Counters): void {
  write(KEYS.counters, counters);
}

export function generateSKU(category: Category): string {
  const counters = getCounters();
  const code = CATEGORY_CODES[category];
  const seq = counters.skuSequences[code] || 1;
  counters.skuSequences[code] = seq + 1;
  saveCounters(counters);
  return `${code}-${String(seq).padStart(4, "0")}`;
}

export function peekNextInvoiceNumber(dateStr: string): string {
  const counters = getCounters();
  const year = new Date(dateStr).getFullYear();
  return `INV-${year}-${String(counters.nextInvoiceSeq).padStart(4, "0")}`;
}

export function allocateInvoiceNumber(dateStr: string): string {
  const counters = getCounters();
  const year = new Date(dateStr).getFullYear();
  const number = `INV-${year}-${String(counters.nextInvoiceSeq).padStart(4, "0")}`;
  counters.nextInvoiceSeq += 1;
  saveCounters(counters);
  return number;
}

export function createInventoryItem(item: InventoryItem): InventoryItem {
  const items = getInventory();
  items.push(item);
  saveInventory(items);
  return item;
}

export function updateInventoryItem(item: InventoryItem): InventoryItem {
  const items = getInventory();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx < 0) throw new Error("Inventory item not found");
  items[idx] = item;
  saveInventory(items);
  return item;
}

export function deleteInventoryItem(id: string): void {
  saveInventory(getInventory().filter((i) => i.id !== id));
}

export function getInvoices(): Invoice[] {
  ensureSeeded();
  return read<Invoice[]>(KEYS.invoices, []);
}

export function saveInvoices(invoices: Invoice[]): void {
  write(KEYS.invoices, invoices);
}

function derivePaymentStatus(
  netTotal: number,
  payments: InvoicePayment[]
): PaymentStatus {
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  if (paid <= 0) return "pending";
  if (paid + 0.009 >= netTotal) return "paid";
  return "partial";
}

function applyStockOnIssue(invoice: Invoice, previous?: Invoice): void {
  const settings = getSettings();
  if (!settings.reduceStockOnIssue) return;
  if (invoice.status !== "Issued") return;
  if (previous?.status === "Issued") return;

  const items = getInventory();
  let changed = false;
  for (const line of invoice.items) {
    const idx = items.findIndex((i) => i.id === line.linkedInventoryItem.id);
    if (idx < 0) continue;
    const qty = Math.max(0, items[idx].stockQuantity - line.quantity);
    items[idx] = {
      ...items[idx],
      stockQuantity: qty,
      stockStatus: qty === 0 ? "Sold" : items[idx].stockStatus,
    };
    changed = true;
  }
  if (changed) saveInventory(items);
}

function restoreStockOnCancel(invoice: Invoice): void {
  const settings = getSettings();
  if (!settings.reduceStockOnIssue) return;
  if (invoice.status !== "Issued") return;

  const items = getInventory();
  let changed = false;
  for (const line of invoice.items) {
    const idx = items.findIndex((i) => i.id === line.linkedInventoryItem.id);
    if (idx < 0) continue;
    const qty = items[idx].stockQuantity + line.quantity;
    items[idx] = {
      ...items[idx],
      stockQuantity: qty,
      stockStatus:
        items[idx].stockStatus === "Sold" && qty > 0
          ? "Available"
          : items[idx].stockStatus,
    };
    changed = true;
  }
  if (changed) saveInventory(items);
}

export function saveInvoice(invoice: Invoice, isNew: boolean): Invoice {
  const invoices = getInvoices();
  const previous = invoices.find((i) => i.id === invoice.id);
  let toSave = { ...invoice };

  if (isNew && !previous) {
    toSave.invoiceNumber = allocateInvoiceNumber(toSave.date);
  }

  toSave.payments = toSave.payments || [];
  toSave.paymentStatus = derivePaymentStatus(
    toSave.netTotal,
    toSave.payments
  );
  toSave.totalAmountWords = numberToWords(toSave.netTotal);

  if (previous) {
    invoices[invoices.findIndex((i) => i.id === invoice.id)] = toSave;
  } else {
    invoices.unshift(toSave);
  }
  saveInvoices(invoices);
  applyStockOnIssue(toSave, previous);
  return toSave;
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices();
  const invoice = invoices.find((i) => i.id === id);
  if (invoice && invoice.status === "Issued" && !invoice.isCancelled) {
    restoreStockOnCancel(invoice);
  }
  saveInvoices(invoices.filter((i) => i.id !== id));
}

export function cancelInvoice(id: string, reason: string): Invoice {
  const invoices = getInvoices();
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx < 0) throw new Error("Invoice not found");
  const invoice = invoices[idx];
  if (invoice.status === "Issued" && !invoice.isCancelled) {
    restoreStockOnCancel(invoice);
  }
  const updated: Invoice = {
    ...invoice,
    isCancelled: true,
    cancelledAt: new Date().toISOString(),
    cancellationReason: reason,
  };
  invoices[idx] = updated;
  saveInvoices(invoices);
  return updated;
}

export function addPayment(
  invoiceId: string,
  payment: Omit<InvoicePayment, "id" | "invoiceId">
): Invoice {
  const invoices = getInvoices();
  const idx = invoices.findIndex((i) => i.id === invoiceId);
  if (idx < 0) throw new Error("Invoice not found");
  const invoice = invoices[idx];
  const payments = [
    ...(invoice.payments || []),
    { ...payment, id: uid(), invoiceId },
  ];
  const updated: Invoice = {
    ...invoice,
    payments,
    paymentStatus: derivePaymentStatus(invoice.netTotal, payments),
  };
  invoices[idx] = updated;
  saveInvoices(invoices);
  return updated;
}

export function getDashboardStats() {
  const customers = getCustomers();
  const inventory = getInventory();
  const invoices = getInvoices().filter((i) => !i.isCancelled);
  const available = inventory.filter(
    (i) => i.stockStatus === "Available" && i.stockQuantity > 0
  );

  const totalItems = inventory.reduce((sum, item) => sum + item.stockQuantity, 0);
  const totalAvailable = available.reduce((sum, item) => sum + item.stockQuantity, 0);
  const totalGoldWeight = inventory.reduce(
    (sum, item) => sum + item.goldWeightGram * item.stockQuantity,
    0
  );
  const totalDiamondWeight = inventory.reduce(
    (sum, item) =>
      sum +
      item.diamondSets.reduce((d, ds) => d + ds.totalCarat, 0) *
        item.stockQuantity,
    0
  );
  const totalValuation = inventory.reduce(
    (sum, item) => sum + item.totalValue * item.stockQuantity,
    0
  );

  const issued = invoices.filter((i) => i.status === "Issued");
  const totalSold = issued.reduce(
    (sum, inv) =>
      sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const totalSalesValue = issued.reduce((sum, inv) => sum + inv.netTotal, 0);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = now.getDay();
  const weekOffset = day === 0 ? 6 : day - 1;
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - weekOffset);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inRange = (dateStr: string, from: Date) => {
    const d = new Date(dateStr);
    return d >= from && d <= now;
  };

  const todayInvoices = issued.filter((i) => inRange(i.date, startOfDay));
  const weekInvoices = issued.filter((i) => inRange(i.date, startOfWeek));
  const monthInvoices = issued.filter((i) => inRange(i.date, startOfMonth));

  const outstanding = issued
    .filter((i) => i.paymentStatus !== "paid")
    .reduce((sum, inv) => {
      const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
      return sum + Math.max(0, inv.netTotal - paid);
    }, 0);

  return {
    customerCount: customers.length,
    inventoryCount: inventory.length,
    availableCount: available.length,
    availableQty: totalAvailable,
    totalItems,
    totalAvailable,
    totalGoldWeight,
    totalDiamondWeight,
    totalValuation,
    totalSold,
    totalSalesValue,
    todaySales: todayInvoices.reduce((s, i) => s + i.netTotal, 0),
    todayInvoiceCount: todayInvoices.length,
    weeklySales: weekInvoices.reduce((s, i) => s + i.netTotal, 0),
    weekInvoiceCount: weekInvoices.length,
    monthlySales: monthInvoices.reduce((s, i) => s + i.netTotal, 0),
    monthInvoiceCount: monthInvoices.length,
    outstanding,
    invoiceCount: invoices.length,
    draftCount: invoices.filter((i) => i.status === "Draft").length,
    issuedCount: issued.length,
    pendingPaymentCount: issued.filter((i) => i.paymentStatus !== "paid")
      .length,
  };
}
