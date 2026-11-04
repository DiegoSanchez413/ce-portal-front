import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { StyleguideView } from "@/features/styleguide/styleguide-view";

// Catálogo de componentes y paleta; solo existe en desarrollo.
export default function StyleguidePage({ params }: PageProps<"/[locale]/styleguide">) {
  if (process.env.NODE_ENV === "production") notFound();
  setRequestLocale(use(params).locale);
  return <StyleguideView />;
}
