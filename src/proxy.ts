import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Resuelve el idioma de cada página (prefijo de la URL o cookie) antes de renderizar.
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
