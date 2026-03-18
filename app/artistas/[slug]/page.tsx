import Image from "next/image";
import ProductGrid from "@/components/vitrine/ProductGrid";
import type { ProductCardData } from "@/components/vitrine/ProductCard";

const MOCK_ARTIST = {
  slug: "scmart",
  name: "Scmart",
  nomeReal: "Sebastian Moreno",
  origem: "Chile",
  bio: "Sebastian é um artista visual e muralista com uma sólida trajetória internacional, tendo levado sua arte a sete países através de festivais de renome como o Meeting of Styles (Alemanha, Suécia, Finlândia, Jamaica, entre outros). Sua obra é uma busca pela harmonia entre a estética urbana e a natureza, transformando muros em palcos de experimentação técnica e visual, com peças dinâmicas e ricas em nuances de cor.",
  avatarUrl: "/artistas/scmart-perfil.jpg",
  instagram: "@s.cmart_",
  tier: "Destaque",
};

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
            <span className="text-xs font-body font-medium uppercase tracking-widest text-text-muted border border-border px-2 py-0.5 rounded-sm">
              {MOCK_ARTIST.origem} · Internacional
            </span>
          </div>
          <p className="text-sm text-text-muted">{MOCK_ARTIST.nomeReal} · {MOCK_ARTIST.instagram}</p>
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
