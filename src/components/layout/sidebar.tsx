"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const baseNavSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Invoicing",
    items: [
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/services", label: "Services", icon: Briefcase },
      { href: "/invoices", label: "Invoices", icon: FileText },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const accountingSection: NavSection = {
  title: "Accounting",
  items: [
    { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/expenses", label: "Expenses", icon: Receipt },
    { href: "/accounts", label: "Accounts", icon: Landmark },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/categories", label: "Categories", icon: Tags },
    { href: "/templates", label: "Templates", icon: FileStack },
  ],
};

const adminSection: NavSection = {
  title: "Admin",
  items: [
    { href: "/users", label: "Users", icon: Shield },
  ],
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navSections = [...baseNavSections];
  if (user?.role === "admin") {
    // Insert Accounting and Admin before Settings
    navSections.splice(2, 0, accountingSection, adminSection);
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
            {section.title && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.title}
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
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t px-4 py-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
