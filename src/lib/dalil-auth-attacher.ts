import { createMiddleware } from "@tanstack/react-start";

// Client-side: attach Dalil JWT to every server function call.
export const attachDalilAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  if (typeof window === "undefined") return next();
  const token = window.localStorage.getItem("dalil.token");
  if (!token) return next();
  return next({ headers: { Authorization: `Bearer ${token}` } });
});
