import React, { useState, useEffect, useCallback } from 'react';
import { Event, EventFilters } from '../types';
import { eventsService } from '../services/events';
import EventCard from '../components/EventCard';
import SearchFilters from '../components/SearchFilters';
import { AlertCircle, Users } from 'lucide-react';
import GSCLogo from '../assets/images/GSCLogo2.png';
import { useVisitCounter } from '../hooks/useVisitCounter';

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    location: '',
    type: 'all',
  });
  const { visitCount, loading: counterLoading } = useVisitCounter();

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Home: Loading events with filters:', filters);
      const fetchedEvents = await eventsService.getEvents(filters);
      console.log('Home: Fetched events:', fetchedEvents.length, 'events');
      fetchedEvents.forEach(event => console.log('Home: Event:', event.id, event.title, event.status));
      setEvents(fetchedEvents);
    } catch (err) {
      setError('Failed to load events. Please try again.');
      console.error('Home: Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-palestine-green to-palestine-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <img src={GSCLogo} alt="Global Solidarity Calendar" className="h-20 w-20 mx-auto mb-4 object-contain rounded-full" />
            <h1 className="text-4xl font-bold mb-4">
              Global Solidarity Calendar
            </h1>
            <p className="text-xl opacity-90 max-w-3xl mx-auto">
              Discover and join solidarity events worldwide in support of Palestine. Your voice matters in the call for justice, peace, and a free Palestine.
            </p>
            <p className="text-lg opacity-80 max-w-2xl mx-auto mt-4">
              Connect with communities, participate in protests, educational events, and advocacy actions that amplify Palestinian voices and support the liberation movement.
            </p>
            {/* Visit Counter */}
            <div className="mt-8 flex items-center justify-center space-x-2 text-lg opacity-90">
              <Users className="h-5 w-5" />
              <span>
                {counterLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>
                    <span className="font-semibold">{visitCount.toLocaleString()}</span> visitors have joined the movement
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <SearchFilters filters={filters} onFiltersChange={setFilters} />

        {/* Events Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Upcoming Events
              {events.length > 0 && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  ({events.length} events)
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-palestine-red mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Events
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadEvents}
                className="bg-palestine-green text-white px-4 py-2 rounded-md hover:bg-palestine-green transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <img src={GSCLogo} alt="Global Solidarity Calendar" className="h-12 w-12 text-gray-400 mx-auto mb-4 object-contain" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Events Found
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.location || filters.type !== 'all'
                  ? 'Try adjusting your search filters or check back later for new events.'
                  : 'No events are currently scheduled. Check back soon for updates.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-palestine-green/10 border border-palestine-green/20 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-palestine-green" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-palestine-green">
                Community-Driven Platform
              </h3>
              <div className="mt-2 text-sm text-palestine-green/80">
                <p>
                  All events are community-submitted and go through our moderation process to ensure accuracy.
                  Events with verification badges have been confirmed by trusted organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;