import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AppleLogo,
  ArrowRight,
  CalendarBlank,
  CalendarCheck,
  Check,
  Clock,
  Crown,
  DeviceMobile,
  GooglePlayLogo,
  InstagramLogo,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkle,
  Star,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { useStore } from "../../store/store";
import { Avatar, Badge, Modal } from "../../components/ui";
import PhotoSlot from "../../components/PhotoSlot";
import AppDock from "../../components/AppDock";import { CATEGORY_LABELS, type Service } from "../../types";
import { brl, toDateKey } from "../../lib/format";
import { computeSlots } from "../../lib/slots";

/* ---------- helpers de movimento ---------- */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Stars({ size = 14 }: { size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-ember-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} weight="fill" />
      ))}
    </span>
  );
}

export default function Landing() {
  const { state } = useStore();
  const [detail, setDetail] = useState<Service | null>(null);

  const activeServices = useMemo(() => state.services.filter((s) => s.active), [state.services]);
  const activeBarbers = useMemo(() => state.barbers.filter((b) => b.active), [state.barbers]);

  /** próximo horário livre de hoje por barbeiro (dados reais do store) */
  const nextByBarber = useMemo(() => {
    const todayKey = toDateKey(new Date());
    const map = new Map<string, string | null>();
    for (const b of activeBarbers) {
      const free = computeSlots(b, todayKey, 45, state.appointments, state.services).filter(
        (s) => s.available,
      );
      map.set(b.id, free[0]?.label ?? null);
    }
    return map;
  }, [activeBarbers, state.appointments, state.services]);

  const stats = useMemo(() => {
    const thisMonth = toDateKey(new Date()).slice(0, 7);
    return {
      years: new Date().getFullYear() - 1998,
      monthAppts: state.appointments.filter((a) => a.date.startsWith(thisMonth)).length,
      barbers: activeBarbers.length,
    };
  }, [state.appointments, activeBarbers]);

  return (
    <div>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-ink-950 text-paper-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage: "radial-gradient(rgba(237,235,229,0.5) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pb-24">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-bark-300">
              Barbearia Navalha de Ouro · Centro
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Seu corte,
              <br />
              <span className="text-ember-400">na hora marcada.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-bark-300">
              Cortes, barba e navalha com o barbeiro que você escolhe — e horário que não atrasa.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/agenda"
                className="group inline-flex items-center gap-2 rounded-xl bg-ember-500 px-6 py-3.5 text-sm font-bold text-paper-50 transition-all hover:bg-ember-400 active:scale-[0.98]"
              >
                Agendar horário
                <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#casa"
                className="inline-flex items-center gap-2 rounded-xl border border-paper-100/20 px-6 py-3.5 text-sm font-bold text-paper-100 transition-colors hover:border-paper-100/45 hover:bg-paper-100/5"
              >
                Conheça a casa
              </a>
            </div>

            {/* micro prova social + app */}
            <div className="mt-9 flex items-center gap-3">
              <Stars />
              <p className="text-xs text-bark-300">
                <strong className="tnum font-semibold text-paper-100">4,9</strong> de{" "}
                <span className="tnum">107</span> avaliações no Google
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bark-400">
                agende e gerencie tudo pelo aplicativo
              </span>
              <span className="flex gap-2">
                <a
                  href="#"
                  aria-label="Baixar na App Store (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-2.5 py-1.5 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
                >
                  <AppleLogo size={14} weight="fill" /> App Store
                </a>
                <a
                  href="#"
                  aria-label="Disponível no Google Play (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-2.5 py-1.5 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
                >
                  <GooglePlayLogo size={14} weight="fill" /> Google Play
                </a>
              </span>
            </div>
          </motion.div>

          {/* foto principal + cartão live */}
          <div className="relative">
            <PhotoSlot
              label="cadeira & interior"
              spec="1100×1300 · retrato"
              dark
              className="aspect-[4/5] rounded-2xl border border-paper-100/10 shadow-2xl shadow-black/40"
            />
            <div className="absolute -bottom-8 -left-4 hidden w-72 rounded-2xl border border-sand-300 bg-paper-100 p-4 shadow-2xl sm:block lg:-left-10">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-bark-900">Disponível hoje</span>
                <Badge tone="success">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-moss-500" />
                  </span>
                  ao vivo
                </Badge>
              </div>
              <ul className="space-y-1.5">
                {activeBarbers.slice(0, 3).map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <Avatar name={b.name} color={b.color} size={22} />
                    <span className="flex-1 truncate text-xs font-semibold text-bark-700">
                      {b.name.split(" ")[0]}
                    </span>
                    <span className="tnum font-mono text-[11px] font-medium text-ember-600">
                      {nextByBarber.get(b.id) ?? "—"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/agenda"
                className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-bark-900 py-2 text-[11px] font-bold text-paper-50 transition-colors hover:bg-bark-800"
              >
                ver agenda completa
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MARQUEE ================= */}
      <div className="overflow-hidden border-y border-bark-900/20 bg-ember-500 py-3">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1} className="flex items-center">
              {[
                "Corte Clássico",
                "Barba Terapia",
                "Navalha",
                "Baixe o aplicativo",
                "Degradê",
                "Pigmentação",
                "Desde 1998",
              ].map(
                (item) => (
                  <span
                    key={`${copy}-${item}`}
                    className="mx-5 flex items-center gap-5 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-bark-950"
                  >
                    {item}
                    <Scissors size={13} weight="bold" />
                  </span>
                ),
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ================= STATS ================= */}
      <section className="border-b border-sand-300 bg-paper-200">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-sand-300 px-4 sm:px-6 lg:grid-cols-4">
          {[
            { v: `${stats.years}`, l: "anos na mesma esquina" },
            { v: `${stats.monthAppts}`, l: "agendamentos este mês" },
            { v: `${stats.barbers}`, l: "barbeiros à disposição" },
            { v: "4,9", l: "nota média no Google" },
          ].map((s) => (
            <div key={s.l} className="px-5 py-7 first:pl-0">
              <p className="tnum font-mono text-3xl font-semibold tracking-tight text-ink-900">{s.v}</p>
              <p className="mt-1 text-xs leading-snug text-bark-600">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SERVIÇOS · MENU EDITORIAL ================= */}
      <section id="servicos" className="scroll-mt-20 bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-lg">
              <h2 className="text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
                O menu da casa
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bark-600">
                Toque em um serviço para ver os detalhes e quem atende.
              </p>
            </div>
            <Link
              to="/agenda"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-ember-600 hover:text-ember-700"
            >
              Ver horários livres
              <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>

          <div className="border-t border-rule">
            {activeServices.map((svc, i) => {
              const featured = svc.category === "combo";
              return (
                <Reveal key={svc.id} delay={Math.min(i * 0.04, 0.2)}>
                  <button
                    onClick={() => setDetail(svc)}
                    className={`group flex w-full cursor-pointer items-baseline gap-4 border-b border-rule px-2 py-5 text-left transition-colors hover:bg-paper-200 sm:gap-6 sm:px-4 ${
                      featured ? "bg-ember-500/8" : ""
                    }`}
                  >
                    <span className="tnum hidden shrink-0 font-mono text-xs text-bark-400 sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-3">
                        <span className="text-xl font-extrabold tracking-tight text-ink-950 transition-transform duration-200 group-hover:translate-x-1 sm:text-2xl">
                          {svc.name}
                        </span>
                        {featured && (
                          <Badge tone="accent">
                            <Sparkle size={11} weight="fill" /> mais pedido
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-sm text-bark-500">
                        {svc.description}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="tnum block font-mono text-lg font-semibold text-ink-900">
                        {brl(svc.priceCents)}
                      </span>
                      <span className="tnum block font-mono text-[11px] text-bark-500">
                        {svc.durationMin} min
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 text-xs font-bold text-ember-600 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                      agendar
                      <ArrowRight size={13} weight="bold" />
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>

          {/* faixa app/clube após o menu */}
          <Reveal className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ember-500/35 bg-ember-500/10 px-5 py-4">
              <p className="text-sm leading-snug text-bark-800">
                <strong className="font-bold">Assinantes cortam com prioridade.</strong>{" "}
                Mensalidade fixa, horários exclusivos e desconto em produtos.
              </p>
              <a
                href="#clube"
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ember-500 px-4 py-2 text-xs font-bold text-paper-50 transition-all hover:bg-ember-600 active:scale-[0.98]"
              >
                Conhecer o clube
                <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= A CASA ================= */}
      <section id="casa" className="scroll-mt-20 border-y border-sand-300 bg-paper-200">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <PhotoSlot
              label="salão · vista geral"
              spec="1200×800 · paisagem"
              className="aspect-[3/2] rounded-2xl border border-sand-300 shadow-lg"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="max-w-md text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Desde 1998 na mesma esquina.
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-bark-700">
              Três gerações de clientes passaram pela nossa cadeira. Aqui o café é passado, a conversa é
              boa e o acabamento é feito na navalha — como manda a tradição.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                {
                  icon: ShieldCheck,
                  title: "Higiene de clínica",
                  text: "Ferramentas esterilizadas em autoclave a cada atendimento.",
                },
                {
                  icon: CalendarCheck,
                  title: "Horário garantido",
                  text: "Agendou, é seu. Se atrasarmos, o corte fica por conta da casa.",
                },
                {
                  icon: Sparkle,
                  title: "Produto premium sempre",
                  text: "Pomadas, óleos e balm de primeira inclusos em todo serviço.",
                },
                {
                  icon: DeviceMobile,
                  title: "Tudo pelo aplicativo",
                  text: "Agende, pague a mensalidade do clube e acompanhe seus cortes acumulados.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ember-500/12 text-ember-600">
                    <Icon size={19} weight="duotone" />
                  </span>
                  <div>
                    <p className="font-bold text-ink-950">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-bark-600">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ================= EQUIPE ================= */}
      <section id="equipe" className="scroll-mt-20 bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-lg">
              <h2 className="text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
                Os mestres das navalhas
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-bark-600">
                Cada barbeiro com seus dias e especialidades. Escolha o seu na hora de agendar.
              </p>
            </div>
          </Reveal>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {activeBarbers.map((barber, i) => (
              <Reveal key={barber.id} delay={Math.min(i * 0.06, 0.24)} className="w-64 shrink-0 snap-start sm:w-auto">
                <div className="group overflow-hidden rounded-2xl border border-sand-300 bg-paper-200 transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative">
                    <PhotoSlot
                      label={`retrato · ${barber.name.split(" ")[0]}`}
                      spec="600×750 · 4:5"
                      className="aspect-[4/5]"
                    />
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-ember-400 backdrop-blur">
                      {nextByBarber.get(barber.id)
                        ? `livre às ${nextByBarber.get(barber.id)}`
                        : "agenda de amanhã"}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="truncate font-bold text-ink-950">{barber.name}</p>
                    <p className="truncate text-xs font-semibold text-bark-500">{barber.role}</p>
                    <ul className="mt-2 space-y-1">
                      {barber.serviceIds.slice(0, 2).map((sid) => (
                        <li key={sid} className="truncate text-xs text-bark-600">
                          · {state.services.find((s) => s.id === sid)?.name}
                        </li>
                      ))}
                      {barber.serviceIds.length > 2 && (
                        <li className="text-xs text-bark-400">
                          +{barber.serviceIds.length - 2} serviços
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CLUBE · ASSINATURAS ================= */}
      <section id="clube" className="scroll-mt-20 border-y border-sand-300 bg-paper-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal className="mb-10 max-w-xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-ember-600">
              Clube Navalha de Ouro
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Pague o mês, corte à vontade.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bark-600">
              Assinatura mensal sem burocracia: escolha o plano, baixe o aplicativo e reserve seus
              horários com dois toques. Cancele quando quiser.
            </p>
          </Reveal>

          <div className="grid gap-4 lg:grid-cols-3">
            {state.plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.07}>
                <div
                  className={`flex h-full flex-col rounded-2xl border p-6 transition-transform hover:-translate-y-1 ${
                    plan.featured
                      ? "border-ember-500/70 bg-ink-950 text-paper-100 shadow-xl shadow-black/25"
                      : "border-sand-300 bg-paper-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-mono text-xs uppercase tracking-[0.22em] ${plan.featured ? "text-ember-400" : "text-bark-500"}`}>
                      {plan.name}
                    </span>
                    {plan.featured && (
                      <Badge tone="accent">
                        <Crown size={11} weight="fill" /> mais escolhido
                      </Badge>
                    )}
                  </div>
                  <p className="mt-4 flex items-baseline gap-1.5">
                    <span className={`tnum font-mono text-4xl font-semibold tracking-tight ${plan.featured ? "text-paper-50" : "text-ink-950"}`}>
                      {brl(plan.priceCents).replace(",00", "")}
                    </span>
                    <span className={`text-sm ${plan.featured ? "text-bark-300" : "text-bark-500"}`}>/mês</span>
                  </p>
                  <p className={`mt-1 text-xs ${plan.featured ? "text-bark-300" : "text-bark-500"}`}>
                    {plan.cutsPerMonth === null ? "cortes ilimitados no mês" : `${plan.cutsPerMonth} serviços por mês`}
                  </p>

                  <ul className={`mt-5 flex-1 space-y-2 border-t border-dashed pt-5 ${plan.featured ? "border-paper-100/15" : "border-rule"}`}>
                    {plan.perks.map((perk) => (
                      <li key={perk} className={`flex items-start gap-2 text-[13px] leading-snug ${plan.featured ? "text-bark-300" : "text-bark-700"}`}>
                        <Check size={15} weight="bold" className="mt-0.5 shrink-0 text-ember-500" />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  {/* CTAs de download — trocar "#" pelos links reais das lojas */}
                  <a href="#" aria-label={`Baixar o app e assinar o plano ${plan.name}`} onClick={(e) => e.preventDefault()}>
                    <button
                      className={`mt-6 w-full cursor-pointer rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                        plan.featured
                          ? "bg-ember-500 text-paper-50 hover:bg-ember-400"
                          : "bg-bark-900 text-paper-50 hover:bg-bark-800"
                      }`}
                    >
                      Assinar pelo aplicativo
                    </button>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-paper-100 px-6 py-5">
              <div>
                <p className="font-bold text-ink-950">Baixe o aplicativo do clube</p>
                <p className="mt-0.5 text-sm text-bark-600">
                  Agenda, pagamento da mensalidade e histórico de cortes na palma da mão.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#"
                  aria-label="Baixar na App Store (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 rounded-xl bg-bark-950 px-4 py-2.5 text-xs font-bold text-paper-50 transition-colors hover:bg-ink-900"
                >
                  <AppleLogo size={18} weight="fill" />
                  App Store
                </a>
                <a
                  href="#"
                  aria-label="Disponível no Google Play (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-2 rounded-xl bg-bark-950 px-4 py-2.5 text-xs font-bold text-paper-50 transition-colors hover:bg-ink-900"
                >
                  <GooglePlayLogo size={18} weight="fill" />
                  Google Play
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= GALERIA ================= */}
      <section id="galeria" className="scroll-mt-20 bg-ink-950">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-md text-3xl font-extrabold tracking-tight text-paper-100 sm:text-4xl">
              O trabalho fala por si.
            </h2>
            <a
              href="#galeria"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-bark-300 transition-colors hover:text-ember-400"
            >
              <InstagramLogo size={16} />@navalhadeouro.barber
            </a>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
            <Reveal className="col-span-2 sm:col-span-7" delay={0}>
              <PhotoSlot
                label="degradê em detalhe"
                spec="1400×800 · paisagem"
                dark
                className="aspect-[16/9] rounded-xl"
              />
            </Reveal>
            <Reveal className="col-span-2 sm:col-span-5" delay={0.05}>
              <PhotoSlot label="barba na navalha" spec="900×800" dark className="aspect-[16/9] sm:aspect-auto sm:h-full sm:min-h-[240px] rounded-xl" />
            </Reveal>
            <Reveal className="col-span-1 sm:col-span-4" delay={0.08}>
              <PhotoSlot label="toalha quente" spec="700×800" dark className="aspect-square rounded-xl" />
            </Reveal>
            <Reveal className="col-span-1 sm:col-span-4" delay={0.12}>
              <PhotoSlot label="pomada & pente" spec="700×800" dark className="aspect-square rounded-xl" />
            </Reveal>
            <Reveal className="col-span-2 sm:col-span-4" delay={0.16}>
              <PhotoSlot label="cliente saindo no estilo" spec="700×800" dark className="aspect-square sm:aspect-auto sm:h-full rounded-xl" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= DEPOIMENTOS ================= */}
      <section className="bg-paper-100">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Reveal>
              <h2 className="text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
                Quem senta na cadeira, volta.
              </h2>
              <div className="mt-6 flex items-end gap-3">
                <span className="tnum font-mono text-6xl font-semibold leading-none text-ink-950">4,9</span>
                <div className="pb-1">
                  <Stars size={16} />
                  <p className="tnum mt-1 text-xs text-bark-600">
                    <strong>107</strong> avaliações no Google
                  </p>
                </div>
              </div>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-bark-600">
                Nota mantida há mais de dois anos, com centenas de cortes por mês. A gente cuida de cada
                cliente como se fosse o primeiro.
              </p>
            </Reveal>

            <div className="space-y-4">
              {[
                {
                  quote:
                    "Muito top! O lugar é impecável e já cortei com três barbeiros diferentes — fui muito bem atendido por todos.",
                  name: "Marcos T.",
                  when: "há 2 semanas",
                },
                {
                  quote:
                    "Ambiente acolhedor e profissional nota 10. Saí exatamente com o corte que pedi, sem pressa e caprichado.",
                  name: "João P.",
                  when: "há 1 mês",
                },
                {
                  quote:
                    "Agendo pelo aplicativo em segundos e nunca esperei um minuto. O combo corte e barba vale cada centavo.",
                  name: "Rafael M.",
                  when: "há 1 mês",
                },
              ].map((t, i) => (
                <Reveal key={t.name} delay={i * 0.06}>
                  <figure className="rounded-2xl border border-sand-300 bg-paper-200 p-5 sm:p-6">
                    <Stars size={12} />
                    <blockquote className="mt-2.5 max-w-[60ch] text-[15px] leading-relaxed text-bark-800">
                      “{t.quote}”
                    </blockquote>
                    <figcaption className="mt-3 text-xs font-semibold text-bark-500">
                      {t.name} · Avaliação no Google · {t.when}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= HORÁRIOS & LOCAL ================= */}
      <section id="local" className="scroll-mt-20 border-y border-sand-300 bg-paper-200">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight text-ink-950">Passa pra cá.</h2>
            <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-bark-700">
              <MapPin size={17} weight="duotone" className="mt-0.5 shrink-0 text-ember-600" />
              Rua dos Barberos, 456 — Centro
              <br />
            </p>
            <div className="mt-6 space-y-2.5">
              <a href="tel:+551135550199" className="flex w-fit items-center gap-2.5 text-sm font-semibold text-bark-800 transition-colors hover:text-ember-600">
                <Phone size={16} weight="duotone" className="text-ember-600" />
                <span className="tnum">(11) 3555-0199</span>
              </a>
              <a href="#local" className="flex w-fit items-center gap-2.5 text-sm font-semibold text-bark-800 transition-colors hover:text-ember-600">
                <WhatsappLogo size={16} weight="duotone" className="text-ember-600" />
                <span className="tnum">(11) 93555-0199</span>
              </a>
              <a href="#local" className="flex w-fit items-center gap-2.5 text-sm font-semibold text-bark-800 transition-colors hover:text-ember-600">
                <InstagramLogo size={16} weight="duotone" className="text-ember-600" />
                @navalhadeouro.barber
              </a>
            </div>
            <PhotoSlot
              label="fachada da barbearia"
              spec="1200×700 · paisagem"
              className="mt-7 aspect-[12/7] rounded-2xl border border-sand-300"
            />
          </Reveal>

          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-sand-300 bg-paper-100 p-6 sm:p-8">
              <h3 className="flex items-center gap-2 font-bold text-ink-950">
                <Clock size={18} weight="duotone" className="text-ember-600" />
                Funcionamento
              </h3>
              <dl className="mt-4 divide-y divide-dashed divide-rule font-mono text-sm">
                {[
                  ["Segunda a sexta", "09:00 – 21:00"],
                  ["Sábado", "09:00 – 18:00"],
                  ["Domingo", "fechado"],
                ].map(([d, h]) => (
                  <div key={d} className="flex items-center justify-between gap-4 py-3.5">
                    <dt className="text-bark-600">{d}</dt>
                    <dd className={`tnum font-medium ${h === "fechado" ? "text-bark-400" : "text-ink-950"}`}>
                      {h}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 rounded-xl bg-ink-950 p-5 text-paper-100">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <CalendarBlank size={16} weight="duotone" className="text-ember-400" />
                  Sem fila, sem espera
                </p>
                <p className="mt-1 text-xs leading-relaxed text-bark-300">
                  Clientes com horário marcado têm prioridade absoluta na cadeira.
                </p>
                <Link
                  to="/agenda"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-ember-500 py-2.5 text-sm font-bold text-paper-50 transition-all hover:bg-ember-400 active:scale-[0.98]"
                >
                  Reservar meu horário
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--color-ember-500) 55%, transparent) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 md:py-24">
          <Reveal>
            <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-500 text-paper-50 shadow-lg shadow-black/40">
              <Scissors size={26} weight="duotone" />
            </span>
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-paper-100 sm:text-5xl">
              Sua semana está enchendo. Garanta o seu horário.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bark-300">
              Confirmação na hora, direto no WhatsApp — sem espera, sem telefone ocupado.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/agenda"
                className="inline-flex items-center gap-2 rounded-xl bg-ember-500 px-8 py-4 text-sm font-bold text-paper-50 transition-all hover:bg-ember-400 active:scale-[0.98]"
              >
                <CalendarCheck size={17} weight="fill" />
                Agendar agora
              </Link>
              <a
                href="#local"
                className="inline-flex items-center gap-2 rounded-xl border border-paper-100/20 px-8 py-4 text-sm font-bold text-paper-100 transition-colors hover:border-paper-100/45 hover:bg-paper-100/5"
              >
                <WhatsappLogo size={17} />
                Chamar no WhatsApp
              </a>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-bark-400">
                grátis para assinantes · ios e android
              </span>
              <div className="flex gap-2">
                <a
                  href="#"
                  aria-label="Baixar na App Store (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-3 py-1.5 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
                >
                  <AppleLogo size={14} weight="fill" /> App Store
                </a>
                <a
                  href="#"
                  aria-label="Disponível no Google Play (em breve)"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-paper-100/20 px-3 py-1.5 text-xs font-bold text-paper-100 transition-colors hover:border-ember-400 hover:text-ember-400"
                >
                  <GooglePlayLogo size={14} weight="fill" /> Google Play
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <AppDock />
      <ServiceDetailModal service={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

/* ---------- modal de detalhes do serviço ---------- */

function ServiceDetailModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const { state } = useStore();
  if (!service) return null;
  const barbers = state.barbers.filter((b) => b.active && b.serviceIds.includes(service.id));
  return (
    <Modal open={!!service} onClose={onClose} title={service.name}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge tone="accent">{CATEGORY_LABELS[service.category]}</Badge>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-bark-600">
            <Clock size={15} /> {service.durationMin} minutos
          </span>
        </div>
        <span className="tnum font-mono text-2xl font-semibold text-ink-950">{brl(service.priceCents)}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-bark-700">{service.description}</p>

      <p className="mb-2 mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-bark-500">
        Quem atende este serviço
      </p>
      <ul className="space-y-2">
        {barbers.map((b) => (
          <li
            key={b.id}
            className="flex items-center gap-3 rounded-xl border border-sand-200 bg-paper-50 px-3.5 py-2.5"
          >
            <Avatar name={b.name} color={b.color} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-bark-900">{b.name}</p>
              <p className="truncate text-xs text-bark-500">{b.role}</p>
            </div>
          </li>
        ))}
      </ul>

      <Link to={`/agenda?servico=${service.id}`} onClick={onClose}>
        <button className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ember-500 py-3 text-sm font-bold text-paper-50 transition-all hover:bg-ember-600 active:scale-[0.98]">
          Agendar este serviço
          <ArrowRight size={16} weight="bold" />
        </button>
      </Link>
    </Modal>
  );
}
