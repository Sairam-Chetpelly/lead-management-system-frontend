'use client';

import ModernLoader from './ModernLoader';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/ReminiscentWhiteLogo.png" 
            alt="Reminiscent Logo" 
            className="w-48 h-16 object-contain mx-auto mb-4 animate-pulse"
          />
        </div>
        <ModernLoader size="lg" variant="primary" />
        <p className="text-white/80 mt-6 text-lg font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}