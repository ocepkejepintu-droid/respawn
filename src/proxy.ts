import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/briefing/:path*",
    "/competitors/:path*",
    "/audience/:path*",
    "/optimize/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/api/trpc/:path*",
  ],
};

const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/signup",
  "/auth/error",
  "/auth/verify-request",
  "/forgot-password",
  "/about",
  "/pricing",
  "/contact",
  "/blog",
];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", token.sub);
  requestHeaders.set("x-user-email", token.email as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
