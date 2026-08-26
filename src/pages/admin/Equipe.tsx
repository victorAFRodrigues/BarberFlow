import { useMemo, useState } from "react";
import {
  Briefcase,
  CalendarDots,
  Money,
  PencilSimple,
  Plus,
  TrashSimple,
  UserCircle,
} from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import { Avatar, Badge, Button, Card, EmptyState, Field, Modal, Toggle, inputClass } from "../../components/ui";
import { brl, minToLabel, timeToMin, toDateKey } from "../../lib/format";
import { WEEKDAY_LABELS, type Barber, type Schedule } from "../../types";

const COLORS = ["#c96b2e", "#6d7f4b", "#9c4a38", "#7c6549", "#ad571f", "#57653a"];

function emptySchedule(): Schedule {
  return Object.fromEntries(
    Array.from({ length: 7 }, (_, d) => [d, { enabled: false, start: "09:00", end: "18:00" }]),
  ) as Schedule;
}

function newBarber(): Barber {
  return {
    id: crypto.randomUUID(),
    name: "",
    role: "",
    phone: "",
    active: true,
    commissionPct: 30,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    schedule: emptySchedule(),
    serviceIds: [],
  };
}

export default function Equipe() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Barber | null>(null);
  const [isNew, setIsNew] = useState(false);

  const stats = useMemo(() => {
    const map = new Map<string, { monthCents: number; upcoming: number }>();
    const nowKey = toDateKey(new Date()).slice(0, 7);
    for (const b of state.barbers) map.set(b.id, { monthCents: 0, upcoming: 0 });
    for (const a of state.appointments) {
      if (a.status === "cancelado") continue;
      const entry = map.get(a.barberId);
      if (!entry) continue;
      if (a.date.slice(0, 7) === nowKey) entry.monthCents += a.payment.totalCents;
      if (a.status === "confirmado") entry.upcoming += 1;
    }
    return map;
  }, [state]);

  function save(barber: Barber) {
    dispatch({ type: "barber/save", barber });
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bark-600">
          Configure dias de trabalho, serviços atendidos e a comissão de cada barbeiro — tudo reflete
          na agenda pública em tempo real.
        </p>
        <Button
          onClick={() => {
            setIsNew(true);
            setEditing(newBarber());
          }}
        >
          <Plus size={16} weight="bold" /> Novo barbeiro
        </Button>
      </div>

      {state.barbers.length === 0 ? (
        <EmptyState
          icon={<UserCircle size={24} />}
          title="Nenhum barbeiro cadastrado"
          description="Cadastre sua equipe para começar a receber agendamentos."
          action={
            <Button
              onClick={() => {
                setIsNew(true);
                setEditing(newBarber());
              }}
            >
              <Plus size={16} weight="bold" /> Cadastrar primeiro barbeiro
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.barbers.map((barber) => {
            const s = stats.get(barber.id)!;
            return (
              <Card key={barber.id} className={`flex flex-col p-5 ${!barber.active ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar name={barber.name || "?"} color={barber.color} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-bark-950">{barber.name || "(sem nome)"}</p>
                    <p className="truncate text-xs text-bark-500">{barber.role}</p>
                  </div>
                  <Badge tone={barber.active ? "success" : "neutral"}>{barber.active ? "ativo" : "inativo"}</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-paper-200 p-3 text-center">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-bark-500">Comissão</dt>
                    <dd className="tnum text-base font-extrabold text-ember-600">{barber.commissionPct}%</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-bark-500">Mês</dt>
                    <dd className="tnum text-base font-extrabold text-bark-900">{brl(s.monthCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-bark-500">Futuros</dt>
                    <dd className="tnum text-base font-extrabold text-bark-900">{s.upcoming}</dd>
                  </div>
                </dl>

                <ul className="mt-4 space-y-1.5 text-xs text-bark-600">
                  {WEEKDAY_LABELS.map((label, d) => {
                    const wd = barber.schedule[d];
                    if (!wd?.enabled) return null;
                    return (
                      <li key={label} className="flex items-center gap-2 tnum">
                        <CalendarDots size={13} className="shrink-0 text-bark-400" />
                        <span className="w-16 shrink-0">{label.slice(0, 3)}</span>
                        {wd.start} – {wd.end}
                      </li>
                    );
                  })}
                  {Object.values(barber.schedule).every((d) => !d.enabled) && (
                    <li className="text-bark-400">Sem dias configurados</li>
                  )}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
                  <span className="text-xs text-bark-500">{barber.serviceIds.length} serviços</span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5"
                      onClick={() => {
                        setIsNew(false);
                        setEditing(structuredClone(barber));
                      }}
                    >
                      <PencilSimple size={14} /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1.5 text-wine-500 hover:bg-wine-500/10"
                      aria-label={`Excluir ${barber.name}`}
                      onClick={() => {
                        if (confirm(`Excluir ${barber.name}? Os agendamentos dele serão removidos.`)) {
                          dispatch({ type: "barber/remove", id: barber.id });
                        }
                      }}
                    >
                      <TrashSimple size={15} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <BarberEditor
          key={editing.id}
          barber={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function BarberEditor({
  barber,
  isNew,
  onClose,
  onSave,
}: {
  barber: Barber;
  isNew: boolean;
  onClose: () => void;
  onSave: (b: Barber) => void;
}) {
  const { state } = useStore();
  const [draft, setDraft] = useState<Barber>(structuredClone(barber));
  const [tab, setTab] = useState<"dados" | "dias" | "servicos" | "comissao">("dados");
  const [touched, setTouched] = useState(false);

  const valid = draft.name.trim().length >= 2;
  const patch = (p: Partial<Barber>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Modal open onClose={onClose} wide title={isNew ? "Novo barbeiro" : `Editar · ${barber.name}`}>
      {/* tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-paper-200 p-1">
        {(
          [
            ["dados", "Dados"],
            ["comissao", "Comissão"],
            ["dias", "Dias de trabalho"],
            ["servicos", `Serviços (${draft.serviceIds.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === id ? "bg-paper-100 text-bark-900 shadow-sm" : "text-bark-500 hover:text-bark-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="space-y-4">
          <Field label="Nome completo" error={touched && !valid ? "Informe ao menos nome e sobrenome." : undefined}>
            <input
              className={inputClass}
              value={draft.name}
              placeholder="Ex.: João da Navalha"
              onChange={(e) => patch({ name: e.target.value })}
              autoFocus
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cargo / especialidade">
              <input
                className={inputClass}
                value={draft.role}
                placeholder="Ex.: Barbeiro Master"
                onChange={(e) => patch({ role: e.target.value })}
              />
            </Field>
            <Field label="Telefone">
              <input
                className={`${inputClass} tnum`}
                value={draft.phone}
                placeholder="(11) 90000-0000"
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Cor do perfil" hint="Usada nos avatares e gráficos.">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Cor ${c}`}
                  onClick={() => patch({ color: c })}
                  className={`h-8 w-8 cursor-pointer rounded-full transition-transform ${
                    draft.color === c ? "scale-110 ring-2 ring-bark-900 ring-offset-2 ring-offset-paper-100" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-sand-300 bg-paper-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-bark-900">Barbeiro ativo</p>
              <p className="text-xs text-bark-500">Inativar cancela agendamentos futuros dele.</p>
            </div>
            <Toggle checked={draft.active} onChange={(v) => patch({ active: v })} label="Ativo" />
          </div>
        </div>
      )}

      {tab === "comissao" && (
        <div className="space-y-5">
          <Field label="Porcentagem de comissão" hint="Calculada sobre o preço bruto do serviço.">
            <div className="rounded-xl border border-sand-300 bg-paper-50 px-4 py-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="tnum text-3xl font-extrabold text-ember-600">{draft.commissionPct}%</span>
                <span className="text-xs text-bark-500">
                  ex.: combo de {brl(8000)} → {brl(Math.round(8000 * (draft.commissionPct / 100)))} por atendimento
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={5}
                value={draft.commissionPct}
                onChange={(e) => patch({ commissionPct: Number(e.target.value) })}
                className="w-full accent-ember-600 cursor-pointer"
              />
              <div className="tnum mt-1 flex justify-between text-[10px] font-bold text-bark-400">
                <span>0%</span><span>35%</span><span>70%</span>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-4 gap-2">
            {[20, 30, 40, 50].map((v) => (
              <button
                key={v}
                onClick={() => patch({ commissionPct: v })}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-sm font-bold transition-all ${
                  draft.commissionPct === v
                    ? "border-ember-500 bg-ember-100 text-ember-700"
                    : "border-sand-300 bg-paper-50 text-bark-600 hover:border-ember-400"
                }`}
              >
                <Money size={14} className="mx-auto mb-0.5" /> {v}%
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "dias" && (
        <div className="overflow-hidden rounded-xl border border-sand-300">
          {WEEKDAY_LABELS.map((label, d) => {
            const wd = draft.schedule[d];
            const update = (p: Partial<typeof wd>) =>
              patch({ schedule: { ...draft.schedule, [d]: { ...wd, ...p } } });
            return (
              <div
                key={label}
                className={`flex flex-wrap items-center gap-3 border-b border-sand-200 px-4 py-3 last:border-b-0 ${
                  wd.enabled ? "bg-paper-50" : "bg-paper-100/60"
                }`}
              >
                <Toggle checked={wd.enabled} onChange={(v) => update({ enabled: v })} label={label} />
                <span className={`w-20 text-sm ${wd.enabled ? "font-bold text-bark-900" : "text-bark-400"}`}>
                  {label}
                </span>
                <div className={`ml-auto flex items-center gap-2 ${wd.enabled ? "" : "opacity-35 pointer-events-none"}`}>
                  <select
                    className="tnum rounded-lg border border-sand-300 bg-paper-50 px-2 py-1.5 text-sm outline-none focus:border-ember-500"
                    value={wd.start}
                    onChange={(e) => update({ start: e.target.value })}
                    aria-label={`${label} início`}
                  >
                    {timeOptions()}
                  </select>
                  <span className="text-bark-400">–</span>
                  <select
                    className="tnum rounded-lg border border-sand-300 bg-paper-50 px-2 py-1.5 text-sm outline-none focus:border-ember-500"
                    value={wd.end}
                    onChange={(e) => update({ end: e.target.value })}
                    aria-label={`${label} fim`}
                  >
                    {timeOptions()}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "servicos" && (
        <div>
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-paper-200 px-3.5 py-2.5 text-xs leading-relaxed text-bark-600">
            <Briefcase size={14} className="mt-0.5 shrink-0 text-ember-600" />
            Marque o que este barbeiro atende. Só aparecerá na agenda pública o que estiver marcado aqui.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {state.services.filter((s) => s.active).map((svc) => {
              const checked = draft.serviceIds.includes(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() =>
                    patch({
                      serviceIds: checked
                        ? draft.serviceIds.filter((id) => id !== svc.id)
                        : [...draft.serviceIds, svc.id],
                    })
                  }
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                    checked
                      ? "border-ember-500 bg-ember-100/60 ring-1 ring-ember-500/30"
                      : "border-sand-300 bg-paper-50 hover:border-ember-400"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-bark-900">{svc.name}</span>
                    <span className="block text-xs text-bark-500">
                      {svc.durationMin} min · {brl(svc.priceCents)}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                      checked ? "border-ember-500 bg-ember-500 text-paper-50" : "border-sand-400"
                    }`}
                  >
                    {checked && "✓"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* rodapé fixo */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-sand-200 pt-4">
        <button
          onClick={onClose}
          className="cursor-pointer text-sm font-semibold text-bark-500 hover:text-bark-800"
        >
          Cancelar
        </button>
        <Button
          onClick={() => {
            setTouched(true);
            if (!valid) {
              setTab("dados");
              return;
            }
            onSave(draft);
          }}
        >
          Salvar alterações
        </Button>
      </div>
    </Modal>
  );
}

function timeOptions(): React.ReactNode[] {
  const opts: React.ReactNode[] = [];
  for (let m = timeToMin("07:00"); m <= timeToMin("23:00"); m += 30) {
    const label = minToLabel(m);
    opts.push(
      <option key={label} value={label}>
        {label}
      </option>,
    );
  }
  return opts;
}
