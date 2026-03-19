import Image from "next/image";
import { notFound } from "next/navigation";
import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";
import { supabase } from "@/lib/supabase";

async function getArtist(slug: string) {
  const { data } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return data;
}

async function getArtistProducts(artistId: string, artistSlug: string, artistName: string): Promise<ProductCardData[]> {
  const { data } = await supabase
    .from("products")
    .select("id, slug, name, price, category, image_url")
    .eq("artist_id", artistId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (!data) return [];

  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: Math.round(p.price / 100),
    category: p.category,
    imageUrl: p.image_url ?? "/produtos/placeholder.png",
    artistName,
    artistSlug,
  }));
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artist = await getArtist(params.slug);
  if (!artist) notFound();

  const products = await getArtistProducts(artist.id, artist.slug, artist.name);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row items-start gap-5 mb-10 pb-10 border-b border-border">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-alt flex-shrink-0">
          {artist.avatar_url ? (
            <Image
              src={artist.avatar_url}
              alt={artist.name}
              fill
              unoptimized
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-display text-text-muted">
              {artist.name[0]}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-text">{artist.name}</h1>
            <span className="text-xs font-body font-medium uppercase tracking-widest text-text-muted border border-border px-2 py-0.5 rounded-sm">
              {artist.tier}
            </span>
            {artist.origin && (
              <span className="text-xs font-body font-medium uppercase tracking-widest text-text-muted border border-border px-2 py-0.5 rounded-sm">
                {artist.origin} · Internacional
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">
            {[artist.real_name, artist.instagram].filter(Boolean).join(" · ")}
          </p>
          {artist.bio && (
            <p className="text-sm text-text-muted leading-relaxed mt-2 max-w-xl">
              {artist.bio}
            </p>
          )}
        </div>
      </div>

      <h2 className="text-lg font-display font-bold text-text mb-6">Produtos disponíveis</h2>
      <ProductGrid products={products} />
    </main>
  );
}
