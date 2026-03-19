import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import PixPanel from "./PixPanel";

async function getOrder(id: string) {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();
  return data;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PedidoPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id);
  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const isPending = order.status === "pending";
  const isPaid = order.status === "paid";

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs text-text-muted uppercase tracking-widest font-body mb-1">
          Pedido #{shortId}
        </p>
        <h1 className="text-2xl font-display font-bold text-text">
          {isPaid ? "Pagamento confirmado!" : "Aguardando pagamento"}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Confirmação enviada para <strong className="text-text">{order.customer_email}</strong>
        </p>
      </div>

      {/* PIX */}
      {isPending && order.pix_qr_code && (
        <PixPanel
          qrCode={order.pix_qr_code}
          qrCodeBase64={order.pix_qr_code_base64}
          total={order.total}
        />
      )}

      {isPaid && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-md p-4 mb-6">
          <p className="text-green-400 font-body font-semibold text-sm">PIX recebido ✓</p>
          <p className="text-green-300/70 text-xs mt-0.5">Seu pedido foi confirmado e está em produção.</p>
        </div>
      )}

      {/* Resumo */}
      <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4 mb-6">
        <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest">Itens do pedido</h2>
        <div className="flex flex-col divide-y divide-border">
          {order.order_items?.map((item: {
            id: string; product_name: string; artist_name: string;
            quantity: number; price: number; subtotal: number;
          }) => (
            <div key={item.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="text-text font-body">{item.product_name}</p>
                {item.artist_name && <p className="text-xs text-text-muted">{item.artist_name}</p>}
                <p className="text-xs text-text-muted">Qtd: {item.quantity}</p>
              </div>
              <span className="font-mono text-text flex-shrink-0 ml-4">{formatPrice(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm text-text-muted">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span className="font-mono">{order.shipping_cost === 0 ? "Grátis" : formatPrice(order.shipping_cost)}</span>
          </div>
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-text">
          <span>Total</span>
          <span className="font-mono">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Endereço */}
      {order.shipping_address && (
        <div className="bg-surface border border-border rounded-md p-5 mb-6">
          <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest mb-3">Entrega</h2>
          <p className="text-sm text-text-muted">
            {order.shipping_address.street}, {order.shipping_address.number}
            {order.shipping_address.complement ? ` — ${order.shipping_address.complement}` : ""}<br />
            {order.shipping_address.neighborhood} · {order.shipping_address.city}/{order.shipping_address.state}<br />
            CEP {order.shipping_address.cep}
          </p>
          <p className="text-xs text-text-muted mt-2">Entrega em até 10 dias úteis após confirmação do pagamento.</p>
        </div>
      )}

      <Link href="/" className="inline-block text-sm text-text-muted hover:text-text transition-colors underline underline-offset-2">
        ← Voltar para a loja
      </Link>
    </main>
  );
}
