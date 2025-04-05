import { useState, useRef, useEffect } from 'react';
import { FaHome, FaUserCircle, FaCog, FaEnvelope, FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';

function Nav() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const userEmail = localStorage.getItem("email");
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log("Storage cleared!");
    navigate("/", { replace: true });
  };

  // In a button or other event handler

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch friend requests when component mounts
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        if (!userEmail) return;

        const response = await axios.get(`${import.meta.env.VITE_API_URL}/friend-requests/${userEmail}`);
        console.log("Friend requests response:", response.data);
        
        // Ensure each request has a valid _id
        const validRequests = response.data.filter(req => req.requestId && req.sender);
        if (validRequests.length !== response.data.length) {
          console.warn("Some friend requests are missing required fields:", 
            response.data.filter(req => !req.requestId || !req.sender));
        }
        
        setFriendRequests(validRequests);
        setNotificationCount(validRequests.length);
      } catch (error) {
        console.error("Error fetching friend requests:", error);
      }
    };

    if (userEmail) {
      fetchFriendRequests();
      
      // Set up interval to check for new requests every minute
      const interval = setInterval(fetchFriendRequests, 60000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/search-users?query=${query}&email=${userEmail}`);
        setSearchResults(response.data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error searching users:", error);
      }
    } else {
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?query=${searchQuery}`);
      setShowDropdown(false);
    }
  };

  const handleUserClick = (userEmail) => {
    navigate(`/user-profile/${userEmail}`);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (requestId) => {
    try {
      console.log("Accepting friend request with ID:", requestId);

      if (!requestId) {
        throw new Error("Request ID is missing or undefined");
      }
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/accept-friend-request/${requestId}`, {
        email: userEmail
      });
      
      // Update the friend requests list by removing the accepted request
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      
      // Update notification count
      setNotificationCount(prev => prev - 1);
      
      // Show success message
      alert("Friend request accepted successfully!");
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert("Failed to accept friend request: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/reject-friend-request/${requestId}`, {
        email: userEmail
      });

      // Update the friend requests list
      setFriendRequests(prevRequests => 
        prevRequests.filter(request => request.requestId !== requestId)
      );
      setNotificationCount(prev => prev - 1);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      alert("Failed to reject friend request. Please try again.");
    }
  };

  return (
    <nav className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
      {/* Logo/Brand */}
      <div className="flex items-center">
        <Link to={userEmail ? `/dashboard/${userEmail}` : "/"} className="font-bold text-blue-600 text-lg">
          Sociofy
        </Link>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-xs mx-4">
        <form onSubmit={handleSearchSubmit} className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <IoSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-full text-sm bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            />
          </div>
          
          {/* Search dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div 
              ref={dropdownRef}
              className="absolute mt-1 w-full max-w-xs bg-white rounded-lg shadow-lg py-1 z-10 max-h-80 overflow-auto"
            >
              {searchResults.slice(0, 5).map((user) => (
                <div 
                  key={user._id} 
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => handleUserClick(user.email)}
                >
                  {user.profilePicture ? (
                    <img 
                      src={`data:image/jpeg;base64,${user.profilePicture}`} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                      <FaUserCircle className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
              ))}
              {searchResults.length > 5 && (
                <div 
                  className="px-3 py-2 text-center text-blue-600 text-sm font-medium border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={handleSearchSubmit}
                >
                  See all results
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      
      {/* Right section - Navigation icons */}
      <div className="flex items-center space-x-4">
        <Link to={userEmail ? `/dashboard/${userEmail}` : "/"} className="text-gray-700 hover:text-blue-600 transition-colors">
          <FaHome className="h-5 w-5" />
        </Link>
        
        <Link to="/chatroom" className="text-gray-700 hover:text-blue-600 transition-colors">
          <FaEnvelope className="h-5 w-5" />
          </Link>
        
        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button 
            className="text-gray-700 hover:text-blue-600 transition-colors relative py-2"
            onClick={toggleNotifications}
          >
            <FaBell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-1 z-10">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
              </div>
              
              {friendRequests.length === 0 ? (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  <p>No new notifications</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {friendRequests.map(request => (
                    <div key={request.requestId} className="px-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center">
                        {request.sender.profilePicture ? (
                          <img 
                            src={`data:image/jpeg;base64,${request.sender.profilePicture}`} 
                            alt={request.sender.name} 
                            className="h-8 w-8 rounded-full object-cover mr-2 border border-gray-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <FaUser className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            <span className="font-semibold">{request.sender.name}</span> sent you a friend request
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex justify-end space-x-2">
                        <button 
                          onClick={() => handleAcceptFriendRequest(request.requestId)}
                          className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRejectFriendRequest(request.requestId)}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition-colors flex items-center"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
 <Link to={`/dashboard/profile/${userEmail}`} className="text-gray-700 hover:text-blue-600 transition-colors">
  <FaUserCircle className="h-5 w-5" />
</Link>

<Link to={`/settings/${userEmail}`} className="text-gray-700 hover:text-blue-600 transition-colors">
  <FaCog className="h-5 w-5" />
</Link>
<Link to={`/gold-dashboard/${userEmail}`}>

<button
  className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-white font-bold py-2 px-4 rounded-full border-2 border-yellow-700 shadow-lg hover:from-yellow-300 hover:to-yellow-500 transition-all transform hover:scale-105"
>
  💰 Gold Member
</button>
</Link>

<button
  onClick={handleLogout}
  className="text-red-500 hover:text-red-700 transition-colors ml-4"
>
  <FaSignOutAlt className="h-5 w-5" />
</button>

      </div>
    </nav>
  );
}

export default Nav;