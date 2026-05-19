"use client";

import { FormEvent, useState } from "react";
import { EmptyState, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui";
import { dateKey, moneyTl, niceDate } from "@/lib/format";
import { expenseCategories, expenseCategoryLabel } from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import type { ExpenseCategory } from "@/lib/types";

export function ExpensesPage() {
  const { data, addExpense } = useFatouStore();
  const [category, setCategory] = useState<ExpenseCategory>("achat_marchandise");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState(dateKey());
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Number(amount) <= 0) {
      setMessage("Ajoute un montant.");
      return;
    }
    try {
      await addExpense({
        category,
        amount: Number(amount),
        note: note.trim() || null,
        expenseDate,
      });
      setAmount("");
      setNote("");
      setExpenseDate(dateKey());
      setMessage("Dépense ajoutée dans Supabase.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Requête Supabase impossible.");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Dépenses"
        title="Sorties d'argent"
        description="Note rapidement les achats, transports, loyers et recharges."
      />

      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <h2 className="text-lg font-black">Ajouter dépense</h2>
          <label className="app-label">
            Catégorie
            <select
              className="app-field"
              value={category}
              onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
            >
              {expenseCategories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="app-label">
            Montant
            <input
              className="app-field"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </label>
          <label className="app-label">
            Date
            <input
              className="app-field"
              type="date"
              value={expenseDate}
              onChange={(event) => setExpenseDate(event.target.value)}
            />
          </label>
          <label className="app-label">
            Note
            <textarea
              className="app-field min-h-24 resize-none"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optionnel"
            />
          </label>
          <PrimaryButton type="submit">Ajouter dépense</PrimaryButton>
          {message ? <p className="text-center text-sm font-black text-[var(--leaf)]">{message}</p> : null}
        </form>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Historique</h2>
          <StatusBadge tone="blue">{data.expenses.length}</StatusBadge>
        </div>
        <div className="space-y-3">
          {data.expenses.length ? (
            data.expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-black">{expenseCategoryLabel(expense.category)}</p>
                  <p className="text-sm font-semibold text-[var(--muted)]">
                    {niceDate(expense.expenseDate)}
                    {expense.note ? ` · ${expense.note}` : ""}
                  </p>
                </div>
                <p className="shrink-0 font-black">{moneyTl(expense.amount)}</p>
              </div>
            ))
          ) : (
            <EmptyState text="Aucune dépense enregistrée." />
          )}
        </div>
      </Panel>
    </div>
  );
}
