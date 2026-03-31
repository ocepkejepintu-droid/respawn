"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { VoCTheme, FeatureRequest, Testimonial } from "@/types/audience";

// ============================================================================
// Voice of Customer Themes
// ============================================================================

interface VoCThemesProps {
  themes: VoCTheme[];
  className?: string;
}

export function VoCThemes({ themes, className }: VoCThemesProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'praise':
        return (
          <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'complaint':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'suggestion':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'praise':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
      case 'complaint':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'suggestion':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
    }
  };
  
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {themes.map((theme, index) => (
        <div
          key={index}
          className={cn(
            "rounded-lg border p-4 transition-all hover:shadow-md",
            getTypeColor(theme.type)
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(theme.type)}
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  {theme.theme}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {theme.frequency} mentions
                  </span>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    getImpactBadge(theme.impact)
                  )}>
                    {theme.impact} impact
                  </span>
                </div>
              </div>
            </div>
            
            {theme.trendDirection && (
              <span className={cn(
                "text-sm",
                theme.trendDirection === 'increasing' ? "text-emerald-600" :
                theme.trendDirection === 'decreasing' ? "text-red-600" : "text-neutral-500"
              )}>
                {theme.trendDirection === 'increasing' ? '↑' :
                 theme.trendDirection === 'decreasing' ? '↓' : '→'}
              </span>
            )}
          </div>
          
          {theme.quotes.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-neutral-500">Sample quotes:</p>
              {theme.quotes.slice(0, 2).map((quote, i) => (
                <p key={i} className="text-sm italic text-neutral-600 dark:text-neutral-400">
                  "{quote}"
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {themes.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500">No themes found</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Feature Requests
// ============================================================================

interface FeatureRequestsProps {
  requests: FeatureRequest[];
  className?: string;
}

export function FeatureRequests({ requests, className }: FeatureRequestsProps) {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };
  
  const getFeasibilityBadge = (feasibility?: string) => {
    switch (feasibility) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {requests.map((request, index) => (
        <div
          key={index}
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  {request.feature}
                </h4>
                <p className="text-sm text-neutral-500">{request.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                getPriorityBadge(request.priority)
              )}>
                {request.priority}
              </span>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              {request.upvotes} upvotes
            </div>
            
            {request.feasibility && (
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                getFeasibilityBadge(request.feasibility)
              )}>
                {request.feasibility} to implement
              </span>
            )}
          </div>
          
          {request.relatedComments.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-500">Related feedback:</p>
              <div className="mt-1 space-y-1">
                {request.relatedComments.slice(0, 2).map((comment, i) => (
                  <p key={i} className="text-sm text-neutral-600 dark:text-neutral-400">
                    "{comment.substring(0, 100)}{comment.length > 100 ? '...' : ''}"
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {requests.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500">No feature requests found</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Testimonials
// ============================================================================

interface TestimonialsProps {
  testimonials: Testimonial[];
  className?: string;
}

export function Testimonials({ testimonials, className }: TestimonialsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-900/10"
        >
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <div className="flex-1">
              <p className="text-neutral-900 dark:text-neutral-100">
                {testimonial.text}
              </p>
              
              {testimonial.highlight && (
                <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  ✨ {testimonial.highlight}
                </p>
              )}
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {testimonial.author}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-sm capitalize text-neutral-500">
                    {testimonial.platform}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {testimonial.engagement > 0 && (
                    <span className="flex items-center gap-1 text-sm text-neutral-500">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      {testimonial.engagement}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {testimonials.length === 0 && (
        <div className="col-span-full rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500">No testimonials found yet</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Top Phrases
// ============================================================================

interface TopPhrasesProps {
  phrases: Array<{
    term: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  className?: string;
}

export function TopPhrases({ phrases, className }: TopPhrasesProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };
  
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {phrases.map((phrase, index) => (
        <div
          key={index}
          className={cn(
            "group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
            getSentimentColor(phrase.sentiment)
          )}
        >
          <span>"{phrase.term}"</span>
          <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-xs dark:bg-black/20">
            {phrase.frequency}
          </span>
          <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white dark:bg-white dark:text-neutral-900">
            {index + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
