import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaUserPlus, FaUserMinus, FaCheck, FaTimesCircle, FaEye, FaCrown } from "react-icons/fa";
import Nav from "../components/db/Nav";

function UserProfile() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [showCommentsForPost, setShowCommentsForPost] = useState(null);
  const [comments, setComments] = useState({});
  const [friendStatus, setFriendStatus] = useState("none"); // none, pending, accepted
  const currentUserEmail = localStorage.getItem("email");
  const [visitors, setVisitors] = useState([]);
  const [showVisitors, setShowVisitors] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`);
        setUser(userResponse.data);

        // Fetch user's posts
        const postsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${email}`);
        setPosts(postsResponse.data);

        // Check friend status if viewing someone else's profile
        if (currentUserEmail && currentUserEmail !== email) {
          const statusResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/friend-status?userEmail=${currentUserEmail}&friendEmail=${email}`
          );
          setFriendStatus(statusResponse.data.status);
          
          // Record profile visit
          await recordProfileVisit(currentUserEmail, email);
        }

        // If viewing own profile and logged in, fetch membership status and visitors
        if (currentUserEmail && currentUserEmail === email) {
          fetchMembershipStatus();
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load user profile");
        setLoading(false);
      }
    };

    fetchUserAndPosts();
  }, [email, currentUserEmail]);

  const recordProfileVisit = async (visitorEmail, visitedEmail) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/record-visit`, {
        visitorEmail, 
        visitedEmail
      });
    } catch (error) {
      console.error("Error recording profile visit:", error);
      // Non-critical error, don't show to user
    }
  };

  const fetchMembershipStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/membership-status/${currentUserEmail}`);
      setMembershipStatus(response.data);
      
      // If user is gold member, fetch visitors
      if (response.data.isGoldMember) {
        fetchVisitors();
      }
    } catch (error) {
      console.error("Error fetching membership status:", error);
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/profile-visitors/${currentUserEmail}`);
      setVisitors(response.data);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      // Handle specific error codes
      if (error.response && error.response.status === 403) {
        // Gold membership required or expired
        console.log(error.response.data.message);
      }
    }
  };

  const handleUpgradeToGold = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/upgrade-to-gold`, {
        email: currentUserEmail,
        durationMonths: 1 // Default to 1 month
      });
      
      // Refresh membership status
      fetchMembershipStatus();
      
      alert("Successfully upgraded to gold membership!");
    } catch (error) {
      console.error("Error upgrading to gold:", error);
      alert("Failed to upgrade: " + error.response?.data?.message || error.message);
    }
  };

  const handleLike = async (postId, isLiked) => {
    try {
      if (isLiked) {
        await axios.post(`${import.meta.env.VITE_API_URL}/unlike/${postId}`, {
          email: currentUserEmail,
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/like/${postId}`, {
          email: currentUserEmail,
        });
      }

      // Update posts state to reflect the like/unlike
      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            const updatedLikes = isLiked
              ? post.likes.filter((email) => email !== currentUserEmail)
              : [...post.likes, currentUserEmail];
            return { ...post, likes: updatedLikes };
          }
          return post;
        })
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleComment = async (postId) => {
    try {
      if (!comments[postId] || comments[postId].trim() === "") return;

      await axios.post(`${import.meta.env.VITE_API_URL}/comment/${postId}`, {
        email: currentUserEmail,
        comment: comments[postId],
      });

      // Refresh the posts to show the new comment
      const postsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${email}`);
      setPosts(postsResponse.data);

      // Clear the comment input
      setComments({
        ...comments,
        [postId]: "",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${postId}`);
        setPosts(posts.filter((post) => post._id !== postId));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  const closeImageModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  const toggleComments = (postId) => {
    setShowCommentsForPost(showCommentsForPost === postId ? null : postId);
  };

  const handleSendFriendRequest = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/send-friend-request`, {
        senderEmail: currentUserEmail,
        receiverEmail: email,
      });
      setFriendStatus("pending");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request: " + error.response?.data?.message || error.message);
    }
  };

  const handleRemoveFriend = async () => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/remove-friend`, {
          userEmail: currentUserEmail,
          friendEmail: email,
        });
        setFriendStatus("none");
      } catch (error) {
        console.error("Error removing friend:", error);
        alert("Failed to remove friend: " + error.response?.data?.message || error.message);
      }
    }
  };

  const toggleVisitorsModal = () => {
    setShowVisitors(!showVisitors);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="flex justify-center items-center h-screen">
          <div className="text-red-500 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-500 text-xl">User not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10 min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-4xl mx-auto p-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-4 md:mb-0 md:mr-6">
              {user.profilePicture ? (
                <img
                  src={`data:image/jpeg;base64,${user.profilePicture}`}
                  alt={user.name}
                  className="h-32 w-32 rounded-full object-cover cursor-pointer border-4 border-gray-200"
                  onClick={() => openImageModal(`data:image/jpeg;base64,${user.profilePicture}`)}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">{user.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start">
                <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                {membershipStatus?.isGoldMember && (
                  <FaCrown className="ml-2 text-yellow-500" title="Gold Member" />
                )}
              </div>
              <p className="text-gray-600 mb-2">{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {user.gender}
                </span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {new Date(user.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
              
              {/* Friend request/status buttons */}
              {currentUserEmail && currentUserEmail !== email && (
                <div className="mt-4">
                  {friendStatus === "none" && (
                    <button
                      onClick={handleSendFriendRequest}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                    >
                      <FaUserPlus /> Add Friend
                    </button>
                  )}
                  {friendStatus === "pending" && (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <FaCheck /> Friend Request Sent
                    </button>
                  )}
                  {friendStatus === "accepted" && (
                    <button
                      onClick={handleRemoveFriend}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                    >
                      <FaUserMinus /> Remove Friend
                    </button>
                  )}
                </div>
              )}
              
              {/* Gold membership section (only on own profile) */}
              {currentUserEmail && currentUserEmail === email && (
                <div className="mt-4">
                  {membershipStatus?.isGoldMember ? (
                    <div>
                      <div className="flex items-center justify-center md:justify-start mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded flex items-center">
                          <FaCrown className="mr-1" /> Gold Member until {new Date(membershipStatus.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={toggleVisitorsModal}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                      >
                        <FaEye /> View Profile Visitors
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpgradeToGold}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
                    >
                      <FaCrown /> Upgrade to Gold
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
              <div className="flex items-center mb-4">
                {user.profilePicture ? (
                  <img
                    src={`data:image/jpeg;base64,${user.profilePicture}`}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                    <span className="text-gray-500 text-lg">{user.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-800">{user.name}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                {currentUserEmail === email && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
              <p className="text-gray-700 mb-4">{post.text}</p>
              {post.image && (
                <div className="mb-4">
                  <img
                    src={`data:image/jpeg;base64,${post.image}`}
                    alt="Post"
                    className="rounded-lg w-full max-h-96 object-contain cursor-pointer"
                    onClick={() => openImageModal(`data:image/jpeg;base64,${post.image}`)}
                  />
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post._id, post.likes.includes(currentUserEmail))}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                  >
                    {post.likes.includes(currentUserEmail) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                    <span>{post.likes.length}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                  >
                    <FaComment />
                    <span>{post.comments.length}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={closeImageModal}>
          <div className="max-w-4xl max-h-screen" onClick={(e) => e.stopPropagation()}>
            <img src={modalImage} alt="Full size" className="max-h-[90vh] max-w-full object-contain" />
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsForPost && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowCommentsForPost(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button onClick={() => setShowCommentsForPost(null)} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {posts
                .find((post) => post._id === showCommentsForPost)
                ?.comments.map((comment, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <div className="flex items-start">
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <span className="text-gray-500 text-sm">U</span>
                      </div>
                      <div className="bg-gray-100 rounded-lg px-3 py-2 flex-1">
                        <p className="text-gray-700">{comment.commentText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {posts.find((post) => post._id === showCommentsForPost)?.comments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center">
                <input 
                  type="text" 
                  placeholder="Add a comment..." 
                  value={comments[showCommentsForPost] || ""}
                  onChange={(e) => setComments({
                    ...comments,
                    [showCommentsForPost]: e.target.value
                  })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleComment(showCommentsForPost);
                    }
                  }} 
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <button 
                  onClick={() => handleComment(showCommentsForPost)}
                  className="ml-2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Visitors Modal */}
      {showVisitors && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={toggleVisitorsModal}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center">
                <FaEye className="mr-2 text-indigo-500" /> Profile Visitors
              </h3>
              <button onClick={toggleVisitorsModal} className="text-gray-500 hover:text-gray-700">
                <FaTimesCircle />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {visitors.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {visitors.map((visitor) => (
                    <div key={visitor._id} className="py-4 flex items-center">
                      {visitor.profilePicture ? (
                        <img
                          src={`data:image/jpeg;base64,${visitor.profilePicture}`}
                          alt={visitor.name}
                          className="h-12 w-12 rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                          <span className="text-gray-500 text-lg">{visitor.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{visitor.name}</h4>
                        <p className="text-sm text-gray-500">{visitor.email}</p>
                        <p className="text-xs text-gray-400">
                          Visited on {formatDate(visitor.visitedAt)}
                        </p>
                      </div>
                      <button 
                        onClick={() => navigate(`/user/${visitor.email}`)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-md text-sm"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No one has visited your profile yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;