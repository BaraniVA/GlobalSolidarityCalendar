import React from 'react';
import { Search, MapPin, Filter } from 'lucide-react';
import { EventFilters } from '../types';

interface SearchFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onFiltersChange }) => {
  const eventTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'protest', label: 'Protests & Rallies' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'educational', label: 'Educational' },
    { value: 'digital', label: 'Digital' },
  ];

  const handleFilterChange = (key: keyof EventFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Events
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search"
              placeholder="Search by title, description, or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-palestine-green focus:border-palestine-green"
            />
          </div>
        </div>

        {/* Location */}
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="location"
              placeholder="City or country..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-palestine-green focus:border-palestine-green"
            />
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              id="type"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-palestine-green focus:border-palestine-green appearance-none bg-white"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;