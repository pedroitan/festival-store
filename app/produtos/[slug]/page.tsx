"use client";

import Image from "next/image";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { ShoppingBag, ChevronDown } from "lucide-react";

const SIZES = ["P", "M", "G", "GG"];

const MOCK_PRODUCT = {
  id: "1",
  slug: "urban-roots-tshirt",
  name: "Urban Roots",
  category: "Camiseta",
  price: 89,
  images: [
    "https://placehold.co/800x800/F3F3F3/6B6B6B?text=Frente",
    "https://placehold.co/800x800/F3F3F3/6B6B6B?text=Costas",
    "https://placehold.co/800x800/F3F3F3/6B6B6B?text=Detalhe",
  ],
  artist: {
    id: "a1",
    name: "Neocrash",
    slug: "neocrash",
    bio: "Grafiteiro radicado em Salvador. Trabalha com letras e formas geométricas que misturam influências do graffiti com circuitos eletrônicos.",
    avatarUrl: "https://placehold.co/80x80/E8E8E8/6B6B6B?text=NC",
  },
  description: "Camiseta 100% algodão fio 30 com a arte Urban Roots do artista Neocrash aplicada em sublimação DTF. Arte exclusiva, produzida sob demanda pelo Ponto de Cuidado em Salvador.",
  printSpecs: "Impressão DTF — durabilidade superior a 50 lavagens. Arte posicionada na frente central.",
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductPage() {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleAddToCart() {
    if (!selectedSize) return;
    addItem({
      productId: MOCK_PRODUCT.id,
      variantId: `${MOCK_PRODUCT.id}-${selectedSize}`,
      name: `${MOCK_PRODUCT.name} — ${selectedSize}`,
      artistName: MOCK_PRODUCT.artist.name,
      price: MOCK_PRODUCT.price,
      quantity: 1,
      imageUrl: MOCK_PRODUCT.images[0],
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16">

        {/* Mockup */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square bg-surface-alt rounded-md overflow-hidden">
            <Image
              src={MOCK_PRODUCT.images[selectedImage]}
              alt={MOCK_PRODUCT.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
          <div className="flex gap-2">
            {MOCK_PRODUCT.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative w-20 h-20 rounded-sm overflow-hidden border-2 transition-colors ${
                  selectedImage === i ? "border-primary" : "border-border"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        </div>

        {/* Painel de compra */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-widest font-body mb-1">
              {MOCK_PRODUCT.category}
            </p>
            <h1 className="text-2xl font-display font-bold text-text leading-tight">
              {MOCK_PRODUCT.name}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              por{" "}
              <a href={`/artistas/${MOCK_PRODUCT.artist.slug}`} className="hover:text-text transition-colors underline underline-offset-2">
                {MOCK_PRODUCT.artist.name}
              </a>
            </p>
          </div>

          <p className="text-2xl font-mono font-semibold text-text">
            {formatPrice(MOCK_PRODUCT.price)}
          </p>

          {/* Seletor de tamanho */}
          <div>
            <p className="text-xs font-body font-medium uppercase tracking-widest text-text-muted mb-2">
              Tamanho
            </p>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 text-sm font-body font-medium rounded-sm border transition-colors ${
                    selectedSize === size
                      ? "bg-primary text-text-inverse border-primary"
                      : "bg-surface text-text border-border hover:border-primary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && (
              <p className="text-xs text-text-muted mt-2">Selecione um tamanho para continuar</p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {added ? "Adicionado!" : "Adicionar ao carrinho"}
          </button>

          <p className="text-sm text-text-muted leading-relaxed">
            {MOCK_PRODUCT.description}
          </p>

          {/* Bio artista */}
          <div className="flex items-start gap-3 pt-4 border-t border-border">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-alt flex-shrink-0">
              <Image src={MOCK_PRODUCT.artist.avatarUrl} alt={MOCK_PRODUCT.artist.name} fill className="object-cover" sizes="40px" />
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-text">{MOCK_PRODUCT.artist.name}</p>
              <p className="text-xs text-text-muted leading-relaxed mt-0.5">{MOCK_PRODUCT.artist.bio}</p>
            </div>
          </div>

          {/* Specs técnicas */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setSpecsOpen((v) => !v)}
              className="flex items-center justify-between w-full text-sm font-body font-medium text-text"
            >
              Informações de impressão
              <ChevronDown size={16} className={`transition-transform ${specsOpen ? "rotate-180" : ""}`} />
            </button>
            {specsOpen && (
              <p className="mt-3 text-sm text-text-muted leading-relaxed">
                {MOCK_PRODUCT.printSpecs}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
