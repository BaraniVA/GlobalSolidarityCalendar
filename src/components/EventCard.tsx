import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, ExternalLink, Shield } from 'lucide-react';
import GSCLogo from '../assets/images/GSCLogo.png';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();

  const typeColors = {
    protest: 'bg-palestine-red/20 text-palestine-red',
    cultural: 'bg-palestine-green/20 text-palestine-green',
    educational: 'bg-palestine-black/20 text-palestine-black',
    digital: 'bg-palestine-white border border-palestine-black text-palestine-black',
  };

  const typeLabels = {
    protest: 'Protest/Rally',
    cultural: 'Cultural',
    educational: 'Educational',
    digital: 'Digital',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[event.type]}`}>
              {typeLabels[event.type]}
            </span>
            {event.verified && (
              <div className="flex items-center space-x-1 text-palestine-green">
                <Shield className="h-4 w-4" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link
            to={`/event/${event.id}`}
            className="hover:text-palestine-green transition-colors"
          >
            {event.title}
          </Link>
        </h3>

        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-700">
            <img src={GSCLogo} alt="logo" className="h-4 w-4 mr-2 object-contain inline-block align-text-bottom" />
            <span>
              {format(eventDate, 'EEEE, MMMM d, yyyy')} at {format(eventDate, 'h:mm a')}
            </span>
            {!isUpcoming && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                Past Event
              </span>
            )}
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-palestine-green" />
            <span>{event.location.city}, {event.location.country}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {event.organizer && (
              <span>by {event.organizer}</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={event.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-palestine-green hover:text-palestine-green transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Source
            </a>
            <Link
              to={`/event/${event.id}`}
              className="bg-palestine-green text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-palestine-green transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;