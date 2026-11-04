"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Las sugerencias de Google se dibujan fuera del modal: tocarlas no debe cerrarlo.
export function keepForPlaces(e: { target: EventTarget | null; preventDefault: () => void }) {
  if (e.target instanceof Element && e.target.closest(".pac-container")) e.preventDefault();
}

// Modal de formulario: centrado en escritorio y hoja desde abajo en celular; el contenido se monta solo mientras está abierto.
// locked bloquea el cierre mientras hay una operación en curso.
export function Modal({ open, title, locked = false, onClose, children }: { open: boolean; title: string; locked?: boolean; onClose: () => void; children: ReactNode }) {
  const t = useTranslations("Common");
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !locked && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-navy/55 animate-[modal-fade_.2s_ease_backwards] motion-reduce:animate-none md:items-center md:p-5">
          <Dialog.Content
            aria-describedby={undefined}
            onInteractOutside={keepForPlaces}
            className="flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-2xl bg-white shadow-modal outline-none animate-[modal-rise_.26s_cubic-bezier(.22,.61,.36,1)_backwards] motion-reduce:animate-none md:max-h-[calc(100dvh-40px)] md:w-[560px] md:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3 pt-5 pr-5 pl-6">
              <Dialog.Title className="text-lg font-bold text-navy">{title}</Dialog.Title>
              <Dialog.Close disabled={locked} aria-label={t("close")} className="flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface disabled:opacity-50">
                <X className="size-[18px]" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="flex flex-col gap-4 px-6 pt-5 pb-6">{open && children}</div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Fila de botones al pie del modal: a la derecha en escritorio y apilados a todo el ancho en celular.
export function ModalActions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse items-stretch gap-2 md:flex-row md:items-center md:justify-end", className)} {...props} />;
}

// Hoja de confirmación: inferior en celular y modal chico centrado en escritorio.
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideTitle?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Common");
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/55 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          onInteractOutside={keepForPlaces}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col gap-4 overflow-y-auto rounded-t-[20px] bg-card px-5 pt-4 pb-7 shadow-sheet outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[480px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[20px] lg:p-7 lg:data-[state=open]:slide-in-from-bottom-0 lg:data-[state=open]:zoom-in-95"
        >
          <div className="mx-auto h-1 w-10 rounded-full bg-line lg:hidden" />
          {/* Con hideTitle la X se superpone al contenido: la fila queda encima y solo la X recibe clics. */}
          <div className={cn("relative z-10 flex items-start justify-between gap-3", hideTitle && "pointer-events-none lg:-mb-12 lg:justify-end")}>
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className={hideTitle ? "sr-only" : "text-xl leading-snug font-extrabold"}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm text-ink-muted">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            <Dialog.Close className="pointer-events-auto hidden size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-muted lg:flex" aria-label={t("close")}>
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Botón que cierra la hoja o el modal donde está (Cancel, Done).
export const DialogClose = Dialog.Close;
