import type {
  Appointment,
  Barber,
  ExpenseCategory,
  PaymentMethod,
  Plan,
  Service,
  StoreState,
  Subscription,
  SubscriptionPayment,
  Transaction,
} from "../types";
import { addDays, addMonthsKey, toDateKey } from "../lib/format";
import { DEFAULT_SETTINGS } from "../lib/theme";

/** PRNG determinístico p/ gerar sempre o mesmo dataset de demonstração */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260825);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + rand() * (max - min);
const uid = () => globalThis.crypto.randomUUID();

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "aluguel", label: "Aluguel", color: "#7c6549" },
  { id: "produtos", label: "Produtos", color: "#c96b2e" },
  { id: "energia", label: "Energia", color: "#a08868" },
  { id: "agua", label: "Água", color: "#6d7f4b" },
  { id: "marketing", label: "Marketing", color: "#dd8a45" },
  { id: "manutencao", label: "Manutenção", color: "#9c4a38" },
  { id: "internet", label: "Internet", color: "#60492f" },
  { id: "contabilidade", label: "Contabilidade", color: "#bfa987" },
];

const SERVICES: Array<Omit<Service, "id">> = [
  {
    name: "Corte Clássico",
    description:
      "Tesoura e máquina com acabamento na navalha. Inclui lavagem e finalização com pomada modeladora.",
    priceCents: 4500,
    durationMin: 45,
    category: "cabelo",
    active: true,
  },
  {
    name: "Degradê + Sobrancelha",
    description:
      "Fade personalizado na máquina, alinhamento de sobrancelha na navalha e finalização seca.",
    priceCents: 5000,
    durationMin: 50,
    category: "cabelo",
    active: true,
  },
  {
    name: "Barba Terapia",
    description:
      "Toalha quente, óleos essenciais, navalha e balm hidratante. O ritual completo para a barba.",
    priceCents: 4000,
    durationMin: 30,
    category: "barba",
    active: true,
  },
  {
    name: "Combo Corte + Barba",
    description:
      "O pacote mais pedido da casa: corte à sua escolha seguido do ritual completo de barba.",
    priceCents: 8000,
    durationMin: 75,
    category: "combo",
    active: true,
  },
  {
    name: "Pezinho / Acabamento",
    description: "Retoque rápido de contorno e nuca entre cortes. Sai em quinze minutos.",
    priceCents: 2000,
    durationMin: 15,
    category: "cabelo",
    active: true,
  },
  {
    name: "Camuflagem de Grisalhos",
    description: "Pigmentação discreta que reduz o contraste dos fios brancos com naturalidade.",
    priceCents: 6000,
    durationMin: 40,
    category: "tratamento",
    active: true,
  },
];

interface BarberSeed {
  name: string;
  role: string;
  phone: string;
  commissionPct: number;
  color: string;
  /** [dia, inicio, fim] */
  workdays: Array<[number, string, string]>;
  serviceIdx: number[];
}

const BARBERS: BarberSeed[] = [
  {
    name: "Ricardo Nunes",
    role: "Barbeiro Master",
    phone: "(11) 98812-4455",
    commissionPct: 40,
    color: "#c96b2e",
    workdays: [
      [1, "09:00", "19:00"],
      [2, "09:00", "19:00"],
      [3, "09:00", "19:00"],
      [4, "09:00", "19:00"],
      [5, "09:00", "20:00"],
      [6, "09:00", "16:00"],
    ],
    serviceIdx: [0, 1, 2, 3, 4],
  },
  {
    name: "Diego Martins",
    role: "Especialista em degradê",
    phone: "(11) 97744-2210",
    commissionPct: 35,
    color: "#6d7f4b",
    workdays: [
      [1, "10:00", "20:00"],
      [3, "10:00", "20:00"],
      [4, "10:00", "20:00"],
      [5, "12:00", "21:00"],
      [6, "09:00", "18:00"],
    ],
    serviceIdx: [0, 1, 4, 5],
  },
  {
    name: "Anderson Silva",
    role: "Barbeiro & Barboterapeuta",
    phone: "(11) 96633-8080",
    commissionPct: 30,
    color: "#9c4a38",
    workdays: [
      [1, "12:00", "21:00"],
      [2, "12:00", "21:00"],
      [4, "12:00", "21:00"],
      [5, "12:00", "21:00"],
      [6, "09:00", "18:00"],
    ],
    serviceIdx: [0, 2, 3, 5],
  },
  {
    name: "Caio Ferreira",
    role: "Barbeiro Júnior",
    phone: "(11) 95522-1177",
    commissionPct: 20,
    color: "#7c6549",
    workdays: [
      [3, "10:00", "18:00"],
      [4, "10:00", "18:00"],
      [5, "10:00", "18:00"],
      [6, "09:00", "17:00"],
      [0, "10:00", "14:00"],
    ],
    serviceIdx: [0, 2, 4],
  },
];

const CUSTOMERS = [
  ["Lucas Prado", "(11) 98888-1010"],
  ["Bruno Tavares", "(11) 98123-4567"],
  ["Felipe Moraes", "(11) 99555-2040"],
  ["Gustavo Lima", "(11) 97474-9090"],
  ["Thiago Ramos", "(11) 96321-7878"],
  ["Marcelo Dias", "(11) 95123-6565"],
  ["Rafael Souza", "(11) 98999-3232"],
  ["Vinícius Rocha", "(11) 97777-1212"],
  ["Eduardo Pinto", "(11) 96666-4848"],
  ["Henrique Castro", "(11) 95544-7676"],
  ["Otávio Freitas", "(11) 94433-2929"],
  ["Leonardo Campos", "(11) 93322-8585"],
  ["Joaquim Vieira", "(11) 92211-5050"],
  ["Danilo Farias", "(11) 91100-4040"],
  ["Wesley Antunes", "(11) 90099-6060"],
  ["Igor Bernardes", "(11) 99911-7070"],
];

function feeFor(method: PaymentMethod, totalCents: number): number {
  if (method === "pix") return Math.round(totalCents * 0.01);
  if (method === "credito") return Math.round(totalCents * 0.04) + 39;
  return Math.round(totalCents * 0.025);
}

/* ---------- clube de assinaturas ---------- */

const PLANS: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    priceCents: 11900,
    cutsPerMonth: 2,
    color: "#7c6549",
    perks: [
      "2 serviços por mês: corte clássico ou barba terapia, à sua escolha",
      "Acabamento e pezinho ilimitados entre os serviços",
      "Toalha quente e balm hidratante em toda barba",
      "Preço travado mesmo com reajuste anual",
      "Café da casa liberado nos dias de atendimento",
    ],
  },
  {
    id: "ilimitado",
    name: "Ilimitado",
    priceCents: 19900,
    cutsPerMonth: null,
    featured: true,
    color: "#c96b2e",
    perks: [
      "Cortes ilimitados durante todo o mês",
      "Barba Terapia inclusa em todos os cortes",
      "Prioridade máxima na agenda (horários exclusivos)",
      "Camuflagem de grisalhos com 30% off",
      "20% off em pomadas, óleos e produtos",
      "Leve um amigo por mês: acompanhante com 50% off",
    ],
  },
  {
    id: "dupla",
    name: "Dupla",
    priceCents: 33900,
    cutsPerMonth: null,
    color: "#57653a",
    perks: [
      "Tudo do Ilimitado para 2 pessoas",
      "Cortes e barbas ilimitados para ambos",
      "Horários sincronizados: os dois sentam lado a lado",
      "20% off em produtos para os dois",
      "Mês grátis ao indicar um novo assinante",
    ],
  },
];

interface SubSeed {
  name: string;
  phone: string;
  planId: string;
  status: Subscription["status"];
  /** meses de casa */
  months: number;
  /** dias até o vencimento (negativo = vencido) */
  dueInDays?: number;
  cutsUsed: number;
  method: PaymentMethod;
  notes?: string;
}

const SUBS: SubSeed[] = [
  { name: "Lucas Prado", phone: "(11) 98888-1010", planId: "ilimitado", status: "ativo", months: 14, dueInDays: 18, cutsUsed: 4, method: "pix" },
  { name: "Bruno Tavares", phone: "(11) 98123-4567", planId: "essencial", status: "ativo", months: 6, dueInDays: 9, cutsUsed: 1, method: "credito" },
  { name: "Felipe Moraes", phone: "(11) 99555-2040", planId: "dupla", status: "ativo", months: 3, dueInDays: 22, cutsUsed: 6, method: "pix" },
  { name: "Gustavo Lima", phone: "(11) 97474-9090", planId: "ilimitado", status: "ativo", months: 21, dueInDays: 3, cutsUsed: 7, method: "credito" },
  { name: "Thiago Ramos", phone: "(11) 96321-7878", planId: "essencial", status: "ativo", months: 2, dueInDays: 12, cutsUsed: 1, method: "debito" },
  { name: "Vinícius Rocha", phone: "(11) 97777-1212", planId: "ilimitado", status: "ativo", months: 8, dueInDays: 15, cutsUsed: 5, method: "pix" },
  { name: "Eduardo Pinto", phone: "(11) 96666-4848", planId: "dupla", status: "ativo", months: 1, dueInDays: 25, cutsUsed: 3, method: "pix" },
  { name: "Henrique Castro", phone: "(11) 95544-7676", planId: "essencial", status: "pendente", months: 5, dueInDays: -4, cutsUsed: 1, method: "pix", notes: "Pediu para cobrar no fim da semana." },
  { name: "Otávio Freitas", phone: "(11) 94433-2929", planId: "ilimitado", status: "pendente", months: 9, dueInDays: -11, cutsUsed: 3, method: "credito" },
  { name: "Leonardo Campos", phone: "(11) 93322-8585", planId: "ilimitado", status: "suspenso", months: 12, dueInDays: -27, cutsUsed: 0, method: "pix", notes: "Suspenso por falta de pagamento — avisado 3x no WhatsApp." },
  { name: "Joaquim Vieira", phone: "(11) 92211-5050", planId: "essencial", status: "cancelado", months: 4, cutsUsed: 0, method: "debito", notes: "Mudou de cidade." },
  { name: "Wesley Antunes", phone: "(11) 90099-6060", planId: "dupla", status: "cancelado", months: 2, cutsUsed: 0, method: "credito", notes: "Trocou para avulso." },
  { name: "Igor Bernardes", phone: "(11) 99911-7070", planId: "essencial", status: "ativo", months: 1, dueInDays: 28, cutsUsed: 0, method: "pix", notes: "Assinou na loja, veio indicação do Rafael." },
  { name: "Danilo Farias", phone: "(11) 91100-4040", planId: "ilimitado", status: "ativo", months: 17, dueInDays: 6, cutsUsed: 9, method: "pix" },
];

function buildPlansAndSubs(): { plans: Plan[]; subscriptions: Subscription[] } {
  const todayKey = toDateKey(new Date());
  const plans = PLANS;

  const subscriptions: Subscription[] = SUBS.map((s) => {
    const plan = plans.find((p) => p.id === s.planId)!;
    const startedAt = addMonthsKey(todayKey, -s.months);
    const history: SubscriptionPayment[] = [];
    // mensalidades pagas: uma por mês de casa (exceto pendentes/suspensos/cancelados recentes)
    const paidCount =
      s.status === "cancelado"
        ? Math.min(s.months, 2)
        : Math.max(0, s.months - (s.status === "ativo" ? 1 : 2));
    for (let i = paidCount; i >= 1; i--) {
      history.push({
        date: addMonthsKey(startedAt, s.months - i),
        amountCents: plan.priceCents,
        method: s.method,
      });
    }
    const lastPaymentDate = history[history.length - 1]?.date;
    const nextDueDate =
      s.status === "cancelado"
        ? undefined
        : s.dueInDays !== undefined
          ? toDateKey(addDays(new Date(), s.dueInDays))
          : addMonthsKey(lastPaymentDate ?? startedAt, 1);

    return {
      id: uid(),
      customerName: s.name,
      customerPhone: s.phone,
      planId: s.planId,
      status: s.status,
      startedAt,
      lastPaymentDate,
      nextDueDate:
        s.status === "cancelado"
          ? undefined
          : s.dueInDays !== undefined
            ? toDateKey(addDays(new Date(), s.dueInDays))
            : nextDueDate,
      cutsUsedThisMonth: s.cutsUsed,
      paymentMethod: s.method,
      notes: s.notes,
      history: [...history].reverse(),
    };
  });

  return { plans, subscriptions };
}

export function buildSeed(): StoreState {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const services: Service[] = SERVICES.map((s) => ({ ...s, id: uid() }));
  const barbers: Barber[] = BARBERS.map((b) => {
    const schedule: Barber["schedule"] = {};
    for (let d = 0; d < 7; d++) schedule[d] = { enabled: false, start: "09:00", end: "18:00" };
    for (const [day, start, end] of b.workdays) schedule[day] = { enabled: true, start, end };
    return {
      id: uid(),
      name: b.name,
      role: b.role,
      phone: b.phone,
      active: true,
      commissionPct: b.commissionPct,
      color: b.color,
      schedule,
      serviceIds: b.serviceIdx.map((i) => services[i].id),
    };
  });

  const appointments: Appointment[] = [];
  const transactions: Transaction[] = [];
  let customerCursor = 0;

  for (let offset = -30; offset <= 12; offset++) {
    const date = addDays(today, offset);
    const dow = date.getDay();
    const dateKey = toDateKey(date);

    barbers.forEach((barber) => {
      if (!barber.schedule[dow]?.enabled) return;
      const openMin = Number(barber.schedule[dow].start.slice(0, 2)) * 60;
      const closeMin = Number(barber.schedule[dow].end.slice(0, 2)) * 60;

      const barberServices = services.filter((s) => barber.serviceIds.includes(s.id));
      const count = offset <= 0 ? 2 + Math.floor(rand() * 4) : Math.floor(rand() * 3);
      const usedStarts = new Set<number>();

      for (let i = 0; i < count; i++) {
        const svc = pick(barberServices);
        const latestStart = closeMin - svc.durationMin;
        if (latestStart <= openMin) continue;
        const startMin =
          Math.round(between(openMin + 60, latestStart) / 30) * 30;
        if (usedStarts.has(startMin)) continue;
        usedStarts.add(startMin);

        // hoje: horários já passados ficam concluídos
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        const status =
          offset < 0
            ? rand() < 0.07
              ? "cancelado"
              : "concluido"
            : offset === 0 && startMin <= nowMin
              ? rand() < 0.05
                ? "cancelado"
                : "concluido"
              : rand() < 0.03
                ? "cancelado"
                : "confirmado";

        const [customerName, customerPhone] = CUSTOMERS[customerCursor++ % CUSTOMERS.length];
        const method = (["pix", "pix", "credito", "debito"] as PaymentMethod[])[Math.floor(rand() * 4)];
        const totalCents = svc.priceCents;
        const splitAmount = Math.round((totalCents * barber.commissionPct) / 100);

        appointments.push({
          id: uid(),
          barberId: barber.id,
          serviceId: svc.id,
          customerName,
          customerPhone,
          date: dateKey,
          startMin,
          status,
          payment: {
            method,
            totalCents,
            feeCents: feeFor(method, totalCents),
            splits: [
              {
                barberId: barber.id,
                amountCents: splitAmount,
                status: "transferido",
              },
            ],
          },
        });

        if (status !== "cancelado") {
          transactions.push({
            id: uid(),
            type: "receita",
            categoryId: method,
            description: `${svc.name} · ${customerName}`,
            amountCents: totalCents,
            date: dateKey,
            appointmentId: appointments[appointments.length - 1].id,
          });
        }
      }
    });
  }

  // despesas recorrentes nos meses anterior, retrasado e atual
  const expenseTx: Transaction[] = [];
  for (let m = -2; m <= 0; m++) {
    const base = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const ym = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
    const dayKey = (d: number) => `${ym}-${String(d).padStart(2, "0")}`;
    const pushExp = (categoryId: string, description: string, day: number, amount: number) => {
      const key = dayKey(day);
      if (key > toDateKey(today)) return; // despesas futuras ainda não lançadas
      expenseTx.push({ id: uid(), type: "despesa", categoryId, description, amountCents: amount, date: key });
    };

    pushExp("aluguel", "Aluguel do ponto", 5, 320000);
    pushExp("energia", "Conta de luz", 10, Math.round(between(32000, 46000)));
    pushExp("agua", "Conta de água", 10, Math.round(between(9000, 15000)));
    pushExp("internet", "Fibra dedicada", 3, 12900);
    pushExp("contabilidade", "Honorários contábeis", 15, 25000);
    pushExp("produtos", "Reposição de pomadas e óleos", 7, Math.round(between(18000, 34000)));
    pushExp("produtos", "Toalhas e descartáveis", 21, Math.round(between(8000, 16000)));
    pushExp("marketing", "Anúncios locais", 12, Math.round(between(20000, 48000)));
    if (rand() < 0.8) pushExp("manutencao", "Manutenção de máquinas e mobília", 18, Math.round(between(6000, 22000)));
  }
  transactions.push(...expenseTx);
  transactions.sort((a, b) => (a.date < b.date ? 1 : -1));

  const { plans, subscriptions } = buildPlansAndSubs();

  return {
    barbers,
    services,
    appointments,
    transactions,
    expenseCategories: EXPENSE_CATEGORIES,
    plans,
    subscriptions,
    settings: DEFAULT_SETTINGS,
  };
}
