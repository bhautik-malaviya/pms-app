import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-gray-800 dark:text-gray-200 mb-4">404</h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Page Not Found</p>
      <Link 
        to="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Go back to Dashboard
      </Link>
    </div>
  );
}
