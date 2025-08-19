'use client';

import { AlertTriangle, Server, Wifi, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  statusCode: number;
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const errorConfig = {
  400: {
    title: 'Bad Request',
    message: 'The request could not be understood by the server.',
    icon: AlertTriangle,
    color: 'orange'
  },
  401: {
    title: 'Unauthorized',
    message: 'You need to log in to access this resource.',
    icon: AlertTriangle,
    color: 'red'
  },
  403: {
    title: 'Forbidden',
    message: 'You don\'t have permission to access this resource.',
    icon: AlertTriangle,
    color: 'red'
  },
  404: {
    title: 'Not Found',
    message: 'The requested resource could not be found.',
    icon: AlertTriangle,
    color: 'blue'
  },
  500: {
    title: 'Internal Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    icon: Server,
    color: 'red'
  },
  502: {
    title: 'Bad Gateway',
    message: 'The server received an invalid response from upstream.',
    icon: Server,
    color: 'red'
  },
  503: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
    icon: Server,
    color: 'yellow'
  },
  504: {
    title: 'Gateway Timeout',
    message: 'The server took too long to respond.',
    icon: Wifi,
    color: 'yellow'
  }
};

export default function ErrorPage({ statusCode, title, message, onRetry }: ErrorPageProps) {
  const config = errorConfig[statusCode as keyof typeof errorConfig] || errorConfig[500];
  const Icon = config.icon;
  
  const colorClasses = {
    red: 'from-red-50 to-rose-50 bg-red-100 text-red-600 bg-red-600 hover:bg-red-700',
    blue: 'from-blue-50 to-indigo-50 bg-blue-100 text-blue-600 bg-blue-600 hover:bg-blue-700',
    yellow: 'from-yellow-50 to-orange-50 bg-yellow-100 text-yellow-600 bg-yellow-600 hover:bg-yellow-700',
    orange: 'from-orange-50 to-red-50 bg-orange-100 text-orange-600 bg-orange-600 hover:bg-orange-700'
  };
  
  const bgClass = colorClasses[config.color as keyof typeof colorClasses].split(' ')[0] + ' ' + colorClasses[config.color as keyof typeof colorClasses].split(' ')[1];
  const iconBgClass = colorClasses[config.color as keyof typeof colorClasses].split(' ')[2];
  const iconColorClass = colorClasses[config.color as keyof typeof colorClasses].split(' ')[3];
  const buttonClass = colorClasses[config.color as keyof typeof colorClasses].split(' ')[4] + ' ' + colorClasses[config.color as keyof typeof colorClasses].split(' ')[5];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className={`w-20 h-20 ${iconBgClass} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <Icon className={`w-10 h-10 ${iconColorClass}`} />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-2">{statusCode}</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">{title || config.title}</h2>
        <p className="text-gray-600 mb-6">
          {message || config.message}
        </p>
        
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`w-full flex items-center justify-center space-x-2 ${buttonClass} text-white py-3 px-4 rounded-lg transition-colors`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}