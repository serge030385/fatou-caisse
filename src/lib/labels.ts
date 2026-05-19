import type {
  ExpenseCategory,
  ProductCategory,
  TransferNetwork,
  TransferStatus,
} from "@/lib/types";

export const productCategories: Array<{ value: ProductCategory; label: string }> = [
  { value: "produit_africain", label: "Produit africain" },
  { value: "boisson", label: "Boisson" },
  { value: "plat", label: "Plat" },
  { value: "autre", label: "Autre" },
];

export const expenseCategories: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "achat_marchandise", label: "Achat marchandise" },
  { value: "loyer", label: "Loyer" },
  { value: "transport", label: "Transport" },
  { value: "recharge", label: "Recharge" },
  { value: "autre", label: "Autre" },
];

export const transferNetworks: Array<{ value: TransferNetwork; label: string }> = [
  { value: "orange_money", label: "Orange Money" },
  { value: "mtn_mobile_money", label: "MTN Mobile Money" },
];

export const transferStatuses: Array<{ value: TransferStatus; label: string }> = [
  { value: "paye", label: "Payé" },
  { value: "en_attente", label: "En attente" },
  { value: "termine", label: "Terminé" },
];

export function productCategoryLabel(value: ProductCategory) {
  return productCategories.find((category) => category.value === value)?.label ?? value;
}

export function expenseCategoryLabel(value: ExpenseCategory) {
  return expenseCategories.find((category) => category.value === value)?.label ?? value;
}

export function transferNetworkLabel(value: TransferNetwork) {
  return transferNetworks.find((network) => network.value === value)?.label ?? value;
}

export function transferStatusLabel(value: TransferStatus) {
  return transferStatuses.find((status) => status.value === value)?.label ?? value;
}
