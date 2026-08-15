import { describe, expect, test } from "bun:test";
import { isTrackablePageRequest } from "./visitor-analytics.server";

const page = (headers: Record<string, string> = {}) => new Request("https://example.test/majalis", {
  method: "GET",
  headers: { accept: "text/html", "user-agent": "Mozilla/5.0", ...headers },
});

describe("monthly visitor request filtering", () => {
  test("accepts a genuine public document and rejects repeat-like non-doc requests", () => {
    expect(isTrackablePageRequest(page(), "/majalis")).toBe(true);
    expect(isTrackablePageRequest(new Request(page(), { method: "POST" }), "/majalis")).toBe(false);
    expect(isTrackablePageRequest(page({ purpose: "prefetch" }), "/majalis")).toBe(false);
  });

  test("excludes bots, admin routes, APIs, and assets", () => {
    expect(isTrackablePageRequest(page({ "user-agent": "Googlebot/2.1" }), "/majalis")).toBe(false);
    expect(isTrackablePageRequest(page(), "/admin")).toBe(false);
    expect(isTrackablePageRequest(page(), "/api/content")).toBe(false);
    expect(isTrackablePageRequest(page(), "/fonts/site.woff2")).toBe(false);
  });
});

describe("aggregate correctness contract", () => {
  test("migration uses a unique monthly key and conditional increment", async () => {
    const sql = await Bun.file(new URL("../../supabase/migrations/20260815120000_create_monthly_visitor_analytics.sql", import.meta.url)).text();
    expect(sql).toContain("PRIMARY KEY (year, month, visitor_hash)");
    expect(sql).toContain("ON CONFLICT (year, month, visitor_hash) DO NOTHING");
    expect(sql).toContain("GET DIAGNOSTICS inserted_count = ROW_COUNT");
    expect(sql).toContain("IF inserted_count = 1 THEN");
    expect(sql).toContain("make_date(year, month, 1)");
  });
});
