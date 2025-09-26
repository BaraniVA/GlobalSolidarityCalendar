import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { db, MOCK_MODE } from '../config/firebase';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private visitCount: number = 0;
  private listeners: ((count: number) => void)[] = [];

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  async incrementVisitCount(): Promise<void> {
    if (MOCK_MODE) {
      this.visitCount += 1;
      this.notifyListeners(this.visitCount);
      return;
    }

    try {
      const counterRef = doc(db, 'analytics', 'visitCounter');
      const counterSnap = await getDoc(counterRef);

      if (counterSnap.exists()) {
        await updateDoc(counterRef, {
          count: increment(1),
          lastUpdated: new Date()
        });
      } else {
        await setDoc(counterRef, {
          count: 1,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      console.error('Error incrementing visit count:', error);
    }
  }

  subscribeToVisitCount(callback: (count: number) => void): () => void {
    this.listeners.push(callback);

    if (MOCK_MODE) {
      callback(this.visitCount);
      return () => {
        this.listeners = this.listeners.filter(listener => listener !== callback);
      };
    }

    const counterRef = doc(db, 'analytics', 'visitCounter');

    const unsubscribe = onSnapshot(counterRef, (doc) => {
      if (doc.exists()) {
        const count = doc.data().count || 0;
        callback(count);
      } else {
        callback(0);
      }
    }, (error) => {
      console.error('Error listening to visit count:', error);
    });

    return () => {
      unsubscribe();
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(count: number): void {
    this.listeners.forEach(listener => listener(count));
  }
}

export const analyticsService = AnalyticsService.getInstance();