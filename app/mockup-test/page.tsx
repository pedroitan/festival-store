"use client";

import { useState } from "react";

const PRODUCT_TYPES = [
  { value: "camiseta", label: "Camiseta" },
  { value: "bone", label: "Boné" },
  { value: "tela", label: "Tela (wall art)" },
  { value: "poster", label: "Pôster c/ moldura" },
];

export default function MockupTestPage() {
  const [artworkUrl, setArtworkUrl] = useState(
    "https://raw.githubusercontent.com/pedroitan/festival-store/master/public/artistas/scmart.png"
  );
  const [productType, setProductType] = useState("camiseta");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imageBase64?: string;
    mimeType?: string;
    error?: string;
    detail?: string;
  } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/mockup/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artworkUrl, productType }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-text mb-2">
        Teste — Geração de Mockup (Gemini)
      </h1>
      <p className="text-sm text-text-muted mb-8">
        Envia a arte do artista + tipo de produto e recebe o mockup gerado por IA.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">
            URL da arte do artista
          </label>
          <input
            type="url"
            value={artworkUrl}
            onChange={(e) => setArtworkUrl(e.target.value)}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">
            Tipo de produto
          </label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TYPES.map((p) => (
              <button
                key={p.value}
                onClick={() => setProductType(p.value)}
                className={`px-4 py-1.5 text-sm rounded-md border transition-colors ${
                  productType === p.value
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-border text-text-muted hover:border-text-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !artworkUrl}
          className="mt-2 bg-primary text-white font-body font-semibold text-sm px-6 py-2.5 rounded-md disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? "Gerando mockup…" : "Gerar Mockup"}
        </button>
      </div>

      {loading && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Aguardando Gemini gerar a imagem…</p>
        </div>
      )}

      {result && (
        <div className="mt-10">
          {result.error ? (
            <div className="bg-red-900/20 border border-red-500/30 rounded-md p-4">
              <p className="text-red-400 text-sm font-mono font-bold">Erro: {result.error}</p>
              {result.detail && (
                <p className="text-red-300/70 text-xs mt-1 font-mono">{result.detail}</p>
              )}
            </div>
          ) : result.imageBase64 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-muted">
                Mockup gerado — <strong className="text-text">{productType}</strong>
              </p>
              <img
                src={`data:${result.mimeType};base64,${result.imageBase64}`}
                alt={`Mockup ${productType}`}
                className="w-full rounded-md border border-border"
              />
              <a
                href={`data:${result.mimeType};base64,${result.imageBase64}`}
                download={`scmart-mockup-${productType}.png`}
                className="inline-block text-center bg-surface border border-border text-text text-sm px-4 py-2 rounded-md hover:border-text-muted transition-colors"
              >
                Baixar imagem
              </a>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}
