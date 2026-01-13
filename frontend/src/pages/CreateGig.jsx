import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gigsAPI } from '../services/api';
import { GIG_CATEGORIES } from '../constants';

const CreateGig = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    budget: {
      min: '',
      max: ''
    },
    deadline: '',
    skills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if not a client
  if (user?.role !== 'client') {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Only clients can post gigs.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'minBudget' || name === 'maxBudget') {
      setFormData({
        ...formData,
        budget: {
          ...formData.budget,
          [name === 'minBudget' ? 'min' : 'max']: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (parseInt(formData.budget.min) >= parseInt(formData.budget.max)) {
      setError('Maximum budget must be greater than minimum budget');
      return;
    }

    const deadline = new Date(formData.deadline);
    if (deadline <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    setLoading(true);

    try {
      const gigData = {
        ...formData,
        budget: {
          min: parseInt(formData.budget.min),
          max: parseInt(formData.budget.max)
        },
        skills: formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      };

      const response = await gigsAPI.create(gigData);
      
      if (response?.data?.success) {
        navigate('/dashboard');
      } else {
        setError('Failed to create gig - unexpected response format');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Post a New Gig</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Gig Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="e.g., Build a responsive website for my business"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="Describe your project requirements, expectations, and any specific details..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            {GIG_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Minimum Budget ($) *
            </label>
            <input
              type="number"
              name="minBudget"
              value={formData.budget.min}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Maximum Budget ($) *
            </label>
            <input
              type="number"
              name="maxBudget"
              value={formData.budget.max}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Deadline *
          </label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Required Skills *
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            placeholder="React, Node.js, MongoDB (comma separated)"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter skills separated by commas
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Gig'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGig;