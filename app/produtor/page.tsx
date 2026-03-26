"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, Truck, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp, Download } from "lucide-react";

type OrderItem = {
  id: string;
  product_name: string;
  product_image_url: string | null;
  artist_name: string | null;
  category: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  product_id: string | null;
};

type Order = {
  id: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  shipping_service: string | null;
  shipping_cost: number;
  tracking_code: string | null;
  subtotal: number;
  total: number;
  order_items: OrderItem[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando_producao: { label: "Aguardando produção", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
  em_producao: { label: "Em produção", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  despachado: { label: "Despachado", color: "text-green-400 bg-green-400/10 border-green-400/30" },
  entregue: { label: "Entregue", color: "text-green-600 bg-green-600/10 border-green-600/30" },
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, color: "text-text-muted bg-surface border-border" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shortId = order.id.slice(0, 8).toUpperCase();
  const addr = order.shipping_address;
  const addressStr = `${addr.street}, ${addr.number}${addr.complement ? ` ${addr.complement}` : ""} — ${addr.neighborhood}, ${addr.city}/${addr.state} — CEP ${addr.cep}`;

  async function updateStatus(status: string, tracking_code?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/produtor/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, tracking_code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao atualizar"); return; }
      onUpdate();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-text text-sm">#{shortId}</span>
            <StatusBadge status={order.status} />
            <span className="text-xs text-text-muted">{fmtDate(order.created_at)}</span>
          </div>
          <p className="text-sm text-text mt-1 font-medium">{order.customer_name}</p>
          <p className="text-xs text-text-muted truncate">{order.customer_email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-sm font-semibold text-text">{fmt(order.total)}</span>
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded hover:bg-surface-alt transition-colors">
            {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
          </button>
        </div>
      </div>

      {/* Items preview */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {order.order_items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 bg-surface-alt rounded-md px-2 py-1.5">
            {item.product_image_url && (
              <img src={item.product_image_url} alt={item.product_name} className="w-8 h-8 rounded object-cover bg-border" />
            )}
            <div>
              <p className="text-xs font-medium text-text leading-tight">{item.product_name}</p>
              <p className="text-xs text-text-muted">{item.category} · qty {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shipping badge */}
      <div className="px-4 pb-3 flex items-center gap-2 text-xs text-text-muted">
        {order.shipping_service === "SEDEX" ? <Truck size={12} /> : <Package size={12} />}
        <span>{order.shipping_service ?? "PAC"} — {fmt(order.shipping_cost)}</span>
        {order.tracking_code && (
          <span className="font-mono text-blue-400 ml-2">{order.tracking_code}</span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 pt-4 pb-4 space-y-4">
          {/* Address */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-1">Endereço de entrega</p>
            <p className="text-sm text-text">{addressStr}</p>
          </div>

          {/* Items detail */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-2">Itens</p>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-surface-alt rounded-lg">
                  {item.product_image_url && (
                    <img src={item.product_image_url} alt={item.product_name} className="w-14 h-14 rounded object-cover bg-border shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{item.product_name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{item.artist_name} · {item.category}</p>
                    <p className="text-xs text-text-muted">Qtd: {item.quantity} · {fmt(item.subtotal)}</p>
                  </div>
                  {item.product_image_url && (
                    <a
                      href={item.product_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary/5 transition-colors shrink-0"
                    >
                      <Download size={11} /> Arte
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Actions */}
          <div className="space-y-2">
            {order.status === "aguardando_producao" && (
              <button
                onClick={() => updateStatus("em_producao")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Clock size={15} /> Iniciar produção
              </button>
            )}

            {order.status === "em_producao" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="Código de rastreio (obrigatório)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm font-mono text-text focus:outline-none focus:border-primary uppercase"
                />
                <button
                  onClick={() => updateStatus("despachado", trackingInput)}
                  disabled={loading || !trackingInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Truck size={15} /> Marcar como despachado
                </button>
              </div>
            )}

            {order.status === "despachado" && (
              <button
                onClick={() => updateStatus("entregue")}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surface-alt border border-border text-text-muted font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 hover:border-primary"
              >
                <CheckCircle size={15} /> Confirmar entrega
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProdutorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "aguardando_producao" | "em_producao" | "despachado" | "entregue">("todos");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/produtor/orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
      setLastUpdate(new Date());
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 60_000); // auto-refresh 60s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);
  const countAguardando = orders.filter((o) => o.status === "aguardando_producao").length;
  const countEmProducao = orders.filter((o) => o.status === "em_producao").length;
  const countDespachado = orders.filter((o) => o.status === "despachado").length;
  const countEntregue = orders.filter((o) => o.status === "entregue").length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-text text-lg">Dashboard de Produção</h1>
            <p className="text-xs text-text-muted">Ponto de Cuidado · atualizado {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <button onClick={fetchOrders} className="p-2 rounded-lg border border-border hover:bg-surface-alt transition-colors">
            <RefreshCw size={15} className="text-text-muted" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-surface border border-yellow-400/30 rounded-lg p-3">
            <p className="text-2xl font-mono font-bold text-yellow-400">{countAguardando}</p>
            <p className="text-xs text-text-muted mt-1">Aguardando</p>
          </div>
          <div className="bg-surface border border-blue-400/30 rounded-lg p-3">
            <p className="text-2xl font-mono font-bold text-blue-400">{countEmProducao}</p>
            <p className="text-xs text-text-muted mt-1">Em produção</p>
          </div>
          <div className="bg-surface border border-green-400/30 rounded-lg p-3">
            <p className="text-2xl font-mono font-bold text-green-400">{countDespachado}</p>
            <p className="text-xs text-text-muted mt-1">Despachados</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-3">
            <p className="text-2xl font-mono font-bold text-text-muted">{countEntregue}</p>
            <p className="text-xs text-text-muted mt-1">Entregues</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {([
            { key: "todos", label: "Todos" },
            { key: "aguardando_producao", label: "Aguardando" },
            { key: "em_producao", label: "Em produção" },
            { key: "despachado", label: "Despachados" },
            { key: "entregue", label: "Entregues" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter === key
                  ? "bg-primary text-text-inverse border-primary"
                  : "bg-surface text-text-muted border-border hover:border-primary/50"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-16 text-text-muted text-sm">Carregando pedidos…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-border mb-3" />
            <p className="text-text-muted text-sm">Nenhum pedido na fila</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onUpdate={fetchOrders} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
