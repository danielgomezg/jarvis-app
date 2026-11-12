"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Garantiza que el QueryClient no se re-instancie en cada render de Next.js
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" durante 5 minutos
            refetchOnWindowFocus: false, // Evita re-peticiones automáticas al cambiar de pestaña
            retry: (failureCount, error) => {
              // No reintentar errores del cliente (400-499): 429, 401, 409, etc.
              const status = (error as { status?: number }).status;
              if (status && status >= 400 && status < 500) return false;

              // Para errores de red o 5xx, reintentar hasta 2 veces.
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools solo visibles en desarrollo */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
