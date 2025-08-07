'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/auth';

interface LoginFormProps {
  onLogin: (user: any) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Section - Hidden on mobile/tablet */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden" style={{
        background: 'linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%)'
      }}>
        <div className="w-full h-full relative" style={{
          backgroundImage: `url('/loginleftimage.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md text-center">
          {/* Logo */}
          <div className="mb-8 lg:mb-12">
            <img src="/ReminiscentBlackLogo.png" alt="Logo" className="w-80 h-60 sm:w-80 sm:h-60 lg:w-70 lg:h-60 mx-auto mb-4 object-contain" />
          </div>

          {/* Login Form */}
          <form className="text-left" onSubmit={handleSubmit}>
            <h2 className="text-xl sm:text-2xl font-normal text-gray-800 mb-6 lg:mb-8">Login</h2>
            
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm text-gray-600 mb-2 font-medium" htmlFor="email">
                Email ID
              </label>
              <input
                type="email"
                id="email"
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 transition-all duration-300 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-sm text-gray-600 mb-2 font-medium" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 transition-all duration-300 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 bg-none border-none cursor-pointer text-gray-600 text-lg sm:text-xl p-1"
                  onClick={togglePassword}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center mb-4">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 sm:p-4 bg-gray-800 text-white border-none rounded-lg text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 mt-4 hover:bg-gray-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:translate-y-0 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}