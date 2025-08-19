import React from 'react';
import Link from 'next/link';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              LMS
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/admin" className="text-gray-700 hover:text-gray-900">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;