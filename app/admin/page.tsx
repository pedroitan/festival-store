"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Eye, EyeOff, Plus, Package } from "lucide-react";

type Artist = { id: string; name: string; slug: string };

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  active: boolean;
  created_at: string;
  artists: Artist | null;
};

function formatPrice(cents: number) {
  return `R$ ${Math.floor(cents / 100).toLocaleString("pt-BR")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  return `${days}d atrás`;
}

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    setProducts(data.products);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deletar "${name}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  async function handleToggleActive(id: string, current: boolean) {
    setTogglingId(id);
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !current }),
    });
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !current } : p))
    );
    setTogglingId(null);
  }

  const total = products.length;
  const active = products.filter((p) => p.active).length;
  const byCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin — Festival Store</h1>
          <p className="text-sm text-gray-500">BTC Festival</p>
        </div>
        <Link
          href="/admin/novo-produto"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Novo Produto
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ativos</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Inativos</p>
            <p className="text-2xl font-bold text-gray-400">{total - active}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Categorias</p>
            <p className="text-sm font-medium text-gray-700 mt-1 leading-relaxed">
              {Object.entries(byCategory).map(([cat, count]) => (
                <span key={cat} className="block">{cat}: {count}</span>
              ))}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-800">Produtos</h2>
          </div>

          {loading && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Carregando...</div>
          )}
          {error && (
            <div className="px-6 py-4 text-red-500 text-sm">{error}</div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Nenhum produto cadastrado.
            </div>
          )}

          {!loading && products.length > 0 && (
            <div className="divide-y divide-gray-100">
              {products.map((p) => (
                <div key={p.id} className={`flex items-center gap-4 px-6 py-4 ${!p.active ? "opacity-50" : ""}`}>
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.artists?.name ?? "—"} · {p.category} · {timeAgo(p.created_at)}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-semibold text-gray-700 w-20 text-right">
                    {formatPrice(p.price)}
                  </div>

                  {/* Status badge */}
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full w-16 text-center ${
                    p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {p.active ? "ativo" : "inativo"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(p.id, p.active)}
                      disabled={togglingId === p.id}
                      title={p.active ? "Desativar" : "Ativar"}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {p.active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      title="Deletar"
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
