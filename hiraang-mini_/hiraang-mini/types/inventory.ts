export type Purity = "9KT" | "14KT" | "18KT" | "22KT" | "24KT";
export type GoldColour = "Yellow" | "White" | "Rose";
export type Category =
  | "Bangles"
  | "Bracelets (Men)"
  | "Bracelets (Women)"
  | "Earrings (Men)"
  | "Earrings (Women)"
  | "Necklaces"
  | "Necklace Sets"
  | "Nosepins"
  | "Pendants"
  | "Pendant Sets"
  | "Rings (Men)"
  | "Rings (Women)"
  | "Tanmaniyas"
  | "GOLD";
export type DiamondShape = "ROUND" | "FANCY" | "HEART";
export type Policy = "A" | "B" | "C" | "D" | "ALL";
export type ItemType = "Diamond Jewellery" | "Gold Jewellery";
export type StockStatus = "Available" | "Reserved" | "Sold" | "On Order" | "Repair";
export type PaymentStatus = "pending" | "partial" | "paid";
export type PaymentMode = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Cheque" | "Mixed" | "Other";

export interface DiamondSet {
  id: string;
  parentItemId: string;
  shape: DiamondShape;
  sizePerPieceCt: number;
  pieces: number;
  totalCarat: number;
  ratePerCt: number;
  value: number;
  policy?: Policy;
}

export interface InventoryItem {
  id: string;
  sku: string;
  huid: string;
  hsnCode: string;
  itemName: string;
  category: Category;
  purity: Purity;
  goldColour: GoldColour;
  goldWeightGram: number;
  makingFormula: string;
  makingFormulaOverride?: string;
  diamondSets: DiamondSet[];
  remarks: string;
  totalValue: number;
  goldAmount: number;
  diamondValue: number;
  wastage: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  itemType?: ItemType;
  size?: string;
}

export interface RateBracket {
  id: string;
  lowerCt: number;
  upperCt: number;
  roundA: number;
  roundB: number;
  roundC: number;
  roundD: number;
  fancyA: number;
  fancyB: number;
  fancyC: number;
  fancyD: number;
  heartA: number;
  heartB: number;
  heartC: number;
  heartD: number;
}

export interface GoldRateRow {
  id: string;
  purityKt: string;
  percentage: number;
  rateInInr: number;
}

export interface Settings {
  goldRate: number;
  taxPercent: number;
  policy: Policy;
  snapNearest: boolean;
  purityFactor: number;
  makingFormula: string;
  rateBrackets: RateBracket[];
  reduceStockOnIssue: boolean;
  goldRateTable: GoldRateRow[];
  goldBaselineRowId: string;
}

export interface InvoiceItem {
  id: string;
  linkedInventoryItem: InventoryItem;
  quantity: number;
  goldWeightGram: number;
  goldAmount: number;
  diamondAmount: number;
  wastage: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  mode: PaymentMode;
  amount: number;
  paymentDate: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  gstin?: string;
  pan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  modeOfPayment?: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerGSTIN: string;
  customerPAN?: string;
  customerState: string;
  placeOfSupply: string;
  customerId?: string;
  customer?: Customer;
  policyUsed: Policy;
  goldRate: number;
  taxPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  discountAmount?: number;
  discountPercent?: number;
  netTotal: number;
  totalAmountWords?: string;
  advanceAmount?: number;
  paymentStatus: PaymentStatus;
  status: "Draft" | "Issued";
  payments?: InvoicePayment[];
  isCancelled?: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface Counters {
  nextInvoiceSeq: number;
  skuSequences: Record<string, number>;
}

export interface CompanyProfile {
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  cin: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}

export const CATEGORIES: Category[] = [
  "Bangles",
  "Bracelets (Men)",
  "Bracelets (Women)",
  "Earrings (Men)",
  "Earrings (Women)",
  "Necklaces",
  "Necklace Sets",
  "Nosepins",
  "Pendants",
  "Pendant Sets",
  "Rings (Men)",
  "Rings (Women)",
  "Tanmaniyas",
  "GOLD",
];

export const PURITIES: Purity[] = ["9KT", "14KT", "18KT", "22KT", "24KT"];
export const GOLD_COLOURS: GoldColour[] = ["Yellow", "White", "Rose"];
export const STOCK_STATUSES: StockStatus[] = [
  "Available",
  "Reserved",
  "Sold",
  "On Order",
  "Repair",
];
export const ITEM_TYPES: ItemType[] = ["Diamond Jewellery", "Gold Jewellery"];
export const DIAMOND_SHAPES: DiamondShape[] = ["ROUND", "FANCY", "HEART"];
export const POLICIES: Policy[] = ["A", "B", "C", "D"];
export const PAYMENT_MODES: PaymentMode[] = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Cheque",
  "Mixed",
  "Other",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const CATEGORY_CODES: Record<Category, string> = {
  Bangles: "BG",
  "Bracelets (Men)": "BRM",
  "Bracelets (Women)": "BRW",
  "Earrings (Men)": "ERM",
  "Earrings (Women)": "ERW",
  Necklaces: "NK",
  "Necklace Sets": "NKS",
  Nosepins: "NP",
  Pendants: "PD",
  "Pendant Sets": "PDS",
  "Rings (Men)": "RM",
  "Rings (Women)": "RW",
  Tanmaniyas: "TM",
  GOLD: "GD",
};
