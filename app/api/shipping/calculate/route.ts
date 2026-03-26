import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MELHORENVIO_URL = "https://melhorenvio.com.br/api/v2/me/shipment/calculate";

const PRODUCT_WEIGHTS: Record<string, number> = {
  Camiseta: 0.3,
  "Boné": 0.2,
  "Tela s/ moldura": 1.5,
  "Pôster Fine Art": 0.15,
};

// Tabela de frete por UF (origem: Salvador/BA) — fallback quando Correios API falha
// valores em centavos
const SHIPPING_TABLE: Record<string, { pac: number; pacDays: number; sedex: number; sedexDays: number }> = {
  BA: { pac: 2290, pacDays: 5, sedex: 3890, sedexDays: 2 },
  SE: { pac: 2590, pacDays: 6, sedex: 4290, sedexDays: 2 },
  AL: { pac: 2590, pacDays: 6, sedex: 4290, sedexDays: 2 },
  PE: { pac: 2790, pacDays: 7, sedex: 4590, sedexDays: 2 },
  PB: { pac: 2790, pacDays: 7, sedex: 4590, sedexDays: 3 },
  RN: { pac: 2990, pacDays: 8, sedex: 4890, sedexDays: 3 },
  CE: { pac: 2990, pacDays: 8, sedex: 4890, sedexDays: 3 },
  PI: { pac: 3190, pacDays: 9, sedex: 5090, sedexDays: 3 },
  MA: { pac: 3190, pacDays: 9, sedex: 5090, sedexDays: 3 },
  PA: { pac: 3490, pacDays: 10, sedex: 5590, sedexDays: 4 },
  AP: { pac: 3690, pacDays: 12, sedex: 5990, sedexDays: 5 },
  AM: { pac: 3690, pacDays: 12, sedex: 5990, sedexDays: 5 },
  RR: { pac: 3890, pacDays: 14, sedex: 6290, sedexDays: 5 },
  AC: { pac: 3890, pacDays: 14, sedex: 6290, sedexDays: 5 },
  RO: { pac: 3690, pacDays: 12, sedex: 5990, sedexDays: 4 },
  TO: { pac: 3290, pacDays: 9, sedex: 5290, sedexDays: 3 },
  GO: { pac: 3290, pacDays: 9, sedex: 5290, sedexDays: 3 },
  DF: { pac: 3290, pacDays: 9, sedex: 5290, sedexDays: 3 },
  MT: { pac: 3490, pacDays: 10, sedex: 5590, sedexDays: 4 },
  MS: { pac: 3490, pacDays: 10, sedex: 5590, sedexDays: 4 },
  MG: { pac: 3190, pacDays: 8, sedex: 5090, sedexDays: 3 },
  ES: { pac: 3190, pacDays: 8, sedex: 5090, sedexDays: 3 },
  RJ: { pac: 3390, pacDays: 9, sedex: 5290, sedexDays: 3 },
  SP: { pac: 3390, pacDays: 9, sedex: 5290, sedexDays: 3 },
  PR: { pac: 3590, pacDays: 10, sedex: 5590, sedexDays: 3 },
  SC: { pac: 3590, pacDays: 10, sedex: 5590, sedexDays: 3 },
  RS: { pac: 3790, pacDays: 11, sedex: 5890, sedexDays: 4 },
};

const DEFAULT_ZONE = { pac: 3290, pacDays: 10, sedex: 5290, sedexDays: 4 };

function fallbackByState(uf: string, multiplier: number) {
  const zone = SHIPPING_TABLE[uf.toUpperCase()] ?? DEFAULT_ZONE;
  return [
    { code: "04510", name: "PAC", price: Math.round(zone.pac * multiplier), days: zone.pacDays },
    { code: "04014", name: "SEDEX", price: Math.round(zone.sedex * multiplier), days: zone.sedexDays },
  ];
}

async function calcMelhorEnvio(
  originCep: string, destCep: string, weight: number
): Promise<{ code: string; name: string; price: number; days: number }[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(MELHORENVIO_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "festival-store/1.0 (contato@btcgraffiti.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: destCep },
        package: { height: 10, width: 15, length: 20, weight: Math.max(0.1, weight) },
        options: { receipt: false, own_hand: false },
        services: "1,2",
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((s: { error?: unknown; price?: string | number }) => !s.error && s.price)
      .map((s: { id: number; name: string; price: string | number; delivery_time: number }) => ({
        code: String(s.id),
        name: s.name,
        price: Math.round(Number(s.price) * 100),
        days: s.delivery_time,
      }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cep, items, uf } = await req.json();
    const dest = String(cep).replace(/\D/g, "");
    if (dest.length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
    }

    const origem = (process.env.CORREIOS_CEP_ORIGEM ?? "41810000").replace(/\D/g, "");

    const weight = Array.isArray(items)
      ? items.reduce((acc: number, item: { category: string; quantity: number }) => {
        const w = PRODUCT_WEIGHTS[item.category] ?? 0.3;
        return acc + w * (item.quantity ?? 1);
      }, 0)
      : 0.3;

    const meResult = await calcMelhorEnvio(origem, dest, weight);

    if (meResult.length > 0) {
      return NextResponse.json({ services: meResult, source: "melhorenvio" });
    }

    const weightMultiplier = Math.max(1, weight / 0.3);
    return NextResponse.json({ services: fallbackByState(uf ?? "", weightMultiplier), source: "tabela" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
