import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type CheckoutItem = {
  productId: string;
  name: string;
  price: number; // centavos
  quantity: number;
  imageUrl: string;
  artistName: string;
};

type CheckoutBody = {
  customer: {
    name: string;
    email: string;
    phone: string;
    cpf: string;
  };
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: CheckoutItem[];
  subtotal: number;  // centavos
  shippingCost: number; // centavos
  total: number;    // centavos
};

async function createPixPayment(body: CheckoutBody, orderId: string) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

  const cpf = body.customer.cpf.replace(/\D/g, "");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const isPublicUrl = siteUrl.startsWith("https://");

  const payload: Record<string, unknown> = {
    transaction_amount: body.total / 100,
    description: `Festival Store — Pedido ${orderId.slice(0, 8).toUpperCase()}`,
    payment_method_id: "pix",
    payer: {
      email: body.customer.email,
      first_name: body.customer.name.split(" ")[0],
      last_name: body.customer.name.split(" ").slice(1).join(" ") || "-",
      identification: { type: "CPF", number: cpf },
    },
    external_reference: orderId,
  };

  if (isPublicUrl) {
    payload.notification_url = `${siteUrl}/api/webhooks/mercadopago`;
  }

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": orderId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Mercado Pago: ${err.message ?? res.statusText}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutBody = await req.json();

    // Buscar tenant BTC Festival
    const { data: tenant } = await supabaseAdmin()
      .from("tenants")
      .select("id")
      .eq("slug", "btcfestival")
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 500 });
    }

    // Criar pedido no Supabase
    const { data: order, error: orderError } = await supabaseAdmin()
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        status: "pending",
        customer_name: body.customer.name,
        customer_email: body.customer.email,
        customer_phone: body.customer.phone,
        customer_cpf: body.customer.cpf,
        shipping_address: body.address,
        shipping_method: "PAC",
        shipping_cost: body.shippingCost,
        subtotal: body.subtotal,
        total: body.total,
        payment_method: "pix",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Erro ao criar pedido");
    }

    // Inserir itens do pedido
    await supabaseAdmin().from("order_items").insert(
      body.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        product_image_url: item.imageUrl,
        artist_name: item.artistName,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))
    );

    // Gerar PIX via Mercado Pago
    let pixQrCode: string | null = null;
    let pixQrCodeBase64: string | null = null;
    let paymentId: string | null = null;
    let mpDiag: string | null = null;

    try {
      const payment = await createPixPayment(body, order.id);
      pixQrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
      pixQrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
      paymentId = String(payment.id);
      mpDiag = `OK | status:${payment.status} | qr:${pixQrCode ? "yes" : "null"} | base64:${pixQrCodeBase64 ? "yes" : "null"}`;
    } catch (mpError) {
      mpDiag = `ERROR: ${mpError instanceof Error ? mpError.message : String(mpError)}`;
    }

    // Atualizar pedido com dados do PIX
    if (paymentId) {
      await supabaseAdmin()
        .from("orders")
        .update({ payment_id: paymentId, pix_qr_code: pixQrCode, pix_qr_code_base64: pixQrCodeBase64 })
        .eq("id", order.id);
    }

    // Enviar email de confirmação via Resend
    try {
      const shortId = order.id.slice(0, 8).toUpperCase();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://festival-store.vercel.app";
      const formatPrice = (cents: number) =>
        (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

      const itemsHtml = body.items
        .map(
          (i) =>
            `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #222;font-size:14px;color:#ccc">${i.name}<br/><span style="font-size:12px;color:#888">${i.artistName}</span></td>
              <td style="padding:8px 0;border-bottom:1px solid #222;text-align:right;font-size:14px;color:#ccc">${formatPrice(i.price * i.quantity)}</td>
            </tr>`
        )
        .join("");

      const qrImageTag = pixQrCodeBase64
        ? `<img src="data:image/png;base64,${pixQrCodeBase64}" alt="QR Code PIX" width="180" height="180" style="display:block;border-radius:6px;margin-bottom:16px" />`
        : "";

      const pixSection = pixQrCode
        ? `<div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:24px 0">
            <p style="margin:0 0 12px;font-size:13px;color:#aaa;text-transform:uppercase;letter-spacing:1px">Pagar com PIX</p>
            ${qrImageTag}
            <p style="margin:0 0 8px;font-size:12px;color:#aaa">Ou copie o código abaixo no app do seu banco:</p>
            <code style="display:block;background:#000;border:1px solid #333;border-radius:4px;padding:12px;font-size:11px;color:#4fc3f7;word-break:break-all;line-height:1.6">${pixQrCode}</code>
            <p style="margin:12px 0 0;font-size:12px;color:#555">Selecione o código acima, copie e cole no app do banco. Aprovação instantânea.</p>
          </div>`
        : `<p style="color:#aaa;font-size:14px">Acesse o link abaixo para ver o QR Code PIX.</p>`;

      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "Festival Store <onboarding@resend.dev>",
        to: body.customer.email,
        subject: `Pedido #${shortId} — Aguardando pagamento`,
        html: `
<!DOCTYPE html>
<html>
<body style="background:#0a0a0a;font-family:sans-serif;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto">
    <p style="color:#0B12CC;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px">BAHIA DE TODAS AS CORES</p>
    <h1 style="color:#fff;font-size:22px;margin:0 0 4px">Pedido recebido!</h1>
    <p style="color:#aaa;font-size:14px;margin:0 0 24px">Pedido <strong style="color:#fff">#${shortId}</strong></p>

    ${pixSection}

    <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin-bottom:16px">
      <p style="margin:0 0 12px;font-size:13px;color:#aaa;text-transform:uppercase;letter-spacing:1px">Itens do pedido</p>
      <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>
      <table style="width:100%;margin-top:12px">
        <tr>
          <td style="font-size:13px;color:#aaa;padding:4px 0">Frete</td>
          <td style="font-size:13px;color:#aaa;text-align:right;padding:4px 0">${body.shippingCost === 0 ? "Grátis" : formatPrice(body.shippingCost)}</td>
        </tr>
        <tr>
          <td style="font-size:15px;color:#fff;font-weight:bold;padding:8px 0 0">Total</td>
          <td style="font-size:15px;color:#fff;font-weight:bold;text-align:right;padding:8px 0 0">${formatPrice(body.total)}</td>
        </tr>
      </table>
    </div>

    <a href="${siteUrl}/pedido/${order.id}" style="display:inline-block;background:#0B12CC;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:bold">Ver meu pedido</a>

    <p style="color:#555;font-size:12px;margin-top:24px">Entrega em até 10 dias úteis após confirmação do pagamento.</p>
  </div>
</body>
</html>`,
      });
    } catch (emailError) {
      console.error("Resend error:", emailError);
      // Não bloqueia a resposta
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      pixQrCode,
      pixQrCodeBase64,
      _mpDiag: mpDiag,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
