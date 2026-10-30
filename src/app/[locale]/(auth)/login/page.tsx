import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { LoginFlow } from "@/features/auth/login-flow";

export default function LoginPage({ params }: PageProps<"/[locale]/login">) {
  setRequestLocale(use(params).locale);
  return <LoginFlow />;
}
