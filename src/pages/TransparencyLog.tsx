import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { FileText, AlertTriangle, Shield, Eye } from 'lucide-react';
import { TransparencyLogEntry} from '../types';
import { eventsService } from '../services/events';
import { useAuth } from '../hooks/useAuth';

const TransparencyLog: React.FC = () => {
  const [logEntries, setLogEntries] = useState<TransparencyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const filterEntriesByOwnership = useCallback(async (entries: TransparencyLogEntry[], userId: string): Promise<TransparencyLogEntry[]> => {
    const filtered: TransparencyLogEntry[] = [];
    
    for (const entry of entries) {
      try {
        const event = await eventsService.getEvent(entry.eventId);
        if (event && event.createdBy === userId) {
          filtered.push(entry);
        }
      } catch (error) {
        console.error(`Error fetching event ${entry.eventId}:`, error);
        // If we can't fetch the event, exclude it from results
      }
    }
    
    return filtered;
  }, []);

  const loadTransparencyLog = useCallback(async () => {
    try {
      setLoading(true);
      const entries = await eventsService.getTransparencyLog();
      
      if (user?.role === 'moderator') {
        // Moderators see all entries
        setLogEntries(entries);
      } else if (user) {
        // Regular users see only entries for events they created
        const filtered = await filterEntriesByOwnership(entries, user.id);
        setLogEntries(filtered);
      } else {
        // Unauthenticated users see no entries
        setLogEntries([]);
      }
    } catch (error) {
      console.error('Error loading transparency log:', error);
      setLogEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, filterEntriesByOwnership]);

  useEffect(() => {
    loadTransparencyLog();
  }, [loadTransparencyLog]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'rejected':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'removed':
        return <Eye className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'removed':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'rejected':
        return 'Event Rejected During Review';
      case 'removed':
        return 'Event Removed After Publication';
      default:
        return action;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Transparency Log</h1>
          </div>
          <p className="text-gray-600">
            {user?.role === 'moderator' 
              ? 'This log shows all moderation actions taken on event submissions, including rejections and removals, to maintain transparency in our community moderation.'
              : 'This log shows moderation actions taken on your event submissions, including rejections and removals, to maintain transparency in our community moderation.'
            }
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About This Log
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  {user?.role === 'moderator'
                    ? 'We believe in transparent moderation. This log contains all events that were rejected during review or removed after publication, along with the reasons for these actions. This helps build trust and accountability in our moderation process.'
                    : 'We believe in transparent moderation. This log contains moderation actions taken on your event submissions, including rejections and removals, along with the reasons for these actions. This helps build trust and accountability in our moderation process.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Log Entries */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : logEntries.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Moderation Actions Yet
            </h3>
            <p className="text-gray-600">
              All event submissions have been approved so far. This log will show any 
              future moderation actions taken by our team.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logEntries.map((entry) => (
              <div 
                key={entry.id} 
                className={`rounded-lg border p-6 ${getActionColor(entry.action)}`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getActionIcon(entry.action)}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {getActionText(entry.action)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        <strong>Event ID:</strong> {entry.eventId}
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        Reason:
                      </h4>
                      <p className="text-sm text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                        {entry.reason}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Action taken by moderator • {format(new Date(entry.createdAt), 'MMMM d, yyyy')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            This log is updated in real-time as moderation actions are taken.
            For questions about specific actions, please contact our moderation team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransparencyLog;