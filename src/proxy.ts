import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Resuelve el idioma por el prefijo de la URL o la cookie del switch EN/ES; sin ninguno, inglés (no mira el navegador).
// En desarrollo pasa 127.0.0.1 a localhost: es el único origen que aceptan Next y el back.
export default function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (process.env.NODE_ENV === "development" && host.startsWith("127.0.0.1")) {
    const url = `http://${host.replace("127.0.0.1", "localhost")}${request.nextUrl.pathname}${request.nextUrl.search}`;
    return new NextResponse(null, { headers: { Refresh: `0; url=${url}` } });
  }
  const headers = new Headers(request.headers);
  headers.delete("accept-language");
  return intl(new NextRequest(request, { headers }));
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
