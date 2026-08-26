import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowClockwise,
  CalendarBlank,
  Clock,
  Moon,
  Scissors,
  Sun,
  SunHorizon,
} from "@phosphor-icons/react";
import { useStore } from "../../store/store";
import { Avatar, Badge, Card } from "../../components/ui";
import { addDays, formatDateKey, toDateKey } from "../../lib/format";
import { computeSlots, type Slot } from "../../lib/slots";
import type { Barber } from "../../types";
import { BookingModal } from "./BookingModal";

export default function Agenda() {
  const { state } = useStore();
  const [params] = useSearchParams();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(() => {
    const fromUrl = params.get("servico");
    return fromUrl && state.services.some((s) => s.id === fromUrl) ? fromUrl : null;
  });
  const [barberFilterId, setBarberFilterId] = useState<string | null>(null);
  const [dateOffset, setDateOffset] = useState(0);
  const [tick, setTick] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const [booking, setBooking] = useState<{
    barberId: string;
    dateKey: string;
    startMin: number;
    serviceId: string;
  } | null>(null);

  // atualização "ao vivo" da disponibilidade
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    timer.current = window.setInterval(() => {
      setTick((t) => t + 1);
      setLastRefresh(new Date());
    }, 30_000);
    return () => window.clearInterval(timer.current);
  }, []);

  const dateKey = useMemo(() => toDateKey(addDays(new Date(), dateOffset)), [dateOffset]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => new Date(), [dateKey, tick]);

  const activeBarbers = useMemo(() => state.barbers.filter((b) => b.active), [state.barbers]);
  const activeServices = useMemo(() => state.services.filter((s) => s.active), [state.services]);

  const visibleBarbers = barberFilterId
    ? activeBarbers.filter((b) => b.id === barberFilterId)
    : activeBarbers;

  const days = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = addDays(new Date(), i);
        return { offset: i, key: toDateKey(d), dow: d.getDay(), dayNum: d.getDate() };
      }),
    [], // hoje é fixo durante a sessão de demo
  );

  const serviceById = (id: string | null) => state.services.find((s) => s.id === id);

  function openBooking(barber: Barber, slot: Slot) {
    const svc =
      (selectedServiceId && barber.serviceIds.includes(selectedServiceId)
        ? serviceById(selectedServiceId)
        : undefined) ??
      state.services.find((s) => s.active && barber.serviceIds.includes(s.id)) ??
      state.services[0];
    setBooking({
      barberId: barber.id,
      dateKey,
      startMin: slot.startMin,
      serviceId: svc.id,
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-bark-950">Agenda</h1>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-bark-600">
            Todos os profissionais, todos os horários livres agora. Escolha serviço, dia e barbeiro.
          </p>
        </div>
        <Badge tone="success">
          <ArrowClockwise size={13} weight="bold" />
          atualizado às {lastRefresh.toLocaleTimeString("pt-BR")}
        </Badge>
      </div>

      {/* seletor de dia */}
      <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {days.map((d) => {
          const active = d.offset === dateOffset;
          return (
            <button
              key={d.key}
              onClick={() => setDateOffset(d.offset)}
              className={`tnum flex w-16 shrink-0 cursor-pointer flex-col items-center rounded-xl border px-2 py-2.5 transition-all ${
                active
                  ? "border-bark-900 bg-bark-900 text-paper-50 shadow-sm"
                  : "border-sand-300 bg-paper-100 text-bark-700 hover:border-bark-400"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][d.dow]}
              </span>
              <span className="text-lg font-extrabold leading-tight">{d.dayNum}</span>
              {d.offset === 0 && (
                <span className={`text-[9px] font-bold uppercase ${active ? "text-ember-200" : "text-ember-600"}`}>
                  hoje
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* filtros */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-bark-500">
            <Scissors size={14} /> Serviço
          </span>
          {activeServices.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedServiceId(s.id === selectedServiceId ? null : s.id)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedServiceId === s.id
                  ? "border-ember-500 bg-ember-500 text-paper-50 shadow-sm shadow-ember-700/25"
                  : "border-sand-300 bg-paper-100 text-bark-600 hover:border-ember-400 hover:text-ember-700"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-bark-500">
            <CalendarBlank size={14} /> Profissional
          </span>
          <button
            onClick={() => setBarberFilterId(null)}
            className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
              barberFilterId === null
                ? "border-bark-900 bg-bark-900 text-paper-50"
                : "border-sand-300 bg-paper-100 text-bark-600 hover:border-bark-400"
            }`}
          >
            Todos
          </button>
          {activeBarbers.map((b) => (
            <button
              key={b.id}
              onClick={() => setBarberFilterId(b.id === barberFilterId ? null : b.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3.5 text-xs font-semibold transition-all ${
                barberFilterId === b.id
                  ? "border-bark-900 bg-bark-900 text-paper-50"
                  : "border-sand-300 bg-paper-100 text-bark-600 hover:border-bark-400"
              }`}
            >
              <Avatar name={b.name} color={b.color} size={22} />
              {b.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* grade por barbeiro */}
      <div className="mt-7 space-y-5">
        {visibleBarbers.map((barber) => {
          const worksThisDay = barber.schedule[new Date(dateKey + "T12:00:00").getDay()]?.enabled;
          const offersSelected = !selectedServiceId || barber.serviceIds.includes(selectedServiceId);
          const svc = selectedServiceId ? serviceById(selectedServiceId) : undefined;
          const slots = offersSelected
            ? computeSlots(
                barber,
                dateKey,
                svc?.durationMin ?? 30,
                state.appointments,
                state.services,
                now,
              )
            : [];
          const freeCount = slots.filter((s) => s.available).length;

          return (
            <Card key={`${barber.id}-${dateKey}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={barber.name} color={barber.color} size={40} />
                  <div>
                    <p className="font-bold text-bark-950">{barber.name}</p>
                    <p className="text-xs text-bark-500">{barber.role}</p>
                  </div>
                </div>
                {!worksThisDay ? (
                  <Badge tone="neutral">{formatDateKey(dateKey)} · folga</Badge>
                ) : !offersSelected ? (
                  <Badge tone="warning">não atende este serviço</Badge>
                ) : (
                  <Badge tone={freeCount > 0 ? "success" : "danger"}>
                    {freeCount > 0 ? `${freeCount} horários livres` : "sem horários livres"}
                  </Badge>
                )}
              </div>

              {worksThisDay && offersSelected && <SlotGrid slots={slots} onPick={(s) => openBooking(barber, s)} />}
            </Card>
          );
        })}
      </div>

      {booking && (
        <BookingModal
          booking={booking}
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}

function SlotGrid({ slots, onPick }: { slots: Slot[]; onPick: (s: Slot) => void }) {
  if (slots.length === 0) {
    return <p className="px-5 py-8 text-center text-sm text-bark-500">Nenhum horário gerado para este dia.</p>;
  }
  const groups: Array<{ label: string; icon: typeof Sun; items: Slot[] }> = [
    { label: "Manhã", icon: Sun, items: slots.filter((s) => s.startMin < 12 * 60) },
    { label: "Tarde", icon: SunHorizon, items: slots.filter((s) => s.startMin >= 12 * 60 && s.startMin < 18 * 60) },
    { label: "Noite", icon: Moon, items: slots.filter((s) => s.startMin >= 18 * 60) },
  ];

  return (
    <div className="space-y-4 px-5 py-4">
      {groups
        .filter((g) => g.items.length > 0)
        .map(({ label, icon: Icon, items }) => (
          <div key={label}>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-bark-500">
              <Icon size={13} /> {label}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {items.map((slot) => (
                <button
                  key={slot.startMin}
                  disabled={!slot.available}
                  onClick={() => onPick(slot)}
                  title={
                    slot.reason === "ocupado"
                      ? "Ocupado"
                      : slot.reason === "passado"
                        ? "Horário já passou"
                        : "Disponível"
                  }
                  className={`tnum flex items-center justify-center gap-1 rounded-lg border px-1 py-2 text-sm font-semibold transition-all ${
                    slot.available
                      ? "cursor-pointer border-ember-500/45 bg-paper-50 text-bark-800 hover:border-ember-500 hover:bg-ember-500 hover:text-paper-50 active:scale-[0.96]"
                      : "cursor-not-allowed border-transparent bg-sand-200/70 text-bark-400 line-through decoration-bark-400/50"
                  }`}
                >
                  {!slot.available && slot.reason === "passado" && <Clock size={12} />}
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

