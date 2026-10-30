"use client";

import { useEffect, useState } from "react";

// Segundos que faltan hasta una fecha ISO, actualizados cada segundo.
export function useSecondsUntil(iso: string | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  const target = iso ? Date.parse(iso) : 0;

  useEffect(() => {
    if (!target || target <= Date.now()) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return target ? Math.max(0, Math.ceil((target - now) / 1000)) : 0;
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
