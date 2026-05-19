"use client";

import { Search } from "lucide-react";
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
import type { TransferNetwork, TransferStatus } from "@/lib/types";

export function TransfersPage() {
  const { data, addMoneyTransfer, updateTransferStatus } = useFatouStore();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<TransferNetwork>("orange_money");
  const [amountFcfa, setAmountFcfa] = useState("");
  const [amountTl, setAmountTl] = useState("");
  const [commission, setCommission] = useState("");
  const [status, setStatus] = useState<TransferStatus>("paye");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const filteredTransfers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.moneyTransfers.filter((transfer) => {
      if (!query) {
        return true;
      }
      return `${transfer.customerName} ${transfer.phone ?? ""}`.toLowerCase().includes(query);
    });
  }, [data.moneyTransfers, search]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerName.trim() || Number(amountFcfa) <= 0 || Number(amountTl) <= 0) {
      setMessage("Ajoute le client et les montants.");
      return;
    }
    try {
      await addMoneyTransfer({
        customerName: customerName.trim(),
        phone: phone.trim() || null,
        network,
        amountFcfa: Number(amountFcfa),
        amountTl: Number(amountTl),
        commission: Number(commission || 0),
        status,
        note: note.trim() || null,
      });
      setCustomerName("");
      setPhone("");
      setAmountFcfa("");
      setAmountTl("");
      setCommission("");
      setNote("");
      setStatus("paye");
      setMessage("Transfert ajouté dans Supabase.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Requête Supabase impossible.");
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
          <h2 className="text-lg font-black">Nouveau transfert</h2>
          <label className="app-label">
            Nom du client
            <input
              className="app-field"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Ex: Grace M."
            />
          </label>
          <label className="app-label">
            Téléphone
            <input
              className="app-field"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Optionnel"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="app-label">
              Réseau
              <select
                className="app-field"
                value={network}
                onChange={(event) => setNetwork(event.target.value as TransferNetwork)}
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
                value={status}
                onChange={(event) => setStatus(event.target.value as TransferStatus)}
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
                value={amountFcfa}
                onChange={(event) => setAmountFcfa(event.target.value)}
                placeholder="0"
              />
            </label>
            <label className="app-label">
              Reçu TL
              <input
                className="app-field"
                inputMode="decimal"
                value={amountTl}
                onChange={(event) => setAmountTl(event.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <label className="app-label">
            Commission
            <input
              className="app-field"
              inputMode="decimal"
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
              placeholder="0"
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
          <PrimaryButton type="submit">Enregistrer transfert</PrimaryButton>
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
                        updateTransferStatus(transfer.id, item.value).catch((reason) =>
                          setMessage(
                            reason instanceof Error
                              ? reason.message
                              : "Mise à jour Supabase impossible.",
                          ),
                        )
                      }
                      className={item.value === transfer.status ? "bg-[var(--mint)] text-[var(--leaf)]" : ""}
                    >
                      {item.label}
                    </GhostButton>
                  ))}
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
