import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createRouteMatcher } from "./lib/create-route-matcher";
import {
  authSectionPatterns,
  protectedRoutePatterns,
  routes,
} from "./lib/routes";
import { auth } from "./server/better-auth";

const isProtectedRoute = createRouteMatcher([...protectedRoutePatterns]);
const isAuthSection = createRouteMatcher([...authSectionPatterns]);

export default async function proxy(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (isProtectedRoute(req) && !session) {
    console.log("Redirecting to sign-in");
    return NextResponse.redirect(new URL(routes.auth.signIn, req.url));
  }

  const isOAuthCallback = req.nextUrl.pathname === routes.auth.callback;

  if (isAuthSection(req) && session && !isOAuthCallback) {
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
