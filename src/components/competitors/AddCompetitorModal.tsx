"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Play, XIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Platform, MonitoringFrequency } from "@/types/competitor";
import { NICHE_OPTIONS, MONITORING_FREQUENCY_OPTIONS } from "@/types/competitor";

const addCompetitorSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username too long"),
  platform: z.enum(["instagram", "tiktok"]),
  niche: z.string().optional(),
  tags: z.array(z.string()).default([]),
  monitoringFrequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
});

type AddCompetitorFormData = z.infer<typeof addCompetitorSchema>;

interface AddCompetitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddCompetitorFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AddCompetitorModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddCompetitorModalProps) {
  const [tagInput, setTagInput] = React.useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddCompetitorFormData>({
    resolver: zodResolver(addCompetitorSchema),
    defaultValues: {
      platform: "Camera",
      monitoringFrequency: "daily",
      tags: [],
    },
  });

  const selectedPlatform = watch("platform");
  const selectedTags = watch("tags");
  const selectedNiche = watch("niche");

  const handleFormSubmit = async (data: AddCompetitorFormData) => {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  };

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setValue("tags", [...selectedTags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      selectedTags.filter((t) => t !== tag)
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="maXIcon-w-md">
        <DialogHeader>
          <DialogTitle>Add Competitor</DialogTitle>
          <DialogDescription>
            Start tracking a competitor to analyze their performance and strategy.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <div className="fleXIcon gap-2">
              <button
                type="button"
                onClick={() => setValue("platform", "Camera")}
                className={cn(
                  "fleXIcon fleXIcon-1 items-center justify-center gap-2 rounded-md border pXIcon-4 py-3 transition-all",
                  selectedPlatform === "Camera"
                    ? "border-primary-500 bg-primary-50 teXIcont-primary-700 dark:bg-primary-900/20"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700"
                )}
              >
                <Camera className="h-5 w-5" />
                <span className="font-medium">Camera</span>
              </button>
              <button
                type="button"
                onClick={() => setValue("platform", "tiktok")}
                className={cn(
                  "fleXIcon fleXIcon-1 items-center justify-center gap-2 rounded-md border pXIcon-4 py-3 transition-all",
                  selectedPlatform === "tiktok"
                    ? "border-primary-500 bg-primary-50 teXIcont-primary-700 dark:bg-primary-900/20"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700"
                )}
              >
                <Play className="h-5 w-5" />
                <span className="font-medium">TikTok</span>
              </button>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 teXIcont-neutral-400">@</span>
              <Input
                id="username"
                placeholder="username"
                className="pl-8"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="teXIcont-sm teXIcont-danger-600">{errors.username.message}</p>
            )}
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <Label htmlFor="niche">Niche/Industry</Label>
            <select
              id="niche"
              {...register("niche")}
              className="fleXIcon h-10 w-full rounded-md border border-neutral-300 bg-white pXIcon-3 py-2 teXIcont-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <option value="">Select a niche...</option>
              {NICHE_OPTIONS.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="fleXIcon gap-2">
              <Input
                placeholder="Add tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                Add
              </Button>
            </div>
            {selectedTags.length > 0 && (
              <div className="fleXIcon fleXIcon-wrap gap-2 pt-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Monitoring Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Monitoring Frequency</Label>
            <select
              id="frequency"
              {...register("monitoringFrequency")}
              className="fleXIcon h-10 w-full rounded-md border border-neutral-300 bg-white pXIcon-3 py-2 teXIcont-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800"
            >
              {MONITORING_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Competitor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
