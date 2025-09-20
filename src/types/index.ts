export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: {
    city: string;
    country: string;
  };
  type: 'protest' | 'cultural' | 'educational' | 'digital';
  sourceLink: string;
  organizer?: string;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  createdBy: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

export interface Report {
  id: string;
  eventId: string;
  reportedBy: string;
  reason: 'wrong_info' | 'spam' | 'harmful_content';
  createdAt: string;
}

export interface TransparencyLogEntry {
  id: string;
  eventId: string;
  action: 'rejected' | 'removed';
  reason: string;
  moderatorId: string;
  createdAt: string;
}

export interface EventFilters {
  location: string;
  type: string;
  search: string;
}