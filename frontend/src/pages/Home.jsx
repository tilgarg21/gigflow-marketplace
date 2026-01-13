import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gigsAPI } from '../services/api';
import { GIG_CATEGORIES } from '../constants';

const Home = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minBudget: '',
    maxBudget: '',
    skills: ''
  });

  useEffect(() => {
    fetchGigs();
  }, []);

  const fetchGigs = async () => {
    try {
      setError(null);
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response = await gigsAPI.getAll(params);
      const gigsData = response.data.data?.gigs || response.data.gigs || [];
      
      // Ensure gigsData is an array and filter out any null/undefined items
      const validGigs = Array.isArray(gigsData) ? 
        gigsData.filter(gig => gig && gig._id && typeof gig === 'object') : [];
      setGigs(validGigs);
    } catch (error) {
      console.error('Error fetching gigs:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load gigs');
      setGigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const applyFilters = () => {
    setLoading(true);
    fetchGigs();
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minBudget: '',
      maxBudget: '',
      skills: ''
    });
    setLoading(true);
    fetchGigs();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-lg text-gray-600">Loading amazing gigs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchGigs();
                }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Welcome to GigFlow
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Connect with talented freelancers or find your next amazing project
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-teal-500 hover:bg-teal-600 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Start Freelancing
              </Link>
              <Link
                to="/register"
                className="bg-purple-800 hover:bg-purple-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Find Perfect Gigs</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              >
                <option value="">All Categories</option>
                {GIG_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Min Budget ($)</label>
              <input
                type="number"
                name="minBudget"
                placeholder="e.g., 100"
                value={filters.minBudget}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Max Budget ($)</label>
              <input
                type="number"
                name="maxBudget"
                placeholder="e.g., 1000"
                value={filters.maxBudget}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Skills</label>
              <input
                type="text"
                name="skills"
                placeholder="React, Node.js, Design..."
                value={filters.skills}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={applyFilters}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Search Gigs</span>
            </button>
            <button
              onClick={clearFilters}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Gigs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {!gigs || gigs.length === 0 ? (
            <div className="col-span-full">
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No gigs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or check back later for new opportunities</p>
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  View All Gigs
                </button>
              </div>
            </div>
          ) : (
            gigs.filter(gig => gig && gig._id).map((gig, index) => (
              <div key={gig?._id || `gig-${index}`} className="bg-white rounded-xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 text-sm font-semibold px-3 py-1 rounded-full">
                      <span>{GIG_CATEGORIES.find(c => c.value === gig?.category)?.icon || ''}</span>
                      <span>{gig?.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Category'}</span>
                    </span>
                    <div className="w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {gig?.title || 'Untitled Gig'}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {gig?.description || 'No description available'}
                  </p>

                  {/* Budget */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-teal-600">${gig?.budget?.min || 0} - ${gig?.budget?.max || 0}</p>
                      <p className="text-sm text-gray-500">Project Budget</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {(gig?.skills || []).slice(0, 3).map((skill, index) => (
                        <span key={index} className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">
                          {skill}
                        </span>
                      ))}
                      {(gig?.skills?.length || 0) > 3 && (
                        <span className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full border border-purple-200">
                          +{(gig?.skills?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center space-x-3 mb-6 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {gig?.client?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{gig?.client?.name || 'Unknown Client'}</p>
                      <p className="text-sm text-gray-500">Client</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/gigs/${gig?._id}`}
                    className="block w-full text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    View Details & Apply
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Section */}
        {Array.isArray(gigs) && gigs.length > 0 && (
          <div className="mt-16 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-800 rounded-xl p-8 text-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-bold mb-2">{gigs.length}</div>
                <div className="text-purple-200">Active Gigs</div>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                {(() => {
                  const validBudgets = gigs.filter(g => g?.budget?.min && g?.budget?.max);
                  if (validBudgets.length > 0) {
                    const minBudget = Math.min(...validBudgets.map(g => g.budget.min));
                    const maxBudget = Math.max(...validBudgets.map(g => g.budget.max));
                    return (
                      <div className="text-4xl font-bold mb-2">
                        ${minBudget} - ${maxBudget}
                      </div>
                    );
                  }
                  return <div className="text-4xl font-bold mb-2">N/A</div>;
                })()}
                <div className="text-purple-200">Budget Range</div>
              </div>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-4xl font-bold mb-2">
                  {new Set(gigs.filter(g => g?.category).map(g => g.category)).size}
                </div>
                <div className="text-purple-200">Categories</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;