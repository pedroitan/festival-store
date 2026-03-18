import Image from "next/image";
import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";

const MOCK_ARTIST = {
  slug: "neocrash",
  name: "Neocrash",
  bio: "Grafiteiro radicado em Salvador-BA. Trabalha com letras e formas geométricas que misturam influências do graffiti com circuitos eletrônicos. Participante do BTC desde a 5ª edição.",
  avatarUrl: "https://placehold.co/200x200/E8E8E8/6B6B6B?text=NC",
  instagram: "@neocrash",
  tier: "Prata",
};

const MOCK_PRODUCTS: ProductCardData[] = [
  {
    id: "1",
    slug: "urban-roots-tshirt",
    name: "Urban Roots — Camiseta",
    artistName: "Neocrash",
    artistSlug: "neocrash",
    price: 89,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Urban+Roots",
    category: "Camiseta",
  },
  {
    id: "2",
    slug: "circuito-ancestral-print",
    name: "Circuito Ancestral — Fine Art",
    artistName: "Neocrash",
    artistSlug: "neocrash",
    price: 229,
    imageUrl: "https://placehold.co/600x600/F3F3F3/6B6B6B?text=Circuito",
    category: "Fine Art",
  },
];

export default function ArtistPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-start gap-5 mb-10 pb-10 border-b border-border">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-alt flex-shrink-0">
          <Image
            src={MOCK_ARTIST.avatarUrl}
            alt={MOCK_ARTIST.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-text">
              {MOCK_ARTIST.name}
            </h1>
            <span className="text-xs font-body font-medium uppercase tracking-widest text-text-muted border border-border px-2 py-0.5 rounded-sm">
              {MOCK_ARTIST.tier}
            </span>
          </div>
          <p className="text-sm text-text-muted">{MOCK_ARTIST.instagram}</p>
          <p className="text-sm text-text-muted leading-relaxed mt-2 max-w-xl">
            {MOCK_ARTIST.bio}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-display font-bold text-text mb-6">
        Produtos disponíveis
      </h2>
      <ProductGrid products={MOCK_PRODUCTS} />
    </main>
  );
}
