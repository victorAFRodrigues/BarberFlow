import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  CreditCard,
  Lock,
  Money,
  PixLogo,
  User,
} from "@phosphor-icons/react";
import { computeFee, useStore } from "../../store/store";
import { Avatar, Badge, Button, Field, Modal, inputClass } from "../../components/ui";
import { brl, formatDateFull, minToLabel } from "../../lib/format";
import type { PaymentMethod } from "../../types";

interface BookingInfo {
  barberId: string;
  dateKey: string;
  startMin: number;
  serviceId: string;
}

const METHODS: Array<{ id: PaymentMethod; label: string; icon: typeof PixLogo; hint: string }> = [
  { id: "pix", label: "PIX", icon: PixLogo, hint: "aprovação imediata · taxa ~1%" },
  { id: "credito", label: "Crédito", icon: CreditCard, hint: "até 3x sem juros" },
  { id: "debito", label: "Débito", icon: Money, hint: "à vista" },
];

export function BookingModal({
  booking,
  onClose,
}: {
  booking: BookingInfo | null;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState<"dados" | "pagamento" | "sucesso">("dados");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [touched, setTouched] = useState(false);
  const [apptCode, setApptCode] = useState("");

  const barber = state.barbers.find((b) => b.id === booking?.barberId);
  const service = state.services.find((s) => s.id === booking?.serviceId);

  const breakdown = useMemo(() => {
    if (!barber || !service) return null;
    const totalCents = service.priceCents;
    const feeCents = computeFee(method, totalCents);
    const commissionCents = Math.round((totalCents * barber.commissionPct) / 100);
    return { totalCents, feeCents, commissionCents, houseCents: totalCents - feeCents - commissionCents };
  }, [barber, service, booking, method]);

  if (!booking || !barber || !service || !breakdown) return null;

  // referências estáveis p/ uso dentro de closures (TS não estreita props em callbacks)
  const info = { ...booking, breakdown };

  const nameError = touched && name.trim().length < 2 ? "Informe seu nome." : undefined;
  const phoneError =
    touched && phone.replace(/\D/g, "").length < 10 ? "Informe um telefone válido com DDD." : undefined;

  function confirm() {
    const appt = {
      id: crypto.randomUUID(),
      barberId: info.barberId,
      serviceId: info.serviceId,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      date: info.dateKey,
      startMin: info.startMin,
      status: "confirmado" as const,
      payment: {
        method,
        totalCents: info.breakdown.totalCents,
        feeCents: info.breakdown.feeCents,
        splits: [
          {
            barberId: info.barberId,
            amountCents: info.breakdown.commissionCents,
            status: "transferido" as const,
          },
        ],
      },
    };
    dispatch({ type: "appt/add", appointment: appt });
    setApptCode(appt.id.slice(0, 8).toUpperCase());
    setStep("sucesso");
  }

  return (
    <Modal open onClose={onClose} title={step === "sucesso" ? "Agendamento confirmado" : "Finalizar agendamento"}>
      {step !== "sucesso" && (
        <>
          {/* resumo */}
          <div className="rounded-xl border border-sand-300 bg-paper-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={barber.name} color={barber.color} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-bark-950">{barber.name}</p>
                <p className="text-xs text-bark-500">{service.name} · {service.durationMin} min</p>
              </div>
              <div className="tnum text-right">
                <p className="text-sm font-extrabold text-bark-950">
                  {minToLabel(booking.startMin)}
                </p>
                <p className="text-[11px] text-bark-500">{formatDateFull(booking.dateKey)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {step === "dados" && (
        <div className="mt-5 space-y-4">
          <Field label="Seu nome" error={nameError}>
            <input
              className={inputClass}
              placeholder="Nome e sobrenome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="WhatsApp" error={phoneError} hint="Usamos só para confirmar e lembrar do horário.">
            <input
              className={`${inputClass} tnum`}
              placeholder="(11) 90000-0000"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Button
            className="w-full"
            onClick={() => {
              setTouched(true);
              if (name.trim().length >= 2 && phone.replace(/\D/g, "").length >= 10) setStep("pagamento");
            }}
          >
            Ir para o pagamento
          </Button>
          <button
            onClick={onClose}
            className="mx-auto block cursor-pointer text-xs font-semibold text-bark-500 hover:text-bark-700"
          >
            cancelar
          </button>
        </div>
      )}

      {step === "pagamento" && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map(({ id, label, icon: Icon, hint }) => (
              <button
                key={id}
                onClick={() => setMethod(id)}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all ${
                  method === id
                    ? "border-ember-500 bg-ember-100/60 ring-2 ring-ember-500/25"
                    : "border-sand-300 bg-paper-50 hover:border-ember-400"
                }`}
              >
                <Icon size={22} weight="duotone" className={method === id ? "text-ember-600" : "text-bark-500"} />
                <span className="text-sm font-bold text-bark-900">{label}</span>
                <span className="text-center text-[10px] leading-tight text-bark-500">{hint}</span>
              </button>
            ))}
          </div>

          {/* divisão automática */}
          <div className="rounded-xl border border-sand-300 bg-paper-50 p-4 text-sm">
            <p className="mb-2 flex items-center justify-between">
              <span className="font-bold text-bark-800">Divisão automática</span>
              <Badge tone="info">split via gateway</Badge>
            </p>
            <dl className="space-y-1.5 tnum">
              <Row label={`Comissão ${barber.name.split(" ")[0]} (${barber.commissionPct}%)`} value={brl(breakdown.commissionCents)} />
              <Row label="Taxa do gateway (simulada)" value={`−${brl(breakdown.feeCents)}`} />
              <div className="my-1 border-t border-dashed border-sand-300" />
              <Row label="Fica para a casa" value={brl(breakdown.houseCents)} strong />
              <div className="mt-2 border-t border-sand-300 pt-2">
                <Row label="Total a pagar agora" value={brl(breakdown.totalCents)} strong accent />
              </div>
            </dl>
            <p className="mt-2.5 flex items-start gap-1.5 text-[11px] leading-snug text-bark-500">
              <User size={13} className="mt-0.5 shrink-0" />
              O repasse do barbeiro é enviado à conta dele no momento da aprovação — igual ao modelo de
              split real documentado em docs/INTEGRACOES.md.
            </p>
          </div>

          <Button className="w-full" onClick={confirm}>
            <Lock size={15} weight="fill" />
            Pagar {brl(breakdown.totalCents)} e confirmar
          </Button>
          <button
            onClick={() => setStep("dados")}
            className="mx-auto flex cursor-pointer items-center gap-1 text-xs font-semibold text-bark-500 hover:text-bark-700"
          >
            <ArrowLeft size={12} /> voltar
          </button>
        </div>
      )}

      {step === "sucesso" && (
        <div className="mt-6 pb-2 text-center">
          <CheckCircle size={56} weight="duotone" className="mx-auto text-moss-500" />
          <h4 className="mt-3 text-lg font-extrabold text-bark-950">Vaga garantida!</h4>
          <p className="mt-1 text-sm text-bark-600">
            {service.name} com <strong>{barber.name}</strong> ·{" "}
            <span className="tnum">
              {formatDateFull(booking.dateKey)} às {minToLabel(booking.startMin)}
            </span>
          </p>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-paper-200 px-4 py-2 tnum text-sm font-bold text-bark-800">
            código {apptCode}
          </div>
          <p className="mt-3 text-xs text-bark-500">
            Pagamento aprovado · comissão repassada ao barbeiro na hora.
          </p>
          <Button variant="secondary" className="mt-6 w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? "font-semibold text-bark-800" : "text-bark-600"}>{label}</dt>
      <dd
        className={`font-bold ${
          accent ? "text-base text-ember-600" : strong ? "text-bark-900" : "text-bark-700"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
