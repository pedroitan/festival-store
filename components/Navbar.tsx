"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const itemCount = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundImage: "url('/tenants/btcfestival/bg-navbar.png')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between relative z-20">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex flex-col leading-none">
            <span
              style={{
                fontFamily: "var(--font-neocrash), sans-serif",
                color: "#E8197A",
                fontSize: "clamp(14px, 4vw, 26px)",
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

        <div className="flex items-center gap-3">
          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
            <Link href="/artistas" className="hover:text-white transition-colors">Artistas</Link>
            <Link href="/produtos" className="hover:text-white transition-colors">Produtos</Link>
          </nav>

          {/* Carrinho */}
          <Link
            href="/carrinho"
            className="relative flex items-center hover:text-white transition-colors"
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

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-sm"
            style={{ color: "rgba(255,255,255,0.85)" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
          </button>

          {/* Personagem — último item do grupo, nunca sobrepõe elementos clicáveis */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div
            aria-hidden="true"
            style={{ height: "64px", overflow: "hidden", flexShrink: 0, pointerEvents: "none", userSelect: "none" }}
          >
            <img
              src="/tenants/btcfestival/personagem1.png"
              alt=""
              style={{ height: "82px", width: "auto", display: "block", marginTop: "8px" }}
            />
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "rgba(11,18,204,0.97)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link
              href="/artistas"
              className="py-3 text-sm font-body font-medium border-b"
              style={{ color: "rgba(255,255,255,0.85)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              Artistas
            </Link>
            <Link
              href="/produtos"
              className="py-3 text-sm font-body font-medium"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Produtos
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
