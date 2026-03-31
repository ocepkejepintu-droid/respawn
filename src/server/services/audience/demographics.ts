/**
 * Demographics Service
 * Aggregates and analyzes audience demographic data
 */

import type {
  Demographics,
  AgeRange,
  GeographicData,
  InterestCategory,
  PeakEngagement,
  ActiveHour,
  AudienceSegment,
} from '@/types/audience';

// ============================================================================
// Mock Data Generators (would be replaced with real data in production)
// ============================================================================

const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+'];
const COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Canada', code: 'CA' },
  { name: 'Australia', code: 'AU' },
  { name: 'Germany', code: 'DE' },
  { name: 'France', code: 'FR' },
  { name: 'Indonesia', code: 'ID' },
  { name: 'India', code: 'IN' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Japan', code: 'JP' },
];

const INTEREST_CATEGORIES = [
  'Fashion', 'Technology', 'Travel', 'Food', 'Fitness', 'Music', 'Sports',
  'Art', 'Photography', 'Gaming', 'Business', 'Education', 'Entertainment',
  'Health', 'Lifestyle', 'Design', 'Marketing', 'Finance', 'News', 'Science',
];

// ============================================================================
// Core Demographics Functions
// ============================================================================

/**
 * Generate age distribution from audience data
 */
export function generateAgeDistribution(totalAudience: number): AgeRange[] {
  // Simulate realistic social media age distribution
  const distribution = [8, 28, 32, 18, 9, 5]; // Percentages
  
  return AGE_RANGES.map((range, index) => ({
    range,
    percentage: distribution[index],
    count: Math.round((totalAudience * distribution[index]) / 100),
    engagementRate: 2 + Math.random() * 6, // 2-8% engagement rate
  }));
}

/**
 * Generate geographic distribution
 */
export function generateGeographicDistribution(totalAudience: number): GeographicData[] {
  // Top countries with realistic distribution
  const topCountries = [
    { ...COUNTRIES[0], pct: 35 },
    { ...COUNTRIES[1], pct: 15 },
    { ...COUNTRIES[2], pct: 12 },
    { ...COUNTRIES[6], pct: 10 },
    { ...COUNTRIES[7], pct: 8 },
    { ...COUNTRIES[4], pct: 6 },
    { ...COUNTRIES[3], pct: 5 },
    { ...COUNTRIES[8], pct: 4 },
    { ...COUNTRIES[9], pct: 3 },
    { ...COUNTRIES[5], pct: 2 },
  ];
  
  return topCountries.map((country) => ({
    country: country.name,
    countryCode: country.code,
    percentage: country.pct,
    count: Math.round((totalAudience * country.pct) / 100),
    cities: generateCitiesForCountry(country.name, 3),
  }));
}

/**
 * Generate cities for a country
 */
function generateCitiesForCountry(country: string, count: number): { name: string; percentage: number }[] {
  const cityMap: Record<string, string[]> = {
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'],
  };
  
  const cities = cityMap[country] || ['Capital City', 'Major City', 'Coastal City'];
  const distribution = [45, 25, 15, 10, 5];
  
  return cities.slice(0, count).map((city, index) => ({
    name: city,
    percentage: distribution[index] || 10,
  }));
}

/**
 * Generate interest categories based on content analysis
 */
export function generateInterestCategories(): InterestCategory[] {
  const interests: InterestCategory[] = [
    { name: 'Social Media', score: 95, affinity: 'high', trending: true },
    { name: 'Technology', score: 88, affinity: 'high', trending: false },
    { name: 'Entertainment', score: 82, affinity: 'high', trending: true },
    { name: 'Lifestyle', score: 76, affinity: 'high', trending: false },
    { name: 'Marketing', score: 71, affinity: 'medium', trending: true },
    { name: 'Business', score: 68, affinity: 'medium', trending: false },
    { name: 'Photography', score: 64, affinity: 'medium', trending: false },
    { name: 'Fashion', score: 58, affinity: 'medium', trending: true },
    { name: 'Travel', score: 52, affinity: 'medium', trending: false },
    { name: 'Food', score: 48, affinity: 'low', trending: false },
    { name: 'Fitness', score: 44, affinity: 'low', trending: true },
    { name: 'Music', score: 41, affinity: 'low', trending: false },
  ];
  
  return interests;
}

/**
 * Generate peak engagement times
 */
export function generatePeakEngagement(): PeakEngagement {
  const hourlyDistribution: ActiveHour[] = [];
  
  // Generate realistic engagement patterns (higher in evenings)
  for (let hour = 0; hour < 24; hour++) {
    let baseEngagement = 10;
    
    // Morning peak (9-11 AM)
    if (hour >= 9 && hour <= 11) baseEngagement = 45;
    // Lunch peak (12-1 PM)
    else if (hour >= 12 && hour <= 13) baseEngagement = 55;
    // Afternoon dip (2-4 PM)
    else if (hour >= 14 && hour <= 16) baseEngagement = 35;
    // Evening peak (7-10 PM)
    else if (hour >= 19 && hour <= 22) baseEngagement = 80;
    // Late night decline
    else if (hour >= 23 || hour <= 5) baseEngagement = 15;
    
    // Add some randomness
    const engagement = Math.max(5, baseEngagement + (Math.random() * 20 - 10));
    
    hourlyDistribution.push({
      hour,
      engagement: Math.round(engagement),
      posts: Math.round(engagement * (0.8 + Math.random() * 0.4)),
    });
  }
  
  // Find best hours (top 3)
  const bestHours = hourlyDistribution
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3)
    .map((h) => h.hour);
  
  // Best days (based on typical social media patterns)
  const dayEngagement = [
    { day: 'Monday', score: 65 },
    { day: 'Tuesday', score: 72 },
    { day: 'Wednesday', score: 78 },
    { day: 'Thursday', score: 80 },
    { day: 'Friday', score: 85 },
    { day: 'Saturday', score: 70 },
    { day: 'Sunday', score: 68 },
  ];
  
  const bestDays = dayEngagement
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((d) => d.day);
  
  return {
    bestDays,
    bestHours,
    hourlyDistribution,
    timezone: 'America/New_York',
  };
}

/**
 * Generate gender distribution
 */
export function generateGenderDistribution(): { male: number; female: number; other: number } {
  return {
    female: 58,
    male: 38,
    other: 4,
  };
}

/**
 * Generate language distribution
 */
export function generateLanguageDistribution(): Record<string, number> {
  return {
    'en': 62,
    'es': 12,
    'id': 8,
    'de': 5,
    'fr': 4,
    'ja': 3,
    'pt': 3,
    'other': 3,
  };
}

/**
 * Generate device distribution
 */
export function generateDeviceDistribution(): Record<string, number> {
  return {
    'Mobile': 68,
    'Desktop': 24,
    'Tablet': 8,
  };
}

/**
 * Aggregate complete demographics
 */
export function aggregateDemographics(workspaceId: string, totalAudience: number = 10000): Demographics {
  return {
    ageRanges: generateAgeDistribution(totalAudience),
    countries: generateGeographicDistribution(totalAudience),
    interests: generateInterestCategories(),
    peakEngagement: generatePeakEngagement(),
    gender: generateGenderDistribution(),
    languages: Object.entries(generateLanguageDistribution()).map(([lang, pct]) => `${lang}:${pct}`),
    devices: generateDeviceDistribution(),
  };
}

/**
 * Generate audience segments
 */
export function generateAudienceSegments(totalAudience: number): AudienceSegment[] {
  const segments: AudienceSegment[] = [
    {
      id: 'seg-1',
      name: 'Engaged Enthusiasts',
      description: 'Highly active users who frequently engage with content and share posts',
      size: Math.round(totalAudience * 0.15),
      percentage: 15,
      characteristics: {
        demographics: {
          ageRanges: [{ range: '18-24', percentage: 35, count: 0 }],
        },
        interests: ['Entertainment', 'Social Media', 'Trends'],
        behaviors: ['Daily active', 'High share rate', 'Comment frequently'],
        sentiment: 'positive',
      },
      engagementRate: 12.5,
      value: 'high',
    },
    {
      id: 'seg-2',
      name: 'Casual Browsers',
      description: 'Occasional visitors who consume content but rarely engage',
      size: Math.round(totalAudience * 0.45),
      percentage: 45,
      characteristics: {
        demographics: {
          ageRanges: [{ range: '25-44', percentage: 60, count: 0 }],
        },
        interests: ['Lifestyle', 'News', 'Hobbies'],
        behaviors: ['Weekly visits', 'Lurk more than engage', 'Save content'],
        sentiment: 'neutral',
      },
      engagementRate: 3.2,
      value: 'medium',
    },
    {
      id: 'seg-3',
      name: 'Professional Network',
      description: 'Business-focused users interested in industry insights and networking',
      size: Math.round(totalAudience * 0.20),
      percentage: 20,
      characteristics: {
        demographics: {
          ageRanges: [{ range: '35-54', percentage: 55, count: 0 }],
        },
        interests: ['Business', 'Marketing', 'Technology', 'Finance'],
        behaviors: ['Share professional content', 'Network building', 'Thought leadership'],
        sentiment: 'positive',
      },
      engagementRate: 5.8,
      value: 'high',
    },
    {
      id: 'seg-4',
      name: 'New Followers',
      description: 'Recently acquired audience still exploring the content',
      size: Math.round(totalAudience * 0.12),
      percentage: 12,
      characteristics: {
        demographics: {
          ageRanges: [{ range: '18-34', percentage: 70, count: 0 }],
        },
        interests: ['Discovery', 'Trends', 'Social Media'],
        behaviors: ['High initial engagement', 'Testing content types', 'Learning preferences'],
        sentiment: 'positive',
      },
      engagementRate: 8.4,
      value: 'medium',
    },
    {
      id: 'seg-5',
      name: 'At-Risk Users',
      description: 'Previously active users showing declining engagement',
      size: Math.round(totalAudience * 0.08),
      percentage: 8,
      characteristics: {
        demographics: {
          ageRanges: [{ range: '25-44', percentage: 50, count: 0 }],
        },
        interests: ['Various'],
        behaviors: ['Decreasing activity', 'Less frequent visits', 'Minimal interaction'],
        sentiment: 'neutral',
      },
      engagementRate: 1.2,
      value: 'low',
    },
  ];
  
  return segments;
}

/**
 * Calculate engagement score for a time slot
 */
export function calculateEngagementScore(
  posts: number,
  likes: number,
  comments: number,
  shares: number
): number {
  const engagement = likes + comments * 2 + shares * 3;
  return posts > 0 ? engagement / posts : 0;
}

/**
 * Predict best posting times based on historical data
 */
export function predictBestPostingTimes(historicalData: ActiveHour[]): {
  day: string;
  hour: number;
  predictedEngagement: number;
}[] {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const predictions: { day: string; hour: number; predictedEngagement: number }[] = [];
  
  // Find top 5 time slots
  const topHours = [...historicalData]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);
  
  // Assign to different days
  topHours.forEach((hourData, index) => {
    predictions.push({
      day: days[index % 7],
      hour: hourData.hour,
      predictedEngagement: Math.round(hourData.engagement * 1.1), // Slight optimism
    });
  });
  
  return predictions.sort((a, b) => b.predictedEngagement - a.predictedEngagement);
}

/**
 * Compare demographics between periods
 */
export function compareDemographics(
  current: Demographics,
  previous: Demographics
): {
  ageChange: Record<string, number>;
  geoChange: Record<string, number>;
  interestChange: Record<string, number>;
} {
  const ageChange: Record<string, number> = {};
  const geoChange: Record<string, number> = {};
  const interestChange: Record<string, number> = {};
  
  // Compare age ranges
  current.ageRanges.forEach((currentAge) => {
    const prevAge = previous.ageRanges.find((a) => a.range === currentAge.range);
    if (prevAge) {
      ageChange[currentAge.range] = currentAge.percentage - prevAge.percentage;
    }
  });
  
  // Compare countries
  current.countries.forEach((currentCountry) => {
    const prevCountry = previous.countries.find((c) => c.country === currentCountry.country);
    if (prevCountry) {
      geoChange[currentCountry.country] = currentCountry.percentage - prevCountry.percentage;
    }
  });
  
  // Compare interests
  current.interests.forEach((currentInterest) => {
    const prevInterest = previous.interests.find((i) => i.name === currentInterest.name);
    if (prevInterest) {
      interestChange[currentInterest.name] = currentInterest.score - prevInterest.score;
    }
  });
  
  return { ageChange, geoChange, interestChange };
}
