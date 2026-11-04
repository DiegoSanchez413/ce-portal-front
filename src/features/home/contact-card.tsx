import { useTranslations } from "next-intl";
import { HELP_LINKS } from "@/components/shell/help-links";
import { Card, CardLabel } from "@/components/ui/card";

// Contact us de Inicio, solo en celular: en escritorio está en el menú lateral.
export function ContactCard() {
  const t = useTranslations("Home");
  const help = useTranslations("Help");

  return (
    <Card className="lg:hidden">
      <CardLabel>{t("contact")}</CardLabel>
      <div className="grid grid-cols-3 gap-2">
        {HELP_LINKS.map(({ key, href, number, icon: Icon, color }) => (
          <a
            key={key}
            href={href}
            title={number}
            target={key === "whatsapp" ? "_blank" : undefined}
            rel={key === "whatsapp" ? "noopener noreferrer" : undefined}
            className="flex min-h-11 flex-col items-center gap-1.5 rounded-[14px] bg-surface-alt px-1.5 py-3.5 text-navy hover:bg-brand-soft"
          >
            <span className={`flex size-10 items-center justify-center rounded-full bg-card shadow-pill ${color}`}>
              <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-[13px] font-extrabold">{help(key)}</span>
          </a>
        ))}
      </div>
    </Card>
  );
}
