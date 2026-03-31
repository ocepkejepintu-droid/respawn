"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { NotificationBell } from "./notification-bell";
import { WorkspaceSwitcher } from "./workspace-switcher";
import {
  Search,
  Menu,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from "lucide-react";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  onMenuClick?: () => void;
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
  onNotificationClick?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      onMenuClick,
      user,
      workspaces,
      currentWorkspace,
      onWorkspaceChange,
      notifications,
      onNotificationClick,
      onMarkAllRead,
      onThemeToggle,
      isDarkMode = false,
      ...props
    },
    ref
  ) => {
    const [userMenuOpen, setUserMenuOpen] = React.useState(false);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    // Close user menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          userMenuRef.current &&
          !userMenuRef.current.contains(event.target as Node)
        ) {
          setUserMenuOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <header
        ref={ref}
        className={cn(
          "fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-md dark:border-[#24324a] dark:bg-[#101a2be6] lg:left-64",
          className
        )}
        {...props}
      >
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar */}
          <div className="hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-64 rounded-xl border border-neutral-300 bg-white/80 pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-[#425574] dark:bg-[#18253bcc] dark:text-white dark:placeholder:text-[#8ea1bd]"
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Workspace Switcher */}
          {workspaces && workspaces.length > 0 && (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onWorkspaceChange={onWorkspaceChange}
            />
          )}

          {/* Theme Toggle */}
          {onThemeToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
              className="hidden sm:flex"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Notifications */}
          <NotificationBell
            notifications={notifications}
            onNotificationClick={onNotificationClick}
            onMarkAllRead={onMarkAllRead}
          />

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Avatar
                src={user?.avatar}
                fallback={user?.name || "U"}
                size="sm"
              />
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.email || "user@example.com"}
                </p>
              </div>
              <svg
                className={cn(
                  "hidden h-4 w-4 text-neutral-400 transition-transform md:block",
                  userMenuOpen && "rotate-180"
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

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 md:hidden">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/help"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help & Support
                </Link>
                <div className="my-1 border-t border-neutral-200 dark:border-neutral-800" />
                <button
                  onClick={() => {
                    // Handle logout
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);
Header.displayName = "Header";

export { Header };
