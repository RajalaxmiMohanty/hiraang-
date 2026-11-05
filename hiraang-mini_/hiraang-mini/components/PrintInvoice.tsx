"use client";

import { Invoice } from "@/types/inventory";
import {
  formatCurrency,
  getInvoicePayableTotals,
  numberToWords,
} from "@/lib/calculations";
import { DEMO_COMPANY } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { downloadInvoicePDF } from "@/lib/pdf-generator";
import { Printer, Download, X } from "lucide-react";

interface PrintInvoiceProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function PrintInvoice({ invoice, onClose }: PrintInvoiceProps) {
  const company = DEMO_COMPANY;
  const { grandTotal, netTotal } = getInvoicePayableTotals(invoice);

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black/50 p-4">
      <div className="no-print mx-auto mb-4 flex max-w-4xl justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
        <Button variant="secondary" onClick={() => downloadInvoicePDF(invoice)}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 text-sm shadow-lg print:max-w-none print:shadow-none">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-teal">{company.name}</h1>
          <p className="text-muted-foreground">{company.address}</p>
          <p className="text-xs">
            GSTIN: {company.gstin} · Phone: {company.phone}
          </p>
          <h2 className="mt-4 text-lg font-semibold">TAX INVOICE</h2>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded border p-3">
            <p className="mb-1 font-semibold">Bill To</p>
            <p className="font-medium">{invoice.customerName}</p>
            <p>{invoice.customerAddress}</p>
            <p>Phone: {invoice.customerPhone || "—"}</p>
            <p>GSTIN: {invoice.customerGSTIN || "N/A"}</p>
            <p>State: {invoice.customerState}</p>
          </div>
          <div className="rounded border p-3">
            <p>
              <span className="text-muted-foreground">Invoice No:</span>{" "}
              {invoice.invoiceNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Date:</span>{" "}
              {new Date(invoice.date).toLocaleDateString("en-IN")}
            </p>
            <p>
              <span className="text-muted-foreground">Payment mode:</span>{" "}
              {invoice.modeOfPayment || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {invoice.status} / {invoice.paymentStatus}
            </p>
          </div>
        </div>

        <table className="mb-6 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-2">#</th>
              <th className="p-2">SKU</th>
              <th className="p-2">Item</th>
              <th className="p-2">Qty</th>
              <th className="p-2">Gold</th>
              <th className="p-2">Diamond</th>
              <th className="p-2">Making</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={item.id} className="border-b">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2 font-mono">{item.linkedInventoryItem.sku}</td>
                <td className="p-2">{item.linkedInventoryItem.itemName}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2">{formatCurrency(item.goldAmount)}</td>
                <td className="p-2">{formatCurrency(item.diamondAmount)}</td>
                <td className="p-2">{formatCurrency(item.wastage)}</td>
                <td className="p-2 font-medium">
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.cgst > 0 && (
            <div className="flex justify-between">
              <span>CGST 1.5%</span>
              <span>{formatCurrency(invoice.cgst)}</span>
            </div>
          )}
          {invoice.sgst > 0 && (
            <div className="flex justify-between">
              <span>SGST 1.5%</span>
              <span>{formatCurrency(invoice.sgst)}</span>
            </div>
          )}
          {invoice.igst > 0 && (
            <div className="flex justify-between">
              <span>IGST 3%</span>
              <span>{formatCurrency(invoice.igst)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Grand Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          {(invoice.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Discount</span>
              <span>-{formatCurrency(invoice.discountAmount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-bold text-teal">
            <span>Net Total</span>
            <span>{formatCurrency(netTotal)}</span>
          </div>
        </div>

        <p className="mt-6 text-xs">
          <strong>Amount in words:</strong> {numberToWords(netTotal)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Bank: {company.bankDetails.bankName} · A/C{" "}
          {company.bankDetails.accountNumber} · IFSC{" "}
          {company.bankDetails.ifscCode}
        </p>
      </div>
    </div>
  );
}
