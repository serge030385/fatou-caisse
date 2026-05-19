"use client";

import { Copy, PieChart, ReceiptText, Send, TrendingUp } from "lucide-react";
import { useState } from "react";
import { MetricCard, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui";
import { calculateSummary, makeWhatsAppSummary } from "@/lib/calculations";
import { moneyTl } from "@/lib/format";
import { productCategories, productCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";

export function ReportsPage() {
  const { data } = useFatouStore();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "blocked">("idle");
  const summary = calculateSummary(data);
  const whatsAppText = makeWhatsAppSummary(data);

  async function copySummary() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(whatsAppText);
      } else {
        fallbackCopy(whatsAppText);
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      try {
        fallbackCopy(whatsAppText);
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 1600);
      } catch {
        setCopyState("blocked");
      }
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Rapports"
        title="Résumé caisse"
        description="Vue simple du jour, de la semaine et des catégories."
      />

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Ventes jour" value={moneyTl(summary.todaySalesTotal)} icon={TrendingUp} />
        <MetricCard label="Ventes semaine" value={moneyTl(summary.weekSalesTotal)} tone="sky" icon={PieChart} />
        <MetricCard
          label="Dépenses jour"
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
      </div>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Ventes par catégorie</h2>
          <StatusBadge tone="blue">{moneyTl(summary.weekSalesTotal)}</StatusBadge>
        </div>
        <div className="space-y-3">
          {productCategories.map((category) => {
            const value = summary.categorySales[category.value] ?? 0;
            const width = summary.weekSalesTotal ? Math.min(100, (value / summary.weekSalesTotal) * 100) : 0;
            return (
              <div key={category.value}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm font-black">
                  <span>{productCategoryLabel(category.value)}</span>
                  <span>{moneyTl(value)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#f1e8df]">
                  <div
                    className="h-full rounded-full bg-[var(--brand)]"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-black">Détails</h2>
        <div className="grid gap-2">
          <DetailRow label="Dépenses semaine" value={moneyTl(summary.weekExpensesTotal)} />
          <DetailRow label="Commissions jour" value={moneyTl(summary.todayCommissions)} />
          <DetailRow label="Commissions semaine" value={moneyTl(summary.weekCommissions)} />
          <DetailRow label="Bénéfice semaine estimé" value={moneyTl(summary.weekProfit)} />
        </div>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center gap-2">
          <Send size={20} className="text-[var(--leaf)]" aria-hidden="true" />
          <h2 className="text-lg font-black">Résumé WhatsApp</h2>
        </div>
        <pre className="mb-3 whitespace-pre-wrap rounded-[1rem] bg-[#f8f5f1] p-3 text-sm font-bold leading-6 text-[var(--foreground)]">
          {whatsAppText}
        </pre>
        <PrimaryButton type="button" onClick={copySummary}>
          <span className="inline-flex items-center justify-center gap-2">
            <Copy size={20} aria-hidden="true" />
            {copyState === "copied" ? "Résumé copié" : "Copier le résumé WhatsApp"}
          </span>
        </PrimaryButton>
        {copyState === "blocked" ? (
          <p className="mt-3 text-center text-sm font-black text-[var(--brand)]">
            Copie bloquée par le navigateur. Le texte est prêt juste au-dessus.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("copy-blocked");
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1rem] bg-[#fffaf5] p-3">
      <p className="font-bold text-[var(--muted)]">{label}</p>
      <p className="font-black">{value}</p>
    </div>
  );
}
