'use client';

interface InactiveUserNotificationProps {
  onLogout: () => void;
}

export default function InactiveUserNotification({ onLogout }: InactiveUserNotificationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <i className="fas fa-user-slash text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Inactive</h2>
          <p className="text-gray-600">
            Your account has been deactivated. You no longer have access to the system.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Please contact your administrator to reactivate your account.
            </p>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    </div>
  );
}