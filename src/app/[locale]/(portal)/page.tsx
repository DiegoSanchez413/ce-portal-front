import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TrackSection } from "@/features/session/track-section";
import { HomeView } from "@/features/home/home-view";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="home" />
      <HomeView />
    </>
  );
}
