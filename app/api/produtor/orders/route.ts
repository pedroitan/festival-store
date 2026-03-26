import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const PRODUCTION_STATUSES = ["aguardando_producao", "em_producao", "despachado", "entregue"];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin()
      .from("orders")
      .select(`
        id, status, created_at, updated_at,
        customer_name, customer_email,
        shipping_address, shipping_service, shipping_cost, tracking_code,
        subtotal, total,
        order_items (
          id, product_name, product_image_url, artist_name, category,
          price, quantity, subtotal,
          product_id
        )
      `)
      .in("status", PRODUCTION_STATUSES)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ orders: data ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
