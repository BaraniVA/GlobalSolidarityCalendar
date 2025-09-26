import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics';

export const useVisitCounter = () => {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to real-time updates first
    const unsubscribe = analyticsService.subscribeToVisitCount((count) => {
      setVisitCount(count);
      setLoading(false);
    });

    // Then increment visit count when component mounts (only once per session)
    const sessionKey = 'visitCounterIncremented';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      analyticsService.incrementVisitCount();
    }

    return unsubscribe;
  }, []);

  return { visitCount, loading };
};