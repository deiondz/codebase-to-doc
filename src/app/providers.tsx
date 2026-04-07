"use client";

import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "sonner";

import { routes } from "~/lib/routes";
import { authClient } from "~/server/better-auth/client";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <AuthUIProviderTanstack
          authClient={authClient}
          Link={Link}
          navigate={router.push}
          onSessionChange={() => {
            router.refresh();
          }}
          persistClient={false}
          redirectTo={routes.afterSignIn}
          replace={router.replace}
          social={{
            providers: ["google"],
          }}
        >
          {children}
          <Toaster />
        </AuthUIProviderTanstack>
      </AuthQueryProvider>
    </QueryClientProvider>
  );
}
