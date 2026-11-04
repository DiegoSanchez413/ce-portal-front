import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Resuelve el idioma de cada página (prefijo de la URL o cookie) antes de renderizar.
// En desarrollo pasa 127.0.0.1 a localhost: es el único origen que aceptan Next y el back.
export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (process.env.NODE_ENV === "development" && host.startsWith("127.0.0.1")) {
    const url = `http://${host.replace("127.0.0.1", "localhost")}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return new NextResponse(null, { headers: { Refresh: `0; url=${url}` } });
  }
  return intl(request);
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
