"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const makeClient = () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
let browserClient: QueryClient | undefined;

// Un QueryClient por pestaña para las consultas a la API; se conserva aunque el layout del idioma se vuelva a montar.
function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
