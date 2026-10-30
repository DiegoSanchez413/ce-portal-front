import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { FilesView } from "@/features/files/files-view";
import { TrackSection } from "@/features/session/track-section";

export default function FilesPage({ params }: PageProps<"/[locale]/files">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="my_files" />
      <FilesView />
    </>
  );
}
