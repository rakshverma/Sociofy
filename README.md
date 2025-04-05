Thanks! Here's your finalized and corrected `README.md` based on your updates:

- The **frontend is the root directory**.
- **Flask is required** if the user wants to use the **chat room feature**.
- Everything is structured for clarity and developer-friendliness.

---

### 📄 `README.md`

```md
# 🌐 Sociofy

**Sociofy** is a full-stack social media platform that connects users through real-time chat, posts, comments, likes, AI bot interactions, and exclusive features for premium members.

---

## 🚀 Features

- 🔐 **User Authentication:** Secure JWT-based authentication.
- 💬 **Personal Chat:** End-to-end encrypted DMs with delete functionality.
- 📝 **Posts:** Share content via text, images, and videos.
- ❤️ **Like & Comment:** Engage with posts in real-time.
- 👁️ **Visitor Insights:** Gold members can view profile visitors.
- 🧠 **AI Bot:** Built-in chatbot powered by `llama3:latest` via Ollama.
- 🏠 **Chat Rooms:** Flask-powered real-time chat rooms (Python backend required).
- ⚙️ **Admin Control:** Admins can ban users by setting `isbanned: true` in MongoDB (no admin panel yet).

---

## 🧰 Tech Stack

### 🔙 Backend

- Node.js + Express.js
- Python + Flask (mandatory for chat room support)
- MongoDB (local community server or Atlas)
- JWT for authentication
- Ollama (AI serving with LLaMA 3)

### 🔝 Frontend

- React.js (Vite)
- Tailwind CSS

### ☁️ Deployment

- Frontend deployable to **Vercel**
- MongoDB Atlas support (optional for production)

---

## 🛠️ Installation & Setup

### ✅ Prerequisites

- Node.js (v16+)
- Python 3.8+
- MongoDB (local or Atlas)
- [Ollama](https://ollama.com/download) (for AI bot)
- Git

---

### 🔧 Backend Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/sociofy.git
   cd sociofy/Backend-Sociofy
   ```

2. **Install Node Backend Dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**

   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the Node.js Backend**

   ```bash
   node index.js
   ```

5. **Set Up Flask Backend (Required for Chat Rooms)**

   ```bash
   # Inside Backend-Sociofy
   pip install -r requirements.txt
   python server.py
   ```

---

### 🌐 Frontend Setup (Root Directory)

1. **Install Frontend Dependencies**

   ```bash
   npm install
   ```

2. **Start Frontend Server**

   ```bash
   npm run dev
   ```

3. **Access the App**

   Open [http://localhost:5173](http://localhost:5173)

---

### 🤖 AI Bot Setup with Ollama

Sociofy integrates an AI bot using **LLaMA 3** served locally via **Ollama**.

1. **Install Ollama**

   Download and install from [https://ollama.com/download](https://ollama.com/download)

2. **Pull LLaMA 3 Model**

   ```bash
   ollama pull llama3:latest
   ```

3. **Run the Model**

   ```bash
   ollama run llama3
   ```

   This will start the server at `http://localhost:11434`, which is used by the Flask server for bot queries.

---

### 🛠️ Fine-Tuning LLaMA 3 using Modelfile (Optional)

1. **Create a `Modelfile`**

   ```dockerfile
   FROM llama3:latest

   SYSTEM "You are Sociofy AI. Help users navigate the app and answer FAQs clearly."

   TEMPLATE "User: {{ .Input }}\nAI:"
   ```

2. **Build Your Custom Model**

   ```bash
   ollama create sociofy-bot -f Modelfile
   ```

3. **Run It**

   ```bash
   ollama run sociofy-bot
   ```

Now your bot is personalized to Sociofy’s domain.

---

## 💡 Notes

- Flask backend is **required** only if you want to use **chat room features** or **chatbot**.
- Make sure MongoDB is running locally or hosted via Atlas.

---

## 📬 Contribution

Pull requests and issues are welcome. Let’s improve Sociofy together!

---


