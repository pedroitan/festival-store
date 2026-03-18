"use client";

import Image from "next/image";
import Link from "next/link";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  artistName: string;
  artistSlug: string;
  price: number;
  imageUrl: string;
  category: string;
};

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col bg-surface rounded-md overflow-hidden border border-border hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative aspect-square bg-surface-alt overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={`${product.name} — ${product.artistName}`}
          fill
          unoptimized
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <span className="absolute top-2 left-2 text-[10px] font-body font-medium uppercase tracking-widest text-text-muted bg-surface/90 px-2 py-1 rounded-sm">
          {product.category}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-1">
        <p className="text-xs text-text-muted font-body hover:text-primary transition-colors">
          <a
            href={`/artistas/${product.artistSlug}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            {product.artistName}
          </a>
        </p>
        <h2 className="text-sm font-display font-semibold text-text leading-snug line-clamp-2">
          {product.name}
        </h2>
        <p className="text-sm font-mono font-medium text-text mt-1">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
