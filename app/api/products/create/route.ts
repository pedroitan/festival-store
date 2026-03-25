import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenant_id, artist_id, slug, name, description, price, category, image_url, artwork_url } = body;

    if (!slug || !name || !price || !category || !artist_id) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("products")
      .upsert(
        { tenant_id, artist_id, slug, name, description, price, category, image_url, artwork_url, active: true },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/produtos");
    return NextResponse.json({ success: true, product: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
