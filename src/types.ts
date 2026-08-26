export type ServiceCategory = "cabelo" | "barba" | "combo" | "tratamento";

export type PaymentMethod = "pix" | "credito" | "debito";

export type AppointmentStatus = "confirmado" | "concluido" | "cancelado";

export type SplitStatus = "pendente" | "transferido";

export interface WorkDay {
  enabled: boolean;
  /** "09:00" */
  start: string;
  end: string;
}

/** chave = dia da semana 0..6 (0=domingo) */
export type Schedule = Record<number, WorkDay>;

export interface Barber {
  id: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
  /** comissão em % sobre o preço bruto do serviço */
  commissionPct: number;
  color: string;
  schedule: Schedule;
  serviceIds: string[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
  category: ServiceCategory;
  active: boolean;
}

export interface PaymentSplit {
  barberId: string;
  amountCents: number;
  status: SplitStatus;
}

export interface AppointmentPayment {
  method: PaymentMethod;
  totalCents: number;
  feeCents: number;
  splits: PaymentSplit[];
}

export interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  /** yyyy-mm-dd */
  date: string;
  /** minutos desde a meia-noite */
  startMin: number;
  status: AppointmentStatus;
  payment: AppointmentPayment;
}

export type TransactionType = "receita" | "despesa";

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  description: string;
  amountCents: number;
  /** yyyy-mm-dd */
  date: string;
  appointmentId?: string;
}

export interface ExpenseCategory {
  id: string;
  label: string;
  color: string;
}

/* ---------- tema / identidade ---------- */

export interface Settings {
  /** cor de acento principal (hex) */
  accent: string;
  /** logo enviada pelo usuário (dataURL) ou null = marca padrão */
  logo: string | null;
  shopName: string;
}

/* ---------- assinaturas / clube ---------- */

export type SubStatus = "ativo" | "pendente" | "suspenso" | "cancelado";

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  /** null = cortes ilimitados */
  cutsPerMonth: number | null;
  perks: string[];
  featured?: boolean;
  color: string;
}

export interface SubscriptionPayment {
  /** yyyy-mm-dd */
  date: string;
  amountCents: number;
  method: PaymentMethod;
}

export interface Subscription {
  id: string;
  customerName: string;
  customerPhone: string;
  planId: string;
  status: SubStatus;
  /** yyyy-mm-dd */
  startedAt: string;
  lastPaymentDate?: string;
  nextDueDate?: string;
  cutsUsedThisMonth: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  history: SubscriptionPayment[];
}

export interface StoreState {
  barbers: Barber[];
  services: Service[];
  appointments: Appointment[];
  transactions: Transaction[];
  expenseCategories: ExpenseCategory[];
  plans: Plan[];
  subscriptions: Subscription[];
  settings: Settings;
}

export const WEEKDAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;

export const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  cabelo: "Cabelo",
  barba: "Barba",
  combo: "Combo",
  tratamento: "Tratamento",
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  credito: "Crédito",
  debito: "Débito",
};
