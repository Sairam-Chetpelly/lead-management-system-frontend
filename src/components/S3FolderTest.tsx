import React, { useState } from 'react';
import { s3FolderService } from '@/services/s3FolderService';

const S3FolderTest: React.FC = () => {
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [folders, setFolders] = useState<any[]>([]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setMessage('Please enter a folder name');
      return;
    }

    setCreating(true);
    setMessage('');

    try {
      const newFolder = await s3FolderService.createFolder({
        name: folderName.trim(),
        restricted: false
      });

      setMessage(`✅ Folder "${newFolder.name}" created successfully in S3!`);
      setFolders(prev => [newFolder, ...prev]);
      setFolderName('');
    } catch (error: any) {
      console.error('Folder creation error:', error);
      setMessage(`❌ Error: ${error.response?.data?.message || error.message || 'Failed to create folder'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Delete "${folderName}" from S3?`)) return;

    try {
      await s3FolderService.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f._id !== folderId));
      setMessage(`✅ Folder "${folderName}" deleted from S3!`);
    } catch (error: any) {
      setMessage(`❌ Delete Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const loadFolders = async () => {
    try {
      const foldersData = await s3FolderService.getFolders();
      setFolders(foldersData);
      setMessage(`📁 Loaded ${foldersData.length} folders`);
    } catch (error: any) {
      setMessage(`❌ Load Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">S3 Folder Test</h2>
      
      {/* Create Folder */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Enter folder name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={creating}
          />
          <button
            onClick={handleCreateFolder}
            disabled={creating || !folderName.trim()}
            className={`px-4 py-2 rounded-md font-medium ${
              creating || !folderName.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {creating ? 'Creating...' : 'Create S3 Folder'}
          </button>
        </div>
        
        <button
          onClick={loadFolders}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Load Folders
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md mb-4 ${
          message.startsWith('✅') ? 'bg-green-100 text-green-800' : 
          message.startsWith('❌') ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Folders List */}
      <div className="space-y-2">
        <h3 className="font-semibold">S3 Folders ({folders.length})</h3>
        {folders.map((folder) => (
          <div key={folder._id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">📁 {folder.name}</div>
              <div className="text-sm text-gray-500">
                S3 Path: {folder.s3Path || 'No S3 path'}
              </div>
              <div className="text-xs text-gray-400">
                Created: {new Date(folder.createdAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => handleDeleteFolder(folder._id, folder.name)}
              className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        ))}
        {folders.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No folders found. Create one to test S3 integration.
          </div>
        )}
      </div>
    </div>
  );
};

export default S3FolderTest;