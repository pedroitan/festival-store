"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  qrCode: string;
  qrCodeBase64: string | null;
  total: number;
};

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PixPanel({ qrCode, qrCodeBase64, total }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="bg-surface border border-border rounded-md p-5 mb-6">
      <h2 className="text-sm font-display font-bold text-text uppercase tracking-widest mb-4">
        Pagar com PIX
      </h2>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* QR Code */}
        {qrCodeBase64 && (
          <div className="flex-shrink-0">
            <img
              src={`data:image/png;base64,${qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-44 h-44 rounded-md border border-border"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 flex-1">
          <p className="text-sm text-text-muted leading-relaxed">
            Escaneie o QR Code ou copie o código abaixo no app do seu banco. Aprovação em segundos.
          </p>

          <p className="text-lg font-mono font-bold text-text">
            {formatPrice(total)}
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-xs text-text-muted uppercase tracking-widest">Código PIX Copia e Cola</p>
            <div className="flex gap-2">
              <code className="flex-1 bg-surface-alt border border-border rounded-md px-3 py-2 text-xs font-mono text-text-muted truncate">
                {qrCode}
              </code>
              <button
                onClick={copyCode}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary text-text-inverse text-xs font-body font-semibold rounded-md hover:opacity-90 transition-opacity"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Aguardando confirmação do pagamento…
          </div>
        </div>
      </div>
    </div>
  );
}
