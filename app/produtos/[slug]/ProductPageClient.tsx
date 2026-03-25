"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { ShoppingBag } from "lucide-react";

const SIZES = ["P", "M", "G", "GG"];
const SIZES_CATEGORIAS = ["Camiseta"];

type ProductData = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
  artist: {
    id: string;
    name: string;
    slug: string;
    bio: string;
    avatarUrl: string;
  } | null;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProductPageClient({ product }: { product: ProductData }) {
  const needsSize = SIZES_CATEGORIAS.includes(product.category);
  const [selectedSize, setSelectedSize] = useState<string | null>(needsSize ? null : "UNICO");
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  function handleAddToCart() {
    if (!selectedSize) return;
    addItem({
      productId: product.id,
      variantId: `${product.id}-${selectedSize}`,
      name: needsSize ? `${product.name} — ${selectedSize}` : product.name,
      artistName: product.artist?.name ?? "",
      price: product.price,
      quantity: 1,
      imageUrl: product.imageUrl,
      size: needsSize ? selectedSize : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16">

        {/* Imagem do produto */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square bg-surface-alt rounded-md overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              unoptimized
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        </div>

        {/* Painel de compra */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-widest font-body mb-1">
              {product.category}
            </p>
            <h1 className="text-2xl font-display font-bold text-text leading-tight">
              {product.name}
            </h1>
            {product.artist && (
              <p className="text-sm text-text-muted mt-1">
                por{" "}
                <Link
                  href={`/artistas/${product.artist.slug}`}
                  className="hover:text-text transition-colors underline underline-offset-2"
                >
                  {product.artist.name}
                </Link>
              </p>
            )}
          </div>

          <p className="text-2xl font-mono font-semibold text-text">
            {formatPrice(product.price)}
          </p>

          {/* Seletor de tamanho (apenas para camisetas) */}
          {needsSize && (
            <div>
              <p className="text-xs font-body font-medium uppercase tracking-widest text-text-muted mb-2">
                Tamanho
              </p>
              <div className="flex gap-2 flex-wrap">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 min-w-[44px] min-h-[44px] text-sm font-body font-medium rounded-sm border transition-colors ${selectedSize === size
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
          )}

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {added ? "Adicionado!" : "Adicionar ao carrinho"}
          </button>

          {product.description && (
            <p className="text-sm text-text-muted leading-relaxed">{product.description}</p>
          )}

          {/* Bio artista */}
          {product.artist && (
            <div className="flex items-start gap-3 pt-4 border-t border-border">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface-alt flex-shrink-0">
                {product.artist.avatarUrl ? (
                  <Image
                    src={product.artist.avatarUrl}
                    alt={product.artist.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-display text-text-muted">
                    {product.artist.name[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-text">{product.artist.name}</p>
                {product.artist.bio && (
                  <p className="text-xs text-text-muted leading-relaxed mt-0.5">{product.artist.bio}</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
