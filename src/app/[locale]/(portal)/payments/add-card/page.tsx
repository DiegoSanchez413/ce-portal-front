import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { AddCardView } from "@/features/cards/add-card-view";

export default function AddCardPage({ params }: PageProps<"/[locale]/payments/add-card">) {
  setRequestLocale(use(params).locale);
  return <AddCardView />;
}
