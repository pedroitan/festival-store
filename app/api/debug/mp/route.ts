import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "MERCADOPAGO_ACCESS_TOKEN não configurado no .env.local" });
  }

  try {
    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": "debug-test-" + Date.now(),
      },
      body: JSON.stringify({
        transaction_amount: 1.0,
        description: "Teste PIX debug",
        payment_method_id: "pix",
        payer: {
          email: "test@test.com",
          first_name: "Test",
          last_name: "User",
          identification: { type: "CPF", number: "12345678909" },
        },
        external_reference: "debug-test",
      }),
    });

    const data = await res.json();
    const qrCode = data.point_of_interaction?.transaction_data?.qr_code;
    const qrBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64;

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      payment_status: data.status,
      payment_id: data.id,
      qr_code: qrCode ? "OK" : "NULL",
      qr_base64: qrBase64 ? "OK" : "NULL",
      mp_error: data.message ?? data.error ?? null,
      mp_cause: data.cause ?? null,
      token_prefix: accessToken.slice(0, 8) + "...",
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
