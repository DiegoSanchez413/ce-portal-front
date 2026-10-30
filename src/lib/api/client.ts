import createClient, { type Middleware } from "openapi-fetch";
import { API_URL } from "./config";
import { getXsrfToken } from "./csrf";
import type { paths } from "./schema";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// Las peticiones que cambian datos llevan la cabecera X-XSRF-TOKEN de la sesión.
const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    request.headers.set("Accept", "application/json");
    if (!SAFE_METHODS.includes(request.method)) {
      const token = await getXsrfToken();
      if (token) request.headers.set("X-XSRF-TOKEN", token);
    }
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: API_URL,
  credentials: "include",
});

api.use(csrfMiddleware);
