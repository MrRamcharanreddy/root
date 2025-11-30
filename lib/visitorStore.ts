import { create } from 'zustand';

interface VisitorData {
  totalVisitors: number;
  todayVisitors: number;
  currentOnline: number;
  pageViews: number;
  lastUpdated: string;
  hourlyData: { hour: number; count: number }[];
  dailyData: { date: string; count: number }[];
}

interface VisitorStore {
  visitors: VisitorData;
  trackVisit: () => void;
  trackPageView: () => void;
  getCurrentOnline: () => number;
  getTodayVisitors: () => number;
  getTotalVisitors: () => number;
  getPageViews: () => number;
  getHourlyData: () => { hour: number; count: number }[];
  getDailyData: () => { date: string; count: number }[];
}

// Load from localStorage
const loadVisitorData = (): VisitorData => {
  if (typeof window === 'undefined') {
    return {
      totalVisitors: 0,
      todayVisitors: 0,
      currentOnline: 0,
      pageViews: 0,
      lastUpdated: new Date().toISOString(),
      hourlyData: [],
      dailyData: [],
    };
  }
  
  try {
    const stored = localStorage.getItem('visitor-analytics');
    if (stored) {
      const data = JSON.parse(stored);
      // Reset today's visitors if it's a new day
      const lastUpdated = new Date(data.lastUpdated);
      const today = new Date();
      if (lastUpdated.toDateString() !== today.toDateString()) {
        data.todayVisitors = 0;
        data.currentOnline = 0;
      }
      return data;
    }
  } catch (error) {
    // Silently fail - visitor analytics are not critical
    // Return default data on error
  }
  
  return {
    totalVisitors: 0,
    todayVisitors: 0,
    currentOnline: 0,
    pageViews: 0,
    lastUpdated: new Date().toISOString(),
    hourlyData: [],
    dailyData: [],
  };
};

// Save to localStorage
const saveVisitorData = (data: VisitorData) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('visitor-analytics', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save visitor data:', error);
  }
};

// Track active sessions (visitors currently on the site)
const activeSessions = new Set<string>();

export const useVisitorStore = create<VisitorStore>((set, get) => {
  const initialData = loadVisitorData();
  
  return {
    visitors: initialData,
    
    trackVisit: () => {
      if (typeof window === 'undefined') return;
      
      const sessionId = `session-${Date.now()}-${Math.random()}`;
      const now = new Date();
      const today = now.toDateString();
      
      // Check if this is a new visitor today
      const lastVisit = localStorage.getItem('last-visit-date');
      const isNewVisitorToday = lastVisit !== today;
      
      set((state) => {
        const updated = {
          ...state.visitors,
          totalVisitors: state.visitors.totalVisitors + (isNewVisitorToday ? 1 : 0),
          todayVisitors: isNewVisitorToday ? state.visitors.todayVisitors + 1 : state.visitors.todayVisitors,
          currentOnline: activeSessions.size + 1,
          lastUpdated: now.toISOString(),
        };
        
        // Update hourly data
        const currentHour = now.getHours();
        const hourlyData = [...updated.hourlyData];
        const hourIndex = hourlyData.findIndex(h => h.hour === currentHour);
        if (hourIndex >= 0) {
          hourlyData[hourIndex].count += 1;
        } else {
          hourlyData.push({ hour: currentHour, count: 1 });
        }
        updated.hourlyData = hourlyData.slice(-24); // Keep last 24 hours
        
        // Update daily data
        const dailyData = [...updated.dailyData];
        const dateStr = now.toISOString().split('T')[0];
        const dayIndex = dailyData.findIndex(d => d.date === dateStr);
        if (dayIndex >= 0) {
          dailyData[dayIndex].count += 1;
        } else {
          dailyData.push({ date: dateStr, count: 1 });
        }
        updated.dailyData = dailyData.slice(-30); // Keep last 30 days
        
        saveVisitorData(updated);
        return { visitors: updated };
      });
      
      localStorage.setItem('last-visit-date', today);
      activeSessions.add(sessionId);
      
      // Remove session after 5 minutes of inactivity
      setTimeout(() => {
        activeSessions.delete(sessionId);
        set((state) => ({
          visitors: {
            ...state.visitors,
            currentOnline: Math.max(0, activeSessions.size),
          },
        }));
      }, 5 * 60 * 1000);
    },
    
    trackPageView: () => {
      if (typeof window === 'undefined') return;
      
      set((state) => {
        const updated = {
          ...state.visitors,
          pageViews: state.visitors.pageViews + 1,
          lastUpdated: new Date().toISOString(),
        };
        saveVisitorData(updated);
        return { visitors: updated };
      });
    },
    
    getCurrentOnline: () => {
      return get().visitors.currentOnline;
    },
    
    getTodayVisitors: () => {
      return get().visitors.todayVisitors;
    },
    
    getTotalVisitors: () => {
      return get().visitors.totalVisitors;
    },
    
    getPageViews: () => {
      return get().visitors.pageViews;
    },
    
    getHourlyData: () => {
      return get().visitors.hourlyData;
    },
    
    getDailyData: () => {
      return get().visitors.dailyData;
    },
  };
});

