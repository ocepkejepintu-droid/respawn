"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { CommentInsight } from "@/types/audience";

interface CommentAnalysisTableProps {
  comments: CommentInsight[];
  className?: string;
  onCommentClick?: (comment: CommentInsight) => void;
}

export function CommentAnalysisTable({
  comments,
  className,
  onCommentClick,
}: CommentAnalysisTableProps) {
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };
  
  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'question':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'praise':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'complaint':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'suggestion':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };
  
  const getEmotionEmoji = (emotion?: string) => {
    const emojis: Record<string, string> = {
      joy: '😊',
      anger: '😠',
      sadness: '😢',
      fear: '😨',
      surprise: '😲',
      trust: '🤝',
      anticipation: '🤩',
      neutral: '😐',
    };
    return emojis[emotion || 'neutral'] || '😐';
  };
  
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-800">
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Comment</th>
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Sentiment</th>
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Category</th>
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Platform</th>
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Engagement</th>
            <th className="pb-3 font-medium text-neutral-500 dark:text-neutral-400">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {comments.map((comment) => (
            <tr
              key={comment.id}
              className={cn(
                "group transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900/50",
                onCommentClick && "cursor-pointer"
              )}
              onClick={() => onCommentClick?.(comment)}
            >
              <td className="py-4">
                <div className="max-w-md">
                  <p className="line-clamp-2 text-neutral-900 dark:text-neutral-100">
                    {comment.text}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {comment.emotion && (
                      <span className="text-xs" title={`Emotion: ${comment.emotion.primary}`}>
                        {getEmotionEmoji(comment.emotion.primary)}
                      </span>
                    )}
                    {comment.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs text-neutral-500 dark:text-neutral-400"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </td>
              
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      getSentimentBadge(comment.sentiment)
                    )}
                  >
                    {comment.sentiment}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {comment.sentimentScore > 0 ? '+' : ''}{comment.sentimentScore.toFixed(2)}
                  </span>
                </div>
              </td>
              
              <td className="py-4">
                {comment.category && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      getCategoryBadge(comment.category)
                    )}
                  >
                    {comment.category}
                  </span>
                )}
              </td>
              
              <td className="py-4">
                <span className="capitalize text-neutral-600 dark:text-neutral-400">
                  {comment.platform}
                </span>
              </td>
              
              <td className="py-4">
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  {comment.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {comment.likes}
                    </span>
                  )}
                  {comment.replies > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {comment.replies}
                    </span>
                  )}
                </div>
              </td>
              
              <td className="py-4 text-neutral-500 dark:text-neutral-400">
                <span title={formatDate(comment.timestamp)}>
                  {formatRelativeTime(comment.timestamp)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {comments.length === 0 && (
        <div className="py-12 text-center text-neutral-500">
          No comments found
        </div>
      )}
    </div>
  );
}

interface CommentCardProps {
  comment: CommentInsight;
  className?: string;
  onClick?: () => void;
}

export function CommentCard({ comment, className, onClick }: CommentCardProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20';
      case 'negative':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
    }
  };
  
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        getSentimentColor(comment.sentiment),
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <p className="text-neutral-900 dark:text-neutral-100">{comment.text}</p>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium capitalize text-neutral-600 dark:text-neutral-400">
            {comment.platform}
          </span>
          <span className="text-neutral-300">•</span>
          <span className="text-xs text-neutral-500">
            {formatRelativeTime(comment.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {comment.likes > 0 && (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {comment.likes}
            </span>
          )}
          
          {comment.emotion && (
            <span className="text-xs text-neutral-500" title={comment.emotion.primary}>
              {comment.emotion.primary}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuestionListProps {
  questions: Array<{
    question: string;
    frequency: number;
    variations: string[];
    contexts: string[];
    suggestedAnswer?: string;
  }>;
  className?: string;
}

export function QuestionList({ questions, className }: QuestionListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {questions.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-neutral-900 dark:text-white">
                {item.question}
              </h4>
              <p className="mt-1 text-sm text-neutral-500">
                Asked {item.frequency} times
              </p>
            </div>
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              #{index + 1}
            </span>
          </div>
          
          {item.variations.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-500">Variations:</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.variations.map((variation, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    "{variation}"
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {item.suggestedAnswer && (
            <div className="mt-3 rounded-md bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Suggested Response:
              </p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                {item.suggestedAnswer}
              </p>
            </div>
          )}
        </div>
      ))}
      
      {questions.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500">No common questions found</p>
        </div>
      )}
    </div>
  );
}

interface PainPointListProps {
  painPoints: Array<{
    issue: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
    relatedComments: string[];
    suggestedSolutions?: string[];
  }>;
  className?: string;
}

export function PainPointList({ painPoints, className }: PainPointListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };
  
  return (
    <div className={cn("space-y-4", className)}>
      {painPoints.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-900/10"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">
                  {item.issue}
                </h4>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Reported {item.frequency} times
                </p>
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                getSeverityColor(item.severity)
              )}
            >
              {item.severity} severity
            </span>
          </div>
          
          {item.suggestedSolutions && item.suggestedSolutions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-red-800 dark:text-red-300">
                Suggested Solutions:
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-red-700 dark:text-red-400">
                {item.suggestedSolutions.map((solution, i) => (
                  <li key={i}>{solution}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      
      {painPoints.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-emerald-600 dark:text-emerald-400">No major pain points detected 🎉</p>
        </div>
      )}
    </div>
  );
}
