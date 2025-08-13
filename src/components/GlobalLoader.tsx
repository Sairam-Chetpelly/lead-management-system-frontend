'use client';

import ModernLoader from './ModernLoader';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{backgroundColor: '#0f172a'}}>
      <div className="text-center">
        <div className="mb-8">
          <img 
            src="/ReminiscentWhiteLogo.png" 
            alt="Reminiscent Logo" 
            className="w-80 h-60 object-contain mx-auto mb-2 animate-pulse"
          />
        </div>
        <ModernLoader size="lg" variant="primary" />
        <p className="text-white/80 text-lg font-medium animate-pulse">Loading...</p>
      </div>
    </div>
  );
}