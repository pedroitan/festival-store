export default function PedidoPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-display font-bold text-text mb-2">Pedido #{params.id}</h1>
      <p className="text-text-muted text-sm">Rastreamento — Sprint 2.</p>
    </main>
  );
}
