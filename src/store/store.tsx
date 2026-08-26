import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type {
  Appointment,
  Barber,
  ExpenseCategory,
  PaymentMethod,
  Plan,
  Service,
  Settings,
  StoreState,
  Subscription,
  Transaction,
} from "../types";
import { buildSeed } from "../data/seed";
import { addMonthsKey, toDateKey } from "../lib/format";
import { applyTheme, DEFAULT_SETTINGS } from "../lib/theme";

const STORAGE_KEY = "barberflow:v4";
const AUTH_KEY = "barberflow:auth";

export const GATEWAY_FEES: Record<PaymentMethod, { pct: number; fixedCents: number }> = {
  pix: { pct: 0.01, fixedCents: 0 },
  credito: { pct: 0.04, fixedCents: 39 },
  debito: { pct: 0.025, fixedCents: 39 },
};

export function computeFee(method: PaymentMethod, totalCents: number): number {
  const { pct, fixedCents } = GATEWAY_FEES[method];
  return Math.round(totalCents * pct) + fixedCents;
}

// ---------- reducer ----------

type Action =
  | { type: "barber/save"; barber: Barber }
  | { type: "barber/remove"; id: string }
  | { type: "service/save"; service: Service }
  | { type: "service/remove"; id: string }
  | { type: "appt/add"; appointment: Appointment }
  | { type: "appt/status"; id: string; status: Appointment["status"] }
  | { type: "tx/save"; tx: Transaction }
  | { type: "tx/remove"; id: string }
  | { type: "category/save"; category: ExpenseCategory }
  | { type: "category/remove"; id: string }
  | { type: "sub/save"; sub: Subscription }
  | { type: "sub/remove"; id: string }
  | { type: "sub/markPaid"; id: string }
  | { type: "plan/save"; plan: Plan }
  | { type: "settings/save"; settings: Partial<Settings> }
  | { type: "reset" };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "barber/save": {
      const exists = state.barbers.some((b) => b.id === action.barber.id);
      return {
        ...state,
        barbers: exists
          ? state.barbers.map((b) => (b.id === action.barber.id ? action.barber : b))
          : [...state.barbers, action.barber],
        // remove agendamentos futuros de barbeiros desativados
        appointments:
          action.barber.active || exists === false
            ? state.appointments
            : state.appointments.map((a) =>
                a.barberId === action.barber.id && a.status === "confirmado" ? { ...a, status: "cancelado" } : a,
              ),
      };
    }
    case "barber/remove":
      return {
        ...state,
        barbers: state.barbers.filter((b) => b.id !== action.id),
        appointments: state.appointments.filter((a) => a.barberId !== action.id),
      };
    case "service/save": {
      const exists = state.services.some((s) => s.id === action.service.id);
      return {
        ...state,
        services: exists
          ? state.services.map((s) => (s.id === action.service.id ? action.service : s))
          : [...state.services, action.service],
      };
    }
    case "service/remove":
      return {
        ...state,
        services: state.services.filter((s) => s.id !== action.id),
        barbers: state.barbers.map((b) => ({
          ...b,
          serviceIds: b.serviceIds.filter((id) => id !== action.id),
        })),
      };
    case "appt/add":
      return {
        ...state,
        appointments: [...state.appointments, action.appointment],
        transactions: [
          {
            id: crypto.randomUUID(),
            type: "receita",
            categoryId: action.appointment.payment.method,
            description: `${titleOf(state.services, action.appointment.serviceId)} · ${action.appointment.customerName}`,
            amountCents: action.appointment.payment.totalCents,
            date: action.appointment.date,
            appointmentId: action.appointment.id,
          },
          ...state.transactions,
        ],
      };
    case "appt/status": {
      const appt = state.appointments.find((a) => a.id === action.id);
      if (!appt) return state;
      let transactions = state.transactions;
      if (action.status === "cancelado") {
        transactions = transactions.filter(
          (t) => !(t.appointmentId === appt.id && t.type === "receita"),
        );
      }
      return {
        ...state,
        appointments: state.appointments.map((a) =>
          a.id === action.id ? { ...a, status: action.status } : a,
        ),
        transactions,
      };
    }
    case "tx/save": {
      const exists = state.transactions.some((t) => t.id === action.tx.id);
      return {
        ...state,
        transactions: exists
          ? state.transactions.map((t) => (t.id === action.tx.id ? action.tx : t))
          : [action.tx, ...state.transactions],
      };
    }
    case "tx/remove":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "category/save": {
      const exists = state.expenseCategories.some((c) => c.id === action.category.id);
      return {
        ...state,
        expenseCategories: exists
          ? state.expenseCategories.map((c) => (c.id === action.category.id ? action.category : c))
          : [...state.expenseCategories, action.category],
      };
    }
    case "category/remove":
      return {
        ...state,
        expenseCategories: state.expenseCategories.filter((c) => c.id !== action.id),
      };
    case "sub/save": {
      const exists = state.subscriptions.some((s) => s.id === action.sub.id);
      return {
        ...state,
        subscriptions: exists
          ? state.subscriptions.map((s) => (s.id === action.sub.id ? action.sub : s))
          : [action.sub, ...state.subscriptions],
      };
    }
    case "sub/remove":
      return { ...state, subscriptions: state.subscriptions.filter((s) => s.id !== action.id) };
    case "sub/markPaid": {
      const sub = state.subscriptions.find((s) => s.id === action.id);
      const plan = sub && state.plans.find((p) => p.id === sub.planId);
      if (!sub || !plan) return state;
      const today = toDateKey(new Date());
      const payment = { date: today, amountCents: plan.priceCents, method: sub.paymentMethod };
      const updated: Subscription = {
        ...sub,
        status: "ativo",
        lastPaymentDate: today,
        nextDueDate: addMonthsKey(today, 1),
        history: [payment, ...sub.history],
      };
      return {
        ...state,
        subscriptions: state.subscriptions.map((s) => (s.id === action.id ? updated : s)),
        transactions: [
          {
            id: crypto.randomUUID(),
            type: "receita",
            categoryId: "assinatura",
            description: `Mensalidade ${plan.name} · ${sub.customerName}`,
            amountCents: plan.priceCents,
            date: today,
          },
          ...state.transactions,
        ],
      };
    }
    case "plan/save": {
      const exists = state.plans.some((p) => p.id === action.plan.id);
      return {
        ...state,
        plans: exists
          ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p))
          : [...state.plans, action.plan],
      };
    }
    case "settings/save":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case "reset":
      return buildSeed();
    default:
      return state;
  }
}

function titleOf(services: Service[], id: string): string {
  return services.find((s) => s.id === id)?.name ?? "Serviço";
}

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed.barbers?.length && parsed.services?.length) {
        return { ...parsed, settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) } };
      }
    }
  } catch {
    // dados corrompidos -> regenera
  }
  return buildSeed();
}

// ---------- contextos ----------

interface StoreCtxValue {
  state: StoreState;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
}

const StoreCtx = createContext<StoreCtxValue | null>(null);

const AuthCtx = createContext<{ authed: boolean; login: () => void; logout: () => void }>({
  authed: false,
  login: () => {},
  logout: () => {},
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as StoreState, loadState);
  const [authed, setAuthed] = useState(() => localStorage.getItem(AUTH_KEY) === "1");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota cheia: segue em memória
    }
  }, [state]);

  // aplica cor de acento + favicon sempre que o tema mudar
  useEffect(() => {
    applyTheme(state.settings);
  }, [state.settings]);

  const login = useCallback(() => {
    localStorage.setItem(AUTH_KEY, "1");
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }, []);

  const resetDemo = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  const storeValue = useMemo(() => ({ state, dispatch, resetDemo }), [state, resetDemo]);

  return (
    <StoreCtx.Provider value={storeValue}>
      <AuthCtx.Provider value={{ authed, login, logout }}>{children}</AuthCtx.Provider>
    </StoreCtx.Provider>
  );
}

export function useStore(): StoreCtxValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore precisa estar dentro de <AppProviders>");
  return ctx;
}

export function useAuth() {
  return useContext(AuthCtx);
}
