"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Invoice,
  InvoiceItem,
  InventoryItem,
  Settings,
  Customer,
  PAYMENT_MODES,
} from "@/types/inventory";
import {
  calculateGoldAmount,
  calculateGSTComponents,
  formatCurrency,
  getGoldRateFromTable,
  numberToWords,
} from "@/lib/calculations";
import { getCustomers, peekNextInvoiceNumber } from "@/lib/store";
import { uid } from "@/lib/utils";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InvoiceBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (invoice: Invoice, isNew: boolean) => void;
  invoice: Invoice | null;
  inventory: InventoryItem[];
  settings: Settings;
}

export default function InvoiceBuilder({
  open,
  onOpenChange,
  onSave,
  invoice,
  inventory,
  settings,
}: InvoiceBuilderProps) {
  const [formData, setFormData] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [discountPercentInput, setDiscountPercentInput] = useState("");
  const isNew = !invoice;

  useEffect(() => {
    if (!open) return;
    setCustomers(getCustomers());
    const baseline =
      getGoldRateFromTable(settings, "24KT") || settings.goldRate;

    if (invoice) {
      setFormData({ ...invoice, payments: invoice.payments || [] });
      setDiscountAmountInput(
        invoice.discountAmount ? String(invoice.discountAmount) : ""
      );
      setDiscountPercentInput(
        invoice.discountPercent ? String(invoice.discountPercent) : ""
      );
    } else {
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        id: uid(),
        invoiceNumber: peekNextInvoiceNumber(today),
        date: today,
        modeOfPayment: "Cash",
        customerName: "",
        customerAddress: "",
        customerPhone: "",
        customerGSTIN: "",
        customerPAN: "",
        customerState: "",
        placeOfSupply: "",
        policyUsed: settings.policy,
        goldRate: baseline,
        taxPercent: settings.taxPercent,
        cgst: 0,
        sgst: 0,
        igst: 0,
        items: [],
        subtotal: 0,
        tax: 0,
        grandTotal: 0,
        discountAmount: 0,
        discountPercent: 0,
        netTotal: 0,
        paymentStatus: "pending",
        status: "Draft",
        payments: [],
      });
      setDiscountAmountInput("");
      setDiscountPercentInput("");
    }
    setItemSearch("");
    setShowSearch(false);
  }, [open, invoice, settings]);

  const availableItems = useMemo(() => {
    if (!formData) return [];
    return inventory.filter(
      (item) =>
        (item.stockStatus === "Available" || item.stockStatus === "On Order") &&
        item.stockQuantity > 0 &&
        !formData.items.some((ii) => ii.linkedInventoryItem.id === item.id)
    );
  }, [inventory, formData]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return availableItems.slice(0, 8);
    return availableItems
      .filter(
        (item) =>
          item.sku.toLowerCase().includes(q) ||
          item.itemName.toLowerCase().includes(q) ||
          item.huid.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [availableItems, itemSearch]);

  if (!formData) return null;

  const updateTotals = (
    items: InvoiceItem[],
    state = formData.customerState,
    discountAmount = formData.discountAmount || 0,
    discountPercent = formData.discountPercent || 0
  ) => {
    const subtotal = Number(
      items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
    );
    const gst = state
      ? calculateGSTComponents(subtotal, state)
      : { cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const grandTotal = Number((subtotal + gst.totalTax).toFixed(2));
    const finalDiscount = Math.min(discountAmount, grandTotal);
    const netTotal = Number((grandTotal - finalDiscount).toFixed(2));
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            items,
            subtotal,
            cgst: gst.cgst,
            sgst: gst.sgst,
            igst: gst.igst,
            tax: gst.totalTax,
            grandTotal,
            discountAmount: finalDiscount,
            discountPercent,
            netTotal,
            totalAmountWords: numberToWords(netTotal),
          }
        : prev
    );
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;
    const items = formData.items;
    const subtotal = Number(
      items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
    );
    const gst = calculateGSTComponents(subtotal, customer.state);
    const grandTotal = Number((subtotal + gst.totalTax).toFixed(2));
    const discountAmount = Math.min(formData.discountAmount || 0, grandTotal);
    const netTotal = Number((grandTotal - discountAmount).toFixed(2));
    setFormData({
      ...formData,
      customerId: customer.id,
      customer,
      customerName: customer.name,
      customerAddress: customer.address,
      customerPhone: customer.phone,
      customerGSTIN: customer.gstin || "",
      customerPAN: customer.pan || "",
      customerState: customer.state,
      placeOfSupply: customer.state,
      items,
      subtotal,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      tax: gst.totalTax,
      grandTotal,
      discountAmount,
      netTotal,
      totalAmountWords: numberToWords(netTotal),
    });
  };

  const addItem = (inventoryItem: InventoryItem) => {
    const itemGoldRate =
      getGoldRateFromTable(settings, inventoryItem.purity) || formData.goldRate;
    const goldAmount = calculateGoldAmount(
      inventoryItem.goldWeightGram,
      itemGoldRate
    );
    const diamondAmount = inventoryItem.diamondSets.reduce(
      (sum, ds) => sum + ds.value,
      0
    );
    const wastage = inventoryItem.wastage;
    const subtotal = Number(
      (goldAmount + diamondAmount + wastage).toFixed(2)
    );
    const newItem: InvoiceItem = {
      id: uid(),
      linkedInventoryItem: inventoryItem,
      quantity: 1,
      goldWeightGram: inventoryItem.goldWeightGram,
      goldAmount,
      diamondAmount,
      wastage,
      subtotal,
      tax: 0,
      total: subtotal,
    };
    updateTotals([...formData.items, newItem]);
    setItemSearch("");
    setShowSearch(false);
  };

  const removeItem = (id: string) => {
    updateTotals(formData.items.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    const items = formData.items.map((item) => {
      if (item.id !== id) return item;
      const max = item.linkedInventoryItem.stockQuantity;
      const quantity = Math.max(1, Math.min(qty, max));
      const inv = item.linkedInventoryItem;
      const rate =
        getGoldRateFromTable(settings, inv.purity) || formData.goldRate;
      const goldAmount = Number(
        (calculateGoldAmount(inv.goldWeightGram, rate) * quantity).toFixed(2)
      );
      const diamondAmount = Number(
        (inv.diamondSets.reduce((s, d) => s + d.value, 0) * quantity).toFixed(2)
      );
      const wastage = Number((inv.wastage * quantity).toFixed(2));
      const subtotal = Number(
        (goldAmount + diamondAmount + wastage).toFixed(2)
      );
      return {
        ...item,
        quantity,
        goldWeightGram: inv.goldWeightGram * quantity,
        goldAmount,
        diamondAmount,
        wastage,
        subtotal,
        total: subtotal,
      };
    });
    updateTotals(items);
  };

  const handleDiscountAmount = (value: string) => {
    setDiscountAmountInput(value);
    if (value === "" || value === ".") {
      setDiscountPercentInput("");
      updateTotals(formData.items, formData.customerState, 0, 0);
      return;
    }
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    const discountAmount = Math.min(amount, formData.grandTotal);
    const discountPercent =
      formData.grandTotal > 0
        ? Number(((discountAmount / formData.grandTotal) * 100).toFixed(2))
        : 0;
    setDiscountPercentInput(discountPercent ? String(discountPercent) : "");
    updateTotals(
      formData.items,
      formData.customerState,
      discountAmount,
      discountPercent
    );
  };

  const handleDiscountPercent = (value: string) => {
    setDiscountPercentInput(value);
    if (value === "" || value === ".") {
      setDiscountAmountInput("");
      updateTotals(formData.items, formData.customerState, 0, 0);
      return;
    }
    const percent = Math.min(parseFloat(value) || 0, 100);
    const discountAmount = Number(
      ((formData.grandTotal * percent) / 100).toFixed(2)
    );
    setDiscountAmountInput(discountAmount ? String(discountAmount) : "");
    updateTotals(
      formData.items,
      formData.customerState,
      discountAmount,
      percent
    );
  };

  const handleSubmit = (status: "Draft" | "Issued") => {
    if (!formData.customerName.trim()) {
      toast.error("Select a customer");
      return;
    }
    if (formData.items.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (status === "Issued") {
      const missing = formData.items.some(
        (i) => !i.linkedInventoryItem.huid?.trim()
      );
      if (missing) {
        toast.error("All items need HUID before issuing");
        return;
      }
    }
    onSave({ ...formData, status }, isNew);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-teal">
            {invoice ? `Edit ${invoice.invoiceNumber}` : "Create Invoice"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Customer *</Label>
            <Select
              value={formData.customerId || ""}
              onValueChange={selectCustomer}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} · {c.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Invoice #</Label>
            <Input value={formData.invoiceNumber} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>Payment mode</Label>
            <Select
              value={formData.modeOfPayment || "Cash"}
              onValueChange={(v) =>
                setFormData({ ...formData, modeOfPayment: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Place of supply</Label>
            <Input value={formData.placeOfSupply || formData.customerState} readOnly className="bg-muted" />
          </div>
        </div>

        <div className="relative space-y-2">
          <Label>Add inventory item</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search SKU / name / HUID..."
              value={itemSearch}
              onChange={(e) => {
                setItemSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          {showSearch && (
            <div className="absolute z-20 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg">
              {filteredItems.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No available items
                </p>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-teal-light"
                    onClick={() => addItem(item)}
                  >
                    <span>
                      <span className="font-mono text-xs">{item.sku}</span>{" "}
                      {item.itemName}
                    </span>
                    <span className="text-teal">
                      {formatCurrency(item.totalValue)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-2">Item</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Gold</th>
                <th className="p-2">Diamond</th>
                <th className="p-2">Making</th>
                <th className="p-2">Total</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">
                    <p className="font-medium">
                      {item.linkedInventoryItem.itemName}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.linkedInventoryItem.sku}
                    </p>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      className="w-16"
                      min={1}
                      max={item.linkedInventoryItem.stockQuantity}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQty(item.id, parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </td>
                  <td className="p-2">{formatCurrency(item.goldAmount)}</td>
                  <td className="p-2">{formatCurrency(item.diamondAmount)}</td>
                  <td className="p-2">{formatCurrency(item.wastage)}</td>
                  <td className="p-2 font-medium">
                    {formatCurrency(item.subtotal)}
                  </td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {formData.items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No line items yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Discount ₹</Label>
              <Input
                value={discountAmountInput}
                onChange={(e) => handleDiscountAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input
                value={discountPercentInput}
                onChange={(e) => handleDiscountPercent(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-lg bg-teal/5 p-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(formData.subtotal)}</span>
            </div>
            {formData.cgst > 0 && (
              <div className="flex justify-between">
                <span>CGST 1.5%</span>
                <span>{formatCurrency(formData.cgst)}</span>
              </div>
            )}
            {formData.sgst > 0 && (
              <div className="flex justify-between">
                <span>SGST 1.5%</span>
                <span>{formatCurrency(formData.sgst)}</span>
              </div>
            )}
            {formData.igst > 0 && (
              <div className="flex justify-between">
                <span>IGST 3%</span>
                <span>{formatCurrency(formData.igst)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Grand total</span>
              <span>{formatCurrency(formData.grandTotal)}</span>
            </div>
            {(formData.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Discount</span>
                <span>-{formatCurrency(formData.discountAmount || 0)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold text-teal">
              <span>Net total</span>
              <span>{formatCurrency(formData.netTotal)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={() => handleSubmit("Draft")}>
            Save Draft
          </Button>
          <Button onClick={() => handleSubmit("Issued")}>Issue Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
