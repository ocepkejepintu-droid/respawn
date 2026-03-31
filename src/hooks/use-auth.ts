"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// Custom hook for authentication operations
export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = status === "authenticated";
  const isLoadingSession = status === "loading";
  const user = session?.user;

  // Sign in with OAuth provider
  const login = useCallback(
    async (provider: "google" | "github" | "email", options?: { email?: string; callbackUrl?: string }) => {
      setIsLoading(true);
      try {
        const result = await signIn(provider, {
          email: options?.email,
          callbackUrl: options?.callbackUrl || "/dashboard",
          redirect: true,
        });
        return result;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Sign out
  const logout = useCallback(
    async (options?: { callbackUrl?: string }) => {
      setIsLoading(true);
      try {
        await signOut({
          callbackUrl: options?.callbackUrl || "/",
          redirect: true,
        });
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Switch active workspace
  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      setIsLoading(true);
      try {
        // Update session with new workspace
        await update({ currentWorkspaceId: workspaceId });
        router.refresh();
      } catch (error) {
        console.error("Workspace switch error:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [update, router]
  );

  // Check if user has required role
  const hasRole = useCallback(
    (requiredRoles: ("OWNER" | "ADMIN" | "MEMBER")[]) => {
      if (!user?.workspaceRole) return false;
      return requiredRoles.includes(user.workspaceRole);
    },
    [user?.workspaceRole]
  );

  // Check specific permissions
  const canManageWorkspace = user?.workspaceRole === "OWNER" || user?.workspaceRole === "ADMIN";
  const canManageBilling = user?.workspaceRole === "OWNER";
  const canInviteMembers = user?.workspaceRole === "OWNER" || user?.workspaceRole === "ADMIN";
  const canDeleteWorkspace = user?.workspaceRole === "OWNER";

  return {
    // Session state
    user,
    session,
    status,
    isAuthenticated,
    isLoading: isLoading || isLoadingSession,
    
    // Actions
    login,
    logout,
    switchWorkspace,
    refreshSession: update,
    
    // Workspace context
    currentWorkspaceId: user?.currentWorkspaceId,
    currentWorkspaceRole: user?.workspaceRole,
    workspaces: user?.workspaces,
    
    // Permissions
    hasRole,
    canManageWorkspace,
    canManageBilling,
    canInviteMembers,
    canDeleteWorkspace,
  };
}

// Hook for workspace-specific operations
export function useWorkspace() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const currentWorkspaceId = session?.user?.currentWorkspaceId;
  const currentWorkspaceRole = session?.user?.workspaceRole;
  const workspaces = session?.user?.workspaces || [];

  const currentWorkspace = workspaces.find(
    (w) => w.id === currentWorkspaceId
  );

  // Switch to a different workspace
  const setActiveWorkspace = useCallback(
    async (workspaceId: string) => {
      if (workspaceId === currentWorkspaceId) return;

      setIsLoading(true);
      try {
        // Verify user has access to this workspace
        const workspace = workspaces.find((w) => w.id === workspaceId);
        if (!workspace) {
          throw new Error("Workspace not found or access denied");
        }

        await update({ currentWorkspaceId: workspaceId });
        router.refresh();
      } catch (error) {
        console.error("Failed to switch workspace:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentWorkspaceId, workspaces, update, router]
  );

  // Create a new workspace (requires API call)
  const createWorkspace = useCallback(
    async (name: string, slug: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create workspace");
        }

        const newWorkspace = await response.json();
        
        // Switch to the new workspace
        await update({ currentWorkspaceId: newWorkspace.id });
        router.refresh();
        
        return newWorkspace;
      } catch (error) {
        console.error("Failed to create workspace:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [update, router]
  );

  // Check role permissions
  const isOwner = currentWorkspaceRole === "OWNER";
  const isAdmin = currentWorkspaceRole === "ADMIN" || currentWorkspaceRole === "OWNER";
  const isMember = !!currentWorkspaceRole;

  return {
    // Current workspace
    currentWorkspaceId,
    currentWorkspaceRole,
    currentWorkspace,
    workspaces,
    
    // Actions
    setActiveWorkspace,
    createWorkspace,
    isLoading,
    
    // Role checks
    isOwner,
    isAdmin,
    isMember,
    
    // Permission helpers
    can: {
      manageSettings: isAdmin,
      manageMembers: isAdmin,
      manageBilling: isOwner,
      deleteWorkspace: isOwner,
      inviteMembers: isAdmin,
      removeMembers: isAdmin,
    },
  };
}

// Hook for permission checks
export function usePermission() {
  const { data: session } = useSession();
  const role = session?.user?.workspaceRole;

  const checkPermission = useCallback(
    (requiredRole: "OWNER" | "ADMIN" | "MEMBER") => {
      if (!role) return false;
      
      const hierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
      return hierarchy[role] >= hierarchy[requiredRole];
    },
    [role]
  );

  const checkAnyPermission = useCallback(
    (requiredRoles: ("OWNER" | "ADMIN" | "MEMBER")[]) => {
      if (!role) return false;
      return requiredRoles.includes(role);
    },
    [role]
  );

  return {
    role,
    checkPermission,
    checkAnyPermission,
    isOwner: role === "OWNER",
    isAdmin: role === "ADMIN" || role === "OWNER",
    isMember: role === "MEMBER",
  };
}

// Hook for protected actions
export function useProtectedAction() {
  const { hasRole } = useAuth();
  const router = useRouter();

  const withPermission = useCallback(
    async <T,>(
      requiredRoles: ("OWNER" | "ADMIN" | "MEMBER")[],
      action: () => Promise<T>,
      onUnauthorized?: () => void
    ): Promise<T | null> => {
      if (!hasRole(requiredRoles)) {
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          router.push("/dashboard");
        }
        return null;
      }

      return action();
    },
    [hasRole, router]
  );

  return { withPermission };
}
