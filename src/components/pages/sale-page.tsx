"use client";

import { CheckCircle2, Minus, Plus } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { EmptyState, GhostButton, PageHeader, Panel, PrimaryButton } from "@/components/ui";
import { moneyTl } from "@/lib/format";
import { productCategories, productCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import type { ProductCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SalePage() {
  const { data, recordProductSale, recordFreeSale } = useFatouStore();
  const [mode, setMode] = useState<"product" | "free">("product");
  const [productId, setProductId] = useState(data.products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [freeName, setFreeName] = useState("");
  const [freeCategory, setFreeCategory] = useState<ProductCategory>("plat");
  const [freeAmount, setFreeAmount] = useState("");
  const [freeQuantity, setFreeQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const selectedProduct = useMemo(
    () => data.products.find((product) => product.id === productId) ?? data.products[0],
    [data.products, productId],
  );
  const productTotal = selectedProduct ? selectedProduct.salePrice * quantity : 0;
  const freeTotal = Number(freeAmount || 0) * freeQuantity;

  async function submitProductSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (!selectedProduct) {
        setMessage("Ajoute d'abord un produit.");
        return;
      }
      await recordProductSale({ productId: selectedProduct.id, quantity });
      setQuantity(1);
      setMessage("Vente enregistrée et stock mis à jour.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Vente impossible.");
    }
  }

  async function submitFreeSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await recordFreeSale({
        itemName: freeName.trim(),
        category: freeCategory,
        amount: Number(freeAmount),
        quantity: freeQuantity,
      });
      setFreeName("");
      setFreeAmount("");
      setFreeQuantity(1);
      setMessage("Vente libre enregistrée.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Vente impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Caisse"
        title="Nouvelle vente"
        description="Choisis un produit existant ou saisis une vente libre."
      />

      <div className="grid grid-cols-2 gap-2 rounded-[1.1rem] bg-white p-1 shadow-sm">
        {[
          ["product", "Produit existant"],
          ["free", "Vente libre"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value as "product" | "free");
              setMessage("");
            }}
            className={cn(
              "tap-target rounded-[0.9rem] px-3 text-sm font-black transition",
              mode === value
                ? "bg-[var(--brand)] text-white"
                : "bg-transparent text-[var(--muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "product" ? (
        <Panel>
          <form className="space-y-4" onSubmit={submitProductSale}>
            {data.products.length ? (
              <>
                <label className="app-label">
                  Produit
                  <select
                    className="app-field"
                    value={selectedProduct?.id ?? ""}
                    onChange={(event) => setProductId(event.target.value)}
                  >
                    {data.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {moneyTl(product.salePrice)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-[1rem] bg-[#fffaf5] p-4">
                  <p className="text-sm font-black text-[var(--muted)]">
                    {selectedProduct ? productCategoryLabel(selectedProduct.category) : ""}
                  </p>
                  <p className="mt-1 text-lg font-black">
                    Stock disponible: {selectedProduct?.stockQuantity ?? 0}
                  </p>
                </div>

                <div className="grid grid-cols-[3.35rem_1fr_3.35rem] items-center gap-3">
                  <GhostButton
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus size={20} aria-hidden="true" />
                  </GhostButton>
                  <label className="app-label text-center">
                    Quantité
                    <input
                      className="app-field text-center text-xl font-black"
                      inputMode="numeric"
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Number(event.target.value || 1)))}
                    />
                  </label>
                  <GhostButton
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    aria-label="Augmenter la quantité"
                  >
                    <Plus size={20} aria-hidden="true" />
                  </GhostButton>
                </div>

                <div className="rounded-[1.1rem] bg-[var(--mint)] p-4 text-center">
                  <p className="text-sm font-black text-[var(--leaf)]">Total à encaisser</p>
                  <p className="mt-1 text-3xl font-black">{moneyTl(productTotal)}</p>
                </div>

                <PrimaryButton type="submit" disabled={!selectedProduct || selectedProduct.stockQuantity <= 0}>
                  Valider la vente
                </PrimaryButton>
              </>
            ) : (
              <EmptyState text="Ajoute un produit avant une vente depuis le stock." />
            )}
          </form>
        </Panel>
      ) : (
        <Panel>
          <form className="space-y-4" onSubmit={submitFreeSale}>
            <label className="app-label">
              Nom article
              <input
                className="app-field"
                value={freeName}
                onChange={(event) => setFreeName(event.target.value)}
                placeholder="Ex: Assiette spéciale"
              />
            </label>
            <label className="app-label">
              Catégorie
              <select
                className="app-field"
                value={freeCategory}
                onChange={(event) => setFreeCategory(event.target.value as ProductCategory)}
              >
                {productCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="app-label">
                Montant unitaire
                <input
                  className="app-field"
                  inputMode="decimal"
                  value={freeAmount}
                  onChange={(event) => setFreeAmount(event.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="app-label">
                Quantité
                <input
                  className="app-field"
                  inputMode="numeric"
                  value={freeQuantity}
                  onChange={(event) => setFreeQuantity(Math.max(1, Number(event.target.value || 1)))}
                />
              </label>
            </div>
            <div className="rounded-[1.1rem] bg-[var(--mint)] p-4 text-center">
              <p className="text-sm font-black text-[var(--leaf)]">Total</p>
              <p className="mt-1 text-3xl font-black">{moneyTl(freeTotal)}</p>
            </div>
            <PrimaryButton type="submit">Valider la vente libre</PrimaryButton>
          </form>
        </Panel>
      )}

      {message ? (
        <Panel className="flex items-center gap-3 bg-[#fffaf5] text-sm font-black text-[var(--leaf)]">
          <CheckCircle2 size={20} aria-hidden="true" />
          {message}
        </Panel>
      ) : null}
    </div>
  );
}
