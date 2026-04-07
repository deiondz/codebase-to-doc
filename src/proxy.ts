import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createRouteMatcher } from "./lib/create-route-matcher";
import {
  authSectionPatterns,
  protectedRoutePatterns,
  routes,
} from "./lib/routes";
import { getSession } from "./server/better-auth/server";

const isProtectedRoute = createRouteMatcher([...protectedRoutePatterns]);
const isAuthSection = createRouteMatcher([...authSectionPatterns]);

export default async function proxy(req: NextRequest) {
  const session = await getSession();

  if (isProtectedRoute(req) && !session) {
    return NextResponse.redirect(new URL(routes.auth.signIn, req.url));
  }

  const pathname = req.nextUrl.pathname;
  const isOAuthCallback = pathname === routes.auth.callback;
  const isSignOutPage = pathname === routes.auth.signOut;

  if (isAuthSection(req) && session && !isOAuthCallback && !isSignOutPage) {
    return NextResponse.redirect(new URL(routes.afterSignIn, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
