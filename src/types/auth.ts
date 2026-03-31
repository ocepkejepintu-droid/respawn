import { WorkspaceRole } from "@prisma/client";

// Extended user type with workspace context
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  currentWorkspaceId?: string;
  workspaceRole?: WorkspaceRole;
  workspaces?: WorkspaceInfo[];
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

// Session with extended user
export interface AuthSession {
  user: AuthUser;
  expires: string;
}

// JWT token with workspace context
export interface AuthToken {
  id: string;
  email: string;
  name: string;
  picture?: string;
  currentWorkspaceId?: string;
  workspaceRole?: WorkspaceRole;
  workspaces?: WorkspaceInfo[];
}

// Permission levels for role-based access
export const PERMISSION_HIERARCHY = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
} as const;

// Permission check helper
export function hasPermission(
  userRole: WorkspaceRole | undefined,
  requiredRole: WorkspaceRole
): boolean {
  if (!userRole) return false;
  return PERMISSION_HIERARCHY[userRole] >= PERMISSION_HIERARCHY[requiredRole];
}

// Check if user has any of the required roles
export function hasAnyPermission(
  userRole: WorkspaceRole | undefined,
  requiredRoles: WorkspaceRole[]
): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Role labels for display
export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  OWNER: "Full control over the workspace including billing and deletion",
  ADMIN: "Can manage members and settings but cannot delete workspace",
  MEMBER: "Can use workspace features but cannot manage settings",
};

// Permission matrix for features
export const PERMISSION_MATRIX = {
  viewWorkspace: ["OWNER", "ADMIN", "MEMBER"],
  manageSettings: ["OWNER", "ADMIN"],
  manageMembers: ["OWNER", "ADMIN"],
  inviteMembers: ["OWNER", "ADMIN"],
  removeMembers: ["OWNER", "ADMIN"],
  manageBilling: ["OWNER"],
  deleteWorkspace: ["OWNER"],
  transferOwnership: ["OWNER"],
  viewAnalytics: ["OWNER", "ADMIN"],
  exportData: ["OWNER", "ADMIN"],
} as const;

// Type for permission keys
export type PermissionKey = keyof typeof PERMISSION_MATRIX;

// Check if user has permission for a specific feature
export function hasFeaturePermission(
  userRole: WorkspaceRole | undefined,
  feature: PermissionKey
): boolean {
  if (!userRole) return false;
  const allowedRoles = PERMISSION_MATRIX[feature];
  return allowedRoles.includes(userRole as WorkspaceRole);
}
