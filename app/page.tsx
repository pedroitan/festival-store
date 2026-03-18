import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";

const MOCK_PRODUCTS: ProductCardData[] = [
  {
    id: "sc-1",
    slug: "scmart-natureza-urbana-camiseta",
    name: "Natureza Urbana — Camiseta",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 89,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=Scmart",
    category: "Camiseta",
  },
  {
    id: "sc-2",
    slug: "scmart-mural-chile-poster",
    name: "Mural Chile — Pôster Fine Art",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 129,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=P%C3%B4ster",
    category: "Pôster",
  },
  {
    id: "sc-3",
    slug: "scmart-meeting-styles-tela",
    name: "Meeting of Styles — Tela s/ Moldura",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 179,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=Tela",
    category: "Tela",
  },
  {
    id: "sc-4",
    slug: "scmart-harmonia-bone",
    name: "Harmonia — Boné",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 79,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=Bon%C3%A9",
    category: "Boné",
  },
  {
    id: "sc-5",
    slug: "scmart-meeting-styles-tela-moldura",
    name: "Meeting of Styles — Tela c/ Moldura",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 249,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=Tela+Moldura",
    category: "Tela",
  },
  {
    id: "sc-6",
    slug: "scmart-cor-movimento-poster",
    name: "Cor e Movimento — Pôster",
    artistName: "Scmart",
    artistSlug: "scmart",
    price: 79,
    imageUrl: "https://placehold.co/600x600/0B12CC/FFFFFF?text=P%C3%B4ster+2",
    category: "Pôster",
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
          Arte original de grafiteiros e muralistas internacionais em produtos exclusivos.
        </p>
      </section>

      <ProductGrid products={MOCK_PRODUCTS} />
    </main>
  );
}
