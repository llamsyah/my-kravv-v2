import "server-only";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server.js";
import { getPublicSupabaseTarget } from "../../lib/env/public.ts";
import { verifyV3DatabaseTarget } from "./v3-target.ts";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!["/", "/auth", "/foundation"].includes(path)) {
    return new NextResponse("Unavailable in V3 Slice 0.", {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  try {
    await verifyV3DatabaseTarget();
  } catch {
    return new NextResponse("V3 local environment is unavailable.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }
  let response = NextResponse.next({ request });
  const { url, publishableKey, cookieName } = getPublicSupabaseTarget();
  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: { name: cookieName },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers))
          response.headers.set(key, value);
      },
    },
  });

  // Immediately validate/refresh after constructing the SSR client. Cookie state
  // alone (getSession) is not proof of identity.
  let verified = false;
  try {
    const { data, error } = await supabase.auth.getClaims();
    verified = !error && !!data?.claims?.sub;
  } catch {
    // Malformed tokens or provider failures never authorize private entry.
  }
  if (!verified && request.nextUrl.pathname !== "/auth") {
    const authUrl = request.nextUrl.clone();
    authUrl.pathname = "/auth";
    authUrl.search = "";
    const redirect = NextResponse.redirect(authUrl);
    for (const cookie of response.cookies.getAll())
      redirect.cookies.set(cookie);
    response = redirect;
  }
  if (verified && path === "/" && request.method === "GET") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/foundation";
    destination.search = "";
    const redirect = NextResponse.redirect(destination);
    for (const cookie of response.cookies.getAll())
      redirect.cookies.set(cookie);
    response = redirect;
  }
  // Refreshed cookies and private responses must never enter a shared cache.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
