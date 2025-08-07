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
    primary: 'from-blue-500 to-purple-600',
    secondary: 'from-emerald-500 to-teal-600',
    accent: 'from-orange-500 to-pink-600'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer ring */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${variantClasses[variant]} opacity-20 animate-ping`}></div>
        
        {/* Middle ring */}
        <div className={`absolute inset-1 rounded-full bg-gradient-to-r ${variantClasses[variant]} opacity-40 animate-pulse`}></div>
        
        {/* Inner spinning ring */}
        <div className={`absolute inset-2 rounded-full border-2 border-transparent bg-gradient-to-r ${variantClasses[variant]} animate-spin`} 
             style={{
               background: `conic-gradient(from 0deg, transparent, currentColor, transparent)`,
               borderRadius: '50%'
             }}>
        </div>
        
        {/* Center dot */}
        <div className={`absolute inset-4 rounded-full bg-gradient-to-r ${variantClasses[variant]} animate-bounce`}></div>
      </div>
    </div>
  );
}