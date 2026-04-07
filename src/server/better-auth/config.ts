import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { env } from "~/env";
import { db, mongoClient } from "~/server/db/mongo";
import { sendPasswordResetEmail } from "~/server/email/templates/password-reset";
import { sendVerificationResetEmail } from "~/server/email/templates/verification";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
  appName: "codebase-to-docs",
  database: mongodbAdapter(db, { client: mongoClient }),
  experimental: { joins: true },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: { email: user.email, name: user.name ?? undefined },
        actionUrl: url,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationResetEmail({
        to: { email: user.email, name: user.name ?? undefined },
        actionUrl: url,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
  },
});

export type Session = typeof auth.$Infer.Session;
