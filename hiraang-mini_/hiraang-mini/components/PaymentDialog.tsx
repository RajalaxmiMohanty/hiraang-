"use client";

import { useState } from "react";
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
import { Invoice, PAYMENT_MODES, PaymentMode } from "@/types/inventory";
import { formatCurrency } from "@/lib/calculations";
import { addPayment } from "@/lib/store";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSaved: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSaved,
}: PaymentDialogProps) {
  const [mode, setMode] = useState<PaymentMode>("Cash");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  if (!invoice) return null;

  const paid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);
  const due = Number((invoice.netTotal - paid).toFixed(2));

  const handleSave = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (value > due + 0.01) {
      toast.error("Amount exceeds balance due");
      return;
    }
    addPayment(invoice.id, {
      mode,
      amount: value,
      paymentDate: date,
    });
    toast.success("Payment recorded");
    setAmount("");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-teal">
            Record Payment — {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            Net total: <strong>{formatCurrency(invoice.netTotal)}</strong>
          </p>
          <p>
            Paid: {formatCurrency(paid)} · Due:{" "}
            <strong>{formatCurrency(due)}</strong>
          </p>
          {(invoice.payments || []).length > 0 && (
            <div className="rounded border p-2">
              <p className="mb-1 font-medium">Previous payments</p>
              {invoice.payments!.map((p) => (
                <p key={p.id} className="text-muted-foreground">
                  {p.paymentDate} · {p.mode} · {formatCurrency(p.amount)}
                </p>
              ))}
            </div>
          )}
          <div className="space-y-2">
            <Label>Mode</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as PaymentMode)}
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
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              placeholder={String(due)}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={due <= 0}>
            Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
