import { Link, NavLink, Outlet } from "react-router-dom";
import {
  AppleLogo,
  CalendarBlank,
  DeviceMobile,
  GooglePlayLogo,
  InstagramLogo,
  MapPin,
  Phone,
  WhatsappLogo,
} from "@phosphor-icons/react";
import ShopLogo from "../components/ShopLogo";
import { useStore } from "../store/store";

function BrandMark({ size = 34 }: { size?: number }) {
  return <ShopLogo size={size} variant="dark" />;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <BrandMark />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-tight text-bark-900">
            {state.settings.shopName}
          </span>
          <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-bark-500">
            Barbearia · desde 1998
          </span>
        </span>
      )}
    </Link>
  );
}

export default function PublicLayout() {
  const { state } = useStore();
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-sand-300/70 bg-paper-100/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Brand />
          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold text-bark-600">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? "bg-sand-200 text-bark-900" : "hover:text-bark-900"}`
              }
            >
              Início
            </NavLink>
            <NavLink
              to="/agenda"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition-colors ${isActive ? "bg-sand-200 text-bark-900" : "hover:text-bark-900"}`
              }
            >
              Agenda
            </NavLink>
            <a href="/#servicos" className="rounded-lg px-3 py-2 hover:text-bark-900 transition-colors">
              Serviços
            </a>
            <a href="/#equipe" className="rounded-lg px-3 py-2 hover:text-bark-900 transition-colors">
              Equipe
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="Baixar o aplicativo (em breve)"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-paper-100 px-3 py-2.5 text-sm font-semibold text-bark-800 transition-colors hover:border-ember-400 hover:text-ember-700"
            >
              <AppleLogo size={15} weight="fill" className="hidden sm:block" />
              <GooglePlayLogo size={15} weight="fill" className="hidden sm:block" />
              <DeviceMobile size={16} weight="duotone" className="sm:hidden" />
              <span className="hidden md:inline">Baixar app</span>
            </a>
            <Link
              to="/agenda"
              className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-4 py-2.5 text-sm font-semibold text-paper-50 shadow-sm shadow-ember-700/25 transition-all hover:bg-ember-600 active:scale-[0.98]"
            >
              <CalendarBlank size={16} weight="bold" />
              Agendar horário
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-auto bg-ink-950 text-paper-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <ShopLogo size={34} variant="accent" />
              <span className="leading-none">
                <span className="block text-[15px] font-extrabold tracking-tight">
                  {state.settings.shopName}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-bark-400">
                  Barbearia · desde 1998
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bark-300">
              Tradição em corte e barba desde 1998. Agende online e garanta seu horário sem fila de espera.
            </p>
          </div>
          <div className="text-sm text-bark-300">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-bark-400">Funcionamento</p>
            <p className="tnum">Seg a Sex · 9h às 21h</p>
            <p className="tnum">Sábado · 9h às 18h</p>
            <p className="mb-3 mt-5 font-mono text-xs uppercase tracking-[0.2em] text-bark-400">Contato</p>
            <p className="flex items-center gap-2">
              <Phone size={15} /> (11) 3555-0199
            </p>
            <p className="mt-1.5 flex items-center gap-2">
              <WhatsappLogo size={15} /> (11) 93555-0199
            </p>
          </div>
          <div className="text-sm text-bark-300">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-bark-400">Onde estamos</p>
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              Rua dos Barberos, 456 — Centro
            </p>
            <p className="mt-4 flex items-center gap-2">
              <InstagramLogo size={15} /> @navalhadeouro.barber
            </p>
            <p className="mb-3 mt-5 font-mono text-xs uppercase tracking-[0.2em] text-bark-400">
              Baixe o app do clube
            </p>
            <div className="flex gap-2">
              <a href="#" onClick={(e) => e.preventDefault()} aria-label="App Store (em breve)" className="inline-flex items-center gap-1.5 rounded-lg bg-paper-100/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-paper-100/20">
                <AppleLogo size={16} weight="fill" /> App Store
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} aria-label="Google Play (em breve)" className="inline-flex items-center gap-1.5 rounded-lg bg-paper-100/10 px-3 py-2 text-xs font-bold transition-colors hover:bg-paper-100/20">
                <GooglePlayLogo size={16} weight="fill" /> Google Play
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-paper-100/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-bark-400 sm:px-6">
            <span>© {new Date().getFullYear()} Navalha de Ouro · powered by</span>
            <span className="font-bold tracking-tight text-paper-100">BarberFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
