import { NextRequest, NextResponse } from "next/server";

const DEFAULT_TENANT = "btcfestival";

function extractTenantSlug(hostname: string): string {
  if (!hostname || hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return DEFAULT_TENANT;
  }
  const hostWithoutPort = hostname.split(":")[0];
  return hostWithoutPort.split(".")[0] ?? DEFAULT_TENANT;
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const slug = extractTenantSlug(hostname);

  const response = NextResponse.next();
  response.headers.set("x-tenant-slug", slug);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
