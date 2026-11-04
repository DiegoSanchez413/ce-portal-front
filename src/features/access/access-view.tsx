"use client";

import { ChevronDown, Monitor, Smartphone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/choice";
import { PageHeader, QueryState, Toast } from "@/components/ui/feedback";
import { DialogClose, Sheet } from "@/components/ui/modal";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { api } from "@/lib/api/client";
import type { AccessDevice, AccessSession } from "@/lib/api/types";
import { formatDateTime, formatTimeOfDay, isSameDay } from "@/lib/format";
import { cn } from "@/lib/utils";

type Confirm = { kind: "others" } | { kind: "device"; device: AccessDevice };

// My access: un renglón por dispositivo con su último acceso; al abrirlo muestra sus sesiones y permite cerrarlo.
export function AccessView() {
  const t = useTranslations("Access");
  const query = usePortalQuery("access-devices", () => api.GET("/access/devices"));
  const [open, setOpen] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirm | null>(null);
  const [toast, setToast] = useState<"signedOut" | "deviceSignedOut" | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const others = query.data?.some((device) => !device.current && device.active) ?? false;

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {query.data && (
        <div className="lg:max-w-[620px]">
          <Card className="gap-4 p-[18px] lg:p-7">
            <ul className="flex flex-col">
              {query.data.map((device) => (
                <DeviceRow
                  key={device.key}
                  device={device}
                  open={open === device.key}
                  onToggle={() => setOpen(open === device.key ? null : device.key)}
                  onSignOut={() => setConfirming({ kind: "device", device })}
                />
              ))}
            </ul>
            {others && (
              <Button variant="outline" block onClick={() => setConfirming({ kind: "others" })}>
                {t("signOutOthers")}
              </Button>
            )}
          </Card>
        </div>
      )}
      {confirming && (
        <ConfirmSheet
          confirm={confirming}
          onClose={() => setConfirming(null)}
          onDone={() => {
            setConfirming(null);
            setToast(confirming.kind === "others" ? "signedOut" : "deviceSignedOut");
            void query.refetch();
          }}
        />
      )}
      <Toast message={toast && t(toast)} onDone={clearToast} />
    </div>
  );
}

// "Today, 3:15 PM" o "Oct 30, 3:15 PM" (con año si no es el actual).
function useWhen() {
  const t = useTranslations("Access");
  const locale = useLocale();
  return (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    return isSameDay(date, now) ? t("today", { time: formatTimeOfDay(date, locale) }) : formatDateTime(date, locale, date.getFullYear() !== now.getFullYear());
  };
}

const place = (item: { city: string | null; region: string | null }) => [item.city, item.region].filter(Boolean).join(", ");

function DeviceRow({ device, open, onToggle, onSignOut }: { device: AccessDevice; open: boolean; onToggle: () => void; onSignOut: () => void }) {
  const t = useTranslations("Access");
  const when = useWhen();
  const Icon = device.is_phone ? Smartphone : Monitor;
  const where = place(device);
  const lastActive = device.current ? t("activeNow") : when(device.last_active_at);

  return (
    <li className="border-b border-line-soft last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center gap-3 py-3 text-left">
        <IconTile>
          <Icon className="size-5" strokeWidth={2.25} aria-hidden />
        </IconTile>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-extrabold">
            {device.device} · {device.browser}
            {device.current ? (
              <Badge tone="success">{t("thisDevice")}</Badge>
            ) : (
              device.active && <Badge tone="info">{t("active")}</Badge>
            )}
          </span>
          <span className="text-[13px] font-semibold text-ink-muted">{where ? `${where} · ${lastActive}` : lastActive}</span>
        </span>
        <ChevronDown className={cn("size-5 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="mb-3 ml-[52px] flex flex-col gap-2.5 rounded-xl bg-surface-alt px-3.5 py-3">
          <span className="text-xs font-extrabold tracking-[.06em] text-ink-muted uppercase">{t("signIns", { count: device.total_sessions })}</span>
          <ul className="flex flex-col gap-2">
            {device.sessions.map((session) => (
              <SessionLine key={session.id} session={session} />
            ))}
          </ul>
          {device.total_sessions > device.sessions.length && <span className="text-xs text-ink-muted">{t("showingLast", { count: device.sessions.length })}</span>}
          {device.active && !device.current && (
            <Button variant="danger" size="xs" onClick={onSignOut} className="mt-1 self-start">
              {t("signOutDevice")}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function SessionLine({ session }: { session: AccessSession }) {
  const t = useTranslations("Access");
  const when = useWhen();
  const where = place(session);
  const status = session.current ? t("status.current") : session.active ? t("status.active") : t(`status.${session.end_reason ?? "ended"}`);

  return (
    <li className="flex items-start justify-between gap-3 text-[13px]">
      <span className="flex min-w-0 flex-col">
        <span className="font-bold text-navy">{when(session.started_at)}</span>
        {where && <span className="text-ink-muted">{where}</span>}
      </span>
      <span className={cn("shrink-0 font-semibold", session.active || session.current ? "text-success" : "text-ink-muted")}>{status}</span>
    </li>
  );
}

function ConfirmSheet({ confirm, onClose, onDone }: { confirm: Confirm; onClose: () => void; onDone: () => void }) {
  const t = useTranslations("Access");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const device = confirm.kind === "device" ? confirm.device : null;

  const run = async () => {
    setState("busy");
    try {
      const { response } = device
        ? await api.POST("/access/devices/{key}/sign-out", { params: { path: { key: device.key } } })
        : await api.POST("/access/sign-out-others");
      if (response.ok) onDone();
      else setState("error");
    } catch {
      setState("error");
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(o) => !o && onClose()}
      title={device ? t("confirmDeviceTitle", { device: `${device.device} · ${device.browser}` }) : t("confirmTitle")}
      description={device ? t("confirmDeviceSub") : t("confirmSub")}
    >
      {state === "error" && <InlineMessage>{t("error")}</InlineMessage>}
      <div className="flex flex-col gap-1">
        <Button block onClick={() => void run()} disabled={state === "busy"}>
          {device ? t("signOutDevice") : t("signOutOthers")}
        </Button>
        <DialogClose asChild>
          <Button variant="ghost" size="sm" block className="text-[15px]">
            {t("cancel")}
          </Button>
        </DialogClose>
      </div>
    </Sheet>
  );
}
