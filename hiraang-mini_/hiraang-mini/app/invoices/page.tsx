"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import InvoiceBuilder from "@/components/InvoiceBuilder";
import PaymentDialog from "@/components/PaymentDialog";
import PrintInvoice from "@/components/PrintInvoice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Invoice,
  InventoryItem,
  Settings,
} from "@/types/inventory";
import {
  cancelInvoice,
  deleteInvoice,
  getInventory,
  getInvoices,
  getSettings,
  saveInvoice,
} from "@/lib/store";
import { formatCurrency } from "@/lib/calculations";
import { downloadInvoicePDF } from "@/lib/pdf-generator";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Printer,
  Download,
  IndianRupee,
  Ban,
} from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [cancelling, setCancelling] = useState<Invoice | null>(null);

  const refresh = () => {
    setInvoices(getInvoices());
    setInventory(getInventory());
    setSettings(getSettings());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (statusFilter === "draft" && inv.status !== "Draft") return false;
      if (statusFilter === "issued" && inv.status !== "Issued") return false;
      if (statusFilter === "cancelled" && !inv.isCancelled) return false;
      if (statusFilter !== "cancelled" && inv.isCancelled) return false;
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter]);

  const handleSave = (invoice: Invoice, isNew: boolean) => {
    const saved = saveInvoice(invoice, isNew);
    toast.success(
      saved.status === "Issued"
        ? `Issued ${saved.invoiceNumber}`
        : `Saved draft ${saved.invoiceNumber}`
    );
    setEditing(null);
    refresh();
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteInvoice(deleting.id);
    toast.success("Invoice deleted");
    setDeleting(null);
    refresh();
  };

  const handleCancel = () => {
    if (!cancelling) return;
    cancelInvoice(cancelling.id, "Cancelled from demo UI");
    toast.success("Invoice cancelled — stock restored if applicable");
    setCancelling(null);
    refresh();
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-teal-light to-background px-3 pb-10 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal">Invoices</h1>
              <p className="text-muted-foreground">
                Create, issue, collect payments, print / PDF
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setBuilderOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search invoice # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Active invoices</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filtered.map((inv) => (
              <Card
                key={inv.id}
                className="border-teal/20 p-4 shadow-elegant md:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-teal">
                        {inv.invoiceNumber}
                      </h3>
                      <Badge
                        variant={
                          inv.status === "Issued" ? "default" : "secondary"
                        }
                      >
                        {inv.status}
                      </Badge>
                      <Badge variant="outline">{inv.paymentStatus}</Badge>
                      {inv.isCancelled && (
                        <Badge variant="destructive">Cancelled</Badge>
                      )}
                    </div>
                    <p className="text-sm">
                      {inv.customerName} · {inv.customerState}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.date).toLocaleDateString("en-IN")} ·{" "}
                      {inv.items.length} item(s) · Net{" "}
                      <span className="font-semibold text-teal">
                        {formatCurrency(inv.netTotal)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!inv.isCancelled && inv.status === "Draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(inv);
                          setBuilderOpen(true);
                        }}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {!inv.isCancelled && inv.status === "Issued" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPaymentInvoice(inv)}
                      >
                        <IndianRupee className="mr-1 h-4 w-4" />
                        Pay
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPrintInvoice(inv)}
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        downloadInvoicePDF(inv);
                        toast.success("PDF downloaded");
                      }}
                    >
                      <Download className="mr-1 h-4 w-4" />
                      PDF
                    </Button>
                    {!inv.isCancelled && inv.status === "Issued" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelling(inv)}
                      >
                        <Ban className="mr-1 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                    {(inv.status === "Draft" || inv.isCancelled) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => setDeleting(inv)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="border-dashed p-12 text-center">
                <p className="mb-4 text-muted-foreground">No invoices found</p>
                <Button
                  onClick={() => {
                    setEditing(null);
                    setBuilderOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </Card>
            )}
          </div>
        </div>

        {settings && (
          <InvoiceBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            onSave={handleSave}
            invoice={editing}
            inventory={inventory}
            settings={settings}
          />
        )}

        <PaymentDialog
          open={!!paymentInvoice}
          onOpenChange={(open) => !open && setPaymentInvoice(null)}
          invoice={paymentInvoice}
          onSaved={refresh}
        />

        {printInvoice && (
          <PrintInvoice
            invoice={printInvoice}
            onClose={() => setPrintInvoice(null)}
          />
        )}

        <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Delete {deleting?.invoiceNumber}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!cancelling}
          onOpenChange={() => setCancelling(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Cancel {cancelling?.invoiceNumber}? Stock will be restored if
                reduce-on-issue is enabled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel}>
                Confirm Cancel
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
