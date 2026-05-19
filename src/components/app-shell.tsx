"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Home,
  PackagePlus,
  PlusCircle,
  ReceiptText,
  Send,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { useFatouStore } from "@/lib/fatou-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/vente", label: "Vente", icon: PlusCircle },
  { href: "/produits", label: "Produits", icon: PackagePlus },
  { href: "/transferts", label: "Transferts", icon: Send },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/rapports", label: "Résumé", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { storageMode, loading, error, refreshData } = useFatouStore();
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(new Date()),
    [],
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#fff9f3]/92 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-[var(--brand)] text-lg font-black text-white shadow-[var(--shadow)]">
              FC
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-normal">Fatou Caisse</p>
              <p className="truncate text-sm font-semibold capitalize text-[var(--muted)]">{today}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => refreshData().catch(() => undefined)}
            className={cn(
              "flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black shadow-sm",
              storageMode === "supabase" && "text-[var(--leaf)]",
              storageMode === "not_configured" && "text-[#9a5b00]",
              storageMode === "error" && "text-[var(--brand)]",
            )}
            aria-label="Rafraîchir la connexion Supabase"
          >
            <WalletCards size={16} aria-hidden="true" />
            {loading
              ? "Connexion..."
              : storageMode === "supabase"
                ? "Supabase connecté"
                : storageMode === "not_configured"
                  ? "Supabase absent"
                  : "Erreur Supabase"}
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        {error ? (
          <div className="mb-4 rounded-[1rem] border border-[var(--brand)] bg-[var(--rose)] p-3 text-sm font-black leading-6 text-[var(--brand-strong)]">
            {error}
          </div>
        ) : null}
        {children}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-[var(--line)] bg-white/95 px-2 pt-2 shadow-[0_-12px_40px_rgba(47,31,20,0.12)] backdrop-blur">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "grid min-h-[3.35rem] place-items-center rounded-[0.9rem] px-1 py-1 text-center text-[0.68rem] font-black text-[var(--muted)] transition",
                  active && "bg-[var(--rose)] text-[var(--brand-strong)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={2.5} aria-hidden="true" />
                <span className="mt-0.5 leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function SecondaryLinks() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/depenses"
        className="tap-target flex items-center justify-center gap-2 rounded-[1rem] border border-[var(--line)] bg-white px-4 text-base font-black text-[var(--foreground)] shadow-sm"
      >
        <ReceiptText size={20} aria-hidden="true" />
        Dépenses
      </Link>
      <Link
        href="/stock"
        className="tap-target flex items-center justify-center gap-2 rounded-[1rem] border border-[var(--line)] bg-white px-4 text-base font-black text-[var(--foreground)] shadow-sm"
      >
        <Boxes size={20} aria-hidden="true" />
        Voir stock
      </Link>
    </div>
  );
}
