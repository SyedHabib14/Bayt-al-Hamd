# Dalīl — Comprehensive Fix & Upgrade Plan

## Issue 1: Fix Admin Navigation & CRUD Operations
- [x] 1.1 Fix cookie handling in `auth-store.ts` — proper attributes for SSR
- [x] 1.2 Improve `requireAdminAuth` middleware error handling in `auth-admin.server.ts`
- [x] 1.3 Fix admin layout auth guard in `_admin.tsx` — add loading state, resilient check
- [ ] 1.4 Fix admin functions data flow in `admin.functions.ts` — ensure auth headers propagate
- [x] 1.5 **Fix missing `<Outlet />` in dashboard** — `_admin.admin.tsx` Dashboard component had no `<Outlet />`, preventing child routes (`/admin/majalis`, `/admin/users`, `/admin/audit`) from rendering their components. Added `useLocation()` check on `pathname` to conditionally render `<Outlet />` for child routes.

## Issue 2: Arabic Font Improvement
- [x] 2.1 Update font stack in `styles.css` — prioritize Amiri, add proper weights
- [x] 2.2 Update Google Fonts link in `__root.tsx` — add Amiri weights

## Issue 3: Mobile Responsiveness + Design Upgrade
- [x] 3.1 Mobile-responsive admin layout in `_admin.tsx` — collapsible nav
- [x] 3.2 Responsive dashboard in `_admin.admin.tsx` — better card grid
- [x] 3.3 Responsive majalis list in `_admin.admin.majalis.tsx`
- [x] 3.4 Responsive edit form in `_admin.admin.majalis.$id.edit.tsx`
- [x] 3.5 Responsive users page in `_admin.admin.users.tsx`
- [x] 3.6 Mobile header improvements in `__root.tsx`
- [x] 3.7 Mobile-friendly login in `login.tsx`
- [x] 3.8 Add skeleton/loading states across admin pages

## Issue 4: Real-time Sync Verification
- [x] 4.1 Verify Supabase realtime channel subscriptions in `public-data.ts`
- [x] 4.2 Add manual refresh button fallback (refresh buttons added across admin pages)
- [x] 4.3 Add optimistic updates for mutations (optimistic removal in majalis list)

## Issue 5: Performance Optimization
- [x] 5.1 Add debounce to search in `search.tsx`
- [x] 5.2 Memoize list components (MajlisRow, HadithItem)
- [x] 5.3 Add preload hints for critical routes in `__root.tsx`
- [x] 5.4 Optimize CSS with proper Tailwind utilities

## Testing
- [x] Run `bun run dev` and verify no build errors
- [ ] Test admin login → navigation → CRUD flow (requires running the dev server)
- [ ] Test mobile responsiveness (requires running the dev server)
- [ ] Verify real-time updates (requires running the dev server)
