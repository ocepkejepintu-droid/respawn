"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: "OWNER" | "ADMIN" | "MEMBER";
  requiredRoles?: ("OWNER" | "ADMIN" | "MEMBER")[];
  redirectTo?: string;
  requireWorkspace?: boolean;
}

export function AuthGuard({
  children,
  fallback,
  requiredRole,
  requiredRoles = [],
  redirectTo = "/signin",
  requireWorkspace = true,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Build roles array
  const roles = requiredRole ? [requiredRole, ...requiredRoles] : requiredRoles;

  useEffect(() => {
    if (status === "loading") return;

    // Not authenticated
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`${redirectTo}?callbackUrl=${callbackUrl}`);
      return;
    }

    // Check workspace requirement
    if (requireWorkspace && !session?.user?.currentWorkspaceId) {
      router.push("/onboarding");
      return;
    }

    // Check role requirement
    if (roles.length > 0 && session?.user?.workspaceRole) {
      if (!roles.includes(session.user.workspaceRole)) {
        router.push("/dashboard");
        return;
      }
    }
  }, [status, session, router, pathname, redirectTo, requireWorkspace, roles]);

  // Show loading state
  if (status === "loading") {
    return (
      fallback || (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated or doesn't meet requirements - don't render children
  if (status === "unauthenticated") {
    return null;
  }

  if (requireWorkspace && !session?.user?.currentWorkspaceId) {
    return null;
  }

  if (roles.length > 0 && session?.user?.workspaceRole) {
    if (!roles.includes(session.user.workspaceRole)) {
      return null;
    }
  }

  return <>{children}</>;
}

// Client-side only auth check (no redirect)
interface UseAuthCheckProps {
  requiredRole?: "OWNER" | "ADMIN" | "MEMBER";
  requiredRoles?: ("OWNER" | "ADMIN" | "MEMBER")[];
  requireWorkspace?: boolean;
}

export function useAuthCheck({
  requiredRole,
  requiredRoles = [],
  requireWorkspace = true,
}: UseAuthCheckProps = {}) {
  const { data: session, status } = useSession();
  
  const roles = requiredRole ? [requiredRole, ...requiredRoles] : requiredRoles;
  
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  
  const hasWorkspace = !requireWorkspace || !!session?.user?.currentWorkspaceId;
  
  const hasRequiredRole = 
    roles.length === 0 || 
    (session?.user?.workspaceRole && roles.includes(session.user.workspaceRole));
  
  const isAllowed = isAuthenticated && hasWorkspace && hasRequiredRole;
  
  return {
    isLoading,
    isAuthenticated,
    hasWorkspace,
    hasRequiredRole,
    isAllowed,
    user: session?.user,
    session,
  };
}

// Permission-based component rendering
interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  permission: "OWNER" | "ADMIN" | "MEMBER" | ("OWNER" | "ADMIN" | "MEMBER")[];
}

export function PermissionGuard({
  children,
  fallback = null,
  permission,
}: PermissionGuardProps) {
  const { data: session } = useSession();
  
  const allowedRoles = Array.isArray(permission) ? permission : [permission];
  const userRole = session?.user?.workspaceRole;
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Workspace switcher guard
interface WorkspaceGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WorkspaceGuard({ children, fallback }: WorkspaceGuardProps) {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return (
      fallback || (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )
    );
  }
  
  if (!session?.user?.currentWorkspaceId) {
    return (
      fallback || (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </div>
      )
    );
  }
  
  return <>{children}</>;
}
