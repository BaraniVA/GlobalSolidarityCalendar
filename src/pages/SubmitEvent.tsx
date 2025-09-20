import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Link as LinkIcon, User, Clock, CheckCircle } from 'lucide-react';
import GSCLogo from '../assets/images/GSCLogo.png';
import { Event } from '../types';
import { eventsService } from '../services/events';
import { useAuth } from '../hooks/useAuth';

const SubmitEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    city: '',
    country: '',
    type: 'protest' as Event['type'],
    sourceLink: '',
    organizer: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debug user state
  React.useEffect(() => {
    console.log('SubmitEvent: Component mounted, user:', user ? user.email : 'null', 'loading:', loading);
  }, [user, loading]);

  React.useEffect(() => {
    console.log('SubmitEvent: User state changed:', user ? user.email : 'null');
  }, [user]);

  const eventTypes = [
    { value: 'protest', label: 'Protest/Rally' },
    { value: 'cultural', label: 'Cultural Event' },
    { value: 'educational', label: 'Educational/Workshop' },
    { value: 'digital', label: 'Digital/Online' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }

    if (!formData.time) {
      newErrors.time = 'Event time is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.sourceLink.trim()) {
      newErrors.sourceLink = 'Source link is required for verification';
    } else if (!isValidUrl(formData.sourceLink)) {
      newErrors.sourceLink = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (err) {
      console.error('Error validating URL:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wait for auth state to load
    if (loading) {
      console.log('SubmitEvent: Auth state still loading, waiting...');
      return;
    }

    if (!user) {
      console.log('SubmitEvent: No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    if (!validateForm()) {
      return;
    }

    console.log('SubmitEvent: Form validation passed, preparing event data...');
    console.log('SubmitEvent: Form validation passed, preparing event data...');
    try {
      setSubmitting(true);

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: `${formData.date}T${formData.time}`,
        location: {
          city: formData.city.trim(),
          country: formData.country.trim(),
        },
        type: formData.type,
        sourceLink: formData.sourceLink.trim(),
        organizer: formData.organizer.trim() || undefined,
      };

      console.log('SubmitEvent: Event data prepared:', eventData);
      console.log('SubmitEvent: Calling eventsService.submitEvent...');

      console.log('SubmitEvent: Event data prepared:', eventData);
      console.log('SubmitEvent: Calling eventsService.submitEvent...');

      await eventsService.submitEvent(eventData, user!.id);
      console.log('SubmitEvent: Event submitted successfully');
      setSubmitted(true);
    } catch (err) {
      console.error('SubmitEvent: Error submitting event:', err);
      setErrors({ submit: 'Failed to submit event. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your event has been submitted and is now in our moderation queue. 
            It will be reviewed and published once approved.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-palestine-green text-white px-4 py-2 rounded-md hover:bg-palestine-green transition-colors"
            >
              View All Events
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  title: '',
                  description: '',
                  date: '',
                  time: '',
                  city: '',
                  country: '',
                  type: 'protest',
                  sourceLink: '',
                  organizer: '',
                });
              }}
              className="w-full text-palestine-green px-4 py-2 border border-palestine-green rounded-md hover:bg-palestine-green/10 transition-colors"
            >
              Submit Another Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center">
          <img src={GSCLogo} alt="Global Solidarity Calendar" className="h-12 w-12 mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            You need to sign in to submit events to our community calendar.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-palestine-green text-white px-6 py-2 rounded-md hover:bg-palestine-green transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
            <img src={GSCLogo} alt="Global Solidarity Calendar" className="h-12 w-12 mx-auto mb-4 object-contain" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Event</h1>
              <p className="text-gray-600">
                Share solidarity events with the global community. All submissions are reviewed before publication.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Event Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter event title"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Event Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Describe the event in detail"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    <img src={GSCLogo} alt="logo" className="inline h-4 w-4 mr-1 object-contain inline-block align-text-bottom" />
                    Event Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Event Time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                      errors.time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City name"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Country name"
                  />
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Link */}
              <div>
                <label htmlFor="sourceLink" className="block text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="inline h-4 w-4 mr-1" />
                  Official Source Link *
                </label>
                <input
                  type="url"
                  id="sourceLink"
                  name="sourceLink"
                  value={formData.sourceLink}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-md focus:ring-green-500 focus:border-green-500 ${
                    errors.sourceLink ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/event-page"
                />
                <p className="mt-1 text-sm text-gray-600">
                  Link to the official event page, Facebook event, or organizer's website
                </p>
                {errors.sourceLink && <p className="mt-1 text-sm text-red-600">{errors.sourceLink}</p>}
              </div>

              {/* Organizer */}
              <div>
                <label htmlFor="organizer" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Organizer (Optional)
                </label>
                <input
                  type="text"
                  id="organizer"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Name of organizing group or individual"
                />
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting Event...' : 'Submit Event for Review'}
                </button>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Your event will be reviewed by our moderation team before publication
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitEvent;