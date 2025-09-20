import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import GSCLogo from '../assets/images/GSCLogo.png';
import { MapPin, ExternalLink, Shield, User, Share2, Flag, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Event } from '../types';
import { eventsService } from '../services/events';
import { useAuth } from '../hooks/useAuth';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<'wrong_info' | 'spam' | 'harmful_content'>('wrong_info');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      const fetchedEvent = await eventsService.getEvent(eventId);
      setEvent(fetchedEvent);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch {
        // Fall back to copying to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleReport = async () => {
    if (!event || !user) return;

    try {
      setReportSubmitting(true);
      await eventsService.reportEvent(event.id, reportReason);
      setReportSuccess(true);
      setShowReportModal(false);
    } catch (error) {
      console.error('Error reporting event:', error);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  const typeColors = {
    protest: 'bg-red-100 text-red-800',
    cultural: 'bg-purple-100 text-purple-800',
    educational: 'bg-blue-100 text-blue-800',
    digital: 'bg-green-100 text-green-800',
  };

  const reportReasons = [
    { value: 'wrong_info', label: 'Incorrect Information' },
    { value: 'spam', label: 'Spam or Duplicate' },
    { value: 'harmful_content', label: 'Harmful Content' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>

        {/* Event Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${typeColors[event.type]}`}>
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
                {event.verified && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Shield className="h-5 w-5" />
                    <span className="text-sm font-medium">Verified Event</span>
                  </div>
                )}
                {!isUpcoming && (
                  <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                    Past Event
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Share event"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                {user && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Report event"
                  >
                    <Flag className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{event.title}</h1>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <img src={GSCLogo} alt="logo" className="h-5 w-5 mr-3 object-contain inline-block align-text-bottom" />
                  <div>
                    <div className="font-medium">
                      {format(eventDate, 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(eventDate, 'h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-3 text-green-600" />
                  <div>
                    <div className="font-medium">
                      {event.location.city}, {event.location.country}
                    </div>
                  </div>
                </div>

                {event.organizer && (
                  <div className="flex items-center text-gray-700">
                    <User className="h-5 w-5 mr-3 text-green-600" />
                    <div>
                      <div className="text-sm text-gray-600">Organized by</div>
                      <div className="font-medium">{event.organizer}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <a
                  href={event.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  View Official Source
                </a>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Always verify event details on the official source
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About This Event</h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Submitted on {format(new Date(event.createdAt), 'MMMM d, yyyy')}
              </span>
              {event.verified && (
                <span className="text-green-600">
                  ✓ Verified by trusted organization
                </span>
              )}
            </div>
          </div>
        </div>

        {reportSuccess && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Thank you for your report. Our moderation team will review this event.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Event</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Why are you reporting this event?
              </p>
              
              <div className="space-y-2">
                {reportReasons.map((reason) => (
                  <label key={reason.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.value}
                      checked={reportReason === reason.value}
                      onChange={(e) => setReportReason(e.target.value as 'wrong_info' | 'spam' | 'harmful_content')}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">{reason.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={reportSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetail;