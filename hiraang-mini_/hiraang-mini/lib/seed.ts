import {
  Customer,
  InventoryItem,
  Invoice,
  Settings,
  Counters,
  CompanyProfile,
  CATEGORY_CODES,
} from "@/types/inventory";
import {
  calculateItemTotal,
  calculateGSTComponents,
  numberToWords,
  getGoldRateFromTable,
  calculateGoldAmount,
  recomputeDiamondSet,
} from "@/lib/calculations";
import { uid } from "@/lib/utils";

export const DEMO_COMPANY: CompanyProfile = {
  name: "Hiraang Mini Jewellers",
  address: "Demo Store, College Road, Cuttack, Odisha – 753001",
  gstin: "21AAHCM0000M1Z5",
  phone: "+91 98765 43210",
  email: "demo@hiraang-mini.local",
  cin: "U32112OD2024PTC000001",
  bankDetails: {
    bankName: "Demo Bank",
    accountNumber: "123456789012",
    ifscCode: "DEMO0001234",
    branch: "Cuttack Main",
  },
};

export function createDefaultSettings(): Settings {
  return {
    goldRate: 9592.47,
    taxPercent: 3.0,
    policy: "A",
    snapNearest: false,
    purityFactor: 0.585,
    makingFormula:
      "IF(GoldWeight>1.5,(6.5%*GoldWeight*GoldRate)/PurityFactor,(12%*(GoldRate/PurityFactor)))",
    reduceStockOnIssue: true,
    goldBaselineRowId: "1",
    goldRateTable: [
      { id: "1", purityKt: "24KT", percentage: 99.9, rateInInr: 9592.47 },
      { id: "2", purityKt: "22KT", percentage: 91.6, rateInInr: 8790.0 },
      { id: "3", purityKt: "18KT", percentage: 75.0, rateInInr: 7200.0 },
      { id: "4", purityKt: "14KT", percentage: 58.5, rateInInr: 5616.5 },
      { id: "5", purityKt: "9KT", percentage: 37.5, rateInInr: 3600.0 },
    ],
    rateBrackets: [
      {
        id: "1",
        lowerCt: 0.0,
        upperCt: 0.499,
        roundA: 10600,
        roundB: 9409,
        roundC: 8500,
        roundD: 7800,
        fancyA: 9500,
        fancyB: 8400,
        fancyC: 7600,
        fancyD: 7000,
        heartA: 9500,
        heartB: 8400,
        heartC: 7600,
        heartD: 7000,
      },
      {
        id: "2",
        lowerCt: 0.5,
        upperCt: 0.999,
        roundA: 9500,
        roundB: 8400,
        roundC: 7600,
        roundD: 7000,
        fancyA: 8500,
        fancyB: 7500,
        fancyC: 6800,
        fancyD: 6200,
        heartA: 8500,
        heartB: 7500,
        heartC: 6800,
        heartD: 6200,
      },
      {
        id: "3",
        lowerCt: 1.0,
        upperCt: 1.499,
        roundA: 8500,
        roundB: 7500,
        roundC: 6800,
        roundD: 6200,
        fancyA: 7600,
        fancyB: 6700,
        fancyC: 6100,
        fancyD: 5500,
        heartA: 7600,
        heartB: 6700,
        heartC: 6100,
        heartD: 5500,
      },
      {
        id: "4",
        lowerCt: 1.5,
        upperCt: 2.499,
        roundA: 7300,
        roundB: 6500,
        roundC: 5900,
        roundD: 5400,
        fancyA: 6500,
        fancyB: 5800,
        fancyC: 5200,
        fancyD: 4800,
        heartA: 6500,
        heartB: 5800,
        heartC: 5200,
        heartD: 4800,
      },
      {
        id: "5",
        lowerCt: 2.5,
        upperCt: 99.999,
        roundA: 6500,
        roundB: 5800,
        roundC: 5200,
        roundD: 4800,
        fancyA: 5800,
        fancyB: 5200,
        fancyC: 4700,
        fancyD: 4300,
        heartA: 5800,
        heartB: 5200,
        heartC: 4700,
        heartD: 4300,
      },
    ],
  };
}

function finalizeItem(
  partial: Omit<
    InventoryItem,
    "goldAmount" | "diamondValue" | "wastage" | "totalValue"
  > &
    Partial<
      Pick<
        InventoryItem,
        "goldAmount" | "diamondValue" | "wastage" | "totalValue"
      >
    >,
  settings: Settings
): InventoryItem {
  const withDiamonds: InventoryItem = {
    goldAmount: 0,
    diamondValue: 0,
    wastage: 0,
    totalValue: 0,
    ...partial,
    diamondSets: partial.diamondSets.map((ds) =>
      recomputeDiamondSet(ds, settings, settings.policy)
    ),
  };
  const totals = calculateItemTotal(withDiamonds, settings);
  return { ...withDiamonds, ...totals };
}

export function createSeedData(): {
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  settings: Settings;
  counters: Counters;
} {
  const settings = createDefaultSettings();
  const now = new Date().toISOString();

  const customers: Customer[] = [
    {
      id: "cust-1",
      name: "Priya Sharma",
      phone: "9876543210",
      email: "priya@example.com",
      address: "12 Ring Road, Bhubaneswar",
      state: "Odisha",
      gstin: "21AABCP1234A1Z5",
      pan: "AABCP1234A",
      createdAt: now,
    },
    {
      id: "cust-2",
      name: "Rahul Mehta",
      phone: "9123456780",
      email: "rahul@example.com",
      address: "45 MG Road, Mumbai",
      state: "Maharashtra",
      pan: "ABCDE1234F",
      createdAt: now,
    },
    {
      id: "cust-3",
      name: "Ananya Das",
      phone: "9988776655",
      email: "ananya@example.com",
      address: "7 Temple Street, Cuttack",
      state: "Odisha",
      createdAt: now,
    },
    {
      id: "cust-4",
      name: "Vikram Singh",
      phone: "9090909090",
      email: "vikram@example.com",
      address: "88 Civil Lines, Delhi",
      state: "Delhi",
      gstin: "07AABCV5678B1Z2",
      createdAt: now,
    },
    {
      id: "cust-5",
      name: "Sneha Patnaik",
      phone: "9811122233",
      email: "sneha@example.com",
      address: "3 Lake View, Puri",
      state: "Odisha",
      createdAt: now,
    },
  ];

  const inventory: InventoryItem[] = [
    finalizeItem(
      {
        id: "inv-1",
        sku: "RW-0001",
        huid: "HUIDRW0001",
        hsnCode: "711319",
        itemName: "Classic Solitaire Ring",
        category: "Rings (Women)",
        purity: "18KT",
        goldColour: "Yellow",
        goldWeightGram: 3.25,
        makingFormula: settings.makingFormula,
        diamondSets: [
          {
            id: "ds-1",
            parentItemId: "inv-1",
            shape: "ROUND",
            sizePerPieceCt: 0.25,
            pieces: 1,
            totalCarat: 0,
            ratePerCt: 0,
            value: 0,
          },
        ],
        remarks: "Demo solitaire",
        stockQuantity: 2,
        stockStatus: "Available",
        itemType: "Diamond Jewellery",
        size: "12",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-2",
        sku: "ERW-0001",
        huid: "HUIDERW001",
        hsnCode: "711319",
        itemName: "Floral Diamond Earrings",
        category: "Earrings (Women)",
        purity: "18KT",
        goldColour: "White",
        goldWeightGram: 4.1,
        makingFormula: settings.makingFormula,
        diamondSets: [
          {
            id: "ds-2",
            parentItemId: "inv-2",
            shape: "ROUND",
            sizePerPieceCt: 0.08,
            pieces: 12,
            totalCarat: 0,
            ratePerCt: 0,
            value: 0,
          },
        ],
        remarks: "",
        stockQuantity: 1,
        stockStatus: "Available",
        itemType: "Diamond Jewellery",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-3",
        sku: "NK-0001",
        huid: "HUIDNK0001",
        hsnCode: "711319",
        itemName: "Temple Gold Necklace",
        category: "Necklaces",
        purity: "22KT",
        goldColour: "Yellow",
        goldWeightGram: 28.5,
        makingFormula: "PERCENTAGE:12",
        diamondSets: [],
        remarks: "Traditional",
        stockQuantity: 1,
        stockStatus: "Available",
        itemType: "Gold Jewellery",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-4",
        sku: "BG-0001",
        huid: "HUIDBG0001",
        hsnCode: "711319",
        itemName: "Plain Gold Bangle Pair",
        category: "Bangles",
        purity: "22KT",
        goldColour: "Yellow",
        goldWeightGram: 18.2,
        makingFormula: "FIXED:2500",
        diamondSets: [],
        remarks: "",
        stockQuantity: 3,
        stockStatus: "Available",
        itemType: "Gold Jewellery",
        size: "2.4",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-5",
        sku: "PD-0001",
        huid: "HUIDPD0001",
        hsnCode: "711319",
        itemName: "Heart Pendant",
        category: "Pendants",
        purity: "18KT",
        goldColour: "Rose",
        goldWeightGram: 2.15,
        makingFormula: settings.makingFormula,
        diamondSets: [
          {
            id: "ds-5",
            parentItemId: "inv-5",
            shape: "HEART",
            sizePerPieceCt: 0.3,
            pieces: 1,
            totalCarat: 0,
            ratePerCt: 0,
            value: 0,
          },
        ],
        remarks: "",
        stockQuantity: 1,
        stockStatus: "Available",
        itemType: "Diamond Jewellery",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-6",
        sku: "RM-0001",
        huid: "HUIDRM0001",
        hsnCode: "711319",
        itemName: "Men Signet Ring",
        category: "Rings (Men)",
        purity: "18KT",
        goldColour: "Yellow",
        goldWeightGram: 6.4,
        makingFormula: settings.makingFormula,
        diamondSets: [],
        remarks: "",
        stockQuantity: 2,
        stockStatus: "Available",
        itemType: "Gold Jewellery",
        size: "20",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-7",
        sku: "BRW-0001",
        huid: "HUIDBRW001",
        hsnCode: "711319",
        itemName: "Tennis Bracelet",
        category: "Bracelets (Women)",
        purity: "18KT",
        goldColour: "White",
        goldWeightGram: 7.8,
        makingFormula: settings.makingFormula,
        diamondSets: [
          {
            id: "ds-7",
            parentItemId: "inv-7",
            shape: "ROUND",
            sizePerPieceCt: 0.05,
            pieces: 40,
            totalCarat: 0,
            ratePerCt: 0,
            value: 0,
          },
        ],
        remarks: "",
        stockQuantity: 1,
        stockStatus: "Available",
        itemType: "Diamond Jewellery",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-8",
        sku: "NP-0001",
        huid: "HUIDNP0001",
        hsnCode: "711319",
        itemName: "Diamond Nosepin",
        category: "Nosepins",
        purity: "14KT",
        goldColour: "Yellow",
        goldWeightGram: 0.45,
        makingFormula: "FIXED:500",
        diamondSets: [
          {
            id: "ds-8",
            parentItemId: "inv-8",
            shape: "ROUND",
            sizePerPieceCt: 0.05,
            pieces: 1,
            totalCarat: 0,
            ratePerCt: 0,
            value: 0,
          },
        ],
        remarks: "",
        stockQuantity: 5,
        stockStatus: "Available",
        itemType: "Diamond Jewellery",
      },
      settings
    ),
    finalizeItem(
      {
        id: "inv-9",
        sku: "TM-0001",
        huid: "HUIDTM0001",
        hsnCode: "711319",
        itemName: "Gold Tanmaniya",
        category: "Tanmaniyas",
        purity: "22KT",
        goldColour: "Yellow",
        goldWeightGram: 4.75,
        makingFormula: "PERCENTAGE:10",
        diamondSets: [],
        remarks: "",
        stockQuantity: 2,
        stockStatus: "Available",
        itemType: "Gold Jewellery",
      },
      settings
    ),
  ];

  const ring = inventory[0];
  const earrings = inventory[1];
  const bangle = inventory[3];

  function lineFromItem(item: InventoryItem, qty = 1) {
    const goldRate = getGoldRateFromTable(settings, item.purity);
    const goldAmount = Number(
      (calculateGoldAmount(item.goldWeightGram, goldRate) * qty).toFixed(2)
    );
    const diamondAmount = Number(
      (item.diamondSets.reduce((s, d) => s + d.value, 0) * qty).toFixed(2)
    );
    const wastage = Number((item.wastage * qty).toFixed(2));
    const subtotal = Number(
      (goldAmount + diamondAmount + wastage).toFixed(2)
    );
    return {
      id: uid(),
      linkedInventoryItem: item,
      quantity: qty,
      goldWeightGram: item.goldWeightGram * qty,
      goldAmount,
      diamondAmount,
      wastage,
      subtotal,
      tax: 0,
      total: subtotal,
    };
  }

  const draftItems = [lineFromItem(ring)];
  const draftSub = draftItems.reduce((s, i) => s + i.subtotal, 0);
  const draftGst = calculateGSTComponents(draftSub, customers[0].state);
  const draftGrand = Number((draftSub + draftGst.totalTax).toFixed(2));

  const issuedItems = [lineFromItem(earrings), lineFromItem(bangle)];
  const issuedSub = Number(
    issuedItems.reduce((s, i) => s + i.subtotal, 0).toFixed(2)
  );
  const issuedGst = calculateGSTComponents(issuedSub, customers[2].state);
  const issuedGrand = Number((issuedSub + issuedGst.totalTax).toFixed(2));
  const issuedDiscount = 1000;
  const issuedNet = Number((issuedGrand - issuedDiscount).toFixed(2));
  const partialPaid = Number((issuedNet * 0.4).toFixed(2));

  const otherItems = [lineFromItem(inventory[5])];
  const otherSub = otherItems.reduce((s, i) => s + i.subtotal, 0);
  const otherGst = calculateGSTComponents(otherSub, customers[1].state);
  const otherGrand = Number((otherSub + otherGst.totalTax).toFixed(2));

  // Reflect stock already sold on the seeded Issued invoice (earrings + bangle)
  const earringsIdx = inventory.findIndex((i) => i.id === "inv-2");
  const bangleIdx = inventory.findIndex((i) => i.id === "inv-4");
  if (earringsIdx >= 0) {
    inventory[earringsIdx] = {
      ...inventory[earringsIdx],
      stockQuantity: 0,
      stockStatus: "Sold",
    };
  }
  if (bangleIdx >= 0) {
    inventory[bangleIdx] = {
      ...inventory[bangleIdx],
      stockQuantity: Math.max(0, inventory[bangleIdx].stockQuantity - 1),
    };
  }

  const invoices: Invoice[] = [
    {
      id: "invc-1",
      invoiceNumber: "INV-2026-0001",
      date: "2026-10-28",
      modeOfPayment: "UPI",
      customerId: customers[0].id,
      customer: customers[0],
      customerName: customers[0].name,
      customerAddress: customers[0].address,
      customerPhone: customers[0].phone,
      customerGSTIN: customers[0].gstin || "",
      customerPAN: customers[0].pan,
      customerState: customers[0].state,
      placeOfSupply: customers[0].state,
      policyUsed: "A",
      goldRate: settings.goldRate,
      taxPercent: settings.taxPercent,
      cgst: draftGst.cgst,
      sgst: draftGst.sgst,
      igst: draftGst.igst,
      items: draftItems,
      subtotal: draftSub,
      tax: draftGst.totalTax,
      grandTotal: draftGrand,
      discountAmount: 0,
      discountPercent: 0,
      netTotal: draftGrand,
      totalAmountWords: numberToWords(draftGrand),
      paymentStatus: "pending",
      status: "Draft",
      payments: [],
    },
    {
      id: "invc-2",
      invoiceNumber: "INV-2026-0002",
      date: "2026-10-30",
      modeOfPayment: "Cash",
      customerId: customers[2].id,
      customer: customers[2],
      customerName: customers[2].name,
      customerAddress: customers[2].address,
      customerPhone: customers[2].phone,
      customerGSTIN: "",
      customerState: customers[2].state,
      placeOfSupply: customers[2].state,
      policyUsed: "A",
      goldRate: settings.goldRate,
      taxPercent: settings.taxPercent,
      cgst: issuedGst.cgst,
      sgst: issuedGst.sgst,
      igst: issuedGst.igst,
      items: issuedItems,
      subtotal: issuedSub,
      tax: issuedGst.totalTax,
      grandTotal: issuedGrand,
      discountAmount: issuedDiscount,
      discountPercent: Number(
        ((issuedDiscount / issuedGrand) * 100).toFixed(2)
      ),
      netTotal: issuedNet,
      totalAmountWords: numberToWords(issuedNet),
      paymentStatus: "partial",
      status: "Issued",
      payments: [
        {
          id: "pay-1",
          invoiceId: "invc-2",
          mode: "Cash",
          amount: partialPaid,
          paymentDate: "2026-10-30",
        },
      ],
    },
    {
      id: "invc-3",
      invoiceNumber: "INV-2026-0003",
      date: "2026-11-01",
      modeOfPayment: "Card",
      customerId: customers[1].id,
      customer: customers[1],
      customerName: customers[1].name,
      customerAddress: customers[1].address,
      customerPhone: customers[1].phone,
      customerGSTIN: "",
      customerPAN: customers[1].pan,
      customerState: customers[1].state,
      placeOfSupply: customers[1].state,
      policyUsed: "A",
      goldRate: settings.goldRate,
      taxPercent: settings.taxPercent,
      cgst: otherGst.cgst,
      sgst: otherGst.sgst,
      igst: otherGst.igst,
      items: otherItems,
      subtotal: otherSub,
      tax: otherGst.totalTax,
      grandTotal: otherGrand,
      discountAmount: 0,
      discountPercent: 0,
      netTotal: otherGrand,
      totalAmountWords: numberToWords(otherGrand),
      paymentStatus: "pending",
      status: "Draft",
      payments: [],
    },
  ];

  const counters: Counters = {
    nextInvoiceSeq: 4,
    skuSequences: Object.fromEntries(
      Object.values(CATEGORY_CODES).map((code) => {
        const max = inventory
          .filter((i) => i.sku.startsWith(code + "-"))
          .map((i) => parseInt(i.sku.split("-")[1] || "0", 10))
          .reduce((a, b) => Math.max(a, b), 0);
        return [code, max + 1];
      })
    ),
  };

  return { customers, inventory, invoices, settings, counters };
}
