-- CreateTable
CREATE TABLE "owned_social_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "display_name" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "post_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" DATETIME,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    CONSTRAINT "owned_social_accounts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "owned_content_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform_post_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "post_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "hook" TEXT,
    "topic" TEXT,
    "visual_format" TEXT,
    "edit_style" TEXT,
    "caption_type" TEXT,
    "cta_type" TEXT,
    "published_at" DATETIME NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" REAL,
    "engagement_efficiency" REAL,
    "repeatability_score" REAL,
    "conversion_intent_score" REAL,
    "retention_proxy_score" REAL,
    "checkpoint_metrics" JSONB,
    "hashtags" JSONB NOT NULL,
    "mentions" JSONB NOT NULL,
    "keywords" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owned_account_id" TEXT NOT NULL,
    CONSTRAINT "owned_content_snapshots_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "owned_content_snapshots_owned_account_id_fkey" FOREIGN KEY ("owned_account_id") REFERENCES "owned_social_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "owned_content_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform_comment_id" TEXT,
    "platform" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author_handle" TEXT,
    "posted_at" DATETIME NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "sentiment" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "intent_label" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "owned_account_id" TEXT NOT NULL,
    "content_snapshot_id" TEXT NOT NULL,
    CONSTRAINT "owned_content_comments_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "owned_content_comments_owned_account_id_fkey" FOREIGN KEY ("owned_account_id") REFERENCES "owned_social_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "owned_content_comments_content_snapshot_id_fkey" FOREIGN KEY ("content_snapshot_id") REFERENCES "owned_content_snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "owned_social_accounts_workspace_id_idx" ON "owned_social_accounts"("workspace_id");

-- CreateIndex
CREATE INDEX "owned_social_accounts_platform_idx" ON "owned_social_accounts"("platform");

-- CreateIndex
CREATE INDEX "owned_social_accounts_last_synced_at_idx" ON "owned_social_accounts"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "owned_social_accounts_workspace_id_platform_handle_key" ON "owned_social_accounts"("workspace_id", "platform", "handle");

-- CreateIndex
CREATE INDEX "owned_content_snapshots_workspace_id_idx" ON "owned_content_snapshots"("workspace_id");

-- CreateIndex
CREATE INDEX "owned_content_snapshots_owned_account_id_idx" ON "owned_content_snapshots"("owned_account_id");

-- CreateIndex
CREATE INDEX "owned_content_snapshots_platform_idx" ON "owned_content_snapshots"("platform");

-- CreateIndex
CREATE INDEX "owned_content_snapshots_published_at_idx" ON "owned_content_snapshots"("published_at");

-- CreateIndex
CREATE INDEX "owned_content_snapshots_engagement_rate_idx" ON "owned_content_snapshots"("engagement_rate");

-- CreateIndex
CREATE UNIQUE INDEX "owned_content_snapshots_workspace_id_platform_platform_post_id_key" ON "owned_content_snapshots"("workspace_id", "platform", "platform_post_id");

-- CreateIndex
CREATE INDEX "owned_content_comments_workspace_id_idx" ON "owned_content_comments"("workspace_id");

-- CreateIndex
CREATE INDEX "owned_content_comments_owned_account_id_idx" ON "owned_content_comments"("owned_account_id");

-- CreateIndex
CREATE INDEX "owned_content_comments_content_snapshot_id_idx" ON "owned_content_comments"("content_snapshot_id");

-- CreateIndex
CREATE INDEX "owned_content_comments_platform_idx" ON "owned_content_comments"("platform");

-- CreateIndex
CREATE INDEX "owned_content_comments_posted_at_idx" ON "owned_content_comments"("posted_at");
