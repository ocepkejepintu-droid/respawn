"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  Inbox,
  Search,
  FileX,
  FolderOpen,
  AlertCircle,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact" | "card";
}

const iconMap: Record<string, LucideIcon> = {
  inbox: Inbox,
  search: Search,
  file: FileX,
  folder: FolderOpen,
  alert: AlertCircle,
  default: FileQuestion,
};

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon,
      title,
      description,
      action,
      secondaryAction,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const DefaultIcon = Icon || FileQuestion;

    const variantClasses = {
      default: "py-16",
      compact: "py-8",
      card: "rounded-lg border border-neutral-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900",
    };

    const iconSizes = {
      default: "h-16 w-16",
      compact: "h-12 w-12",
      card: "h-12 w-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "mb-4 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800",
            variant === "default" ? "h-24 w-24" : "h-16 w-16"
          )}
        >
          <DefaultIcon
            className={cn(
              "text-neutral-400 dark:text-neutral-500",
              iconSizes[variant]
            )}
          />
        </div>
        <h3
          className={cn(
            "font-semibold text-neutral-900 dark:text-white",
            variant === "default" ? "text-xl" : "text-lg"
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              "mt-2 max-w-sm text-neutral-500 dark:text-neutral-400",
              variant === "default" ? "text-base" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="mt-6 flex items-center gap-3">
            {action && (
              <Button
                variant={action.variant || "primary"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="ghost" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

// Pre-configured empty states for common scenarios
interface EmptySearchProps extends Omit<EmptyStateProps, "icon"> {
  searchTerm?: string;
}

const EmptySearch = React.forwardRef<HTMLDivElement, EmptySearchProps>(
  ({ searchTerm, title, description, ...props }, ref) => (
    <EmptyState
      ref={ref}
      icon={Search}
      title={title || `No results for "${searchTerm}"`}
      description={
        description ||
        "Try adjusting your search terms or filters to find what you're looking for."
      }
      {...props}
    />
  )
);
EmptySearch.displayName = "EmptySearch";

interface EmptyInboxProps extends Omit<EmptyStateProps, "icon"> {}

const EmptyInbox = React.forwardRef<HTMLDivElement, EmptyInboxProps>(
  ({ title, description, ...props }, ref) => (
    <EmptyState
      ref={ref}
      icon={Inbox}
      title={title || "All caught up!"}
      description={
        description ||
        "You have no new notifications or messages at the moment."
      }
      {...props}
    />
  )
);
EmptyInbox.displayName = "EmptyInbox";

interface EmptyFolderProps extends Omit<EmptyStateProps, "icon"> {}

const EmptyFolder = React.forwardRef<HTMLDivElement, EmptyFolderProps>(
  ({ title, description, ...props }, ref) => (
    <EmptyState
      ref={ref}
      icon={FolderOpen}
      title={title || "Nothing here yet"}
      description={
        description ||
        "This folder is empty. Create your first item to get started."
      }
      {...props}
    />
  )
);
EmptyFolder.displayName = "EmptyFolder";

interface EmptyErrorProps extends Omit<EmptyStateProps, "icon"> {
  error?: string;
}

const EmptyError = React.forwardRef<HTMLDivElement, EmptyErrorProps>(
  ({ title, description, error, ...props }, ref) => (
    <EmptyState
      ref={ref}
      icon={AlertCircle}
      title={title || "Something went wrong"}
      description={
        description ||
        error ||
        "We encountered an error while loading this content. Please try again."
      }
      {...props}
    />
  )
);
EmptyError.displayName = "EmptyError";

export {
  EmptyState,
  EmptySearch,
  EmptyInbox,
  EmptyFolder,
  EmptyError,
  iconMap,
};
