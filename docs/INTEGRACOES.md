# BarberFlow — Guia de Integrações (pós-MVP)

> Este documento descreve tudo que foi **simulado** no MVP e como implementar de verdade
> quando o cliente aprovar. O front-end atual roda 100% sem backend: os dados vivem em um
> store React persistido em `localStorage` (`src/store`), com contrato de dados já moldado
> para receber as integrações abaixo sem reescrita do front.

---

## 1. Split de pagamento — visão geral

Requisito: cliente paga adiantado no agendamento; a casa fica com o restante e cada
barbeiro recebe sua comissão (% configurável por barbeiro). Existem **dois modelos**
suportados pelo Stripe Connect — escolha (ou conviva) conforme a regra de negócio:

### Modelo A — Repasse imediato no pagamento (destination charge)

A divisão nasce junto da cobrança: comissão vai direto para a conta conectada do barbeiro.

```
Cliente paga R$80 ──► PaymentIntent na PLATAFORMA
                        ├─ transfer_data[destination] = acct_barbeiro  → R$28,00 (35%)
                        └─ application_fee_amount = taxa da casa + gateway
```

```ts
// server: criar intenção de pagamento (Node + stripe)
const intent = await stripe.paymentIntents.create({
  amount: 8000, // centavos
  currency: "brl",
  payment_method_types: ["card"], // pix quando habilitado
  transfer_data: { destination: barber.stripeAccountId },
  application_fee_amount: Math.round(totalCents * FEE_PCT) + FEE_FIXED_CENTS,
  metadata: { appointmentId },
});
```

- Pró: barbeiro vê o dinheiro cair assim que o cliente paga (requisito original 2.3).
- Contra: estorno/chargeback debita a plataforma, que precisa **reverter a transferência**
  (`transfers/:id/reversal`) para recuperar o valor do barbeiro.

### Modelo B — Retenção até concluir o atendimento (separate charges & transfers)

É o caso de uso documentado "one-to-many": cobrança cai na conta da casa; as transferências
para os barbeiros acontecem depois, sob controle do backend.

```
1. Cliente paga            → charge na CONTA DA PLATAFORMA (saldo retido)
2. Webhook payment_intent.succeeded → agendamento marcado como PAGO
3. Atendimento concluído   → POST /appointments/:id/complete cria Transfer(s):
       stripe.transfers.create({
         amount: Math.round(price * barber.commissionPct / 100 * 100),
         currency: "brl",
         destination: barber.stripeAccountId,
         transfer_group: `appt_${appointmentId}`,
         source_transaction: chargeId, // só executa quando o saldo existir
       })
4. Saldo remanescente      → casa (menos taxa do gateway)
```

- Pró: casa controla o caixa; liberação pode depender de regras (no-show, retrabalho).
- Contra: responsabilidade de saldo negativo é da plataforma.

**Recomendação:** PIX (instantâneo) → Modelo A. Cartão (liquidação D+30) → Modelo B.
Torne isso uma flag por transação: `releaseOn: "payment" | "completion"`.

### Onboarding dos barbeiros (contas conectadas Express)

1. Ao cadastrar/ativar um barbeiro no painel, o backend chama
   `stripe.accounts.create({ type: "express", country: "BR", email })`.
2. Gere um link de onboarding: `stripe.accountLinks.create({ account, refresh_url, return_url, type: "account_onboarding" })`
   e envie por WhatsApp/e-mail. O painel admin deve exibir o status:
   `charges_enabled`, `details_submitted`, `payouts_enabled`.
3. Guarde `barber.stripeAccountId` na tabela de barbeiros.

---

## 2. Taxas do Stripe Brasil (pricing standard, verificar antes de contratar)

| Método | Tarifa | Observação |
|---|---|---|
| Cartão nacional (crédito/débito/pré-pago/wallets) | **3,99% + R$ 0,39** por transação | cobrada **uma vez por cobrança**, não por split |
| Cartão internacional | +2% sobre a tarifa acima | raro neste segmento |
| **PIX** | **1,19%** por PIX pago | ⚠️ **invite-only** para empresas BR — solicitar acesso |
| Boleto | R$ 3,45 por boleto | inviável para agendamentos |
| Contestação recebida / refutação manual | R$ 55,00 cada | só cartão |
| Connect (standard) | incluído | transfers internas entre contas BR são gratuitas |
| Connect monetizado (+0,25%) | opcional | se quiser embutir a taxa do SaaS na transação |

Sem mensalidade/setup. Conta Express do barbeiro é gratuita.

### Exemplo numérico

Combo Corte+Barba **R$ 80**, barbeiro com **35%** de comissão, cartão nacional:

```
Bruto .................... R$ 80,00
Taxa Stripe 3,99%+0,39 ... −R$ 3,58  (4,48% efetivo)
Líquido .................. R$ 76,42
Comissão barbeiro (35% do bruto) .. R$ 28,00 → conta conectada
Casa ..................... R$ 48,42
```

No PIX (1,19%): taxa seria R$ 0,95 → casa ficaria com R$ 51,05.
Em ticket baixo (R$ 45) a taxa fixa pesa mais: ~4,9% efetivo no cartão.

### Quem absorve a taxa?

Padrão sugerido: **casa absorve** (comissão calculada sobre o bruto).
Alternativa: ratear a taxa proporcionalmente à divisão. Implementar como flag
global `feeAbsorption: "house" | "proportional"` e refletir nos splits.

### Alternativas nacionais (PIX aberto, split nativo)

| Gateway | Split | PIX | Quando preferir |
|---|---|---|---|
| Mercado Pago Marketplace | sim | ~1%, disponível | checkout pronto + ecossistema |
| Pagar.me (Stone) | regras avançadas via API | sim | marketplaces complexos |
| Asaas | nativo | sim | cobrança recorrente + boleto |

Cartões: Stripe tende a vencer em ticket médio/alto (taxa fixa menor). PIX local:
Mercado Pago/Pagar.me hoje sem barreira de convite. O MVP isola pagamento atrás da
interface `PaymentProvider` (ver §7), então trocar de provedor não afeta o front.

---

## 3. Banco de dados (Postgres)

Substituir o store em memória. Schema inicial:

```sql
create table barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  phone text,
  email text unique,
  active boolean not null default true,
  commission_pct numeric(5,2) not null check (commission_pct between 0 and 100),
  stripe_account_id text,          -- conta conectada Express
  stripe_onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  duration_min integer not null check (duration_min > 0),
  category text not null,          -- cabelo | barba | combo | tratamento
  active boolean not null default true
);

create table barber_services (     -- N:N serviços que cada barbeiro executa
  barber_id uuid not null references barbers on delete cascade,
  service_id uuid not null references services on delete cascade,
  primary key (barber_id, service_id)
);

create table work_schedule (       -- dias/horários de trabalho por barbeiro
  barber_id uuid not null references barbers on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo
  start_time time not null,
  end_time time not null,
  primary key (barber_id, weekday),
  constraint valid_range check (end_time > start_time)
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references barbers,
  service_id uuid not null references services,
  customer_name text not null,
  customer_phone text not null,
  starts_at timestamptz not null,
  status text not null default 'confirmado'
    check (status in ('confirmado','concluido','cancelado','no_show')),
  created_at timestamptz not null default now()
);
-- índice p/ conflito de horário:
create index on appointments (barber_id, starts_at) where status <> 'cancelado';

create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references appointments,
  total_cents integer not null,
  fee_cents integer not null,               -- taxa do gateway
  method text not null check (method in ('pix','credito','debito')),
  release_on text not null default 'completion' check (release_on in ('payment','completion')),
  provider text not null,                   -- 'stripe' | 'mercadopago' | ...
  provider_payment_id text,                 -- PaymentIntent id (idempotência)
  status text not null default 'pendente' check (status in ('pendente','pago','estornado'))
);

create table payment_splits (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments on delete cascade,
  barber_id uuid not null references barbers,
  amount_cents integer not null,
  status text not null default 'pendente'
    check (status in ('pendente','transferido','revertido')),
  transfer_id text                          -- id da Transfer no gateway
);

create table transactions (        -- financeiro (receitas lançadas + despesas)
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('receita','despesa')),
  category text not null,
  description text not null default '',
  amount_cents integer not null check (amount_cents > 0),
  occurred_at date not null,
  appointment_id uuid references appointments  -- receitas ligadas a atendimentos
);

create table expense_categories (
  id text primary key,             -- slug: aluguel, produtos...
  label text not null,
  color text not null              -- cor fixa p/ gráficos
);
```

Concorrência de agenda: ao confirmar agendamento, usar
`insert ... where not exists (overlap)` dentro de transação ou advisory lock por
`(barber_id, data)` para evitar double-booking.

---

## 4. Autenticação e autorização

O login do MVP aceita credenciais demo fixas. Produção:

- **Stack:** JWT curto (15 min) + refresh token httpOnly cookie; hash com argon2id.
- **Papéis:** `owner` (tudo), `manager` (sem configuração de gateway/comissão),
  `barber` (vê apenas própria agenda e extrato de comissões).
- Endpoints: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Login do barbeiro por telefone + OTP via WhatsApp (opcional, fase 2).

## 5. Agenda em tempo real

MVP usa polling de 30 s. Produção:

- WebSocket (socket.io ou Ably/Pusher): eventos `appointment.created`,
  `appointment.cancelled`, `schedule.updated`, broadcast por tenant/barbearia.
- Slot travado no clique: `POST /appointments/hold` reserva por 5 min (TTL Redis)
  enquanto o cliente paga; expira sozinho se abandonar o checkout.

## 6. Notificações

- **WhatsApp Business API (Cloud API da Meta):** confirmação de agendamento,
  lembrete 24 h e 2 h antes, cancelamento. Templates aprovados pela Meta.
- **E-mail transacional** (Resend/SES): recibo de pagamento com breakdown do split.
- **Barbeiro:** push/notificação quando novo agendamento pago entra na agenda dele.

## 7. Camada de pagamentos (contrato interno)

Manter interface única no backend para permitir trocar provedor:

```ts
interface PaymentProvider {
  createCharge(input: ChargeInput): Promise<{ providerPaymentId: string }>;
  createSplits(paymentId: string, splits: SplitInput[]): Promise<void>; // Modelo B
  refund(providerPaymentId: string): Promise<void>;
}
// implementações: StripeProvider, MercadoPagoProvider, PagarMeProvider
```

Webhooks obrigatórios (com verificação de assinatura + idempotência):
`payment_intent.succeeded`, `charge.dispute.created`, `payout.paid`.

## 8. Assinaturas / clube de cortes (recorrência)

O MVP simula o clube com `plans` + `subscriptions` no store local. Produção:

- **Stripe Billing:** Product + Price `recurring` por plano; Checkout Session em modo
  `subscription`; webhooks `invoice.paid` (mensalidade OK → status ativo),
  `invoice.payment_failed` (→ status pendente, disparar dunning),
  `customer.subscription.deleted` (→ cancelado). Suspensão automática após N tentativas
  (Smart Retries + regra própria, ex.: 3 falhas → suspenso).
- **Alternativa nacional:** Mercado Pago "Assinaturas" ou Pagar.me planos recorrentes
  (PIX recorrente ainda limitado — cartão é o método padrão para recorrência).
- **Controle de uso:** cada corte do assinante deve consumir cota
  (`cutsUsedThisMonth`) — validar na criação do agendamento (backend) e resetar a cota
  todo dia 1º via cron.
- **Tabelas novas sugeridas:** `plans(id, name, price_cents, cuts_per_month, perks_json)`,
  `subscriptions(id, customer_*, plan_id, status, started_at, next_due_date, method)`,
  `subscription_payments(subscription_id, invoice_id, amount_cents, paid_at, status)`.
- **Dunning/notificações:** WhatsApp 3 dias antes do vencimento, na falha e antes da
  suspensão. Link de atualização de cartão auto-hospedado.

## 9. Roadmap sugerido

1. API NestJS/Fastify + Postgres (schema acima) migrando o store.
2. Auth JWT + papéis.
3. Stripe Connect (ou Mercado Pago Marketplace) em sandbox: onboarding Express,
   checkout PIX/cartão, webhooks.
4. WhatsApp Cloud API para lembretes.
5. Realtime (WebSocket) + hold de slot durante checkout.
6. Multi-tenant (uma barbearia = um tenant) para virar SaaS de verdade:
   adicionar `tenant_id` em todas as tabelas + subdomínio por barbearia.
