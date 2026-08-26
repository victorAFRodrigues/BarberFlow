import { Scissors } from "@phosphor-icons/react";
import { useStore } from "../store/store";

/**
 * Marca da barbearia: usa a logo enviada nas Configurações ou
 * cai no ícone padrão. Segue a cor do tema via variáveis CSS.
 */
export default function ShopLogo({
  size = 34,
  variant = "accent",
}: {
  size?: number;
  /** accent = caixa na cor do tema · dark = caixa escura com ícone na cor do tema */
  variant?: "accent" | "dark";
}) {
  const { state } = useStore();
  const { logo } = state.settings;

  if (logo) {
    return (
      <img
        src={logo}
        alt="Logo"
        className="shrink-0 rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        background: variant === "accent" ? "var(--color-ember-500)" : "#3e2f23",
        color: variant === "accent" ? "#fdfaf3" : "var(--color-ember-500)",
      }}
    >
      <Scissors size={size * 0.55} weight="duotone" />
    </span>
  );
}
