require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();

app.use(express.json());
const allowedOrigins = [
  "https://frontend-sociofy-git-main-rvermas-projects.vercel.app",
  "http://localhost:5173",
];
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images and videos are allowed'), false);
    }
};
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB size limit
    }
});
// User Schema
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    dateOfBirth: { type: Date, required: true },
    profilePicture: Buffer,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGoldMember: { type: Boolean, default: false },
    goldMembershipExpiry: { type: Date, default: null },
    isBanned: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

const friendRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});


// Create a compound index to ensure uniqueness of sender-receiver pairs
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
const profileVisitSchema = new mongoose.Schema({
    visitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visited: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    visitedAt: { type: Date, default: Date.now }
});

const ProfileVisit = mongoose.model("ProfileVisit", profileVisitSchema);

// Post Schema
const postSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    text: String,
    image: Buffer,
    video: {
        data: Buffer,
        contentType: String
    },
    likes: [{ type: String }],
    comments: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            commentText: String,
            createdAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

// Signup Route
app.post("/signup", upload.single("profilePicture"), async (req, res) => {
    try {
        const { name, email, password, gender, dateOfBirth } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            gender,
            dateOfBirth,
            profilePicture: req.file ? req.file.buffer : null,
            friends: []
        });

        await newUser.save();
        res.status(201).json({ message: "Signup successful" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

const http = require('http');
const socketIo = require('socket.io');

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Join a room based on user email
    socket.on('join', (userEmail) => {
      socket.join(userEmail);
      console.log(`User ${userEmail} joined their room`);
    });
    
    // Handle new messages
    socket.on('sendMessage', async (data) => {
      try {
        const { senderEmail, receiverEmail, content } = data;
        
        // Find both users
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });
        
        if (!sender || !receiver) {
          socket.emit('error', { message: "User not found" });
          return;
        }
  
        // Check if they are friends
        if (!sender.friends.some(friendId => friendId.equals(receiver._id))) {
          socket.emit('error', { message: "You can only send messages to friends" });
          return;
        }
  
        // Create and save the message
        const message = new Message({
          sender: sender._id,
          receiver: receiver._id,
          content
        });
  
        await message.save();
  
        // Format the message for sending to the sender
        const messageForSender = {
          _id: message._id,
          content: message.content,
          isFromUser: true,
          senderEmail: senderEmail,
          receiverEmail: receiverEmail,
          createdAt: message.createdAt
        };
  
        // Send to sender
        socket.emit('newMessage', messageForSender);
        
        // Format the message for sending to the receiver
        const messageForReceiver = {
          _id: message._id,
          content: message.content,
          isFromUser: false,
          senderEmail: senderEmail,
          receiverEmail: receiverEmail,
          createdAt: message.createdAt
        };
        
        // Send to receiver
        io.to(receiverEmail).emit('newMessage', messageForReceiver);
        
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit('error', { message: "Error sending message" });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
  // Change app.listen to server.listen

  
      
      // Find both users
   
// Update Profile Route
app.put("/update-profile", async (req, res) => {
    try {
        const { email, name, gender, dateOfBirth } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        // Update user details
        user.name = name;
        user.gender = gender;
        user.dateOfBirth = new Date(dateOfBirth);

        await user.save();

        res.json({ message: "Profile updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))|| user.isBanned) {
            return res.status(400).json({ message: "Invalid credentials/Banned" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1h" }
        );

        res.json({ token, dashboardUrl: `/dashboard/${user.email}`, name: user.name });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Fetch User Profile
app.get("/user/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            name: user.name,
            email: user.email,
            gender: user.gender,
            dateOfBirth: user.dateOfBirth,
            profilePicture: user.profilePicture ? user.profilePicture.toString("base64") : null,
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update Profile Picture
app.post("/update-profile-picture", upload.single("profilePicture"), async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        user.profilePicture = req.file ? req.file.buffer : user.profilePicture;
        await user.save();

        res.json({ message: "Profile picture updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Upload a Post
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { text, email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        const newPost = new Post({
            userId: user._id,
            userName: user.name,
            text: text
        });

        // Handle file upload (image or video)
        if (req.file) {
            if (req.file.mimetype.startsWith('image/')) {
                newPost.image = req.file.buffer;
            } else if (req.file.mimetype.startsWith('video/')) {
                newPost.video = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };
            }
        }

        await newPost.save();
        res.status(201).json({ message: "Post uploaded successfully!" });
    } catch (error) {
        console.error("Error uploading post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Fetch Posts

app.post("/record-visit", async (req, res) => {
    try {
        const { visitorEmail, visitedEmail } = req.body;
        
        if (!visitorEmail || !visitedEmail) {
            return res.status(400).json({ message: "Both visitor and visited emails are required" });
        }

        // Don't record if user visits their own profile
        if (visitorEmail === visitedEmail) {
            return res.status(400).json({ message: "Cannot record visit to own profile" });
        }

        // Find both users
        const visitor = await User.findOne({ email: visitorEmail });
        const visited = await User.findOne({ email: visitedEmail });
        
        if (!visitor || !visited) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create a new visit record
        const visit = new ProfileVisit({
            visitor: visitor._id,
            visited: visited._id
        });

        await visit.save();
        res.status(201).json({ message: "Visit recorded successfully" });
    } catch (error) {
        console.error("Error recording profile visit:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get list of profile visitors (gold members only)
app.get("/profile-visitors/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is a gold member
        if (!user.isGoldMember) {
            return res.status(403).json({ message: "This feature is only available for gold members" });
        }

        // Check if gold membership has expired
        if (user.goldMembershipExpiry && new Date() > user.goldMembershipExpiry) {
            // Update user's gold status
            user.isGoldMember = false;
            await user.save();
            return res.status(403).json({ message: "Your gold membership has expired" });
        }

        // Get recent visitors, ordered by most recent first
        const visits = await ProfileVisit.find({ visited: user._id })
            .sort({ visitedAt: -1 })
            .populate('visitor', 'name email profilePicture');

        // Format the response
        const visitors = visits.map(visit => ({
            _id: visit.visitor._id,
            name: visit.visitor.name,
            email: visit.visitor.email,
            profilePicture: visit.visitor.profilePicture 
                ? visit.visitor.profilePicture.toString('base64') 
                : null,
            visitedAt: visit.visitedAt
        }));

        res.json(visitors);
    } catch (error) {
        console.error("Error fetching profile visitors:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to upgrade a user to gold membership
app.post("/upgrade-to-gold", async (req, res) => {
    try {
        const { email, durationMonths = 1 } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate expiry date (default: 1 month from now)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

        // Update user's membership status
        user.isGoldMember = true;
        user.goldMembershipExpiry = expiryDate;
        await user.save();

        res.status(200).json({ 
            message: "Successfully upgraded to gold membership",
            expiryDate: user.goldMembershipExpiry
        });
    } catch (error) {
        console.error("Error upgrading to gold membership:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Check gold membership status
app.get("/membership-status/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if gold membership has expired
        let isActive = user.isGoldMember;
        if (user.isGoldMember && user.goldMembershipExpiry && new Date() > user.goldMembershipExpiry) {
            // Update user's gold status
            user.isGoldMember = false;
            await user.save();
            isActive = false;
        }

        res.json({
            isGoldMember: isActive,
            expiryDate: user.goldMembershipExpiry
        });
    } catch (error) {
        console.error("Error checking membership status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
app.get("/posts/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const posts = await Post.find({ userId: user._id }).sort({ createdAt: -1 });

        res.json(posts.map(post => ({
            _id: post._id,
            userId: post.userId,
            userName: post.userName,
            text: post.text,
            image: post.image ? post.image.toString("base64") : null,
            video: post.video ? {
                data: post.video.data.toString("base64"),
                contentType: post.video.contentType
            } : null,
            likes: post.likes,
            comments: post.comments,
            createdAt: post.createdAt,
        })));
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
// Check friend status between two users
app.get("/friend-status", async (req, res) => {
    try {
        const { userEmail, friendEmail } = req.query;
        
        if (!userEmail || !friendEmail) {
            return res.status(400).json({ message: "Both user and friend emails are required" });
        }

        // Find both users
        const user = await User.findOne({ email: userEmail });
        const friend = await User.findOne({ email: friendEmail });
        
        if (!user || !friend) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if they are already friends
        if (user.friends.includes(friend._id)) {
            return res.json({ status: 'accepted' });
        }

        // Check if there's a pending friend request
        const pendingRequest = await FriendRequest.findOne({
            $or: [
                { sender: user._id, receiver: friend._id, status: 'pending' },
                { sender: friend._id, receiver: user._id, status: 'pending' }
            ]
        });

        if (pendingRequest) {
            return res.json({ status: 'pending' });
        }

        // No relationship
        res.json({ status: 'none' });
    } catch (error) {
        console.error("Error checking friend status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


app.post("/like/:postId", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        // Check if the email already exists in the likes array
        if (!post.likes.includes(email)) {
            post.likes.push(email);
        } else {
            return res.status(400).json({ message: "You have already liked this post" });
        }

        await post.save();
        res.status(200).json({ message: "Post liked successfully!", likes: post.likes });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

app.post("/unlike/:postId", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        if (post.likes.includes(email)) {
            post.likes = post.likes.filter(likeEmail => likeEmail !== email);
            await post.save();
            res.status(200).json({ message: "Post unliked successfully!", likes: post.likes });
        } else {
            res.status(400).json({ message: "You have not liked this post yet" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});

app.post("/comment/:postId", async (req, res) => {
    try {
      const { email, comment } = req.body;
      
      if (!email || !comment) {
        return res.status(400).json({ message: "Email and comment are required" });
      }
  
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
  
      const post = await Post.findById(req.params.postId);
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      post.comments.push({
        userId: user._id,
        commentText: comment,
        createdAt: new Date()
      });
  
      await post.save();
      res.status(200).json({ 
        message: "Comment added successfully!", 
        comments: post.comments 
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
});
  
app.delete("/delete/:postId", async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.postId);
        res.status(200).json({ message: "Post deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// FRIEND RELATED ROUTES

// Search users to add as friends
app.get("/search-users", async (req, res) => {
    try {
        const { query, email } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Find the current user
        const currentUser = await User.findOne({ email });
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Search for users whose name or email contains the query string
        // Only exclude the current user, but include friends
        const users = await User.find({
            $and: [
                { 
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ] 
                },
                { _id: { $ne: currentUser._id } }
                // Removed the $nin filter for friends
            ]
        }).select('name email profilePicture');

        // Convert profile pictures to base64
        const usersWithFormattedPics = users.map(user => {
            // Add a flag to indicate if this user is a friend
            const isFriend = currentUser.friends.some(friendId => 
                friendId.toString() === user._id.toString()
            );
            
            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture ? user.profilePicture.toString('base64') : null,
                isFriend: isFriend 
            };
        });

        res.json(usersWithFormattedPics);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Send friend request
app.post("/send-friend-request", async (req, res) => {
    try {
        const { senderEmail, receiverEmail } = req.body;
        
        if (!senderEmail || !receiverEmail) {
            return res.status(400).json({ message: "Sender and receiver emails are required" });
        }

        // Find sender and receiver
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });
        
        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if they're already friends
        if (sender.friends.includes(receiver._id)) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }

        // Check if a request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: sender._id, receiver: receiver._id },
                { sender: receiver._id, receiver: sender._id }
            ]
        });

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ message: "A friend request already exists between these users" });
            } else if (existingRequest.status === 'accepted') {
                return res.status(400).json({ message: "You are already friends with this user" });
            }
        }

        // Create new friend request
        const friendRequest = new FriendRequest({
            sender: sender._id,
            receiver: receiver._id
        });

        await friendRequest.save();
        res.status(201).json({ message: "Friend request sent successfully" });
    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get pending friend requests
app.get("/friend-requests/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all pending requests where this user is the receiver
        const pendingRequests = await FriendRequest.find({
            receiver: user._id,
            status: 'pending'
        }).populate('sender', 'name email profilePicture');

        // Format the response
        const formattedRequests = pendingRequests.map(request => ({
            requestId: request._id,
            sender: {
                _id: request.sender._id,
                name: request.sender.name,
                email: request.sender.email,
                profilePicture: request.sender.profilePicture 
                    ? request.sender.profilePicture.toString('base64') 
                    : null
            },
            createdAt: request.createdAt
        }));

        res.json(formattedRequests);
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Accept friend request
// Accept friend request
// Accept friend request
app.post("/accept-friend-request/:requestId", async (req, res) => {
    try {
        const { email } = req.body;
        const { requestId } = req.params;
        
        console.log("Accept friend request called with:", { 
            requestId, 
            email, 
            params: req.params,
            body: req.body 
        });
        
        if (!requestId || requestId === 'undefined') {
            return res.status(400).json({ message: "Invalid request ID" });
        }
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the friend request
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Verify the request is for this user
        if (!friendRequest.receiver.equals(user._id)) {
            return res.status(403).json({ message: "You are not authorized to accept this request" });
        }

        // Update request status
        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Add each user to the other's friends list
        await User.findByIdAndUpdate(
            friendRequest.sender,
            { $addToSet: { friends: friendRequest.receiver } }
        );

        await User.findByIdAndUpdate(
            friendRequest.receiver,
            { $addToSet: { friends: friendRequest.sender } }
        );

        res.json({ message: "Friend request accepted successfully" });
    } catch (error) {
        console.error("Error accepting friend request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Reject friend request
app.post("/reject-friend-request/:requestId", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the friend request
        const friendRequest = await FriendRequest.findById(req.params.requestId);
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Verify the request is for this user
        if (!friendRequest.receiver.equals(user._id)) {
            return res.status(403).json({ message: "You are not authorized to reject this request" });
        }

        // Update request status
        friendRequest.status = 'rejected';
        await friendRequest.save();

        res.json({ message: "Friend request rejected successfully" });
    } catch (error) {
        console.error("Error rejecting friend request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add a new endpoint for searching all users including friends
app.get('/search-all-users', async (req, res) => {
    try {
      const { query, email } = req.query;
      
      // Find all users whose name or email matches the query, excluding the current user
      const users = await User.find({
        $and: [
          { 
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } }
            ] 
          },
          { email: { $ne: email } } // Only exclude the current user
        ]
      }).select('name email profilePicture');
      
      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

// Get user's friends list
app.get("/friends/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email })
            .populate('friends', 'name email profilePicture');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Format the response
        const friends = user.friends.map(friend => ({
            _id: friend._id,
            name: friend.name,
            email: friend.email,
            profilePicture: friend.profilePicture 
                ? friend.profilePicture.toString('base64') 
                : null
        }));

        res.json(friends);
    } catch (error) {
        console.error("Error fetching friends list:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Get chat history between two users
app.get("/chat-history", async (req, res) => {
    try {
        const { userEmail, friendEmail } = req.query;
        
        if (!userEmail || !friendEmail) {
            return res.status(400).json({ message: "Both user and friend emails are required" });
        }

        // Find both users
        const user = await User.findOne({ email: userEmail });
        const friend = await User.findOne({ email: friendEmail });
        
        if (!user || !friend) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get messages between these users (in both directions)
        const messages = await Message.find({
            $or: [
                { sender: user._id, receiver: friend._id },
                { sender: friend._id, receiver: user._id }
            ]
        }).sort({ createdAt: 1 });

        // Format the messages
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            isFromUser: msg.sender.equals(user._id),
            createdAt: msg.createdAt
        }));

        res.json(formattedMessages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Send a message
app.post("/send-message", async (req, res) => {
    try {
        const { senderEmail, receiverEmail, content } = req.body;
        
        if (!senderEmail || !receiverEmail || !content) {
            return res.status(400).json({ 
                message: "Sender email, receiver email, and message content are required" 
            });
        }

        // Find both users
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });
        
        if (!sender || !receiver) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if they are friends
        if (!sender.friends.includes(receiver._id)) {
            return res.status(403).json({ message: "You can only send messages to friends" });
        }

        // Create and save the message
        const message = new Message({
            sender: sender._id,
            receiver: receiver._id,
            content
        });

        await message.save();

        res.status(201).json({ 
            message: "Message sent successfully",
            messageId: message._id,
            createdAt: message.createdAt
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Remove friend
app.post("/remove-friend", async (req, res) => {
    try {
        const { userEmail, friendEmail } = req.body;
        
        if (!userEmail || !friendEmail) {
            return res.status(400).json({ message: "Both user and friend emails are required" });
        }

        // Find both users
        const user = await User.findOne({ email: userEmail });
        const friend = await User.findOne({ email: friendEmail });
        
        if (!user || !friend) {
            return res.status(404).json({ message: "User not found" });
        }

        // Remove each user from the other's friends list
        await User.findByIdAndUpdate(
            user._id,
            { $pull: { friends: friend._id } }
        );

        await User.findByIdAndUpdate(
            friend._id,
            { $pull: { friends: user._id } }
        );

        // Update any existing friend request to rejected
        await FriendRequest.updateMany(
            {
                $or: [
                    { sender: user._id, receiver: friend._id },
                    { sender: friend._id, receiver: user._id }
                ],
                status: 'accepted'
            },
            { status: 'rejected' }
        );

        res.json({ message: "Friend removed successfully" });
    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get friend suggestions
app.get("/friend-suggestions/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find friends of friends who aren't already the user's friends
        // First, get all the user's friends
        const userWithFriends = await User.findById(user._id).populate('friends');
        
        if (!userWithFriends.friends.length) {
            // If user has no friends, return some random users
            const randomUsers = await User.find({
                _id: { $ne: user._id },
                email: { $ne: user.email }
            })
            .limit(5)
            .select('name email profilePicture');

            const formattedUsers = randomUsers.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                profilePicture: u.profilePicture ? u.profilePicture.toString('base64') : null,
                mutualFriends: 0
            }));

            return res.json(formattedUsers);
        }

        // Get IDs of all friends
        const friendIds = userWithFriends.friends.map(friend => friend._id);

        // Find friends of friends
        const friendsOfFriends = await User.find({
            friends: { $in: friendIds },
            _id: { $ne: user._id },
            _id: { $nin: friendIds }
        }).select('name email profilePicture friends');

        // Calculate mutual friends for each suggestion
        const suggestionsWithMutualCount = await Promise.all(
            friendsOfFriends.map(async (suggestion) => {
                // Count mutual friends
                const mutualFriends = suggestion.friends.filter(friendId => 
                    friendIds.some(id => id.equals(friendId))
                ).length;

                return {
                    _id: suggestion._id,
                    name: suggestion.name,
                    email: suggestion.email,
                    profilePicture: suggestion.profilePicture 
                        ? suggestion.profilePicture.toString('base64') 
                        : null,
                    mutualFriends
                };
            })
        );

        // Sort by number of mutual friends (descending)
        suggestionsWithMutualCount.sort((a, b) => b.mutualFriends - a.mutualFriends);

        res.json(suggestionsWithMutualCount);
    } catch (error) {
        console.error("Error getting friend suggestions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get feed (posts from user and friends)
app.get("/feed/:email", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const posts = await Post.find({
            userId: { $in: [...user.friends, user._id] }
        }).sort({ createdAt: -1 });

        const formattedPosts = posts.map(post => ({
            _id: post._id,
            userId: post.userId,
            userName: post.userName,
            text: post.text,
            image: post.image ? post.image.toString("base64") : null,
            video: post.video ? {
                data: post.video.data.toString("base64"),
                contentType: post.video.contentType
            } : null,
            likes: post.likes,
            comments: post.comments,
            createdAt: post.createdAt,
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error("Error fetching feed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Update Password Route
app.put("/update-password", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update the password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.delete("/delete-account", async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        await Post.deleteMany({ userId: user._id });
        
        await FriendRequest.deleteMany({
            $or: [
                { sender: user._id },
                { receiver: user._id }
            ]
        });
        
        await User.updateMany(
            { friends: user._id },
            { $pull: { friends: user._id } }
        );
        
        await Message.deleteMany({
            $or: [
                { sender: user._id },
                { receiver: user._id }
            ]
        });
        
        await User.findByIdAndDelete(user._id);
        
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

