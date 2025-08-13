import { API_CONFIG } from './api';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  
  // Users
  USERS: '/api/users',
  USER_BY_ID: (id: string) => `/api/users/${id}`,
  
  // Leads
  LEADS: '/api/leads',
  LEAD_BY_ID: (id: string) => `/api/leads/${id}`,
  LEAD_DETAILS: (id: string) => `/api/leads/${id}/details`,
  
  // Lead Sources
  LEAD_SOURCES: '/api/lead-sources',
  LEAD_SOURCE_BY_ID: (id: string) => `/api/lead-sources/${id}`,
  
  // Call Logs
  CALL_LOGS: '/api/call-logs',
  CALL_LOG_BY_ID: (id: string) => `/api/call-logs/${id}`,
  CALL_LOGS_BY_LEAD: (leadId: string) => `/api/call-logs/lead/${leadId}`,
  
  // Lead Activities
  LEAD_ACTIVITIES: '/api/lead-activities',
  LEAD_ACTIVITY_BY_ID: (id: string) => `/api/lead-activities/${id}`,
  LEAD_ACTIVITIES_BY_LEAD: (leadId: string) => `/api/lead-activities/lead/${leadId}`,
  
  // Project House Types
  PROJECT_HOUSE_TYPES: '/api/project-house-types',
  PROJECT_HOUSE_TYPE_BY_ID: (id: string) => `/api/project-house-types/${id}`,
  
  // Admin
  ADMIN_ROLES: '/api/admin/roles',
  ADMIN_CENTRES: '/api/admin/centres',
  ADMIN_LANGUAGES: '/api/admin/languages',
  ADMIN_STATUSES: '/api/admin/statuses',
};

// Helper function to get full URL
export const getFullUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`;