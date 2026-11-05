"use client";

import { useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import InventoryDialog from "@/components/InventoryDialog";
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
  InventoryItem,
  Settings,
  CATEGORIES,
  PURITIES,
  STOCK_STATUSES,
} from "@/types/inventory";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  getSettings,
  updateInventoryItem,
} from "@/lib/store";
import { formatCurrency } from "@/lib/calculations";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [purity, setPurity] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);

  const refresh = () => {
    setItems(getInventory());
    setSettings(getSettings());
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (purity !== "all" && item.purity !== purity) return false;
      if (status !== "all" && item.stockStatus !== status) return false;
      if (!q) return true;
      return (
        item.itemName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.huid.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [items, search, category, purity, status]);

  const handleSave = (item: InventoryItem) => {
    if (editing) {
      updateInventoryItem(item);
      toast.success("Item updated");
    } else {
      createInventoryItem(item);
      toast.success("Item added");
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteInventoryItem(deleting.id);
    toast.success("Item deleted");
    setDeleting(null);
    refresh();
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-teal-light to-background px-3 pb-10 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal">Inventory</h1>
              <p className="text-muted-foreground">
                Jewelry stock with live gold / diamond / making totals
              </p>
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search SKU, name, HUID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={purity} onValueChange={setPurity}>
              <SelectTrigger>
                <SelectValue placeholder="Purity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All purities</SelectItem>
                {PURITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STOCK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Card
                key={item.id}
                className="group border-teal/20 p-5 shadow-elegant hover-lift"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10">
                      <Package className="h-5 w-5 text-teal" />
                    </div>
                    <div>
                      <h3 className="font-bold text-teal">{item.itemName}</h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(item);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">{item.purity}</Badge>
                  <Badge>
                    {item.stockStatus} · Qty {item.stockQuantity}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Gold wt</p>
                    <p>{item.goldWeightGram.toFixed(3)} g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Colour</p>
                    <p>{item.goldColour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">HUID</p>
                    <p className="font-mono text-xs">{item.huid || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total value</p>
                    <p className="font-semibold text-teal">
                      {formatCurrency(item.totalValue)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="col-span-full border-dashed p-12 text-center">
                <p className="text-muted-foreground">No inventory items found</p>
              </Card>
            )}
          </div>
        </div>

        {settings && (
          <InventoryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSave={handleSave}
            item={editing}
            settings={settings}
          />
        )}

        <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Delete {deleting?.itemName}? This cannot be undone.
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
      </div>
    </>
  );
}
