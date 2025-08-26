'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PhoneCall,
  MessageSquare,
  Clock,
  User,
  Calendar,
  Info,
  FileText,
  Download,
} from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { timelineService, TimelineItem as ServiceTimelineItem } from '@/services/timelineService';
import {
  formatRelativeTime,
  getFileType,
  getTimelineColorClass,
  getActivityBadgeClass,
  getActivityDisplayName,
  calculateTimelineStats,
  getDocumentUrl,
  MEDIA_EXTENSIONS,
} from '@/utils/timelineUtils';
import { useToast } from '@/contexts/ToastContext';
import ModernLoader from './ModernLoader';
import { ErrorBoundary } from './ErrorBoundary';

// Types
interface User {
  name: string;
  email: string;
}

// Use the service interface
type TimelineItem = ServiceTimelineItem;

interface CallLog {
  _id: string;
  userId: User;
  createdAt: string;
  [key: string]: any;
}

interface ActivityLog {
  _id: string;
  type: 'call' | 'manual';
  comment: string;
  userId: User;
  createdAt: string;
  [key: string]: any;
}

interface LeadTimelineProps {
  leadId: string;
  callLogs: CallLog[];
  activityLogs: ActivityLog[];
}

type TimelineType = 'call' | 'manual';
type FileExtension = string;



export default function LeadTimeline({ leadId, callLogs, activityLogs }: LeadTimelineProps) {
  const { showToast } = useToast();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized fallback timeline from props
  const fallbackTimeline = useMemo(() => {
    const combined = [
      ...callLogs.map((log): TimelineItem => ({
        ...log,
        type: 'call' as const,
        title: 'Call Made',
        description: `Call made by ${log.userId?.name || 'Unknown User'}`,
        timestamp: log.createdAt,
      })),
      ...activityLogs.map((log): TimelineItem => ({
        ...log,
        type: log.type,
        title: log.type === 'call' ? 'Call Activity' : 'Manual Activity',
        description: log.comment || 'No description provided',
        timestamp: log.createdAt,
      })),
    ];
    
    return combined.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [callLogs, activityLogs]);

  // Fetch timeline with proper error handling using service
  const fetchTimeline = useCallback(async () => {
    if (!leadId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await timelineService.getLeadTimeline(leadId);
      const timelineData = response.data?.timeline || [];
      
      if (timelineData.length > 0) {
        setTimeline(timelineData);
      } else {
        setTimeline(fallbackTimeline);
      }
    } catch (err) {
      console.error('Timeline fetch error:', err);
      setTimeline(fallbackTimeline);
    } finally {
      setLoading(false);
    }
  }, [leadId, fallbackTimeline]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Refresh timeline when callLogs or activityLogs change
  useEffect(() => {
    if (leadId) {
      timelineService.clearCache(leadId);
      fetchTimeline();
    }
  }, [callLogs.length, activityLogs.length, leadId, fetchTimeline]);

  // Helper functions
  const getTimelineIcon = useCallback((type: 'call' | 'manual') => {
    const iconProps = { size: 16 };
    
    switch (type) {
      case 'call':
        return <PhoneCall {...iconProps} className="text-green-600" />;
      case 'manual':
        return <MessageSquare {...iconProps} className="text-blue-600" />;
      default:
        return <Info {...iconProps} className="text-gray-600" />;
    }
  }, []);

  // Memoized statistics using utility function
  const timelineStats = useMemo(() => calculateTimelineStats(timeline), [timeline]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <ModernLoader size="md" variant="primary" />
      </div>
    );
  }

  // Error state with retry option
  if (error && timeline.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <Info size={24} className="sm:w-8 sm:h-8 text-red-500" />
        </div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Failed to Load Timeline</h3>
        <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">{error}</p>
        <button
          onClick={() => {
            timelineService.clearCache(leadId);
            fetchTimeline();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
          aria-label="Retry loading timeline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error('LeadTimeline Error:', error);
        showToast('Timeline component encountered an error', 'error');
      }}
    >
      <div className="space-y-4 sm:space-y-6">
      {/* Timeline Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Activity Timeline</h3>
              <p className="text-sm text-gray-600">
                {timelineStats.totalActivities} activities • Latest activity {timelineStats.latestActivity}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center space-x-6">
            <div className="text-center bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-lg font-bold text-green-600">
                {timelineStats.callCount}
              </div>
              <div className="text-xs text-gray-500">Calls</div>
            </div>
            <div className="text-center bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="text-lg font-bold text-blue-600">
                {timelineStats.manualCount}
              </div>
              <div className="text-xs text-gray-500">Activities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-transparent"></div>
          
          <div className="space-y-4 sm:space-y-6">
            {timeline.map((item, index) => (
              <div key={item._id} className="relative flex items-start space-x-3 sm:space-x-4">
                {/* Timeline Dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 ${getTimelineColorClass(item.type)} shadow-lg`}>
                  {getTimelineIcon(item.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-200 p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900">
                          {item.title}
                        </h4>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-col space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <User size={14} className="text-blue-600" />
                            <span className="font-medium text-gray-900">{item.userId?.name || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={14} className="text-purple-600" />
                            <span className="text-gray-600">{new Date(item.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border-l-4 border-blue-400 mb-3">
                      <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                    </div>
                    
                    {item.document && (() => {
                      const fileType = getFileType(item.document);
                      const ext = item.document.split('.').pop()?.toLowerCase() || '';
                      const documentUrl = getDocumentUrl(item.document);
                      
                      const MediaPreview = () => {
                        switch (fileType) {
                          case 'image':
                            return (
                              <img 
                                src={documentUrl}
                                alt={item.document}
                                className="w-full max-w-full sm:max-w-sm max-h-48 sm:max-h-64 object-contain rounded border mb-2"
                                loading="lazy"
                              />
                            );
                          case 'video':
                            return (
                              <video 
                                controls 
                                className="w-full max-w-full sm:max-w-sm max-h-48 sm:max-h-64 rounded border mb-2"
                                preload="metadata"
                              >
                                <source src={documentUrl} type={`video/${ext}`} />
                                Your browser does not support video playback.
                              </video>
                            );
                          case 'audio':
                            return (
                              <audio controls className="w-full max-w-full sm:max-w-sm mb-2" preload="metadata">
                                <source src={documentUrl} type={`audio/${ext}`} />
                                Your browser does not support audio playback.
                              </audio>
                            );
                          default:
                            return null;
                        }
                      };
                      
                      return (
                        <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          <div className="w-full overflow-hidden">
                            <MediaPreview />
                          </div>
                          <div className="flex items-center space-x-2 flex-wrap">
                            <FileText size={14} className="sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                            <a 
                              href={documentUrl}
                              download={item.document}
                              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center space-x-1 transition-colors min-w-0 flex-1"
                              aria-label={`Download ${item.document}`}
                            >
                              <Download size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span className="truncate">Download {item.document}</span>
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Activity Type Badge */}
                    <div className="mt-3 sm:mt-4 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium capitalize ${getActivityBadgeClass(item.type)}`}>
                        {getActivityDisplayName(item.type)}
                      </span>
                      
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Latest
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock size={24} className="sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
            This lead doesn't have any recorded activities. Start by making a call or adding a manual activity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
              <PhoneCall size={14} className="sm:w-4 sm:h-4 text-green-500" />
              <span>Make calls to track interactions</span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
              <MessageSquare size={14} className="sm:w-4 sm:h-4 text-blue-500" />
              <span>Add manual activities for notes</span>
            </div>
          </div>
        </div>
      )}
      

      </div>
    </ErrorBoundary>
  );
}