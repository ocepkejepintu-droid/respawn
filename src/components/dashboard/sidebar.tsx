"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  ChevronLeft,
  ChevronRight,
  Target,
  Heart,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: "default" | "secondary" | "success" | "warning" | "danger";
  children?: NavItem[];
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onToggle?: () => void;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

const defaultNavItems: NavItem[] = [
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
    icon: Target,
  },
  {
    label: "Audience",
    href: "/audience",
    icon: Heart,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: Calendar,
  },
  {
    label: "Optimize",
    href: "/optimize",
    icon: BarChart3,
  },
];

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/signin",
    icon: Settings,
  },
  {
    label: "Help",
    href: "/",
    icon: HelpCircle,
  },
];

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, collapsed = false, onToggle, user, ...props }, ref) => {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

    const toggleExpanded = (href: string) => {
      setExpandedItems((prev) =>
        prev.includes(href)
          ? prev.filter((item) => item !== href)
          : [...prev, href]
      );
    };

    const isActive = (href: string) => {
      if (href === "/dashboard") {
        return pathname === href;
      }
      return pathname.startsWith(href);
    };

    const isExpanded = (href: string) => expandedItems.includes(href);

    const renderNavItem = (item: NavItem, isChild = false) => {
      const active = isActive(item.href);
      const hasChildren = item.children && item.children.length > 0;
      const expanded = isExpanded(item.href);

      const baseClasses = cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100",
        isChild && "ml-4"
      );

      if (collapsed && !isChild) {
        return (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={item.href} className={baseClasses}>
                <item.icon className="h-5 w-5 shrink-0" />
                {item.badge && (
                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.label}
              {item.badge && (
                <Badge variant={item.badgeVariant || "default"} className="ml-2">
                  {item.badge}
                </Badge>
              )}
            </TooltipContent>
          </Tooltip>
        );
      }

      return (
        <div key={item.href}>
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.href)}
              className={cn(baseClasses, "w-full justify-between")}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </div>
              <svg
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          ) : (
            <Link href={item.href} className={baseClasses}>
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || "default"}>
                  {item.badge}
                </Badge>
              )}
            </Link>
          )}
          {hasChildren && expanded && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => renderNavItem(child, true))}
            </div>
          )}
        </div>
      );
    };

    return (
      <TooltipProvider delayDuration={0}>
        <aside
          ref={ref}
          className={cn(
            "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-200 bg-sidebar transition-all duration-300 dark:border-[#24324a] dark:bg-[linear-gradient(180deg,_#111b2d_0%,_#101827_100%)]",
            collapsed ? "w-16" : "w-64",
            className
          )}
          {...props}
        >
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-neutral-200 px-4 dark:border-neutral-800">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
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
              {!collapsed && (
                <span className="whitespace-nowrap text-lg font-bold text-neutral-900 dark:text-white">
                  RESPAWN Analytics
                </span>
              )}
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {defaultNavItems.map((item) => renderNavItem(item))}
            </div>
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-neutral-200 px-3 py-4 dark:border-neutral-800">
            <div className="space-y-1">
              {bottomNavItems.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Collapse Toggle */}
          <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              className="w-full"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </aside>
      </TooltipProvider>
    );
  }
);
Sidebar.displayName = "Sidebar";

export { Sidebar, defaultNavItems, bottomNavItems };
export type { NavItem };
