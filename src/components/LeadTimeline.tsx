'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, MessageSquare, Clock, User, Calendar,
  CheckCircle, AlertCircle, Info, TrendingUp, FileText, Download
} from 'lucide-react';
import { authAPI } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import ModernLoader from './ModernLoader';

interface TimelineItem {
  _id: string;
  type: 'call' | 'manual';
  title: string;
  description: string;
  userId: {
    name: string;
    email: string;
  };
  document?: string;
  timestamp: string;
  createdAt: string;
}

interface LeadTimelineProps {
  leadId: string;
  callLogs: any[];
  activityLogs: any[];
}

export default function LeadTimeline({ leadId, callLogs, activityLogs }: LeadTimelineProps) {
  const { showToast } = useToast();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [leadId, callLogs, activityLogs]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getLeadTimeline(leadId);
      setTimeline(response.data.timeline || []);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      // Fallback to combining local data
      const combinedTimeline = [
        ...callLogs.map(log => ({
          ...log,
          type: 'call' as const,
          title: 'Call Made',
          description: `Call made by ${log.userId?.name || 'Unknown'}`,
          timestamp: log.createdAt
        })),
        ...activityLogs.map(log => ({
          ...log,
          type: log.type,
          title: log.type === 'call' ? 'Call Activity' : 'Manual Activity',
          description: log.comment,
          timestamp: log.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setTimeline(combinedTimeline);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={16} className="text-green-600" />;
      case 'manual':
        return <MessageSquare size={16} className="text-blue-600" />;
      default:
        return <Info size={16} className="text-gray-600" />;
    }
  };

  const getTimelineColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-100 border-green-200';
      case 'manual':
        return 'bg-blue-100 border-blue-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ModernLoader size="md" variant="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
            <p className="text-sm text-gray-600">
              {timeline.length} activities • Latest activity {timeline.length > 0 ? formatRelativeTime(timeline[0].timestamp) : 'None'}
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {timeline.filter(item => item.type === 'call').length}
            </div>
            <div className="text-xs text-gray-500">Calls</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {timeline.filter(item => item.type === 'manual').length}
            </div>
            <div className="text-xs text-gray-500">Activities</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-transparent"></div>
          
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <div key={item._id} className="relative flex items-start space-x-4">
                {/* Timeline Dot */}
                <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl border-2 ${getTimelineColor(item.type)} shadow-lg`}>
                  {getTimelineIcon(item.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                          <User size={14} />
                          <span>{item.userId?.name || 'Unknown User'}</span>
                          <span>•</span>
                          <Calendar size={14} />
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {/* Relative Time Badge */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-gray-700 leading-relaxed mb-3">
                      {item.description}
                    </div>
                    
                    {item.document && (() => {
                      const ext = item.document.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                      const isVideo = ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext);
                      const isAudio = ['mp3', 'wav', 'ogg', 'aac'].includes(ext);
                      
                      if (isImage || isVideo || isAudio) {
                        return (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {isImage && (
                              <img 
                                src={`/api/leads/document/${item.document}`} 
                                alt={item.document}
                                className="max-w-sm max-h-64 object-contain rounded border mb-2"
                              />
                            )}
                            {isVideo && (
                              <video 
                                controls 
                                className="max-w-sm max-h-64 rounded border mb-2"
                              >
                                <source src={`/api/leads/document/${item.document}`} type={`video/${ext}`} />
                              </video>
                            )}
                            {isAudio && (
                              <audio controls className="w-full max-w-sm mb-2">
                                <source src={`/api/leads/document/${item.document}`} type={`audio/${ext}`} />
                              </audio>
                            )}
                            <div className="flex items-center space-x-2">
                              <FileText size={16} className="text-blue-600" />
                              <a 
                                href={`/api/leads/document/${item.document}`}
                                download
                                className="text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center space-x-1"
                              >
                                <Download size={14} />
                                <span>Download</span>
                              </a>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FileText size={16} className="text-blue-600" />
                          <a 
                            href={`/api/leads/document/${item.document}`}
                            download
                            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center space-x-1"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                        </div>
                      );
                    })()}
                    
                    {/* Activity Type Badge */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        item.type === 'call' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.type === 'call' ? 'Phone Call' : 'Manual Activity'}
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
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-gray-600 mb-6">
            This lead doesn't have any recorded activities. Start by making a call or adding a manual activity.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <PhoneCall size={16} className="text-green-500" />
              <span>Make calls to track interactions</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MessageSquare size={16} className="text-blue-500" />
              <span>Add manual activities for notes</span>
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
}