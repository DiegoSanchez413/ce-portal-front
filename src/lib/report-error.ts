import { api } from "./api/client";

// Manda al back un error del navegador; si falla el envío, no hace nada más.
export async function reportClientError(
  error: unknown,
  level: "error" | "warning" = "error",
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));
  try {
    await api.POST("/client-logs", {
      body: {
        level,
        message: err.message,
        stack: err.stack ?? null,
        url: window.location.href,
      },
    });
  } catch {
    // sin red o back caído: el error se pierde
  }
}
