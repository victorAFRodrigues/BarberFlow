import { useMemo, useState } from "react";
import {
  CalendarBlank,
  CheckCircle,
  MagnifyingGlass,
  Phone,
  XCircle,
} from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import { Avatar, Badge, Button, Card, EmptyState, Modal } from "../../components/ui";
import { brl, formatDateFull, minToLabel, toDateKey } from "../../lib/format";
import { METHOD_LABELS, type Appointment } from "../../types";

type StatusFilter = "todos" | "confirmado" | "concluido" | "cancelado";

export default function Agendamentos() {
  const { state, dispatch } = useStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [barberFilter, setBarberFilter] = useState<string>("todos");
  const [dateFilter, setDateFilter] = useState<string>(toDateKey(new Date()));
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Appointment | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.appointments
      .filter((a) => (statusFilter === "todos" ? true : a.status === statusFilter))
      .filter((a) => (barberFilter === "todos" ? true : a.barberId === barberFilter))
      .filter((a) => (dateFilter ? a.date === dateFilter : true))
      .filter((a) =>
        q
          ? a.customerName.toLowerCase().includes(q) ||
            a.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
          : true,
      )
      .sort((a, b) => a.startMin - b.startMin);
  }, [state.appointments, statusFilter, barberFilter, dateFilter, query]);

  return (
    <div className="space-y-5">
      {/* filtros */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1 rounded-xl bg-paper-200 p-1">
          {(["todos", "confirmado", "concluido", "cancelado"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                statusFilter === s ? "bg-paper-100 text-bark-900 shadow-sm" : "text-bark-500 hover:text-bark-800"
              }`}
            >
              {s === "concluido" ? "concluídos" : s === "cancelado" ? "cancelados" : `${s}s`}
            </button>
          ))}
        </div>
        <select
          value={barberFilter}
          onChange={(e) => setBarberFilter(e.target.value)}
          className="rounded-xl border border-sand-300 bg-paper-50 px-3 py-2 text-sm outline-none focus:border-ember-500"
        >
          <option value="todos">Todos os barbeiros</option>
          {state.barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="tnum rounded-xl border border-sand-300 bg-paper-50 px-3 py-2 text-sm outline-none focus:border-ember-500"
        />
        <label className="relative ml-auto">
          <MagnifyingGlass size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
          <input
            placeholder="Cliente ou telefone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-52 rounded-xl border border-sand-300 bg-paper-50 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-bark-400 focus:border-ember-500"
          />
        </label>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank size={24} />}
          title="Nenhum agendamento encontrado"
          description="Ajuste os filtros ou escolha outra data. Agendamentos feitos no site aparecem aqui automaticamente."
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand-300 bg-paper-200 text-[11px] uppercase tracking-wide text-bark-600">
                <th className="px-5 py-3 font-bold">Horário</th>
                <th className="px-4 py-3 font-bold">Cliente</th>
                <th className="px-4 py-3 font-bold">Serviço</th>
                <th className="px-4 py-3 font-bold">Barbeiro</th>
                <th className="px-4 py-3 font-bold">Pagamento</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {filtered.map((a) => {
                const barber = state.barbers.find((b) => b.id === a.barberId);
                const service = state.services.find((s) => s.id === a.serviceId);
                return (
                  <tr key={a.id} className="transition-colors hover:bg-paper-200/50">
                    <td className="tnum px-5 py-3.5 font-bold text-bark-900">{minToLabel(a.startMin)}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-bark-900">{a.customerName}</p>
                      <p className="tnum text-xs text-bark-500">{a.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p>{service?.name ?? "—"}</p>
                      <p className="tnum text-xs text-bark-500">
                        {service?.durationMin} min · {brl(a.payment.totalCents)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {barber && (
                        <span className="flex items-center gap-2">
                          <Avatar name={barber.name} color={barber.color} size={26} />
                          <span className="whitespace-nowrap">{barber.name.split(" ")[0]}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone="info">{METHOD_LABELS[a.payment.method]}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        tone={
                          a.status === "confirmado" ? "accent" : a.status === "concluido" ? "success" : "danger"
                        }
                      >
                        {a.status === "confirmado"
                          ? "confirmado"
                          : a.status === "concluido"
                            ? "concluído"
                            : "cancelado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        {a.status === "confirmado" && (
                          <>
                            <Button
                              variant="secondary"
                              className="px-2.5 py-1.5 text-xs"
                              title="Marcar como concluído"
                              onClick={() => dispatch({ type: "appt/status", id: a.id, status: "concluido" })}
                            >
                              <CheckCircle size={14} weight="fill" className="text-moss-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="px-2.5 py-1.5 text-xs text-wine-500 hover:bg-wine-500/10"
                              title="Cancelar agendamento"
                              onClick={() => dispatch({ type: "appt/status", id: a.id, status: "cancelado" })}
                            >
                              <XCircle size={14} />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" className="px-2.5 py-1.5 text-xs" onClick={() => setDetail(a)}>
                          detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* modal de detalhes com split */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalhes do agendamento">
        {detail &&
          (() => {
            const barber = state.barbers.find((b) => b.id === detail.barberId);
            const service = state.services.find((s) => s.id === detail.serviceId);
            return (
              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-sand-300 bg-paper-50 p-4">
                  <div className="flex items-center gap-3">
                    {barber && <Avatar name={barber.name} color={barber.color} size={42} />}
                    <div className="flex-1">
                      <p className="font-bold text-bark-950">{service?.name}</p>
                      <p className="text-xs text-bark-500">
                        {formatDateFull(detail.date)} ·{" "}
                        <span className="tnum">
                          {minToLabel(detail.startMin)} ({service?.durationMin} min)
                        </span>
                      </p>
                    </div>
                    <Badge
                      tone={
                        detail.status === "confirmado" ? "accent" : detail.status === "concluido" ? "success" : "danger"
                      }
                    >
                      {detail.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoBox label="Cliente" value={detail.customerName} />
                  <InfoBox label="Telefone" value={detail.customerPhone} mono icon={<Phone size={13} />} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-bark-500">
                    Divisão do pagamento · {METHOD_LABELS[detail.payment.method]}
                  </p>
                  <dl className="space-y-2 tnum">
                    <SplitRow label="Total pago pelo cliente" value={brl(detail.payment.totalCents)} bold />
                    <SplitRow label="Taxa do gateway (simulada)" value={`−${brl(detail.payment.feeCents)}`} />
                    {detail.payment.splits.map((sp) => {
                      const b = state.barbers.find((x) => x.id === sp.barberId);
                      return (
                        <SplitRow
                          key={sp.barberId}
                          label={`Comissão ${b?.name.split(" ")[0] ?? "—"} (${b?.commissionPct}%)`}
                          value={brl(sp.amountCents)}
                          badge={sp.status}
                        />
                      );
                    })}
                    <div className="border-t border-dashed border-sand-300 pt-2">
                      <SplitRow
                        label="Líquido da casa"
                        value={brl(
                          detail.payment.totalCents -
                            detail.payment.feeCents -
                            detail.payment.splits.reduce((acc, s) => acc + s.amountCents, 0),
                        )}
                        bold
                      />
                    </div>
                  </dl>
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

function InfoBox({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-sand-300 bg-paper-100 px-4 py-3">
      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-bark-500">
        {icon} {label}
      </p>
      <p className={`mt-0.5 font-semibold text-bark-900 ${mono ? "tnum" : ""}`}>{value}</p>
    </div>
  );
}

function SplitRow({
  label,
  value,
  bold,
  badge,
}: {
  label: string;
  value: string;
  bold?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={`flex items-center gap-2 ${bold ? "font-semibold text-bark-800" : "text-bark-600"}`}>
        {label}
        {badge && <Badge tone={badge === "transferido" ? "success" : "warning"}>{badge}</Badge>}
      </dt>
      <dd className={`font-bold ${bold ? "text-bark-900" : "text-bark-700"}`}>{value}</dd>
    </div>
  );
}
