import { NextRequest, NextResponse } from "next/server";
import { authClient } from "@/lib/auth-client";

type UserWithRole = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
  role: string;
};

export async function middleware(req: NextRequest) {
  const sessionData = await authClient.getSession();
  const url = new URL(req.url);
  const pathname = url.pathname;

  const user = sessionData?.data?.user as UserWithRole | undefined;

  // require authentication for all protected routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/organizer") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/tickets") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/user")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  // only organizer and staff can access the /dashboard
  if (
    pathname.startsWith("/dashboard") &&
    user?.role !== "organizer" &&
    user?.role !== "staff"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // organizer-only access
  if (
    pathname.startsWith("/organizer") &&
    user?.role !== "organizer"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // staff-only access
  if (
    pathname.startsWith("/staff") &&
    user?.role !== "staff"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // user-specific routes protection
  if (pathname.startsWith("/user")) {
    const userId = pathname.split("/")[2];
    if (user?.id !== userId) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/organizer/:path*",
    "/staff/:path*",
    "/tickets/:path*",
    "/events/:path*",
    "/user/:path*",
  ],
};