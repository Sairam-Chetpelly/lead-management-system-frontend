'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Clock, User, Calendar, MessageSquare, MapPin, Home } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import ModernLoader from '../ModernLoader';

interface CallLogDetailViewProps {
  callLogId: string;
  onBack: () => void;
}

interface CallLog {
  _id: string;
  userId: { _id: string; name: string; email: string };
  leadId: { _id: string; name: string; contactNumber: string; email: string; leadId: string };
  callDateTime: string;
  callDuration: number;
  callStatus: string;
  callOutcome?: string;
  nextCallDateTime?: string;
  originalLanguageId?: { _id: string; name: string };
  updatedLanguageId?: { _id: string; name: string };
  cifDateTime?: string;
  languageId?: { _id: string; name: string };
  assignedUserId?: { _id: string; name: string; email: string };
  leadValue?: string;
  centerId?: { _id: string; name: string };
  apartmentTypeId?: { _id: string; name: string };
  followUpAction?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CallLogDetailView({ callLogId, onBack }: CallLogDetailViewProps) {
  const [callLog, setCallLog] = useState<CallLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallLogDetails();
  }, [callLogId]);

  const fetchCallLogDetails = async () => {
    try {
      // Since there's no specific endpoint for single call log, we'll use the general endpoint
      const response = await authAPI.leads.getCallLogs({ limit: 1000 });
      const logs = Array.isArray(response.data) ? response.data : response.data.data || [];
      const foundLog = logs.find((log: any) => log._id === callLogId);
      setCallLog(foundLog || null);
    } catch (error) {
      console.error('Error fetching call log details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ModernLoader size="lg" variant="primary" />
      </div>
    );
  }

  if (!callLog) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Call log not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Call Log Details</h1>
              <p className="text-gray-600 mt-1">Comprehensive call information</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-4 py-2 rounded-xl font-semibold ${
              callLog.callStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {callLog.callStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Information */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Phone className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Call Information</h2>
              <p className="text-gray-600">Basic call details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Call Date & Time</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatDateTime(callLog.callDateTime)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-600">Duration</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatDuration(callLog.callDuration)}
                </p>
              </div>
            </div>

            {callLog.callOutcome && (
              <div className="bg-blue-50 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Call Outcome</span>
                <p className="font-semibold text-blue-800 capitalize">
                  {callLog.callOutcome.replace('_', ' ')}
                </p>
              </div>
            )}

            {callLog.followUpAction && (
              <div className="bg-orange-50 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Follow Up Action</span>
                <p className="font-semibold text-orange-800 capitalize">
                  {callLog.followUpAction.replace('_', ' ')}
                </p>
              </div>
            )}

            {callLog.leadValue && (
              <div className="bg-purple-50 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Lead Value</span>
                <p className="font-semibold text-purple-800 capitalize">
                  {callLog.leadValue}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User & Lead Information */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">People Involved</h2>
              <p className="text-gray-600">User and lead details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Caller</span>
              <p className="font-semibold text-green-800">{callLog.userId.name}</p>
              <p className="text-sm text-green-600">{callLog.userId.email}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Lead</span>
              <p className="font-semibold text-blue-800">{callLog.leadId.name}</p>
              <p className="text-sm text-blue-600">{callLog.leadId.contactNumber}</p>
              <p className="text-sm text-blue-600">{callLog.leadId.email}</p>
              <p className="text-xs text-blue-500 font-mono">{callLog.leadId.leadId}</p>
            </div>

            {callLog.assignedUserId && (
              <div className="bg-purple-50 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Assigned User</span>
                <p className="font-semibold text-purple-800">{callLog.assignedUserId.name}</p>
                <p className="text-sm text-purple-600">{callLog.assignedUserId.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Language Information */}
        {(callLog.originalLanguageId || callLog.updatedLanguageId || callLog.languageId) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Language Details</h2>
                <p className="text-gray-600">Language preferences and changes</p>
              </div>
            </div>

            <div className="space-y-4">
              {callLog.originalLanguageId && (
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Original Language</span>
                  <p className="font-semibold text-yellow-800">{callLog.originalLanguageId.name}</p>
                </div>
              )}

              {callLog.updatedLanguageId && (
                <div className="bg-orange-50 p-4 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Updated Language</span>
                  <p className="font-semibold text-orange-800">{callLog.updatedLanguageId.name}</p>
                </div>
              )}

              {callLog.languageId && (
                <div className="bg-red-50 p-4 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Language Preference</span>
                  <p className="font-semibold text-red-800">{callLog.languageId.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location & Property */}
        {(callLog.centerId || callLog.apartmentTypeId) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Location & Property</h2>
                <p className="text-gray-600">Center and property details</p>
              </div>
            </div>

            <div className="space-y-4">
              {callLog.centerId && (
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-indigo-500" />
                    <span className="text-sm font-medium text-gray-600">Center</span>
                  </div>
                  <p className="font-semibold text-indigo-800">{callLog.centerId.name}</p>
                </div>
              )}

              {callLog.apartmentTypeId && (
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Home size={16} className="text-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Apartment Type</span>
                  </div>
                  <p className="font-semibold text-blue-800">{callLog.apartmentTypeId.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scheduling Information */}
        {(callLog.nextCallDateTime || callLog.cifDateTime) && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-xl flex items-center justify-center">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Scheduling Information</h2>
                <p className="text-gray-600">Follow-up and future call scheduling</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {callLog.nextCallDateTime && (
                <div className="bg-pink-50 p-4 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">Next Call Scheduled</span>
                  <p className="font-semibold text-pink-800">
                    {formatDateTime(callLog.nextCallDateTime)}
                  </p>
                </div>
              )}

              {callLog.cifDateTime && (
                <div className="bg-red-50 p-4 rounded-xl">
                  <span className="text-sm font-medium text-gray-600">CIF (Call In Future)</span>
                  <p className="font-semibold text-red-800">
                    {formatDateTime(callLog.cifDateTime)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {callLog.notes && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Call Notes</h2>
                <p className="text-gray-600">Detailed observations and comments</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-gray-800 whitespace-pre-wrap">{callLog.notes}</p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
              <Clock className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Record Timestamps</h2>
              <p className="text-gray-600">Creation and modification history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Created At</span>
              <p className="font-semibold text-gray-800">
                {formatDateTime(callLog.createdAt)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <span className="text-sm font-medium text-gray-600">Last Updated</span>
              <p className="font-semibold text-gray-800">
                {formatDateTime(callLog.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}