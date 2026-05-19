import type { AppData, Product, ProductCategory } from "@/lib/types";
import { dateKey, startOfWeekKey } from "@/lib/format";

function sameDate(value: string, key: string) {
  return value.slice(0, 10) === key;
}

function afterOrSame(value: string, key: string) {
  return value.slice(0, 10) >= key;
}

export function stockStatus(product: Product) {
  if (product.stockQuantity <= 0) {
    return { label: "Rupture", tone: "danger" as const };
  }
  if (product.stockQuantity <= product.lowStockThreshold) {
    return { label: "Stock faible", tone: "warning" as const };
  }
  return { label: "OK", tone: "ok" as const };
}

export function calculateSummary(data: AppData) {
  const today = dateKey();
  const weekStart = startOfWeekKey();

  const todaySales = data.sales.filter((sale) => sameDate(sale.soldAt, today));
  const weekSales = data.sales.filter((sale) => afterOrSame(sale.soldAt, weekStart));
  const todayExpenses = data.expenses.filter((expense) => sameDate(expense.expenseDate, today));
  const weekExpenses = data.expenses.filter((expense) => afterOrSame(expense.expenseDate, weekStart));
  const todayTransfers = data.moneyTransfers.filter((transfer) =>
    sameDate(transfer.transferDate, today),
  );
  const weekTransfers = data.moneyTransfers.filter((transfer) =>
    afterOrSame(transfer.transferDate, weekStart),
  );

  const todaySalesTotal = sum(todaySales.map((sale) => sale.totalAmount));
  const weekSalesTotal = sum(weekSales.map((sale) => sale.totalAmount));
  const todayCost = sum(todaySales.map((sale) => sale.totalCost));
  const weekCost = sum(weekSales.map((sale) => sale.totalCost));
  const todayExpensesTotal = sum(todayExpenses.map((expense) => expense.amount));
  const weekExpensesTotal = sum(weekExpenses.map((expense) => expense.amount));
  const todayCommissions = sum(todayTransfers.map((transfer) => transfer.commission));
  const weekCommissions = sum(weekTransfers.map((transfer) => transfer.commission));

  const categorySales = data.saleItems.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.totalAmount;
      return acc;
    },
    {} as Record<ProductCategory, number>,
  );

  return {
    todaySalesTotal,
    weekSalesTotal,
    todayExpensesTotal,
    weekExpensesTotal,
    todayCommissions,
    weekCommissions,
    todayProfit: todaySalesTotal - todayCost - todayExpensesTotal + todayCommissions,
    weekProfit: weekSalesTotal - weekCost - weekExpensesTotal + weekCommissions,
    lowStockProducts: data.products.filter(
      (product) => product.stockQuantity <= product.lowStockThreshold,
    ),
    categorySales,
  };
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function makeWhatsAppSummary(data: AppData) {
  const summary = calculateSummary(data);
  const lowStockNames = summary.lowStockProducts.map((product) => product.name).join(", ");

  return [
    "Résumé Fatou Caisse",
    `Ventes du jour: ${summary.todaySalesTotal.toFixed(0)} TL`,
    `Dépenses du jour: ${summary.todayExpensesTotal.toFixed(0)} TL`,
    `Commissions transfert: ${summary.todayCommissions.toFixed(0)} TL`,
    `Bénéfice estimé: ${summary.todayProfit.toFixed(0)} TL`,
    `Total semaine: ${summary.weekSalesTotal.toFixed(0)} TL`,
    `Stock faible: ${lowStockNames || "Aucun"}`,
  ].join("\n");
}
