import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (anon key — respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
});

// Server-side lazy singleton (service_role — bypasses RLS, use only in API routes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = ReturnType<typeof createClient<any>>;
let _supabaseAdmin: AdminClient | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): ReturnType<typeof createClient<any>> {
  if (!_supabaseAdmin) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurado");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _supabaseAdmin = createClient<any>(supabaseUrl, serviceKey, {
      global: { fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }) },
    });
  }
  return _supabaseAdmin;
}

export { getSupabaseAdmin as supabaseAdmin };

// Types
export type Tenant = {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  created_at: string;
};

export type Artist = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  real_name: string | null;
  origin: string | null;
  bio: string | null;
  avatar_url: string | null;
  instagram: string | null;
  tier: string;
  active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  tenant_id: string;
  artist_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  price: number; // centavos
  category: string;
  image_url: string | null;
  artwork_url: string | null;
  active: boolean;
  stock: number;
  created_at: string;
  // join
  artist?: Artist;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "aguardando_producao"
  | "em_producao"
  | "despachado"
  | "entregue"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type Order = {
  id: string;
  tenant_id: string;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_cpf: string | null;
  shipping_address: Record<string, string> | null;
  shipping_method: string | null;
  shipping_cost: number;
  subtotal: number;
  total: number;
  payment_method: string | null;
  payment_id: string | null;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  artist_name: string | null;
  category: string | null;
  price: number;
  quantity: number;
  subtotal: number;
};
