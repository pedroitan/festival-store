import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const { name, tenant_id } = await req.json();
    if (!name || !tenant_id) {
      return NextResponse.json({ error: "name e tenant_id são obrigatórios" }, { status: 400 });
    }

    const slug = slugify(name);

    const { data, error } = await getSupabaseAdmin()
      .from("artists")
      .upsert({ tenant_id, name, slug, tier: "standard", active: true }, { onConflict: "slug" })
      .select("id, slug")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, artist: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
