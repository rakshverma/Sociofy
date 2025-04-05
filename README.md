# Sociofy

Sociofy is a full-stack social media platform that enables users to interact through personal chat, posts, comments, likes, visitor views for gold members, bot interactions, and chat rooms.

## Features

- **User Authentication:** Secure authentication using JWT.
- **Personal Chat:** End-to-end encrypted messaging with deletion options.
- **Post System:** Users can create posts with text, images, and videos.
- **Like & Comment:** Engage with posts through likes and comments.
- **Visitor Insights:** Gold members can see profile visitors.
- **Bot Feature:** AI-based bot for FAQs and assistance.
- **Chat Rooms:** Users can join public or private chat rooms.
- **Admin Moderation:** Admins can ban users no frontend for admin but mark isbanned true in MONGO DB ATLAS to ban the user.

## Tech Stack

### Backend:

- Node.js with Express.js
- Flask (Python) (optional for specific backend tasks)
- MongoDB community server(Set it up for local host)
- JWT for authentication

### Frontend:

- React.js (Vite for fast development)
- Tailwind CSS for styling

### Deployment:
- Is ready to be deployed on vercel.
- MongoDB Atlas for database hosting (optional)

## Installation & Setup

### Prerequisites

- Node.js (v16+ recommended)
- Python (if using Django for backend features)
- MongoDB (local or cloud instance)
- MySQL (for relational data storage)

### Steps

1. Install dependencies for backend:

   ```sh
   cd Backend-Sociofy
   npm install
   ```

2. Set up environment variables in a `.env` file:

   ```env
   MONGO_URI=your_mongo_connection_string
   JWT_SECRET=your_jwt_secret
   ```

3. Start the backend server:

   ```sh
   node index.js
   ```

4. Install dependencies for frontend:

   ```sh
   Current directory is frontend
   npm install
   ```

5. Start the frontend server:

   ```sh
   npm run dev
   ```

6. If using Flask for specific backend features, run:

   ```sh
   cd Backend-Sociofy
   python server.js
   ```

7. Open `http://localhost:5173` in your browser.
