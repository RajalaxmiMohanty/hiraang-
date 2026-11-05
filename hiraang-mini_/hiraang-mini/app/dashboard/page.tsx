"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats, resetToSeed } from "@/lib/store";
import { formatCurrency, formatWeight } from "@/lib/calculations";
import {
  Users,
  Package,
  FileText,
  AlertCircle,
  RotateCcw,
  Gem,
  Weight,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

type Stats = ReturnType<typeof getDashboardStats>;

const emptyStats: Stats = {
  customerCount: 0,
  inventoryCount: 0,
  availableCount: 0,
  availableQty: 0,
  totalItems: 0,
  totalAvailable: 0,
  totalGoldWeight: 0,
  totalDiamondWeight: 0,
  totalValuation: 0,
  totalSold: 0,
  totalSalesValue: 0,
  todaySales: 0,
  todayInvoiceCount: 0,
  weeklySales: 0,
  weekInvoiceCount: 0,
  monthlySales: 0,
  monthInvoiceCount: 0,
  outstanding: 0,
  invoiceCount: 0,
  draftCount: 0,
  issuedCount: 0,
  pendingPaymentCount: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(emptyStats);

  const refresh = () => setStats(getDashboardStats());

  useEffect(() => {
    refresh();
  }, []);

  const handleReset = () => {
    if (
      !confirm(
        "Reset all local data to the demo seed? This cannot be undone."
      )
    ) {
      return;
    }
    resetToSeed();
    refresh();
    toast.success("Demo data restored");
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-teal-light to-background px-3 pb-10 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal md:text-4xl">
                Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">
                Inventory size, valuation, and sales snapshot
              </p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset demo data
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/inventory">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-teal">{stats.totalItems}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.totalAvailable} available · {stats.inventoryCount} SKUs
                </p>
              </Card>
            </Link>

            <Link href="/inventory">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Valuation</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {formatCurrency(stats.totalValuation)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Inventory value
                </p>
              </Card>
            </Link>

            <Link href="/inventory">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Gold Weight</p>
                  <Weight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {formatWeight(stats.totalGoldWeight, 3)}g
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Total gold</p>
              </Card>
            </Link>

            <Link href="/inventory">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Diamond Weight</p>
                  <Gem className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {formatWeight(stats.totalDiamondWeight)}ct
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total diamonds
                </p>
              </Card>
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-teal/20 p-5 shadow-elegant">
              <p className="text-sm text-muted-foreground">Today&apos;s Sales</p>
              <p className="mt-2 text-2xl font-bold text-teal">
                {formatCurrency(stats.todaySales)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.todayInvoiceCount} issued invoices
              </p>
            </Card>
            <Card className="border-teal/20 p-5 shadow-elegant">
              <p className="text-sm text-muted-foreground">Weekly Sales</p>
              <p className="mt-2 text-2xl font-bold text-teal">
                {formatCurrency(stats.weeklySales)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.weekInvoiceCount} issued invoices
              </p>
            </Card>
            <Card className="border-teal/20 p-5 shadow-elegant">
              <p className="text-sm text-muted-foreground">Monthly Sales</p>
              <p className="mt-2 text-2xl font-bold text-teal">
                {formatCurrency(stats.monthlySales)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.monthInvoiceCount} issued invoices
              </p>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/customers">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <Users className="h-4 w-4 text-teal" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {stats.customerCount}
                </p>
              </Card>
            </Link>
            <Link href="/invoices">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Invoices</p>
                  <FileText className="h-4 w-4 text-teal" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {stats.invoiceCount}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.draftCount} draft · {stats.issuedCount} issued
                </p>
              </Card>
            </Link>
            <Link href="/invoices">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <TrendingUp className="h-4 w-4 text-teal" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {formatCurrency(stats.totalSalesValue)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.totalSold} items sold
                </p>
              </Card>
            </Link>
            <Link href="/invoices">
              <Card className="h-full border-teal/20 p-5 shadow-elegant hover-lift">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <AlertCircle className="h-4 w-4 text-teal" />
                </div>
                <p className="text-2xl font-bold text-teal">
                  {formatCurrency(stats.outstanding)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats.pendingPaymentCount} unpaid / partial
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
