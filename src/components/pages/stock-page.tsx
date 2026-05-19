"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState, GhostButton, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui";
import { stockStatus } from "@/lib/calculations";
import { productCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import type { Product } from "@/lib/types";

export function StockPage() {
  const { data, adjustStock } = useFatouStore();
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Stock"
        title="Quantités restantes"
        description="Contrôle les ruptures et ajuste les quantités après inventaire."
      />

      <Panel>
        <div className="space-y-3">
          {data.products.length ? (
            data.products.map((product) => (
              <StockRow
                key={`${product.id}-${product.stockQuantity}`}
                product={product}
                onSave={adjustStock}
                onMessage={setMessage}
              />
            ))
          ) : (
            <EmptyState text="Aucun produit en stock." />
          )}
        </div>
        {message ? <p className="mt-3 text-center text-sm font-black text-[var(--leaf)]">{message}</p> : null}
      </Panel>
    </div>
  );
}

function StockRow({
  product,
  onSave,
  onMessage,
}: {
  product: Product;
  onSave(productId: string, stockQuantity: number): Promise<void>;
  onMessage(message: string): void;
}) {
  const [value, setValue] = useState(product.stockQuantity);
  const status = stockStatus({ ...product, stockQuantity: value });

  return (
    <div className="rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black">{product.name}</p>
          <p className="text-sm font-semibold text-[var(--muted)]">
            {productCategoryLabel(product.category)}
          </p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      <div className="mt-3 grid grid-cols-[3.2rem_1fr_3.2rem] items-end gap-2">
        <GhostButton
          type="button"
          onClick={() => setValue((current) => Math.max(0, current - 1))}
          aria-label="Retirer une unité"
        >
          <Minus size={18} aria-hidden="true" />
        </GhostButton>
        <label className="app-label text-center">
          Quantité restante
          <input
            className="app-field text-center text-xl font-black"
            inputMode="numeric"
            value={value}
            onChange={(event) => setValue(Math.max(0, Number(event.target.value || 0)))}
          />
        </label>
        <GhostButton
          type="button"
          onClick={() => setValue((current) => current + 1)}
          aria-label="Ajouter une unité"
        >
          <Plus size={18} aria-hidden="true" />
        </GhostButton>
      </div>
      <PrimaryButton
        type="button"
        onClick={() =>
          onSave(product.id, value)
            .then(() => onMessage("Stock mis à jour dans Supabase."))
            .catch((reason) =>
              onMessage(
                reason instanceof Error ? reason.message : "Mise à jour Supabase impossible.",
              ),
            )
        }
        className="mt-3 py-3"
      >
        Ajuster le stock
      </PrimaryButton>
    </div>
  );
}
