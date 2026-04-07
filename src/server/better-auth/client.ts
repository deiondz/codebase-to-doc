import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [nextCookies()],
});

export type Session = typeof authClient.$Infer.Session;
