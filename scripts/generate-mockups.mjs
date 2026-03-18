/**
 * generate-mockups.mjs
 * Gera mockups de produtos do Scmart via Dynamic Mockups API
 * Uso: node scripts/generate-mockups.mjs
 *
 * Pré-requisitos:
 *   1. API key em .env.local → DYNAMIC_MOCKUPS_API_KEY=...
 *   2. Preencher TEMPLATES abaixo com os UUIDs dos templates escolhidos
 *      na biblioteca: https://app.dynamicmockups.com/create
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CONFIGURAÇÃO ──────────────────────────────────────────────────────────

// Arte do artista — URL pública acessível pela API
const ARTWORK_URL =
  "https://raw.githubusercontent.com/pedroitan/festival-store/master/public/artistas/scmart.png";

// Templates detectados via GET /api/v1/mockups na conta Dynamic Mockups
const TEMPLATES = [
  {
    slug: "camiseta-lifestyle",
    produto: "Camiseta",
    mockup_uuid: "8eaea4a6-e935-4588-9bc2-8105cdcd7ed6",
    smart_object_uuid: "e7445260-c263-404d-896f-be845fd29bdd",
  },
  {
    slug: "tela-vertical",
    produto: "Tela Vertical 61x91cm",
    mockup_uuid: "955cf87d-a2ea-491a-929c-94d5cf1e90e1",
    smart_object_uuid: "090b6329-c09d-426e-9eb0-e3b40ad92ad8",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────

function loadApiKey() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local não encontrado. Crie o arquivo com DYNAMIC_MOCKUPS_API_KEY=sua_key");
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(/DYNAMIC_MOCKUPS_API_KEY=(.+)/);
  if (!match) throw new Error("DYNAMIC_MOCKUPS_API_KEY não encontrada no .env.local");
  return match[1].trim();
}

async function renderMockup(apiKey, template) {
  const body = JSON.stringify({
    mockup_uuid: template.mockup_uuid,
    smart_objects: [
      {
        uuid: template.smart_object_uuid,
        asset: {
          url: ARTWORK_URL,
        },
      },
    ],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "app.dynamicmockups.com",
      path: "/api/v1/renders",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`API error ${res.statusCode}: ${JSON.stringify(json)}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      fs.unlink(destPath, () => { });
      reject(err);
    });
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  const outputDir = path.join(__dirname, "..", "public", "produtos", "scmart");
  fs.mkdirSync(outputDir, { recursive: true });

  let apiKey;
  try {
    apiKey = loadApiKey();
  } catch (e) {
    console.error("❌", e.message);
    process.exit(1);
  }

  console.log("🎨 Gerando mockups do Scmart...\n");

  for (const template of TEMPLATES) {
    if (template.mockup_uuid.startsWith("SUBSTITUA")) {
      console.warn(`⚠️  ${template.produto}: UUID não configurado — pulando`);
      continue;
    }

    try {
      console.log(`⏳ Renderizando ${template.produto} (${template.slug})...`);
      const result = await renderMockup(apiKey, template);

      // A API retorna export_path ou similar — ajuste conforme resposta real
      const imageUrl = result?.data?.export_path || result?.export_path || result?.url;
      if (!imageUrl) {
        console.error(`❌ ${template.produto}: URL da imagem não encontrada na resposta`, result);
        continue;
      }

      const destFile = path.join(outputDir, `${template.slug}.png`);
      await downloadImage(imageUrl, destFile);
      console.log(`✅ ${template.produto} → public/produtos/scmart/${template.slug}.png`);
    } catch (err) {
      console.error(`❌ ${template.produto}: ${err.message}`);
    }
  }

  console.log("\n✅ Concluído! Imagens salvas em public/produtos/scmart/");
}

main();
