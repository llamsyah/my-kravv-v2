import type { NextRequest } from "next/server";
import { updateSession } from "./server/auth/proxy.ts";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|visual-references/).*)"],
};
