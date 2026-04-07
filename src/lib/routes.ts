import { authViewPaths } from "@daveyplate/better-auth-ui/server";

const authPrefix = "/auth";
const accountPrefix = "/account";

/** Central app paths — use these instead of ad hoc string literals. */
export const routes = {
  home: "/" as const,
  convert: "/convert" as const,
  /** Default destination after sign-in — keep in sync with `AuthUIProviderTanstack` `redirectTo`. */
  afterSignIn: "/convert" as const,
  auth: {
    prefix: authPrefix,
    signIn: `${authPrefix}/${authViewPaths.SIGN_IN}`,
    signUp: `${authPrefix}/${authViewPaths.SIGN_UP}`,
    callback: `${authPrefix}/${authViewPaths.CALLBACK}`,
    /** Better Auth UI `UserButton` navigates here to end the session. */
    signOut: `${authPrefix}/${authViewPaths.SIGN_OUT}`,
  },
  account: {
    prefix: accountPrefix,
  },
} as const;

/** `createRouteMatcher` patterns for routes that require a session. */
export const protectedRoutePatterns = [
  "/dashboard/:path*",
  "/convert",
  `${accountPrefix}/:path*`,
  routes.convert,
] as const;

/** `createRouteMatcher` patterns for the auth UI tree (`/auth/*`). */
export const authSectionPatterns = [`${authPrefix}/:path*`] as const;
