import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  ChartPieSlice,
  Clock,
  Money,
  Percent,
  Receipt,
  TrendUp,
} from "@phosphor-icons/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "../../store/store";
import { Avatar, Badge, Card, EmptyState } from "../../components/ui";
import { brl, monthLabel, minToLabel, toDateKey } from "../../lib/format";

function lastMonthKeys(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

export default function Dashboard() {
  const { state } = useStore();
  const EMBER = state.settings.accent;
  const BARK = "#7c6549";
  const todayKey = toDateKey(new Date());
  const thisMonth = todayKey.slice(0, 7);

  // ---------- agregações ----------
  const kpis = useMemo(() => {
    const months = lastMonthKeys(2);
    const sumBy = (m: string, type: "receita" | "despesa") =>
      state.transactions
        .filter((t) => t.type === type && t.date.slice(0, 7) === m)
        .reduce((acc, t) => acc + t.amountCents, 0);

    const revenueThis = sumBy(months[1], "receita");
    const revenuePrev = sumBy(months[0], "receita");
    const paidThisMonth = state.appointments.filter(
      (a) => a.status !== "cancelado" && a.date.slice(0, 7) === thisMonth,
    );
    const ticketAvg = paidThisMonth.length ? Math.round(revenueThis / paidThisMonth.length) : 0;

    const todayAppts = state.appointments.filter((a) => a.date === todayKey && a.status !== "cancelado");
    const mrr = state.subscriptions
      .filter((s) => s.status === "ativo")
      .reduce((acc, s) => acc + (state.plans.find((p) => p.id === s.planId)?.priceCents ?? 0), 0);
    let bookedMin = 0;
    for (const a of todayAppts) {
      bookedMin += state.services.find((s) => s.id === a.serviceId)?.durationMin ?? 30;
    }
    let capacityMin = 0;
    for (const b of state.barbers.filter((b) => b.active)) {
      const wd = b.schedule[new Date().getDay()];
      if (wd?.enabled) {
        capacityMin +=
          Number(wd.end.slice(0, 2)) * 60 + Number(wd.end.slice(3)) -
          (Number(wd.start.slice(0, 2)) * 60 + Number(wd.start.slice(3)));
      }
    }
    const occupancy = capacityMin ? Math.min(100, Math.round((bookedMin / capacityMin) * 100)) : 0;

    return {
      revenueThis,
      deltaPct: revenuePrev ? Math.round(((revenueThis - revenuePrev) / revenuePrev) * 100) : null,
      apptsToday: todayAppts.length,
      occupancy,
      ticketAvg,
      expensesThis: sumBy(thisMonth, "despesa"),
      mrr,
    };
  }, [state, thisMonth, todayKey]);

  const monthlySeries = useMemo(() => {
    return lastMonthKeys(6).map((mk) => ({
      mes: monthLabel(mk),
      receitas: state.transactions
        .filter((t) => t.type === "receita" && t.date.startsWith(mk))
        .reduce((a, t) => a + t.amountCents, 0) / 100,
      despesas: state.transactions
        .filter((t) => t.type === "despesa" && t.date.startsWith(mk))
        .reduce((a, t) => a + t.amountCents, 0) / 100,
    }));
  }, [state.transactions]);

  const expenseByCategory = useMemo(() => {
    const rows = state.expenseCategories.map((c) => ({
      name: c.label,
      value:
        state.transactions
          .filter((t) => t.type === "despesa" && t.date.slice(0, 7) === thisMonth && t.categoryId === c.id)
          .reduce((a, t) => a + t.amountCents, 0) / 100,
      color: c.color,
    }));
    return rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  }, [state, thisMonth]);

  const topBarbers = useMemo(() => {
    return state.barbers
      .map((b) => ({
        nome: b.name.split(" ")[0],
        cor: b.color,
        receita:
          state.appointments
            .filter((a) => a.barberId === b.id && a.status !== "cancelado" && a.date.slice(0, 7) === thisMonth)
            .reduce((sum, a) => sum + a.payment.totalCents, 0) / 100,
      }))
      .filter((r) => r.receita > 0)
      .sort((a, b) => b.receita - a.receita);
  }, [state, thisMonth]);

  const todayList = useMemo(() => {
    return state.appointments
      .filter((a) => a.date === todayKey && a.status !== "cancelado")
      .sort((a, b) => a.startMin - b.startMin);
  }, [state.appointments, todayKey]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          icon={Money}
          label={`Receita · ${monthLabel(thisMonth)}`}
          value={brl(kpis.revenueThis)}
          footer={
            kpis.deltaPct !== null && (
              <span className={kpis.deltaPct >= 0 ? "text-moss-600" : "text-wine-500"}>
                {kpis.deltaPct >= 0 ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
                {Math.abs(kpis.deltaPct)}% vs mês anterior
              </span>
            )
          }
        />
        <KpiCard
          icon={CalendarCheck}
          label="Agendamentos hoje"
          value={String(kpis.apptsToday)}
          footer={<span className="text-bark-500">confirmados e concluídos</span>}
        />
        <KpiCard
          icon={Percent}
          label="Ocupação de hoje"
          value={`${kpis.occupancy}%`}
          footer={
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand-300">
              <div className="h-full rounded-full bg-ember-500" style={{ width: `${kpis.occupancy}%` }} />
            </div>
          }
        />
        <KpiCard
          icon={Receipt}
          label="Ticket médio do mês"
          value={brl(kpis.ticketAvg)}
          footer={
            <span className="text-bark-500">
              despesas do mês: {brl(kpis.expensesThis)} · MRR clube: {brl(kpis.mrr)}
            </span>
          }
        />
      </div>

      {/* linha principal de gráficos */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-bark-900">Receitas × Despesas</h3>
            <Badge tone="neutral">últimos 6 meses</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={EMBER} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={EMBER} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gDesp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BARK} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={BARK} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d2b4" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: BARK }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: BARK }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(value) => brl(Number(value) * 100)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e0d2b4",
                    background: "#fbf7ee",
                    fontSize: 13,
                  }}
                />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke={EMBER} strokeWidth={2.5} fill="url(#gRec)" />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke={BARK} strokeWidth={2} fill="url(#gDesp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-bark-900">
              <ChartPieSlice size={18} weight="duotone" className="text-ember-600" />
              Despesas por categoria
            </h3>
            <Badge tone="neutral">{monthLabel(thisMonth)}</Badge>
          </div>
          {expenseByCategory.length === 0 ? (
            <EmptyState
              icon={<Receipt size={22} />}
              title="Sem despesas lançadas"
              description="As despesas deste mês aparecerão aqui agrupadas por categoria."
            />
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="58%"
                      outerRadius="85%"
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {expenseByCategory.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => brl(Number(value) * 100)}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e0d2b4",
                        background: "#fbf7ee",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {expenseByCategory.slice(0, 4).map((e) => (
                  <li key={e.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: e.color }} />
                    <span className="flex-1 text-bark-700">{e.name}</span>
                    <span className="tnum font-semibold text-bark-900">{brl(e.value * 100)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* segunda linha */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-bark-900">
            <TrendUp size={18} weight="duotone" className="text-ember-600" />
            Faturamento por barbeiro
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBarbers} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={76}
                  tick={{ fontSize: 12, fill: BARK }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => brl(Number(value) * 100)}
                  cursor={{ fill: "rgba(201,107,46,0.06)" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e0d2b4",
                    background: "#fbf7ee",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="receita" radius={[0, 8, 8, 0]} barSize={22}>
                  {topBarbers.map((entry) => (
                    <Cell key={entry.nome} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-center text-xs text-bark-500">atendimentos pagos no mês</p>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
            <h3 className="flex items-center gap-2 font-bold text-bark-900">
              <Clock size={18} weight="duotone" className="text-ember-600" />
              Agenda de hoje
            </h3>
            <Badge tone="accent">{todayList.length} atendimentos</Badge>
          </div>
          {todayList.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title="Nada agendado para hoje"
              description="Novos agendamentos feitos pela agenda pública aparecem aqui na hora."
            />
          ) : (
            <ul className="max-h-80 divide-y divide-sand-200 overflow-y-auto">
              {todayList.map((a) => {
                const barber = state.barbers.find((b) => b.id === a.barberId)!;
                const service = state.services.find((s) => s.id === a.serviceId);
                return (
                  <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={barber?.name ?? "?"} color={barber?.color ?? BARK} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-bark-900">{a.customerName}</p>
                      <p className="truncate text-xs text-bark-500">
                        {service?.name} · {barber?.name.split(" ")[0]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-sm font-bold text-bark-800">{minToLabel(a.startMin)}</p>
                      <Badge tone={a.status === "concluido" ? "success" : "accent"}>
                        {a.status === "concluido" ? "concluído" : "confirmado"}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: typeof Money;
  label: string;
  value: string;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-bark-500">{label}</p>
        <Icon size={20} weight="duotone" className="text-ember-500" />
      </div>
      <p className="tnum mt-2 text-2xl font-extrabold tracking-tight text-bark-950">{value}</p>
      {footer && <div className="mt-2 text-xs font-medium">{footer}</div>}
    </Card>
  );
}
