import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const PRODUCT_PROMPTS: Record<string, string> = {
  camiseta:
    "You are a product mockup designer. Apply the provided artwork image as a print on the front of a plain white t-shirt. The t-shirt should look realistic with natural fabric folds and lighting. The artwork should be centered on the chest area, maintaining its original proportions and colors. Studio lighting, white or light grey background, professional product photography style.",
  bone:
    "You are a product mockup designer. Apply the provided artwork image as an embroidered or printed patch on the front panel of a plain black dad hat / baseball cap. The cap should look realistic with natural fabric texture. The artwork should be centered on the front panel, scaled appropriately. Studio lighting, white background, professional product photography style.",
  tela:
    "You are a product mockup designer. Display the provided artwork as a fine art print on a vertical canvas (61x91cm) mounted on a white wall. The canvas should have subtle texture and realistic edges. The artwork fills the entire canvas. Soft natural lighting, minimal interior setting, professional art gallery style.",
  poster:
    "You are a product mockup designer. Display the provided artwork as a fine art poster in a modern black frame, hanging on a light grey wall. The poster fills the frame completely. Soft natural lighting, minimal interior setting, professional style.",
};

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url} (${res.status})`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = res.headers.get("content-type") || "image/png";
  return { base64, mimeType };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artworkUrl, artworkBase64, artworkMimeType, productType = "camiseta" } = body;

    if (!artworkUrl && !artworkBase64) {
      return NextResponse.json({ error: "artworkUrl ou artworkBase64 é obrigatório" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY não configurada" }, { status: 500 });
    }

    const prompt = PRODUCT_PROMPTS[productType] ?? PRODUCT_PROMPTS.camiseta;
    const { base64, mimeType } = artworkBase64
      ? { base64: artworkBase64, mimeType: artworkMimeType ?? "image/png" }
      : await fetchImageAsBase64(artworkUrl);

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = response.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart?.inlineData) {
      const textPart = parts.find((p) => p.text);
      return NextResponse.json(
        { error: "Gemini não retornou imagem", detail: textPart?.text ?? "sem detalhes" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      productType,
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
