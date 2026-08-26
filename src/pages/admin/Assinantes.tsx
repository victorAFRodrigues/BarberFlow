import { useMemo, useState } from "react";
import {
  CheckCircle,
  Crown,
  Eye,
  Money,
  PauseCircle,
  PencilSimple,
  PlayCircle,
  Plus,
  Scissors,
  Tag,
  TrashSimple,
  XCircle,
} from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, inputClass } from "../../components/ui";
import { brl, addMonthsKey, formatDateFull, toDateKey } from "../../lib/format";
import { METHOD_LABELS, type Plan, type SubStatus, type Subscription } from "../../types";

const STATUS_META: Record<SubStatus, { label: string; tone: "success" | "warning" | "danger" | "neutral" }> = {
  ativo: { label: "ativo", tone: "success" },
  pendente: { label: "mensalidade pendente", tone: "warning" },
  suspenso: { label: "suspenso", tone: "danger" },
  cancelado: { label: "cancelado", tone: "neutral" },
};

function newSubscription(planId: string): Subscription {
  return {
    id: crypto.randomUUID(),
    customerName: "",
    customerPhone: "",
    planId,
    status: "ativo",
    startedAt: toDateKey(new Date()),
    nextDueDate: addMonthsKey(toDateKey(new Date()), 1),
    cutsUsedThisMonth: 0,
    paymentMethod: "pix",
    notes: "",
    history: [],
  };
}

export default function Assinantes() {
  const { state, dispatch } = useStore();
  const today = toDateKey(new Date());

  const [statusFilter, setStatusFilter] = useState<SubStatus | "todos">("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [detail, setDetail] = useState<Subscription | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);

  const planById = (id: string) => state.plans.find((p) => p.id === id);

  const kpis = useMemo(() => {
    const active = state.subscriptions.filter((s) => s.status === "ativo");
    const mrr = active.reduce((acc, s) => acc + (planById(s.planId)?.priceCents ?? 0), 0);
    const overdue = state.subscriptions.filter((s) => s.status === "pendente").length;
    const off = state.subscriptions.filter(
      (s) => s.status === "suspenso" || s.status === "cancelado",
    ).length;
    return { mrr, active: active.length, overdue, off };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.subscriptions, state.plans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.subscriptions
      .filter((s) => (statusFilter === "todos" ? true : s.status === statusFilter))
      .filter((s) => (planFilter === "todos" ? true : s.planId === planFilter))
      .filter((s) =>
        q
          ? s.customerName.toLowerCase().includes(q) ||
            s.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
          : true,
      )
      .sort((a, b) => {
        const rank: Record<SubStatus, number> = { pendente: 0, suspenso: 1, ativo: 2, cancelado: 3 };
        return rank[a.status] - rank[b.status] || (a.nextDueDate?.localeCompare(b.nextDueDate ?? "") ?? 0);
      });
  }, [state.subscriptions, statusFilter, planFilter, query]);

  function save(sub: Subscription) {
    dispatch({ type: "sub/save", sub });
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bark-600">
          Base de clientes do Clube Navalha de Ouro. Acompanhe mensalidades, suspensões e uso dos planos.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setPlansOpen(true)}>
            <Tag size={15} /> Gerenciar planos
          </Button>
          <Button
            onClick={() => {
              setIsNew(true);
              setEditing(newSubscription(state.plans[1]?.id ?? state.plans[0]?.id ?? ""));
            }}
          >
            <Plus size={16} weight="bold" /> Novo assinante
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-bark-500">MRR · receita recorrente</p>
          <p className="tnum mt-2 font-mono text-2xl font-semibold text-ember-600">{brl(kpis.mrr)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-bark-500">Assinantes ativos</p>
          <p className="tnum mt-2 font-mono text-2xl font-semibold text-bark-900">{kpis.active}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-bark-500">Inadimplentes</p>
          <p className={`tnum mt-2 font-mono text-2xl font-semibold ${kpis.overdue > 0 ? "text-wine-500" : "text-bark-900"}`}>
            {kpis.overdue}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-bark-500">Suspensos + cancelados</p>
          <p className="tnum mt-2 font-mono text-2xl font-semibold text-bark-900">{kpis.off}</p>
        </Card>
      </div>

      {/* filtros */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1 rounded-xl bg-paper-200 p-1">
          {(["todos", "pendente", "ativo", "suspenso", "cancelado"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === s ? "bg-paper-100 text-bark-900 shadow-sm" : "text-bark-500 hover:text-bark-800"
              }`}
            >
              {s === "todos"
                ? "todos"
                : s === "pendente"
                  ? "pendentes"
                  : `${s}s`}
            </button>
          ))}
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-xl border border-sand-300 bg-paper-50 px-3 py-2 text-sm outline-none focus:border-ember-500"
        >
          <option value="todos">Todos os planos</option>
          {state.plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {brl(p.priceCents)}
            </option>
          ))}
        </select>
        <label className="relative ml-auto block">
          <input
            placeholder="Nome ou telefone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-52 rounded-xl border border-sand-300 bg-paper-50 px-3.5 py-2 text-sm outline-none placeholder:text-bark-400 focus:border-ember-500"
          />
        </label>
      </Card>

      {/* lista */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Crown size={24} />}
          title="Nenhum assinante encontrado"
          description="Ajuste os filtros ou cadastre o primeiro assinante do clube."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((sub) => {
            const plan = planById(sub.planId);
            const overdue =
              sub.status !== "cancelado" && sub.nextDueDate !== undefined && sub.nextDueDate < today;
            const limit = plan?.cutsPerMonth ?? null;
            const usagePct = limit ? Math.min(100, Math.round((sub.cutsUsedThisMonth / limit) * 100)) : null;

            return (
              <Card key={sub.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5">
                <Avatar name={sub.customerName} color={plan?.color ?? "#7c6549"} size={40} />
                <div className="min-w-40 flex-1">
                  <p className="truncate text-sm font-bold text-bark-950">{sub.customerName}</p>
                  <p className="tnum truncate text-xs text-bark-500">{sub.customerPhone}</p>
                </div>

                <div className="min-w-36">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-bark-800">
                    <span className="h-2 w-2 rounded-full" style={{ background: plan?.color }} />
                    {plan?.name ?? "—"}
                  </p>
                  <p className="tnum font-mono text-xs text-bark-500">{brl(plan?.priceCents ?? 0)}/mês</p>
                </div>

                <div className="min-w-32">
                  <p className={`tnum font-mono text-xs ${overdue ? "font-semibold text-wine-500" : "text-bark-600"}`}>
                    {sub.status === "cancelado"
                      ? "encerrado"
                      : sub.nextDueDate
                        ? `vence ${formatDateFull(sub.nextDueDate)}`
                        : "sem vencimento"}
                  </p>
                  <p className="tnum text-xs text-bark-500">
                    {limit === null
                      ? `${sub.cutsUsedThisMonth} serviços no mês`
                      : `${sub.cutsUsedThisMonth}/${limit} serviços`}
                  </p>
                  {usagePct !== null && (
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sand-200">
                      <div
                        className={`h-full rounded-full ${usagePct >= 100 ? "bg-moss-500" : "bg-ember-500"}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                  )}
                </div>

                <Badge tone={STATUS_META[sub.status].tone}>{STATUS_META[sub.status].label}</Badge>

                <div className="ml-auto flex items-center gap-1.5">
                  {(sub.status === "pendente" || sub.status === "suspenso") && (
                    <Button variant="primary" className="px-3 py-1.5 text-xs" title="Registrar pagamento da mensalidade"
                      onClick={() => dispatch({ type: "sub/markPaid", id: sub.id })}>
                      <Money size={14} weight="fill" /> Receber
                    </Button>
                  )}
                  <Button variant="ghost" className="px-2.5 py-1.5 text-xs" title="Ver detalhes" onClick={() => setDetail(sub)}>
                    <Eye size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2.5 py-1.5 text-xs"
                    title="Editar"
                    onClick={() => {
                      setIsNew(false);
                      setEditing(structuredClone(sub));
                    }}
                  >
                    <PencilSimple size={15} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* editor CRUD */}
      {editing && (
        <SubEditor
          key={editing.id}
          sub={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            save(s);
          }}
        />
      )}

      {/* detalhes */}
      {detail && (
        <SubDetailModal
          sub={detail}
          onClose={() => setDetail(null)}
          onMarkPaid={() => {
            dispatch({ type: "sub/markPaid", id: detail.id });
            setDetail(null);
          }}
          onToggleSuspend={() => {
            const next: SubStatus = detail.status === "suspenso" ? "ativo" : "suspenso";
            dispatch({ type: "sub/save", sub: { ...detail, status: next } });
            setDetail(null);
          }}
          onCancel={() => {
            if (confirm(`Cancelar a assinatura de ${detail.customerName}? O cliente sai da cobrança.`)) {
              dispatch({ type: "sub/save", sub: { ...detail, status: "cancelado" } });
            }
            setDetail(null);
          }}
          onDelete={() => {
            if (confirm("Excluir o registro deste assinante? Esta ação não volta atrás.")) {
              dispatch({ type: "sub/remove", id: detail.id });
            }
            setDetail(null);
          }}
        />
      )}

      {/* gerenciador de planos */}
      {plansOpen && (
        <Modal open onClose={() => setPlansOpen(false)} title="Planos do clube" wide>
          <div className="space-y-3">
            {state.plans.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border border-sand-300 bg-paper-50 p-4">
                <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: p.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-bark-950">
                    {p.name}
                    {p.featured && <Badge tone="accent">destaque</Badge>}
                  </p>
                  <p className="tnum font-mono text-xs text-bark-500">
                    {brl(p.priceCents)}/mês ·{" "}
                    {p.cutsPerMonth === null ? "cortes ilimitados" : `${p.cutsPerMonth} corte(s)/mês`} ·{" "}
                    {state.subscriptions.filter((s) => s.planId === p.id && s.status !== "cancelado").length}{" "}
                    assinantes
                  </p>
                </div>
                <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setEditPlan(structuredClone(p))}>
                  <PencilSimple size={13} /> Editar
                </Button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* editor de plano */}
      {editPlan && (
        <PlanEditor
          key={editPlan.id}
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSave={(p) => {
            dispatch({ type: "plan/save", plan: p });
            setEditPlan(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- editor de assinante ---------- */

function SubEditor({
  sub,
  isNew,
  onClose,
  onSave,
}: {
  sub: Subscription;
  isNew: boolean;
  onClose: () => void;
  onSave: (s: Subscription) => void;
}) {
  const { state } = useStore();
  const [draft, setDraft] = useState(sub);
  const [touched, setTouched] = useState(false);
  const valid = draft.customerName.trim().length >= 2 && draft.customerPhone.replace(/\D/g, "").length >= 10;
  const patch = (p: Partial<Subscription>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo assinante" : `Editar · ${sub.customerName}`}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" error={touched && draft.customerName.trim().length < 2 ? "Informe o nome." : undefined}>
            <input
              className={inputClass}
              value={draft.customerName}
              placeholder="Nome e sobrenome"
              onChange={(e) => patch({ customerName: e.target.value })}
              autoFocus
            />
          </Field>
          <Field
            label="WhatsApp"
            error={touched && draft.customerPhone.replace(/\D/g, "").length < 10 ? "Telefone inválido." : undefined}
          >
            <input
              className={`${inputClass} tnum`}
              value={draft.customerPhone}
              placeholder="(11) 90000-0000"
              onChange={(e) => patch({ customerPhone: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Plano">
          <div className="grid gap-2 sm:grid-cols-3">
            {state.plans.map((p) => (
              <button
                key={p.id}
                onClick={() => patch({ planId: p.id })}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all ${
                  draft.planId === p.id
                    ? "border-ember-500 bg-ember-100/60 ring-1 ring-ember-500/30"
                    : "border-sand-300 bg-paper-50 hover:border-ember-400"
                }`}
              >
                <span className="block text-sm font-bold text-bark-900">{p.name}</span>
                <span className="tnum block font-mono text-xs text-bark-500">
                  {brl(p.priceCents)}/mês
                </span>
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Forma de pagamento">
            <select
              className={`${inputClass} tnum`}
              value={draft.paymentMethod}
              onChange={(e) => patch({ paymentMethod: e.target.value as Subscription["paymentMethod"] })}
            >
              {Object.entries(METHOD_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Situação">
            <select
              value={draft.status}
              onChange={(e) => patch({ status: e.target.value as SubStatus })}
              className={inputClass}
            >
              {(Object.keys(STATUS_META) as SubStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Início">
            <input
              type="date"
              className={`${inputClass} tnum`}
              value={draft.startedAt}
              onChange={(e) => patch({ startedAt: e.target.value })}
            />
          </Field>
          <Field label="Próximo vencimento">
            <input
              type="date"
              className={`${inputClass} tnum`}
              value={draft.nextDueDate ?? ""}
              onChange={(e) => patch({ nextDueDate: e.target.value || undefined })}
            />
          </Field>
        </div>

        <Field label="Observações">
          <textarea
            className={`${inputClass} min-h-[64px] resize-y`}
            value={draft.notes ?? ""}
            placeholder="Ex.: indicado por outro cliente, cobrar presencialmente…"
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
        <button onClick={onClose} className="cursor-pointer text-sm font-semibold text-bark-500 hover:text-bark-800">
          Cancelar
        </button>
        <Button
          onClick={() => {
            setTouched(true);
            if (valid) onSave(draft);
          }}
        >
          Salvar assinante
        </Button>
      </div>
    </Modal>
  );
}

/* ---------- detalhes ---------- */

function SubDetailModal({
  sub,
  onClose,
  onMarkPaid,
  onToggleSuspend,
  onCancel,
  onDelete,
}: {
  sub: Subscription;
  onClose: () => void;
  onMarkPaid: () => void;
  onToggleSuspend: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const { state } = useStore();
  const plan = state.plans.find((p) => p.id === sub.planId);

  return (
    <Modal open onClose={onClose} title={`Clube · ${sub.customerName}`}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-300 bg-paper-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={sub.customerName} color={plan?.color ?? "#7c6549"} size={42} />
            <div>
              <p className="font-bold text-bark-950">
                Plano {plan?.name} · <span className="tnum font-mono">{brl(plan?.priceCents ?? 0)}</span>/mês
              </p>
              <p className="tnum text-xs text-bark-500">
                Assinante desde {formatDateFull(sub.startedAt)} · {METHOD_LABELS[sub.paymentMethod]}
              </p>
            </div>
          </div>
          <Badge tone={STATUS_META[sub.status].tone}>{STATUS_META[sub.status].label}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-sand-300 bg-paper-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-bark-500">Uso do mês</p>
            <p className="tnum mt-0.5 flex items-center gap-1.5 font-bold text-bark-900">
              <Scissors size={14} className="text-ember-600" />
              {sub.cutsUsedThisMonth} {plan?.cutsPerMonth === null ? "(ilimitado)" : `/ ${plan?.cutsPerMonth ?? "?"}`}
            </p>
          </div>
          <div className="rounded-xl border border-sand-300 bg-paper-100 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-bark-500">Próximo vencimento</p>
            <p className="tnum mt-0.5 font-bold text-bark-900">
              {sub.nextDueDate ? formatDateFull(sub.nextDueDate) : "—"}
            </p>
          </div>
        </div>

        {sub.notes && (
          <p className="rounded-xl bg-paper-200 px-4 py-3 text-xs leading-relaxed text-bark-600">
            <strong>Obs.:</strong> {sub.notes}
          </p>
        )}

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bark-500">
            Histórico de mensalidades ({sub.history.length})
          </p>
          {sub.history.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sand-400 px-4 py-6 text-center text-xs text-bark-500">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <ul className="max-h-44 divide-y divide-dashed divide-rule overflow-y-auto rounded-xl border border-sand-200 bg-paper-50 font-mono text-xs">
              {sub.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5">
                  <span className="tnum text-bark-600">{h.date.split("-").reverse().join("/")}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone="neutral">{METHOD_LABELS[h.method]}</Badge>
                    <span className="tnum font-medium text-bark-900">{brl(h.amountCents)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ações */}
      <div className="mt-5 space-y-2 border-t border-sand-200 pt-4">
        {sub.status !== "cancelado" && (
          <Button className="w-full" onClick={onMarkPaid}>
            <CheckCircle size={16} weight="fill" />
            Registrar mensalidade paga ({brl(plan?.priceCents ?? 0)})
          </Button>
        )}
        {sub.status === "ativo" && (
          <Button variant="secondary" className="w-full" onClick={onToggleSuspend}>
            <PauseCircle size={16} /> Suspender plano (bloqueia cortes)
          </Button>
        )}
        {sub.status === "suspenso" && (
          <Button variant="secondary" className="w-full" onClick={onToggleSuspend}>
            <PlayCircle size={16} /> Reativar plano
          </Button>
        )}
        <div className="flex gap-2 pt-1">
          {sub.status !== "cancelado" && (
            <Button variant="ghost" className="flex-1 text-xs text-wine-500 hover:bg-wine-500/10" onClick={onCancel}>
              <XCircle size={15} /> Cancelar assinatura
            </Button>
          )}
          <Button
            variant="ghost"
            className="flex-1 text-xs text-wine-500 hover:bg-wine-500/10"
            onClick={onDelete}
          >
            <TrashSimple size={15} /> Excluir registro
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- editor de plano ---------- */

function PlanEditor({
  plan,
  onClose,
  onSave,
}: {
  plan: Plan;
  onClose: () => void;
  onSave: (p: Plan) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const unlimited = draft.cutsPerMonth === null;
  const valid = draft.name.trim().length >= 2 && draft.priceCents > 0;
  const patch = (p: Partial<Plan>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Modal open onClose={onClose} title={`Plano ${plan.name}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nome">
            <input className={inputClass} value={draft.name} onChange={(e) => patch({ name: e.target.value })} autoFocus />
          </Field>
          <Field label="Preço mensal (R$)">
            <input
              type="number"
              min={0}
              step={1}
              className={`${inputClass} tnum`}
              value={draft.priceCents / 100}
              onChange={(e) => patch({ priceCents: Math.round(Number(e.target.value) * 100) || 0 })}
            />
          </Field>
        </div>

        <Field label="Serviços por mês">
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-bark-700">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => patch({ cutsPerMonth: e.target.checked ? null : Math.max(1, draft.cutsPerMonth ?? 1) })}
                className="accent-ember-600"
              />
              ilimitado
            </label>
            {!unlimited && (
              <input
                type="number"
                min={1}
                max={20}
                className={`${inputClass} tnum w-28`}
                value={draft.cutsPerMonth ?? 1}
                onChange={(e) => patch({ cutsPerMonth: Number(e.target.value) || 1 })}
              />
            )}
          </div>
        </Field>

        <Field label="Benefícios (um por linha)">
          <textarea
            className={`${inputClass} min-h-[96px] resize-y`}
            value={draft.perks.join("\n")}
            onChange={(e) => patch({ perks: e.target.value.split("\n").filter(Boolean) })}
          />
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
        <button onClick={onClose} className="cursor-pointer text-sm font-semibold text-bark-500 hover:text-bark-800">
          Cancelar
        </button>
        <Button disabled={!valid} onClick={() => valid && onSave(draft)}>
          Salvar plano
        </Button>
      </div>
    </Modal>
  );
}
