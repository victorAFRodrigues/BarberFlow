import type { Appointment, Barber, Service } from "../types";
import { minToLabel, timeToMin, toDateKey } from "./format";

export const SLOT_STEP = 30;

export interface Slot {
  startMin: number;
  label: string;
  available: boolean;
  reason?: "ocupado" | "passado";
}

function apptEnd(appt: Appointment, serviceById: Map<string, Service>): number {
  const dur = serviceById.get(appt.serviceId)?.durationMin ?? SLOT_STEP;
  return appt.startMin + dur;
}

export function computeSlots(
  barber: Barber,
  dateKey: string,
  serviceDurationMin: number,
  appointments: Appointment[],
  services: Service[],
  now: Date = new Date(),
): Slot[] {
  if (!barber.active) return [];
  const workDay = barber.schedule[fromDateKeyDay(dateKey)];
  if (!workDay?.enabled) return [];

  const open = timeToMin(workDay.start);
  const close = timeToMin(workDay.end);
  const isToday = dateKey === toDateKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const serviceById = new Map(services.map((s) => [s.id, s]));
  const dayAppts = appointments.filter(
    (a) => a.barberId === barber.id && a.date === dateKey && a.status !== "cancelado",
  );

  const slots: Slot[] = [];
  for (let t = open; t + serviceDurationMin <= close; t += SLOT_STEP) {
    const overlaps = dayAppts.some((a) => t < apptEnd(a, serviceById) && a.startMin < t + serviceDurationMin);
    const past = isToday && t <= nowMin;
    slots.push({
      startMin: t,
      label: minToLabel(t),
      available: !overlaps && !past,
      reason: overlaps ? "ocupado" : past ? "passado" : undefined,
    });
  }
  return slots;
}

function fromDateKeyDay(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
