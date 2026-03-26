import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

async function getProducts(): Promise<ProductCardData[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, price, category, image_url, artist:artists(slug, name)")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((p) => {
    const artist = Array.isArray(p.artist) ? p.artist[0] : p.artist;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price / 100,
      category: p.category,
      imageUrl: p.image_url ?? "/produtos/placeholder.png",
      artistName: artist?.name ?? "",
      artistSlug: artist?.slug ?? "",
    };
  });
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-2xl font-display font-bold text-text mb-1">
          Produtos em destaque
        </h1>
        <p className="text-sm text-text-muted">
          Arte original de grafiteiros e muralistas internacionais em produtos exclusivos.
        </p>
      </section>

      <ProductGrid products={products} />
    </main>
  );
}
