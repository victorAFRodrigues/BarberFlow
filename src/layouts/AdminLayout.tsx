import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  ArrowSquareOut,
  CalendarCheck,
  ChartLineUp,
  Crown,
  Gear,
  List,
  MagnifyingGlass,
  Receipt,
  Scissors,
  SignOut,
  UserCircle,
  Users,
  X,
} from "@phosphor-icons/react";
import ShopLogo from "../components/ShopLogo";
import { useAuth, useStore } from "../store/store";
import { toDateKey } from "../lib/format";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: ChartLineUp, end: true },
  { to: "/admin/agendamentos", label: "Agendamentos", icon: CalendarCheck },
  { to: "/admin/equipe", label: "Equipe", icon: Users },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/assinantes", label: "Assinantes", icon: Crown },
  { to: "/admin/financeiro", label: "Financeiro", icon: Receipt },
];

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/agendamentos": "Agendamentos",
  "/admin/equipe": "Equipe",
  "/admin/servicos": "Serviços",
  "/admin/assinantes": "Assinantes · Clube",
  "/admin/financeiro": "Financeiro",
  "/admin/configuracoes": "Configurações",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { authed, logout } = useAuth();
  const { state, resetDemo } = useStore();
  const location = useLocation();

  if (!authed) {
    return <Navigate to="/admin/login" replace />;
  }

  const title = TITLES[location.pathname] ?? "Dashboard";
  const todayCount = state.appointments.filter(
    (a) => a.date === toDateKey(new Date()) && a.status === "confirmado",
  ).length;
  const overdueSubs = state.subscriptions.filter((s) => s.status === "pendente").length;

  const nav = (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-paper-50/10 px-5">
        <ShopLogo size={36} variant="accent" />
        <div className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-tight text-paper-100">BarberFlow</span>
          <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-bark-400">
            {state.settings.shopName}
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? false}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-ember-500 text-paper-50 shadow-sm shadow-black/20"
                  : "text-bark-300 hover:bg-paper-50/8 hover:text-paper-100"
              }`
            }
          >
            <Icon size={18} weight={location.pathname === to ? "fill" : "regular"} />
            {label}
            {to === "/admin/agendamentos" && todayCount > 0 && (
              <span
                className={`tnum ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  location.pathname === to ? "bg-bark-900/25 text-paper-50" : "bg-sand-300 text-bark-700"
                }`}
              >
                {todayCount}
              </span>
            )}
            {to === "/admin/assinantes" && overdueSubs > 0 && (
              <span
                className={`tnum ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  location.pathname === to
                    ? "bg-bark-900/25 text-paper-50"
                    : "bg-wine-500/90 text-paper-50"
                }`}
                title="Mensalidades pendentes"
              >
                {overdueSubs}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-paper-50/10 p-4">
        <a
          href="/agenda"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-bark-300 transition-colors hover:bg-paper-50/8 hover:text-paper-100"
        >
          <ArrowSquareOut size={17} />
          Ver agenda pública
        </a>
        <button
          onClick={() => {
            if (confirm("Restaurar todos os dados de demonstração? Suas alterações serão perdidas.")) {
              resetDemo();
              setMobileOpen(false);
            }
          }}
          className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-bark-400 transition-colors hover:bg-paper-50/8 hover:text-paper-100"
        >
          <UserCircle size={17} />
          Resetar dados demo
        </button>
      </div>
    </>
  );

  const settingsNav = (
    <NavLink
      to="/admin/configuracoes"
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
          isActive
            ? "bg-ember-500 text-paper-50 shadow-sm shadow-black/20"
            : "text-bark-300 hover:bg-paper-50/8 hover:text-paper-100"
        }`
      }
    >
      <Gear size={18} />
      Configurações
    </NavLink>
  );

  return (
    <div className="min-h-[100dvh] bg-sand-100 lg:flex">
      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col bg-bark-900 lg:flex">
        {nav}
        <div className="border-t border-paper-50/10 p-3">{settingsNav}</div>
      </aside>

      {/* drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-bark-950/55" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-bark-900 shadow-2xl">
            <button
              aria-label="Fechar menu"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-bark-300 hover:bg-paper-50/10 cursor-pointer"
            >
              <X size={18} />
            </button>
            {nav}
            <div className="border-t border-paper-50/10 p-3">{settingsNav}</div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-sand-300 bg-paper-100/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              className="rounded-lg p-2 text-bark-700 hover:bg-sand-200 cursor-pointer lg:hidden"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
            >
              <List size={20} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-bark-900">{title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <label className="relative hidden md:block">
                <MagnifyingGlass
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bark-400"
                />
                <input
                  placeholder="Buscar no painel… (em breve)"
                  tabIndex={-1}
                  className="w-56 rounded-xl border border-sand-300 bg-paper-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-bark-400 focus:border-bark-400"
                />
              </label>
              <button
                onClick={() => {
                  logout();
                }}
                className="flex items-center gap-2 rounded-xl border border-sand-300 bg-paper-50 px-3 py-2 text-sm font-semibold text-bark-700 transition-colors hover:border-bark-400 cursor-pointer"
              >
                <SignOut size={16} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
