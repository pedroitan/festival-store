"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import Link from "next/link";
import { ChevronRight, Loader2, Package, Truck } from "lucide-react";

type AddressData = {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
};

type ShippingOption = {
  code: string;
  name: string;
  price: number;
  days: number;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mask(value: string, pattern: string) {
  let i = 0;
  const v = value.replace(/\D/g, "");
  return pattern.replace(/#/g, () => v[i++] ?? "");
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", cpf: "",
    cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const subtotal = total();
  const shipping = selectedShipping?.price ?? 0;
  const orderTotal = subtotal * 100 + shipping;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    setCepError("");
    setShippingOptions([]);
    setSelectedShipping(null);
    setShippingError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: AddressData & { erro?: boolean } = await res.json();
      if (data.erro) { setCepError("CEP não encontrado"); return; }
      setForm((f) => ({
        ...f,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }));
      calculateShipping(cep, data.uf);
    } catch {
      setCepError("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  }

  async function calculateShipping(cep: string, uf?: string) {
    setShippingLoading(true);
    setShippingError("");
    try {
      const shippingItems = items.map((i) => ({
        category: i.name.split(" — ")[0],
        quantity: i.quantity,
      }));
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, items: shippingItems, uf: form.state }),
      });
      const data = await res.json();
      if (data.error) { setShippingError(data.error); return; }
      setShippingOptions(data.services ?? []);
    } catch {
      setShippingError("Erro ao calcular frete");
    } finally {
      setShippingLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone, cpf: form.cpf },
          address: { cep: form.cep, street: form.street, number: form.number, complement: form.complement, neighborhood: form.neighborhood, city: form.city, state: form.state },
          items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price * 100, quantity: i.quantity, imageUrl: i.imageUrl, artistName: i.artistName })),
          subtotal: subtotal * 100,
          shippingCost: shipping,
          total: orderTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar pedido");
      clearCart();
      router.push(`/pedido/${data.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-display font-bold text-text mb-3">Carrinho vazio</h1>
        <Link href="/" className="inline-flex px-6 py-3 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors">
          Ver produtos
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-display font-bold text-text mb-8">Finalizar pedido</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

        {/* Formulário */}
        <div className="flex flex-col gap-8">

          {/* Dados pessoais */}
          <section>
            <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest mb-4">Dados pessoais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nome completo" value={form.name} onChange={(v) => set("name", v)} required col2 />
              <Field label="E-mail" type="email" value={form.email} onChange={(v) => set("email", v)} required />
              <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", mask(v, "(##) #####-####"))} placeholder="(00) 00000-0000" />
              <Field label="CPF" value={form.cpf} onChange={(v) => set("cpf", mask(v, "###.###.###-##"))} placeholder="000.000.000-00" required />
            </div>
          </section>

          {/* Endereço */}
          <section>
            <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest mb-4">Endereço de entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-body text-text-muted uppercase tracking-widest">CEP *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => { const v = mask(e.target.value, "#####-###"); set("cep", v); if (v.replace(/\D/g, "").length === 8) lookupCep(v); }}
                    placeholder="00000-000"
                    maxLength={9}
                    required
                    className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                  />
                  {(cepLoading || shippingLoading) && <Loader2 size={16} className="animate-spin self-center text-text-muted" />}
                </div>
                {cepError && <p className="text-xs text-red-400">{cepError}</p>}
              </div>
              <Field label="Número" value={form.number} onChange={(v) => set("number", v)} required />
              <Field label="Rua" value={form.street} onChange={(v) => set("street", v)} required col2 />
              <Field label="Bairro" value={form.neighborhood} onChange={(v) => set("neighborhood", v)} />
              <Field label="Cidade" value={form.city} onChange={(v) => set("city", v)} required />
              <Field label="Estado" value={form.state} onChange={(v) => set("state", v)} required />
              <Field label="Complemento" value={form.complement} onChange={(v) => set("complement", v)} col2 />
            </div>

            {/* Opções de frete */}
            {shippingError && (
              <p className="text-xs text-red-400 mt-2">{shippingError} — <button type="button" className="underline" onClick={() => calculateShipping(form.cep.replace(/\D/g, ""))}>Tentar novamente</button></p>
            )}
            {shippingOptions.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <p className="text-xs font-body font-medium uppercase tracking-widest text-text-muted">Opção de entrega</p>
                {shippingOptions.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setSelectedShipping(opt)}
                    className={`flex items-center justify-between px-4 py-3 rounded-md border text-sm transition-colors ${selectedShipping?.code === opt.code
                      ? "border-primary bg-primary/10 text-text"
                      : "border-border bg-surface text-text-muted hover:border-primary/50"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {opt.name === "SEDEX" ? <Truck size={15} /> : <Package size={15} />}
                      <div className="text-left">
                        <p className="font-semibold">{opt.name}</p>
                        <p className="text-xs">{opt.days} dia{opt.days !== 1 ? "s" : ""} úteis</p>
                      </div>
                    </div>
                    <span className="font-mono font-semibold">{formatPrice(opt.price / 100)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Pagamento */}
          <section>
            <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest mb-4">Pagamento</h2>
            <div className="flex items-center gap-3 border border-primary rounded-md px-4 py-3 bg-primary/5">
              <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-sm font-body font-semibold text-text">PIX</p>
                <p className="text-xs text-text-muted">QR Code gerado após confirmação. Aprovação instantânea.</p>
              </div>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-md px-4 py-3">{error}</p>
          )}
        </div>

        {/* Resumo do pedido */}
        <div className="h-fit sticky top-6">
          <div className="bg-surface border border-border rounded-md p-6 flex flex-col gap-4">
            <h2 className="text-base font-display font-bold text-text">Resumo</h2>

            <div className="flex flex-col gap-2 text-sm">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-text-muted">
                  <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                  <span className="font-mono flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Frete {selectedShipping ? `(${selectedShipping.name})` : ""}</span>
                <span className="font-mono">
                  {selectedShipping ? formatPrice(selectedShipping.price / 100) : shippingLoading ? "calculando…" : "—"}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-display font-bold text-text">
              <span>Total</span>
              <span className="font-mono">{formatPrice(orderTotal / 100)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedShipping}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-text-inverse font-display font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Processando…</>
              ) : (
                <><ChevronRight size={16} /> Pagar com PIX</>
              )}
            </button>

            <p className="text-xs text-text-muted text-center">
              Produção sob demanda · entrega em até 10 dias úteis
            </p>
          </div>
        </div>
      </form>
    </main>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required, col2,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; col2?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1${col2 ? " sm:col-span-2" : ""}`}>
      <label className="text-xs font-body text-text-muted uppercase tracking-widest">
        {label}{required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text focus:outline-none focus:border-primary placeholder:text-text-muted/50"
      />
    </div>
  );
}
