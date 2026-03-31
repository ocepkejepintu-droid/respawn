"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  X,
  LogOut,
  User,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "success" | "warning" | "danger";
}

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const mainNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Briefing",
    href: "/briefing",
    icon: Bell,
  },
  {
    label: "Competitors",
    href: "/competitors",
    icon: Users,
  },
  {
    label: "Audience",
    href: "/audience",
    icon: BarChart3,
  },
  {
    label: "Optimize",
    href: "/optimize",
    icon: Calendar,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: FileText,
  },
];

const secondaryNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/signin",
    icon: Settings,
  },
  {
    label: "Help & Support",
    href: "/",
    icon: HelpCircle,
  },
];

const MobileNav = React.forwardRef<HTMLDivElement, MobileNavProps>(
  ({ className, isOpen, onClose, user, ...props }, ref) => {
    const pathname = usePathname();

    const isActive = (href: string) => {
      if (href === "/dashboard") {
        return pathname === href;
      }
      return pathname.startsWith(href);
    };

    // Lock body scroll when menu is open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          ref={ref}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden dark:bg-neutral-900",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              onClick={onClose}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-neutral-900 dark:text-white">
                RESPAWN Analytics
              </span>
            </Link>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="h-[calc(100vh-4rem)] overflow-y-auto">
            {/* User Info */}
            {user && (
              <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar} fallback={user.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-neutral-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <nav className="p-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Menu
              </p>
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge
                            variant={item.badgeVariant || "default"}
                            className="text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                        {active && (
                          <ChevronRight className="h-4 w-4 text-primary-600" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Secondary Navigation */}
            <nav className="border-t border-neutral-200 p-4 dark:border-neutral-800">
              <div className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant || "default"}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* User Actions */}
            <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
              <div className="space-y-1">
                <Link
                  href="/dashboard/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    // Handle logout
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);
MobileNav.displayName = "MobileNav";

export { MobileNav };
