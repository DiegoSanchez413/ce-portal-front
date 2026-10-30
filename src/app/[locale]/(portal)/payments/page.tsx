import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { TrackSection } from "@/features/session/track-section";
import { PaymentsView } from "@/features/payments/payments-view";

export default function PaymentsPage({ params }: PageProps<"/[locale]/payments">) {
  setRequestLocale(use(params).locale);
  return (
    <>
      <TrackSection section="payments" />
      <PaymentsView />
    </>
  );
}
