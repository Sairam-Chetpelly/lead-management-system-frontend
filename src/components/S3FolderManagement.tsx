import React, { useState, useEffect } from 'react';
import { s3FolderService } from '@/services/s3FolderService';

interface S3FolderManagementProps {
  parentFolderId?: string;
  onFolderCreated?: (folder: any) => void;
  onFolderDeleted?: (folderId: string) => void;
  onError?: (error: string) => void;
}

const S3FolderManagement: React.FC<S3FolderManagementProps> = ({
  parentFolderId,
  onFolderCreated,
  onFolderDeleted,
  onError
}) => {
  const [folders, setFolders] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load folders
  const loadFolders = async () => {
    try {
      setLoading(true);
      const foldersData = await s3FolderService.getFolders(parentFolderId);
      setFolders(foldersData);
    } catch (error: any) {
      console.error('Failed to load folders:', error);
      onError?.(error.response?.data?.message || 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, [parentFolderId]);

  // Create folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      onError?.('Folder name is required');
      return;
    }

    setCreating(true);
    try {
      const newFolder = await s3FolderService.createFolder({
        name: newFolderName.trim(),
        parentFolderId,
        restricted: isRestricted
      });

      setFolders(prev => [newFolder, ...prev]);
      onFolderCreated?.(newFolder);
      
      // Reset form
      setNewFolderName('');
      setIsRestricted(false);
      setShowCreateForm(false);
      
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      onError?.(error.response?.data?.message || 'Failed to create S3 folder');
    } finally {
      setCreating(false);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}" and all its contents? This action cannot be undone.`)) {
      return;
    }

    try {
      await s3FolderService.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f._id !== folderId));
      onFolderDeleted?.(folderId);
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      onError?.(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  const getStorageTypeLabel = (folder: any) => {
    return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">S3</span>;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Folder Management</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create Folder'}
        </button>
      </div>

      {/* Create Folder Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateFolder} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-3">Create New S3 Folder</h4>
          
          {/* Folder Name */}
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter folder name"
              required
            />
          </div>

          {/* Restricted Checkbox */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Restricted folder</span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={creating || !newFolderName.trim()}
              className={`px-4 py-2 rounded-md font-medium ${
                creating || !newFolderName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {creating ? 'Creating...' : 'Create S3 Folder'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Folders List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4">Loading folders...</div>
        ) : folders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No folders found</div>
        ) : (
          folders.map((folder) => (
            <div key={folder._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="text-blue-600">
                  📁
                </div>
                <div>
                  <div className="font-medium">{folder.name}</div>
                  <div className="text-sm text-gray-500">
                    Created by {folder.createdBy?.name} • {new Date(folder.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {getStorageTypeLabel(folder)}
                {folder.restricted && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Restricted</span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDeleteFolder(folder._id, folder.name)}
                  className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                  title="Delete folder"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default S3FolderManagement;