import React from 'react';

interface ErrorPageProps {
  error?: string;
  onRetry?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error = 'Something went wrong', onRetry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Error</h1>
        <p className="text-xl text-gray-600 mb-8">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;