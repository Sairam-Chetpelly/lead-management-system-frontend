'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Upload, Download, Search, ArrowLeft, File, Eye, X } from 'lucide-react';
import { folderService } from '@/services/folderService';
import { documentService } from '@/services/documentService';
import { keywordService } from '@/services/keywordService';
import { useToast } from '@/contexts/ToastContext';
import SearchableKeywordDropdown from './SearchableKeywordDropdown';
import Modal from './Modal';
import ModernLoader from './ModernLoader';
import DeleteDialog from './DeleteDialog';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export default function FoldersManagement() {
  const [folders, setFolders] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [allKeywords, setAllKeywords] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [folderName, setFolderName] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKeywords, setUploadKeywords] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewType, setPreviewType] = useState<'csv' | 'excel' | 'doc' | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, type: 'folder' | 'document', id: string, name: string }>({ isOpen: false, type: 'folder', id: '', name: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    loadKeywords();
  }, [currentFolder, searchKeyword, filterKeywords]);

  const loadKeywords = async () => {
    try {
      const data = await keywordService.getAllKeywords();
      // Handle both paginated and non-paginated responses
      const keywordsList = data.keywords || data || [];
      setAllKeywords(Array.isArray(keywordsList) ? keywordsList : []);
    } catch (error: any) {
      console.error('Failed to load keywords:', error);
      setAllKeywords([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, documentsData] = await Promise.all([
        folderService.getFolders(currentFolder || undefined),
        documentService.getDocuments(currentFolder || undefined, searchKeyword || undefined, filterKeywords.length > 0 ? filterKeywords : undefined)
      ]);
      setFolders(foldersData);
      setDocuments(documentsData);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openFolder = async (folder: any) => {
    setCurrentFolder(folder._id);
    setFolderPath([...folderPath, folder]);
  };

  const goBack = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1]._id : null);
    }
  };

  const handleCreateFolder = async () => {
    try {
      await folderService.createFolder({
        name: folderName,
        parentFolderId: currentFolder || undefined
      });
      showToast('Folder created successfully', 'success');
      setShowCreateModal(false);
      setFolderName('');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create folder', 'error');
    }
  };

  const handleEditFolder = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setShowEditFolderModal(true);
  };

  const handleUpdateFolder = async () => {
    try {
      await folderService.updateFolder(editingFolder._id, { name: folderName });
      showToast('Folder updated successfully', 'success');
      setShowEditFolderModal(false);
      setEditingFolder(null);
      setFolderName('');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update folder', 'error');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showToast('Please select a file', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (currentFolder) formData.append('folderId', currentFolder);
      formData.append('category', uploadCategory);
      if (uploadTitle) formData.append('title', uploadTitle);
      if (uploadSubtitle) formData.append('subtitle', uploadSubtitle);
      if (uploadKeywords.length > 0) formData.append('keywords', uploadKeywords.join(','));

      await documentService.uploadDocument(formData);
      showToast('Document uploaded successfully', 'success');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadKeywords([]);
      setUploadCategory('other');
      setUploadTitle('');
      setUploadSubtitle('');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEditDocument = (doc: any) => {
    setEditingDocument(doc);
    setUploadTitle(doc.title || '');
    setUploadSubtitle(doc.subtitle || '');
    setUploadCategory(doc.category || 'other');
    setUploadKeywords(doc.keywords?.map((k: any) => k.name) || []);
    setShowEditModal(true);
  };

  const handleUpdateDocument = async () => {
    try {
      await documentService.updateDocument(editingDocument._id, {
        title: uploadTitle,
        subtitle: uploadSubtitle,
        category: uploadCategory,
        keywords: uploadKeywords
      });
      showToast('Document updated successfully', 'success');
      setShowEditModal(false);
      setEditingDocument(null);
      setUploadKeywords([]);
      setUploadCategory('other');
      setUploadTitle('');
      setUploadSubtitle('');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to update document', 'error');
    }
  };

  const handleDeleteFolder = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, type: 'folder', id, name });
  };

  const handleDeleteDocument = async (id: string, name: string) => {
    setDeleteDialog({ isOpen: true, type: 'document', id, name });
  };

  const confirmDelete = async () => {
    try {
      if (deleteDialog.type === 'folder') {
        await folderService.deleteFolder(deleteDialog.id);
        showToast('Folder deleted successfully', 'success');
      } else {
        await documentService.deleteDocument(deleteDialog.id);
        showToast('Document deleted successfully', 'success');
      }
      loadData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || `Failed to delete ${deleteDialog.type}`;
      showToast(errorMessage, 'error');
    } finally {
      setDeleteDialog({ isOpen: false, type: 'folder', id: '', name: '' });
    }
  };

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const blob = await documentService.downloadDocument(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Document downloaded successfully', 'success');
    } catch (error: any) {
      console.log('Download error:', error);
      let errorMessage = 'Failed to download document';
      
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.message || json.error || errorMessage;
        } catch (e) {
          // If parsing fails, use default message
        }
      } else {
        errorMessage = error.response?.data?.message || error.response?.data?.error || errorMessage;
      }
      
      showToast(errorMessage, 'error');
    }
  };

  const getViewUrl = (filePath: string) => {
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/documents/${fileName}`;
    console.log('View URL:', url);
    return url;
  };

  const canPreview = (fileType: string) => {
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' || 
           fileType.startsWith('video/') || 
           fileType.startsWith('audio/');
  };

  const handleViewDocument = async (doc: any) => {
    setViewDocument(doc);
    setPreviewContent('');
    setPreviewType(null);

    // Handle TXT
    if (doc.fileType === 'text/plain' || doc.fileName.endsWith('.txt')) {
      try {
        const response = await fetch(getViewUrl(doc.filePath));
        const text = await response.text();
        setPreviewContent(`<pre class="whitespace-pre-wrap p-4">${text}</pre>`);
        setPreviewType('csv');
      } catch (error) {
        console.error('TXT parse error:', error);
      }
    }
    // Handle CSV
    else if (doc.fileType === 'text/csv' || doc.fileName.endsWith('.csv')) {
      try {
        const response = await fetch(getViewUrl(doc.filePath));
        const text = await response.text();
        Papa.parse(text, {
          complete: (result) => {
            const html = `<table class="min-w-full border-collapse border border-gray-300">
              ${result.data.map((row: any, i: number) => `
                <tr class="${i === 0 ? 'bg-gray-100 font-bold' : ''}">
                  ${row.map((cell: any) => `<td class="border border-gray-300 px-4 py-2">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </table>`;
            setPreviewContent(html);
            setPreviewType('csv');
          }
        });
      } catch (error) {
        console.error('CSV parse error:', error);
      }
    }
    // Handle Excel
    else if (doc.fileType.includes('sheet') || doc.fileType.includes('excel') || doc.fileType.includes('spreadsheet') || doc.fileName.match(/\.(xlsx|xls|xlsm|xlsb|xltx|xltm|xlt|csv)$/)) {
      try {
        const response = await fetch(getViewUrl(doc.filePath));
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const html = XLSX.utils.sheet_to_html(firstSheet, { header: '', footer: '' });
        // Add Tailwind classes to the generated table
        const styledHtml = html
          .replace('<table', '<table class="min-w-full border-collapse border border-gray-300"')
          .replace(/<td/g, '<td class="border border-gray-300 px-3 py-2 text-sm"')
          .replace(/<th/g, '<th class="border border-gray-300 px-3 py-2 text-sm font-bold bg-gray-100"');
        setPreviewContent(styledHtml);
        setPreviewType('excel');
      } catch (error) {
        console.error('Excel parse error:', error);
      }
    }
    // Handle Word
    else if (doc.fileType.includes('word') || doc.fileType.includes('document') || doc.fileType.includes('msword') || doc.fileType.includes('wordprocessingml') || doc.fileName.match(/\.(docx|doc|docm|dotx|dotm|dot|rtf|odt)$/)) {
      try {
        const response = await fetch(getViewUrl(doc.filePath));
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewContent(result.value);
        setPreviewType('doc');
      } catch (error) {
        console.error('Word parse error:', error);
      }
    }
  };

  const handleCreateKeyword = async (name: string) => {
    try {
      // Check if keyword already exists
      const existing = allKeywords.find(k => k.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        showToast('Keyword already exists', 'info');
        return;
      }
      
      await keywordService.createKeyword({ name });
      showToast('Keyword created successfully', 'success');
      await loadKeywords();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create keyword';
      showToast(errorMsg, 'error');
      throw error;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Breadcrumb Navigation */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
              <button onClick={() => { setCurrentFolder(null); setFolderPath([]); }} className="hover:text-blue-600 font-medium transition-colors">🏠 Root</button>
              {folderPath.map((folder, idx) => (
                <span key={folder._id} className="flex items-center gap-2">
                  <span className="text-slate-400">/</span>
                  <button onClick={() => {
                    const newPath = folderPath.slice(0, idx + 1);
                    setFolderPath(newPath);
                    setCurrentFolder(folder._id);
                  }} className="hover:text-blue-600 font-medium transition-colors">
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>
          </div>
          {folderPath.length > 0 && (
            <button
              onClick={goBack}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-2xl font-medium hover:bg-slate-200 transition-all shadow-sm"
            >
              <ArrowLeft size={18} /> <span>Back</span>
            </button>
          )}
        </div>
        
        {/* Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Search by keyword..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <div>
            <SearchableKeywordDropdown
              keywords={allKeywords}
              selectedKeywords={filterKeywords}
              onChange={setFilterKeywords}
              placeholder="🏷️ Filter by keywords..."
            />
          </div>
        </div>
        {(searchKeyword || filterKeywords.length > 0) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Active Filters:</span>
            {searchKeyword && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                Search: {searchKeyword}
                <button onClick={() => setSearchKeyword('')} className="hover:bg-blue-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            {filterKeywords.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                Keywords: {filterKeywords.length}
                <button onClick={() => setFilterKeywords([])} className="hover:bg-purple-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-3xl">
            <ModernLoader size="lg" variant="primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentUser?.role === 'admin' && (
              <>
                <div
                  onClick={() => setShowCreateModal(true)}
                  className="group p-6 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 min-h-[140px]"
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Plus className="text-blue-600" size={24} />
                    </div>
                    <div className="font-semibold text-slate-700 text-center">Create Folder</div>
                  </div>
                </div>
                <div
                  onClick={() => setShowUploadModal(true)}
                  className="group p-6 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 min-h-[140px]"
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Upload className="text-green-600" size={24} />
                    </div>
                    <div className="font-semibold text-slate-700 text-center">Upload Document</div>
                  </div>
                </div>
              </>
            )}
            {!searchKeyword && filterKeywords.length === 0 && folders.map((folder) => (
              <div
                key={folder._id}
                onClick={() => openFolder(folder)}
                className="group p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-100 hover:border-blue-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <FolderOpen className="text-white" size={24} />
                  </div>
                  {currentUser?.role === 'admin' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleEditFolder(folder, e)}
                        className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteFolder(folder._id, folder.name, e)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="font-bold text-slate-900 truncate">{folder.name}</div>
                <div className="text-xs text-slate-600 mt-1">Folder</div>
                {folder.path && (
                  <div className="text-xs text-slate-500 mt-1 truncate" title={folder.path}>
                    📂 {folder.path}
                  </div>
                )}
              </div>
            ))}

            {documents.map((doc) => (
              <div 
                key={doc._id} 
                className="group p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 cursor-pointer"
                onClick={() => handleViewDocument(doc)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center">
                    <File className="text-white" size={24} />
                  </div>
                  <div className="flex gap-1">
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditDocument(doc); }}
                        className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewDocument(doc); }}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(doc._id, doc.fileName); }}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                      title="Download"
                    >
                      <Download size={16} />
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc._id, doc.title || doc.fileName); }}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-black-300" title={doc.fileName}>{doc.fileName}</div>
                <div className="font-bold text-slate-900 truncate" title={doc.fileName}>{doc.title }</div>
                {doc.subtitle && <div className="text-xs text-slate-600 mt-1 truncate">{doc.subtitle}</div>}
                <div className="text-xs text-slate-500 mt-1 capitalize">{doc.category}</div>
                {(searchKeyword || filterKeywords.length > 0) && doc.folderId && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <FolderOpen size={12} />
                    <span className="truncate">{doc.folderId?.name || 'Unknown Folder'}</span>
                  </div>
                )}
                {doc.keywords && doc.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.keywords.slice(0, 3).map((k: any) => (
                      <span key={k._id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">{k.name}</span>
                    ))}
                    {doc.keywords.length > 3 && <span className="text-xs text-slate-500">+{doc.keywords.length - 3}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setFolderName(''); }}
        title="📁 Create New Folder"
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Folder Name <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
              autoFocus
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{backgroundColor: '#0f172a'}}
            >
              📁 Create Folder
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); setFolderName(''); }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditFolderModal}
        onClose={() => { setShowEditFolderModal(false); setEditingFolder(null); setFolderName(''); }}
        title="✏️ Edit Folder"
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateFolder(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Folder Name <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
              autoFocus
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ✏️ Update Folder
            </button>
            <button
              type="button"
              onClick={() => { setShowEditFolderModal(false); setEditingFolder(null); setFolderName(''); }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadFile(null);
          setUploadTitle('');
          setUploadSubtitle('');
          setUploadCategory('other');
          setUploadKeywords([]);
        }}
        title="📤 Upload Document"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Select File <span className="text-xs text-red-500">*</span></label>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {uploadFile && <p className="text-xs text-slate-600 mt-2">📎 {uploadFile.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Title <span className="text-xs text-slate-500">(optional)</span></label>
            <input
              type="text"
              placeholder="Enter document title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Subtitle <span className="text-xs text-slate-500">(optional)</span></label>
            <input
              type="text"
              placeholder="Enter document subtitle"
              value={uploadSubtitle}
              onChange={(e) => setUploadSubtitle(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Category <span className="text-xs text-red-500">*</span></label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
            >
              <option value="identity">🪪 Identity</option>
              <option value="financial">💰 Financial</option>
              <option value="property">🏠 Property</option>
              <option value="agreement">📝 Agreement</option>
              <option value="other">📄 Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Keywords <span className="text-xs text-slate-500">(optional)</span></label>
            <SearchableKeywordDropdown
              keywords={allKeywords}
              selectedKeywords={uploadKeywords}
              onChange={setUploadKeywords}
              onCreateKeyword={handleCreateKeyword}
              placeholder="Type 3+ characters to search keywords..."
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                '📤 Upload Document'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUploadModal(false);
                setUploadFile(null);
                setUploadTitle('');
                setUploadSubtitle('');
                setUploadCategory('other');
                setUploadKeywords([]);
              }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingDocument(null);
          setUploadTitle('');
          setUploadSubtitle('');
          setUploadCategory('other');
          setUploadKeywords([]);
        }}
        title="✏️ Edit Document"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateDocument(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">File Name</label>
            <div className="px-5 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 font-medium">
              📎 {editingDocument?.fileName}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Title <span className="text-xs text-slate-500">(optional)</span></label>
            <input
              type="text"
              placeholder="Enter document title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Subtitle <span className="text-xs text-slate-500">(optional)</span></label>
            <input
              type="text"
              placeholder="Enter document subtitle"
              value={uploadSubtitle}
              onChange={(e) => setUploadSubtitle(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Category <span className="text-xs text-red-500">*</span></label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
            >
              <option value="identity">🪪 Identity</option>
              <option value="financial">💰 Financial</option>
              <option value="property">🏠 Property</option>
              <option value="agreement">📝 Agreement</option>
              <option value="other">📄 Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Keywords <span className="text-xs text-slate-500">(optional)</span></label>
            <SearchableKeywordDropdown
              keywords={allKeywords}
              selectedKeywords={uploadKeywords}
              onChange={setUploadKeywords}
              onCreateKeyword={handleCreateKeyword}
              placeholder="Type 3+ characters to search keywords..."
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ✏️ Update Document
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingDocument(null);
                setUploadTitle('');
                setUploadSubtitle('');
                setUploadCategory('other');
                setUploadKeywords([]);
              }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        title={`Delete ${deleteDialog.type === 'folder' ? 'Folder' : 'Document'}`}
        message={`Are you sure you want to delete ${deleteDialog.type === 'folder' ? 'folder' : 'document'} "${deleteDialog.name}"?${deleteDialog.type === 'folder' ? ' All contents will be deleted.' : ''} This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, type: 'folder', id: '', name: '' })}
      />

      {viewDocument && (
        <Modal
          isOpen={!!viewDocument}
          onClose={() => setViewDocument(null)}
          title={`📄 ${viewDocument.title || viewDocument.fileName}`}
          size="2xl"
        >
          <div className="h-full" onContextMenu={(e) => e.preventDefault()}>
            {viewDocument.subtitle && <p className="text-sm text-slate-600 mb-4">{viewDocument.subtitle}</p>}
            <div className="bg-slate-50 rounded-2xl overflow-hidden" style={{ height: 'calc(90vh - 200px)' }}>
              {canPreview(viewDocument.fileType) ? (
                viewDocument.fileType.startsWith('image/') ? (
                  <img
                    src={getViewUrl(viewDocument.filePath)}
                    alt={viewDocument.fileName}
                    className="w-full h-full object-contain"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                ) : viewDocument.fileType.startsWith('video/') ? (
                  <video
                    src={getViewUrl(viewDocument.filePath)}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : viewDocument.fileType.startsWith('audio/') ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 space-y-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{viewDocument.title || viewDocument.fileName}</h3>
                      <p className="text-sm text-slate-600">Audio File</p>
                    </div>
                    <audio
                      src={getViewUrl(viewDocument.filePath)}
                      controls
                      controlsList="nodownload"
                      className="w-full max-w-2xl shadow-lg rounded-2xl"
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full">
                    <iframe
                      src={`${getViewUrl(viewDocument.filePath)}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full"
                      title={viewDocument.fileName}
                    />
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                )
              ) : previewType ? (
                <div className="w-full h-full overflow-auto p-4" onContextMenu={(e) => e.preventDefault()}>
                  <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <File size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <button
                      onClick={() => handleDownload(viewDocument._id, viewDocument.fileName)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center gap-2 mx-auto font-semibold hover:opacity-80 transition-all shadow-lg"
                    >
                      <Download size={20} /> Download to view
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
