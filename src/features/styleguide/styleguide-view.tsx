"use client";

import { CircleCheck, Download, Monitor, Plus, Smartphone, TriangleAlert } from "lucide-react";
import { type ReactNode, useState } from "react";
import { SideNav } from "@/components/shell/side-nav";
import { Alert, InlineMessage } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel, Panel } from "@/components/ui/card";
import { IconTile, RadioCard, Segmented, ToggleChip } from "@/components/ui/choice";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, PageHeader, QueryState, Toast } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { DialogClose, Modal, ModalActions, Sheet } from "@/components/ui/modal";
import { colors } from "@/lib/theme/colors";

const SECTIONS = ["Colors", "Typography", "Buttons", "Badges", "Alerts", "Fields", "Choices", "Cards", "Table", "Feedback", "Dialogs", "Navigation"] as const;

const TONES: BadgeTone[] = ["success", "danger", "warning", "info", "brand", "neutral"];

// Catálogo vivo: cada bloque usa el componente real, así que cambiar un componente se ve aquí y en todo el portal.
export function StyleguideView() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav className="hidden self-start lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-1">
          <span className="mb-2 text-xs font-extrabold tracking-[.06em] text-ink-muted uppercase">Styleguide</span>
          {SECTIONS.map((s) => (
            <a key={s} href={`#${s.toLowerCase()}`} className="rounded-lg px-2 py-1.5 text-sm font-bold text-body hover:bg-card hover:text-navy">
              {s}
            </a>
          ))}
        </nav>
        <main className="flex min-w-0 flex-col gap-10">
          <PageHeader title="Styleguide" subtitle="Components and tokens of the portal. Only available in development." />
          <ColorsBlock />
          <TypographyBlock />
          <ButtonsBlock />
          <BadgesBlock />
          <AlertsBlock />
          <FieldsBlock />
          <ChoicesBlock />
          <CardsBlock />
          <TableBlock />
          <FeedbackBlock />
          <DialogsBlock />
          <NavigationBlock />
        </main>
      </div>
    </div>
  );
}

function Block({ title, usage, children }: { title: (typeof SECTIONS)[number]; usage: string; children: ReactNode }) {
  return (
    <section id={title.toLowerCase()} className="flex scroll-mt-6 flex-col gap-4">
      <div>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <code className="text-xs text-ink-muted">{usage}</code>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function ColorsBlock() {
  return (
    <Block title="Colors" usage='Tailwind: bg-brand, text-body, border-danger-line… · Código: import { colors } from "@/lib/theme/colors"'>
      <Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(colors).map(([name, value]) => (
            <div key={name} className="flex items-center gap-2.5">
              <span className="size-10 shrink-0 rounded-lg border border-line" style={{ background: value }} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13px] font-extrabold">{name}</span>
                <span className="text-xs text-ink-muted">{value}</span>
              </span>
            </div>
          ))}
        </div>
        <CardLabel className="pt-2">Shadows</CardLabel>
        <div className="flex flex-wrap gap-5">
          {["shadow-card", "shadow-raised", "shadow-popover", "shadow-toast", "shadow-modal", "shadow-brand"].map((s) => (
            <div key={s} className={`flex h-16 w-32 items-center justify-center rounded-xl bg-card text-xs font-bold ${s}`}>
              {s}
            </div>
          ))}
        </div>
      </Card>
    </Block>
  );
}

function TypographyBlock() {
  return (
    <Block title="Typography" usage="Nunito 400 · 600 · 700 · 800 (font-sans)">
      <Card className="gap-3">
        <span className="text-[28px] leading-tight font-extrabold">Page title · 28 / 800</span>
        <span className="text-xl font-extrabold">Dialog title · 20 / 800</span>
        <span className="text-lg font-extrabold">Section title · 18 / 800</span>
        <span className="text-[15px] font-extrabold">Row title · 15 / 800</span>
        <span className="text-[15px] text-body">Body text · 15 / 400 · text-body</span>
        <span className="text-[13px] font-semibold text-ink-muted">Secondary text · 13 / 600 · text-ink-muted</span>
        <CardLabel>Card label · 12 / 800 uppercase</CardLabel>
      </Card>
    </Block>
  );
}

function ButtonsBlock() {
  const variants = ["primary", "outline", "brand", "danger", "ghost", "link"] as const;
  return (
    <Block title="Buttons" usage='<Button variant="primary|outline|brand|danger|ghost|link" size="lg|md|sm|xs|icon|inline" block asChild>'>
      <Card className="gap-5">
        {variants.map((variant) => (
          <Row key={variant} label={variant}>
            <Button variant={variant}>Large</Button>
            <Button variant={variant} size="md">
              Medium
            </Button>
            <Button variant={variant} size="sm">
              <Download className="size-4" aria-hidden />
              Small
            </Button>
            <Button variant={variant} size="xs">
              <Plus className="size-4" aria-hidden />
              Extra small
            </Button>
            <Button variant={variant} size="sm" disabled>
              Disabled
            </Button>
          </Row>
        ))}
        <Row label="block (ancho completo)">
          <Button block>Pay $49.00</Button>
        </Row>
        <Row label="asChild (estilo de botón en un enlace)">
          <Button asChild variant="outline" size="sm">
            <a href="#buttons">Link as button</a>
          </Button>
        </Row>
      </Card>
    </Block>
  );
}

function BadgesBlock() {
  return (
    <Block title="Badges" usage='<Badge tone="success|danger|warning|info|brand|neutral">'>
      <Card>
        <Row label="tones">
          {TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </Row>
      </Card>
    </Block>
  );
}

function AlertsBlock() {
  return (
    <Block title="Alerts" usage='<Alert tone="danger|success|warning|info" icon action> · <InlineMessage tone="danger|success">'>
      <Card>
        <Alert tone="info">Your session ended. Please sign in again.</Alert>
        <Alert tone="success">We received your request. Your agent will contact you.</Alert>
        <Alert tone="warning">Your usual card (Visa •••• 2787) has expired, so we preselected your next active card.</Alert>
        <Alert
          tone="danger"
          action={
            <Button variant="danger" size="sm" block>
              Try another card
            </Button>
          }
        >
          Your payment was declined. Please try another card or call us at (855) 517-0390.
        </Alert>
        <InlineMessage>Enter a valid mobile number or account number.</InlineMessage>
        <InlineMessage tone="success">Card details read.</InlineMessage>
      </Card>
    </Block>
  );
}

function FieldsBlock() {
  const [checked, setChecked] = useState(true);
  return (
    <Block title="Fields" usage='<Field label required error hint><Input variant="default|boxed" /></Field> · <Textarea> · <Checkbox label>'>
      <Card className="grid gap-4 md:grid-cols-2">
        <Field label="Mobile number" htmlFor="sg-1" hint="We'll send you a 6-digit code.">
          <Input id="sg-1" placeholder="(555) 123-4567" />
        </Field>
        <Field label="Email" htmlFor="sg-2" error="Enter a valid email.">
          <Input id="sg-2" defaultValue="luis@" aria-invalid />
        </Field>
        <Field label="Cardholder name" htmlFor="sg-3" required>
          <Input id="sg-3" variant="boxed" placeholder="e.g. Maria Lopez" />
        </Field>
        <Field label="Disabled" htmlFor="sg-4">
          <Input id="sg-4" disabled defaultValue="CE1009789" />
        </Field>
        <Field label="Note (optional)" htmlFor="sg-5" className="md:col-span-2">
          <Textarea id="sg-5" placeholder="Tell us more" />
        </Field>
        <Checkbox label="Use this card for my monthly payments" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
      </Card>
    </Block>
  );
}

function ChoicesBlock() {
  const [radio, setRadio] = useState(1);
  const [chips, setChips] = useState<string[]>(["Email"]);
  const [lang, setLang] = useState<"en" | "es">("en");
  return (
    <Block title="Choices" usage="<RadioCard checked onSelect> · <ToggleChip pressed check> · <Segmented options value onChange> · <IconTile tone shape>">
      <Card className="gap-5">
        <div role="radiogroup" className="flex max-w-md flex-col gap-2.5">
          {[1, 2].map((n) => (
            <RadioCard key={n} checked={radio === n} onSelect={() => setRadio(n)}>
              <span className="text-[15px] font-extrabold">Visa •••• 111{n}</span>
            </RadioCard>
          ))}
        </div>
        <Row label="ToggleChip">
          {["Mobile number", "Email", "Address"].map((c) => (
            <ToggleChip key={c} check pressed={chips.includes(c)} onClick={() => setChips(chips.includes(c) ? chips.filter((x) => x !== c) : [...chips, c])}>
              {c}
            </ToggleChip>
          ))}
        </Row>
        <Row label="Segmented">
          <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: "en", label: "en" }, { value: "es", label: "es" }]} />
          <Segmented size="sm" label="Language" value={lang} onChange={setLang} options={[{ value: "en", label: "en" }, { value: "es", label: "es" }]} />
        </Row>
        <Row label="IconTile">
          <IconTile>
            <Monitor className="size-5" aria-hidden />
          </IconTile>
          <IconTile tone="info">
            <Smartphone className="size-5" aria-hidden />
          </IconTile>
          <IconTile tone="brand" shape="circle">
            <TriangleAlert className="size-5" aria-hidden />
          </IconTile>
          <IconTile tone="success" shape="circle">
            <CircleCheck className="size-5" aria-hidden />
          </IconTile>
        </Row>
      </Card>
    </Block>
  );
}

function CardsBlock() {
  return (
    <Block title="Cards" usage="<Card> · <CardLabel> · <Panel>">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardLabel>My cards</CardLabel>
          <Panel>
            <span className="text-[15px] font-extrabold">Visa •••• 2787</span>
            <span className="text-[13px] font-semibold text-ink-muted">Exp 04/31</span>
            <span>
              <Badge tone="brand">Monthly payments</Badge>
            </span>
          </Panel>
        </Card>
        <Card>
          <CardLabel>Amount due</CardLabel>
          <span className="text-[34px] leading-tight font-extrabold">$118.00</span>
          <span className="text-sm font-semibold text-ink-muted">2 × $59.00 = $118.00</span>
        </Card>
      </div>
    </Block>
  );
}

type Sample = { date: string; type: string; amount: string; status: BadgeTone; label: string };
const SAMPLE: Sample[] = Array.from({ length: 8 }, (_, i) => ({
  date: `Oct ${15 - i}, 2026`,
  type: i === 7 ? "Initial payment" : "Monthly payment",
  amount: "$59.00",
  status: i === 2 ? "danger" : "success",
  label: i === 2 ? "Declined" : "Approved",
}));

function TableBlock() {
  return (
    <Block title="Table" usage='<DataTable columns template="1fr 1.4fr 120px" rows rowKey fit fitFrom>'>
      <DataTable
        template="1.1fr 1.4fr .8fr .9fr 118px"
        rows={SAMPLE}
        rowKey={(_, i) => i}
        columns={[
          { key: "date", header: "Date", cell: (r) => <span className="font-extrabold whitespace-nowrap">{r.date}</span> },
          { key: "type", header: "Type", cell: (r) => <span className="font-semibold text-body">{r.type}</span> },
          { key: "amount", header: "Amount", cell: (r) => <span className="font-extrabold">{r.amount}</span> },
          { key: "status", header: "Status", cell: (r) => <Badge tone={r.status}>{r.label}</Badge> },
          {
            key: "receipt",
            header: "",
            className: "flex justify-end",
            cell: () => (
              <Button variant="outline" size="sm">
                <Download className="size-4" aria-hidden />
                Receipt
              </Button>
            ),
          },
        ]}
      />
    </Block>
  );
}

function FeedbackBlock() {
  const [toast, setToast] = useState<string | null>(null);
  return (
    <Block title="Feedback" usage="<PageHeader> · <QueryState loading error onRetry> · <EmptyState> · <Toast message onDone>">
      <div className="grid gap-4 md:grid-cols-2">
        <QueryState loading error={false} onRetry={() => {}} rows={1} />
        <QueryState loading={false} error onRetry={() => {}} />
        <EmptyState
          icon={
            <IconTile tone="success" shape="circle" className="size-16">
              <CircleCheck className="size-9" aria-hidden />
            </IconTile>
          }
          title="Payment approved"
          action={<Button size="md">Done</Button>}
        >
          $118.00 · Oct 27, 2026 · 2:14 PM
        </EmptyState>
        <Card className="items-start">
          <Button variant="outline" size="sm" onClick={() => setToast("Card saved")}>
            Show toast
          </Button>
        </Card>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </Block>
  );
}

function DialogsBlock() {
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  return (
    <Block title="Dialogs" usage="<Modal open title locked onClose> + <ModalActions> · <Sheet open title description>">
      <Card className="flex-row flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setModal(true)}>
          Open modal
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSheet(true)}>
          Open sheet
        </Button>
      </Card>
      <Modal open={modal} title="New card" onClose={() => setModal(false)}>
        <Field label="Cardholder name" htmlFor="sg-m1" required>
          <Input id="sg-m1" variant="boxed" />
        </Field>
        <ModalActions>
          <Button variant="ghost" size="md" onClick={() => setModal(false)}>
            Cancel
          </Button>
          <Button size="md">Save card</Button>
        </ModalActions>
      </Modal>
      <Sheet open={sheet} onOpenChange={setSheet} title="Sign out of other devices?" description="You'll stay signed in here.">
        <Button block>Sign out of other devices</Button>
        <DialogClose asChild>
          <Button variant="ghost" block>
            Cancel
          </Button>
        </DialogClose>
      </Sheet>
    </Block>
  );
}

function NavigationBlock() {
  return (
    <Block title="Navigation" usage="<SideNav> (escritorio) · <BottomNav> (celular, fija abajo) · <UserMenu> · <LanguageSwitch>">
      <div className="max-w-[260px]">
        <SideNav />
      </div>
    </Block>
  );
}
