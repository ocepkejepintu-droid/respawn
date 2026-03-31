/**
 * Content Calendar Service
 * Manages scheduled posts, content queue, and calendar events
 */

import {
  CalendarEvent,
  ContentCalendar,
  ContentQueue,
  SchedulePostInput,
  ContentIdea,
  ContentType,
  PlatformType,
  CalculateBestTimeInput,
} from '@/types/optimize';

// ============================================================================
// Mock Data Store (Replace with actual database)
// ============================================================================

let mockEvents: CalendarEvent[] = [];
let mockIdeas: ContentIdea[] = [];

// Initialize with sample data
function initializeMockData() {
  const now = new Date();
  const contentTypes: ContentType[] = ['reel', 'carousel', 'single_image'];
  const platforms: PlatformType[] = ['instagram', 'tiktok'];
  const titles = [
    'Monday Motivation Post',
    'Tutorial Tuesday',
    'Behind the Scenes',
    'Throwback Thursday',
    'Feature Friday',
    'Weekend Vibes',
    'Sunday Tips',
  ];
  
  // Generate events for next 30 days
  for (let i = 0; i < 15; i++) {
    const scheduledAt = new Date(now.getTime() + (i * 2 + 1) * 24 * 60 * 60 * 1000);
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    mockEvents.push({
      id: `event_${i}`,
      title: titles[i % titles.length],
      description: `Scheduled ${contentType} post for ${platform}`,
      contentType,
      platform,
      scheduledAt,
      status: Math.random() > 0.7 ? 'published' : 'scheduled',
      content: {
        caption: `Excited to share this ${contentType} with you all!`,
        hashtags: ['content', 'creator', 'socialmedia', 'growth'],
        mediaUrls: [`https://example.com/media/${i}.jpg`],
      },
      reminder: {
        enabled: true,
        minutesBefore: 30,
      },
    });
  }
  
  // Generate some draft events
  for (let i = 0; i < 5; i++) {
    mockEvents.push({
      id: `draft_${i}`,
      title: `Draft: ${titles[i % titles.length]}`,
      description: 'Draft post - needs completion',
      contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      scheduledAt: new Date(now.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
      status: 'draft',
    });
  }
  
  // Sort by scheduled time
  mockEvents.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

initializeMockData();

// ============================================================================
// Calendar Management
// ============================================================================

export async function getCalendar(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  view: 'week' | 'month' = 'week'
): Promise<ContentCalendar> {
  // In production, fetch from database
  const events = mockEvents.filter(event => 
    event.scheduledAt >= startDate && 
    event.scheduledAt <= endDate
  );
  
  return {
    events,
    view,
    startDate,
    endDate,
  };
}

export async function getUpcomingEvents(
  workspaceId: string,
  limit: number = 10
): Promise<CalendarEvent[]> {
  const now = new Date();
  return mockEvents
    .filter(event => event.scheduledAt >= now && event.status !== 'published')
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, limit);
}

export async function getEventById(eventId: string): Promise<CalendarEvent | null> {
  return mockEvents.find(e => e.id === eventId) || null;
}

export async function createEvent(
  input: SchedulePostInput
): Promise<CalendarEvent> {
  const event: CalendarEvent = {
    id: `event_${Date.now()}`,
    title: input.title,
    description: input.caption || '',
    contentType: input.contentType,
    platform: input.platform,
    scheduledAt: input.scheduledAt,
    status: 'scheduled',
    content: {
      caption: input.caption,
      hashtags: input.hashtags,
      mediaUrls: input.mediaUrls,
    },
    reminder: input.reminder,
  };
  
  mockEvents.push(event);
  mockEvents.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  
  return event;
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<CalendarEvent, 'id'>>
): Promise<CalendarEvent | null> {
  const index = mockEvents.findIndex(e => e.id === eventId);
  if (index === -1) return null;
  
  mockEvents[index] = { ...mockEvents[index], ...updates };
  mockEvents.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  
  return mockEvents[index];
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  const index = mockEvents.findIndex(e => e.id === eventId);
  if (index === -1) return false;
  
  mockEvents.splice(index, 1);
  return true;
}

export async function publishEvent(eventId: string): Promise<CalendarEvent | null> {
  return updateEvent(eventId, { status: 'published' });
}

// ============================================================================
// Content Queue
// ============================================================================

export async function getContentQueue(workspaceId: string): Promise<ContentQueue> {
  const now = new Date();
  
  const ideas = mockIdeas.length > 0 ? mockIdeas : generateDefaultIdeas();
  const scheduled = mockEvents.filter(e => 
    e.scheduledAt >= now && e.status === 'scheduled'
  );
  const drafts = mockEvents.filter(e => e.status === 'draft');
  
  return {
    ideas,
    scheduled,
    drafts,
  };
}

export async function addToQueue(
  workspaceId: string,
  idea: ContentIdea
): Promise<ContentIdea> {
  const newIdea = { ...idea, id: `idea_${Date.now()}` };
  mockIdeas.push(newIdea);
  return newIdea;
}

export async function removeFromQueue(
  workspaceId: string,
  ideaId: string
): Promise<boolean> {
  const index = mockIdeas.findIndex(i => i.id === ideaId);
  if (index === -1) return false;
  
  mockIdeas.splice(index, 1);
  return true;
}

export async function convertIdeaToEvent(
  workspaceId: string,
  ideaId: string,
  scheduledAt: Date
): Promise<CalendarEvent | null> {
  const idea = mockIdeas.find(i => i.id === ideaId);
  if (!idea) return null;
  
  const event = await createEvent({
    workspaceId,
    title: idea.title,
    contentType: idea.contentType,
    platform: idea.platform,
    scheduledAt,
    caption: idea.suggestedCaption,
    hashtags: idea.suggestedHashtags,
  });
  
  // Remove from ideas queue
  await removeFromQueue(workspaceId, ideaId);
  
  return event;
}

function generateDefaultIdeas(): ContentIdea[] {
  const ideas: ContentIdea[] = [
    {
      id: 'idea_default_1',
      title: 'Trending Audio Reel',
      description: 'Use this weeks trending audio for maximum reach',
      contentType: 'reel',
      platform: 'instagram',
      suggestedHashtags: ['reels', 'trending', 'viral'],
      suggestedCaption: 'Jumping on this trend!',
      estimatedEngagement: 8.5,
      trendScore: 95,
      relevanceScore: 80,
      source: 'trending',
    },
    {
      id: 'idea_default_2',
      title: '5 Tips Carousel',
      description: 'Share 5 quick tips in a carousel format',
      contentType: 'carousel',
      platform: 'instagram',
      suggestedHashtags: ['tips', 'learn', 'growth'],
      suggestedCaption: 'Save these 5 tips!',
      estimatedEngagement: 6.2,
      trendScore: 85,
      relevanceScore: 90,
      source: 'ai',
    },
    {
      id: 'idea_default_3',
      title: 'Behind the Scenes',
      description: 'Show your authentic creative process',
      contentType: 'single_image',
      platform: 'instagram',
      suggestedHashtags: ['bts', 'authentic', 'creative'],
      suggestedCaption: 'The real behind the scenes',
      estimatedEngagement: 5.8,
      trendScore: 80,
      relevanceScore: 85,
      source: 'historical',
    },
  ];
  
  mockIdeas = ideas;
  return ideas;
}

// ============================================================================
// Best Time Calculator
// ============================================================================

export async function calculateBestTime(
  input: CalculateBestTimeInput
): Promise<{ date: Date; score: number; reason: string }[]> {
  const { contentType, platform, daysAhead = 7 } = input;
  const suggestions: { date: Date; score: number; reason: string }[] = [];
  const now = new Date();
  
  // Optimal posting times based on general best practices
  const optimalSlots = [
    { day: 1, hour: 19, label: 'Tuesday 7 PM' },
    { day: 2, hour: 19, label: 'Wednesday 7 PM' },
    { day: 3, hour: 19, label: 'Thursday 7 PM' },
    { day: 1, hour: 12, label: 'Tuesday 12 PM' },
    { day: 2, hour: 12, label: 'Wednesday 12 PM' },
    { day: 4, hour: 19, label: 'Friday 7 PM' },
  ];
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Find matching optimal slot
    const slot = optimalSlots.find(s => s.day === dayOfWeek);
    
    if (slot) {
      const suggestedDate = new Date(date);
      suggestedDate.setHours(slot.hour, 0, 0, 0);
      
      // Skip if in the past
      if (suggestedDate <= now) continue;
      
      // Calculate score based on various factors
      let score = 85; // Base score for optimal slots
      
      // Adjust for content type
      if (contentType === 'reel') score += 5;
      if (contentType === 'carousel') score += 3;
      
      // Adjust for platform
      if (platform === 'instagram' && contentType === 'reel') score += 3;
      if (platform === 'tiktok' && (contentType === 'video' || contentType === 'reel')) score += 5;
      
      // Check for conflicts
      const hasConflict = mockEvents.some(e => {
        const eventTime = new Date(e.scheduledAt);
        return (
          eventTime.getDate() === suggestedDate.getDate() &&
          eventTime.getMonth() === suggestedDate.getMonth() &&
          Math.abs(eventTime.getHours() - suggestedDate.getHours()) < 2
        );
      });
      
      if (hasConflict) score -= 10;
      
      suggestions.push({
        date: suggestedDate,
        score: Math.min(100, score),
        reason: `${slot.label} is optimal for ${contentType || 'post'}s${hasConflict ? ' (slight scheduling conflict)' : ''}`,
      });
    }
  }
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ============================================================================
// Calendar Analytics
// ============================================================================

export async function getCalendarAnalytics(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalScheduled: number;
  totalPublished: number;
  totalDrafts: number;
  postsByType: Record<ContentType, number>;
  postsByPlatform: Record<PlatformType, number>;
  consistencyScore: number;
}> {
  const events = mockEvents.filter(e => 
    e.scheduledAt >= startDate && e.scheduledAt <= endDate
  );
  
  const postsByType: Record<ContentType, number> = {
    reel: 0,
    carousel: 0,
    single_image: 0,
    story: 0,
    video: 0,
  };
  
  const postsByPlatform: Record<PlatformType, number> = {
    instagram: 0,
    tiktok: 0,
  };
  
  events.forEach(event => {
    postsByType[event.contentType]++;
    postsByPlatform[event.platform]++;
  });
  
  // Calculate consistency score based on posting frequency
  const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const scheduledCount = events.filter(e => e.status === 'scheduled').length;
  const publishedCount = events.filter(e => e.status === 'published').length;
  const idealPostsPerWeek = 7;
  const weeksInRange = daysInRange / 7;
  const idealTotalPosts = idealPostsPerWeek * weeksInRange;
  
  const consistencyScore = Math.min(100, Math.round((publishedCount / idealTotalPosts) * 100));
  
  return {
    totalScheduled: scheduledCount,
    totalPublished: publishedCount,
    totalDrafts: events.filter(e => e.status === 'draft').length,
    postsByType,
    postsByPlatform,
    consistencyScore,
  };
}

// ============================================================================
// Drag and Drop Operations
// ============================================================================

export async function reorderEvents(
  workspaceId: string,
  eventId: string,
  newScheduledAt: Date
): Promise<CalendarEvent | null> {
  return updateEvent(eventId, { scheduledAt: newScheduledAt });
}

export async function bulkSchedule(
  workspaceId: string,
  eventIds: string[],
  baseDate: Date,
  intervalDays: number = 1
): Promise<CalendarEvent[]> {
  const updatedEvents: CalendarEvent[] = [];
  
  for (let i = 0; i < eventIds.length; i++) {
    const scheduledAt = new Date(baseDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000);
    // Set to 7 PM for best engagement
    scheduledAt.setHours(19, 0, 0, 0);
    
    const event = await updateEvent(eventIds[i], { scheduledAt });
    if (event) {
      updatedEvents.push(event);
    }
  }
  
  return updatedEvents;
}

export async function rescheduleEvent(
  eventId: string,
  newDate: Date,
  keepTime: boolean = true
): Promise<CalendarEvent | null> {
  const event = await getEventById(eventId);
  if (!event) return null;
  
  const scheduledAt = new Date(newDate);
  
  if (keepTime) {
    scheduledAt.setHours(
      event.scheduledAt.getHours(),
      event.scheduledAt.getMinutes(),
      0,
      0
    );
  }
  
  return updateEvent(eventId, { scheduledAt });
}
