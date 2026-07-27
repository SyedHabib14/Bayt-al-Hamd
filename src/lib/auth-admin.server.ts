import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { verifyJwt, type JwtPayload } from "./jwt.server";

/**
 * Middleware that authenticates admin/scholar/editor users.
 *
 * Checks both the Authorization header (set by TanStack Start's server function
 * client-side fetcher) AND the `dalil.token` cookie (for SSR page transitions).
 *
 * The Authorization header takes priority; the cookie is the fallback.
 * This ensures that both JS-powered navigation (client-side) and hard page loads
 * (SSR) work with authentication.
 */
export const requireAdminAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const authHeader = getRequestHeader("authorization") || getRequestHeader("Authorization");
  const cookie = getRequestHeader("cookie") ?? "";
  const cookieToken = cookie.match(/(?:^|;\s*)dalil\.token=([^;]+)/)?.[1];

  // Priority: Authorization header > cookie
  let token = "";
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (cookieToken) {
    token = decodeURIComponent(cookieToken);
  }

  if (!token) {
    // Dev-friendly diagnostic — cookie presence is critical for SSR
    const hasCookie = cookie.length > 0;
    const hasDalilCookie = !!cookieToken;
    console.debug("[auth-middleware] No token found", {
      hasAuthHeader: !!authHeader,
      hasCookieHeader: hasCookie,
      hasDalilCookie: hasDalilCookie,
      cookieLength: cookie.length,
    });
    throw new Response("Unauthorized — no valid authentication token found. Please sign in again.", { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload) {
    console.debug("[auth-middleware] JWT verification failed — token invalid or expired");
    throw new Response("Unauthorized — your session has expired. Please sign in again.", { status: 401 });
  }

  // role gate: admin/scholar/editor may all reach admin surfaces; UI can further gate.
  if (!["admin", "scholar", "editor"].includes(payload.role)) {
    console.debug("[auth-middleware] Role forbidden", { role: payload.role });
    throw new Response("Forbidden — you do not have permission to perform this action.", { status: 403 });
  }

  return next({ context: { auth: payload as JwtPayload } });
});
