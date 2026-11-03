import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE, SessionClaims } from "@/lib/auth/session";

/**
 * Next.js Edge Middleware for authentication & route protection.
 *
 * Rules:
 * 1. Public assets, static files, and auth API endpoints bypass middleware.
 * 2. Unauthenticated visitors to root `/` or protected portals are redirected to `/login`.
 * 3. Logged-in users who have NOT completed profile setup are redirected to `/profile/setup`.
 * 4. Logged-in users attempting to access `/login` or `/signup` are redirected to their dashboard.
 * 5. Role segregation:
 *    - `/admin` requires ADMIN role.
 *    - `/worker` and `/worker/onboarding` require WORKER or DUAL role (or ADMIN).
 *    - `/client` requires HOMEOWNER or DUAL role (or ADMIN).
 */

const PUBLIC_EXACT_PATHS = new Set([
  "/login",
  "/signup",
  "/about",
  "/manifest.json",
  "/favicon.ico",
  "/robots.txt",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass Next.js internal static assets and public APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/bootstrap") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session: SessionClaims | null = await verifySession(sessionCookie);

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isProfileSetupPage = pathname === "/profile/setup";
  const isPublicPage = PUBLIC_EXACT_PATHS.has(pathname);

  // If user is NOT authenticated:
  if (!session) {
    // If accessing root or protected route, redirect to /login
    if (pathname === "/" || (!isPublicPage && !isAuthPage)) {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set("from", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // If user IS authenticated:
  // Check if profile setup is required
  if (!session.pc && !isProfileSetupPage) {
    // Force user to complete Stage 2 profile setup first
    return NextResponse.redirect(new URL("/profile/setup", request.url));
  }

  // If profile is already complete and trying to access /profile/setup, redirect to dashboard
  if (session.pc && isProfileSetupPage) {
    const dest = session.role === "WORKER" ? "/worker/dashboard" : session.role === "ADMIN" ? "/admin" : "/client/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // If logged in and visiting login or signup page, redirect to appropriate home/dashboard
  if (isAuthPage) {
    const from = request.nextUrl.searchParams.get("from");
    if (from && from.startsWith("/")) {
      return NextResponse.redirect(new URL(from, request.url));
    }
    const dest = session.role === "WORKER" ? "/worker/dashboard" : session.role === "ADMIN" ? "/admin" : "/client/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Role Segregation Checks:
  if (pathname.startsWith("/admin")) {
    if (session.role !== "ADMIN") {
      // Non-admins cannot access admin portal
      return NextResponse.redirect(new URL(session.role === "WORKER" ? "/worker/dashboard" : "/client/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/worker")) {
    if (session.role !== "WORKER" && session.role !== "DUAL" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/client/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/client")) {
    if (session.role !== "HOMEOWNER" && session.role !== "DUAL" && session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    }
  }

  // Pass session claims in request headers to downstream server components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.sub);
  requestHeaders.set("x-user-role", session.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
