import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="mb-6">
          <h1 className="text-9xl font-bold text-blue-500">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-2">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Let's get you back on track:
          </p>
          
          <div className="flex flex-col space-y-3">
            <Link 
              to="/"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </Link>
            
            {localStorage.getItem("token") && (
              <Link 
                to={`/dashboard/${localStorage.getItem("email") || ""}`}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Return to Dashboard
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </div>
      </div>
    </div>
  );
}

export default NotFound;
