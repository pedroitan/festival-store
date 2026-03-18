import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";

const MOCK_PRODUCTS: ProductCardData[] = [
  {
    id: "1",
    slug: "urban-roots-tshirt",
    name: "Urban Roots — Camiseta",
    artistName: "Neocrash",
    artistSlug: "neocrash",
    price: 89,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Arte+Neocrash",
    category: "Camiseta",
  },
  {
    id: "2",
    slug: "circuito-ancestral-print",
    name: "Circuito Ancestral — Fine Art",
    artistName: "Neocrash",
    artistSlug: "neocrash",
    price: 229,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Fine+Art",
    category: "Fine Art",
  },
  {
    id: "3",
    slug: "grafite-vivo-bone",
    name: "Grafite Vivo — Boné",
    artistName: "Artista 2",
    artistSlug: "artista-2",
    price: 79,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Bon%C3%A9",
    category: "Boné",
  },
  {
    id: "4",
    slug: "bahia-cores-poster",
    name: "Bahia de Todas as Cores — Pôster",
    artistName: "Artista 3",
    artistSlug: "artista-3",
    price: 79,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=P%C3%B4ster",
    category: "Pôster",
  },
  {
    id: "5",
    slug: "rua-viva-tshirt",
    name: "Rua Viva — Camiseta",
    artistName: "Artista 4",
    artistSlug: "artista-4",
    price: 89,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Camiseta",
    category: "Camiseta",
  },
  {
    id: "6",
    slug: "cores-do-asfalto-tela",
    name: "Cores do Asfalto — Tela s/ Moldura",
    artistName: "Artista 5",
    artistSlug: "artista-5",
    price: 199,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Tela",
    category: "Tela",
  },
];

export default function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <section className="mb-10">
        <h1 className="text-2xl font-display font-bold text-text mb-1">
          Produtos em destaque
        </h1>
        <p className="text-sm text-text-muted">
          Arte original de grafiteiros brasileiros aplicada em produtos exclusivos.
        </p>
      </section>

      <ProductGrid products={MOCK_PRODUCTS} />
    </main>
  );
}
