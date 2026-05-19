"use client";

import {
  AlertTriangle,
  Banknote,
  Boxes,
  PackagePlus,
  PlusCircle,
  ReceiptText,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ActionLink, EmptyState, MetricCard, PageHeader, Panel, StatusBadge } from "@/components/ui";
import { SecondaryLinks } from "@/components/app-shell";
import { calculateSummary, stockStatus } from "@/lib/calculations";
import { moneyTl } from "@/lib/format";
import { productCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import { PwaInstallCard } from "@/components/pwa-install-card";

export function DashboardPage() {
  const { data, storageMode } = useFatouStore();
  const summary = calculateSummary(data);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Aujourd'hui"
        title="Bonjour Fatou"
        description="Les chiffres essentiels et les actions rapides pour la journée."
      />

      <PwaInstallCard />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Ventes du jour" value={moneyTl(summary.todaySalesTotal)} icon={Wallet} />
        <MetricCard
          label="Dépenses du jour"
          value={moneyTl(summary.todayExpensesTotal)}
          tone="gold"
          icon={ReceiptText}
        />
        <MetricCard
          label="Bénéfice estimé"
          value={moneyTl(summary.todayProfit)}
          tone="leaf"
          icon={TrendingUp}
        />
        <MetricCard
          label="Total semaine"
          value={moneyTl(summary.weekSalesTotal)}
          tone="sky"
          icon={Banknote}
        />
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Actions rapides</h2>
          <span className="rounded-full bg-[#f6f3ef] px-3 py-2 text-xs font-black text-[var(--muted)]">
            {storageMode === "supabase" ? "Live" : "Config"}
          </span>
        </div>
        <div className="grid gap-3">
          <ActionLink href="/vente" label="Nouvelle vente" icon={PlusCircle} />
          <ActionLink href="/produits" label="Ajouter produit" icon={PackagePlus} tone="leaf" />
          <ActionLink href="/transferts" label="Transfert Cameroun" icon={Send} tone="gold" />
          <ActionLink href="/depenses" label="Ajouter dépense" icon={ReceiptText} tone="sky" />
          <SecondaryLinks />
        </div>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={20} className="text-[var(--brand)]" aria-hidden="true" />
          <h2 className="text-lg font-black">Stock faible</h2>
        </div>
        <div className="space-y-2">
          {summary.lowStockProducts.length ? (
            summary.lowStockProducts.slice(0, 5).map((product) => {
              const status = stockStatus(product);
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black">{product.name}</p>
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      {productCategoryLabel(product.category)} · {product.stockQuantity} restant
                    </p>
                  </div>
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                </div>
              );
            })
          ) : (
            <EmptyState text="Aucun produit en stock faible." />
          )}
        </div>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center gap-2">
          <Boxes size={20} className="text-[var(--leaf)]" aria-hidden="true" />
          <h2 className="text-lg font-black">Dernières ventes</h2>
        </div>
        <div className="space-y-2">
          {data.saleItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[1rem] bg-[#f8f5f1] p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-black">{item.itemName}</p>
                <p className="text-sm font-semibold text-[var(--muted)]">Quantité {item.quantity}</p>
              </div>
              <p className="font-black">{moneyTl(item.totalAmount)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
