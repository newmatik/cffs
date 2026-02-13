import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Public routes
  if (pathname === "/login") {
    if (isLoggedIn) {
      const redirectTo = role === "MEMBER" ? "/my-account" : "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // Protect all other routes
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Members can only access /my-account
  if (role === "MEMBER") {
    if (!pathname.startsWith("/my-account") && !pathname.startsWith("/api")) {
      return NextResponse.redirect(new URL("/my-account", req.url));
    }
  }

  // Officers and Admins can access dashboard routes
  if (pathname === "/") {
    const redirectTo = role === "MEMBER" ? "/my-account" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
