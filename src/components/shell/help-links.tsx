import { MessageSquareText, MessageCircle, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

export const HELP_LINKS = [
  {
    key: "call",
    href: "tel:+18555170390",
    number: "(855) 517-0390",
    icon: Phone,
    color: "text-brand",
  },
  {
    key: "whatsapp",
    href: "https://wa.me/15103036069",
    number: "(510) 303-6069",
    icon: MessageCircle,
    color: "text-whatsapp",
  },
  {
    key: "text",
    href: "sms:+15106710017",
    number: "(510) 671-0017",
    icon: MessageSquareText,
    color: "text-navy",
  },
] as const;

// Bloque "Need help?" del menú lateral: llamada, WhatsApp y SMS a Customer Care.
export function HelpLinks() {
  const t = useTranslations("Help");

  return (
    <div className="mt-3 flex flex-col gap-2.5 border-t border-line-soft px-1 pt-3.5 pb-1">
      <span className="text-xs font-extrabold tracking-wider text-ink-muted uppercase">
        {t("title")}
      </span>
      <div className="flex justify-between gap-1.5">
        {HELP_LINKS.map(({ key, href, number, icon: Icon, color }) => (
          <a
            key={key}
            href={href}
            title={number}
            target={key === "whatsapp" ? "_blank" : undefined}
            rel={key === "whatsapp" ? "noopener noreferrer" : undefined}
            className="group flex min-h-11 flex-1 flex-col items-center gap-1.5 text-navy"
          >
            <span
              className={`flex size-11 items-center justify-center rounded-full bg-surface-alt group-hover:bg-brand-soft ${color}`}
            >
              <Icon className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-xs font-extrabold">{t(key)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
