import jsPDF from "jspdf";
import { Invoice } from "@/types/inventory";
import {
  formatCurrency,
  numberToWords,
  getInvoicePayableTotals,
} from "@/lib/calculations";
import { DEMO_COMPANY } from "@/lib/seed";

export function generateInvoicePDF(invoice: Invoice) {
  const company = DEMO_COMPANY;
  const { grandTotal, netTotal } = getInvoicePayableTotals(invoice);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  let y = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 15;
  const right = pageWidth - 15;
  const width = right - left;

  const center = (text: string, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const tw = doc.getTextWidth(text);
    doc.text(text, (pageWidth - tw) / 2, y);
  };

  const money = (v: number) =>
    v.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  center(company.name, 14, true);
  y += 6;
  center(company.address, 9);
  y += 5;
  center(`CIN: ${company.cin} | GSTIN: ${company.gstin}`, 8);
  y += 4;
  center(`Phone: ${company.phone} | Email: ${company.email}`, 8);
  y += 7;
  center("TAX INVOICE", 12, true);
  y += 8;
  doc.setLineWidth(0.5);
  doc.line(left, y, right, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Party / Customer Details", left, y);
  doc.text("Invoice Details", left + width / 2 + 5, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.rect(left, y - 3, width / 2 - 2, 25);
  doc.text(`Name: ${invoice.customerName}`, left + 2, y);
  doc.text(`Address: ${invoice.customerAddress || "—"}`, left + 2, y + 5);
  doc.text(`GST No: ${invoice.customerGSTIN || "N/A"}`, left + 2, y + 10);
  doc.text(`Phone: ${invoice.customerPhone || "—"}`, left + 2, y + 15);

  const ix = left + width / 2 + 5;
  doc.rect(ix, y - 3, width / 2 - 5, 25);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, ix + 2, y);
  doc.text(
    `Date: ${new Date(invoice.date).toLocaleDateString("en-IN")}`,
    ix + 2,
    y + 5
  );
  doc.text(
    `Mode of Payment: ${invoice.modeOfPayment || "—"}`,
    ix + 2,
    y + 10
  );
  doc.text(`State: ${invoice.customerState}`, ix + 2, y + 15);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setFillColor(220, 220, 220);
  doc.rect(left, y - 3, width, 6, "F");
  doc.text("SN", left + 1, y);
  doc.text("SKU", left + 10, y);
  doc.text("Item", left + 35, y);
  doc.text("Qty", left + 95, y);
  doc.text("Gold Amt", left + 108, y);
  doc.text("Dia Amt", left + 132, y);
  doc.text("Total", left + 155, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  invoice.items.forEach((item, idx) => {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(idx + 1), left + 1, y);
    doc.text(item.linkedInventoryItem.sku.slice(0, 12), left + 10, y);
    doc.text(item.linkedInventoryItem.itemName.slice(0, 28), left + 35, y);
    doc.text(String(item.quantity), left + 95, y);
    doc.text(money(item.goldAmount), left + 108, y);
    doc.text(money(item.diamondAmount), left + 132, y);
    doc.text(money(item.subtotal), left + 155, y);
    y += 5;
  });

  y += 4;
  doc.line(left, y, right, y);
  y += 8;

  const summaryX = left + width / 2 + 10;
  doc.setFontSize(8);
  doc.text("Taxable Amount:", summaryX, y);
  doc.text(formatCurrency(invoice.subtotal), right, y, { align: "right" });
  y += 5;
  if (invoice.cgst > 0) {
    doc.text("CGST (1.5%):", summaryX, y);
    doc.text(formatCurrency(invoice.cgst), right, y, { align: "right" });
    y += 5;
  }
  if (invoice.sgst > 0) {
    doc.text("SGST (1.5%):", summaryX, y);
    doc.text(formatCurrency(invoice.sgst), right, y, { align: "right" });
    y += 5;
  }
  if (invoice.igst > 0) {
    doc.text("IGST (3%):", summaryX, y);
    doc.text(formatCurrency(invoice.igst), right, y, { align: "right" });
    y += 5;
  }
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", summaryX, y);
  doc.text(formatCurrency(grandTotal), right, y, { align: "right" });
  y += 5;
  if ((invoice.discountAmount || 0) > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Discount:", summaryX, y);
    doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, right, y, {
      align: "right",
    });
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Net Total:", summaryX, y);
    doc.text(formatCurrency(netTotal), right, y, { align: "right" });
    y += 6;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Amount in Words:", left, y);
  doc.setFont("helvetica", "normal");
  const words = doc.splitTextToSize(numberToWords(netTotal), width - 40);
  doc.text(words, left + 40, y);
  y += words.length * 5 + 8;

  doc.setFontSize(8);
  doc.text(
    `Bank: ${company.bankDetails.bankName} · A/C ${company.bankDetails.accountNumber} · IFSC ${company.bankDetails.ifscCode}`,
    left,
    y
  );
  y += 10;
  doc.text(
    "This is a computer-generated invoice for demo purposes.",
    left,
    y
  );

  return doc;
}

export function downloadInvoicePDF(invoice: Invoice) {
  const doc = generateInvoicePDF(invoice);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
