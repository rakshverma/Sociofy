import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserCircle, FaUserPlus, FaUserCheck, FaSpinner } from 'react-icons/fa';
import Nav from '../components/db/Nav';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendRequests, setFriendRequests] = useState({});
  const userEmail = localStorage.getItem("email");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/search-users?query=${query}&email=${userEmail}`);
        setSearchResults(response.data);
        
        // Get friend request status for each user
        const requestStatuses = {};
        for (const user of response.data) {
          try {
            const statusResponse = await axios.get(`http://localhost:5000/friend-status?userEmail=${userEmail}&friendEmail=${user.email}`);
            requestStatuses[user.email] = statusResponse.data.status;
          } catch (err) {
            requestStatuses[user.email] = 'none';
          }
        }
        setFriendRequests(requestStatuses);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch search results");
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query, userEmail]);

  const handleSendFriendRequest = async (receiverEmail) => {
    try {
      await axios.post('http://localhost:5000/send-friend-request', {
        senderEmail: userEmail,
        receiverEmail
      });
      
      // Update the friend request status for this user
      setFriendRequests(prev => ({
        ...prev,
        [receiverEmail]: 'pending'
      }));
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const viewUserProfile = (email) => {
    navigate(`/user-profile/${email}`);
  };

  return (
    <div className="search-results-page">
      <Nav />
      
      <div className="search-results-container">
        <h2>Search Results for "{query}"</h2>
        
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spinner-icon" />
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="no-results">
            <p>No users found matching "{query}"</p>
          </div>
        ) : (
          <div className="search-results-list">
            {searchResults.map((user) => (
              <div key={user._id} className="user-card">
                <div className="user-card-left" onClick={() => viewUserProfile(user.email)}>
                  {user.profilePicture ? (
                    <img 
                      src={`data:image/jpeg;base64,${user.profilePicture}`} 
                      alt={user.name} 
                      className="user-avatar"
                    />
                  ) : (
                    <FaUserCircle className="user-avatar-icon" />
                  )}
                  
                  <div className="user-info">
                    <h3 className="user-name">{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                  </div>
                </div>
                
                <div className="user-card-right">
                  {friendRequests[user.email] === 'none' && (
                    <button 
                      className="add-friend-btn"
                      onClick={() => handleSendFriendRequest(user.email)}
                    >
                      <FaUserPlus /> Add Friend
                    </button>
                  )}
                  
                  {friendRequests[user.email] === 'pending' && (
                    <button className="pending-btn" disabled>
                      Request Sent
                    </button>
                  )}
                  
                  {friendRequests[user.email] === 'accepted' && (
                    <button className="friends-btn" disabled>
                      <FaUserCheck /> Friends
                    </button>
                  )}
                  
                  <button 
                    className="view-profile-btn"
                    onClick={() => viewUserProfile(user.email)}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
