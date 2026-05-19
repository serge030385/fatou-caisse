"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { EmptyState, GhostButton, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui";
import { stockStatus } from "@/lib/calculations";
import { moneyTl } from "@/lib/format";
import { productCategories, productCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import type { Product, ProductCategory } from "@/lib/types";

const emptyForm = {
  name: "",
  category: "produit_africain" as ProductCategory,
  salePrice: "",
  purchasePrice: "",
  stockQuantity: "",
  lowStockThreshold: "3",
  photoUrl: "",
};

export function ProductsPage() {
  const { data, addProduct, updateProduct, deleteProduct } = useFatouStore();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Product | null>(null);
  const [message, setMessage] = useState("");
  const sortedProducts = useMemo(
    () => [...data.products].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [data.products],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      name: form.name.trim(),
      category: form.category,
      salePrice: Number(form.salePrice),
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
      stockQuantity: Number(form.stockQuantity),
      lowStockThreshold: Number(form.lowStockThreshold),
      photoUrl: form.photoUrl.trim() || null,
    };
    if (!input.name || input.salePrice < 0 || input.stockQuantity < 0) {
      setMessage("Vérifie le nom, le prix et la quantité.");
      return;
    }

    try {
      if (editing) {
        await updateProduct(editing.id, input);
        setMessage("Produit modifié dans Supabase.");
      } else {
        await addProduct(input);
        setMessage("Produit ajouté dans Supabase.");
      }
      setEditing(null);
      setForm(emptyForm);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Requête Supabase impossible.");
    }
  }

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      salePrice: String(product.salePrice),
      purchasePrice: product.purchasePrice === null ? "" : String(product.purchasePrice),
      stockQuantity: String(product.stockQuantity),
      lowStockThreshold: String(product.lowStockThreshold),
      photoUrl: product.photoUrl ?? "",
    });
    setMessage("");
  }

  async function removeProduct(product: Product) {
    if (window.confirm(`Supprimer ${product.name} ?`)) {
      try {
        await deleteProduct(product.id);
        setMessage("Produit supprimé dans Supabase.");
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : "Suppression Supabase impossible.");
      }
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Produits"
        title="Catalogue"
        description="Ajoute, modifie ou supprime les produits vendus par Fatou."
      />

      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">{editing ? "Modifier produit" : "Ajouter produit"}</h2>
            {editing ? (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="rounded-full bg-[#f6f3ef] px-3 py-2 text-xs font-black text-[var(--muted)]"
              >
                Annuler
              </button>
            ) : null}
          </div>

          <label className="app-label">
            Nom
            <input
              className="app-field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex: Jus de gingembre"
            />
          </label>

          <label className="app-label">
            Catégorie
            <select
              className="app-field"
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value as ProductCategory })
              }
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
              Prix vente
              <input
                className="app-field"
                inputMode="decimal"
                value={form.salePrice}
                onChange={(event) => setForm({ ...form, salePrice: event.target.value })}
                placeholder="0"
              />
            </label>
            <label className="app-label">
              Prix achat
              <input
                className="app-field"
                inputMode="decimal"
                value={form.purchasePrice}
                onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })}
                placeholder="Optionnel"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="app-label">
              Stock
              <input
                className="app-field"
                inputMode="numeric"
                value={form.stockQuantity}
                onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                placeholder="0"
              />
            </label>
            <label className="app-label">
              Seuil faible
              <input
                className="app-field"
                inputMode="numeric"
                value={form.lowStockThreshold}
                onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })}
                placeholder="3"
              />
            </label>
          </div>

          <label className="app-label">
            Photo
            <input
              className="app-field"
              value={form.photoUrl}
              onChange={(event) => setForm({ ...form, photoUrl: event.target.value })}
              placeholder="Lien image optionnel"
            />
          </label>

          <PrimaryButton type="submit">
            <span className="inline-flex items-center justify-center gap-2">
              <Plus size={20} aria-hidden="true" />
              {editing ? "Enregistrer" : "Ajouter"}
            </span>
          </PrimaryButton>
          {message ? <p className="text-center text-sm font-black text-[var(--leaf)]">{message}</p> : null}
        </form>
      </Panel>

      <Panel>
        <h2 className="mb-3 text-lg font-black">Produits enregistrés</h2>
        <div className="space-y-3">
          {sortedProducts.length ? (
            sortedProducts.map((product) => {
              const status = stockStatus(product);
              return (
                <div
                  key={product.id}
                  className="rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">{product.name}</p>
                      <p className="text-sm font-semibold text-[var(--muted)]">
                        {productCategoryLabel(product.category)} · {moneyTl(product.salePrice)}
                      </p>
                    </div>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-black">Stock: {product.stockQuantity}</p>
                    <div className="flex gap-2">
                      <GhostButton type="button" onClick={() => startEdit(product)} aria-label="Modifier">
                        <Pencil size={18} aria-hidden="true" />
                      </GhostButton>
                      <GhostButton
                        type="button"
                        onClick={() => removeProduct(product)}
                        aria-label="Supprimer"
                        className="text-[var(--brand)]"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </GhostButton>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState text="Aucun produit pour le moment." />
          )}
        </div>
      </Panel>
    </div>
  );
}
