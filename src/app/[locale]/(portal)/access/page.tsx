import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TrackSection } from "@/features/session/track-section";
import { AccessView } from "@/features/access/access-view";

export default function AccessPage({ params }: PageProps<"/[locale]/access">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="my_access" />
      <AccessView />
    </>
  );
}
