import { useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { AppleLogo, GooglePlayLogo, X } from "@phosphor-icons/react";
import ShopLogo from "./ShopLogo";

/**
 * Cápsula flutuante de download do app.
 * Aparece após o hero sair da tela; some quando fechada (durante a sessão).
 */
export default function AppDock() {
  const [dismissed, setDismissed] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setPastHero(v > 620));

  if (dismissed || !pastHero) return null;

  return (
    <motion.div
      role="complementary"
      aria-label="Baixar o aplicativo"
      initial={reduce ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className="fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-ember-500/35 bg-ink-950/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur sm:flex-nowrap">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Fechar aviso do aplicativo"
          className="absolute right-1.5 top-1.5 cursor-pointer rounded-md p-1 text-bark-400 transition-colors hover:text-paper-100"
        >
          <X size={13} weight="bold" />
        </button>

        <ShopLogo size={36} variant="accent" />

        <p className="mr-auto leading-tight">
          <span className="block text-sm font-bold text-paper-100">Baixe o app do clube</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-bark-300">
            grátis para assinantes · ios & android
          </span>
        </p>

        <div className="flex gap-2">
          {/* trocar "#" pelos links reais das lojas */}
          <a
            href="#"
            aria-label="Baixar na App Store (em breve)"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-3 py-2 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
          >
            <AppleLogo size={15} weight="fill" /> App Store
          </a>
          <a
            href="#"
            aria-label="Disponível no Google Play (em breve)"
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-3 py-2 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
          >
            <GooglePlayLogo size={15} weight="fill" /> Google Play
          </a>
        </div>
      </div>
    </motion.div>
  );
}
