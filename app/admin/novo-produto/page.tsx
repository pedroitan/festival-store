"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Artist = { id: string; name: string; slug: string };

const PRODUCTS = [
  { key: "camiseta", label: "Camiseta", price: 89 },
  { key: "bone", label: "Boné", price: 79 },
  { key: "tela", label: "Tela s/ moldura", price: 159 },
  { key: "poster", label: "Pôster Fine Art", price: 79 },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type MockupState = {
  status: "idle" | "loading" | "done" | "error";
  base64: string;
  mime: string;
  price: number;
  enabled: boolean;
  error?: string;
};

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] ?? "image/png";
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NovoProductPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsError, setArtistsError] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artistSlug, setArtistSlug] = useState("");

  const [artName, setArtName] = useState("");
  const [description, setDescription] = useState("");

  const [artFile, setArtFile] = useState<File | null>(null);
  const [artPreviewUrl, setArtPreviewUrl] = useState("");
  const [artBase64, setArtBase64] = useState("");
  const [artMime, setArtMime] = useState("image/png");

  const [mockups, setMockups] = useState<Record<string, MockupState>>(() =>
    Object.fromEntries(
      PRODUCTS.map((p) => [
        p.key,
        { status: "idle", base64: "", mime: "image/png", price: p.price, enabled: true },
      ])
    )
  );

  const [saving, setSaving] = useState(false);
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    supabase
      .from("artists")
      .select("id, name, slug")
      .then(({ data, error }) => {
        if (error) { setArtistsError(error.message); return; }
        if (data && data.length > 0) {
          setArtists(data);
          setArtistId(data[0].id);
          setArtistSlug(data[0].slug);
        } else {
          setArtistsError("Nenhum artista encontrado no banco.");
        }
      });
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtFile(file);
    setArtPreviewUrl(URL.createObjectURL(file));
    setMockups((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, status: "idle", base64: "", error: "" }]))
    );
    const { base64, mimeType } = await fileToBase64(file);
    setArtBase64(base64);
    setArtMime(mimeType);
  }

  async function handleGenerateAll() {
    if (!artBase64) return;
    setMockups((prev) =>
      Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, status: "loading", base64: "", error: "" }]))
    );

    await Promise.all(
      PRODUCTS.map(async (p) => {
        try {
          const res = await fetch("/api/mockup/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ artworkBase64: artBase64, artworkMimeType: artMime, productType: p.key }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          setMockups((prev) => ({
            ...prev,
            [p.key]: { ...prev[p.key], status: "done", base64: data.imageBase64, mime: data.mimeType ?? "image/png" },
          }));
        } catch (err) {
          setMockups((prev) => ({
            ...prev,
            [p.key]: { ...prev[p.key], status: "error", error: String(err) },
          }));
        }
      })
    );
  }

  async function handleSaveAll() {
    if (!artName.trim()) { setSaveError("Nome da arte é obrigatório"); return; }
    if (!artistId) { setSaveError("Selecione um artista"); return; }

    const toSave = PRODUCTS.filter((p) => mockups[p.key].enabled && mockups[p.key].status === "done");
    if (toSave.length === 0) { setSaveError("Nenhum mockup gerado para salvar"); return; }

    setSaving(true);
    setSaveError("");

    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", "btcfestival").single();
    if (!tenant) { setSaveError("Tenant btcfestival não encontrado"); setSaving(false); return; }

    const artSlug = slugify(artName);
    const artworkStoredUrl = artPreviewUrl;

    const saved: string[] = [];
    for (const p of toSave) {
      const m = mockups[p.key];
      const fileName = `${artistSlug}-${artSlug}-${p.key}-${Date.now()}`;
      try {
        const saveRes = await fetch("/api/mockup/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: m.base64, mimeType: m.mime, fileName }),
        });
        const saveData = await saveRes.json();
        if (saveData.error) throw new Error(saveData.error);

        const createRes = await fetch("/api/products/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenant.id,
            artist_id: artistId,
            slug: `${artistSlug}-${artSlug}-${p.key}`,
            name: `${artName} — ${p.label}`,
            description: description || null,
            price: m.price * 100,
            category: p.label,
            image_url: saveData.url,
            artwork_url: artworkStoredUrl,
          }),
        });
        const createData = await createRes.json();
        if (createData.error) throw new Error(createData.error);
        saved.push(p.label);
      } catch (err) {
        setSaveError((prev) => prev + `\n${p.label}: ${String(err)}`);
      }
    }

    setSavedProducts(saved);
    setSaving(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-text mb-1">Novo Produto</h1>
      <p className="text-sm text-text-muted mb-8">
        Envie a arte do artista, gere os mockups de todos os produtos via Gemini e salve na loja.
      </p>

      <div className="flex flex-col gap-6">

        {/* Artista */}
        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">Artista</label>
          {artistsError ? (
            <p className="text-sm text-red-600 font-mono">{artistsError}</p>
          ) : (
            <select
              value={artistId}
              onChange={(e) => {
                setArtistId(e.target.value);
                const a = artists.find((x) => x.id === e.target.value);
                if (a) setArtistSlug(a.slug);
              }}
              className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
            >
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
        </div>

        {/* Nome da arte */}
        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">Nome da arte</label>
          <input
            type="text"
            value={artName}
            onChange={(e) => setArtName(e.target.value)}
            placeholder="ex: Natureza Urbana"
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
          />
          {artName && artistSlug && (
            <p className="text-xs text-text-muted mt-1 font-mono">slug base: {artistSlug}-{slugify(artName)}</p>
          )}
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">Descrição (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-border rounded-md px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Upload da arte */}
        <div>
          <label className="block text-xs font-body uppercase tracking-widest text-text-muted mb-1">Arte do artista</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {artPreviewUrl ? (
              <img src={artPreviewUrl} alt="arte" className="max-h-48 mx-auto rounded" />
            ) : (
              <p className="text-sm text-text-muted">Clique para selecionar a arte (PNG, JPG)</p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          {artFile && <p className="text-xs text-text-muted mt-1 font-mono">{artFile.name}</p>}
        </div>

        {/* Botão gerar todos */}
        <button
          onClick={handleGenerateAll}
          disabled={!artBase64 || !artName.trim()}
          className="bg-primary text-text-inverse font-body font-semibold text-sm px-6 py-3 rounded-md disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Gerar mockups — todos os produtos
        </button>

        {/* Grid de mockups */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {PRODUCTS.map((p) => {
            const m = mockups[p.key];
            return (
              <div key={p.key} className="border border-border rounded-md overflow-hidden bg-surface">
                {/* Header do card */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="text-sm font-display font-semibold text-text">{p.label}</span>
                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) =>
                        setMockups((prev) => ({ ...prev, [p.key]: { ...prev[p.key], enabled: e.target.checked } }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    Incluir
                  </label>
                </div>

                {/* Mockup preview */}
                <div className="aspect-square bg-surface-alt flex items-center justify-center">
                  {m.status === "idle" && (
                    <p className="text-xs text-text-muted text-center px-4">Aguardando geração</p>
                  )}
                  {m.status === "loading" && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-text-muted">Gemini gerando…</p>
                    </div>
                  )}
                  {m.status === "done" && (
                    <img
                      src={`data:${m.mime};base64,${m.base64}`}
                      alt={p.label}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {m.status === "error" && (
                    <p className="text-xs text-red-500 px-4 text-center font-mono">{m.error}</p>
                  )}
                </div>

                {/* Preço */}
                <div className="px-4 py-3 border-t border-border">
                  <label className="block text-xs text-text-muted mb-1">Preço</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">R$</span>
                    <input
                      type="number"
                      value={m.price}
                      onChange={(e) =>
                        setMockups((prev) => ({ ...prev, [p.key]: { ...prev[p.key], price: Number(e.target.value) } }))
                      }
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm font-mono text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Erros + Confirmação */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 font-mono whitespace-pre-wrap">
            {saveError}
          </div>
        )}
        {savedProducts.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-700">
            ✅ Produtos salvos: {savedProducts.join(", ")}{" "}
            <a href="/" className="underline ml-1">Ver na loja →</a>
          </div>
        )}

        {/* Salvar */}
        <button
          onClick={handleSaveAll}
          disabled={saving || !artName.trim() || PRODUCTS.every((p) => mockups[p.key].status !== "done")}
          className="bg-primary text-text-inverse font-body font-semibold text-sm px-6 py-3 rounded-md disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {saving ? "Salvando produtos…" : "Salvar produtos selecionados na loja"}
        </button>
      </div>
    </main>
  );
}
