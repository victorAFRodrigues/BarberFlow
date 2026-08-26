import { Camera } from "@phosphor-icons/react";

/**
 * Slot rotulado para foto real.
 * Troque o conteúdo interno por <img src={...}> quando as fotos da barbearia
 * existirem — o rótulo indica enquadramento e proporção ideais de cada posição.
 */
export default function PhotoSlot({
  label,
  spec,
  className = "",
  dark = false,
}: {
  label: string;
  /** proporção sugerida, ex.: "1200×800" */
  spec: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      aria-label={`Espaço para foto: ${label}`}
      className={`relative flex items-center justify-center overflow-hidden ${className} ${
        dark
          ? "bg-[radial-gradient(120%_120%_at_20%_0%,#26221d_0%,#12100d_70%)]"
          : "bg-[radial-gradient(120%_120%_at_20%_0%,#4a3728_0%,#1a1713_75%)]"
      }`}
    >
      {/* trama pontilhada */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--color-ember-500) 30%, transparent) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(80% 80% at 50% 45%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(80% 80% at 50% 45%, black 30%, transparent 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-5 -right-3 select-none text-[110px] font-extrabold leading-none text-paper-50/6"
      >
        NdO
      </span>
      <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-50/15 bg-ink-900/60 text-bark-300">
          <Camera size={20} weight="duotone" />
        </span>
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-bark-300">
          Foto · {label}
        </p>
        <p className="font-mono text-[10px] tracking-wider text-bark-500 tnum">{spec}</p>
      </div>
    </div>
  );
}
