import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { useEffect } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ember-500 text-paper-50 hover:bg-ember-600 active:scale-[0.98] shadow-sm shadow-ember-700/20",
  secondary:
    "bg-paper-100 text-bark-800 border border-sand-300 hover:border-bark-400 hover:bg-paper-200 active:scale-[0.98]",
  ghost: "bg-transparent text-bark-700 hover:bg-sand-200 active:scale-[0.98]",
  danger: "bg-wine-500 text-paper-50 hover:bg-wine-500/90 active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border border-sand-300 bg-paper-100 shadow-[0_1px_2px_rgba(62,47,35,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <h2 className="text-lg font-bold tracking-tight text-bark-900">{children}</h2>
      {action}
    </div>
  );
}

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "accent" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-sand-200 text-bark-700",
  success: "bg-moss-500/15 text-moss-600",
  warning: "bg-ember-100 text-ember-700",
  danger: "bg-wine-500/12 text-wine-500",
  accent: "bg-ember-500/12 text-ember-600",
  info: "bg-bark-900/8 text-bark-800",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-sm font-semibold text-bark-800 mb-1.5">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-bark-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-wine-500">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-sand-300 bg-paper-50 px-3.5 py-2.5 text-sm text-bark-900 placeholder:text-bark-400 outline-none transition-colors focus:border-ember-500 focus:ring-2 focus:ring-ember-500/20";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-ember-500" : "bg-sand-400"
      }`}
    >
      <span
        className={`inline-block translate-x-1 rounded-full bg-paper-50 shadow transition-transform ${
          checked ? "translate-x-[22px]" : ""
        }`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-bark-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-sand-300 bg-paper-100 shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-sand-200 bg-paper-100 px-5 py-4">
          <h3 className="text-base font-bold tracking-tight text-bark-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-bark-500 hover:bg-sand-200 hover:text-bark-800 cursor-pointer transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/** Avatar com iniciais */
export function Avatar({
  name,
  color,
  size = 40,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-paper-50 select-none"
      style={{ background: color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-sand-400 bg-paper-100/60 px-6 py-14 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sand-200 text-bark-500">
        {icon}
      </span>
      <p className="font-bold text-bark-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-bark-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
