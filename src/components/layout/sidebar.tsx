"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Repeat,
  ArrowLeftRight,
  Receipt,
  Landmark,
  BarChart3,
  Tags,
  FileStack,
  Settings,
  Shield,
  LogOut,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useTranslations, useLocale } from "next-intl";
import { setLocale } from "@/lib/locale";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  titleKey?: string;
  items: NavItem[];
}

const baseNavSections: NavSection[] = [
  {
    items: [
      { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
    ],
  },
  {
    titleKey: "invoicing",
    items: [
      { href: "/clients", labelKey: "clients", icon: Users },
      { href: "/services", labelKey: "services", icon: Briefcase },
      { href: "/invoices", labelKey: "invoices", icon: FileText },
      { href: "/recurring", labelKey: "recurring", icon: Repeat },
    ],
  },
  {
    items: [
      { href: "/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

const accountingSection: NavSection = {
  titleKey: "accounting",
  items: [
    { href: "/transactions", labelKey: "transactions", icon: ArrowLeftRight },
    { href: "/expenses", labelKey: "expenses", icon: Receipt },
    { href: "/accounts", labelKey: "accounts", icon: Landmark },
    { href: "/reports", labelKey: "reports", icon: BarChart3 },
    { href: "/categories", labelKey: "categories", icon: Tags },
    { href: "/templates", labelKey: "templates", icon: FileStack },
  ],
};

const adminSection: NavSection = {
  titleKey: "admin",
  items: [
    { href: "/users", labelKey: "users", icon: Shield },
  ],
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const navSections = [...baseNavSections];
  if (user?.role === "admin") {
    navSections.splice(2, 0, accountingSection, adminSection);
  }

  function toggleLocale() {
    const next: Locale = locale === "en" ? "fr" : "en";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <aside className="print-hide flex w-60 flex-col border-r bg-card/50">
      <div className="flex items-center gap-2.5 px-6 py-5 border-b">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          I
        </div>
        <span className="text-lg font-semibold tracking-tight">Invoicer</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? "mt-4" : ""}>
            {section.titleKey && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t(section.titleKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t px-4 py-3">
        <button
          onClick={toggleLocale}
          disabled={isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors mb-2"
        >
          <Globe className="h-4 w-4" />
          {locale === "en" ? "Français" : "English"}
        </button>
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title={t("signOut")}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
