import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TrackSection } from "@/features/session/track-section";
import { CreditView } from "@/features/credit/credit-view";

export default function CreditPage({ params }: PageProps<"/[locale]/credit">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="credit" />
      <CreditView />
    </>
  );
}
