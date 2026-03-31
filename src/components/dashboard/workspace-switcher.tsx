"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Plus, Building2 } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  logo?: string;
  plan?: string;
}

interface WorkspaceSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  workspaces: Workspace[];
  currentWorkspace?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
  onCreateWorkspace?: () => void;
}

const WorkspaceSwitcher = React.forwardRef<HTMLDivElement, WorkspaceSwitcherProps>(
  (
    {
      className,
      workspaces,
      currentWorkspace,
      onWorkspaceChange,
      onCreateWorkspace,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const currentWorkspaceData = workspaces.find(
      (w) => w.id === currentWorkspace
    );

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (workspaceId: string) => {
      onWorkspaceChange?.(workspaceId);
      setIsOpen(false);
    };

    const getInitials = (name: string) => {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {currentWorkspaceData?.logo ? (
              <img
                src={currentWorkspaceData.logo}
                alt={currentWorkspaceData.name}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">
              {currentWorkspaceData?.name || "Select Workspace"}
            </p>
            {currentWorkspaceData?.plan && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {currentWorkspaceData.plan}
              </p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-neutral-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="px-3 py-2">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Workspaces
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
                    currentWorkspace === workspace.id
                      ? "bg-primary-50 dark:bg-primary-900/20"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    {workspace.logo ? (
                      <img
                        src={workspace.logo}
                        alt={workspace.name}
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      getInitials(workspace.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {workspace.name}
                    </p>
                    {workspace.plan && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {workspace.plan}
                      </p>
                    )}
                  </div>
                  {currentWorkspace === workspace.id && (
                    <Check className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
            {onCreateWorkspace && (
              <>
                <div className="my-1 border-t border-neutral-200 dark:border-neutral-800" />
                <button
                  onClick={() => {
                    onCreateWorkspace();
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">Create workspace</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);
WorkspaceSwitcher.displayName = "WorkspaceSwitcher";

export { WorkspaceSwitcher };
export type { Workspace };
