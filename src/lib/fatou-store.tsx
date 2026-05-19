"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dateKey } from "@/lib/format";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import type {
  AppData,
  Expense,
  ExpenseCategory,
  MoneyTransfer,
  Product,
  ProductCategory,
  Sale,
  SaleItem,
  Setting,
  StorageMode,
  TransferNetwork,
  TransferStatus,
} from "@/lib/types";

const emptyData: AppData = {
  products: [],
  sales: [],
  saleItems: [],
  expenses: [],
  moneyTransfers: [],
  settings: [],
};

type ProductInput = {
  name: string;
  category: ProductCategory;
  salePrice: number;
  purchasePrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  photoUrl: string | null;
};

type ProductSaleInput = {
  productId: string;
  quantity: number;
};

type FreeSaleInput = {
  itemName: string;
  category: ProductCategory;
  amount: number;
  quantity: number;
};

type ExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  expenseDate: string;
};

type TransferInput = {
  customerName: string;
  phone: string | null;
  network: TransferNetwork;
  amountFcfa: number;
  amountTl: number;
  commission: number;
  status: TransferStatus;
  note: string | null;
};

type StoreContext = {
  data: AppData;
  loading: boolean;
  error: string | null;
  storageMode: StorageMode;
  refreshData(): Promise<void>;
  addProduct(input: ProductInput): Promise<void>;
  updateProduct(id: string, input: ProductInput): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  recordProductSale(input: ProductSaleInput): Promise<void>;
  recordFreeSale(input: FreeSaleInput): Promise<void>;
  addExpense(input: ExpenseInput): Promise<void>;
  addMoneyTransfer(input: TransferInput): Promise<void>;
  updateTransferStatus(id: string, status: TransferStatus): Promise<void>;
  adjustStock(productId: string, stockQuantity: number): Promise<void>;
};

const FatouStoreContext = createContext<StoreContext | null>(null);

export function FatouStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode>("not_configured");

  const handleError = useCallback((reason: unknown) => {
    const message = formatSupabaseError(reason);
    setError(message);
    setStorageMode(isSupabaseConfigured() ? "error" : "not_configured");
    return new Error(message);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      assertSupabaseConfigured();
      const remoteData = await loadFromSupabase();
      setData(remoteData);
      setStorageMode("supabase");
    } catch (reason) {
      setData(emptyData);
      throw handleError(reason);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      refreshData().catch(() => {
        // The visible app error is set in handleError.
      });
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [refreshData]);

  const runMutation = useCallback(
    async (mutation: () => Promise<void>) => {
      setLoading(true);
      setError(null);
      try {
        assertSupabaseConfigured();
        await mutation();
        const remoteData = await loadFromSupabase();
        setData(remoteData);
        setStorageMode("supabase");
      } catch (reason) {
        throw handleError(reason);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  const addProduct = useCallback(
    async (input: ProductInput) => {
      await runMutation(async () => {
        const product: Product = {
          ...input,
          id: makeId(),
          userId: null,
          shopId: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        await insertSupabase("products", productToDb(product));
      });
    },
    [runMutation],
  );

  const updateProduct = useCallback(
    async (id: string, input: ProductInput) => {
      await runMutation(async () => {
        const existingProduct = data.products.find((product) => product.id === id);
        if (!existingProduct) {
          throw new Error("Produit introuvable dans Supabase.");
        }

        const updatedProduct: Product = {
          ...existingProduct,
          ...input,
          updatedAt: nowIso(),
        };

        await updateSupabase("products", id, productToDb(updatedProduct));
      });
    },
    [data.products, runMutation],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await runMutation(async () => {
        await deleteSupabase("products", id);
      });
    },
    [runMutation],
  );

  const recordProductSale = useCallback(
    async ({ productId, quantity }: ProductSaleInput) => {
      const product = data.products.find((item) => item.id === productId);
      if (!product) {
        throw new Error("Produit introuvable.");
      }
      if (quantity <= 0) {
        throw new Error("La quantité doit être supérieure à zéro.");
      }
      if (quantity > product.stockQuantity) {
        throw new Error("Stock insuffisant pour cette vente.");
      }

      await runMutation(async () => {
        const sale = makeSale(
          "product",
          product.salePrice * quantity,
          (product.purchasePrice ?? 0) * quantity,
        );
        const item = makeSaleItem({
          saleId: sale.id,
          productId: product.id,
          itemName: product.name,
          category: product.category,
          quantity,
          unitPrice: product.salePrice,
          purchaseUnitPrice: product.purchasePrice,
        });
        const updatedProduct = {
          ...product,
          stockQuantity: product.stockQuantity - quantity,
          updatedAt: nowIso(),
        };

        await insertSupabase("sales", saleToDb(sale));
        await insertSupabase("sale_items", saleItemToDb(item));
        await updateSupabase("products", product.id, productToDb(updatedProduct));
      });
    },
    [data.products, runMutation],
  );

  const recordFreeSale = useCallback(
    async ({ itemName, category, amount, quantity }: FreeSaleInput) => {
      if (!itemName.trim()) {
        throw new Error("Nom de l'article obligatoire.");
      }
      if (amount <= 0 || quantity <= 0) {
        throw new Error("Le montant et la quantité doivent être supérieurs à zéro.");
      }

      await runMutation(async () => {
        const sale = makeSale("free", amount * quantity, 0);
        const item = makeSaleItem({
          saleId: sale.id,
          productId: null,
          itemName,
          category,
          quantity,
          unitPrice: amount,
          purchaseUnitPrice: null,
        });

        await insertSupabase("sales", saleToDb(sale));
        await insertSupabase("sale_items", saleItemToDb(item));
      });
    },
    [runMutation],
  );

  const addExpense = useCallback(
    async (input: ExpenseInput) => {
      await runMutation(async () => {
        const expense: Expense = {
          ...input,
          id: makeId(),
          userId: null,
          shopId: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        await insertSupabase("expenses", expenseToDb(expense));
      });
    },
    [runMutation],
  );

  const addMoneyTransfer = useCallback(
    async (input: TransferInput) => {
      await runMutation(async () => {
        const transfer: MoneyTransfer = {
          ...input,
          id: makeId(),
          userId: null,
          shopId: null,
          transferDate: dateKey(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };

        await insertSupabase("money_transfers", transferToDb(transfer));
      });
    },
    [runMutation],
  );

  const updateTransferStatus = useCallback(
    async (id: string, status: TransferStatus) => {
      await runMutation(async () => {
        const existingTransfer = data.moneyTransfers.find((transfer) => transfer.id === id);
        if (!existingTransfer) {
          throw new Error("Transfert introuvable dans Supabase.");
        }

        await updateSupabase(
          "money_transfers",
          id,
          transferToDb({ ...existingTransfer, status, updatedAt: nowIso() }),
        );
      });
    },
    [data.moneyTransfers, runMutation],
  );

  const adjustStock = useCallback(
    async (productId: string, stockQuantity: number) => {
      await runMutation(async () => {
        const existingProduct = data.products.find((product) => product.id === productId);
        if (!existingProduct) {
          throw new Error("Produit introuvable dans Supabase.");
        }

        await updateSupabase(
          "products",
          productId,
          productToDb({
            ...existingProduct,
            stockQuantity: Math.max(0, stockQuantity),
            updatedAt: nowIso(),
          }),
        );
      });
    },
    [data.products, runMutation],
  );

  const value = useMemo<StoreContext>(
    () => ({
      data,
      loading,
      error,
      storageMode,
      refreshData,
      addProduct,
      updateProduct,
      deleteProduct,
      recordProductSale,
      recordFreeSale,
      addExpense,
      addMoneyTransfer,
      updateTransferStatus,
      adjustStock,
    }),
    [
      addExpense,
      addMoneyTransfer,
      addProduct,
      adjustStock,
      data,
      deleteProduct,
      error,
      loading,
      recordFreeSale,
      recordProductSale,
      refreshData,
      storageMode,
      updateProduct,
      updateTransferStatus,
    ],
  );

  return <FatouStoreContext.Provider value={value}>{children}</FatouStoreContext.Provider>;
}

export function useFatouStore() {
  const context = useContext(FatouStoreContext);
  if (!context) {
    throw new Error("useFatouStore doit être utilisé dans FatouStoreProvider.");
  }
  return context;
}

function makeSale(saleType: Sale["saleType"], totalAmount: number, totalCost: number): Sale {
  return {
    id: makeId(),
    userId: null,
    shopId: null,
    saleType,
    totalAmount,
    totalCost,
    soldAt: dateKey(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function makeSaleItem(input: {
  saleId: string;
  productId: string | null;
  itemName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  purchaseUnitPrice: number | null;
}): SaleItem {
  return {
    id: makeId(),
    userId: null,
    shopId: null,
    saleId: input.saleId,
    productId: input.productId,
    itemName: input.itemName,
    category: input.category,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    purchaseUnitPrice: input.purchaseUnitPrice,
    totalAmount: input.unitPrice * input.quantity,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

async function loadFromSupabase(): Promise<AppData> {
  const client = assertSupabaseClient();

  const [products, sales, saleItems, expenses, transfers, settings] = await Promise.all([
    client.from("products").select("*").order("created_at", { ascending: false }),
    client.from("sales").select("*").order("created_at", { ascending: false }),
    client.from("sale_items").select("*").order("created_at", { ascending: false }),
    client.from("expenses").select("*").order("expense_date", { ascending: false }),
    client.from("money_transfers").select("*").order("created_at", { ascending: false }),
    client.from("settings").select("*").order("created_at", { ascending: false }),
  ]);

  const firstError =
    products.error ??
    sales.error ??
    saleItems.error ??
    expenses.error ??
    transfers.error ??
    settings.error;
  if (firstError) {
    throw firstError;
  }

  return {
    products: (products.data ?? []).map(dbToProduct),
    sales: (sales.data ?? []).map(dbToSale),
    saleItems: (saleItems.data ?? []).map(dbToSaleItem),
    expenses: (expenses.data ?? []).map(dbToExpense),
    moneyTransfers: (transfers.data ?? []).map(dbToTransfer),
    settings: (settings.data ?? []).map(dbToSetting),
  };
}

async function insertSupabase(table: string, payload: Record<string, unknown>) {
  const client = assertSupabaseClient();
  const { error } = await client.from(table).insert(payload);
  if (error) {
    throw error;
  }
}

async function updateSupabase(table: string, id: string, payload: Record<string, unknown>) {
  const client = assertSupabaseClient();
  const { error } = await client.from(table).update(payload).eq("id", id);
  if (error) {
    throw error;
  }
}

async function deleteSupabase(table: string, id: string) {
  const client = assertSupabaseClient();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) {
    throw error;
  }
}

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase n'est pas configuré. Ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local puis redémarre npm run dev.",
    );
  }
}

function assertSupabaseClient() {
  assertSupabaseConfigured();
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Client Supabase indisponible dans le navigateur.");
  }
  return client;
}

function formatSupabaseError(reason: unknown) {
  if (reason instanceof Error && reason.message) {
    return reason.message;
  }
  if (typeof reason === "object" && reason !== null && "message" in reason) {
    return String((reason as { message: unknown }).message);
  }
  return "Requête Supabase impossible. Vérifie les variables d'environnement et les politiques RLS.";
}

function nowIso() {
  return new Date().toISOString();
}

function makeId() {
  return crypto.randomUUID();
}

function productToDb(product: Product) {
  return {
    id: product.id,
    user_id: product.userId,
    shop_id: product.shopId,
    name: product.name,
    category: product.category,
    sale_price: product.salePrice,
    purchase_price: product.purchasePrice,
    stock_quantity: product.stockQuantity,
    low_stock_threshold: product.lowStockThreshold,
    photo_url: product.photoUrl,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

function saleToDb(sale: Sale) {
  return {
    id: sale.id,
    user_id: sale.userId,
    shop_id: sale.shopId,
    sale_type: sale.saleType,
    total_amount: sale.totalAmount,
    total_cost: sale.totalCost,
    sold_at: sale.soldAt,
    created_at: sale.createdAt,
    updated_at: sale.updatedAt,
  };
}

function saleItemToDb(item: SaleItem) {
  return {
    id: item.id,
    sale_id: item.saleId,
    product_id: item.productId,
    user_id: item.userId,
    shop_id: item.shopId,
    item_name: item.itemName,
    category: item.category,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    purchase_unit_price: item.purchaseUnitPrice,
    total_amount: item.totalAmount,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

function expenseToDb(expense: Expense) {
  return {
    id: expense.id,
    user_id: expense.userId,
    shop_id: expense.shopId,
    category: expense.category,
    amount: expense.amount,
    note: expense.note,
    expense_date: expense.expenseDate,
    created_at: expense.createdAt,
    updated_at: expense.updatedAt,
  };
}

function transferToDb(transfer: MoneyTransfer) {
  return {
    id: transfer.id,
    user_id: transfer.userId,
    shop_id: transfer.shopId,
    customer_name: transfer.customerName,
    phone: transfer.phone,
    network: transfer.network,
    amount_fcfa: transfer.amountFcfa,
    amount_tl: transfer.amountTl,
    commission: transfer.commission,
    status: transfer.status,
    note: transfer.note,
    transfer_date: transfer.transferDate,
    created_at: transfer.createdAt,
    updated_at: transfer.updatedAt,
  };
}

type DbRow = Record<string, unknown>;

function dbText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function dbNullableText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function dbNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dbToProduct(row: DbRow): Product {
  return {
    id: dbText(row.id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    name: dbText(row.name),
    category: row.category as ProductCategory,
    salePrice: dbNumber(row.sale_price),
    purchasePrice: row.purchase_price === null ? null : dbNumber(row.purchase_price),
    stockQuantity: dbNumber(row.stock_quantity),
    lowStockThreshold: dbNumber(row.low_stock_threshold),
    photoUrl: dbNullableText(row.photo_url),
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function dbToSale(row: DbRow): Sale {
  return {
    id: dbText(row.id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    saleType: row.sale_type as Sale["saleType"],
    totalAmount: dbNumber(row.total_amount),
    totalCost: dbNumber(row.total_cost),
    soldAt: dbText(row.sold_at),
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function dbToSaleItem(row: DbRow): SaleItem {
  return {
    id: dbText(row.id),
    saleId: dbText(row.sale_id),
    productId: dbNullableText(row.product_id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    itemName: dbText(row.item_name),
    category: row.category as ProductCategory,
    quantity: dbNumber(row.quantity),
    unitPrice: dbNumber(row.unit_price),
    purchaseUnitPrice:
      row.purchase_unit_price === null ? null : dbNumber(row.purchase_unit_price),
    totalAmount: dbNumber(row.total_amount),
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function dbToExpense(row: DbRow): Expense {
  return {
    id: dbText(row.id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    category: row.category as ExpenseCategory,
    amount: dbNumber(row.amount),
    note: dbNullableText(row.note),
    expenseDate: dbText(row.expense_date),
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function dbToTransfer(row: DbRow): MoneyTransfer {
  return {
    id: dbText(row.id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    customerName: dbText(row.customer_name),
    phone: dbNullableText(row.phone),
    network: row.network as TransferNetwork,
    amountFcfa: dbNumber(row.amount_fcfa),
    amountTl: dbNumber(row.amount_tl),
    commission: dbNumber(row.commission),
    status: row.status as TransferStatus,
    note: dbNullableText(row.note),
    transferDate: dbText(row.transfer_date),
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function dbToSetting(row: DbRow): Setting {
  return {
    id: dbText(row.id),
    userId: dbNullableText(row.user_id),
    shopId: dbNullableText(row.shop_id),
    key: dbText(row.key),
    value: isRecord(row.value) ? row.value : {},
    createdAt: dbText(row.created_at),
    updatedAt: dbText(row.updated_at),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
