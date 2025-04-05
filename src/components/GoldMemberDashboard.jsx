import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Nav from './db/Nav.jsx';
function GoldMemberDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState({
    isGoldMember: false,
    expiryDate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgradeMonths, setUpgradeMonths] = useState(1);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("email");
  const userName = localStorage.getItem("name");

  // Check if user is logged in
  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
    }
  }, [userEmail, navigate]);

  // Fetch membership status and visitors if applicable
  useEffect(() => {
    const fetchMembershipStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/membership-status/${userEmail}`);
        setMembershipStatus(response.data);
        
        if (response.data.isGoldMember) {
          fetchVisitors();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching membership status:", error);
        setError("Failed to load membership information");
        setLoading(false);
      }
    };

    const fetchVisitors = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/profile-visitors/${userEmail}`);
        setVisitors(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching visitors:", error);
        setError("Failed to load profile visitors");
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchMembershipStatus();
    }
  }, [userEmail]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/upgrade-to-gold`, {
        email: userEmail,
        durationMonths: upgradeMonths
      });
      
      setMembershipStatus({
        isGoldMember: true,
        expiryDate: response.data.expiryDate
      });
      
      setUpgradeSuccess(true);
      
      // Fetch visitors after upgrade
      const visitorsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/profile-visitors/${userEmail}`);
      setVisitors(visitorsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error("Error upgrading membership:", error);
      setError("Failed to upgrade membership");
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-4 text-blue-800 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <Nav />
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Welcome, {userName}</h1>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${membershipStatus.isGoldMember ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
            <p className="text-gray-600">
              {membershipStatus.isGoldMember 
                ? `Gold Membership Active (Expires: ${formatDate(membershipStatus.expiryDate)})` 
                : "Standard Membership"}
            </p>
          </div>
        </div>

        {/* Gold Members see their visitors */}
        {membershipStatus.isGoldMember ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-6">Your Profile Visitors</h2>
            
            {visitors.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="mt-4 text-gray-500 text-lg">No profile visitors yet</p>
                <p className="text-gray-400">When someone visits your profile, they'll appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-blue-50 text-blue-800">
                      <th className="py-3 px-4 text-left">Visitor</th>
                      <th className="py-3 px-4 text-left">Email</th>
                      <th className="py-3 px-4 text-left">Visited At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visitors.map((visitor, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                              {visitor.profilePicture ? (
                                <img 
                                  src={`data:image/jpeg;base64,${visitor.profilePicture}`}
                                  alt={visitor.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                visitor.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-medium">{visitor.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-500">{visitor.email}</td>
                        <td className="py-4 px-4 text-gray-500">{formatDate(visitor.visitedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Non-gold members see upgrade prompt */
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-10 w-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Upgrade to Gold Membership</h2>
              <p className="text-gray-600 mb-6">See who's been viewing your profile with our premium Gold Membership</p>
            </div>
            
            {upgradeSuccess ? (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                <p className="font-medium">Upgrade successful! You now have access to premium features.</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p className="font-medium">{error}</p>
              </div>
            ) : null}
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Gold Member Benefits:</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  See who visited your profile
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View visitor history and timestamps
                </li>
                <li className="flex items-center">
              
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
             
              
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>Upgrade Now(Right Now It's Absolutely Free)</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default GoldMemberDashboard;