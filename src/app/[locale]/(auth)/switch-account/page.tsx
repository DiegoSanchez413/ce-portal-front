import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SwitchClient } from "@/features/auth/switch-client";

export default function SwitchAccountPage({ params }: PageProps<"/[locale]/switch-account">) {
  setRequestLocale(use(params).locale);
  return <SwitchClient />;
}
