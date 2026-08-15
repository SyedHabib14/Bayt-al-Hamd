import { createServerFn } from "@tanstack/react-start";
import { requireAdminAuth } from "./auth-admin.server";
import { getCurrentMonthVisitors } from "./visitor-analytics.server";

export const getMonthlyUniqueVisitors = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async ({ context }) => {
    if (context.auth.role !== "admin") throw new Response("Forbidden", { status: 403 });
    return getCurrentMonthVisitors();
  });
