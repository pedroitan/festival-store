import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .delete()
    .eq("id", params.id)
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: `Produto ${params.id} não encontrado ou não deletado` }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/produtos");
  return NextResponse.json({ success: true, deleted: data.length });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { error } = await supabaseAdmin()
    .from("products")
    .update({ active: body.active })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/produtos");
  return NextResponse.json({ success: true });
}
