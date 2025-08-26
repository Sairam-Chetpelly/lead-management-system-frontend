import api from '@/lib/api';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import { User } from '@/types/lead';

export interface TimelineItem {
  _id: string;
  type: 'call' | 'manual';
  title: string;
  description: string;
  userId: User;
  document?: string;
  timestamp: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  error?: string;
}

export interface TimelineStats {
  totalActivities: number;
  callCount: number;
  manualCount: number;
  latestActivity: string | null;
}

/**
 * Timeline Service - Handles all timeline-related API operations
 */
export class TimelineService {
  private static instance: TimelineService;
  private cache = new Map<string, { data: TimelineItem[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TimelineService {
    if (!TimelineService.instance) {
      TimelineService.instance = new TimelineService();
    }
    return TimelineService.instance;
  }

  /**
   * Get timeline for a specific lead with caching
   */
  async getLeadTimeline(leadId: string, forceRefresh = false): Promise<ApiResponse<{ timeline: TimelineItem[] }>> {
    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    const cacheKey = `timeline_${leadId}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if available and not expired
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        data: { timeline: cached.data },
        success: true,
        message: 'Timeline retrieved from cache',
      };
    }

    try {
      const response = await api.get(API_ENDPOINTS.LEADS_TIMELINE(leadId));
      
      const timeline = response.data?.timeline || [];
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: timeline,
        timestamp: Date.now(),
      });

      return {
        data: { timeline },
        success: true,
        message: 'Timeline retrieved successfully',
      };
    } catch (error) {
      console.error('Timeline API Error:', error);
      
      // Return cached data if available during error
      if (cached) {
        return {
          data: { timeline: cached.data },
          success: false,
          message: 'Using cached data due to API error',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      throw error;
    }
  }

  /**
   * Clear cache for a specific lead or all cache
   */
  clearCache(leadId?: string): void {
    if (leadId) {
      this.cache.delete(`timeline_${leadId}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Refresh timeline data
   */
  async refreshTimeline(leadId: string): Promise<ApiResponse<{ timeline: TimelineItem[] }>> {
    return this.getLeadTimeline(leadId, true);
  }
}

// Export singleton instance
export const timelineService = TimelineService.getInstance();