import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const VALID_TRANSITIONS: Record<string, string[]> = {
  aguardando_producao: ["em_producao", "cancelled"],
  em_producao: ["despachado", "cancelled"],
  despachado: ["entregue"],
};

async function sendStatusEmail(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string;
  tracking_code?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://festival-store.vercel.app";
  const shortId = order.id.slice(0, 8).toUpperCase();

  const templates: Record<string, { subject: string; body: string }> = {
    em_producao: {
      subject: `Pedido #${shortId} — Em produção`,
      body: `<p style="color:#ccc;font-size:15px">Ótima notícia! Seu pedido <strong style="color:#fff">#${shortId}</strong> já está sendo produzido pelo nosso parceiro.</p>
             <p style="color:#aaa;font-size:14px">Em breve você receberá o código de rastreio quando for despachado.</p>`,
    },
    despachado: {
      subject: `Pedido #${shortId} — Enviado!`,
      body: `<p style="color:#ccc;font-size:15px">Seu pedido <strong style="color:#fff">#${shortId}</strong> foi despachado pelos Correios!</p>
             ${order.tracking_code ? `<div style="background:#111;border:1px solid #222;border-radius:8px;padding:16px;margin:16px 0">
               <p style="color:#aaa;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Código de rastreio</p>
               <code style="color:#4fc3f7;font-size:16px;font-weight:bold">${order.tracking_code}</code>
               <p style="color:#555;font-size:12px;margin:8px 0 0">Rastreie em <a href="https://rastreamento.correios.com.br" style="color:#4fc3f7">correios.com.br</a></p>
             </div>` : ""}`,
    },
  };

  const tmpl = templates[order.status];
  if (!tmpl) return;

  await getResend().emails.send({
    from: process.env.RESEND_FROM ?? "Festival Store <onboarding@resend.dev>",
    to: order.customer_email,
    subject: tmpl.subject,
    html: `<!DOCTYPE html><html><body style="background:#0a0a0a;font-family:sans-serif;margin:0;padding:32px 16px">
      <div style="max-width:560px;margin:0 auto">
        <p style="color:#0B12CC;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">BAHIA DE TODAS AS CORES</p>
        <h1 style="color:#fff;font-size:20px;margin:0 0 16px">Olá, ${order.customer_name.split(" ")[0]}!</h1>
        ${tmpl.body}
        <a href="${siteUrl}/pedido/${order.id}" style="display:inline-block;background:#0B12CC;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold;margin-top:16px">Ver meu pedido</a>
        <p style="color:#555;font-size:12px;margin-top:24px">BTC Festival Store</p>
      </div>
    </body></html>`,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, tracking_code } = await req.json();
    const orderId = params.id;

    const { data: order, error: fetchError } = await supabaseAdmin()
      .from("orders")
      .select("id, status, customer_name, customer_email")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Transição inválida: ${order.status} → ${status}` },
        { status: 422 }
      );
    }

    if (status === "despachado" && !tracking_code?.trim()) {
      return NextResponse.json(
        { error: "Código de rastreio obrigatório para marcar como despachado" },
        { status: 422 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (tracking_code?.trim()) updateData.tracking_code = tracking_code.trim().toUpperCase();

    const { error: updateError } = await supabaseAdmin()
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateError) throw new Error(updateError.message);

    try {
      await sendStatusEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        status,
        tracking_code: tracking_code?.trim().toUpperCase(),
      });
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
