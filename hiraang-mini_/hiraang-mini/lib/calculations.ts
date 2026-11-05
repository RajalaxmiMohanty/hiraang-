import {
  DiamondSet,
  InventoryItem,
  Settings,
  Policy,
  DiamondShape,
  Purity,
} from "@/types/inventory";
import { evaluate } from "mathjs";

export const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatWeight = (value: number, decimals: number = 5): string => {
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(value * multiplier) / multiplier;
  return rounded.toFixed(decimals);
};

export const calculateTotalCarat = (
  sizePerPieceCt: number,
  pieces: number
): number => {
  const result = sizePerPieceCt * pieces;
  return Number((Math.round(result * 100000) / 100000).toFixed(5));
};

export const getDiamondRate = (
  settings: Settings,
  sizePerPieceCt: number,
  shape: DiamondShape,
  policy: Policy
): number => {
  const normalizedSize = Number(
    (Math.round(sizePerPieceCt * 100000) / 100000).toFixed(5)
  );
  const bracket = settings.rateBrackets.find(
    (b) => normalizedSize >= b.lowerCt && normalizedSize <= b.upperCt
  );
  if (!bracket) return 0;
  const rateKey = `${shape.toLowerCase()}${policy}` as keyof typeof bracket;
  return (bracket[rateKey] as number) || 0;
};

export const getGoldRateFromTable = (
  settings: Settings,
  purity: Purity | string
): number => {
  const purityStr = purity.toString().trim().toUpperCase();
  const row = settings.goldRateTable.find(
    (r) => r.purityKt.trim().toUpperCase() === purityStr
  );
  return row?.rateInInr || 0;
};

export const get24KGoldRate = (settings: Settings): number => {
  const from24 = getGoldRateFromTable(settings, "24KT");
  if (from24 > 0) return from24;
  const baseline = settings.goldRateTable?.find(
    (r) => r.id === settings.goldBaselineRowId
  );
  if (baseline?.rateInInr) return Number(baseline.rateInInr);
  const first = settings.goldRateTable?.[0]?.rateInInr;
  if (first) return Number(first);
  return Number(settings.goldRate) || 0;
};

export const calculateDiamondValue = (
  totalCarat: number,
  ratePerCt: number
): number => {
  const result = totalCarat * ratePerCt;
  return Number((Math.round(result * 100) / 100).toFixed(2));
};

export const evaluateMakingFormula = (
  formula: string,
  goldWeight: number,
  goldRate: number,
  purityFactor: number
): number => {
  try {
    if (!formula || formula.trim() === "") return 0;

    let processedFormula = formula.trim();

    if (processedFormula.match(/^PERCENTAGE:\d+(\.\d+)?$/i)) {
      const percentage = parseFloat(processedFormula.split(":")[1]);
      const result = (percentage / 100) * goldWeight * goldRate;
      return Number((Math.round(result * 100) / 100).toFixed(2));
    }

    if (processedFormula.match(/^FIXED:\d+(\.\d+)?$/i)) {
      const fixedAmount = parseFloat(processedFormula.split(":")[1]);
      return Number((Math.round(fixedAmount * 100) / 100).toFixed(2));
    }

    const scope = {
      GoldWeight: goldWeight,
      GoldRate: goldRate,
      PurityFactor: purityFactor,
    };

    processedFormula = processedFormula.replace(
      /(\d+(?:\.\d+)?)%(\*|\()/g,
      "($1/100)$2"
    );
    processedFormula = processedFormula.replace(
      /(\d+(?:\.\d+)?)%/g,
      "($1/100)"
    );

    let ifMatch;
    while ((ifMatch = processedFormula.match(/IF\s*\(/)) !== null) {
      const startPos = ifMatch.index!;
      let depth = 0;
      const pos = startPos + ifMatch[0].length;
      let conditionEnd = -1;
      let trueValueEnd = -1;
      let falseValueEnd = -1;

      for (let i = pos; i < processedFormula.length; i++) {
        const char = processedFormula[i];
        if (char === "(") depth++;
        else if (char === ")") {
          if (depth === 0) {
            falseValueEnd = i;
            break;
          }
          depth--;
        } else if (char === "," && depth === 0) {
          if (conditionEnd === -1) conditionEnd = i;
          else if (trueValueEnd === -1) trueValueEnd = i;
        }
      }

      if (conditionEnd === -1 || trueValueEnd === -1 || falseValueEnd === -1) {
        break;
      }

      const condition = processedFormula.substring(pos, conditionEnd).trim();
      const trueValue = processedFormula
        .substring(conditionEnd + 1, trueValueEnd)
        .trim();
      const falseValue = processedFormula
        .substring(trueValueEnd + 1, falseValueEnd)
        .trim();
      const replacement = `(${condition}) ? (${trueValue}) : (${falseValue})`;
      processedFormula =
        processedFormula.substring(0, startPos) +
        replacement +
        processedFormula.substring(falseValueEnd + 1);
    }

    const result = evaluate(processedFormula, scope);
    if (typeof result !== "number" || isNaN(result)) return 0;
    return Number((Math.round(result * 100) / 100).toFixed(2));
  } catch {
    return 0;
  }
};

export const calculateGoldAmount = (
  goldWeight: number,
  goldRate: number
): number => {
  const result = goldWeight * goldRate;
  return Number((Math.round(result * 100) / 100).toFixed(2));
};

export const calculateItemTotal = (
  item: InventoryItem,
  settings: Settings
): {
  goldAmount: number;
  diamondValue: number;
  wastage: number;
  totalValue: number;
} => {
  const goldRate =
    getGoldRateFromTable(settings, item.purity) || settings.goldRate;
  const goldAmount = calculateGoldAmount(item.goldWeightGram, goldRate);
  const diamondValue = item.diamondSets.reduce((sum, ds) => sum + ds.value, 0);
  const wastageRate = get24KGoldRate(settings);
  const wastageFormula =
    item.makingFormulaOverride || item.makingFormula || settings.makingFormula;
  const wastage = evaluateMakingFormula(
    wastageFormula,
    item.goldWeightGram,
    wastageRate,
    settings.purityFactor
  );
  const result = goldAmount + diamondValue + wastage;
  const totalValue = Number((Math.round(result * 100) / 100).toFixed(2));
  return { goldAmount, diamondValue, wastage, totalValue };
};

export const calculateItemTotalForPolicy = (
  item: InventoryItem,
  settings: Settings,
  policy: Policy
): {
  goldAmount: number;
  diamondValue: number;
  wastage: number;
  totalValue: number;
} => {
  const goldRate =
    getGoldRateFromTable(settings, item.purity) || settings.goldRate;
  const goldAmount = calculateGoldAmount(item.goldWeightGram, goldRate);
  const diamondValue = item.diamondSets.reduce((sum, ds) => {
    const ratePerCt = getDiamondRate(
      settings,
      ds.sizePerPieceCt,
      ds.shape,
      policy
    );
    return sum + calculateDiamondValue(ds.totalCarat, ratePerCt);
  }, 0);
  const wastageRate = get24KGoldRate(settings);
  const wastageFormula =
    item.makingFormulaOverride || item.makingFormula || settings.makingFormula;
  const wastage = evaluateMakingFormula(
    wastageFormula,
    item.goldWeightGram,
    wastageRate,
    settings.purityFactor
  );
  const result = goldAmount + diamondValue + wastage;
  const totalValue = Number((Math.round(result * 100) / 100).toFixed(2));
  return { goldAmount, diamondValue, wastage, totalValue };
};

const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
];
const teens = [
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

const convertLessThanThousand = (n: number): string => {
  if (n === 0) return "";
  if (n < 10) return ones[n];
  if (n < 20) return teens[n - 10];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const one = n % 10;
    return tens[ten] + (one > 0 ? " " + ones[one] : "");
  }
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return (
    ones[hundred] +
    " Hundred" +
    (rest > 0 ? " " + convertLessThanThousand(rest) : "")
  );
};

export const numberToWords = (amount: number): string => {
  if (amount === 0) return "Zero Rupees Only";
  const [rupees, paise] = amount.toFixed(2).split(".").map(Number);
  let result = "";
  if (rupees === 0) {
    result = "Zero";
  } else {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;
    const parts: string[] = [];
    if (crore > 0) parts.push(convertLessThanThousand(crore) + " Crore");
    if (lakh > 0) parts.push(convertLessThanThousand(lakh) + " Lakh");
    if (thousand > 0) parts.push(convertLessThanThousand(thousand) + " Thousand");
    if (remainder > 0) parts.push(convertLessThanThousand(remainder));
    result = parts.join(" ");
  }
  result += " Rupees";
  if (paise > 0) {
    result += " and " + convertLessThanThousand(paise) + " Paise";
  }
  return result + " Only";
};

export function getInvoiceTaxAmount(invoice: {
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}): number {
  if (invoice.tax != null && invoice.tax > 0) {
    return Number(invoice.tax.toFixed(2));
  }
  return Number(
    ((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)).toFixed(2)
  );
}

export function getInvoicePayableTotals(invoice: {
  subtotal: number;
  tax?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discountAmount?: number;
}): { grandTotal: number; netTotal: number } {
  const taxAmount = getInvoiceTaxAmount(invoice);
  const grandTotal = Number((invoice.subtotal + taxAmount).toFixed(2));
  const discountAmount = invoice.discountAmount || 0;
  const netTotal = Number((grandTotal - discountAmount).toFixed(2));
  return { grandTotal, netTotal };
}

export const calculateGSTComponents = (
  subtotal: number,
  customerState: string
): { cgst: number; sgst: number; igst: number; totalTax: number } => {
  const taxRate = 0.03;
  if (customerState === "Odisha") {
    const cgst = Number((Math.round(subtotal * 0.015 * 100) / 100).toFixed(2));
    const sgst = Number((Math.round(subtotal * 0.015 * 100) / 100).toFixed(2));
    return { cgst, sgst, igst: 0, totalTax: Number((cgst + sgst).toFixed(2)) };
  }
  const igst = Number((Math.round(subtotal * taxRate * 100) / 100).toFixed(2));
  return { cgst: 0, sgst: 0, igst, totalTax: igst };
};

export function recomputeDiamondSet(
  ds: DiamondSet,
  settings: Settings,
  policy: Policy
): DiamondSet {
  const totalCarat = calculateTotalCarat(ds.sizePerPieceCt, ds.pieces);
  const ratePerCt = getDiamondRate(
    settings,
    ds.sizePerPieceCt,
    ds.shape,
    policy
  );
  const value = calculateDiamondValue(totalCarat, ratePerCt);
  return { ...ds, totalCarat, ratePerCt, value, policy };
}
