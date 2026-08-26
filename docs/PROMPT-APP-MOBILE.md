# Prompt — Transformar o BarberFlow em Aplicativo Mobile

> Copie todo o conteúdo abaixo e cole como instrução inicial para um agente de código
> (Claude Code, Cursor, etc.) ou use como especificação para a equipe. O documento é
> autocontido: não precisa de contexto adicional além do repositório atual.

---

## Papel e objetivo

Você é um desenvolvedor mobile sênior. Sua tarefa é criar o **BarberFlow Mobile**, o aplicativo
do sistema de gestão para barbearias "BarberFlow" (barbearia demo: *Navalha de Ouro*), partindo
de um MVP web já existente neste repositório (`WebstormProjects/barberflow`).

O app deve cobrir **todas as funcionalidades do web app** com experiência nativa mobile,
mantendo o mesmo modelo de dados, a mesma identidade visual vintage e o mesmo comportamento
de simulação (sem backend real — dados em memória/local, prontos para plugar API depois).

## Stack obrigatória

- **React Native + Expo (SDK mais recente)** com TypeScript
- **Expo Router** (navegação em arquivos, grupos `/app/(tabs)`, `(admin)`, modais)
- Estilização: **NativeWind** (Tailwind para RN) reaproveitando os tokens abaixo
- Gráficos: `react-native-gifted-charts` ou `victory-native`
- Ícones: `@phosphor-icons/react-native` (mesma família do web)
- Fontes: **Outfit Variable** + **IBM Plex Mono** via `expo-font` / `@expo-google-fonts`
- Persistência local: `@react-native-async-storage/async-storage` com o MESMO contrato do store web
- Animações: `react-native-reanimated` (revelar on scroll, transições sutis)
- Sem backend real: portar o store (`src/store/store.tsx`) e os seeds (`src/data/seed.ts`)
  do web app como fonte de dados local

> Reaproveite ao máximo os tipos (`src/types.ts`), utilitários (`src/lib/format.ts`,
> `src/lib/slots.ts`) e a lógica do store — são TypeScript puro e funcionam no RN com pouca
> ou nenhuma alteração.

## Identidade visual (obrigatória)

Paleta vintage bege/marrom/laranja + preto quente (tokens Tailwind/NativeWind):

```
paper-50 #FDFAF3   paper-100 #FBF7EE   paper-200 #F6EFDF   paper-300 #EFE5CF
sand-100 #F3ECDF   sand-200 #ECE2CD    sand-300 #E0D2B4    sand-400 #CDBB97
bark-300 #D8C6AB   bark-400 #BFA987    bark-500 #A08868    bark-600 #7C6549
bark-700 #60492F   bark-800 #4A3728    bark-900 #3E2F23    bark-950 #2B2016
ember-100 #F7E3CF  ember-200 #EEC9A4   ember-400 #DD8A45   ember-500 #C96B2E
ember-600 #AD571F  ember-700 #8A4519
ink-700 #35302A    ink-800 #26221D     ink-900 #1A1713     ink-950 #12100D
moss-500 #6D7F4B   wine-500 #9C4A38    rule #CBBFA4
```

- Acento único: **ember-500** (#C96B2E). Nada de outras cores saturadas.
- Tipografia: Outfit (títulos e corpo) + IBM Plex Mono (preços, horários, números, labels).
- Cantos arredondados 12–16px consistente; badges em pílula.
- Área pública alterna blocos claros (bege) e escuros (ink) como no site; painel admin é
  dashboard claro com sidebar → no mobile vira bottom tabs + drawer.
- Imagens: enquanto não houver fotos reais, usar os mesmos placeholders duotone rotulados
  do web (`PhotoSlot`: fundo marrom/preto com trama pontilhada + rótulo mono da foto).

## Modelo de dados (portar igual do web)

```ts
Barber {
  id, name, role, phone, active,
  commissionPct,            // % sobre preço bruto
  color,                    // cor do avatar/gráficos
  schedule: { [0..6]: { enabled, start, end } },   // dias de trabalho
  serviceIds: string[]      // serviços que atende
}
Service { id, name, description, priceCents, durationMin, category, active }
Appointment {
  id, barberId, serviceId, customerName, customerPhone,
  date /* yyyy-mm-dd */, startMin /* minutos */,
  status: confirmado | concluido | cancelado,
  payment { method: pix|credito|debito, totalCents, feeCents,
            splits: [{ barberId, amountCents, status: pendente|transferido }] }
}
Transaction { id, type: receita|despesa, categoryId, description, amountCents,
              date, appointmentId? }
ExpenseCategory { id, label, color }
```

Regras de negócio que devem continuar válidas:

1. Slots da agenda = grade de 30 min dentro do expediente do dia do barbeiro, excluindo
   conflitos com agendamentos existentes (usar duração do serviço escolhido) e horários
   passados no dia corrente (`computeSlots`).
2. Só aparece na agenda o barbeiro ATIVO que atende o serviço selecionado.
3. Checkout calcula: taxa simulada (PIX 1%, crédito 4% + R$0,39, débito 2,5% + R$0,39),
   comissão = total × commissionPct, casa = resto. Ao "pagar": cria agendamento `confirmado`,
   split `transferido` e lança receita automática no financeiro.
4. Cancelar agendamento remove a receita vinculada. Concluir só muda status.
5. Desativar barbeiro cancela os agendamentos futuros dele.
6. Seed determinístico (PRNG mulberry32 seed 20260825): 4 barbeiros, 6 serviços,
   agendamentos de −30 a +12 dias, despesas recorrentes de 3 meses. Botão
   "Resetar dados demo".

## Telas e navegação

### Grupo público (cliente final)

1. **Home** — espelho da landing web: hero escuro com headline "Seu corte, na hora marcada.",
   cartão "Disponível hoje · ao vivo" (próximo horário livre por barbeiro, ticker 30s),
   faixa marquee dos serviços, estatísticas (anos de casa, agendamentos do mês, nota 4,9),
   menu editorial de serviços (linhas grandes nome→preço em mono, combo destacado),
   seção A Casa com selos de confiança, equipe com retratos e chip "livre às HH:MM",
   galeria escura, depoimentos com bloco 4,9★ estilo Google, horários/local e CTA final.
   No mobile, transformar em scroll vertical com seções colapsáveis/carrosséis horizontais.
2. **Agenda** (tela principal de reserva):
   - Seletor horizontal de 14 dias
   - Filtros: chips de serviço e de barbeiro
   - Lista por barbeiro com slots agrupados Manhã/Tarde/Noite
   - Indicador "atualizado às HH:MM:SS" + auto-refresh a cada 30s (pull-to-refresh também)
   - Slot ocupado riscado/desabilitado; passado com ícone relógio
3. **Detalhes do serviço** (modal/bottom sheet): preço grande, duração, categoria,
   descrição, lista de barbeiros que atendem, CTA "Agendar este serviço".
4. **Fluxo de agendamento** (stack com steps):
   - Dados do cliente (nome + WhatsApp, validação)
   - Pagamento: métodos PIX/Crédito/Débito + resumo da divisão automática
     (comissão barbeiro %, taxa gateway simulada, líquido casa) + botão
     "Pagar R$X e confirmar"
   - Sucesso: check, código do agendamento (8 chars), resumo, botão fechar
5. Bottom sheets/modais RN para todos os modais do web.

### Grupo admin (dono/gerente)

6. **Login** — tela dark com credenciais demo fixas
   `admin@navalhadeouro.com` / `demo123` (aceita somente essas), link para docs.
7. **Dashboard** (tab admin): KPIs (receita do mês + delta vs anterior, agendamentos hoje,
   ocupação %, ticket médio), gráfico Receitas×Despesas 6 meses (área/linhas),
   donut despesas por categoria, barras faturamento por barbeiro, lista agenda de hoje.
8. **Agendamentos**: filtros (status/barbeiro/data/busca), tabela → lista/cards no mobile,
   ações concluir/cancelar com swipe ou menu, modal de detalhes com breakdown do split.
9. **Equipe**: cards dos barbeiros (comissão, faturamento mês, próximos atendimentos,
   dias configurados) + editor em telas/modal com abas:
   - Dados (nome, cargo, telefone, cor, ativo/inativo)
   - Comissão (slider 0–70% + presets + preview "combo R$80 → R$28")
   - Dias de trabalho (7 linhas toggle + selects início/fim de 30 em 30 min)
   - Serviços (checkbox list do catálogo)
10. **Serviços**: CRUD completo (nome, descrição, preço, duração, categoria, ativo).
11. **Financeiro**: KPIs (receitas/despesas do mês, saldo acumulado), gráficos mensal +
    donut categorias, lista de lançamentos com filtros tipo/categoria, CRUD manual,
    gerenciador de categorias de despesa, badge "auto" nos lançamentos vindos de agendamentos.
12. Navegação admin: bottom tabs (Início, Agenda, Equipe, Financeiro) + "Mais" para
    Serviços/Configurações; header com busca fake, resetar demo e logout.

## Critérios de aceite

- [ ] Roda em iOS e Android via Expo Go/build dev com um comando (`pnpm expo start`)
- [ ] Todas as 12 telas acima funcionando com dados locais persistidos (AsyncStorage)
- [ ] Fluxo completo: agendar slot → pagar (simulado) → aparecer no financeiro e no
      dashboard sem reiniciar o app
- [ ] Configurar dia/comissão/serviços na Equipe muda a agenda pública em tempo real
- [ ] Auto-refresh de 30s na agenda + pull-to-refresh
- [ ] Paleta/tipografia idênticas ao web; safe areas respeitadas; dark sections no público
- [ ] Animações respeitam `prefers-reduced-motion` (equivalente RN: `AccessibilityInfo`)
- [ ] Zero dependência de rede: funciona offline do início ao fim
- [ ] TypeScript estrito sem erros (`pnpm tsc --noEmit` limpo)

## Integrações futuras (NÃO implementar agora, apenas manter a porta aberta)

Documentação completa em `docs/INTEGRACOES.md` do repositório. Resumo:

- **Split de pagamento real:** Stripe Connect — Modelo A (destination charge, repasse no
  pagamento) ou Modelo B (separate charges & transfers, repasse na conclusão com
  `transfer_group`/`source_transaction`). Taxas BR: cartão nacional 3,99% + R$0,39;
  PIX 1,19% (invite-only); contestação R$55. Alternativas nacionais com PIX aberto:
  Mercado Pago Marketplace, Pagar.me, Asaas (~1% PIX).
- O array `payment.splits` já espelha o payload dos gateways — trocar apenas a camada
  de pagamento quando existir backend (contrato `PaymentProvider`).
- Backend alvo: Postgres (schema em INTEGRACOES.md §3), auth JWT com papéis
  owner/manager/barber, WebSocket para agenda em tempo real, WhatsApp Cloud API para
  lembretes, multi-tenant para virar SaaS.

No app mobile, isolar toda chamada de dados atrás de uma interface única (ex.:
`services/api.ts`) já preparada para apontar para REST depois — hoje implementada com o
store local.

## Entrega

Projeto novo em `WebstormProjects/barberflow-mobile` (monorepo opcional), README com
passos de execução, e checklist das telas concluídas. Priorize fidelidade às telas web
existentes deste repositório — abra os arquivos citados antes de codar.
