const brlFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function brl(cents: number): string {
  return brlFmt.format(cents / 100);
}

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** data local -> yyyy-mm-dd (sem UTC shift) */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

/** "09:30" -> minutos desde meia-noite */
export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutos -> "09:30" */
export function minToLabel(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function formatDateKey(key: string): string {
  const d = fromDateKey(key);
  return `${WEEKDAY_SHORT[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTH_SHORT[d.getMonth()]}`;
}

export function formatDateFull(key: string): string {
  const d = fromDateKey(key);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function monthKey(key: string): string {
  return key.slice(0, 7);
}

export function monthLabel(mKey: string): string {
  const [, m] = mKey.split("-").map(Number);
  return MONTH_SHORT[m - 1];
}

/** soma n meses a uma data yyyy-mm-dd (clamp no fim do mês) */
export function addMonthsKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const target = new Date(y, m - 1 + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return toDateKey(target);
}
