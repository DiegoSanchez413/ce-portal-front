import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PayView } from "@/features/pay/pay-view";

export default function PayPage({ params }: PageProps<"/[locale]/payments/pay">) {
  setRequestLocale(use(params).locale);
  return <PayView />;
}
