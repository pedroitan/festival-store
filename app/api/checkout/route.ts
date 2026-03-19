import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

  const payload = {
    transaction_amount: body.total / 100,
    description: `Festival Store — Pedido ${orderId.slice(0, 8).toUpperCase()}`,
    payment_method_id: "pix",
    payer: {
      email: body.customer.email,
      first_name: body.customer.name.split(" ")[0],
      last_name: body.customer.name.split(" ").slice(1).join(" ") || "-",
      identification: { type: "CPF", number: cpf },
    },
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
    external_reference: orderId,
  };

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
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", "btcfestival")
      .single();

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 500 });
    }

    // Criar pedido no Supabase
    const { data: order, error: orderError } = await supabaseAdmin
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
    await supabaseAdmin.from("order_items").insert(
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

    try {
      const payment = await createPixPayment(body, order.id);
      pixQrCode = payment.point_of_interaction?.transaction_data?.qr_code ?? null;
      pixQrCodeBase64 = payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;
      paymentId = String(payment.id);
    } catch (mpError) {
      console.error("Mercado Pago error:", mpError);
      // Não falha o pedido — apenas salva sem PIX (pode ser configurado depois)
    }

    // Atualizar pedido com dados do PIX
    if (paymentId) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_id: paymentId, pix_qr_code: pixQrCode, pix_qr_code_base64: pixQrCodeBase64 })
        .eq("id", order.id);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      pixQrCode,
      pixQrCodeBase64,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
