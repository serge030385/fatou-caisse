"use client";

import { Pencil, Search, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { EmptyState, GhostButton, PageHeader, Panel, PrimaryButton, StatusBadge } from "@/components/ui";
import { moneyFcfa, moneyTl, niceDate } from "@/lib/format";
import {
  transferNetworkLabel,
  transferNetworks,
  transferStatusLabel,
  transferStatuses,
} from "@/lib/labels";
import { useFatouStore } from "@/lib/fatou-store";
import type { MoneyTransfer, TransferNetwork, TransferStatus } from "@/lib/types";

const emptyTransferForm = {
  customerName: "",
  phone: "",
  network: "orange_money" as TransferNetwork,
  amountFcfa: "",
  amountTl: "",
  commission: "",
  status: "paye" as TransferStatus,
  note: "",
};

export function TransfersPage() {
  const {
    data,
    addMoneyTransfer,
    updateMoneyTransfer,
    deleteMoneyTransfer,
    updateTransferStatus,
  } = useFatouStore();
  const [form, setForm] = useState(emptyTransferForm);
  const [editing, setEditing] = useState<MoneyTransfer | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.moneyTransfers.filter((transfer) => {
      if (!query) {
        return true;
      }
      return (transfer.customerName + " " + (transfer.phone ?? "")).toLowerCase().includes(query);
    });
  }, [data.moneyTransfers, search]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      customerName: form.customerName.trim(),
      phone: form.phone.trim() || null,
      network: form.network,
      amountFcfa: Number(form.amountFcfa),
      amountTl: Number(form.amountTl),
      commission: Number(form.commission || 0),
      status: form.status,
      note: form.note.trim() || null,
    };

    if (!input.customerName || input.amountFcfa <= 0 || input.amountTl <= 0) {
      setMessage("Ajoute le client et les montants.");
      return;
    }

    try {
      if (editing) {
        await updateMoneyTransfer(editing.id, input);
        setMessage("Transfert modifié avec succès");
      } else {
        await addMoneyTransfer(input);
        setMessage("Transfert ajouté dans Supabase.");
      }
      resetForm();
    } catch {
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  function resetForm() {
    setForm(emptyTransferForm);
    setEditing(null);
  }

  function startEdit(transfer: MoneyTransfer) {
    setEditing(transfer);
    setForm({
      customerName: transfer.customerName,
      phone: transfer.phone ?? "",
      network: transfer.network,
      amountFcfa: String(transfer.amountFcfa),
      amountTl: String(transfer.amountTl),
      commission: String(transfer.commission),
      status: transfer.status,
      note: transfer.note ?? "",
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeTransfer(transfer: MoneyTransfer) {
    if (window.confirm("Voulez-vous vraiment supprimer ce transfert ?")) {
      try {
        await deleteMoneyTransfer(transfer.id);
        if (editing?.id === transfer.id) {
          resetForm();
        }
        setMessage("Transfert supprimé");
      } catch {
        setMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Cameroun"
        title="Transfert d'argent"
        description="Enregistre les transferts Orange Money et MTN Mobile Money."
      />

      <Panel>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">
              {editing ? "Modifier transfert" : "Nouveau transfert"}
            </h2>
            {editing ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full bg-[#f6f3ef] px-3 py-2 text-xs font-black text-[var(--muted)]"
              >
                Annuler
              </button>
            ) : null}
          </div>
          <label className="app-label">
            Nom du client
            <input
              className="app-field"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              placeholder="Ex: Grace M."
            />
          </label>
          <label className="app-label">
            Téléphone
            <input
              className="app-field"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="Optionnel"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="app-label">
              Réseau
              <select
                className="app-field"
                value={form.network}
                onChange={(event) =>
                  setForm({ ...form, network: event.target.value as TransferNetwork })
                }
              >
                {transferNetworks.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="app-label">
              Statut
              <select
                className="app-field"
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as TransferStatus })
                }
              >
                {transferStatuses.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="app-label">
              Envoyé FCFA
              <input
                className="app-field"
                inputMode="numeric"
                value={form.amountFcfa}
                onChange={(event) => setForm({ ...form, amountFcfa: event.target.value })}
                placeholder="0"
              />
            </label>
            <label className="app-label">
              Reçu TL
              <input
                className="app-field"
                inputMode="decimal"
                value={form.amountTl}
                onChange={(event) => setForm({ ...form, amountTl: event.target.value })}
                placeholder="0"
              />
            </label>
          </div>
          <label className="app-label">
            Commission
            <input
              className="app-field"
              inputMode="decimal"
              value={form.commission}
              onChange={(event) => setForm({ ...form, commission: event.target.value })}
              placeholder="0"
            />
          </label>
          <label className="app-label">
            Note
            <textarea
              className="app-field min-h-24 resize-none"
              value={form.note}
              onChange={(event) => setForm({ ...form, note: event.target.value })}
              placeholder="Optionnel"
            />
          </label>
          <PrimaryButton type="submit">
            {editing ? "Enregistrer les modifications" : "Enregistrer transfert"}
          </PrimaryButton>
          {message ? <p className="text-center text-sm font-black text-[var(--leaf)]">{message}</p> : null}
        </form>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black">Historique</h2>
          <StatusBadge tone="blue">{filteredTransfers.length}</StatusBadge>
        </div>
        <label className="app-label mb-3">
          Recherche client
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
            <input
              className="app-field pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom ou téléphone"
            />
          </div>
        </label>
        <div className="space-y-3">
          {filteredTransfers.length ? (
            filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="rounded-[1rem] border border-[var(--line)] bg-[#fffaf5] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-black">{transfer.customerName}</p>
                    <p className="text-sm font-semibold text-[var(--muted)]">
                      {transferNetworkLabel(transfer.network)} · {niceDate(transfer.transferDate)}
                    </p>
                  </div>
                  <StatusBadge tone={transfer.status === "termine" ? "ok" : transfer.status === "en_attente" ? "warning" : "blue"}>
                    {transferStatusLabel(transfer.status)}
                  </StatusBadge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-[0.8rem] bg-white p-2">
                    <p className="font-bold text-[var(--muted)]">FCFA</p>
                    <p className="font-black">{moneyFcfa(transfer.amountFcfa)}</p>
                  </div>
                  <div className="rounded-[0.8rem] bg-white p-2">
                    <p className="font-bold text-[var(--muted)]">TL</p>
                    <p className="font-black">{moneyTl(transfer.amountTl)}</p>
                  </div>
                  <div className="rounded-[0.8rem] bg-white p-2">
                    <p className="font-bold text-[var(--muted)]">Commission</p>
                    <p className="font-black">{moneyTl(transfer.commission)}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {transferStatuses.map((item) => (
                    <GhostButton
                      key={item.value}
                      type="button"
                      onClick={() =>
                        updateTransferStatus(transfer.id, item.value).catch(() =>
                          setMessage("Une erreur est survenue. Veuillez réessayer."),
                        )
                      }
                      className={item.value === transfer.status ? "bg-[var(--mint)] text-[var(--leaf)]" : ""}
                    >
                      {item.label}
                    </GhostButton>
                  ))}
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <GhostButton type="button" onClick={() => startEdit(transfer)} aria-label="Modifier">
                    <Pencil size={18} aria-hidden="true" />
                  </GhostButton>
                  <GhostButton
                    type="button"
                    onClick={() => removeTransfer(transfer)}
                    aria-label="Supprimer"
                    className="text-[var(--brand)]"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </GhostButton>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="Aucun transfert trouvé." />
          )}
        </div>
      </Panel>
    </div>
  );
}
