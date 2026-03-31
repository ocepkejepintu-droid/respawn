# Content Optimization Module

A comprehensive content recommendation and optimization system for the Real Buzzer SaaS platform.

## Overview

This module provides AI-powered tools to analyze content performance, generate recommendations, optimize posts, and manage content calendars for social media creators.

## Features

### 1. Performance Analysis
- **Content Type Performance**: Compare engagement rates across Reels, Carousels, Single Images, Stories, and Videos
- **Posting Time Heatmap**: Visualize optimal posting times with a 7x24 heatmap
- **Caption Length Analysis**: Find the optimal caption length for maximum engagement
- **Hashtag Optimization**: Analyze hashtag count effectiveness
- **Engagement Velocity**: Track first-hour performance metrics

### 2. Content Recommendations
- **AI-Powered Ideas**: Generate content ideas based on trends and historical performance
- **Caption Suggestions**: Get AI-improved caption variations with hooks and CTAs
- **Hashtag Recommendations**: Discover relevant hashtags with competition and relevance scores
- **A/B Test Suggestions**: Get data-driven test ideas for content optimization

### 3. Optimization Tools
- **Content Score Calculator**: 0-100 rating with detailed breakdown
- **Post Preview**: Realistic Instagram/TikTok mockups (mobile & desktop)
- **Caption Optimizer**: Interactive editor with real-time feedback
- **Best Time Calculator**: Find optimal posting slots
- **Optimization Checklist**: Track completion of best practices

### 4. Content Calendar
- **Weekly/Monthly Views**: Flexible calendar layouts
- **Drag & Drop**: Reorder events easily
- **Content Queue**: Manage ideas, drafts, and scheduled posts
- **Publishing Reminders**: Never miss a posting time

## File Structure

```
src/
├── app/(dashboard)/
│   ├── optimize/
│   │   ├── page.tsx              # Main optimization dashboard
│   │   └── calendar/
│   │       └── page.tsx          # Content calendar page
├── components/optimize/
│   ├── index.ts                  # Component exports
│   ├── ContentScoreCard.tsx      # Overall score display
│   ├── PostingTimeHeatmap.tsx    # Best times visualization
│   ├── ContentTypePerformance.tsx # Bar chart comparison
│   ├── CaptionOptimizer.tsx      # Interactive caption editor
│   ├── HashtagRecommender.tsx    # Smart hashtag suggestions
│   ├── ContentIdeaGenerator.tsx  # AI-powered ideas
│   ├── ContentCalendar.tsx       # Weekly/monthly planner
│   ├── PostPreview.tsx           # Instagram/TikTok mockup
│   └── OptimizationChecklist.tsx # Optimization items checklist
├── server/services/optimize/
│   ├── index.ts                  # Service exports
│   ├── analyzer.ts               # Performance analysis
│   ├── recommender.ts            # Content recommendations
│   ├── scoring.ts                # Content score calculation
│   └── calendar.ts               # Calendar management
├── server/routers/
│   └── optimize.ts               # tRPC router
└── types/
    └── optimize.ts               # TypeScript types
```

## Key Components

### ContentScoreCard
Displays overall optimization score (0-100) with grade breakdown and improvement suggestions.

```tsx
<ContentScoreCard
  score={{
    overall: 85,
    breakdown: { caption: 90, hashtags: 80, timing: 85, visual: 88, engagement: 82 },
    suggestions: ["Add a call-to-action", "Use more hashtags"],
    grade: "B"
  }}
  onOptimize={() => {}}
/>
```

### PostingTimeHeatmap
Interactive heatmap showing best posting times by day and hour.

```tsx
<PostingTimeHeatmap
  data={heatmapData}
  onTimeSelect={(day, hour) => {}}
/>
```

### ContentTypePerformance
Bar chart comparing performance across content types.

```tsx
<ContentTypePerformance
  data={performanceData}
  onTypeSelect={(type) => {}}
/>
```

### CaptionOptimizer
Interactive caption editor with real-time analysis and AI suggestions.

```tsx
<CaptionOptimizer
  initialCaption="Your caption here"
  initialHashtags={["hashtag1", "hashtag2"]}
  onCaptionChange={(caption) => {}}
  onHashtagsChange={(hashtags) => {}}
  onGenerateSuggestions={() => {}}
/>
```

### HashtagRecommender
Smart hashtag suggestions with filtering and selection.

```tsx
<HashtagRecommender
  recommendations={hashtagData}
  selectedHashtags={["tag1"]}
  onHashtagSelect={(tag) => {}}
  onHashtagRemove={(tag) => {}}
/>
```

### ContentCalendar
Full-featured content calendar with drag-and-drop support.

```tsx
<ContentCalendar
  events={calendarEvents}
  view="week"
  onViewChange={(view) => {}}
  onEventClick={(event) => {}}
  onDateClick={(date) => {}}
/>
```

### PostPreview
Realistic Instagram/TikTok post previews for mobile and desktop.

```tsx
<PostPreview
  preview={{
    platform: "instagram",
    contentType: "reel",
    caption: "Your caption",
    hashtags: ["tag1", "tag2"],
    likes: 1000,
    comments: 50,
    // ...
  }}
/>
```

## API Endpoints (tRPC)

### Analysis
- `optimize.analyzePerformance` - Get comprehensive performance analysis
- `optimize.getTopPerformingPosts` - Get top posts by engagement
- `optimize.getEngagementTrends` - Get engagement trends over time
- `optimize.compareContentTypes` - Compare content type performance

### Recommendations
- `optimize.getRecommendations` - Get AI content recommendations
- `optimize.generateContentIdeas` - Generate content ideas
- `optimize.generateCaptionSuggestions` - Get caption improvements
- `optimize.recommendHashtags` - Get hashtag recommendations
- `optimize.generateABTestSuggestions` - Get A/B test ideas

### Scoring
- `optimize.calculateScore` - Calculate content optimization score
- `optimize.optimizePost` - Get optimized version of content
- `optimize.generateChecklist` - Generate optimization checklist

### Calendar
- `optimize.calendar.get` - Get calendar events
- `optimize.calendar.create` - Create new event
- `optimize.calendar.update` - Update event
- `optimize.calendar.delete` - Delete event
- `optimize.calendar.publish` - Publish event
- `optimize.queue.get` - Get content queue

## Data Types

### ContentType
`'reel' | 'carousel' | 'single_image' | 'story' | 'video'`

### PlatformType
`'instagram' | 'tiktok'`

### ContentScore
```typescript
interface ContentScore {
  overall: number;        // 0-100
  breakdown: {
    caption: number;
    hashtags: number;
    timing: number;
    visual: number;
    engagement: number;
  };
  suggestions: string[];
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}
```

## Best Practices Implemented

1. **Optimal Caption Length**: 150-300 characters
2. **Hashtag Count**: 20-30 hashtags for best reach
3. **Posting Times**: Tuesday-Thursday, 6-9 PM
4. **Content Types**: Reels and Carousels perform best
5. **Engagement CTAs**: Include clear calls-to-action
6. **Visual Consistency**: Maintain brand aesthetic

## Future Enhancements

- [ ] Integration with social media APIs for real data
- [ ] Advanced AI content generation
- [ ] Automated A/B testing
- [ ] Competitor content analysis
- [ ] Trend prediction algorithms
- [ ] Automated scheduling
- [ ] Performance prediction models

## Dependencies

- `@trpc/react-query` - tRPC client
- `@tanstack/react-query` - Data fetching
- `recharts` - Charts and visualizations
- `date-fns` - Date manipulation
- `lucide-react` - Icons
