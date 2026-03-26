// Teste de cálculo de frete via Melhor Envio API
// Executar: node scripts/test-shipping.mjs
// Requer: MELHORENVIO_TOKEN no .env.local (ou como variável de ambiente)

import { readFileSync } from "fs";
import { resolve } from "path";

// Carregar .env.local manualmente
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
} catch { /* sem .env.local */ }

const TOKEN = process.env.MELHORENVIO_TOKEN;
const ORIGIN_CEP = (process.env.CORREIOS_CEP_ORIGEM ?? "41810000").replace(/\D/g, "");

if (!TOKEN) {
  console.error("❌ MELHORENVIO_TOKEN não encontrado no .env.local");
  process.exit(1);
}

function fmt(val) {
  return `R$ ${Number(val).toFixed(2).replace(".", ",")}`;
}

async function calcMelhorEnvio(destCep, weight = 0.3) {
  const body = {
    from: { postal_code: ORIGIN_CEP },
    to: { postal_code: destCep.replace(/\D/g, "") },
    package: {
      height: 10,
      width: 15,
      length: 20,
      weight: Math.max(0.1, weight),
    },
    options: { receipt: false, own_hand: false },
    services: "1,2", // 1 = PAC, 2 = SEDEX
  };

  console.log("\n🌐 Chamando Melhor Envio API...");

  const res = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "festival-store/1.0 (pedroitan@gmail.com)",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    console.log(`   ❌ HTTP ${res.status}:`, text.substring(0, 300));
    return [];
  }

  let data;
  try { data = JSON.parse(text); } catch { console.log("   ❌ JSON inválido:", text.substring(0, 200)); return []; }

  if (!Array.isArray(data)) {
    console.log("   ❌ Resposta inesperada:", JSON.stringify(data).substring(0, 300));
    return [];
  }

  return data
    .filter((s) => !s.error && s.price)
    .map((s) => ({
      id: s.id,
      name: s.name,
      company: s.company?.name ?? "",
      price: s.price,
      days: s.delivery_time,
    }));
}

async function testCep(cep, label, weight = 0.3) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`📦 ${label} — CEP ${cep} | peso: ${weight}kg`);
  console.log(`   Origem: ${ORIGIN_CEP}`);

  const results = await calcMelhorEnvio(cep, weight);

  if (results.length === 0) {
    console.log("   ⚠️  Nenhuma opção retornada");
    return;
  }

  console.log(`\n   ✅ ${results.length} opção(ões) disponíveis:`);
  for (const s of results) {
    console.log(`   [${String(s.id).padStart(2)}] ${s.name.padEnd(20)} ${s.company.padEnd(12)} ${fmt(s.price).padStart(10)}  ${s.days} dias`);
  }
}

await testCep("41810000", "Salvador BA (local)", 0.3);
await testCep("01310100", "São Paulo SP", 0.3);
await testCep("20040020", "Rio de Janeiro RJ", 0.3);
await testCep("69050001", "Manaus AM", 0.3);
await testCep("01310100", "SP — camiseta + tela", 1.8); // peso maior

console.log(`\n${"=".repeat(60)}`);
console.log("✔️  Testes concluídos.");
