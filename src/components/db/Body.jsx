import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

function Body() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedPosts, setUploadedPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalImage, setModalImage] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [comments, setComments] = useState({});
  const [showCommentsForPost, setShowCommentsForPost] = useState(null);
  const [friends, setFriends] = useState([]);

  const email = localStorage.getItem("email") || "test_email";

  useEffect(() => {
    if (email) {
      fetchUserProfile();
      fetchPosts();
      fetchFriends();
    }
  
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setModalImage(null);
        setShowCommentsForPost(null);
      }
    };
  
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [email]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`);
      setUserProfile(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile.");
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/${email}`);
      setUploadedPosts(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Failed to load posts.");
      setLoading(false);
    }
  };

  const navigateToFriendProfile = (friendEmail) => {
    navigate(`/user-profile/${friendEmail}`);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5MB.");
      return;
    }

    setSelectedFile(file);
    setUploadError("");

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!postText && !selectedFile) {
      setUploadError("Please enter some text or upload an image.");
      return;
    }

    const formData = new FormData();
    formData.append("text", postText);
    formData.append("email", email);
    if (selectedFile) formData.append("image", selectedFile);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Post uploaded successfully!");
      setSelectedFile(null);
      setPreview(null);
      setPostText("");
      setUploadError("");
      fetchPosts();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload post. Try again.");
    }
  };

  const getUserName = (userId) => {
    const post = uploadedPosts.find(post => post.userId.toString() === userId.toString());
    return post ? post.userName : "Unknown User";
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/like/${postId}`, { email });
      fetchPosts();
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId) => {
    const comment = comments[postId];
    if (!comment || !comment.trim()) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/comment/${postId}`, { email, comment });
      setComments({
        ...comments,
        [postId]: ""
      });
      fetchPosts();
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/delete/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const getRecentComments = (comments, count) => {
    if (!comments || !comments.length) return [];
    return [...comments]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, count);
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/${email}`);
      setFriends(response.data);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };
  
  return (
    <div className="pt-16 mt-4 flex min-h-screen bg-gray-100">
      <aside className="w-72 bg-white shadow-lg p-6">
        <div className="text-center">
          {userProfile?.profilePicture ? (
            <img
              src={`data:image/png;base64,${userProfile.profilePicture}`}
              alt="Profile"
              className="w-24 h-24 mx-auto rounded-full border-4 border-blue-500 cursor-pointer"
              onClick={() => setModalImage(`data:image/png;base64,${userProfile.profilePicture}`)}
            />
          ) : (
            <i className="bx bx-user text-7xl text-gray-400"></i>
          )}
          <h2 className="mt-3 text-xl font-semibold">{userProfile?.name || "User"}</h2>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 flex items-center">
            <i className="bx bx-group mr-2 text-blue-500"></i> Friends
          </h3>
          
          <div className="mt-3 max-h-64 overflow-y-auto">
            {friends.length > 0 ? (
              friends.map((friend) => (
                <div 
                  key={friend._id} 
                  className="flex items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  onClick={() => navigateToFriendProfile(friend.email)}
                >
                  {friend.profilePicture ? (
                    <img
                      src={`data:image/png;base64,${friend.profilePicture}`}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <i className="bx bx-user text-gray-400"></i>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">{friend.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm py-2">No friends yet</p>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6">
        <form className="bg-white p-6 rounded-lg shadow-lg" onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="w-full p-3 border rounded-md"
          />
          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3" />
          {preview && (
            <img 
              src={preview} 
              alt="Preview" 
              className="mt-3 rounded-lg max-w-xs cursor-pointer" 
              onClick={() => setModalImage(preview)}
            />
          )}
          {uploadError && <p className="text-red-500 mt-2">{uploadError}</p>}
          <button type="submit" className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
            Post
          </button>
        </form>

        <div className="mt-6 space-y-6">
          {loading ? <p className="text-gray-500">Loading...</p> : null}
          {error && <p className="text-red-500">{error}</p>}
          {uploadedPosts.map((post) => (
            <div key={post._id} className="bg-white p-4 rounded-lg shadow-md">
              <strong className="text-gray-800">{post.userName}</strong>
              <p className="text-gray-700 mt-2">{post.text}</p>
              {post.image && (
                <img 
                  src={`data:image/png;base64,${post.image}`} 
                  alt="Post" 
                  className="w-40 h-40 object-cover mt-2 rounded-lg cursor-pointer" 
                  onClick={() => setModalImage(`data:image/png;base64,${post.image}`)}
                />
              )}
              
              <div className="mt-2">
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-2">
                    <div 
                      className="text-sm text-blue-500 cursor-pointer hover:underline"
                      onClick={() => setShowCommentsForPost(post._id)}
                    >
                      View all {post.comments.length} comments
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      {getRecentComments(post.comments, 2).map((comment, index) => (
                        <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>{getUserName(comment.userId)}</strong>: {comment.commentText}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4 mt-3">
                <button onClick={() => handleLike(post._id)} className="text-blue-500 hover:underline">👍 Like ({post.likes.length})</button>
                <button onClick={() => handleDelete(post._id)} className="text-gray-500 hover:underline">🗑️ Delete</button>
              </div>
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={comments[post._id] || ""}
                onChange={(e) => setComments({
                  ...comments,
                  [post._id]: e.target.value
                })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleComment(post._id);
                  }
                }} 
                className="w-full mt-2 p-2 border rounded-md" 
              />
            </div>
          ))}
        </div>
      </main>

      {/* Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img 
              src={modalImage} 
              alt="Enlarged view" 
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setModalImage(null)}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsForPost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowCommentsForPost(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Comments</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCommentsForPost(null)}
              >
                <i className="bx bx-x text-2xl"></i>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh] pr-2">
              {uploadedPosts.find(post => post._id === showCommentsForPost)?.comments
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((comment, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{getUserName(comment.userId)}</p>
                        <p className="text-gray-700">{comment.commentText}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="mt-4">
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
                className="w-full p-2 border rounded-md" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Body;
