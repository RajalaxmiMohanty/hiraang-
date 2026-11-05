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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InventoryItem,
  Settings,
  DiamondSet,
  CATEGORIES,
  PURITIES,
  GOLD_COLOURS,
  STOCK_STATUSES,
  ITEM_TYPES,
  DIAMOND_SHAPES,
  Category,
  Purity,
  GoldColour,
  StockStatus,
  ItemType,
  DiamondShape,
} from "@/types/inventory";
import {
  calculateItemTotal,
  formatCurrency,
  recomputeDiamondSet,
} from "@/lib/calculations";
import { generateSKU } from "@/lib/store";
import { uid } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: InventoryItem) => void;
  item: InventoryItem | null;
  settings: Settings;
}

export default function InventoryDialog({
  open,
  onOpenChange,
  onSave,
  item,
  settings,
}: InventoryDialogProps) {
  const [formData, setFormData] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (!open) return;
    if (item) {
      setFormData({ ...item, diamondSets: [...item.diamondSets] });
    } else {
      const category: Category = "Rings (Women)";
      setFormData({
        id: uid(),
        sku: generateSKU(category),
        huid: "",
        hsnCode: "711319",
        itemName: "",
        category,
        purity: "18KT",
        goldColour: "Yellow",
        goldWeightGram: 0,
        makingFormula: settings.makingFormula,
        diamondSets: [],
        remarks: "",
        totalValue: 0,
        goldAmount: 0,
        diamondValue: 0,
        wastage: 0,
        stockQuantity: 1,
        stockStatus: "Available",
        itemType: "Gold Jewellery",
      });
    }
  }, [open, item, settings.makingFormula]);

  const liveTotals = useMemo(() => {
    if (!formData) {
      return { goldAmount: 0, diamondValue: 0, wastage: 0, totalValue: 0 };
    }
    return calculateItemTotal(formData, settings);
  }, [formData, settings]);

  if (!formData) return null;

  const updateField = <K extends keyof InventoryItem>(
    key: K,
    value: InventoryItem[K]
  ) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleCategoryChange = (category: Category) => {
    if (!item) {
      setFormData((prev) =>
        prev ? { ...prev, category, sku: generateSKU(category) } : prev
      );
    } else {
      updateField("category", category);
    }
  };

  const addDiamondSet = () => {
    const ds: DiamondSet = {
      id: uid(),
      parentItemId: formData.id,
      shape: "ROUND",
      sizePerPieceCt: 0.1,
      pieces: 1,
      totalCarat: 0,
      ratePerCt: 0,
      value: 0,
    };
    updateField("diamondSets", [
      ...formData.diamondSets,
      recomputeDiamondSet(ds, settings, settings.policy),
    ]);
  };

  const updateDiamondSet = (id: string, patch: Partial<DiamondSet>) => {
    updateField(
      "diamondSets",
      formData.diamondSets.map((ds) =>
        ds.id === id
          ? recomputeDiamondSet(
              { ...ds, ...patch },
              settings,
              settings.policy
            )
          : ds
      )
    );
  };

  const removeDiamondSet = (id: string) => {
    updateField(
      "diamondSets",
      formData.diamondSets.filter((ds) => ds.id !== id)
    );
  };

  const handleSave = () => {
    if (!formData.itemName.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (formData.goldWeightGram <= 0) {
      toast.error("Gold weight must be greater than 0");
      return;
    }
    onSave({ ...formData, ...liveTotals });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-teal">
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Item Name *</Label>
            <Input
              value={formData.itemName}
              onChange={(e) => updateField("itemName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>SKU</Label>
            <Input value={formData.sku} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>HUID</Label>
            <Input
              value={formData.huid}
              onChange={(e) => updateField("huid", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>HSN</Label>
            <Input
              value={formData.hsnCode}
              onChange={(e) => updateField("hsnCode", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => handleCategoryChange(v as Category)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Item Type</Label>
            <Select
              value={formData.itemType || "Gold Jewellery"}
              onValueChange={(v) => updateField("itemType", v as ItemType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEM_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Purity</Label>
            <Select
              value={formData.purity}
              onValueChange={(v) => updateField("purity", v as Purity)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PURITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gold Colour</Label>
            <Select
              value={formData.goldColour}
              onValueChange={(v) => updateField("goldColour", v as GoldColour)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOLD_COLOURS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gold Weight (g)</Label>
            <Input
              type="number"
              step="0.001"
              value={formData.goldWeightGram || ""}
              onChange={(e) =>
                updateField("goldWeightGram", parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Size</Label>
            <Input
              value={formData.size || ""}
              onChange={(e) => updateField("size", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Stock Qty</Label>
            <Input
              type="number"
              min={0}
              value={formData.stockQuantity}
              onChange={(e) =>
                updateField("stockQuantity", parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={formData.stockStatus}
              onValueChange={(v) =>
                updateField("stockStatus", v as StockStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Making Formula</Label>
            <Input
              value={formData.makingFormula}
              onChange={(e) => updateField("makingFormula", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Supports IF(...), PERCENTAGE:n, FIXED:n, GoldWeight, GoldRate,
              PurityFactor
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-2 space-y-3 rounded-lg border border-teal/20 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-teal">Diamond Sets</h3>
            <Button type="button" size="sm" variant="outline" onClick={addDiamondSet}>
              <Plus className="mr-1 h-4 w-4" />
              Add set
            </Button>
          </div>
          {formData.diamondSets.length === 0 && (
            <p className="text-sm text-muted-foreground">No diamond sets</p>
          )}
          {formData.diamondSets.map((ds) => (
            <div
              key={ds.id}
              className="grid gap-2 rounded-md bg-muted/40 p-3 md:grid-cols-6"
            >
              <div className="space-y-1">
                <Label className="text-xs">Shape</Label>
                <Select
                  value={ds.shape}
                  onValueChange={(v) =>
                    updateDiamondSet(ds.id, { shape: v as DiamondShape })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAMOND_SHAPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Size/pc (ct)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={ds.sizePerPieceCt}
                  onChange={(e) =>
                    updateDiamondSet(ds.id, {
                      sizePerPieceCt: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pieces</Label>
                <Input
                  type="number"
                  value={ds.pieces}
                  onChange={(e) =>
                    updateDiamondSet(ds.id, {
                      pieces: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total ct</Label>
                <Input value={ds.totalCarat.toFixed(5)} readOnly className="bg-muted" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Rate/ct</Label>
                <Input value={ds.ratePerCt} readOnly className="bg-muted" />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={formatCurrency(ds.value)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => removeDiamondSet(ds.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-teal/5 p-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Gold</p>
            <p className="font-semibold text-teal">
              {formatCurrency(liveTotals.goldAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Diamond</p>
            <p className="font-semibold text-teal">
              {formatCurrency(liveTotals.diamondValue)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Making</p>
            <p className="font-semibold text-teal">
              {formatCurrency(liveTotals.wastage)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-teal">
              {formatCurrency(liveTotals.totalValue)}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{item ? "Update" : "Add Item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
