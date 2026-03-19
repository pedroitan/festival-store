import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductPageClient from "./ProductPageClient";

async function getProduct(slug: string) {
  const { data } = await supabase
    .from("products")
    .select("*, artist:artists(id, slug, name, bio, avatar_url)")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return data;
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const artist = Array.isArray(product.artist) ? product.artist[0] : product.artist;

  return (
    <ProductPageClient
      product={{
        id: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: Math.round(product.price / 100),
        imageUrl: product.image_url ?? "/produtos/placeholder.png",
        description: product.description ?? "",
        artist: artist
          ? {
            id: artist.id,
            name: artist.name,
            slug: artist.slug,
            bio: artist.bio ?? "",
            avatarUrl: artist.avatar_url ?? "",
          }
          : null,
      }}
    />
  );
}
