"use client";

import Link from "next/link";
import { useTenant } from "@/components/TenantProvider";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

export default function Navbar() {
  const tenant = useTenant();
  const itemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundImage: "url('/tenants/btcfestival/bg-navbar.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        borderColor: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Personagem — pequeno, dentro da navbar, z acima do bg */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tenants/btcfestival/personagem1.png"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          right: "clamp(80px, 9vw, 180px)",
          height: "54px",
          width: "auto",
          zIndex: 10,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Brand — festival name em Neocrash */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex flex-col leading-none">
            <span
              style={{
                fontFamily: "var(--font-neocrash), sans-serif",
                color: "#E8197A",
                fontSize: "clamp(18px, 2.5vw, 26px)",
                letterSpacing: "0.03em",
              }}
            >
              BAHIA DE TODAS AS CORES
            </span>
            <span
              className="text-[10px] font-body font-medium uppercase mt-0.5"
              style={{ color: "rgba(255,255,255,0.6)", letterSpacing: "0.18em" }}
            >
              Loja Oficial
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
          <Link href="/artistas" className="hover:text-white transition-colors">
            Artistas
          </Link>
          <Link href="/produtos" className="hover:text-white transition-colors">
            Produtos
          </Link>
        </nav>

        <Link
          href="/carrinho"
          className="relative flex items-center gap-2 hover:text-white transition-colors"
          style={{ color: "rgba(255,255,255,0.85)" }}
          aria-label="Carrinho"
        >
          <ShoppingBag size={22} strokeWidth={1.5} />
          {mounted && itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-text-inverse text-xs font-mono w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
