import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Receipt,
  Tag,
  TrashSimple,
  PencilSimple,
} from "@phosphor-icons/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useStore } from "../../store/store";
import { Badge, Button, Card, EmptyState, Field, Modal, inputClass } from "../../components/ui";
import { brl, monthKey, monthLabel, toDateKey } from "../../lib/format";
import type { Transaction, TransactionType } from "../../types";

const REVENUE_CATEGORIES = [
  { id: "pix", label: "PIX" },
  { id: "credito", label: "Crédito" },
  { id: "debito", label: "Débito" },
  { id: "avulso", label: "Avulso" },
];

export default function Financeiro() {
  const { state, dispatch } = useStore();
  const thisMonth = toDateKey(new Date()).slice(0, 7);

  const [typeFilter, setTypeFilter] = useState<TransactionType | "todos">("todos");
  const [categoryFilter, setCategoryFilter] = useState<string>("todas");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [isNew, setIsNew] = useState(false);

  const totals = useMemo(() => {
    const inMonth = (t: Transaction) => t.date.slice(0, 7) === thisMonth;
    return {
      receitas: state.transactions.filter((t) => t.type === "receita" && inMonth(t)).reduce((a, t) => a + t.amountCents, 0),
      despesas: state.transactions.filter((t) => t.type === "despesa" && inMonth(t)).reduce((a, t) => a + t.amountCents, 0),
      saldoTotal:
        state.transactions.filter((t) => t.type === "receita").reduce((a, t) => a + t.amountCents, 0) -
        state.transactions.filter((t) => t.type === "despesa").reduce((a, t) => a + t.amountCents, 0),
    };
  }, [state.transactions, thisMonth]);

  const categoryLabel = (id: string): string => {
    if (id === "pix") return "PIX";
    if (id === "credito") return "Crédito";
    if (id === "debito") return "Débito";
    return state.expenseCategories.find((c) => c.id === id)?.label ?? id;
  };

  const expenseDonut = useMemo(() => {
    return state.expenseCategories
      .map((c) => ({
        name: c.label,
        color: c.color,
        value: state.transactions
          .filter((t) => t.type === "despesa" && t.categoryId === c.id && t.date.slice(0, 7) === thisMonth)
          .reduce((a, t) => a + t.amountCents, 0) / 100,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [state, thisMonth]);

  const monthlyBars = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map((mk) => ({
      mes: monthLabel(mk),
      receitas:
        state.transactions
          .filter((t) => t.type === "receita" && monthKey(t.date) === mk)
          .reduce((a, t) => a + t.amountCents, 0) / 100,
      despesas:
        state.transactions
          .filter((t) => t.type === "despesa" && monthKey(t.date) === mk)
          .reduce((a, t) => a + t.amountCents, 0) / 100,
    }));
  }, [state.transactions]);

  const rows = useMemo(() => {
    return state.transactions
      .filter((t) => (typeFilter === "todos" ? true : t.type === typeFilter))
      .filter((t) =>
        categoryFilter === "todas"
          ? true
          : typeFilter === "despesa"
            ? t.categoryId === categoryFilter
            : t.categoryId === categoryFilter,
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.transactions, typeFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-bark-500">
            <ArrowUp size={15} weight="bold" className="text-moss-500" /> Receitas · {monthLabel(thisMonth)}
          </p>
          <p className="tnum mt-2 text-2xl font-extrabold text-moss-600">{brl(totals.receitas)}</p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-bark-500">
            <ArrowDown size={15} weight="bold" className="text-wine-500" /> Despesas · {monthLabel(thisMonth)}
          </p>
          <p className="tnum mt-2 text-2xl font-extrabold text-wine-500">{brl(totals.despesas)}</p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-bark-500">
            Saldo acumulado
          </p>
          <p
            className={`tnum mt-2 text-2xl font-extrabold ${
              totals.saldoTotal >= 0 ? "text-bark-900" : "text-wine-500"
            }`}
          >
            {brl(totals.saldoTotal)}
          </p>
        </Card>
      </div>

      {/* gráficos */}
      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h3 className="mb-4 font-bold text-bark-900">Receitas × Despesas por mês</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBars} margin={{ top: 4, right: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0d2b4" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#7c6549" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#7c6549" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  formatter={(value) => brl(Number(value) * 100)}
                  cursor={{ fill: "rgba(201,107,46,0.06)" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e0d2b4", background: "#fbf7ee", fontSize: 13 }}
                />
                <Bar dataKey="receitas" name="Receitas" fill="#6d7f4b" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="despesas" name="Despesas" fill="#9c4a38" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 flex items-center justify-between font-bold text-bark-900">
            Despesas por categoria
            <Badge tone="neutral">{monthLabel(thisMonth)}</Badge>
          </h3>
          {expenseDonut.length === 0 ? (
            <EmptyState icon={<Receipt size={22} />} title="Sem despesas no mês" description="Lance despesas para ver o gráfico." />
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseDonut} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
                      {expenseDonut.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => brl(Number(value) * 100)}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e0d2b4", background: "#fbf7ee", fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1.5">
                {expenseDonut.slice(0, 5).map((e) => (
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

      {/* lançamentos */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-sand-200 p-4">
          <div className="flex gap-1 rounded-xl bg-paper-200 p-1">
            {(["todos", "receita", "despesa"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                  typeFilter === t ? "bg-paper-100 text-bark-900 shadow-sm" : "text-bark-500 hover:text-bark-800"
                }`}
              >
                {t === "todos" ? "todos" : `${t}s`}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-sand-300 bg-paper-50 px-3 py-2 text-sm outline-none focus:border-ember-500"
          >
            <option value="todas">Todas as categorias</option>
            {(typeFilter === "despesa"
              ? state.expenseCategories.map((c) => ({ id: c.id, label: c.label }))
              : [...REVENUE_CATEGORIES, ...state.expenseCategories]
            ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="ml-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={() => alert("Gerenciar categorias: adicione/remova categorias de despesa abaixo do gráfico (MVP simplificado).")}
              title="Categorias de despesa"
            >
              <Tag size={15} /> Categorias
            </Button>
            <Button
              onClick={() => {
                setIsNew(true);
                setEditing({
                  id: crypto.randomUUID(),
                  type: "despesa",
                  categoryId: state.expenseCategories[0]?.id ?? "produtos",
                  description: "",
                  amountCents: 0,
                  date: toDateKey(new Date()),
                });
              }}
            >
              <Plus size={16} weight="bold" /> Novo lançamento
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Receipt size={24} />}
            title="Nenhum lançamento"
            description="Receitas de agendamentos entram automaticamente. Você também pode lançar receitas e despesas manuais."
          />
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-sand-300 bg-paper-200 text-[11px] uppercase tracking-wide text-bark-600">
                  <th className="px-5 py-3 font-bold">Data</th>
                  <th className="px-4 py-3 font-bold">Descrição</th>
                  <th className="px-4 py-3 font-bold">Categoria</th>
                  <th className="px-4 py-3 text-right font-bold">Valor</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 bg-paper-50">
                {rows.slice(0, 120).map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-paper-200/50">
                    <td className="tnum px-5 py-3 whitespace-nowrap text-bark-600">
                      {t.date.split("-").reverse().join("/")}
                    </td>
                    <td className="px-4 py-3">
                      {t.description || "—"}
                      {t.appointmentId && (
                        <Badge tone="info">
                          auto · agendamento
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={t.type === "receita" ? "success" : "neutral"}>{categoryLabel(t.categoryId)}</Badge>
                    </td>
                    <td
                      className={`tnum px-4 py-3 text-right font-bold ${
                        t.type === "receita" ? "text-moss-600" : "text-wine-500"
                      }`}
                    >
                      {t.type === "receita" ? "+" : "−"}
                      {brl(t.amountCents)}
                    </td>
                    <td className="px-2 py-3">
                      {!t.appointmentId && (
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label="Editar lançamento"
                            className="cursor-pointer rounded-lg p-1.5 text-bark-500 hover:bg-sand-200 hover:text-bark-800"
                            onClick={() => {
                              setIsNew(false);
                              setEditing(structuredClone(t));
                            }}
                          >
                            <PencilSimple size={14} />
                          </button>
                          <button
                            aria-label="Excluir lançamento"
                            className="cursor-pointer rounded-lg p-1.5 text-bark-500 hover:bg-wine-500/10 hover:text-wine-500"
                            onClick={() => confirm("Excluir este lançamento?") && dispatch({ type: "tx/remove", id: t.id })}
                          >
                            <TrashSimple size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* gerenciador rápido de categorias */}
      <Card className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-bark-900">
          <Tag size={17} weight="duotone" className="text-ember-600" />
          Categorias de despesa
        </h3>
        <div className="flex flex-wrap gap-2">
          {state.expenseCategories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-paper-50 py-1 pl-3 pr-2 text-sm font-semibold text-bark-700"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              {c.label}
              <button
                aria-label={`Remover ${c.label}`}
                className="cursor-pointer rounded-full p-0.5 text-bark-400 hover:bg-wine-500/10 hover:text-wine-500"
                onClick={() => {
                  const used = state.transactions.some((t) => t.categoryId === c.id);
                  if (used) {
                    alert("Existem lançamentos nesta categoria. Remova-os primeiro.");
                    return;
                  }
                  dispatch({ type: "category/remove", id: c.id });
                }}
              >
                ✕
              </button>
            </span>
          ))}
          <NewCategoryButton />
        </div>
      </Card>

      {editing && (
        <TxEditor
          key={editing.id}
          tx={editing}
          isNew={isNew}
          onClose={() => setEditing(null)}
          onSave={(tx) => {
            dispatch({ type: "tx/save", tx });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function NewCategoryButton() {
  const { state, dispatch } = useStore();
  return (
    <button
      onClick={() => {
        const label = prompt("Nome da nova categoria:");
        if (!label?.trim()) return;
        const id = label
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-");
        if (state.expenseCategories.some((c) => c.id === id)) {
          alert("Categoria já existe.");
          return;
        }
        const palette = ["#7c6549", "#c96b2e", "#6d7f4b", "#9c4a38", "#a08868", "#dd8a45"];
        dispatch({
          type: "category/save",
          category: {
            id,
            label: label.trim(),
            color: palette[state.expenseCategories.length % palette.length],
          },
        });
      }}
      className="cursor-pointer rounded-full border border-dashed border-sand-400 px-3 py-1 text-sm font-semibold text-bark-600 transition-colors hover:border-ember-500 hover:text-ember-600"
    >
      + nova categoria
    </button>
  );
}

function TxEditor({
  tx,
  isNew,
  onClose,
  onSave,
}: {
  tx: Transaction;
  isNew: boolean;
  onClose: () => void;
  onSave: (t: Transaction) => void;
}) {
  const { state } = useStore();
  const [draft, setDraft] = useState(tx);
  const [touched, setTouched] = useState(false);
  const valid = draft.description.trim().length >= 2 && draft.amountCents > 0;
  const patch = (p: Partial<Transaction>) => setDraft((d) => ({ ...d, ...p }));

  const categories =
    draft.type === "despesa"
      ? state.expenseCategories.map((c) => ({ id: c.id, label: c.label }))
      : REVENUE_CATEGORIES;

  return (
    <Modal open onClose={onClose} title={isNew ? "Novo lançamento" : "Editar lançamento"}>
      <div className="space-y-4">
        <Field label="Tipo">
          <div className="grid grid-cols-2 gap-2">
            {(["receita", "despesa"] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => patch({ type: t, categoryId: t === "receita" ? "avulso" : categories[0].id })}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-bold capitalize transition-all ${
                  draft.type === t
                    ? t === "receita"
                      ? "border-moss-500 bg-moss-500/10 text-moss-600"
                      : "border-wine-500 bg-wine-500/10 text-wine-500"
                    : "border-sand-300 bg-paper-50 text-bark-600 hover:border-bark-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor (R$)" error={touched && draft.amountCents <= 0 ? "Informe um valor." : undefined}>
            <input
              type="number"
              min={0}
              step="0.01"
              className={`${inputClass} tnum`}
              value={draft.amountCents / 100}
              onChange={(e) => patch({ amountCents: Math.round(Number(e.target.value) * 100) || 0 })}
            />
          </Field>
          <Field label="Data">
            <input
              type="date"
              className={`${inputClass} tnum`}
              value={draft.date}
              onChange={(e) => patch({ date: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Descrição" error={touched && draft.description.trim().length < 2 ? "Descreva o lançamento." : undefined}>
          <input
            className={inputClass}
            value={draft.description}
            placeholder={draft.type === "despesa" ? "Ex.: Reposição de toalhas" : "Ex.: Venda de pomada"}
            onChange={(e) => patch({ description: e.target.value })}
            autoFocus
          />
        </Field>

        <Field label="Categoria">
          <select
            className={inputClass}
            value={draft.categoryId}
            onChange={(e) => patch({ categoryId: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
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
          Salvar lançamento
        </Button>
      </div>
    </Modal>
  );
}
