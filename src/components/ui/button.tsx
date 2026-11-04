import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Botón del portal: variante (aspecto) y tamaño; block ocupa todo el ancho y asChild aplica el estilo a un Link.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-extrabold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-brand-focus disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white shadow-brand hover:bg-brand-hover disabled:hover:bg-brand",
        outline: "border-[1.5px] border-navy bg-card text-navy hover:bg-muted disabled:hover:bg-card",
        brand: "border-[1.5px] border-brand bg-card text-brand hover:bg-brand-soft",
        danger: "border-[1.5px] border-danger bg-card text-danger hover:bg-danger-tint",
        ghost: "text-ink-muted hover:text-navy",
        link: "rounded-md text-brand hover:text-brand-hover hover:underline",
      },
      size: {
        lg: "min-h-[50px] px-8 py-3.5 text-base",
        md: "min-h-12 px-7 text-[15px]",
        sm: "min-h-11 px-4 text-sm",
        xs: "min-h-10 px-3.5 text-sm",
        icon: "size-10",
        inline: "min-h-0 p-0",
      },
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [{ variant: "link", size: ["lg", "md", "sm", "xs"], className: "px-2" }],
    defaultVariants: { variant: "primary", size: "lg", block: false },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, block, asChild = false, type = "button", ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
