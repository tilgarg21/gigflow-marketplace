import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gigsAPI, bidsAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    gigs: [],
    bids: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'client') {
        // Fetch client's posted gigs
        const gigsResponse = await gigsAPI.getMyPosted();
        setData({ 
          gigs: gigsResponse.data.gigs || [], 
          bids: [] 
        });
      } else if (user?.role === 'freelancer') {
        // Fetch freelancer's submitted bids
        const bidsResponse = await bidsAPI.getMySubmitted();
        setData({ 
          gigs: [], 
          bids: bidsResponse.data.bids || [] 
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays on error to prevent null access
      setData({ gigs: [], bids: [] });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user?.role === 'client' ? 'Manage your posted gigs and review applications' : 'Track your bid applications and find new opportunities'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab(user?.role === 'client' ? 'gigs' : 'bids')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === (user?.role === 'client' ? 'gigs' : 'bids')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {user?.role === 'client' ? 'My Gigs' : 'My Bids'}
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {user?.role === 'client' ? 'Posted Gigs' : 'Submitted Bids'}
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {user?.role === 'client' ? data.gigs.length : data.bids.length}
            </p>
          </div>

          {user?.role === 'client' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Gigs</h3>
                <p className="text-3xl font-bold text-green-600">
                  {data.gigs.filter(gig => gig.status === 'open').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">In Progress</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {data.gigs.filter(gig => gig.status === 'in-progress').length}
                </p>
              </div>
            </>
          )}

          {user?.role === 'freelancer' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Bids</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {data.bids.filter(bid => bid.status === 'pending').length}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Accepted Bids</h3>
                <p className="text-3xl font-bold text-green-600">
                  {data.bids.filter(bid => bid.status === 'accepted').length}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Client Gigs Tab */}
      {activeTab === 'gigs' && user?.role === 'client' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Posted Gigs</h2>
            <Link
              to="/create-gig"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Post New Gig
            </Link>
          </div>

          <div className="space-y-4">
            {!data.gigs || data.gigs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't posted any gigs yet.</p>
                <Link
                  to="/create-gig"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Post your first gig
                </Link>
              </div>
            ) : (
              data.gigs.filter(gig => gig && gig._id).map((gig, index) => (
                <div key={gig?._id || `gig-${index}`} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{gig?.title || 'Gig Title Not Available'}</h3>
                      <p className="text-gray-600 mb-3">{gig?.description || 'No description available'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Budget: ${gig?.budget?.min || 0} - ${gig?.budget?.max || 0}</span>
                        <span>•</span>
                        <span>Deadline: {gig?.deadline ? new Date(gig.deadline).toLocaleDateString() : 'No deadline set'}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(gig?.status || 'unknown')}`}>
                        {gig.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {gig?._id ? (
                      <Link
                        to={`/gigs/${gig._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Details & Bids
                      </Link>
                    ) : (
                      <span className="text-gray-400">Gig details not available</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Freelancer Bids Tab */}
      {activeTab === 'bids' && user?.role === 'freelancer' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Bid Applications</h2>
            <Link
              to="/"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Browse Gigs
            </Link>
          </div>

          <div className="space-y-4">
            {!data.bids || data.bids.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't submitted any bids yet.</p>
                <Link
                  to="/"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Browse available gigs
                </Link>
              </div>
            ) : (
              data.bids.filter(bid => bid && bid._id).map((bid, index) => (
                <div key={bid?._id || `bid-${index}`} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{bid.gig?.title || 'Gig Title Not Available'}</h3>
                      <p className="text-gray-600 mb-3">{bid.proposal}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Your Bid: ${bid.bidAmount}</span>
                        <span>•</span>
                        <span>Delivery: {bid.deliveryTime} days</span>
                        <span>•</span>
                        <span>Client: {bid.gig?.client?.name || 'Client Name Not Available'}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(bid.status)}`}>
                        {bid.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    {bid?.gig?._id ? (
                      <Link
                        to={`/gigs/${bid.gig._id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Gig Details
                      </Link>
                    ) : (
                      <span className="text-gray-400">Gig details not available</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;