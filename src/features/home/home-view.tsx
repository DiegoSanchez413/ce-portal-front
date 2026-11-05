"use client";

import { Calendar, Check, Clock, CreditCard, Eye, FileText, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { ScoreTile } from "@/features/credit/score-tile";
import { BUREAUS } from "@/features/credit/score";
import { lateBreakdown } from "@/features/payments/history";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { IconTile } from "@/components/ui/choice";
import { QueryState } from "@/components/ui/feedback";
import { usePortalQuery } from "@/features/portal/use-portal-query";
import { useSession } from "@/features/session/session-context";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { Home } from "@/lib/api/types";
import { formatClock, formatDate, formatMoney, formatShortDate, formatWeekdayDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PayNowButton } from "@/features/pay/pay-view";
import { ContactCard } from "./contact-card";
import { attentionColor } from "@/features/files/documents";


// Inicio: plan, scores, pagos, próxima cita, avance de disputas y contacto.
export function HomeView() {
  const t = useTranslations("Home");
  const session = useSession();
  const query = usePortalQuery("home", () => api.GET("/home"));
  const home = query.data;

  return (
    <div className="flex flex-col gap-[18px] lg:gap-6">
      <div>
        <h1 className="mb-0.5 text-2xl font-extrabold lg:mb-1 lg:text-[28px]">{t("greeting", { name: session?.session.client.first_name ?? "" })}</h1>
        <p className="text-sm text-ink-muted lg:text-[15px]">{t("subtitle")}</p>
      </div>
      <QueryState loading={query.isPending} error={query.isError} onRetry={() => void query.refetch()} />
      {home && (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2 lg:gap-5">
          {home.plan && <PlanCard plan={home.plan} />}
          <ScoresCard scores={home.scores} />
          <PaymentsCard payments={home.payments} cardAlert={home.card_alert} />
          {home.files.length > 0 && <FilesCard files={home.files} />}
          {home.appointment && <AppointmentCard appointment={home.appointment} />}
          <DisputeCard dispute={home.dispute} />
          <ContactCard />
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: NonNullable<Home["plan"]> }) {
  const t = useTranslations("Home");
  const done = plan.status === "service_completed";
  const pct = plan.total_payments > 0 ? Math.min(100, Math.round((plan.paid_payments / plan.total_payments) * 100)) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <CardLabel>{t("myPlan")}</CardLabel>
        <Badge tone={done ? "neutral" : "success"}>
          {done ? t("planCompleted") : t("planActive")}
        </Badge>
      </div>
      <p className="text-2xl leading-[1.1] font-extrabold">{plan.name}</p>
      <div className="flex flex-col gap-2">
        <div className="h-2.5 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-valuemin={0} aria-valuemax={plan.total_payments} aria-valuenow={plan.paid_payments}>
          <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between gap-2 text-[13px] font-bold text-ink-muted">
          <span>{t("progress", { paid: plan.paid_payments, total: plan.total_payments })}</span>
          <span>{t("perMonth", { amount: formatMoney(plan.monthly_amount) })}</span>
        </div>
      </div>
    </Card>
  );
}

function ScoresCard({ scores }: { scores: Home["scores"] }) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card>
      <CardLabel>{t("myScores")}</CardLabel>
      {scores ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {BUREAUS.map((bureau) => (
              <ScoreTile key={bureau} bureau={bureau} value={scores[bureau]} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink-muted">{t("lastReport", { date: formatDate(scores.date, locale) })}</span>
            <Button asChild variant="link" size="inline" className="min-h-11 self-start text-sm hover:no-underline">
              <Link href="/credit">{t("seeCredit")} ›</Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-xl border-[1.5px] border-dashed border-line p-[18px] text-center">
          <span className="text-[15px] font-extrabold">{t("noReport")}</span>
          <span className="text-[13px] text-ink-muted">{t("noReportSub")}</span>
        </div>
      )}
    </Card>
  );
}

function PaymentsCard({ payments, cardAlert }: { payments: Home["payments"]; cardAlert: Home["card_alert"] }) {
  const t = useTranslations("Home");
  const locale = useLocale();

  if (payments.state === "late") {
    const count = payments.pending_count ?? 0;
    const monthly = payments.monthly_amount ?? 0;
    return (
      <section className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-brand bg-brand-wash p-5 shadow-[0_4px_20px_color-mix(in_srgb,var(--color-brand)_12%,transparent)]">
        <CardLabel className="text-brand-strong">{t("payments")}</CardLabel>
        <div className="flex items-start gap-3">
          <IconTile tone="brand" shape="circle">
            <TriangleAlert className="size-5" strokeWidth={2.5} aria-hidden />
          </IconTile>
          <div className="flex flex-col gap-0.5">
            <span className="text-[17px] leading-snug font-extrabold">
              {t("lateTitle", { count, amount: formatMoney(payments.amount_due ?? count * monthly) })}
            </span>
            <span className="text-[13px] font-semibold text-body">{lateBreakdown(count, monthly)}</span>
            <span className="text-[13px] font-semibold text-body">{t("lateSub")}</span>
          </div>
        </div>
        {cardAlert && <CardAlert alert={cardAlert} />}
        <PayNowButton size="md" block>{t("payNow")}</PayNowButton>
      </section>
    );
  }

  if (payments.state === "loyal") return <LoyalCard amountDue={payments.amount_due ?? null} cardAlert={cardAlert} />;

  return (
    <Card className="gap-3">
      <CardLabel>{t("payments")}</CardLabel>
      {payments.next_date && payments.next_amount !== null && payments.next_amount !== undefined && (
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Calendar className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-base leading-snug font-extrabold">
            {t("nextPayment", { date: formatDate(payments.next_date, locale), amount: formatMoney(payments.next_amount) })}
          </span>
        </div>
      )}
      {cardAlert && <CardAlert alert={cardAlert} />}
      {payments.amount_due !== null && payments.amount_due !== undefined && payments.amount_due > 0 && (
        <PayNowButton size="md" block>{t("payNow")}</PayNowButton>
      )}
      <Button asChild variant="link" size="inline" className="min-h-11 self-start text-sm hover:no-underline">
        <Link href="/payments">{t("seePayments")} ›</Link>
      </Button>
    </Card>
  );
}

// Aviso de la tarjeta del cobro automático vencida o por vencer, con acceso a My cards.
function CardAlert({ alert }: { alert: NonNullable<Home["card_alert"]> }) {
  const t = useTranslations("Home");
  const expired = alert.state === "expired";
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-bold",
        expired ? "border-danger-line bg-danger-tint text-danger-text" : "border-warning-line bg-warning-tint text-warning-strong",
      )}
    >
      <span className="flex items-center gap-2">
        <CreditCard className={cn("size-[18px] shrink-0", expired ? "text-danger" : "text-warning-accent")} strokeWidth={2.25} aria-hidden />
        {expired ? t("cardExpired") : t("cardExpiring", { expiration: alert.expiration })}
      </span>
      <Link href="/payments#my-cards" className="flex min-h-10 items-center rounded-full px-2 font-extrabold underline">
        {t("updateCard")}
      </Link>
    </div>
  );
}

function LoyalCard({ amountDue, cardAlert }: { amountDue: number | null; cardAlert: Home["card_alert"] }) {
  const t = useTranslations("Home");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const owes = amountDue !== null && amountDue > 0;

  const request = async () => {
    setState("busy");
    try {
      const { response } = await api.POST("/home/services-interest");
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <Card className="gap-3">
      <CardLabel>{t("payments")}</CardLabel>
      {/* Con deuda pendiente se muestra el saldo en lugar del agradecimiento. */}
      <div className="flex items-start gap-3">
        <IconTile tone={owes ? "brand" : "success"} shape="circle">
          {owes ? <TriangleAlert className="size-5" strokeWidth={2.5} aria-hidden /> : <Check className="size-5" strokeWidth={2.5} aria-hidden />}
        </IconTile>
        <div className="flex flex-col gap-0.5">
          <span className="text-[17px] leading-snug font-extrabold">{owes ? t("loyalDueTitle", { amount: formatMoney(amountDue ?? 0) }) : t("loyalTitle")}</span>
          <span className="text-[13px] font-semibold text-body">{owes ? t("loyalDueSub") : t("loyalSub")}</span>
        </div>
      </div>
      {cardAlert && <CardAlert alert={cardAlert} />}
      {owes && <PayNowButton size="md" block>{t("payNow")}</PayNowButton>}
      {state === "sent" && <Alert tone="success">{t("loyalConfirm")}</Alert>}
      {state === "error" && <InlineMessage>{t("requestError")}</InlineMessage>}
      <Button variant="outline" size="md" block onClick={() => void request()} disabled={state === "busy" || state === "sent"}>
        {t("loyalButton")}
      </Button>
    </Card>
  );
}

function FilesCard({ files }: { files: Home["files"] }) {
  const t = useTranslations("Home");
  const tf = useTranslations("Files");

  return (
    <Card className="gap-3">
      <CardLabel>{t("myFiles")}</CardLabel>
      <ul className="flex flex-col">
        {files.map((doc) => (
          <li key={doc.type} className="flex items-center justify-between gap-3 border-t border-line py-2.5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[15px] font-extrabold">{tf(`names.${doc.type}`)}</span>
              <span className="text-[13px] font-bold" style={{ color: attentionColor(doc) }}>
                {doc.status === "approved" && doc.expires_in_days !== null ? tf("expiresIn", { days: doc.expires_in_days }) : tf(`status.${doc.status}`)}
              </span>
            </div>
            <Button asChild variant="outline" size="sm" className="px-[18px]">
              <Link href={{ pathname: "/files", query: { update: doc.type } }}>{t("update")}</Link>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AppointmentCard({ appointment }: { appointment: NonNullable<Home["appointment"]> }) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card className="gap-3">
      <CardLabel>{t("nextAppointment")}</CardLabel>
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-line-soft text-navy">
          <Clock className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="text-base leading-snug font-extrabold">
          {t("appointment", {
            date: formatWeekdayDate(appointment.date, locale),
            time: formatClock(appointment.time, locale),
            specialist: appointment.specialist,
          })}
        </span>
      </div>
    </Card>
  );
}

function DisputeCard({ dispute }: { dispute: Home["dispute"] }) {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <Card>
      <CardLabel>{t("dispute")}</CardLabel>
      {dispute ? (
        <ol className="flex flex-col">
          <li className="flex items-start gap-3">
            <div className="flex shrink-0 flex-col items-center">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-white">
                <Check className="size-3.5" strokeWidth={3} aria-hidden />
              </span>
              <span className="h-[22px] w-0.5 bg-brand" />
            </div>
            <span className="pt-1 text-[15px] font-extrabold">
              {t("roundSent", { round: dispute.round, date: formatShortDate(dispute.sent_at, locale) })}
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                dispute.window_closed ? "border-brand bg-brand-soft text-brand" : "border-line-strong bg-card text-faint",
              )}
            >
              {dispute.window_closed ? <Eye className="size-3.5" strokeWidth={2.5} aria-hidden /> : <Clock className="size-3.5" strokeWidth={2.5} aria-hidden />}
            </span>
            <span className="pt-1 text-[15px] font-bold text-body">
              {dispute.window_closed
                ? t("windowClosed", { date: formatShortDate(dispute.respond_by, locale) })
                : t("respondBy", { date: formatShortDate(dispute.respond_by, locale) })}
            </span>
          </li>
        </ol>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <FileText className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-[15px] leading-snug font-extrabold">{t("firstRound")}</span>
        </div>
      )}
    </Card>
  );
}
