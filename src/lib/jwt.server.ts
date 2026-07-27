// HMAC-SHA256 JWT helpers (Web Crypto). Server-only.
const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function jwtSecret(): string | undefined {
  return process.env.DALIL_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export interface JwtPayload {
  sub: string;
  cnic: string;
  role: "admin" | "scholar" | "editor";
  name: string;
  iat: number;
  exp: number;
}

export async function signJwt(payload: Omit<JwtPayload, "iat" | "exp">, ttlSeconds = 60 * 60 * 2): Promise<string> {
  // Keep a dedicated secret when configured; the server-only Supabase key is a
  // safe deterministic fallback for deployments that do not define one.
  const secret = jwtSecret();
  if (!secret) throw new Error("JWT secret not configured");
  const now = Math.floor(Date.now() / 1000);
  const full: JwtPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify(full)));
  const data = `${header}.${body}`;
  const k = await key(secret);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(data));
  return `${data}.${b64url(sig)}`;
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    // Signing and verification must use the same configured secret. The
    // fallback is also used by signJwt for local/development deployments.
    const secret = jwtSecret();
    if (!secret) return null;
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const k = await key(secret);
    const sigBytes = b64urlDecode(s);
    const ok = await crypto.subtle.verify("HMAC", k, sigBytes as BufferSource, enc.encode(`${h}.${p}`));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as JwtPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
