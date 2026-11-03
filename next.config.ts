import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  // Las páginas del portal no se guardan en caché ni en el back-forward cache del navegador.
  async headers() {
    return [{ source: "/((?!_next/static|_next/image|.*\\.(?:png|svg|ico|jpg|webp)$).*)", headers: [{ key: "Cache-Control", value: "no-store, private" }] }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
