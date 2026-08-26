import { useMemo, useState } from "react";
import {
  Clock,
  Money,
  PencilSimple,
  Plus,
  Scissors,
  Sparkle,
  Star,
  TrashSimple,
} from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, Modal, Toggle, inputClass } from "../../components/ui";
import { brl } from "../../lib/format";
import { CATEGORY_LABELS, type Service, type ServiceCategory } from "../../types";

const CATEGORY_ICON: Record<ServiceCategory, typeof Scissors> = {
  cabelo: Scissors,
  barba: Star,
  combo: Sparkle,
  tratamento: Clock,
};

function newService(): Service {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    priceCents: 4000,
    durationMin: 40,
    category: "cabelo",
    active: true,
  };
}

export default function Servicos() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of state.barbers) {
      for (const sid of b.serviceIds) map.set(sid, (map.get(sid) ?? 0) + 1);
    }
    return map;
  }, [state.barbers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bark-600">
          Catálogo de serviços. Preço e duração alimentam o checkout e os slots da agenda.
        </p>
        <Button
          onClick={() => {
            setIsNew(true);
            setEditing(newService());
          }}
        >
          <Plus size={16} weight="bold" /> Novo serviço
        </Button>
      </div>

      {state.services.length === 0 ? (
        <EmptyState
          icon={<Scissors size={24} />}
          title="Nenhum serviço no catálogo"
          description="Crie os serviços da casa para que os barbeiros possam atendê-los."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {state.services.map((svc) => {
            const Icon = CATEGORY_ICON[svc.category];
            return (
              <Card key={svc.id} className={`flex flex-col p-5 ${!svc.active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand-200 text-bark-700">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <Badge tone={svc.active ? "success" : "neutral"}>{svc.active ? "ativo" : "inativo"}</Badge>
                </div>
                <h3 className="mt-3 font-bold text-bark-950">{svc.name || "(sem nome)"}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-bark-600">{svc.description}</p>
                <p className="mt-3 tnum text-lg font-extrabold text-bark-950">{brl(svc.priceCents)}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-bark-500">
                  <Clock size={13} /> {svc.durationMin} min
                  <span>·</span> {CATEGORY_LABELS[svc.category]}
                  <span>·</span> {(usage.get(svc.id) ?? 0)} barbeiro(s)
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
                  <Toggle
                    checked={svc.active}
                    onChange={(v) => dispatch({ type: "service/save", service: { ...svc, active: v } })}
                    label={`Ativo: ${svc.name}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5"
                      onClick={() => {
                        setIsNew(false);
                        setEditing(structuredClone(svc));
                      }}
                    >
                      <PencilSimple size={14} /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1.5 text-wine-500 hover:bg-wine-500/10"
                      aria-label={`Excluir ${svc.name}`}
                      onClick={() => {
                        if (confirm(`Excluir "${svc.name}"? Ele sai das agendas de todos os barbeiros.`)) {
                          dispatch({ type: "service/remove", id: svc.id });
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
        <ServiceEditor
          key={editing.id}
          service={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            dispatch({ type: "service/save", service: s });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ServiceEditor({
  service,
  isNew,
  onClose,
  onSave,
}: {
  service: Service;
  isNew: boolean;
  onClose: () => void;
  onSave: (s: Service) => void;
}) {
  const [draft, setDraft] = useState(service);
  const [touched, setTouched] = useState(false);
  const valid = draft.name.trim().length >= 2 && draft.priceCents > 0;
  const patch = (p: Partial<Service>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo serviço" : `Editar · ${service.name}`}>
      <div className="space-y-4">
        <Field label="Nome" error={touched && draft.name.trim().length < 2 ? "Informe o nome do serviço." : undefined}>
          <input
            className={inputClass}
            value={draft.name}
            placeholder="Ex.: Combo Corte + Barba"
            onChange={(e) => patch({ name: e.target.value })}
            autoFocus
          />
        </Field>

        <Field label="Descrição">
          <textarea
            className={`${inputClass} min-h-[84px] resize-y`}
            value={draft.description}
            placeholder="O que está incluído, como é feito…"
            onChange={(e) => patch({ description: e.target.value })}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preço (R$)" error={touched && draft.priceCents <= 0 ? "Preço deve ser maior que zero." : undefined}>
            <div className="relative">
              <Money size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-bark-400" />
              <input
                type="number"
                min={0}
                step={5}
                className={`${inputClass} tnum pl-9`}
                value={draft.priceCents / 100}
                onChange={(e) => patch({ priceCents: Math.round(Number(e.target.value) * 100) || 0 })}
              />
            </div>
          </Field>
          <Field label="Duração (minutos)" hint="Define quantos slots o serviço ocupa na agenda.">
            <select
              className={`${inputClass} tnum`}
              value={draft.durationMin}
              onChange={(e) => patch({ durationMin: Number(e.target.value) })}
            >
              {[15, 30, 40, 45, 50, 60, 75, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutos
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Categoria">
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_LABELS) as ServiceCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => patch({ category: cat })}
                className={`cursor-pointer rounded-xl border px-2 py-2 text-xs font-bold transition-all ${
                  draft.category === cat
                    ? "border-ember-500 bg-ember-100 text-ember-700"
                    : "border-sand-300 bg-paper-50 text-bark-600 hover:border-ember-400"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-sand-300 bg-paper-50 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-bark-900">Serviço ativo</p>
            <p className="text-xs text-bark-500">Inativos ficam ocultos na agenda pública.</p>
          </div>
          <Toggle checked={draft.active} onChange={(v) => patch({ active: v })} label="Ativo" />
        </div>
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
          Salvar serviço
        </Button>
      </div>
    </Modal>
  );
}
