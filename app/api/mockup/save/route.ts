import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, fileName } = await req.json();

    if (!imageBase64 || !fileName) {
      return NextResponse.json({ error: "imageBase64 e fileName são obrigatórios" }, { status: 400 });
    }

    const buffer = Buffer.from(imageBase64, "base64");
    const ext = mimeType?.includes("jpeg") ? "jpg" : "png";
    const path = `mockups/${fileName}.${ext}`;

    const { error } = await getSupabaseAdmin().storage
      .from("produtos")
      .upload(path, buffer, {
        contentType: mimeType ?? "image/png",
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = getSupabaseAdmin().storage
      .from("produtos")
      .getPublicUrl(path);

    return NextResponse.json({ success: true, url: urlData.publicUrl, path });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
