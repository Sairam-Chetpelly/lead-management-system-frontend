'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '@/lib/auth';
import { API_ENDPOINTS } from '@/config/apiEndpoints';
import AccessControl from './AccessControl';
import AdminDashboard from './AdminDashboard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardProps {
  user: any;
}

interface WeeklyTrendItem {
  date: string;
  count: number;
}

interface StatusDistributionItem {
  _id: string;
  count: number;
}

interface LeadStats {
  totalLeadsHistorically: number;
  leadsMonthToDate: number;
  todayLeads: number;
  totalCallsHistorically: number;
  callsMTD: number;
  todayCalls: number;
  totalQualifiedHistorically: number;
  qualifiedMTD: number;
  qualifiedToday: number;
  totalLostHistorically?: number;
  lostMTD?: number;
  lostToday?: number;
  mqlPercentage: number;
  dailyMqlPercentage: number;
  dailyLeadTrend: WeeklyTrendItem[];
  dailyCallTrend: WeeklyTrendItem[];
  dailyLeadsVsCalls: { date: string; leads: number; calls: number; }[];
  dailyQualifiedTrend: WeeklyTrendItem[];
  dailyLostTrend: WeeklyTrendItem[];
  // Legacy fields
  totalLeads: number;
  weekLeads: number;
  wonLeads: number;
  lostLeads: number;
  weeklyTrend: WeeklyTrendItem[];
  statusDistribution: StatusDistributionItem[];
  leadValueDistribution?: StatusDistributionItem[];
  sourceDistribution?: StatusDistributionItem[];
  sourceQualifiedDistribution?: StatusDistributionItem[];
  sourceWonDistribution?: StatusDistributionItem[];
  centerDistribution?: StatusDistributionItem[];
  languageDistribution?: StatusDistributionItem[];
  leadSubStatusDistribution?: StatusDistributionItem[];
}

interface PresalesAgent {
  _id: string;
  name: string;
}


export default function Dashboard({ user }: DashboardProps) {
  const getCurrentUserRole = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    return null;
  };

  // Show AdminDashboard for all users
  return <AdminDashboard user={user} />;
}