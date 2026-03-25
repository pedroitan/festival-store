# BTC Loja — Print-on-Demand
## Product Requirements Document · v1.0 · Março 2026

| Campo | Valor |
|---|---|
| Versão | v1.1 — Atualizado com estado real Mar/2026 |
| Data | 25 Mar 2026 |
| Autor | Equipe BTC / Cascade (Windsurf) |
| Status | Em desenvolvimento ativo |
| Repositório | Separado do site BTC — projeto whitelabel independente |
| Parceiro de produção | Ponto de Cuidado — Arte que Transforma · Salvador-BA |

> **Este documento é vivo.** Atualizar a cada decisão relevante de produto.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Público-Alvo e Personas](#2-público-alvo-e-personas)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Catálogo de Produtos e Precificação](#4-catálogo-de-produtos-e-precificação)
5. [Sistema de Royalties](#5-sistema-de-royalties)
6. [Fluxo de Compra](#6-fluxo-de-compra)
7. [Fluxo de Produção — Ponto de Cuidado](#7-fluxo-de-produção--ponto-de-cuidado)
8. [Pagamentos — Mercado Pago](#8-pagamentos--mercado-pago)
9. [Frete — Correios API](#9-frete--correios-api)
10. [Dashboards por Perfil](#10-dashboards-por-perfil)
11. [Stack Tecnológica](#11-stack-tecnológica)
12. [Modelo de Dados](#12-modelo-de-dados)
13. [Critérios de Aceite por Sprint](#13-critérios-de-aceite-por-sprint)
14. [Riscos e Mitigações](#14-riscos-e-mitigações)
15. [Métricas de Sucesso](#15-métricas-de-sucesso)
16. [Fora do Escopo v1](#16-fora-do-escopo-v1)

---

## 1. Visão Geral

### 1.1 Contexto

A loja BTC é uma plataforma whitelabel de print-on-demand desenvolvida como projeto independente do site institucional do festival. A produção física é terceirizada integralmente para o **Ponto de Cuidado — Arte que Transforma** (Salvador-BA), parceiro oficial da operação.

A plataforma consolida pedidos, processa pagamentos, aciona o parceiro de produção via dashboard e gerencia o ciclo completo de royalties para os artistas.

### 1.2 Declaração de Visão

> *"Ser a loja de referência do graffiti e da arte urbana brasileira — gerando renda real e recorrente para os artistas através de produtos físicos de qualidade, com o processo mais transparente e justo do mercado."*

### 1.3 Proposta de Valor

| Para quem | O que entrega |
|---|---|
| **Artista** | Renda passiva com royalties de até 40% sem custo de produção; painel de acompanhamento em tempo real; sistema de tiers que incentiva divulgação |
| **Comprador** | Produtos únicos com arte original de grafiteiros brasileiros; **mockup digital realista da arte aplicada na peça antes da compra**; rastreio automático |
| **Ponto de Cuidado** | Dashboard dedicado com fila de produção organizada; specs técnicas de impressão por pedido; sem dependência de planilhas ou WhatsApp |
| **BTC (gestão)** | Visibilidade financeira completa; royalties calculados automaticamente; operação escalável sem custo fixo de equipe de produção |
| **Outro festival (tenant)** | Loja própria com identidade visual configurável (logo + cor + fonte) em horas, sem desenvolvimento do zero |

### 1.4 Modelo Whitelabel

A plataforma é construída desde o início para ser whitelabel. A identidade visual do BTC é aplicada como "tema padrão", mas a arquitetura suporta múltiplos tenants (outros festivais ou coletivos) com:
- Paleta de cores configurável por tenant
- Logo e identidade própria por instância
- Catálogo de artistas segregado por tenant
- Royalties e financeiro completamente isolados

> **v1.0 foco:** instância BTC apenas. Infraestrutura multi-tenant fica como fundação, sem UI de gestão de tenants nesta versão.

### O que é customizável por tenant

| Elemento | Customizável | Escopo |
|---|---|---|
| Logo e nome do festival | ✅ | Campo `logo_url` + `name` na tabela `tenants` |
| Domínio/subdomínio | ✅ | Campo `domain` na tabela `tenants` |
| Artistas e produtos | ✅ | Isolados por `tenant_id` no banco |
| Royalty padrão (%) | ✅ | `royalty_pct_default` por tenant |
| Categorias de produto habilitadas | ✅ | `categories` por tenant |
| **Paleta de cores** | ❌ | **Fixa — design system imutável** |
| **Tipografia** | ❌ | **Fixa — design system imutável** |
| Layout/estrutura da loja | ❌ | Fixo — muda somente via PR |

### Tenant BTC (primeiro cliente)

O BTC fornece apenas logo, nome e domínio. **Não há configuração de tema** — a paleta e a tipografia da loja são as mesmas para todos os tenants, definidas no design system da plataforma.

```json
{
  "slug": "btcfestival",
  "name": "BTC — Bahia de Todas as Cores",
  "domain": "loja.btcgraffiti.com.br",
  "logo_url": "/tenants/btcfestival/logo.svg",
  "royalty_pct_default": 25,
  "categories": ["apparel", "decor", "print"]
}
```

---

## 2. Público-Alvo e Personas

| Persona | Perfil | Objetivo principal | Dor atual |
|---|---|---|---|
| 🎨 **Artista BTC** | Grafiteiro participante do festival, 20–40 anos, ativo no Instagram | Monetizar sua arte sem investimento; acompanhar vendas pelo celular | Sem canal de venda próprio; custo de produção inviável individualmente |
| 🛍 **Comprador fã** | Entusiasta de arte urbana, 18–45 anos, já segue artistas nas redes | Comprar produto com arte original de um artista específico | Não sabe como comprar diretamente dos artistas |
| 🏭 **Produtor (Ponto de Cuidado)** | Operador de produção, acessa pelo celular ou computador | Receber pedidos organizados e registrar andamento sem fricção | Hoje recebe pedidos por WhatsApp/planilha sem rastreabilidade |
| ⚙️ **Admin BTC** | Gestor da plataforma, equipe pequena | Visão financeira completa; aprovar artes; pagar royalties | Sem sistema integrado — hoje controle manual |

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    LOJA BTC (Frontend)                   │
│  Vitrine → Produto → Carrinho → Checkout → Confirmação  │
└───────────────────┬─────────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Next.js API Routes │
         │   (Backend / BFF)    │
         └──┬──────┬──────┬────┘
            │      │      │
   ┌────────▼─┐ ┌──▼───┐ ┌▼──────────────┐
   │ Supabase │ │  MP  │ │  Correios API  │
   │ (DB+Auth)│ │ API  │ │  (frete+rastr) │
   └────────┬─┘ └──┬───┘ └───────────────┘
            │      │
   ┌────────▼──────▼──────────────────────┐
   │           DASHBOARDS                  │
   │  /admin  · /produtor · /artista       │
   └───────────────────────────────────────┘
```

### Separação de responsabilidades

| Camada | Responsabilidade |
|---|---|
| Frontend público | Vitrine, produto, carrinho, checkout — sem autenticação |
| API Routes | Lógica de negócio: cálculo de frete, criação de pedido, webhook MP, royalties |
| Supabase | Persistência, auth, storage de artes, RLS por perfil |
| Mercado Pago | Processamento de pagamentos (PIX + cartão) + webhooks |
| Correios API | Cálculo de frete em tempo real + rastreio de encomendas |
| Resend | E-mails transacionais por status de pedido |

---

## 4. Catálogo de Produtos e Precificação

### 4.1 Tabela completa

| Categoria | Produto | Variações | Preço venda | Royalty base | Artista recebe | Custo prod. est. | Margem BTC |
|---|---|---|---|---|---|---|---|
| Vestuário | Camiseta (DTF · 100% algodão) | P/M/G/GG/XG · Branco, preto, cinza | R$ 89 | 25% | R$ 22,25 | R$ 35 | R$ 31,75 |
| Vestuário | Boné (bordado digital) | Aba curva/reta · Preto, branco, cáqui | R$ 79 | 22% | R$ 17,38 | R$ 38 | R$ 23,62 |
| Decor | Tela s/ moldura — 20×30 cm | Canvas · chassi 1,5 cm | R$ 119 | 30% | R$ 35,70 | R$ 55 | R$ 28,30 |
| Decor | Tela s/ moldura — 30×40 cm | Canvas · chassi 1,5 cm | R$ 159 | 30% | R$ 47,70 | R$ 70 | R$ 41,30 |
| Decor | Tela s/ moldura — 40×60 cm | Canvas · chassi 1,5 cm | R$ 219 | 30% | R$ 65,70 | R$ 95 | R$ 58,30 |
| Decor | Tela s/ moldura — 60×90 cm | Canvas · chassi 1,5 cm | R$ 329 | 30% | R$ 98,70 | R$ 140 | R$ 90,30 |
| Decor | Tela c/ moldura — 20×30 cm | Fine art · moldura MDF | R$ 179 | 25% | R$ 44,75 | R$ 90 | R$ 44,25 |
| Decor | Tela c/ moldura — 30×40 cm | Fine art · moldura MDF | R$ 249 | 25% | R$ 62,25 | R$ 120 | R$ 66,75 |
| Decor | Tela c/ moldura — 40×60 cm | Fine art · moldura MDF | R$ 349 | 25% | R$ 87,25 | R$ 160 | R$ 101,75 |
| Impresso | Pôster / Fine Art — A4 | Couchê 200g · tubo protetor | R$ 49 | 30% | R$ 14,70 | R$ 12 | R$ 22,30 |
| Impresso | Pôster / Fine Art — A3 | Couchê 200g · tubo protetor | R$ 79 | 30% | R$ 23,70 | R$ 18 | R$ 37,30 |
| Impresso | Pôster / Fine Art — A2 | Couchê 200g · tubo protetor | R$ 119 | 30% | R$ 35,70 | R$ 28 | R$ 55,30 |
| Impresso | Pôster panorâmico 30×90 cm | Couchê 200g · tubo protetor | R$ 149 | 30% | R$ 44,70 | R$ 38 | R$ 66,30 |

> Frete cobrado à parte no checkout via Correios API. Preços sem frete.

### 4.2 Specs técnicas de impressão por produto

| Produto | Resolução mínima | Perfil de cor | Formato aceito | Sangria | Observações |
|---|---|---|---|---|---|
| Camiseta | 300 DPI no tamanho final | sRGB | PNG (fundo transparente) | Não se aplica | Área máx. de impressão: 30×40 cm (frente) |
| Boné | 300 DPI no patch | sRGB | PNG (fundo transparente) | Não se aplica | Patch: máx. 8×5 cm |
| Tela s/ moldura | 150 DPI no tamanho final | sRGB ou Adobe RGB | JPG / TIFF | 1,5 cm em cada lado para esticamento | Bordas espelhadas ou cor sólida definida no upload |
| Tela c/ moldura | 150 DPI no tamanho final | sRGB ou Adobe RGB | JPG / TIFF | 0,5 cm | Fine art impression — sem bordas aparentes |
| Pôster / Fine Art | 200 DPI no tamanho final | sRGB | JPG / PNG / PDF (PDF preferencial) | 3 mm em cada lado | Papel couchê 200g ou fotográfico |

---

## 5. Sistema de Royalties

### 5.1 Tiers progressivos

O royalty sobe conforme volume de vendas mensais. O bônus se aplica sobre **todas** as vendas do mês ao atingir o tier, não apenas sobre as excedentes.

| Tier | Vendas/mês | Bônus | Impressos | Telas s/moldura | Telas c/moldura | Vestuário |
|---|---|---|---|---|---|---|
| Bronze | 0–9 | — | 30% | 30% | 25% | 22–25% |
| Prata | 10–29 | +3 pp | 33% | 33% | 28% | 25–28% |
| Ouro | 30–79 | +6 pp | 36% | 36% | 31% | 28–31% |
| Black | 80+ | +10 pp | 40% | 40% | 35% | 32–35% |

### 5.2 Incentivos extras

| Incentivo | Descrição | Duração |
|---|---|---|
| Link de indicação | +5% sobre vendas geradas pelo link personalizado do artista | 30 dias por venda indicada |
| Lançamento de arte | +5% em todas as vendas da arte nova | 7 dias após aprovação |
| Destaque editorial | Artistas tier Ouro e Black elegíveis para "Artista do mês" na home | Mensal, curado pelo BTC |
| Pagamento semanal | Tier Black recebe semanal (demais: quinzenal) | Enquanto no tier |

### 5.3 Cálculo e pagamento

- Royalty calculado sobre o **preço de venda do produto** (sem frete)
- Creditado no saldo do artista após status `entregue`
- Pago via PIX na chave cadastrada no perfil
- Ciclos: quinzenal (dias 10 e 25) para tiers Bronze/Prata/Ouro; semanal para tier Black
- Saldo mínimo para pagamento automático: R$ 20,00

---

## 6. Fluxo de Compra

```
[Vitrine] → [Página do produto] → [Configurar variação]
    → [Preview da arte no produto] → [Adicionar ao carrinho]
    → [Checkout: dados pessoais] → [CEP + cálculo de frete]
    → [Escolha PAC ou SEDEX] → [Escolha PIX (-5%) ou Cartão]
    → [Confirmação de pagamento] → [E-mail de confirmação]
    → [Fila de produção (Ponto de Cuidado)]
    → [Status: em produção → e-mail ao cliente]
    → [Despacho + código de rastreio → e-mail ao cliente]
    → [Entrega confirmada → royalty creditado]
```

### Detalhamento por etapa

1. Cliente navega na vitrine — filtros por artista, categoria, estilo
2. Abre página do produto — galeria de fotos do produto, bio resumida do artista
3. Seleciona variação (tamanho, cor, acabamento) — preview atualiza em tempo real
4. Adiciona ao carrinho — carrinho unificado suporta produtos de múltiplos artistas
5. Checkout: nome, e-mail, CPF, endereço completo (busca por CEP automática)
6. Cálculo de frete: Correios API retorna PAC e SEDEX com prazo e preço
7. Seleção de pagamento:
   - **PIX:** QR Code dinâmico gerado pelo Mercado Pago; validade 30 min; desconto de 5% aplicado
   - **Cartão:** Checkout Transparente MP — formulário inline, sem redirecionamento
8. Webhook MP confirma pagamento → pedido criado com status `pagamento_confirmado`
9. Sistema notifica o Ponto de Cuidado (push no dashboard + e-mail)
10. Cliente recebe e-mail de confirmação com resumo e prazo estimado

---

## 7. Fluxo de Produção — Ponto de Cuidado

### 7.1 Acesso e perfil

- Login dedicado com perfil `producer` — acesso exclusivo ao dashboard de produção
- **Sem acesso a:** dados financeiros, royalties, painel admin, perfis de artistas
- Interface otimizada para uso em celular (operador em movimento)

### 7.2 Etapas e status

| Status | Quem define | O que acontece |
|---|---|---|
| `aguardando_producao` | Sistema (automático após pagamento) | Aparece na fila do Ponto de Cuidado |
| `em_producao` | Ponto de Cuidado (botão no dashboard) | E-mail automático ao cliente: "seu pedido está sendo produzido" |
| `despachado` | Ponto de Cuidado (insere código de rastreio) | E-mail com rastreio ao cliente; royalty entra em contagem |
| `entregue` | Correios API (webhook) ou admin manual | Royalty creditado no saldo do artista |

### 7.3 Informações visíveis por pedido no dashboard do produtor

- Número do pedido e data
- Produto: nome, categoria, variação (tamanho/cor/acabamento)
- Arte: thumbnail + **link para download do arquivo de impressão em alta resolução**
- Specs técnicas: resolução, perfil de cor, sangria, área de impressão
- Endereço de entrega completo (para etiqueta dos Correios)
- Serviço de frete: PAC ou SEDEX
- Prazo estimado de entrega ao cliente
- Campo para inserir código de rastreio (obrigatório para marcar como despachado)

### 7.4 Prazos de produção por categoria (referência)

| Categoria | Produção | Postagem | Prazo total estimado (cliente) |
|---|---|---|---|
| Pôster / Fine Art | 1–2 dias úteis | D+2 | 7–12 dias úteis (PAC) |
| Camiseta / Boné | 2–4 dias úteis | D+4 | 9–14 dias úteis (PAC) |
| Tela s/ moldura | 3–5 dias úteis | D+5 | 10–15 dias úteis (PAC) |
| Tela c/ moldura | 4–6 dias úteis | D+6 | 12–17 dias úteis (PAC) |

> SEDEX reduz prazo de entrega em ~50% após postagem. Prazos acima são estimativas; confirmar SLA final com o Ponto de Cuidado antes do lançamento.

---

## 8. Pagamentos — Mercado Pago

### 8.1 Estratégia: gateway único

Mercado Pago Checkout Transparente como solução única para PIX e cartão — elimina a necessidade de integrar dois provedores e centraliza reconciliação e webhooks.

### 8.2 Taxas vigentes (referência 2025)

| Modalidade | Taxa MP | Observação |
|---|---|---|
| PIX via Checkout Transparente | 0% (até R$ 15k/mês faturamento CNPJ) · 0,49% acima | Liquidação imediata |
| Cartão de crédito à vista (recebimento imediato) | ~4,98% | |
| Cartão de crédito à vista (recebimento em 30 dias) | ~3,98% | Melhor para fluxo de caixa |
| Cartão de débito | ~1,99% | |

### 8.3 Por que não PIX direto por chave

PIX por chave avulsa não gera webhook de confirmação automática — exigiria reconciliação manual de cada pagamento. O Checkout Transparente gera QR Code dinâmico por pedido, webhook de confirmação instantânea e reconciliação automática, mantendo a experiência de "pagar via PIX" para o cliente.

### 8.4 Incentivo PIX

Desconto de 5% aplicado automaticamente ao total (sem frete) para pagamentos via PIX. O custo do desconto é absorvido pela diferença de taxa entre PIX (≈0%) e cartão (≈4,98%).

### 8.5 Integração técnica

```
POST /api/payments/create
  → Cria preferência no MP com itens, valor, desconto PIX se aplicável
  → Retorna QR Code (PIX) ou token de cartão

POST /api/webhooks/mercadopago
  → Valida assinatura do webhook
  → Atualiza status do pedido
  → Dispara notificação para Ponto de Cuidado
  → Dispara e-mail de confirmação ao cliente
```

---

## 9. Frete — Correios API

### 9.1 Serviços disponíveis

| Serviço | Prazo adicional | Indicado para |
|---|---|---|
| PAC | +5–8 dias úteis após postagem | Padrão — menor custo |
| SEDEX | +1–3 dias úteis após postagem | Compras urgentes |

### 9.2 Cálculo no checkout

- Endpoint: `POST /api/shipping/calculate`
- Input: CEP destino + lista de itens (peso + dimensões por produto)
- Output: PAC e SEDEX com preço e prazo estimado
- Exibidos antes da finalização — cliente escolhe o serviço

### 9.3 Dimensões e pesos para cálculo

| Produto | Peso embalado | Dimensões embalagem (C×L×A) | Tipo embalagem |
|---|---|---|---|
| Camiseta | 350 g | 30×25×5 cm | Saco + papelão |
| Boné | 400 g | 25×22×15 cm | Caixa rígida |
| Tela s/moldura 20×30 | 800 g | 35×25×8 cm | Caixa + cantoneiras |
| Tela s/moldura 30×40 | 1,5 kg | 45×35×10 cm | Caixa + cantoneiras |
| Tela s/moldura 40×60 | 2,2 kg | 65×45×10 cm | Caixa + cantoneiras |
| Tela s/moldura 60×90 | 4,5 kg | 95×65×12 cm | Caixa reforçada |
| Tela c/moldura 20×30 | 1,2 kg | 35×25×8 cm | Plástico bolha + caixa |
| Tela c/moldura 30×40 | 2,0 kg | 45×35×10 cm | Plástico bolha + caixa |
| Tela c/moldura 40×60 | 3,5 kg | 65×45×12 cm | Plástico bolha + caixa |
| Pôster A4 | 200 g | tubo 35×10×10 cm | Tubo papelão |
| Pôster A3 | 250 g | tubo 50×10×10 cm | Tubo papelão |
| Pôster A2 | 300 g | tubo 65×10×10 cm | Tubo papelão |
| Pôster panorâmico 30×90 | 300 g | tubo 95×10×10 cm | Tubo papelão |

### 9.4 Rastreio

- Código inserido pelo Ponto de Cuidado no dashboard após postagem
- Sistema dispara e-mail automático ao cliente com link de rastreio
- Webhook dos Correios (ou polling diário) atualiza status para `entregue`

---

## 10. Dashboards por Perfil

### 10.1 Perfil `admin` — Equipe BTC

**Pedidos**
- Visão completa de todos os pedidos com filtros: status, produto, artista, data, período
- Ação manual de cancelamento e reembolso
- Export CSV de pedidos por período

**Financeiro**
- Receita total, custo de produção estimado, margem bruta por período
- Royalties pendentes e pagos por artista
- Registro de pagamentos realizados (data, valor, chave PIX, comprovante)
- Botão "Pagar royalties" — gera lista de artistas com saldo ≥ R$ 20,00

**Catálogo**
- Aprovar / reprovar artes submetidas pelos artistas (com preview do mockup)
- Ativar / pausar / arquivar produtos
- Configurar royalty base por artista (override do padrão por categoria)

**Artistas**
- Lista de artistas cadastrados com tier atual, vendas do mês e saldo pendente
- Cadastro manual de novos artistas
- Edição de perfil e chave PIX

### 10.2 Perfil `producer` — Ponto de Cuidado

- Fila de pedidos com status `aguardando_producao` e `em_producao`
- Cada card de pedido: produto, variação, arte (thumbnail + download em alta res.), specs, endereço
- Botão "Iniciar produção" → status muda para `em_producao`
- Botão "Marcar como despachado" → campo obrigatório para código de rastreio dos Correios
- Filtro por data e por categoria de produto
- **Sem acesso a:** valores, royalties, dados financeiros, outros perfis

### 10.3 Perfil `artista` — Dashboard do Artista

- Resumo: vendas do mês, saldo pendente, tier atual, progresso para próximo tier
- Produtos ativos na loja com vendas por produto
- Submissão de nova arte: upload do arquivo + título + descrição + categoria
- Status de artes submetidas: `em análise` | `aprovada` | `reprovada (com motivo)`
- Link de indicação personalizado (com contador de cliques e conversões)
- Histórico de pagamentos recebidos
- Edição de perfil e chave PIX

---

## 11. Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | Next.js 14 + TypeScript | App Router, SSG para vitrine (SEO), rotas de API, monorepo |
| Estilo | Tailwind CSS + tokens BTC | Velocidade, consistência visual, design tokens por tenant |
| Banco de dados | Supabase (PostgreSQL) | RLS nativo, Auth, Storage — isolamento por perfil garantido |
| Autenticação | Supabase Auth | Três perfis: admin, producer, artista — magic link ou e-mail/senha |
| Storage de artes | Supabase Storage | bucket `produtos` — mockups e artes originais |
| Pagamentos | Mercado Pago API — Checkout Transparente | PIX + cartão unificados, webhook robusto, líder no Brasil |
| Geração de mockups | Google Gemini AI (`gemini-3.1-flash-image-preview`) | Arte aplicada digitalmente no produto via IA generativa |
| Frete | Correios API (webservice oficial) | Cálculo em tempo real por CEP, PAC e SEDEX, rastreio integrado |
| E-mail transacional | Resend | QR Code PIX via URL pública, dominio `btcfestival.com.br` verificado |
| Deploy | Vercel | CI/CD automático a cada push no `master` |
| Analytics | Plausible.io | LGPD-friendly, sem cookies, leve |

### 11.1 Estrutura de pastas

```
btc-loja/
├── app/
│   ├── page.tsx                        ← vitrine / home da loja
│   ├── artistas/
│   │   └── [slug]/page.tsx             ← perfil + produtos do artista
│   ├── produtos/
│   │   └── [slug]/page.tsx             ← página do produto
│   ├── carrinho/page.tsx
│   ├── checkout/page.tsx
│   ├── pedido/[id]/page.tsx            ← confirmação e acompanhamento
│   └── dashboard/
│       ├── admin/page.tsx
│       ├── produtor/page.tsx
│       └── artista/page.tsx
├── api/
│   ├── payments/create/route.ts        ← cria preferência MP
│   ├── webhooks/mercadopago/route.ts   ← webhook de confirmação
│   ├── shipping/calculate/route.ts     ← frete Correios
│   └── royalties/calculate/route.ts   ← cálculo de tier + bônus
├── components/
│   ├── vitrine/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ArtistCard.tsx
│   ├── produto/
│   │   ├── ProductPreview.tsx          ← preview arte no produto
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
│   ├── mercadopago.ts
│   ├── correios.ts
│   ├── royalties.ts                    ← cálculo de tier e bônus
│   └── supabase.ts
├── data/
│   └── products.ts                     ← catálogo com specs técnicas
└── styles/
    ├── globals.css                     ← grain, scrollbar, variáveis BTC
    └── tokens.css                      ← paleta e tipografia
```

---

## 12. Modelo de Dados

```sql
-- Enum de perfis
CREATE TYPE user_role AS ENUM ('admin', 'producer', 'artista');

-- Usuários da plataforma
CREATE TABLE app_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  role       user_role NOT NULL DEFAULT 'artista',
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE,                 -- para URL do perfil
  bio        TEXT,
  city       TEXT,
  instagram  TEXT,
  email      TEXT NOT NULL,
  pix_key    TEXT,
  avatar_url TEXT,
  tier       TEXT DEFAULT 'bronze',       -- bronze | prata | ouro | black
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Produtos
CREATE TABLE products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID REFERENCES app_users(id),
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE,
  description      TEXT,
  category         TEXT NOT NULL,         -- apparel | decor | print
  subcategory      TEXT,                  -- tshirt | bone | tela-sm | tela-cm | poster
  image_url        TEXT,                  -- imagem de vitrine (mockup)
  print_file_url   TEXT,                  -- arquivo de impressão (protegido, RLS)
  price            NUMERIC(10,2) NOT NULL,
  royalty_base     NUMERIC(5,2) NOT NULL,
  sizes            TEXT[],
  colors           TEXT[],
  dimensions       TEXT[],               -- para produtos de decor
  print_specs      JSONB,                -- resolução, perfil de cor, sangria, etc.
  status           TEXT DEFAULT 'pending', -- pending | approved | active | inactive
  approved_at      TIMESTAMPTZ,
  approved_by      UUID REFERENCES app_users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Pedidos
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_cpf     TEXT,
  items            JSONB NOT NULL,        -- [{product_id, variant, qty, price, royalty}]
  subtotal         NUMERIC(10,2) NOT NULL,
  discount_pix     NUMERIC(10,2) DEFAULT 0,
  shipping_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  payment_method   TEXT,                 -- pix | credit_card | debit_card
  payment_id       TEXT,                 -- ID transação Mercado Pago
  payment_status   TEXT DEFAULT 'pending',
  status           TEXT DEFAULT 'aguardando_pagamento',
  shipping_address JSONB NOT NULL,
  shipping_service TEXT,                 -- PAC | SEDEX
  tracking_code    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Histórico de status dos pedidos
CREATE TABLE order_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id),
  status     TEXT NOT NULL,
  changed_by UUID REFERENCES app_users(id),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Royalties por venda
CREATE TABLE royalties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID REFERENCES app_users(id),
  order_id     UUID REFERENCES orders(id),
  product_id   UUID REFERENCES products(id),
  sale_price   NUMERIC(10,2) NOT NULL,
  royalty_pct  NUMERIC(5,2) NOT NULL,    -- % efetivo (base + tier + bônus)
  amount       NUMERIC(10,2) NOT NULL,
  tier_applied TEXT NOT NULL,            -- bronze | prata | ouro | black
  bonus_reason TEXT,                     -- link_indicacao | lancamento | null
  status       TEXT DEFAULT 'pending',   -- pending | paid
  paid_at      TIMESTAMPTZ,
  payment_ref  TEXT                      -- referência do PIX de pagamento ao artista
);

-- Ciclos de pagamento de royalties
CREATE TABLE royalty_cycles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id    UUID REFERENCES app_users(id),
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  pix_key_used TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',   -- pending | processing | paid
  paid_at      TIMESTAMPTZ,
  payment_ref  TEXT
);

-- Tabela de tenants (white-label)
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,  -- 'btcfestival'
  name                TEXT NOT NULL,
  domain              TEXT UNIQUE,           -- 'loja.btcgraffiti.com.br'
  logo_url            TEXT,
  primary_color       TEXT DEFAULT '#0B12CC',
  royalty_pct_default NUMERIC(5,2) DEFAULT 25.00,
  active              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
  -- SEM theme_config: paleta e tipografia são fixas no design system
);

-- Policies RLS principais
-- products.print_file_url: SELECT somente para admin e producer
-- orders: SELECT para admin; produtor só vê pedidos com status ativo de produção
-- royalties: SELECT/UPDATE somente para admin; artista vê apenas os seus
```

---

## 13. Critérios de Aceite por Sprint

### Sprint 1 — Vitrine e Página de Produto ✅ CONCLUÍDO

| # | Critério | Prioridade |
|---|---|---|
| 1 | Vitrine lista produtos com foto, nome do artista, categoria e preço | ✅ |
| 2 | Página do produto exibe galeria, bio do artista | ✅ |
| 3 | Botão "Adicionar ao carrinho" funciona; carrinho persiste na sessão | ✅ |
| 4 | Navbar com identidade BTC (Neocrash, bg-navbar, personagem) | ✅ |
| 5 | Dados de produto carregados do Supabase | ✅ |
| 6 | Layout mobile-first funcional | ✅ |

### Sprint 2 — Checkout + Pagamentos ⚠️ PARCIALMENTE CONCLUÍDO

| # | Critério | Prioridade |
|---|---|---|
| 1 | Checkout coleta nome, e-mail, CPF e endereço com busca por CEP | ✅ |
| 2 | Cálculo de frete via Correios API retorna PAC e SEDEX com prazo e preço | 🔴 pendente |
| 3 | Pagamento via PIX: QR Code dinâmico gerado pelo MP | ✅ |
| 4 | Desconto de 5% aplicado no total PIX | 🔴 pendente |
| 5 | Pagamento via cartão: formulário inline | 🔴 pendente |
| 6 | Webhook MP atualiza status do pedido | ✅ (implementado) |
| 7 | E-mail de confirmação com QR Code enviado ao cliente | ✅ |
| 8 | Página `/pedido/[id]` com PixPanel (QR + copia-e-cola) | ✅ |

### Sprint 2.5 — Admin (extra-sprint) ✅ CONCLUÍDO

| # | Critério | Status |
|---|---|---|
| 1 | `/admin/novo-produto`: upload de arte + geração de mockups via Gemini AI | ✅ |
| 2 | `/admin`: dashboard com listagem de todos os produtos (ativos + inativos) | ✅ |
| 3 | Toggle ativo/inativo por produto | ✅ |
| 4 | Delete de produto com confirmação | ✅ |

### Sprint 3 — Auth + Dashboard do Ponto de Cuidado

| # | Critério | Prioridade |
|---|---|---|
| 1 | Supabase Auth (magic link) para perfis admin, producer, artista | CRÍTICO |
| 2 | Proteção das rotas `/admin`, `/dashboard` por perfil | CRÍTICO |
| 3 | Login com perfil `producer` acessa apenas o dashboard de produção | CRÍTICO |
| 4 | Fila exibe pedidos com status `aguardando_producao` | CRÍTICO |
| 5 | Card de pedido mostra produto, variação, arte (download), specs e endereço | CRÍTICO |
| 6 | Botões "Iniciar produção" e "Marcar como despachado" (com rastreio obrigatório) | CRÍTICO |
| 7 | E-mail automático ao cliente com código de rastreio após despacho | ALTO |

### Sprint 4 — Dashboards Admin e Artista

| # | Critério | Prioridade |
|---|---|---|
| 1 | Admin visualiza todos pedidos com filtros e pode exportar CSV | CRÍTICO |
| 2 | Admin aprova/reprova artes com preview do mockup | CRÍTICO |
| 3 | Admin visualiza royalties pendentes e registra pagamentos | ALTO |
| 4 | Artista vê vendas, saldo, tier e histórico de pagamentos | CRÍTICO |
| 5 | Artista submete nova arte com upload de arquivo e specs automáticas | ALTO |
| 6 | Link de indicação gerado automaticamente por artista | MÉDIO |

---

## 14. Riscos e Mitigações

| # | Risco | Impacto | Mitigação |
|---|---|---|---|
| R1 | Correios API instável ou fora do ar | ALTO | Fallback: exibir frete fixo estimado por região; retomar cálculo real quando API voltar |
| R2 | Webhook MP não chegar (timeout, falha de rede) | ALTO | Polling de status como fallback a cada 5 min para pedidos com pagamento pendente |
| R3 | Arquivo de impressão com resolução insuficiente | ALTO | Validação de DPI mínimo no upload; bloqueio com mensagem clara antes de aceitar |
| R4 | Atraso de produção no Ponto de Cuidado | MÉDIO | SLA formal no contrato; alerta no dashboard admin quando pedido passa de 48h em `aguardando_producao` |
| R5 | Artista com chave PIX inválida no pagamento de royalties | MÉDIO | Validação de chave PIX no cadastro; e-mail de alerta antes do ciclo de pagamento |
| R6 | Volume alto de pedidos simultâneos no lançamento | MÉDIO | Supabase escala automaticamente; Vercel serverless por função; testar com k6 antes do go-live |
| R7 | Complexidade fiscal dos royalties (MEI, autônomo, PJ) | MÉDIO | Iniciar com repasse simplificado via PIX; consultar contador antes do go-live |

---

## 15. Métricas de Sucesso

| KPI | Meta 1 mês | Meta 3 meses | Meta 12 meses |
|---|---|---|---|
| Pedidos / mês | 20 | 80 | 300 |
| Ticket médio | R$ 120 | R$ 140 | R$ 160 |
| Taxa de conversão (visita → pedido) | 1% | 1,5% | 2,5% |
| Royalties pagos / mês (R$) | R$ 500 | R$ 2.000 | R$ 8.000 |
| Artistas com produto ativo | 10 | 25 | 50 |
| Tempo médio de produção (dias úteis) | < 5 | < 4 | < 3 |
| Taxa de satisfação pós-entrega | — | ≥ 4,2/5 | ≥ 4,5/5 |

---

## 16. Fora do Escopo v1

| Funcionalidade | Quando reavaliar |
|---|---|
| UI de gestão de múltiplos tenants (whitelabel self-service) | v2 — após validar instância BTC |
| Parcelamento no cartão | v2 — avaliar demanda e impacto nas taxas MP |
| App mobile nativo | PWA atende; nativo só com demanda comprovada |
| Integração com transportadora além dos Correios | v2 — Jadlog, Total Express |
| Marketplace P2P (artista vende diretamente) | Complexidade fiscal; reavaliar após v1 estável |
| Avaliações e reviews de produtos | v2 |
| NFT / arte digital | Fora do escopo BTC |
| Internacionalização (EN/ES) | Português como único idioma na v1 |

---

## 17. Roadmap White-Label e Monetização SaaS

> BTC é o cliente zero. A partir do segundo festival, a plataforma gera receita própria.

### Fases white-label

| Fase | Entrega | Prazo estimado |
|---|---|---|
| v1.0 | Instância BTC (monoinstancia) | Jun–Ago 2026 |
| v1.1 | Multi-tenancy completo (tenant_id no DB + middleware) | Set 2026 |
| v1.2 | UI de onboarding: novo festival configura tema e domínio | Out 2026 |
| v2.0 | Self-serve: festival cria conta e loja sem intervenção técnica | 2027 |

### Modelo de monetização para outros festivais

| Modelo | Valor | Quando ativar |
|---|---|---|
| **BTC (dono)** | Gratuito | Sempre |
| **Setup fee** | R$ 500–1.000 por onboarding | A partir do 2º cliente |
| **Flat fee mensal** | R$ 200–500/mês | Após go-live do tenant |
| **Revenue share** | 3–5% do GMV mensal | Alternativa ao flat fee para festivais com alto volume |
| **Enterprise** | Preço negociado | Redes de festivais ou volume > R$ 50k/mês |

### Segundo cliente esperado

- Conversa com outro festival de arte urbana antes de lançar v1.1
- Validar interesse e willingness to pay antes de investir em multi-tenancy UI

---

*Última atualização: 25 Mar 2026 · v1.1 · BTC Loja — Print-on-Demand · deploy: https://festival-store.vercel.app*
