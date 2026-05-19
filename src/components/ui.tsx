import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      {eyebrow ? (
        <p className="mb-1 text-xs font-black uppercase tracking-[0.12em] text-[var(--brand)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-black tracking-normal text-[var(--foreground)]">{title}</h1>
      {description ? (
        <p className="mt-1 text-sm font-semibold leading-6 text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  tone = "brand",
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "brand" | "leaf" | "gold" | "sky" | "plain";
  icon?: LucideIcon;
}) {
  const tones = {
    brand: "bg-[var(--rose)] text-[var(--brand-strong)]",
    leaf: "bg-[var(--mint)] text-[var(--leaf)]",
    gold: "bg-[#fff1d7] text-[#9a5b00]",
    sky: "bg-[var(--blue-soft)] text-[var(--sky)]",
    plain: "bg-[#f6f3ef] text-[var(--foreground)]",
  };

  return (
    <div className="rounded-[1.1rem] border border-[var(--line)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black leading-5 text-[var(--muted)]">{label}</p>
        {Icon ? (
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", tones[tone])}>
            <Icon size={19} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-black tracking-normal text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function ActionLink({
  href,
  label,
  icon: Icon,
  tone = "brand",
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone?: "brand" | "leaf" | "gold" | "sky";
}) {
  const tones = {
    brand: "bg-[var(--brand)] text-white",
    leaf: "bg-[var(--leaf)] text-white",
    gold: "bg-[var(--gold)] text-[#2c2117]",
    sky: "bg-[var(--sky)] text-white",
  };

  return (
    <Link
      href={href}
      className={cn(
        "tap-target flex items-center justify-center gap-3 rounded-[1.1rem] px-4 py-4 text-center text-base font-black shadow-[var(--shadow)] transition active:scale-[0.98]",
        tones[tone],
      )}
    >
      <Icon size={23} strokeWidth={2.5} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "tap-target w-full rounded-[1.1rem] bg-[var(--brand)] px-5 py-4 text-base font-black text-white shadow-[var(--shadow)] transition active:scale-[0.98] disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "tap-target rounded-[1rem] border border-[var(--line)] bg-white px-4 py-3 text-sm font-black text-[var(--foreground)] shadow-sm transition active:scale-[0.98] disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "ok" | "warning" | "danger" | "plain" | "blue";
}) {
  const tones = {
    ok: "bg-[var(--mint)] text-[var(--leaf)]",
    warning: "bg-[#fff1d7] text-[#9a5b00]",
    danger: "bg-[var(--rose)] text-[var(--brand-strong)]",
    plain: "bg-[#f4f0ec] text-[var(--muted)]",
    blue: "bg-[var(--blue-soft)] text-[var(--sky)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-black",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[1rem] border border-dashed border-[var(--line)] bg-[#fffaf5] px-4 py-6 text-center text-sm font-bold text-[var(--muted)]">
      {text}
    </div>
  );
}
