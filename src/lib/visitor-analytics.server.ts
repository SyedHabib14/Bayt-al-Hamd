import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { getAdminClient } from "./supabase-admin.server";
import { verifyJwt } from "./jwt.server";

const SITE_ID = process.env.VISITOR_SITE_ID ?? "bayt-al-hamd";
const RETENTION_MONTHS = 15;
const BOT_PATTERN = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|google-inspectiontool|headless|lighthouse|pagespeed|pingdom|uptime|监控|爬虫/i;

export function isTrackablePageRequest(request: Request, pathname: string): boolean {
  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") return false;
  if (pathname.startsWith("/admin") || pathname.startsWith("/_server") || pathname.startsWith("/api/") || /\.(?:js|css|map|json|xml|txt|ico|png|jpe?g|gif|svg|webp|woff2?)$/i.test(pathname)) return false;
  if (!request.headers.get("accept")?.includes("text/html")) return false;
  if (["prefetch", "prerender"].includes(request.headers.get("purpose")?.toLowerCase() ?? "") || request.headers.has("x-purpose") || request.headers.has("x-moz-prefetch")) return false;
  return !BOT_PATTERN.test(request.headers.get("user-agent") ?? "");
}

function trustedClientIp(request: Request): string {
  const trusted = process.env.TRUSTED_PROXY === "true";
  if (trusted) return (request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim().toLowerCase();
  return "unknown";
}

async function hmacSha256(value: string): Promise<string> {
  const secret = process.env.VISITOR_HASH_SECRET;
  if (!secret) throw new Error("VISITOR_HASH_SECRET is required for visitor analytics");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function recordVisitorIfEligible(): Promise<void> {
  const request = getRequest();
  if (!request) return;
  const url = new URL(request.url);
  if (!isTrackablePageRequest(request, url.pathname)) return;
  if ((await verifyJwt((getRequestHeader("authorization") ?? "").replace(/^Bearer\s+/i, "")))?.role) return;
  if (getRequestHeader("cookie")?.includes("dalil.token=")) return;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const visitorHash = await hmacSha256(`${SITE_ID}${year}${month}${trustedClientIp(request)}${userAgent}`);
  const supabase = getAdminClient();
  const { error } = await supabase.rpc("record_monthly_unique_visitor", { p_year: year, p_month: month, p_visitor_hash: visitorHash });
  if (error) throw error;
  if (month === 1) await supabase.rpc("cleanup_monthly_visitor_keys", { p_retention_months: RETENTION_MONTHS });
}

export async function getCurrentMonthVisitors() {
  const now = new Date();
  const { data, error } = await getAdminClient().from("monthly_unique_visitors").select("year, month, unique_visitors").eq("year", now.getUTCFullYear()).eq("month", now.getUTCMonth() + 1).maybeSingle();
  if (error) throw new Response(error.message, { status: 500 });
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, uniqueVisitors: data?.unique_visitors ?? 0 };
}
