import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Shield, 
  MapPin, 
  ExternalLink, 
  Check, 
  X, 
  Eye,
  Clock,
  AlertTriangle
} from 'lucide-react';
import GSCLogo from '../assets/images/GSCLogo.png';
import { Event } from '../types';
import { eventsService } from '../services/events';
import { useAuth } from '../hooks/useAuth';

interface Report {
  id: string;
  eventId: string;
  reportedBy: string;
  reason: 'wrong_info' | 'spam' | 'harmful_content';
  createdAt: string;
}

// Unified event type for the moderation dashboard
interface ModerationEvent {
  event: Event;
  reports?: Report[];
  eventType: 'pending' | 'reported' | 'approved';
}

type EventFilter = 'pending' | 'reported' | 'all';

const ModerationDashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const [moderationEvents, setModerationEvents] = useState<ModerationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedModerationEvent, setSelectedModerationEvent] = useState<ModerationEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<EventFilter>('pending');

  useEffect(() => {
    console.log('ModerationDashboard: useEffect triggered, user:', user);
    if (user?.role === 'moderator') {
      console.log('ModerationDashboard: User is moderator, loading events');
      loadModerationEvents();
    } else {
      console.log('ModerationDashboard: User is not moderator, role:', user?.role);
    }
  }, [user]);

  const loadModerationEvents = async () => {
    try {
      setEventsLoading(true);
      
      // Load pending events
      const pendingEventsData = await eventsService.getPendingEvents();
      console.log('Pending events loaded:', pendingEventsData);
      
      // Load reported events
      const reportedEventsData = await eventsService.getReportedEvents();
      console.log('Reported events loaded:', reportedEventsData);
      
      // Load approved events for the "all" filter
      const approvedEventsData = await eventsService.getEvents({
        location: '',
        type: 'all',
        search: ''
      });
      console.log('Approved events loaded:', approvedEventsData);
      
      // Combine all events into unified format
      const pendingModerationEvents: ModerationEvent[] = pendingEventsData.map(event => ({
        event,
        eventType: 'pending' as const
      }));
      
      const reportedModerationEvents: ModerationEvent[] = reportedEventsData.map(reportedEvent => ({
        event: reportedEvent.event,
        reports: reportedEvent.reports,
        eventType: 'reported' as const
      }));
      
      const approvedModerationEvents: ModerationEvent[] = approvedEventsData.map(event => ({
        event,
        eventType: 'approved' as const
      }));
      
      // Combine all events
      const allModerationEvents = [
        ...pendingModerationEvents,
        ...reportedModerationEvents,
        ...approvedModerationEvents
      ];
      
      console.log('All moderation events combined:', allModerationEvents);
      setModerationEvents(allModerationEvents);
    } catch (error) {
      console.error('Error loading moderation events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleApprove = async (eventId: string, verified: boolean = false) => {
    try {
      setActionLoading(eventId);
      await eventsService.approveEvent(eventId, verified);
      
      // Update the moderation events list
      setModerationEvents(prev => prev.map(modEvent => 
        modEvent.event.id === eventId 
          ? { ...modEvent, event: { ...modEvent.event, status: 'approved' }, eventType: 'approved' }
          : modEvent
      ));
      
      setSelectedModerationEvent(null);
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedModerationEvent || !rejectReason.trim()) return;

    try {
      setActionLoading(selectedModerationEvent.event.id);
      await eventsService.rejectEvent(selectedModerationEvent.event.id, rejectReason);
      
      // Remove the rejected event from the list
      setModerationEvents(prev => prev.filter(modEvent => modEvent.event.id !== selectedModerationEvent.event.id));
      
      setSelectedModerationEvent(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveEvent = async (eventId: string, reason: string = 'Event removed due to reports') => {
    try {
      setActionLoading(eventId);
      await eventsService.removeEvent(eventId, reason);
      
      // Remove the event from the list
      setModerationEvents(prev => prev.filter(modEvent => modEvent.event.id !== eventId));
      
      setSelectedModerationEvent(null);
    } catch (error) {
      console.error('Error removing event:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      setActionLoading(reportId);
      await eventsService.dismissReport(reportId);
      
      // Reload all events to reflect the changes
      await loadModerationEvents();
      
      setSelectedModerationEvent(null);
    } catch (error) {
      console.error('Error dismissing report:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Get filtered events based on current filter
  const getFilteredEvents = () => {
    switch (currentFilter) {
      case 'pending':
        return moderationEvents.filter(modEvent => modEvent.eventType === 'pending');
      case 'reported':
        return moderationEvents.filter(modEvent => modEvent.eventType === 'reported');
      case 'all':
        return moderationEvents;
      default:
        return moderationEvents.filter(modEvent => modEvent.eventType === 'pending');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication status.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need to sign in to access this page.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'moderator') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Moderator Access Required</h2>
          <p className="text-gray-600">You don't have permission to access the moderation dashboard.</p>
        </div>
      </div>
    );
  }

  const typeColors = {
    protest: 'bg-red-100 text-red-800',
    cultural: 'bg-purple-100 text-purple-800',
    educational: 'bg-blue-100 text-blue-800',
    digital: 'bg-green-100 text-green-800',
  };

  const typeLabels = {
    protest: 'Protest/Rally',
    cultural: 'Cultural',
    educational: 'Educational',
    digital: 'Digital',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Moderation Dashboard</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">
                <div>Logged in as: {user?.email}</div>
                <div>Role: {user?.role}</div>
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            Review and moderate event submissions from the community.
          </p>
          
          {/* Filter Tabs */}
          <div className="mt-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setCurrentFilter('pending')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFilter === 'pending'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Pending Events ({moderationEvents.filter(e => e.eventType === 'pending').length})
                </button>
                <button
                  onClick={() => setCurrentFilter('reported')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    currentFilter === 'reported'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reported Events ({moderationEvents.filter(e => e.eventType === 'reported').length})
                  {moderationEvents.filter(e => e.eventType === 'reported').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {moderationEvents.filter(e => e.eventType === 'reported').length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setCurrentFilter('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    currentFilter === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Events ({moderationEvents.length})
                </button>
              </nav>
            </div>
          </div>
        </div>

        {eventsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : getFilteredEvents().length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentFilter === 'pending' ? 'No Pending Events' : 
               currentFilter === 'reported' ? 'No Reported Events' : 'No Events'}
            </h3>
            <p className="text-gray-600">
              {currentFilter === 'pending' ? 'All event submissions have been reviewed. Check back later for new submissions.' :
               currentFilter === 'reported' ? 'No events have been reported yet.' : 'No events found.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentFilter === 'pending' ? 'Pending Events' : 
                 currentFilter === 'reported' ? 'Reported Events' : 'All Events'} ({getFilteredEvents().length})
              </h2>
              
              {getFilteredEvents().map((modEvent) => (
                <div
                  key={modEvent.event.id}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedModerationEvent?.event.id === modEvent.event.id 
                      ? (modEvent.eventType === 'reported' ? 'border-orange-500 bg-orange-50' : 'border-green-500 bg-green-50')
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedModerationEvent?.event.id === modEvent.event.id) {
                      // If clicking the same event, deselect it
                      setSelectedModerationEvent(null);
                    } else {
                      // If clicking a different event, select it
                      setSelectedModerationEvent(modEvent);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[modEvent.event.type]}`}>
                        {typeLabels[modEvent.event.type]}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        modEvent.eventType === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        modEvent.eventType === 'reported' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {modEvent.eventType.charAt(0).toUpperCase() + modEvent.eventType.slice(1)}
                      </span>
                      {modEvent.eventType === 'reported' && modEvent.reports && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          {modEvent.reports.length} Report{modEvent.reports.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(modEvent.event.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {modEvent.event.title}
                  </h3>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <img src={GSCLogo} alt="logo" className="h-4 w-4 mr-2 object-contain inline-block align-text-bottom" />
                      {format(new Date(modEvent.event.date), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {modEvent.event.location.city}, {modEvent.event.location.country}
                    </div>
                    {modEvent.eventType === 'reported' && modEvent.reports && modEvent.reports.length > 0 && (
                      <div className="text-sm text-orange-600">
                        <strong>Report Reason:</strong> {modEvent.reports[0].reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    )}
                  </div>

                  {selectedModerationEvent?.event.id === modEvent.event.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {modEvent.eventType === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(modEvent.event.id, false);
                              }}
                              disabled={actionLoading === modEvent.event.id}
                              className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(modEvent.event.id, true);
                              }}
                              disabled={actionLoading === modEvent.event.id}
                              className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Approve & Verify
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowRejectModal(true);
                              }}
                              disabled={actionLoading === modEvent.event.id}
                              className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        {modEvent.eventType === 'reported' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveEvent(modEvent.event.id);
                              }}
                              disabled={actionLoading === modEvent.event.id}
                              className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove Event
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (modEvent.reports && modEvent.reports.length > 0) {
                                  handleDismissReport(modEvent.reports[0].id);
                                }
                              }}
                              disabled={actionLoading === (modEvent.reports ? modEvent.reports[0]?.id : '')}
                              className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              Dismiss Report
                            </button>
                          </>
                        )}
                        {modEvent.eventType === 'approved' && new Date(modEvent.event.date) < new Date() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveEvent(modEvent.event.id, 'Event removed as it has passed its deadline');
                            }}
                            disabled={actionLoading === modEvent.event.id}
                            className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove Past Event
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Event Details */}
            <div className="lg:sticky lg:top-4">
              {selectedModerationEvent ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedModerationEvent.eventType === 'reported' ? 'Reported Event Details' : 'Event Details'}
                    </h2>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[selectedModerationEvent.event.type]}`}>
                        {typeLabels[selectedModerationEvent.event.type]}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedModerationEvent.eventType === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedModerationEvent.eventType === 'reported' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedModerationEvent.eventType.charAt(0).toUpperCase() + selectedModerationEvent.eventType.slice(1)}
                      </span>
                      {selectedModerationEvent.eventType === 'reported' && selectedModerationEvent.reports && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          {selectedModerationEvent.reports.length} Report{selectedModerationEvent.reports.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {selectedModerationEvent.event.title}
                      </h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedModerationEvent.event.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center text-gray-700">
                        <img src={GSCLogo} alt="logo" className="h-5 w-5 mr-2 object-contain inline-block align-text-bottom" />
                        <span>
                          {format(new Date(selectedModerationEvent.event.date), 'EEEE, MMMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2" />
                        <span>{selectedModerationEvent.event.location.city}, {selectedModerationEvent.event.location.country}</span>
                      </div>
                      {selectedModerationEvent.event.organizer && (
                        <div className="text-gray-700">
                          <strong>Organizer:</strong> {selectedModerationEvent.event.organizer}
                        </div>
                      )}
                    </div>

                    {selectedModerationEvent.eventType === 'reported' && selectedModerationEvent.reports && selectedModerationEvent.reports.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Reports</h4>
                        <div className="space-y-2">
                          {selectedModerationEvent.reports.map((report) => (
                            <div key={report.id} className="bg-orange-50 border border-orange-200 rounded p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm font-medium text-orange-800">
                                    {report.reason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    Reported on {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <a
                        href={selectedModerationEvent.event.sourceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 hover:text-green-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Source Link
                      </a>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Submitted:</strong> {format(new Date(selectedModerationEvent.event.createdAt), 'MMMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select an Event
                  </h3>
                  <p className="text-gray-600">
                    Click on an event from the list to view its details and moderation options.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedModerationEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Event</h3>
            
            <div className="mb-4">
              <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (required)
              </label>
              <textarea
                id="rejectReason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Explain why this event is being rejected..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={actionLoading === selectedModerationEvent.event.id}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === selectedModerationEvent.event.id || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === selectedModerationEvent.event.id ? 'Rejecting...' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;