"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CaptionSuggestion } from "@/types/optimize";
import { 
  Type, 
  Hash, 
  Clock, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  Wand2
} from "lucide-react";

interface CaptionOptimizerProps {
  initialCaption?: string;
  initialHashtags?: string[];
  className?: string;
  onCaptionChange?: (caption: string) => void;
  onHashtagsChange?: (hashtags: string[]) => void;
  suggestions?: CaptionSuggestion;
  onGenerateSuggestions?: () => void;
  loading?: boolean;
}

const OPTIMAL_LENGTH = { min: 150, max: 300 };
const OPTIMAL_HASHTAGS = { min: 20, max: 30 };

export function CaptionOptimizer({
  initialCaption = "",
  initialHashtags = [],
  className,
  onCaptionChange,
  onHashtagsChange,
  suggestions,
  onGenerateSuggestions,
  loading = false,
}: CaptionOptimizerProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [hashtags, setHashtags] = useState(initialHashtags.join(" "));
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [copied, setCopied] = useState(false);

  const handleCaptionChange = useCallback((value: string) => {
    setCaption(value);
    onCaptionChange?.(value);
  }, [onCaptionChange]);

  const handleHashtagsChange = useCallback((value: string) => {
    setHashtags(value);
    const tags = value.split(/\s+/).filter(tag => tag.startsWith("#") || tag.length > 0);
    onHashtagsChange?.(tags.map(tag => tag.replace(/^#/, "")));
  }, [onHashtagsChange]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`${caption}\n\n${hashtags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [caption, hashtags]);

  const applySuggestion = (suggestedCaption: string) => {
    handleCaptionChange(suggestedCaption);
    setActiveTab("edit");
  };

  // Analysis
  const captionLength = caption.length;
  const hashtagsArray = hashtags.split(/\s+/).filter(h => h.trim());
  const hashtagCount = hashtagsArray.length;
  
  const captionScore = Math.min(100, Math.round((captionLength / OPTIMAL_LENGTH.max) * 100));
  const hashtagScore = Math.min(100, Math.round((hashtagCount / OPTIMAL_HASHTAGS.max) * 100));
  
  const hasCTA = /comment|share|save|like|tag|let me know|drop a|swipe/i.test(caption);
  const emojiCount = (caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const hasHook = /^[🎯⚡💡🚨🔥✨]|^(Stop|Don't|Want|How|Why|Did|Here|Save)/i.test(caption);
  const hasLineBreaks = (caption.match(/\n/g) || []).length >= 2;
  const hasQuestion = /\?/g.test(caption);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Type className="h-5 w-5 text-primary-500" />
              Caption Optimizer
            </CardTitle>
            <CardDescription>
              Craft engaging captions that drive interaction
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(activeTab === "edit" ? "preview" : "edit")}
            >
              {activeTab === "edit" ? "Preview" : "Edit"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              disabled={!caption}
            >
              {copied ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <button
            onClick={() => setActiveTab("edit")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "edit"
                ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "preview"
                ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
            )}
          >
            Preview
          </button>
          {suggestions && (
            <button
              onClick={() => setActiveTab("suggestions")}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === "suggestions"
                  ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              )}
            >
              AI Suggestions
            </button>
          )}
        </div>

        {/* Edit Tab */}
        {activeTab === "edit" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Caption
                </label>
                <span
                  className={cn(
                    "text-xs",
                    captionLength >= OPTIMAL_LENGTH.min && captionLength <= OPTIMAL_LENGTH.max
                      ? "text-success-600 dark:text-success-400"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {captionLength} / {OPTIMAL_LENGTH.max}
                </span>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Write your caption here..."
                className="min-h-[120px] resize-none"
              />
              <ProgressBar
                value={captionLength}
                max={OPTIMAL_LENGTH.max}
                size="sm"
                variant={
                  captionLength >= OPTIMAL_LENGTH.min && captionLength <= OPTIMAL_LENGTH.max
                    ? "success"
                    : captionLength < OPTIMAL_LENGTH.min
                    ? "warning"
                    : "danger"
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Hashtags
                </label>
                <span
                  className={cn(
                    "text-xs",
                    hashtagCount >= OPTIMAL_HASHTAGS.min && hashtagCount <= OPTIMAL_HASHTAGS.max
                      ? "text-success-600 dark:text-success-400"
                      : "text-neutral-500 dark:text-neutral-400"
                  )}
                >
                  {hashtagCount} hashtags
                </span>
              </div>
              <Textarea
                value={hashtags}
                onChange={(e) => handleHashtagsChange(e.target.value)}
                placeholder="#hashtag1 #hashtag2 #hashtag3"
                className="min-h-[80px] resize-none font-mono text-sm"
              />
              <ProgressBar
                value={hashtagCount}
                max={OPTIMAL_HASHTAGS.max}
                size="sm"
                variant={
                  hashtagCount >= OPTIMAL_HASHTAGS.min && hashtagCount <= OPTIMAL_HASHTAGS.max
                    ? "success"
                    : hashtagCount < OPTIMAL_HASHTAGS.min
                    ? "warning"
                    : "danger"
                }
              />
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-white">
                    your_username
                  </div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    Original audio
                  </div>
                </div>
              </div>
              
              <div className="aspect-square rounded-lg bg-neutral-100 dark:bg-neutral-700" />
              
              <div className="space-y-2">
                <p className="whitespace-pre-wrap text-neutral-900 dark:text-white">
                  {caption || "Your caption will appear here..."}
                </p>
                <p className="text-primary-600 dark:text-primary-400">
                  {hashtags || "#hashtags"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === "suggestions" && suggestions && (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
              <h4 className="font-medium text-primary-900 dark:text-primary-100">
                Analysis Results
              </h4>
              <div className="mt-2 grid gap-2 text-sm text-primary-700 dark:text-primary-300">
                <div className="flex justify-between">
                  <span>Readability Score</span>
                  <span className="font-semibold">{suggestions.analysis.readabilityScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Engagement Prediction</span>
                  <span className="font-semibold">{suggestions.analysis.engagementPrediction}/10</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-neutral-900 dark:text-white">
                AI Suggestions
              </h4>
              {suggestions.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
                >
                  <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                    {suggestion.text}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {suggestion.improvement}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(suggestion.text)}
                    >
                      <Wand2 className="mr-2 h-3 w-3" />
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        <div className="space-y-3 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800/50">
          <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
            Optimization Checklist
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckItem
              label="Optimal length (150-300 chars)"
              checked={captionLength >= OPTIMAL_LENGTH.min && captionLength <= OPTIMAL_LENGTH.max}
            />
            <CheckItem
              label="Has call-to-action"
              checked={hasCTA}
            />
            <CheckItem
              label="Strong hook in first line"
              checked={hasHook}
            />
            <CheckItem
              label="Uses 1-5 emojis"
              checked={emojiCount >= 1 && emojiCount <= 5}
            />
            <CheckItem
              label="Has line breaks"
              checked={hasLineBreaks}
            />
            <CheckItem
              label="Includes question"
              checked={hasQuestion}
            />
            <CheckItem
              label="20-30 hashtags"
              checked={hashtagCount >= OPTIMAL_HASHTAGS.min && hashtagCount <= OPTIMAL_HASHTAGS.max}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {onGenerateSuggestions && (
          <Button
            onClick={onGenerateSuggestions}
            disabled={loading || !caption}
            className="w-full"
          >
            {loading ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-success-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-neutral-300 dark:text-neutral-600" />
      )}
      <span
        className={cn(
          checked
            ? "text-neutral-700 dark:text-neutral-300"
            : "text-neutral-400 dark:text-neutral-500"
        )}
      >
        {label}
      </span>
    </div>
  );
}
