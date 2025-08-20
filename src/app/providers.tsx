"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc/client"; // createTRPCReact<AppRouter>()
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export function WarmupUser() {
  trpc.user.me.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return null;
}


export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      // ⚠️ En v11 el transformer se pasa en el link, no aquí arriba
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson, // ← debe coincidir con el del server
          // Recomendado si usas cookies/sesión:
          fetch(url, opts) {
            return fetch(url, { ...opts, credentials: "include" });
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
