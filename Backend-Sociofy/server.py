from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import sqlite3
import uuid
import os
from datetime import datetime

OLLAMA_URL = "http://localhost:11434/api/generate"

app = Flask(__name__)
CORS(app)

DB_PATH = 'chatrooms.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS rooms (
        room_id TEXT PRIMARY KEY,
        creator_email TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        name TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS room_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        joined_at TIMESTAMP NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (room_id),
        UNIQUE (room_id, user_email)
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS room_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        content TEXT NOT NULL,
        sent_at TIMESTAMP NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (room_id)
    )
    ''')
    
    conn.commit()
    conn.close()

init_db()

@app.route('/api/get', methods=['GET'])
def get_data():
    return jsonify({"model": "TinyLlama is ready to accept your questions!"})

@app.route('/api/post', methods=['POST'])
def post_data():
    data = request.json
    question = data.get("question", "")

    if not question.strip():
        return jsonify({"error": "Question cannot be empty"}), 400

    payload = {
        "model": "sociofybot",  
        "prompt": question,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload)

    if response.status_code == 200:
        result = response.json()
        return jsonify({"answer": result.get('response', 'No response received')})
    else:
        return jsonify({"error": f"Error {response.status_code}: {response.text}"}), 500


@app.route('/create-room', methods=['POST'])
def create_room():
    data = request.json
    user_email = data.get('userEmail')
    room_name = data.get('roomName', f"Room by {user_email}")
    
    if not user_email:
        return jsonify({"error": "User email is required"}), 400
    
    room_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO rooms (room_id, creator_email, created_at, name) VALUES (?, ?, ?, ?)",
            (room_id, user_email, datetime.now(), room_name)
        )
        
        cursor.execute(
            "INSERT INTO room_members (room_id, user_email, joined_at) VALUES (?, ?, ?)",
            (room_id, user_email, datetime.now())
        )
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "roomId": room_id,
            "roomName": room_name,
            "message": "Room created successfully"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create room: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/join-room', methods=['POST'])
def join_room():
    data = request.json
    user_email = data.get('userEmail')
    room_id = data.get('roomId')
    
    if not user_email or not room_id:
        return jsonify({"error": "User email and room ID are required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT room_id, name FROM rooms WHERE room_id = ?", (room_id,))
        room = cursor.fetchone()
        
        if not room:
            return jsonify({"error": "Room not found"}), 404
        
        try:
            cursor.execute(
                "INSERT INTO room_members (room_id, user_email, joined_at) VALUES (?, ?, ?)",
                (room_id, user_email, datetime.now())
            )
            conn.commit()
            message = "Joined room successfully"
        except sqlite3.IntegrityError:
            message = "You are already a member of this room"
        
        return jsonify({
            "success": True,
            "roomId": room[0],
            "roomName": room[1],
            "message": message
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to join room: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/delete-room', methods=['POST'])
def delete_room():
    data = request.json
    user_email = data.get('userEmail')
    room_id = data.get('roomId')
    
    if not user_email or not room_id:
        return jsonify({"error": "User email and room ID are required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT creator_email FROM rooms WHERE room_id = ?", (room_id,))
        room = cursor.fetchone()
        
        if not room:
            return jsonify({"error": "Room not found"}), 404
            
        if room[0] != user_email:
            return jsonify({"error": "Only the room creator can delete this room"}), 403
        
        cursor.execute("DELETE FROM room_messages WHERE room_id = ?", (room_id,))
        
        cursor.execute("DELETE FROM room_members WHERE room_id = ?", (room_id,))
        
        cursor.execute("DELETE FROM rooms WHERE room_id = ?", (room_id,))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Room deleted successfully"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to delete room: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/room-messages', methods=['GET'])
def get_room_messages():
    room_id = request.args.get('roomId')
    
    if not room_id:
        return jsonify({"error": "Room ID is required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row 
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, sender_email, content, sent_at 
            FROM room_messages 
            WHERE room_id = ? 
            ORDER BY sent_at ASC
        """, (room_id,))
        
        messages = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "success": True,
            "messages": messages
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch messages: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/send-room-message', methods=['POST'])
def send_room_message():
    data = request.json
    room_id = data.get('roomId')
    sender_email = data.get('senderEmail')
    content = data.get('content')
    
    if not room_id or not sender_email or not content:
        return jsonify({"error": "Room ID, sender email, and content are required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if user is a member of the room
        cursor.execute("SELECT 1 FROM room_members WHERE room_id = ? AND user_email = ?", (room_id, sender_email))
        if not cursor.fetchone():
            return jsonify({"error": "You are not a member of this room"}), 403
        
        # Store the message
        cursor.execute(
            "INSERT INTO room_messages (room_id, sender_email, content, sent_at) VALUES (?, ?, ?, ?)",
            (room_id, sender_email, content, datetime.now())
        )
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Message sent successfully"
        })
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to send message: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/user-rooms', methods=['GET'])
def get_user_rooms():
    user_email = request.args.get('userEmail')
    
    if not user_email:
        return jsonify({"error": "User email is required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT r.room_id, r.name, r.created_at, r.creator_email
            FROM rooms r
            JOIN room_members rm ON r.room_id = rm.room_id
            WHERE rm.user_email = ?
        """, (user_email,))
        
        rooms = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "success": True,
            "rooms": rooms
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch rooms: {str(e)}"}), 500
    finally:
        conn.close()

@app.route('/room-members', methods=['GET'])
def get_room_members():
    room_id = request.args.get('roomId')
    
    if not room_id:
        return jsonify({"error": "Room ID is required"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT user_email, joined_at
            FROM room_members
            WHERE room_id = ?
        """, (room_id,))
        
        members = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "success": True,
            "members": members
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch room members: {str(e)}"}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)