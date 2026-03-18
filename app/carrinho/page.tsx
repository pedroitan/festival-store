"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-text mb-3">Carrinho vazio</h1>
        <p className="text-text-muted text-sm mb-8">
          Adicione produtos da vitrine para continuar.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors"
        >
          Ver produtos
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-display font-bold text-text mb-8">Carrinho</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        {/* Itens */}
        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 py-5">
              <div className="relative w-20 h-20 bg-surface-alt rounded-sm overflow-hidden flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="text-xs text-text-muted font-body">{item.artistName}</p>
                <p className="text-sm font-display font-semibold text-text truncate">{item.name}</p>
                {item.size && (
                  <p className="text-xs text-text-muted">Tamanho: {item.size}</p>
                )}
                <p className="text-sm font-mono font-medium text-text mt-auto">
                  {formatPrice(item.price)}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-text-muted hover:text-error transition-colors"
                  aria-label="Remover item"
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
                <div className="flex items-center gap-2 border border-border rounded-sm">
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-mono w-5 text-center text-text">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="bg-surface border border-border rounded-md p-6 h-fit flex flex-col gap-4">
          <h2 className="text-base font-display font-bold text-text">Resumo do pedido</h2>

          <div className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between text-text-muted">
                <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                <span className="font-mono flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-text">
            <span>Total</span>
            <span className="font-mono">{formatPrice(total())}</span>
          </div>

          <Link
            href="/checkout"
            className="w-full text-center py-3.5 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors"
          >
            Ir para o checkout
          </Link>

          <Link href="/" className="text-center text-xs text-text-muted hover:text-text transition-colors">
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
