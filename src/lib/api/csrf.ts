import { API_ORIGIN } from "./config";

const XSRF_COOKIE = "XSRF-TOKEN";

let csrfRequest: Promise<void> | null = null;

function readXsrfCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${XSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(XSRF_COOKIE.length + 1)) : null;
}

// Pide la cookie XSRF-TOKEN de Sanctum una sola vez y devuelve su valor para la cabecera.
export async function getXsrfToken(): Promise<string | null> {
  if (!readXsrfCookie()) {
    csrfRequest ??= fetch(`${API_ORIGIN}/sanctum/csrf-cookie`, {
      credentials: "include",
    })
      .then(() => undefined)
      .finally(() => {
        csrfRequest = null;
      });
    await csrfRequest;
  }
  return readXsrfCookie();
}
