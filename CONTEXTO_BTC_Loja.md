# CONTEXTO.md — BTC Loja · Print-on-Demand
> Briefing operacional para Windsurf / Cascade AI
> Sempre ativo como contexto base. Para decisões de produto, referencie `@PRD_BTC_Loja_v1.md`.

---

## 1. O que é este projeto

Plataforma de e-commerce **whitelabel** de print-on-demand para o BTC — Bahia de Todas as Cores, o maior festival de graffiti do Norte/Nordeste do Brasil. Repositório **completamente separado** do site institucional do festival.

A produção física é terceirizada para o **Ponto de Cuidado — Arte que Transforma** (Salvador-BA). A plataforma gerencia pedidos, pagamentos (Mercado Pago), frete (Correios API) e royalties automáticos para os artistas.

**Stack:** Next.js 14 + TypeScript · Tailwind CSS · Supabase · Mercado Pago · Correios API · Resend · Vercel · Zustand (carrinho) · React Hook Form + Zod (formulários)

---

## 2. Sistema de Design — Princípios da Loja

> A loja é **neutra e minimalista por design**. O produto — a arte aplicada digitalmente nas peças — é o protagonista visual absoluto. A identidade do festival aparece no logo, na cor primária e na tipografia, não no fundo da página.

### 2.1 Filosofia visual

| Princípio | Aplicação |
|---|---|
| **Produto como hero** | Mockups grandes, fundo limpo, sem distrações ao redor da arte |
| **Minimalismo funcional** | Espaço em branco generoso, hierarquia tipográfica clara, sem elementos decorativos desnecessários |
| **Marca no lugar certo** | Logo do festival no header; cor primária nos CTAs e destaques; sem invadir o espaço do produto |
| **Neutralidade de fundo** | Fundo claro (padrão) ou escuro neutro — nunca cores temáticas de festival como fundo de página |
| **Arte fala por si** | Nenhum efeito visual (glow, grain, neon) compete com a arte do artista |

### 2.2 CSS Variables — design system fixo

```css
/* globals.css — IMUTÁVEL. Não é injetado por tenant. */
/* Paleta e tipografia são as mesmas em todos os tenants. */

--color-primary:      #111111;   /* preto quase puro — CTAs, links, destaques */
--color-primary-hover:#333333;   /* estado hover */
--color-background:   #F9F9F9;   /* fundo da loja — cinza muito claro */
--color-surface:      #FFFFFF;   /* cards, inputs, painéis */
--color-surface-alt:  #F3F3F3;   /* fundo alternativo, hover de cards */
--color-border:       #E8E8E8;   /* bordas e divisores */
--color-text:         #0A0A0A;   /* texto principal */
--color-text-muted:   #6B6B6B;   /* texto secundário, labels */
--color-text-inverse: #FFFFFF;   /* texto sobre fundos escuros */
--color-success:      #16A34A;   /* pagamento confirmado, pedido entregue */
--color-warning:      #D97706;   /* pedido pendente, prazo curto */
--color-error:        #DC2626;   /* erros, cancelamento */

--font-display:       'Inter', sans-serif;   /* títulos, headings, nomes */
--font-body:          'Inter', sans-serif;   /* corpo, descrições, bios */
--font-mono:          'JetBrains Mono', monospace;  /* preços, códigos, rastreio */

--border-radius-sm:   4px;
--border-radius-md:   8px;
--border-radius-lg:   12px;
```

### 2.3 Tipografia — fixa e imutável

| Uso | Token | Fonte | Peso |
|---|---|---|---|
| Títulos de seção, headings | `--font-display` | Inter | 700 |
| Corpo, descrições, bios | `--font-body` | Inter | 400 |
| Preços, códigos de pedido, rastreio | `--font-mono` | JetBrains Mono | 500 |
| Nome do artista no card | `--font-display` | Inter | 600 |
| Labels, tags, badges | `--font-body` | Inter | 500, uppercase, letter-spacing 0.05em |

> **Regra:** Inter para tudo visual; JetBrains Mono exclusivo para dados numéricos/alfanuméricos. Nenhum tenant substitui as fontes.

### 2.4 Layout e espaçamento

- **Grid de produtos:** 3–4 colunas desktop / 2 tablet / 1–2 mobile — espaço generoso entre cards
- **Imagem do produto:** proporção 1:1 ou 4:3, fundo branco ou cinza claro, sem sombras pesadas
- **Página de produto:** split 60/40 (mockup / painel de compra) — mockup domina
- **Tipografia:** hierarquia clara — nome da arte > nome do artista > preço > variações
- **CTAs:** um botão principal por tela, cor `--color-primary`, texto simples sem caixa alta obrigatória

### 2.5 O que NUNCA fazer na loja

- Usar cores de festival como fundo de página (azul BTC, etc. ficam no site do festival)
- Grain overlay ou efeitos de textura que disputem atenção com o mockup
- Glow neon em torno de produtos
- Cards de produto com fundo colorido — sempre neutro para a arte se destacar
- Animações excessivas que distraiam do produto
- Tipografia decorativa em campos funcionais (preço, tamanho, CEP)

### 2.6 Mockups de produto — padrão técnico

Todos os produtos devem ter **mockup digital com a arte aplicada**. O mockup é gerado/selecionado no cadastro do produto pelo admin.

| Produto | Fundo do mockup | Ângulo preferencial |
|---|---|---|
| Camiseta | Branco ou cinza claro | Frente plana (flat lay) ou modelo neutro |
| Boné | Branco ou bege claro | Vista frontal + lateral |
| Tela / Fine Art | Parede branca ou cinza claro | Perspectiva ambiente (sala/escritório) |
| Pôster | Parede branca ou moldura fina | Flat ou ambiente clean |

---

## 3. Perfis de Usuário e Acessos

O sistema tem três perfis com isolamento por RLS no Supabase:

| Perfil | Role no banco | Acessa | Não acessa |
|---|---|---|---|
| **admin** | `admin` | Tudo — pedidos, financeiro, royalties, artistas, catálogo | — |
| **producer** | `producer` | Fila de produção — pedidos ativos, arte para download, specs técnicas, inserção de rastreio | Dados financeiros, royalties, outros perfis |
| **artista** | `artista` | Seus produtos, suas vendas, seu saldo, submissão de artes | Pedidos de outros artistas, financeiro BTC |

**Rotas protegidas:**
- `/dashboard/admin` → role `admin` only
- `/dashboard/produtor` → role `producer` only
- `/dashboard/artista` → role `artista` only (vê apenas os seus dados)

---

## 4. Fluxo de Pedido — Visão Completa

```
Cliente (vitrine)
  → seleciona produto + variação + preview
  → carrinho → checkout (dados + CEP + frete)
  → pagamento (PIX -5% ou Cartão via MP Checkout Transparente)
  → webhook MP confirma
  → pedido: status aguardando_producao
  → Ponto de Cuidado vê na fila (dashboard /produtor)
  → Ponto de Cuidado: "Iniciar produção" → status em_producao
  → e-mail automático ao cliente: "em produção"
  → Ponto de Cuidado: "Marcar como despachado" + código rastreio
  → e-mail automático ao cliente: código de rastreio
  → Correios entrega → status entregue
  → royalty creditado no saldo do artista
  → ciclo quinzenal: admin paga via PIX
```

---

## 5. Catálogo de Produtos — Referência Rápida

| Produto | Preço | Royalty base | Resolução mínima |
|---|---|---|---|
| Camiseta | R$ 89 | 25% | 300 DPI (fundo transparente, PNG) |
| Boné | R$ 79 | 22% | 300 DPI patch (PNG) |
| Tela s/moldura 20×30 | R$ 119 | 30% | 150 DPI + 1,5cm sangria |
| Tela s/moldura 30×40 | R$ 159 | 30% | 150 DPI + 1,5cm sangria |
| Tela s/moldura 40×60 | R$ 219 | 30% | 150 DPI + 1,5cm sangria |
| Tela s/moldura 60×90 | R$ 329 | 30% | 150 DPI + 1,5cm sangria |
| Tela c/moldura 20×30 | R$ 179 | 25% | 150 DPI + 0,5cm sangria |
| Tela c/moldura 30×40 | R$ 249 | 25% | 150 DPI + 0,5cm sangria |
| Tela c/moldura 40×60 | R$ 349 | 25% | 150 DPI + 0,5cm sangria |
| Pôster A4 | R$ 49 | 30% | 200 DPI + 3mm sangria (PDF preferencial) |
| Pôster A3 | R$ 79 | 30% | 200 DPI + 3mm sangria |
| Pôster A2 | R$ 119 | 30% | 200 DPI + 3mm sangria |
| Pôster panorâmico 30×90 | R$ 149 | 30% | 200 DPI + 3mm sangria |

---

## 6. Sistema de Royalties Progressivos

```typescript
// lib/royalties.ts
type Tier = 'bronze' | 'prata' | 'ouro' | 'black'

function getTier(monthlySales: number): Tier {
  if (monthlySales >= 80) return 'black'
  if (monthlySales >= 30) return 'ouro'
  if (monthlySales >= 10) return 'prata'
  return 'bronze'
}

const TIER_BONUS: Record<Tier, number> = {
  bronze: 0,
  prata: 3,
  ouro: 6,
  black: 10,
}

function calculateRoyalty(
  salePrice: number,
  royaltyBase: number,
  tier: Tier,
  bonuses: { link?: boolean; launch?: boolean } = {}
): number {
  let pct = royaltyBase + TIER_BONUS[tier]
  if (bonuses.link)   pct += 5
  if (bonuses.launch) pct += 5
  return parseFloat((salePrice * pct / 100).toFixed(2))
}
```

---

## 7. Integrações Externas

### 7.1 Mercado Pago — Checkout Transparente

```typescript
// lib/mercadopago.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! })

// Criar preferência PIX
async function createPixPayment(order: Order) {
  const payment = new Payment(mp)
  return payment.create({
    body: {
      transaction_amount: order.total * 0.95, // desconto 5% PIX
      payment_method_id: 'pix',
      payer: { email: order.customerEmail },
      external_reference: order.id,
    }
  })
}

// Webhook — validar assinatura antes de processar
// POST /api/webhooks/mercadopago
// Header: x-signature — validar com HMAC-SHA256
```

**Variáveis de ambiente necessárias:**
```env
MP_ACCESS_TOKEN=       # Access token da conta MP
MP_WEBHOOK_SECRET=     # Secret para validação de webhook
MP_PUBLIC_KEY=         # Chave pública para Checkout Transparente no frontend
```

### 7.2 Correios API

```typescript
// lib/correios.ts
// Endpoint: https://www.correios.com.br/calculador/...
// Serviços: 04014 (SEDEX) · 04510 (PAC)

async function calculateShipping(
  cepOrigem: string,   // CEP do Ponto de Cuidado (Salvador-BA)
  cepDestino: string,
  peso: number,        // gramas
  comprimento: number, // cm
  altura: number,      // cm
  largura: number      // cm
): Promise<{ pac: ShippingOption; sedex: ShippingOption }>
```

**CEP de origem (Ponto de Cuidado):** a confirmar com o parceiro antes do go-live.

### 7.3 Resend — E-mails transacionais

```typescript
// Disparar por status de pedido:
// pagamento_confirmado → "Pedido confirmado"
// em_producao         → "Seu pedido está sendo produzido"
// despachado          → "Pedido enviado — rastreio: XXXXXXXXX"
// entregue            → "Pedido entregue — como foi?"
// cancelado           → "Pedido cancelado — reembolso em até 5 dias"
```

---

## 8. Modelo de Dados — Schema SQL Completo

```sql
CREATE TYPE user_role AS ENUM ('admin', 'producer', 'artista');

CREATE TABLE app_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  role       user_role NOT NULL DEFAULT 'artista',
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE,
  bio        TEXT,
  city       TEXT,
  instagram  TEXT,
  email      TEXT NOT NULL,
  pix_key    TEXT,
  avatar_url TEXT,
  tier       TEXT DEFAULT 'bronze',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID REFERENCES app_users(id),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE,
  description      TEXT,
  category         TEXT NOT NULL,          -- apparel | decor | print
  subcategory      TEXT,
  image_url        TEXT,
  print_file_url   TEXT,                   -- protegido por RLS
  price            NUMERIC(10,2) NOT NULL,
  royalty_base     NUMERIC(5,2) NOT NULL,
  sizes            TEXT[],
  colors           TEXT[],
  dimensions       TEXT[],
  print_specs      JSONB,                  -- dpi, color_profile, bleed, etc.
  status           TEXT DEFAULT 'pending', -- pending|approved|active|inactive
  approved_at      TIMESTAMPTZ,
  approved_by      UUID REFERENCES app_users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_cpf     TEXT,
  items            JSONB NOT NULL,
  subtotal         NUMERIC(10,2) NOT NULL,
  discount_pix     NUMERIC(10,2) DEFAULT 0,
  shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  payment_method   TEXT,                  -- pix | credit_card | debit_card
  payment_id       TEXT,
  payment_status   TEXT DEFAULT 'pending',
  status           TEXT DEFAULT 'aguardando_pagamento',
  shipping_address JSONB NOT NULL,
  shipping_service TEXT,                  -- PAC | SEDEX
  tracking_code    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id),
  status     TEXT NOT NULL,
  changed_by UUID REFERENCES app_users(id),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE royalties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID REFERENCES app_users(id),
  order_id     UUID REFERENCES orders(id),
  product_id   UUID REFERENCES products(id),
  sale_price   NUMERIC(10,2) NOT NULL,
  royalty_pct  NUMERIC(5,2) NOT NULL,
  amount       NUMERIC(10,2) NOT NULL,
  tier_applied TEXT NOT NULL,
  bonus_reason TEXT,
  status       TEXT DEFAULT 'pending',    -- pending | paid
  paid_at      TIMESTAMPTZ,
  payment_ref  TEXT
);

CREATE TABLE royalty_cycles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID REFERENCES app_users(id),
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  pix_key_used TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',    -- pending | processing | paid
  paid_at      TIMESTAMPTZ,
  payment_ref  TEXT
);

-- RLS críticas
-- products: print_file_url visível apenas para admin e producer
-- orders: producer vê apenas status aguardando_producao e em_producao
-- royalties: artista vê apenas as suas (artist_id = auth.uid())
```

---

## 9. Status de Pedido — Máquina de Estados

```
aguardando_pagamento
  → pagamento_confirmado  (webhook MP)
  → aguardando_producao   (automático após confirmação)
  → em_producao           (Ponto de Cuidado)
  → despachado            (Ponto de Cuidado + tracking_code obrigatório)
  → entregue              (Correios webhook ou admin)
  → cancelado             (admin, só até em_producao)
```

Cada transição de status deve:
1. Atualizar `orders.status` e `orders.updated_at`
2. Inserir registro em `order_status_history`
3. Disparar e-mail ao cliente via Resend (exceto `aguardando_producao`)

---

## 10. Diretrizes de Componentes

### ProductCard (vitrine)
- Fundo: `--color-surface` (branco/neutro) — arte do produto é o elemento visual dominante
- Imagem: proporção 1:1, mockup com fundo limpo, leve sombra `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` no hover
- Nome do artista: `--font-body` bold, `--color-text-muted` — discreto, não compete com a arte
- Título do produto / arte: `--font-display`, `--color-text` — destaque moderado
- Preço: `--font-mono` bold, `--color-text`
- Tag de categoria: borda `--color-border`, fundo transparente, texto `--color-text-muted`, `border-radius: --border-radius-sm`
- `border-radius` do card: `--border-radius-md`
- Badge de tier (ex: "Artista do Mês"): `--color-primary`, discreto no canto superior

### Página de Produto
- Hero split: mockup do produto (60%) + painel de compra (40%)
- Mockup domina — fundo branco/cinza claro, sem elementos decorativos ao redor
- Variantes (tamanho/cor): chips/botões com borda `--color-border`; selecionado = fundo `--color-primary`, texto `--color-text-inverse`
- Botão "Adicionar ao carrinho": largura total, fundo `--color-primary`, fonte `--font-display`
- Bio do artista: seção colapsável abaixo do painel, fundo `--color-surface-alt`
- Specs técnicas: colapsável "Informações de impressão" — relevante para quem precisa

### Checkout
- Layout: uma coluna no mobile; duas colunas no desktop (form + resumo)
- Busca por CEP: `onBlur` → preenche endereço automaticamente
- Cálculo de frete: aparece após CPF e CEP preenchidos, antes da escolha de pagamento
- PIX: badge `−5%` em `--color-primary`; QR Code grande, instrução clara e direta
- Cartão: formulário inline, sem iframe aparente, sem redirecionamento

### Dashboard do Produtor (Ponto de Cuidado)
- Interface 100% funcional e densa — **não aplica o tema do festival**; usa o tema neutro base
- Cards de pedido: informação escaneável, mockup da arte visível para facilitar produção
- Botões de ação: grandes, fáceis de tocar no celular
- Campo de código de rastreio: validação antes de liberar o botão "Despachado"
- Fila vazia: mensagem amigável "Nenhum pedido aguardando produção"

---

## 11. Sprint Atual — Foco de Desenvolvimento

**Sprint 1: Frontend da Vitrine**

Entregar neste sprint:
1. `app/page.tsx` — Home da loja: hero + grid de produtos em destaque
2. `app/produtos/[slug]/page.tsx` — Página de produto com preview e seleção de variação
3. `components/vitrine/ProductCard.tsx` — Card reutilizável para grid
4. `components/produto/VariantSelector.tsx` — Seleção de tamanho/cor
5. `components/produto/ProductPreview.tsx` — Preview da arte no produto
6. Dados carregados do Supabase (produtos com status `active`)
7. Identidade visual completa aplicada (paleta, fontes, grain)

**Não implementar neste sprint:**
- Carrinho funcional (pode ser stub)
- Checkout
- Pagamentos
- Dashboards

---

## 12. Variáveis de Ambiente Necessárias

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Correios
CORREIOS_USERNAME=
CORREIOS_PASSWORD=
CORREIOS_CEP_ORIGEM=        # CEP do Ponto de Cuidado

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=loja@btcgraffiti.com.br

# App
NEXT_PUBLIC_APP_URL=https://loja.btcgraffiti.com.br
```

---

## 13. Referências Rápidas

| Documento | Quando consultar |
|---|---|
| `@PRD_BTC_Loja_v1.md` | Decisões de produto, critérios de aceite, modelo de dados completo |
| `tailwind.config.ts` | Tokens de design, cores, animações, breakpoints |
| `globals.css` | Grain overlay, font-face, scrollbar, utilitários |
| Este arquivo (`CONTEXTO.md`) | Sempre ativo — briefing operacional base |

---

## 14. Estrutura de Pastas do Repo

```
festival-store/
├── app/
│   ├── layout.tsx                        ← layout raiz (injeta tema do tenant)
│   ├── middleware.ts                      ← resolve tenant via hostname
│   ├── page.tsx                           ← vitrine / home da loja
│   ├── artistas/
│   │   └── [slug]/page.tsx               ← perfil + produtos do artista
│   ├── produtos/
│   │   └── [slug]/page.tsx               ← página do produto
│   ├── carrinho/page.tsx
│   ├── checkout/
│   │   ├── page.tsx                       ← form de dados + frete + pagamento
│   │   ├── pix/page.tsx                   ← QR Code PIX + polling de confirmação
│   │   └── sucesso/page.tsx              ← confirmação pós-pagamento
│   ├── pedido/[id]/page.tsx              ← acompanhamento do pedido
│   └── dashboard/
│       ├── admin/
│       │   ├── page.tsx                  ← resumo financeiro
│       │   ├── pedidos/page.tsx
│       │   ├── artistas/page.tsx
│       │   ├── catalogo/page.tsx
│       │   └── royalties/page.tsx
│       ├── produtor/page.tsx             ← fila de produção (Ponto de Cuidado)
│       └── artista/page.tsx             ← painel do artista
├── api/
│   ├── payments/create/route.ts          ← cria preferência MP (PIX ou cartão)
│   ├── webhooks/mercadopago/route.ts     ← webhook de confirmação de pagamento
│   ├── shipping/calculate/route.ts       ← frete Correios por CEP
│   └── royalties/calculate/route.ts     ← cálculo de tier + bônus
├── components/
│   ├── vitrine/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ArtistCard.tsx
│   ├── produto/
│   │   ├── ProductPreview.tsx            ← preview arte no produto
│   │   ├── VariantSelector.tsx
│   │   └── AddToCart.tsx
│   ├── checkout/
│   │   ├── ShippingForm.tsx
│   │   ├── FreightCalculator.tsx
│   │   └── PaymentSelector.tsx
│   └── dashboard/
│       ├── OrderCard.tsx
│       ├── RoyaltiesPanel.tsx
│       └── ArtUploader.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     ← Supabase browser client
│   │   ├── server.ts                     ← Supabase server client (RSC)
│   │   └── types.ts                      ← tipos gerados pelo Supabase CLI
│   ├── mercadopago.ts
│   ├── correios.ts
│   ├── royalties.ts                      ← cálculo de tier e bônus
│   └── tenant.ts                         ← resolve tenant da request
├── store/
│   └── cart.ts                           ← Zustand store do carrinho
├── hooks/
│   ├── useCart.ts
│   └── useOrders.ts
└── public/
    └── tenants/
        └── btcfestival/
            └── logo.png                  ← assets por tenant
```

---

## 15. Arquitetura White-Label e Multi-Tenant

> A plataforma é construída para múltiplos tenants (outros festivais). A instância BTC é o tenant padrão.

### Resolução de tenant (middleware.ts)

```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  // 'loja.btcgraffiti.com.br' → slug 'btcfestival'
  const slug = extractTenantSlug(hostname)
  const response = NextResponse.next()
  response.headers.set('x-tenant-slug', slug)
  return response
}
```

### Dados do tenant no layout (layout.tsx)

O layout injeta apenas **dados de marca** (logo, nome) — não há override de CSS variables.

```typescript
export default async function RootLayout({ children }) {
  const slug = headers().get('x-tenant-slug')
  const tenant = await getTenantBySlug(slug)  // lê do Supabase
  return (
    <html>
      <body>
        <TenantProvider tenant={tenant}>  {/* logo, name, domain */}
          {children}
        </TenantProvider>
      </body>
    </html>
  )
}
// Paleta e tipografia vêm de globals.css — fixas para todos os tenants
```

### Isolamento por tenant no Supabase (RLS)

```sql
-- Todas as tabelas de negócio têm tenant_id
-- O tenant_id nunca é confiado ao cliente — sempre derivado do hostname no servidor
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### Tabela de tenants

```sql
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,  -- 'btcfestival'
  name                TEXT NOT NULL,         -- 'BTC — Bahia de Todas as Cores'
  domain              TEXT UNIQUE,           -- 'loja.btcgraffiti.com.br'
  logo_url            TEXT,                  -- '/tenants/btcfestival/logo.svg'
  royalty_pct_default NUMERIC(5,2) DEFAULT 25.00,
  categories          TEXT[] DEFAULT '{apparel,decor,print}',
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
  -- SEM theme_config: paleta e tipografia são fixas no design system
);
```

### Regras para componentes white-label

Todos os componentes usam CSS variables — **nunca cores hardcoded**:
```tsx
// CORRETO — funciona em qualquer tenant
<button className="bg-[var(--color-primary)] text-[var(--color-text-inverse)]">

// ERRADO — acopla ao tema BTC
<button className="bg-[#E8197A] text-white">

// ERRADO — usa nome antigo de variável BTC
<button className="bg-[var(--btc-magenta)] text-[var(--btc-branco)]">
```

---

*Última atualização: Março 2026 · BTC Loja — Print-on-Demand*
