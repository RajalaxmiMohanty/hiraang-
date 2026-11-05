"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoldRateRow, POLICIES, Policy, Settings } from "@/types/inventory";
import { getSettings, saveSettings } from "@/lib/store";
import { formatCurrency } from "@/lib/calculations";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-screen items-center justify-center pt-16 text-teal">
          Loading settings...
        </div>
      </>
    );
  }

  const updateGoldRow = (
    id: string,
    field: keyof GoldRateRow,
    value: string
  ) => {
    setSettings({
      ...settings,
      goldRateTable: settings.goldRateTable.map((row) => {
        if (row.id !== id) return row;
        if (field === "purityKt") return { ...row, purityKt: value };
        if (field === "percentage")
          return { ...row, percentage: parseFloat(value) || 0 };
        return { ...row, rateInInr: parseFloat(value) || 0 };
      }),
    });
  };

  const handleSave = () => {
    const baseline =
      settings.goldRateTable.find((r) => r.id === settings.goldBaselineRowId) ||
      settings.goldRateTable[0];
    const next: Settings = {
      ...settings,
      goldRate: baseline?.rateInInr || settings.goldRate,
      taxPercent: Number(settings.taxPercent) || 0,
      purityFactor: Number(settings.purityFactor) || 0.585,
      makingFormula: settings.makingFormula.trim() || settings.makingFormula,
    };
    saveSettings(next);
    setSettings(next);
    toast.success("Settings saved — new inventory/invoices will use these rates");
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-teal-light to-background px-3 pb-10 pt-16 md:px-6 md:pt-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal">Settings</h1>
              <p className="text-muted-foreground">
                Gold rates, tax, and making formula used for calculations
              </p>
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </Button>
          </div>

          <div className="space-y-4">
            <Card className="border-teal/20 p-5 shadow-elegant">
              <h2 className="mb-4 text-lg font-semibold text-teal">
                Billing defaults
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tax percent (reference)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.taxPercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        taxPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Invoices use 3% GST split (CGST+SGST in Odisha, else IGST).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Diamond policy</Label>
                  <Select
                    value={settings.policy}
                    onValueChange={(v) =>
                      setSettings({ ...settings, policy: v as Policy })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POLICIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          Policy {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Purity factor</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={settings.purityFactor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        purityFactor: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reduce stock on issue</Label>
                  <Select
                    value={settings.reduceStockOnIssue ? "yes" : "no"}
                    onValueChange={(v) =>
                      setSettings({
                        ...settings,
                        reduceStockOnIssue: v === "yes",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Default making formula</Label>
                  <Input
                    value={settings.makingFormula}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        makingFormula: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: GoldWeight, GoldRate (24KT), PurityFactor.
                    Also supports IF(...), PERCENTAGE:n, FIXED:n.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-teal/20 p-5 shadow-elegant">
              <h2 className="mb-1 text-lg font-semibold text-teal">
                Gold rate table
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Baseline (24KT) is also used inside making formulas. Current
                baseline:{" "}
                {formatCurrency(
                  settings.goldRateTable.find(
                    (r) => r.id === settings.goldBaselineRowId
                  )?.rateInInr || settings.goldRate
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Purity</th>
                      <th className="p-2">%</th>
                      <th className="p-2">Rate (₹/g)</th>
                      <th className="p-2">Baseline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.goldRateTable.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="p-2">
                          <Input
                            value={row.purityKt}
                            onChange={(e) =>
                              updateGoldRow(row.id, "purityKt", e.target.value)
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={row.percentage}
                            onChange={(e) =>
                              updateGoldRow(
                                row.id,
                                "percentage",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={row.rateInInr}
                            onChange={(e) =>
                              updateGoldRow(
                                row.id,
                                "rateInInr",
                                e.target.value
                              )
                            }
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              settings.goldBaselineRowId === row.id
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              setSettings({
                                ...settings,
                                goldBaselineRowId: row.id,
                              })
                            }
                          >
                            {settings.goldBaselineRowId === row.id
                              ? "Baseline"
                              : "Set"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="border-teal/20 p-5 shadow-elegant">
              <h2 className="mb-2 text-lg font-semibold text-teal">
                Diamond rate brackets
              </h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Read-only overview for the viva — rates by carat size and
                policy (A–D). Policy above picks which column inventory uses.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2">Size (ct)</th>
                      <th className="p-2">Round A</th>
                      <th className="p-2">Round B</th>
                      <th className="p-2">Fancy A</th>
                      <th className="p-2">Heart A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.rateBrackets.map((b) => (
                      <tr key={b.id} className="border-b">
                        <td className="p-2">
                          {b.lowerCt.toFixed(3)} – {b.upperCt.toFixed(3)}
                        </td>
                        <td className="p-2">{b.roundA}</td>
                        <td className="p-2">{b.roundB}</td>
                        <td className="p-2">{b.fancyA}</td>
                        <td className="p-2">{b.heartA}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
