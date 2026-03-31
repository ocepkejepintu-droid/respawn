"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  workspaces?: Array<{
    id: string;
    name: string;
    logo?: string;
    plan?: string;
  }>;
  currentWorkspace?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    read?: boolean;
    timestamp: Date;
    action?: {
      label: string;
      href: string;
    };
  }>;
}

const DashboardShell = React.forwardRef<HTMLDivElement, DashboardShellProps>(
  (
    {
      className,
      children,
      user,
      workspaces,
      currentWorkspace,
      onWorkspaceChange,
      notifications,
      ...props
    },
    ref
  ) => {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    // Check for dark mode preference
    React.useEffect(() => {
      const syncTheme = () => {
        const isDark = document.documentElement.classList.contains("dark");
        setIsDarkMode(isDark);
      };

      syncTheme();
      window.addEventListener("storage", syncTheme);

      return () => window.removeEventListener("storage", syncTheme);
    }, []);

    const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      document.documentElement.classList.toggle("dark", newMode);
      document.documentElement.dataset.theme = newMode ? "dark" : "light";
      window.localStorage.setItem("real-buzzer-theme", newMode ? "dark" : "light");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen bg-neutral-50 dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_22%),linear-gradient(180deg,_#0b1220_0%,_#0f1727_52%,_#132033_100%)]",
          className
        )}
        {...props}
      >
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            user={user}
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
        />

        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          user={user}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onWorkspaceChange={onWorkspaceChange}
          notifications={notifications}
          onThemeToggle={toggleTheme}
          isDarkMode={isDarkMode}
        />

        {/* Main Content */}
        <main
          className={cn(
            "pt-16 transition-all duration-300",
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <div className="p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">{children}</div>
          </div>
        </main>
      </div>
    );
  }
);
DashboardShell.displayName = "DashboardShell";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, breadcrumbs, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("mb-8", className)}
        {...props}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <svg
                      className="h-4 w-4 text-neutral-300 dark:text-neutral-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="hover:text-neutral-900 dark:hover:text-white"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-neutral-900 dark:text-white">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const PageContent = React.forwardRef<HTMLDivElement, PageContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PageContent.displayName = "PageContent";

export { DashboardShell, PageHeader, PageContent };
