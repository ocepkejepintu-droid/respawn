"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WordCloudItem {
  text: string;
  value: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface KeywordCloudProps {
  data: WordCloudItem[];
  maxWords?: number;
  className?: string;
  onWordClick?: (word: WordCloudItem) => void;
}

export function KeywordCloud({
  data,
  maxWords = 50,
  className,
  onWordClick,
}: KeywordCloudProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState({ width: 0, height: 0 });
  
  React.useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Process data for visualization
  const processedData = React.useMemo(() => {
    const sorted = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxWords);
    
    const maxValue = sorted[0]?.value || 1;
    const minValue = sorted[sorted.length - 1]?.value || 0;
    
    return sorted.map((item, index) => {
      // Calculate font size based on value (12px to 48px)
      const normalizedValue = (item.value - minValue) / (maxValue - minValue || 1);
      const fontSize = 12 + normalizedValue * 36;
      
      // Calculate position using spiral layout
      const angle = index * 0.5;
      const radius = 30 + index * 8;
      const x = 50 + (radius * Math.cos(angle)) / 5;
      const y = 50 + (radius * Math.sin(angle)) / 3;
      
      return {
        ...item,
        fontSize,
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
      };
    });
  }, [data, maxWords]);
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300';
      case 'negative':
        return 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300';
      default:
        return 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300';
    }
  };
  
  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-50 dark:bg-emerald-900/20';
      case 'negative':
        return 'bg-red-50 dark:bg-red-900/20';
      default:
        return 'bg-amber-50 dark:bg-amber-900/20';
    }
  };
  
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-[300px] w-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900",
        className
      )}
    >
      {processedData.map((word, index) => (
        <button
          key={`${word.text}-${index}`}
          onClick={() => onWordClick?.(word)}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg transition-all duration-200",
            "font-medium cursor-pointer hover:scale-110 hover:z-10",
            getSentimentColor(word.sentiment),
            getSentimentBg(word.sentiment),
            onWordClick && "hover:shadow-md"
          )}
          style={{
            left: `${word.x}%`,
            top: `${word.y}%`,
            fontSize: `${word.fontSize}px`,
            zIndex: maxWords - index,
          }}
          title={`${word.text}: ${word.value} mentions (${word.sentiment})`}
        >
          {word.text}
        </button>
      ))}
      
      {processedData.length === 0 && (
        <div className="flex h-full items-center justify-center text-neutral-500">
          No keywords to display
        </div>
      )}
    </div>
  );
}

interface KeywordTagProps {
  keyword: string;
  count?: number;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  trending?: 'up' | 'down' | 'stable';
  onClick?: () => void;
  className?: string;
}

export function KeywordTag({
  keyword,
  count,
  sentiment = 'neutral',
  trending,
  onClick,
  className,
}: KeywordTagProps) {
  const getSentimentStyles = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    }
  };
  
  const getTrendIcon = () => {
    switch (trending) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
        getSentimentStyles(),
        onClick && "hover:opacity-80 cursor-pointer",
        className
      )}
    >
      <span>{keyword}</span>
      {count !== undefined && (
        <span className="text-xs opacity-70">({count})</span>
      )}
      {trending && (
        <span className="text-xs">{getTrendIcon()}</span>
      )}
    </button>
  );
}

interface KeywordListProps {
  keywords: Array<{
    term: string;
    frequency: number;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    trendDirection?: 'up' | 'down' | 'stable';
    changePercent?: number;
  }>;
  maxItems?: number;
  className?: string;
}

export function KeywordList({
  keywords,
  maxItems = 20,
  className,
}: KeywordListProps) {
  const displayedKeywords = keywords.slice(0, maxItems);
  
  return (
    <div className={cn("space-y-2", className)}>
      {displayedKeywords.map((keyword, index) => (
        <div
          key={`${keyword.term}-${index}`}
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">#{index + 1}</span>
            <KeywordTag
              keyword={keyword.term}
              sentiment={keyword.sentiment}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{keyword.frequency}</p>
              <p className="text-xs text-neutral-500">mentions</p>
            </div>
            
            {keyword.changePercent !== undefined && (
              <div className={cn(
                "text-right text-sm",
                keyword.changePercent > 0 ? "text-emerald-600" : 
                keyword.changePercent < 0 ? "text-red-600" : "text-neutral-500"
              )}>
                <p className="font-medium">
                  {keyword.changePercent > 0 ? '+' : ''}{keyword.changePercent}%
                </p>
                <p className="text-xs text-neutral-500">
                  {keyword.trendDirection === 'up' ? '↑' : 
                   keyword.trendDirection === 'down' ? '↓' : '→'}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {displayedKeywords.length === 0 && (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500">No keywords found</p>
        </div>
      )}
    </div>
  );
}
