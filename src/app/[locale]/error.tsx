"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/report-error";

// Error de una página: lo reporta al back y ofrece reintentar.
export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <h2 className="text-xl font-extrabold">{t("title")}</h2>
      <Button size="sm" onClick={retry}>{t("retry")}</Button>
    </div>
  );
}
