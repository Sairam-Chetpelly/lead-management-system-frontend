import { TimelineItem } from '@/services/timelineService';

/**
 * Timeline utility functions for formatting and processing
 */

export const MEDIA_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  videos: ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'],
  audio: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac'],
} as const;

export type FileType = 'image' | 'video' | 'audio' | 'document';
export type TimelineType = 'call' | 'manual';

/**
 * Format relative time from timestamp
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return time.toLocaleDateString();
};

/**
 * Get file type from filename
 */
export const getFileType = (filename: string): FileType => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  if (MEDIA_EXTENSIONS.images.includes(ext as any)) return 'image';
  if (MEDIA_EXTENSIONS.videos.includes(ext as any)) return 'video';
  if (MEDIA_EXTENSIONS.audio.includes(ext as any)) return 'audio';
  
  return 'document';
};

/**
 * Get timeline color classes
 */
export const getTimelineColorClass = (type: TimelineType): string => {
  switch (type) {
    case 'call':
      return 'bg-green-100 border-green-200';
    case 'manual':
      return 'bg-blue-100 border-blue-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};

/**
 * Get activity badge classes
 */
export const getActivityBadgeClass = (type: TimelineType): string => {
  return type === 'call' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-blue-100 text-blue-800';
};

/**
 * Get activity display name
 */
export const getActivityDisplayName = (type: TimelineType): string => {
  return type === 'call' ? 'Phone Call' : 'Manual Activity';
};

/**
 * Calculate timeline statistics
 */
export const calculateTimelineStats = (timeline: TimelineItem[]) => ({
  totalActivities: timeline.length,
  callCount: timeline.filter(item => item.type === 'call').length,
  manualCount: timeline.filter(item => item.type === 'manual').length,
  latestActivity: timeline.length > 0 ? formatRelativeTime(timeline[0].timestamp) : 'None',
});

import { API_ENDPOINTS } from '@/config/apiEndpoints';

/**
 * Generate document URL
 */
export const getDocumentUrl = (document: string): string => {
  return API_ENDPOINTS.LEADS_DOCUMENT(document);
};