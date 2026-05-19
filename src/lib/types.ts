export type ProductCategory = "produit_africain" | "boisson" | "plat" | "autre";
export type ExpenseCategory =
  | "achat_marchandise"
  | "loyer"
  | "transport"
  | "recharge"
  | "autre";
export type TransferNetwork = "orange_money" | "mtn_mobile_money";
export type TransferStatus = "paye" | "en_attente" | "termine";
export type SaleType = "product" | "free";

export type Product = {
  id: string;
  userId: string | null;
  shopId: string | null;
  name: string;
  category: ProductCategory;
  salePrice: number;
  purchasePrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Sale = {
  id: string;
  userId: string | null;
  shopId: string | null;
  saleType: SaleType;
  totalAmount: number;
  totalCost: number;
  soldAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  userId: string | null;
  shopId: string | null;
  itemName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  purchaseUnitPrice: number | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
};

export type Expense = {
  id: string;
  userId: string | null;
  shopId: string | null;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  expenseDate: string;
  createdAt: string;
  updatedAt: string;
};

export type MoneyTransfer = {
  id: string;
  userId: string | null;
  shopId: string | null;
  customerName: string;
  phone: string | null;
  network: TransferNetwork;
  amountFcfa: number;
  amountTl: number;
  commission: number;
  status: TransferStatus;
  note: string | null;
  transferDate: string;
  createdAt: string;
  updatedAt: string;
};

export type Setting = {
  id: string;
  userId: string | null;
  shopId: string | null;
  key: string;
  value: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  products: Product[];
  sales: Sale[];
  saleItems: SaleItem[];
  expenses: Expense[];
  moneyTransfers: MoneyTransfer[];
  settings: Setting[];
};

export type StorageMode = "not_configured" | "supabase" | "error";
