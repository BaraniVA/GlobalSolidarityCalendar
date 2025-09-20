import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, auth, MOCK_MODE } from '../config/firebase';
import { Event, EventFilters, Report, TransparencyLogEntry } from '../types';
import { format, addDays, addHours } from 'date-fns';

// Mock data (fallback)
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Global Day of Action for Palestine',
    description: 'Join thousands worldwide in a coordinated day of action calling for justice and peace in Palestine. This peaceful demonstration will feature speakers from various organizations.',
    date: format(addDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm"),
    location: { city: 'London', country: 'United Kingdom' },
    type: 'protest',
    sourceLink: 'https://example-org.com/global-day-action',
    organizer: 'Palestine Solidarity Campaign',
    status: 'approved',
    verified: true,
    createdBy: 'mock-user-id',
    createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  },
  {
    id: '2',
    title: 'Palestinian Film Festival Screening',
    description: 'Experience powerful Palestinian cinema with a screening of award-winning films followed by a panel discussion with filmmakers and cultural experts.',
    date: format(addDays(new Date(), 8), "yyyy-MM-dd'T'HH:mm"),
    location: { city: 'New York', country: 'United States' },
    type: 'cultural',
    sourceLink: 'https://example-cultural-center.com/film-festival',
    organizer: 'Middle East Cultural Center',
    status: 'approved',
    verified: true,
    createdBy: 'user-2',
    createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  },
  {
    id: '3',
    title: 'History of Palestine: Educational Workshop',
    description: 'Learn about Palestinian history, culture, and the ongoing struggle for justice through an interactive workshop led by historians and educators.',
    date: format(addDays(new Date(), 12), "yyyy-MM-dd'T'HH:mm"),
    location: { city: 'Toronto', country: 'Canada' },
    type: 'educational',
    sourceLink: 'https://example-university.edu/palestine-workshop',
    organizer: 'University Peace Coalition',
    status: 'approved',
    verified: false,
    createdBy: 'user-3',
    createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  },
  {
    id: '4',
    title: 'Virtual Solidarity Concert',
    description: 'A digital event featuring Palestinian and international musicians performing in solidarity. Stream live from multiple locations worldwide.',
    date: format(addHours(addDays(new Date(), 3), 2), "yyyy-MM-dd'T'HH:mm"),
    location: { city: 'Online', country: 'Global' },
    type: 'digital',
    sourceLink: 'https://example-music-collective.com/virtual-concert',
    organizer: 'Artists for Palestine',
    status: 'approved',
    verified: true,
    createdBy: 'user-4',
    createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  },
  {
    id: '5',
    title: 'Community Iftar & Solidarity Gathering',
    description: 'Join us for a community iftar (breaking fast) followed by discussions on Palestinian solidarity and ways to support the cause.',
    date: format(addDays(new Date(), 15), "yyyy-MM-dd'T'HH:mm"),
    location: { city: 'Berlin', country: 'Germany' },
    type: 'cultural',
    sourceLink: 'https://example-mosque.org/iftar-solidarity',
    organizer: 'Islamic Center Berlin',
    status: 'pending',
    verified: false,
    createdBy: 'user-5',
    createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  }
];

let mockReports: Report[] = [];
const mockTransparencyLog: TransparencyLogEntry[] = [
  {
    id: 'log-1',
    eventId: '1',
    action: 'rejected',
    reason: 'Event content violates community guidelines',
    moderatorId: 'moderator-id',
    createdAt: new Date().toISOString()
  }
];

// Mock events service (fallback)
class MockEventsService {
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    let filteredEvents = mockEvents.filter(event => event.status === 'approved');

    if (filters) {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(search) ||
          event.description.toLowerCase().includes(search) ||
          event.location.city.toLowerCase().includes(search) ||
          event.location.country.toLowerCase().includes(search)
        );
      }

      if (filters.location) {
        filteredEvents = filteredEvents.filter(event =>
          event.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          event.location.country.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.type && filters.type !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.type === filters.type);
      }
    }

    return filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getEvent(id: string): Promise<Event | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockEvents.find(event => event.id === id) || null;
  }

  async submitEvent(eventData: Omit<Event, 'id' | 'status' | 'verified' | 'createdBy' | 'createdAt'>, userId: string): Promise<Event> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newEvent: Event = {
      ...eventData,
      id: 'event-' + Date.now(),
      status: 'pending',
      verified: false,
      createdBy: userId,
      createdAt: new Date().toISOString()
    };

    mockEvents.push(newEvent);
    return newEvent;
  }

  async getPendingEvents(): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockEvents.filter(event => event.status === 'pending');
  }

  async approveEvent(eventId: string, verified: boolean = false): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const event = mockEvents.find(e => e.id === eventId);
    if (event) {
      event.status = 'approved';
      event.verified = verified;
    }
  }

  async rejectEvent(eventId: string, reason: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const event = mockEvents.find(e => e.id === eventId);
    if (event) {
      event.status = 'rejected';

      // Add to transparency log
      mockTransparencyLog.push({
        id: 'log-' + Date.now(),
        eventId,
        action: 'rejected',
        reason,
        moderatorId: 'moderator-id',
        createdAt: new Date().toISOString()
      });
    }
  }

  async reportEvent(eventId: string, reason: Report['reason']): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));

    mockReports.push({
      id: 'report-' + Date.now(),
      eventId,
      reportedBy: 'current-user-id',
      reason,
      createdAt: new Date().toISOString()
    });
  }

  async getTransparencyLog(): Promise<TransparencyLogEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTransparencyLog.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getReportedEvents(): Promise<{ event: Event; reports: Report[] }[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Group reports by eventId
    const reportsByEvent: { [eventId: string]: Report[] } = {};
    mockReports.forEach(report => {
      if (!reportsByEvent[report.eventId]) {
        reportsByEvent[report.eventId] = [];
      }
      reportsByEvent[report.eventId].push(report);
    });

    // Get events that have reports
    const reportedEvents: { event: Event; reports: Report[] }[] = [];
    Object.keys(reportsByEvent).forEach(eventId => {
      const event = mockEvents.find(e => e.id === eventId);
      if (event) {
        reportedEvents.push({
          event,
          reports: reportsByEvent[eventId]
        });
      }
    });

    return reportedEvents;
  }

  async removeEvent(eventId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove the event from mock data
    const eventIndex = mockEvents.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      mockEvents.splice(eventIndex, 1);
    }

    // Remove all reports for this event
    mockReports = mockReports.filter(r => r.eventId !== eventId);

    // Add to transparency log
    mockTransparencyLog.push({
      id: 'log-' + Date.now(),
      eventId,
      action: 'removed',
      reason: 'Event removed due to reports',
      moderatorId: 'moderator-id',
      createdAt: new Date().toISOString()
    });
  }

  async dismissReport(reportId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Remove the specific report
    mockReports = mockReports.filter(r => r.id !== reportId);
  }
}

// Firebase events service
class FirebaseEventsService {
  private eventsCollection = collection(db, 'events');
  private reportsCollection = collection(db, 'reports');
  private transparencyLogCollection = collection(db, 'transparencyLog');

  async getEvents(filters?: EventFilters): Promise<Event[]> {
    try {
      console.log('FirebaseEventsService: getEvents called with filters:', filters);
      console.log('FirebaseEventsService: Current user authenticated:', !!auth.currentUser);
      console.log('FirebaseEventsService: Current user:', auth.currentUser?.email || 'No user');

      if (!auth.currentUser) {
        console.warn('FirebaseEventsService: No authenticated user - this may affect Firestore queries');
      }

      const q = query(
        this.eventsCollection,
        where('status', '==', 'approved'),
        orderBy('date', 'asc')
      );

      console.log('FirebaseEventsService: Executing query for approved events...');
      console.log('FirebaseEventsService: Query details:', {
        collection: 'events',
        where: 'status == approved',
        orderBy: 'date asc'
      });

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
      } catch (queryError) {
        console.error('FirebaseEventsService: Composite query failed:', queryError);
        console.log('FirebaseEventsService: Trying simple query without orderBy...');

        // Try simple query without orderBy
        try {
          const simpleQuery = query(
            this.eventsCollection,
            where('status', '==', 'approved')
          );
          querySnapshot = await getDocs(simpleQuery);
          console.log('FirebaseEventsService: Simple query returned', querySnapshot.size, 'documents');
        } catch (simpleQueryError) {
          console.error('FirebaseEventsService: Simple query also failed:', simpleQueryError);
          throw simpleQueryError;
        }
      }
      console.log('FirebaseEventsService: Query completed successfully');
      console.log('FirebaseEventsService: Query returned', querySnapshot.size, 'documents');

      if (querySnapshot.size === 0) {
        console.log('FirebaseEventsService: No approved events found with composite query. Trying fallback...');

        // Fallback: Get all events and filter client-side
        try {
          const allEventsQuery = query(this.eventsCollection);
          const allSnapshot = await getDocs(allEventsQuery);
          console.log('FirebaseEventsService: Fallback query returned', allSnapshot.size, 'total documents');

          const fallbackEvents: Event[] = [];
          allSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'approved') {
              console.log('FirebaseEventsService: Found approved event in fallback:', doc.id, data.title);
              try {
                const event: Event = {
                  id: doc.id,
                  ...data,
                  createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                  date: data.date?.toDate?.()?.toISOString() || data.date
                } as Event;
                fallbackEvents.push(event);
              } catch (processError) {
                console.error('FirebaseEventsService: Error processing fallback event', doc.id, ':', processError);
              }
            }
          });

          console.log('FirebaseEventsService: Fallback found', fallbackEvents.length, 'approved events');
          if (fallbackEvents.length > 0) {
            // Sort by date
            fallbackEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            return fallbackEvents;
          }
        } catch (fallbackError) {
          console.error('FirebaseEventsService: Fallback query failed:', fallbackError);
        }
      }

      let events: Event[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('FirebaseEventsService: Processing event:', {
          id: doc.id,
          title: data.title,
          status: data.status,
          verified: data.verified,
          date: data.date
        });

        try {
          const event: Event = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            date: data.date?.toDate?.()?.toISOString() || data.date
          } as Event;
          events.push(event);
          console.log('FirebaseEventsService: Successfully processed event:', doc.id);
        } catch (processError) {
          console.error('FirebaseEventsService: Error processing event', doc.id, ':', processError);
        }
      });

      console.log('FirebaseEventsService: Total approved events processed:', events.length);

      // Apply client-side filters
      if (filters) {
        if (filters.search) {
          const search = filters.search.toLowerCase();
          events = events.filter(event =>
            event.title.toLowerCase().includes(search) ||
            event.description.toLowerCase().includes(search) ||
            event.location.city.toLowerCase().includes(search) ||
            event.location.country.toLowerCase().includes(search)
          );
        }

        if (filters.location) {
          events = events.filter(event =>
            event.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
            event.location.country.toLowerCase().includes(filters.location.toLowerCase())
          );
        }

        if (filters.type && filters.type !== 'all') {
          events = events.filter(event => event.type === filters.type);
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getEvent(id: string): Promise<Event | null> {
    try {
      const docRef = doc(this.eventsCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          date: data.date?.toDate?.()?.toISOString() || data.date // Convert Timestamp to string
        } as Event;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  async submitEvent(eventData: Omit<Event, 'id' | 'status' | 'verified' | 'createdBy' | 'createdAt'>, userId: string): Promise<Event> {
    try {
      console.log('SubmitEvent: Starting event submission');
      console.log('SubmitEvent: Current user:', auth.currentUser?.email);
      console.log('SubmitEvent: Current user UID:', auth.currentUser?.uid);
      
      if (!auth.currentUser) {
        console.error('SubmitEvent: No authenticated user found');
        throw new Error('User must be authenticated to submit events');
      }

      console.log('SubmitEvent: User authenticated, UID:', auth.currentUser.uid);

      const newEvent = {
        ...eventData,
        status: 'pending',
        verified: false,
        createdBy: userId,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(eventData.date)) // Convert string to Timestamp
      };

      console.log('SubmitEvent: Event data to submit:', JSON.stringify(newEvent, null, 2));
      console.log('SubmitEvent: Events collection reference:', this.eventsCollection);

      console.log('SubmitEvent: Attempting to add document to Firestore...');
      const docRef = await addDoc(this.eventsCollection, newEvent);
      console.log('SubmitEvent: Event submitted successfully, doc ID:', docRef.id);

      return {
        id: docRef.id,
        ...eventData,
        status: 'pending',
        verified: false,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('SubmitEvent: Error submitting event:', error);
      const err = error as Error;
      console.error('SubmitEvent: Error details:', {
        message: err.message,
        code: (err as { code?: string }).code,
        stack: err.stack
      });
      throw error;
    }
  }

  async getPendingEvents(): Promise<Event[]> {
    try {
      console.log('FirebaseEventsService: Starting getPendingEvents query');
      
      // First try the composite query
      try {
        const q = query(
          this.eventsCollection,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );

        console.log('FirebaseEventsService: Executing composite query...');
        const querySnapshot = await getDocs(q);
        console.log('FirebaseEventsService: Composite query successful, docs count:', querySnapshot.size);

        const events: Event[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('FirebaseEventsService: Processing doc:', doc.id, 'status:', data.status);
          events.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            date: data.date?.toDate?.()?.toISOString() || data.date
          } as Event);
        });

        return events;
      } catch (compositeError) {
        console.warn('FirebaseEventsService: Composite query failed, trying fallback:', compositeError);
        
        // Fallback: get all events and filter client-side
        console.log('FirebaseEventsService: Trying fallback query (all events)...');
        const allQuery = query(this.eventsCollection);
        const allSnapshot = await getDocs(allQuery);
        console.log('FirebaseEventsService: All events query successful, docs count:', allSnapshot.size);

        const events: Event[] = [];
        allSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'pending') {
            console.log('FirebaseEventsService: Found pending event:', doc.id);
            events.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              date: data.date?.toDate?.()?.toISOString() || data.date
            } as Event);
          }
        });

        // Sort by createdAt descending
        events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        console.log('FirebaseEventsService: Returning filtered events:', events.length);
        return events;
      }
    } catch (error) {
      console.error('FirebaseEventsService: Error in getPendingEvents:', error);
      throw error;
    }
  }  async approveEvent(eventId: string, verified: boolean = false): Promise<void> {
    try {
      console.log('FirebaseEventsService: approveEvent called for eventId:', eventId, 'verified:', verified);
      const eventRef = doc(this.eventsCollection, eventId);
      await updateDoc(eventRef, {
        status: 'approved',
        verified
      });
      console.log('FirebaseEventsService: Event', eventId, 'successfully approved');
    } catch (error) {
      console.error('FirebaseEventsService: Error approving event:', error);
      throw error;
    }
  }

  async rejectEvent(eventId: string, reason: string): Promise<void> {
    try {
      const eventRef = doc(this.eventsCollection, eventId);
      await updateDoc(eventRef, {
        status: 'rejected'
      });

      // Add to transparency log
      await addDoc(this.transparencyLogCollection, {
        eventId,
        action: 'rejected',
        reason,
        moderatorId: 'moderator-id', // This should come from auth service
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error rejecting event:', error);
      throw error;
    }
  }

  async reportEvent(eventId: string, reason: Report['reason']): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to report events');
      }

      await addDoc(this.reportsCollection, {
        eventId,
        reportedBy: auth.currentUser.uid,
        reason,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error reporting event:', error);
      throw error;
    }
  }

  async getTransparencyLog(): Promise<TransparencyLogEntry[]> {
    try {
      const q = query(
        this.transparencyLogCollection,
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const logs: TransparencyLogEntry[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        } as TransparencyLogEntry);
      });

      return logs;
    } catch (error) {
      console.error('Error fetching transparency log:', error);
      throw error;
    }
  }

  async getReportedEvents(): Promise<{ event: Event; reports: Report[] }[]> {
    try {
      // Get all reports
      const reportsQuery = query(
        this.reportsCollection,
        orderBy('createdAt', 'desc')
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      
      // Group reports by eventId
      const reportsByEvent: { [eventId: string]: Report[] } = {};
      reportsSnapshot.forEach((doc) => {
        const report = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        } as Report;
        
        if (!reportsByEvent[report.eventId]) {
          reportsByEvent[report.eventId] = [];
        }
        reportsByEvent[report.eventId].push(report);
      });

      // Get unique event IDs
      const eventIds = Object.keys(reportsByEvent);
      
      if (eventIds.length === 0) {
        return [];
      }

      // Fetch events for these IDs
      const eventsQuery = query(
        this.eventsCollection,
        where('__name__', 'in', eventIds.slice(0, 10)) // Firestore 'in' query limit is 10
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      const reportedEvents: { event: Event; reports: Report[] }[] = [];
      eventsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        const event: Event = {
          id: doc.id,
          ...eventData,
          createdAt: eventData.createdAt?.toDate?.()?.toISOString() || eventData.createdAt,
          date: eventData.date?.toDate?.()?.toISOString() || eventData.date
        } as Event;
        
        reportedEvents.push({
          event,
          reports: reportsByEvent[doc.id] || []
        });
      });

      return reportedEvents;
    } catch (error) {
      console.error('Error fetching reported events:', error);
      throw error;
    }
  }

  async removeEvent(eventId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to remove events');
      }

      // Delete the event document
      await deleteDoc(doc(this.eventsCollection, eventId));

      // Also delete all reports for this event
      const reportsQuery = query(
        this.reportsCollection,
        where('eventId', '==', eventId)
      );
      const reportsSnapshot = await getDocs(reportsQuery);
      const deletePromises = reportsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Log the action in transparency log
      await addDoc(this.transparencyLogCollection, {
        eventId,
        action: 'removed',
        reason: 'Event removed due to reports',
        moderatorId: auth.currentUser.uid,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error removing event:', error);
      throw error;
    }
  }

  async dismissReport(reportId: string): Promise<void> {
    try {
      if (!auth.currentUser) {
        throw new Error('User must be authenticated to dismiss reports');
      }

      // Delete the specific report
      await deleteDoc(doc(this.reportsCollection, reportId));
    } catch (error) {
      console.error('Error dismissing report:', error);
      throw error;
    }
  }
}

// Use Firebase service if configured, otherwise use mock service
export const eventsService = MOCK_MODE ? new MockEventsService() : new FirebaseEventsService();