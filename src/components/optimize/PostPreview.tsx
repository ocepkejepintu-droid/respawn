"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostPreview as PostPreviewType, ContentType, PlatformType } from "@/types/optimize";
import { 
  Smartphone,
  Monitor,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Send,
  Play,
  Volume2,
  VolumeX
} from "lucide-react";

interface PostPreviewProps {
  preview: PostPreviewType;
  className?: string;
  onDeviceChange?: (device: "mobile" | "desktop") => void;
}

export function PostPreview({
  preview,
  className,
  onDeviceChange,
}: PostPreviewProps) {
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handleDeviceChange = (newDevice: "mobile" | "desktop") => {
    setDevice(newDevice);
    onDeviceChange?.(newDevice);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const timeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary-500" />
              Post Preview
            </CardTitle>
            <CardDescription>
              See how your post will look when published
            </CardDescription>
          </div>
          <div className="flex rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
            <button
              onClick={() => handleDeviceChange("mobile")}
              className={cn(
                "rounded px-3 py-1 text-sm transition-colors",
                device === "mobile"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeviceChange("desktop")}
              className={cn(
                "rounded px-3 py-1 text-sm transition-colors",
                device === "desktop"
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex justify-center">
          {device === "mobile" ? (
            <MobilePreview
              preview={preview}
              liked={liked}
              saved={saved}
              isMuted={isMuted}
              onLikeToggle={() => setLiked(!liked)}
              onSaveToggle={() => setSaved(!saved)}
              onMuteToggle={() => setIsMuted(!isMuted)}
              formatNumber={formatNumber}
              timeAgo={timeAgo}
            />
          ) : (
            <DesktopPreview
              preview={preview}
              liked={liked}
              saved={saved}
              onLikeToggle={() => setLiked(!liked)}
              onSaveToggle={() => setSaved(!saved)}
              formatNumber={formatNumber}
              timeAgo={timeAgo}
            />
          )}
        </div>

        {/* Preview Info */}
        <div className="mt-6 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
            Preview Details
          </h4>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Platform:</span>
              <span className="ml-2 capitalize text-neutral-900 dark:text-white">
                {preview.platform}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Content Type:</span>
              <span className="ml-2 capitalize text-neutral-900 dark:text-white">
                {preview.contentType.replace("_", " ")}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Aspect Ratio:</span>
              <span className="ml-2 text-neutral-900 dark:text-white">
                {preview.media[0]?.aspectRatio || "1:1"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Caption Length:</span>
              <span className="ml-2 text-neutral-900 dark:text-white">
                {preview.caption.length} characters
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobilePreview({
  preview,
  liked,
  saved,
  isMuted,
  onLikeToggle,
  onSaveToggle,
  onMuteToggle,
  formatNumber,
  timeAgo,
}: {
  preview: PostPreviewType;
  liked: boolean;
  saved: boolean;
  isMuted: boolean;
  onLikeToggle: () => void;
  onSaveToggle: () => void;
  onMuteToggle: () => void;
  formatNumber: (num: number) => string;
  timeAgo: (date: Date) => string;
}) {
  const isVideo = preview.contentType === "reel" || preview.contentType === "video";
  const isStory = preview.contentType === "story";

  if (isStory) {
    return (
      <div className="relative h-[500px] w-[280px] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl">
        {/* Story Header */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 p-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-neutral-800" />
          </div>
          <span className="text-sm font-medium text-white">{preview.username}</span>
          <span className="text-xs text-neutral-400">{timeAgo(preview.postedAt)}</span>
        </div>

        {/* Story Content */}
        <div className="h-full w-full bg-gradient-to-b from-neutral-700 to-neutral-800" />

        {/* Story Progress */}
        <div className="absolute left-3 right-3 top-2 flex gap-1">
          <div className="h-0.5 flex-1 bg-white" />
          <div className="h-0.5 flex-1 bg-white/30" />
          <div className="h-0.5 flex-1 bg-white/30" />
        </div>

        {/* Story Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-full bg-white/20 px-4 py-2 backdrop-blur">
              <span className="text-sm text-white">Send message</span>
            </div>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Heart className="h-5 w-5 text-white" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <Send className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-white">
              {preview.username}
            </div>
            {preview.location && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {preview.location}
              </div>
            )}
          </div>
        </div>
        <button className="p-1">
          <MoreHorizontal className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {/* Media */}
      <div className={cn("relative bg-neutral-100 dark:bg-neutral-800", isVideo ? "aspect-[9/16]" : "aspect-square")}>
        {isVideo && (
          <button
            onClick={onMuteToggle}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 backdrop-blur"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </button>
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur">
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onLikeToggle}>
              <Heart
                className={cn("h-6 w-6 transition-colors", liked ? "fill-danger-500 text-danger-500" : "text-neutral-800 dark:text-neutral-200")}
              />
            </button>
            <button>
              <MessageCircle className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
            </button>
            <button>
              <Send className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
            </button>
          </div>
          <button onClick={onSaveToggle}>
            <Bookmark
              className={cn("h-6 w-6 transition-colors", saved ? "fill-neutral-800 text-neutral-800 dark:fill-white dark:text-white" : "text-neutral-800 dark:text-neutral-200")}
            />
          </button>
        </div>

        {/* Likes */}
        <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
          {formatNumber(liked ? preview.likes + 1 : preview.likes)} likes
        </div>

        {/* Caption */}
        <div className="mt-1">
          <p className="text-sm text-neutral-800 dark:text-neutral-200">
            <span className="font-semibold">{preview.username}</span>{" "}
            {preview.caption.length > 100 ? preview.caption.slice(0, 100) + "..." : preview.caption}
          </p>
          {preview.caption.length > 100 && (
            <button className="text-sm text-neutral-500 dark:text-neutral-400">
              more
            </button>
          )}
        </div>

        {/* Hashtags */}
        {preview.hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {preview.hashtags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-sm text-primary-600 dark:text-primary-400">
                #{tag}
              </span>
            ))}
            {preview.hashtags.length > 3 && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                +{preview.hashtags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Comments */}
        <button className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          View all {preview.comments} comments
        </button>

        {/* Time */}
        <div className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 uppercase">
          {timeAgo(preview.postedAt)}
        </div>
      </div>
    </div>
  );
}

function DesktopPreview({
  preview,
  liked,
  saved,
  onLikeToggle,
  onSaveToggle,
  formatNumber,
  timeAgo,
}: {
  preview: PostPreviewType;
  liked: boolean;
  saved: boolean;
  onLikeToggle: () => void;
  onSaveToggle: () => void;
  formatNumber: (num: number) => string;
  timeAgo: (date: Date) => string;
}) {
  return (
    <div className="flex w-[600px] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      {/* Media Side */}
      <div className="flex w-[350px] items-center justify-center bg-neutral-900">
        <div className="aspect-square w-full bg-gradient-to-br from-neutral-700 to-neutral-800" />
      </div>

      {/* Content Side */}
      <div className="flex w-[250px] flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-neutral-200 p-3 dark:border-neutral-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-500 p-[2px]">
            <div className="h-full w-full rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <span className="text-sm font-semibold text-neutral-900 dark:text-white">
            {preview.username}
          </span>
        </div>

        {/* Comments Area */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-sm text-neutral-800 dark:text-neutral-200">
            <span className="font-semibold">{preview.username}</span>{" "}
            {preview.caption}
          </p>
          {preview.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {preview.hashtags.map((tag) => (
                <span key={tag} className="text-sm text-primary-600 dark:text-primary-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            {timeAgo(preview.postedAt)}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onLikeToggle}>
                <Heart
                  className={cn("h-6 w-6 transition-colors", liked ? "fill-danger-500 text-danger-500" : "text-neutral-800 dark:text-neutral-200")}
                />
              </button>
              <button>
                <MessageCircle className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
              </button>
              <button>
                <Send className="h-6 w-6 text-neutral-800 dark:text-neutral-200" />
              </button>
            </div>
            <button onClick={onSaveToggle}>
              <Bookmark
                className={cn("h-6 w-6 transition-colors", saved ? "fill-neutral-800 text-neutral-800 dark:fill-white dark:text-white" : "text-neutral-800 dark:text-neutral-200")}
              />
            </button>
          </div>

          <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
            {formatNumber(liked ? preview.likes + 1 : preview.likes)} likes
          </div>

          <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            View all {preview.comments} comments
          </div>
        </div>
      </div>
    </div>
  );
}
