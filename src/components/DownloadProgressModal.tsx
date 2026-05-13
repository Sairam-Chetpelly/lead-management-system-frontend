import React from 'react';
import { X, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface DownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  status: string;
  fileName?: string;
  isComplete: boolean;
  hasError: boolean;
  errorMessage?: string;
}

const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  isOpen,
  onClose,
  progress,
  status,
  fileName,
  isComplete,
  hasError,
  errorMessage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {hasError ? 'Download Failed' : isComplete ? 'Download Complete' : 'Downloading...'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={!isComplete && !hasError}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File name */}
          {fileName && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">File:</span> {fileName}
            </div>
          )}

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{status}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  hasError
                    ? 'bg-red-500'
                    : isComplete
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status icon and message */}
          <div className="flex items-center space-x-2">
            {hasError ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 text-sm">
                  {errorMessage || 'Download failed'}
                </span>
              </>
            ) : isComplete ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 text-sm">
                  Download completed successfully!
                </span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 text-blue-500 animate-bounce" />
                <span className="text-blue-600 text-sm">
                  Please wait while we prepare your download...
                </span>
              </>
            )}
          </div>

          {/* Error details */}
          {hasError && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-2">
            {(isComplete || hasError) && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
            {!isComplete && !hasError && (
              <div className="text-sm text-gray-500">
                Please don't close this window...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadProgressModal;