import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  royalty_pct_default: number;
  categories: string[];
  active: boolean;
};

const FALLBACK_TENANT: Tenant = {
  id: "",
  slug: "btcfestival",
  name: "Loja BTC",
  domain: "loja.btcgraffiti.com.br",
  logo_url: "/tenants/btcfestival/logo.png",
  royalty_pct_default: 25,
  categories: ["apparel", "decor", "print"],
  active: true,
};

export async function getTenantBySlug(slug: string): Promise<Tenant> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (error || !data) {
      return FALLBACK_TENANT;
    }

    return data as Tenant;
  } catch {
    return FALLBACK_TENANT;
  }
}
