import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/login`, { email, password });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", email);
      localStorage.setItem("name", response.data.name);

      navigate(`/dashboard/${email}`);
    } catch (error) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-0 m-0 h-screen">
      <div className="bg-white p-10 rounded-lg shadow-xl w-full max-w-md transform transition-all hover:shadow-2xl duration-300">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-center text-blue-800 mb-2 tracking-wide">SOCIOFY</h1>
          <h2 className="text-xl font-semibold text-center text-gray-600 mb-2">Welcome Back!</h2>
          <div className="w-16 h-1 mx-auto bg-blue-800 rounded-full"></div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center">
            
          
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-blue-800 text-white py-3 rounded-lg hover:bg-blue-900 transition duration-300 font-semibold"
            >
              Sign In
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-blue-700 cursor-pointer hover:underline font-semibold transition-colors"
            >

            </span>
          </p>
        </div>
        
        <div className="mt-6 flex items-center justify-center">
          <div className="h-px bg-gray-300 w-full"></div>
          <p className="mx-4 text-sm text-gray-500">Just</p>
          <div className="h-px bg-gray-300 w-full"></div>
        </div>
        
        <div className="mt-6">
          <button  onClick={() => navigate("/signup")} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 p-3 rounded-lg hover:bg-gray-50 transition font-medium">
           
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
