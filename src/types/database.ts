// ============================================
// DATABASE TYPES - Re-exported from Prisma Client
// ============================================

import type {
  User as PrismaUser,
  Workspace as PrismaWorkspace,
  WorkspaceMember as PrismaWorkspaceMember,
  Subscription as PrismaSubscription,
  Competitor as PrismaCompetitor,
  HashtagTrack as PrismaHashtagTrack,
  ScrapedPost as PrismaScrapedPost,
  AnalysisReport as PrismaAnalysisReport,
  UsageLog as PrismaUsageLog,
  AuditLog as PrismaAuditLog,
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
  Platform,
  AnalysisType,
  ReportStatus,
} from '@prisma/client'

// ============================================
// BASE MODEL TYPES
// ============================================

export type User = PrismaUser
export type Workspace = PrismaWorkspace
export type WorkspaceMember = PrismaWorkspaceMember
export type Subscription = PrismaSubscription
export type Competitor = PrismaCompetitor
export type HashtagTrack = PrismaHashtagTrack
export type ScrapedPost = PrismaScrapedPost
export type AnalysisReport = PrismaAnalysisReport
export type UsageLog = PrismaUsageLog
export type AuditLog = PrismaAuditLog

// ============================================
// ENUM TYPES
// ============================================

export { UserRole, SubscriptionTier, SubscriptionStatus, Platform, AnalysisType, ReportStatus }

// ============================================
// HELPER TYPE: MODEL WITH RELATIONS
// ============================================

export type UserWithWorkspaces = User & {
  memberships: (WorkspaceMember & {
    workspace: Workspace
  })[]
}

export type WorkspaceWithMembers = Workspace & {
  owner: User
  members: (WorkspaceMember & {
    user: User
  })[]
}

export type WorkspaceFull = Workspace & {
  owner: User
  members: (WorkspaceMember & {
    user: User
  })[]
  subscription: Subscription | null
  competitors: Competitor[]
  hashtagTracks: HashtagTrack[]
}

export type CompetitorWithPosts = Competitor & {
  scrapedPosts: ScrapedPost[]
}

export type ScrapedPostWithCompetitor = ScrapedPost & {
  competitor: Competitor | null
}

export type AnalysisReportWithCreator = AnalysisReport & {
  createdBy: User
}

// ============================================
// USAGE QUOTA TYPES
// ============================================

export interface UsageQuotas {
  maxCompetitors: number
  maxHashtagTracks: number
  maxScrapedPosts: number
  maxAnalysisReports: number
  maxTeamMembers: number
}

export interface UsageCounts {
  usedCompetitorSlots: number
  usedHashtagTracks: number
  usedScrapedPosts: number
  usedAnalysisReports: number
}

export interface UsageStatus extends UsageQuotas, UsageCounts {
  remainingCompetitors: number
  remainingHashtagTracks: number
  remainingScrapedPosts: number
  remainingAnalysisReports: number
  isAtLimit: boolean
}

// ============================================
// TIER CONFIGURATION
// ============================================

export const TIER_CONFIG: Record<SubscriptionTier, UsageQuotas> = {
  [SubscriptionTier.FREE]: {
    maxCompetitors: 3,
    maxHashtagTracks: 5,
    maxScrapedPosts: 1000,
    maxAnalysisReports: 5,
    maxTeamMembers: 1,
  },
  [SubscriptionTier.PRO]: {
    maxCompetitors: 10,
    maxHashtagTracks: 20,
    maxScrapedPosts: 10000,
    maxAnalysisReports: 50,
    maxTeamMembers: 5,
  },
  [SubscriptionTier.AGENCY]: {
    maxCompetitors: 50,
    maxHashtagTracks: 100,
    maxScrapedPosts: 100000,
    maxAnalysisReports: 500,
    maxTeamMembers: 20,
  },
}

// ============================================
// ROLE PERMISSIONS
// ============================================

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.OWNER]: [
    'workspace:read',
    'workspace:update',
    'workspace:delete',
    'member:read',
    'member:create',
    'member:update',
    'member:delete',
    'subscription:read',
    'subscription:update',
    'competitor:read',
    'competitor:create',
    'competitor:update',
    'competitor:delete',
    'hashtag:read',
    'hashtag:create',
    'hashtag:update',
    'hashtag:delete',
    'report:read',
    'report:create',
    'report:delete',
    'settings:read',
    'settings:update',
  ],
  [UserRole.ADMIN]: [
    'workspace:read',
    'workspace:update',
    'member:read',
    'member:create',
    'member:update',
    'subscription:read',
    'competitor:read',
    'competitor:create',
    'competitor:update',
    'competitor:delete',
    'hashtag:read',
    'hashtag:create',
    'hashtag:update',
    'hashtag:delete',
    'report:read',
    'report:create',
    'report:delete',
    'settings:read',
    'settings:update',
  ],
  [UserRole.MEMBER]: [
    'workspace:read',
    'member:read',
    'subscription:read',
    'competitor:read',
    'hashtag:read',
    'report:read',
    'report:create',
    'settings:read',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

// ============================================
// DASHBOARD STATS TYPES
// ============================================

export interface DashboardStats {
  totalCompetitors: number
  totalHashtagTracks: number
  totalScrapedPosts: number
  totalAnalysisReports: number
  recentPosts: ScrapedPost[]
  topPerformingPosts: ScrapedPost[]
  recentReports: AnalysisReport[]
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}
