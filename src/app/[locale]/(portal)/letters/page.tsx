import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LettersView } from "@/features/letters/letters-view";
import { TrackSection } from "@/features/session/track-section";

export default function LettersPage({ params }: PageProps<"/[locale]/letters">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="upload_letters" />
      <LettersView />
    </>
  );
}
