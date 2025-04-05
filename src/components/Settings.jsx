import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from './db/Nav'

const Settings = () => {
  const [user, setUser] = useState({
    name: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    profilePicture: null
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const email = localStorage.getItem('email');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/user/${email}`, {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
        
        setUser({
          name: response.data.name,
          email: response.data.email,
          gender: response.data.gender,
          dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : '',
          profilePicture: response.data.profilePicture
        });
        
        if (response.data.profilePicture) {
          setProfileImage(`data:image/jpeg;base64,${response.data.profilePicture}`);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch user data');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]));
      
      const formData = new FormData();
      formData.append('profilePicture', e.target.files[0]);
      formData.append('email', user.email);
      
      axios.post(`${import.meta.env.VITE_API_URL}/update-profile-picture`, formData)
        .then(response => {
          setMessage('Profile picture updated successfully');
        })
        .catch(error => {
          setError('Failed to update profile picture');
        });
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/update-profile`, {
        email: user.email,
        name: user.name,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth
      });
      
      setMessage('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile');
    }
  };
  
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/update-password`, {
        email: user.email,
        password: password
      });
      
      setMessage('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user.email) {
      setError('Please enter your email correctly to confirm account deletion');
      return;
    }
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/delete-account`, {
        data: { email: user.email }
      });
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('name');
      
      // Redirect to login page
      navigate('/login', { state: { message: 'Your account has been deleted successfully' } });
    } catch (error) {
      setError('Failed to delete account');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
    <Nav/>
    <div className="pt-20 container mx-auto px-4 py-8 max-w-4xl">
      
      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-6 md:mb-0 flex flex-col items-center">
            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 bg-gray-200">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}
            </div>
            <label className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded cursor-pointer">
              Change Photo
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleProfilePictureChange} 
              />
            </label>
          </div>
          
          <div className="md:w-2/3 md:pl-8">
            <form onSubmit={handleUpdateProfile}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="name"
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
                  id="email"
                  type="email"
                  name="email"
                  value={user.email}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gender">
                  Gender
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="gender"
                  name="gender"
                  value={user.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dateOfBirth">
                  Date of Birth
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id="dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  value={user.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="flex items-center justify-end">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Change Password</h2>
        <form onSubmit={handleUpdatePassword}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              New Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
      
      {/* Delete Account Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6 text-red-600">Delete Account</h2>
        <p className="mb-4 text-gray-700">
          Warning: This action cannot be undone. All your data, posts, and messages will be permanently deleted.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete My Account
          </button>
        ) : (
          <div className="border border-red-300 rounded p-4 bg-red-50">
            <p className="mb-4 text-red-700 font-semibold">
              Please type your email address to confirm deletion: {user.email}
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="shadow appearance-none border border-red-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
              placeholder="Enter your email to confirm"
            />
            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={deleteConfirmText !== user.email}
              >
                Permanently Delete Account
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Settings;
