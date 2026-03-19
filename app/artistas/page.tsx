import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function getArtists() {
  const { data } = await supabase
    .from("artists")
    .select("slug, name, real_name, origin, avatar_url, tier")
    .eq("active", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function ArtistasPage() {
  const artists = await getArtists();

  return (
    <main className="min-h-screen px-4 py-12 max-w-7xl mx-auto">
      <section className="mb-10">
        <h1 className="text-2xl font-display font-bold text-text mb-1">Artistas</h1>
        <p className="text-sm text-text-muted">Conheça os artistas presentes na loja.</p>
      </section>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {artists.map((a) => (
          <Link
            key={a.slug}
            href={`/artistas/${a.slug}`}
            className="group flex flex-col bg-surface border border-border rounded-md overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-surface-alt overflow-hidden">
              {a.avatar_url ? (
                <Image
                  src={a.avatar_url}
                  alt={a.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-display text-text-muted">
                  {a.name[0]}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-display font-semibold text-text">{a.name}</p>
              {a.real_name && <p className="text-xs text-text-muted">{a.real_name}</p>}
              <span className="inline-block mt-1 text-[10px] uppercase tracking-widest border border-border text-text-muted px-2 py-0.5 rounded-sm">
                {a.tier}{a.origin ? ` · ${a.origin}` : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
