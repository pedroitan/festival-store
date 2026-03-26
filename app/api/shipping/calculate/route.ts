import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SERVICES = [
  { code: "04510", name: "PAC" },
  { code: "04014", name: "SEDEX" },
];

const PRODUCT_WEIGHTS: Record<string, number> = {
  Camiseta: 0.3,
  "Boné": 0.2,
  "Tela s/ moldura": 1.5,
  "Pôster Fine Art": 0.15,
};

export async function POST(req: NextRequest) {
  try {
    const { cep, items } = await req.json();
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

    const codes = SERVICES.map((s) => s.code).join(",");

    const params = new URLSearchParams({
      nCdEmpresa: "",
      sDsSenha: "",
      nCdServico: codes,
      sCepOrigem: origem,
      sCepDestino: dest,
      nVlPeso: String(Math.max(0.1, Math.round(weight * 10) / 10)),
      nCdFormato: "1",
      nVlComprimento: "20",
      nVlAltura: "10",
      nVlLargura: "15",
      nVlDiametro: "0",
      sCdMaoPropria: "n",
      nVlValorDeclarado: "0",
      sCdAvisoRecebimento: "n",
      StrRetorno: "xml",
      nIndicaCalculo: "3",
    });

    const res = await fetch(
      `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params}`,
      { cache: "no-store" }
    );

    if (!res.ok) throw new Error(`Correios API: ${res.status}`);

    const xml = await res.text();

    const parsed: { code: string; name: string; price: number; days: number }[] = [];

    for (const match of Array.from(xml.matchAll(/<cServico>([\s\S]*?)<\/cServico>/g))) {
      const block = match[1];
      const code = block.match(/<Codigo>(.*?)<\/Codigo>/)?.[1]?.trim();
      const priceStr = block.match(/<Valor>(.*?)<\/Valor>/)?.[1]?.trim();
      const daysStr = block.match(/<PrazoEntrega>(.*?)<\/PrazoEntrega>/)?.[1]?.trim();
      const errMsg = block.match(/<MsgErro>(.*?)<\/MsgErro>/)?.[1]?.trim();

      if (!code || !priceStr || errMsg) continue;

      const service = SERVICES.find((s) => s.code === code);
      if (!service) continue;

      const price = Math.round(parseFloat(priceStr.replace(",", ".")) * 100);
      const days = parseInt(daysStr ?? "0", 10);

      if (price > 0) parsed.push({ code, name: service.name, price, days });
    }

    if (parsed.length === 0) {
      return NextResponse.json({ error: "Nenhuma opção de frete disponível para este CEP" }, { status: 422 });
    }

    return NextResponse.json({ services: parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
