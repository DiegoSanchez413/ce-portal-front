import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TrackSection } from "@/features/session/track-section";
import { ProfileView } from "@/features/profile/profile-view";

export default function ProfilePage({ params }: PageProps<"/[locale]/profile">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="profile" />
      <ProfileView />
    </>
  );
}
