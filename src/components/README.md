# LeadTimeline Component

## Overview
The LeadTimeline component displays a chronological timeline of activities for a specific lead, including calls and manual activities with proper file attachments support.

## Features
- ✅ **Proper TypeScript interfaces** with strict typing
- ✅ **Dedicated API service** with caching and error handling
- ✅ **Utility functions** for better code organization
- ✅ **Error boundary** for graceful error handling
- ✅ **Responsive design** with modern UI components
- ✅ **Media preview** for images, videos, and audio files
- ✅ **Accessibility** with proper ARIA labels and keyboard navigation
- ✅ **Performance optimization** with memoization and lazy loading

## Architecture

### File Structure
```
src/
├── components/
│   ├── LeadTimeline.tsx          # Main timeline component
│   ├── ErrorBoundary.tsx         # Error boundary wrapper
│   └── ModernLoader.tsx          # Loading component
├── services/
│   └── timelineService.ts        # API service with caching
├── utils/
│   └── timelineUtils.ts          # Utility functions
└── lib/
    ├── api.ts                    # Base API configuration
    └── auth.ts                   # Authentication API
```

### Key Improvements

#### 1. **TypeScript Interfaces**
```typescript
interface TimelineItem {
  _id: string;
  type: 'call' | 'manual';
  title: string;
  description: string;
  userId: User;
  document?: string;
  timestamp: string;
  createdAt: string;
}
```

#### 2. **API Service with Caching**
```typescript
class TimelineService {
  private cache = new Map<string, { data: TimelineItem[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  async getLeadTimeline(leadId: string, forceRefresh = false): Promise<ApiResponse<{ timeline: TimelineItem[] }>>
}
```

#### 3. **Utility Functions**
- `formatRelativeTime()` - Format timestamps to relative time
- `getFileType()` - Determine file type from extension
- `calculateTimelineStats()` - Calculate timeline statistics
- `getDocumentUrl()` - Generate document URLs

#### 4. **Error Handling**
- API error handling with fallback data
- Error boundary for component-level errors
- Toast notifications for user feedback
- Retry functionality with cache clearing

## Usage

```tsx
import LeadTimeline from '@/components/LeadTimeline';

<LeadTimeline 
  leadId="lead-id-123"
  callLogs={callLogs}
  activityLogs={activityLogs}
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `leadId` | `string` | Unique identifier for the lead |
| `callLogs` | `CallLog[]` | Array of call log entries |
| `activityLogs` | `ActivityLog[]` | Array of activity log entries |

## API Endpoints

- `GET /api/leads/{leadId}/timeline` - Fetch timeline data
- `GET /api/leads/document/{filename}` - Download document

## Performance Optimizations

1. **Memoization** - Statistics and utility functions are memoized
2. **Lazy Loading** - Images are loaded lazily
3. **Caching** - API responses are cached for 5 minutes
4. **Error Recovery** - Fallback to cached data during API errors

## Accessibility

- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly structure
- Focus management for retry buttons

## Browser Support

- Modern browsers with ES2020+ support
- Responsive design for mobile and desktop
- Progressive enhancement for media features