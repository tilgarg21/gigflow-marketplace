import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gigsAPI, bidsAPI } from '../services/api';

const GigDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [gig, setGig] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidForm, setBidForm] = useState({
    proposal: '',
    bidAmount: '',
    deliveryTime: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGigDetails();
    if (user?.role === 'client') {
      fetchBids();
    }
  }, [id, user]);

  const fetchGigDetails = async () => {
    try {
      const response = await gigsAPI.getById(id);
      setGig(response.data?.gig || null);
    } catch (error) {
      console.error('Error fetching gig:', error);
      setError('Gig not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await bidsAPI.getByGig(id);
      setBids(response.data?.bids || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBids([]);
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await bidsAPI.create({
        gigId: id,
        ...bidForm,
        bidAmount: parseInt(bidForm.bidAmount),
        deliveryTime: parseInt(bidForm.deliveryTime)
      });

      if (response.data.success) {
        setShowBidForm(false);
        setBidForm({ proposal: '', bidAmount: '', deliveryTime: '' });
        alert('Bid submitted successfully!');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this bid?')) return;

    try {
      const response = await bidsAPI.hire(bidId);
      if (response.data.success) {
        fetchBids();
        fetchGigDetails();
        alert('Bid accepted successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to accept bid');
    }
  };

  const handleBidChange = (e) => {
    setBidForm({
      ...bidForm,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading gig details...</div>
      </div>
    );
  }

  if (error && !gig) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-lg">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Gigs
        </button>
      </div>
    );
  }

  const isOwner = user?.id === gig?.client?._id;
  const canBid = isAuthenticated && user?.role === 'freelancer' && gig?.status === 'open' && !isOwner;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Gig Details */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-800">{gig?.title || 'Gig Title Not Available'}</h1>
          <span className={`px-3 py-1 rounded text-sm font-medium ${
            gig?.status === 'open' ? 'bg-green-100 text-green-800' :
            gig?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {gig?.status?.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Budget</h3>
            <p className="text-xl font-bold text-green-600">
              ${gig?.budget.min} - ${gig?.budget.max}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Deadline</h3>
            <p className="text-lg">
              {new Date(gig?.deadline).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Category</h3>
            <p className="text-lg capitalize">
              {gig?.category.replace('-', ' ')}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed">{gig?.description}</p>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {(gig?.skills || []).map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Posted by</h3>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              {gig?.client?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium">{gig?.client?.name || 'Unknown Client'}</p>
              <p className="text-sm text-gray-500">{gig?.client?.email || 'No email available'}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canBid && (
          <button
            onClick={() => setShowBidForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Submit Bid
          </button>
        )}
      </div>

      {/* Bid Form */}
      {showBidForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Submit Your Bid</h2>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleBidSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Proposal *
              </label>
              <textarea
                name="proposal"
                value={bidForm.proposal}
                onChange={handleBidChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Explain why you're the best fit for this project..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Bid Amount ($) *
                </label>
                <input
                  type="number"
                  name="bidAmount"
                  value={bidForm.bidAmount}
                  onChange={handleBidChange}
                  required
                  min={gig?.budget.min}
                  max={gig?.budget.max}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Delivery Time (days) *
                </label>
                <input
                  type="number"
                  name="deliveryTime"
                  value={bidForm.deliveryTime}
                  onChange={handleBidChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Bid'}
              </button>
              <button
                type="button"
                onClick={() => setShowBidForm(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bids Section (for gig owner) */}
      {isOwner && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">
            Received Bids ({bids.length})
          </h2>

          {bids.length === 0 ? (
            <p className="text-gray-500">No bids received yet.</p>
          ) : (
            <div className="space-y-4">
              {(bids || []).filter(bid => bid && bid._id).map((bid, index) => (
                <div key={bid?._id || `bid-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        {bid?.freelancer?.name?.charAt(0)?.toUpperCase() || 'F'}
                      </div>
                      <div>
                        <p className="font-medium">{bid?.freelancer?.name || 'Unknown Freelancer'}</p>
                        <p className="text-sm text-gray-500">{bid?.freelancer?.email || 'No email available'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">${bid?.bidAmount || 0}</p>
                      <p className="text-sm text-gray-500">{bid?.deliveryTime || 0} days</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{bid.proposal}</p>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {bid.status.toUpperCase()}
                    </span>

                    {bid.status === 'pending' && gig?.status === 'open' && (
                      <button
                        onClick={() => handleAcceptBid(bid._id)}
                        className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                      >
                        Accept Bid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GigDetails;