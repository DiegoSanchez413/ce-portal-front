import {
  ChartLine,
  CloudUpload,
  Folder,
  House,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: "home" | "credit" | "payments" | "files" | "letters";
  mobileLabel?: "lettersShort";
  icon: LucideIcon;
};

// Las 5 secciones de la navegación, en el orden de los mockups.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "home", icon: House },
  { href: "/credit", label: "credit", icon: ChartLine },
  { href: "/payments", label: "payments", icon: Wallet },
  { href: "/files", label: "files", icon: Folder },
  {
    href: "/letters",
    label: "letters",
    mobileLabel: "lettersShort",
    icon: CloudUpload,
  },
];

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
