import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select(`
      id, slug, name, description, price, category,
      image_url, artwork_url, active, stock, created_at,
      artists ( id, name, slug )
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}
