"use client";

import { trpc } from "@/lib/trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";

import { ThemeProviders } from "@/components/ThemeProviders";
import { SidebarProvider } from "@/context/SidebarContext";


export function WarmupUser() {
  // precarga datos mínimos del usuario (no bloquea render)
  trpc.user.me.useQuery(undefined, { staleTime: 5 * 60 * 1000, retry: false });
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson, // debe coincidir con el server
          fetch(url, opts) {
            return fetch(url, { ...opts, credentials: "include" });
          },
        }),
      ],
    })
  );

  return (
    <ThemeProviders>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
              <WarmupUser />
              {children}
            </SidebarProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ThemeProviders>
  );
}
