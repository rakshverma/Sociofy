import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './Chatroom.css';
import Nav from './db/Nav';

const Chatroom = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Room state
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [newRoomMessage, setNewRoomMessage] = useState('');
  const [showRooms, setShowRooms] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const navigate = useNavigate();
  
  const userEmail = localStorage.getItem('email');
  const userName = localStorage.getItem('name');
  const token = localStorage.getItem('token');
  
  // Flask backend URL
  const FLASK_URL = 'http://localhost:5001';
  
  // Initialize socket connection
  useEffect(() => {
    if (!token || !userEmail) return;
    
    // Connect to socket server
    socketRef.current = io(`${import.meta.env.VITE_API_URL}`);
    
    // Join user's room
    socketRef.current.emit('join', userEmail);
    
    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      console.log("Received new message:", message);
      
      // Only add the message if it's from the currently selected friend
      if (selectedFriend && 
         ((message.isFromUser && message.receiverEmail === selectedFriend.email) || 
          (!message.isFromUser && message.senderEmail === selectedFriend.email))) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });
    
    // Listen for errors
    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userEmail, token, selectedFriend]);
  
  // Fetch friends list
  useEffect(() => {
    if (!token || !userEmail) return;
    
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/friends/${userEmail}`);
        setFriends(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching friends:', error);
        setLoading(false);
      }
    };
    
    fetchFriends();
    
    // Also fetch user's rooms
    fetchUserRooms();
  }, [userEmail, token]);
  
  // Fetch chat history when a friend is selected
  useEffect(() => {
    if (selectedFriend && userEmail && token) {
      fetchChatHistory();
    }
  }, [selectedFriend]);
  
  // Fetch room messages when a room is selected
  useEffect(() => {
    if (selectedRoom) {
      fetchRoomMessages();
    }
  }, [selectedRoom]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, roomMessages]);
  
  const fetchChatHistory = async () => {
    if (!selectedFriend || !userEmail || !token) return;
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/chat-history`, {
        params: {
          userEmail,
          friendEmail: selectedFriend.email
        }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };
  
  const fetchUserRooms = async () => {
    try {
      const response = await axios.get(`${FLASK_URL}/user-rooms`, {
        params: { userEmail }
      });
      
      if (response.data.success) {
        setRooms(response.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching user rooms:', error);
    }
  };
  
  const fetchRoomMessages = async () => {
    try {
      const response = await axios.get(`${FLASK_URL}/room-messages`, {
        params: { roomId: selectedRoom.room_id }
      });
      
      if (response.data.success) {
        setRoomMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching room messages:', error);
    }
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend || !userEmail || !socketRef.current) return;
    
    console.log("Sending message:", {
      senderEmail: userEmail,
      receiverEmail: selectedFriend.email,
      content: newMessage
    });
    
    // Send message via socket
    socketRef.current.emit('sendMessage', {
      senderEmail: userEmail,
      receiverEmail: selectedFriend.email,
      content: newMessage
    });
    
    // Clear input field (the actual message will be added to the UI when the socket sends it back)
    setNewMessage('');
  };
  
  const handleSendRoomMessage = async (e) => {
    e.preventDefault();
    if (!newRoomMessage.trim() || !selectedRoom || !userEmail) return;
    
    try {
      const response = await axios.post(`${FLASK_URL}/send-room-message`, {
        roomId: selectedRoom.room_id,
        senderEmail: userEmail,
        content: newRoomMessage
      });
      
      if (response.data.success) {
        // Refresh room messages
        fetchRoomMessages();
        setNewRoomMessage('');
      }
    } catch (error) {
      console.error('Error sending room message:', error);
    }
  };
  
  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    setSelectedRoom(null);
    setMessages([]);
    setShowRooms(false);
  };
  
  const selectRoom = (room) => {
    setSelectedRoom(room);
    setSelectedFriend(null);
    setRoomMessages([]);
  };

  // Function to handle room creation
  const handleCreateRoom = async () => {
    const roomName = prompt('Enter a name for your new room:');
    
    if (!roomName || !roomName.trim()) return;
    
    try {
      const response = await axios.post(`${FLASK_URL}/create-room`, {
        userEmail,
        roomName: roomName.trim()
      });
      
      if (response.data.success) {
        alert(`Room "${roomName}" created successfully! Room ID: ${response.data.roomId}`);
        // Refresh user's rooms
        fetchUserRooms();
        // Select the newly created room
        selectRoom({
          room_id: response.data.roomId,
          name: response.data.roomName
        });
        // Show rooms tab
        setShowRooms(true);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room. Please try again.');
    }
  };

  // Function to handle joining a room
  const handleJoinRoom = async () => {
    const roomId = prompt('Enter the room ID to join:');
    
    if (!roomId || !roomId.trim()) return;
    
    try {
      const response = await axios.post(`${FLASK_URL}/join-room`, {
        userEmail,
        roomId: roomId.trim()
      });
      
      if (response.data.success) {
        alert(response.data.message);
        // Refresh user's rooms
        fetchUserRooms();
        // Select the joined room
        selectRoom({
          room_id: response.data.roomId,
          name: response.data.roomName
        });
        // Show rooms tab
        setShowRooms(true);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      alert('Failed to join room. Please check the room ID and try again.');
    }
  };
  
  // Function to handle room deletion
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete the room "${selectedRoom.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    try {
      const response = await axios.post(`${FLASK_URL}/delete-room`, {
        userEmail,
        roomId: selectedRoom.room_id
      });
      
      if (response.data.success) {
        alert('Room deleted successfully');
        // Refresh user's rooms
        fetchUserRooms();
        // Clear selected room
        setSelectedRoom(null);
        setRoomMessages([]);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      // Check if it's a permission error
      if (error.response && error.response.status === 403) {
        alert('Only the room creator can delete the room.');
      } else {
        alert('Failed to delete room. Please try again.');
      }
    }
  };
  
  const toggleView = () => {
    setShowRooms(!showRooms);
    // Clear selections when toggling view
    setSelectedFriend(null);
    setSelectedRoom(null);
  };
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <>
    <Nav/>
    <div className="pt-10 chatroom-container">
      <div className="friends-sidebar">
        {/* Room control buttons */}
        <div className="room-controls">
          <button 
            className="create-room-button" 
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
          <button 
            className="join-room-button" 
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
        </div>
        
        {/* Toggle between friends and rooms */}
        <div className="view-toggle">
          <button 
            className={`toggle-button ${!showRooms ? 'active' : ''}`} 
            onClick={() => setShowRooms(false)}
          >
            Friends
          </button>
          <button 
            className={`toggle-button ${showRooms ? 'active' : ''}`} 
            onClick={() => setShowRooms(true)}
          >
            Rooms
          </button>
        </div>
        
        {/* Show either friends list or rooms list based on toggle */}
        {!showRooms ? (
          <>
            <h2>Friends</h2>
            {friends.length === 0 ? (
              <p>No friends yet. Add some friends to chat!</p>
            ) : (
              <ul className="friends-list">
                {friends.map(friend => (
                  <li 
                    key={friend._id} 
                    className={selectedFriend && selectedFriend._id === friend._id ? 'selected' : ''}
                    onClick={() => selectFriend(friend)}
                  >
                    <div className="friend-item">
                      {friend.profilePicture ? (
                        <img 
                          src={`data:image/jpeg;base64,${friend.profilePicture}`} 
                          alt={friend.name} 
                          className="friend-avatar"
                        />
                      ) : (
                        <div className="default-avatar">{friend.name.charAt(0)}</div>
                      )}
                      <span>{friend.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h2>Rooms</h2>
            {rooms.length === 0 ? (
              <p>No rooms yet. Create or join a room to start chatting!</p>
            ) : (
              <ul className="rooms-list">
                {rooms.map(room => (
                  <li 
                    key={room.room_id} 
                    className={selectedRoom && selectedRoom.room_id === room.room_id ? 'selected' : ''}
                    onClick={() => selectRoom(room)}
                  >
                    <div className="room-item">
                      <div className="room-avatar">{room.name.charAt(0)}</div>
                      <div className="room-info">
                        <span className="room-name">{room.name}</span>
                        <span className="room-id">ID: {room.room_id.substring(0, 8)}...</span>
                        {room.creator_email === userEmail && (
                          <span className="room-owner">(Owner)</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      
      <div className="chat-area">
        {selectedFriend ? (
          <>
            <div className="chat-header">
              <h3>Chat with {selectedFriend.name}</h3>
            </div>
            
            <div className="messages-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              ) : (
                messages.map(msg => (
                  <div 
                    key={msg._id} 
                    className={`message ${msg.isFromUser ? 'user-message' : 'friend-message'}`}
                  >
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : selectedRoom ? (
          <>
            <div className="chat-header">
              <h3>Room: {selectedRoom.name}</h3>
              <div className="room-details">
                <span>ID: {selectedRoom.room_id}</span>
                {selectedRoom.creator_email === userEmail && (
                  <button 
                    onClick={handleDeleteRoom}
                    className="delete-room-button"
                  >
                    Delete Room
                  </button>
                )}
              </div>
            </div>
            
            <div className="messages-container">
              {roomMessages.length === 0 ? (
                <p className="no-messages">No messages yet. Start the conversation!</p>
              ) : (
                roomMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.sender_email === userEmail ? 'user-message' : 'room-message'}`}
                  >
                    <div className="message-sender">{msg.sender_email === userEmail ? 'You' : msg.sender_email}</div>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-form" onSubmit={handleSendRoomMessage}>
              <input
                type="text"
                value={newRoomMessage}
                onChange={(e) => setNewRoomMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="select-prompt">
            <p>{showRooms ? "Select a room to start chatting" : "Select a friend to start chatting"}</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Chatroom;