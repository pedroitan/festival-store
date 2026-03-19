import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MP envia type=payment e data.id com o payment_id
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = String(body.data?.id);
    if (!paymentId) return NextResponse.json({ received: true });

    // Buscar detalhes do pagamento na API do MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!mpRes.ok) {
      console.error("MP fetch error:", mpRes.status);
      return NextResponse.json({ received: true });
    }

    const payment = await mpRes.json();
    const orderId: string = payment.external_reference;
    const mpStatus: string = payment.status; // approved | pending | rejected

    if (!orderId) return NextResponse.json({ received: true });

    // Mapear status do MP para status interno
    const statusMap: Record<string, string> = {
      approved: "paid",
      pending: "pending",
      in_process: "pending",
      rejected: "cancelled",
      cancelled: "cancelled",
      refunded: "cancelled",
    };
    const newStatus = statusMap[mpStatus] ?? "pending";

    await supabaseAdmin()
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    console.log(`Webhook MP: order ${orderId} → ${newStatus} (MP: ${mpStatus})`);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
