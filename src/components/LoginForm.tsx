'use client';

import { useState } from 'react';
import { authAPI } from '@/lib/auth';
import GlobalLoader from './GlobalLoader';
import { extractErrorMessage } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';

interface LoginFormProps {
  onLogin: (user: any) => void;
  resetToken?: string | null;
}

export default function LoginForm({ onLogin, resetToken }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user);
      showToast('Login successful! Welcome back.', 'success');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authAPI.forgotPassword({ email: forgotEmail });
      showToast('Password reset email sent successfully!', 'success');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.resetPassword({ token: resetToken!, password: newPassword });
      showToast('Password reset successfully!', 'success');
      setTimeout(() => {
        window.location.replace('/');
      }, 1500);
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
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
          {!showForgotPassword && !resetToken && (
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

            

              <button
                type="submit"
                className="w-full p-3 sm:p-4 text-white border-none rounded-lg text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 mt-4 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:translate-y-0"
                style={{backgroundColor: '#0f172a'}}
              >
                Login
              </button>
              <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            </form>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword && (
            <form className="text-left" onSubmit={handleForgotPassword}>
              <h2 className="text-xl sm:text-2xl font-normal text-gray-800 mb-6 lg:mb-8">Reset Password</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm text-gray-600 mb-2 font-medium" htmlFor="forgotEmail">
                  Email Address
                </label>
                <input
                  type="email"
                  id="forgotEmail"
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 transition-all duration-300 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 p-3 sm:p-4 text-white rounded-lg text-sm sm:text-base font-medium"
                  style={{backgroundColor: '#0f172a'}}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="flex-1 p-3 sm:p-4 bg-gray-300 text-gray-700 rounded-lg text-sm sm:text-base font-medium"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {resetToken && (
            <form className="text-left" onSubmit={handleResetPassword}>
              <h2 className="text-xl sm:text-2xl font-normal text-gray-800 mb-6 lg:mb-8">Reset Password</h2>
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm text-gray-600 mb-2 font-medium" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 transition-all duration-300 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm text-gray-600 mb-2 font-medium" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full p-3 sm:p-4 border border-gray-300 rounded-lg text-sm sm:text-base bg-gray-50 transition-all duration-300 outline-none focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full p-3 sm:p-4 text-white border-none rounded-lg text-sm sm:text-base font-medium cursor-pointer transition-all duration-300 mt-4 hover:opacity-80 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:translate-y-0"
                style={{backgroundColor: '#0f172a'}}
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>


    </div>
  );
}