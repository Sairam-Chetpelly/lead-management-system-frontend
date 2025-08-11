'use client';

interface ModernLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
}

export default function ModernLoader({ size = 'md', variant = 'primary' }: ModernLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const variantClasses = {
    primary: '#0f172a',
    secondary: '#0f172a',
    accent: '#0f172a'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{backgroundColor: variantClasses[variant]}}></div>
        
        {/* Middle ring */}
        <div className="absolute inset-1 rounded-full opacity-40 animate-pulse" style={{backgroundColor: variantClasses[variant]}}></div>
        
        {/* Inner spinning ring */}
        <div className="absolute inset-2 rounded-full border-2 border-transparent animate-spin" 
             style={{
               background: `conic-gradient(from 0deg, transparent, ${variantClasses[variant]}, transparent)`,
               borderRadius: '50%'
             }}>
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-4 rounded-full animate-bounce" style={{backgroundColor: variantClasses[variant]}}></div>
      </div>
    </div>
  );
}