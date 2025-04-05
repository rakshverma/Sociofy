import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Chatbot() {
  const [data, setData] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  useEffect(() => {
    const initialMessages = [
      { role: 'assistant', message: 'Hello! How can I help you today? Feel free to ask me anything.' },
    ];

    setData(initialMessages); 
  }, []);

  const sendData = async () => {
    if (!inputValue.trim()) {
      console.warn('Please enter a question!');
      return;
    }

    setData(prevData => [...prevData, { role: 'user', message: inputValue }]);
    setInputValue(''); // Reset the input field

    // Request short, friendly response from backend
    const postData = {
      question: inputValue,
      prompt: "Answer in less words and try to be short and succinct to the answer" // Request short, friendly response from backend
    };

    // Add "Loading..." message to indicate waiting
    setData(prevData => [...prevData, { role: 'assistant', message: 'Loading...' }]);

    try {
      // Send the request to the backend
      const response = await axios.post('http://localhost:5001/api/post', postData);
      const shortAnswer = response.data.answer; 

      // Remove the "Loading..." message and add the assistant's response
      setData(prevData => prevData.filter(item => item.message !== 'Loading...')); // Remove "Loading..."
      setData(prevData => [...prevData, { role: 'assistant', message: shortAnswer }]); // Add assistant's response
    } catch (error) {
      console.error('Error:', error);
      // In case of an error, remove "Loading..." and display error message
      setData(prevData => prevData.filter(item => item.message !== 'Loading...'));
      setData(prevData => [...prevData, { role: 'assistant', message: 'An error occurred.' }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendData();
    }
  };

  const toggleChatbot = () => {
    setIsChatbotVisible(!isChatbotVisible);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={toggleChatbot}
        className="text-xl fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        {isChatbotVisible ? '🥺' : '🤖'}
      </button>

      {/* Chatbot */}
      {isChatbotVisible && (
        <div className="fixed bottom-16 left-4 w-80 p-4 bg-white rounded-lg shadow-lg border">
          <h2 className="text-xl font-bold mb-4">Chatbot</h2>

          <div className="space-y-4 overflow-y-auto max-h-64">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'} items-left`}
              >
                <div
                  className={`p-2 max-w-xs rounded-lg ${item.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {item.message}
                </div>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Enter your question"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress} // Handle Enter key press
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          />
          <button
            onClick={sendData}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
