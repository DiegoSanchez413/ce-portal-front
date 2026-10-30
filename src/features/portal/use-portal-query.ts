"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SESSION_KEY } from "@/features/session/session-query";
import { useSession } from "@/features/session/session-context";

type ApiResult<T> = { data?: T; response: Response };

// Lectura de una sección con sesión; un 401/403 hace que el shell revalide la sesión.
export function usePortalQuery<T>(key: string, load: () => Promise<ApiResult<T>>) {
  const queryClient = useQueryClient();
  const account = useSession()?.session.account.id ?? "";

  return useQuery({
    queryKey: [key, account],
    queryFn: async () => {
      const { data, response } = await load();
      if (data !== undefined) return data;
      if (response.status === 401 || response.status === 403) {
        await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      }
      throw new Error(`${key} failed with ${response.status}`);
    },
    retry: false,
  });
}
