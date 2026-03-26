'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Upload, Download, Search, ArrowLeft, File, Eye, X, Grid3x3, List, CheckSquare, Square, Package, MoreVertical } from 'lucide-react';
import { folderService } from '@/services/folderService';
import { documentService } from '@/services/documentService';
import { keywordService } from '@/services/keywordService';
import { categoryService } from '@/services/categoryService';
import { useToast } from '@/contexts/ToastContext';
import SearchableKeywordDropdown from './SearchableKeywordDropdown';
import Modal from './Modal';
import ModernLoader from './ModernLoader';
import DeleteDialog from './DeleteDialog';
import PowerPointViewer from './PowerPointViewer';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import PizZip from 'pizzip';

export default function FoldersManagement() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [allKeywords, setAllKeywords] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<any[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [allFoldersData, setAllFoldersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [folderName, setFolderName] = useState('');
  const [folderRestricted, setFolderRestricted] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKeywords, setUploadKeywords] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewType, setPreviewType] = useState<'csv' | 'excel' | 'doc' | 'ppt' | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, type: 'folder' | 'document', id: string, name: string }>({ isOpen: false, type: 'folder', id: '', name: '' });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [downloadingFolderId, setDownloadingFolderId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showPowerPointViewer, setShowPowerPointViewer] = useState(false);
  const [powerPointDocument, setPowerPointDocument] = useState<any>(null);
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  useEffect(() => {
    loadData();
    loadKeywords();
    loadCategories();
    // Clear selection when folder or filters change
    setSelectedDocuments(new Set());
  }, [currentFolder, searchKeyword, filterKeywords, filterCategories, startDate, endDate]);

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

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setAllCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      setAllCategories([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [documentsData, allFolders] = await Promise.all([
        documentService.getDocuments(
          currentFolder || undefined, 
          searchKeyword || undefined, 
          filterKeywords.length > 0 ? filterKeywords : undefined,
          filterCategories.length > 0 ? filterCategories : undefined,
          startDate || undefined,
          endDate || undefined
        ),
        folderService.getAllFolders()
      ]);
      setDocuments(documentsData);
      setAllFoldersData(allFolders);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openFolder = (folder: any) => {
    setCurrentFolder(folder._id);
    // Build path by finding parent chain
    const path = buildPathToFolder(folder._id, allFoldersData);
    setFolderPath(path);
    // Auto-expand parent folders
    const parentIds = path.map(f => f._id);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      parentIds.forEach(id => next.add(id));
      return next;
    });
  };

  const buildPathToFolder = (folderId: string, folders: any[]): any[] => {
    const folder = folders.find(f => f._id === folderId);
    if (!folder) return [];
    
    const parentId = folder.parentFolderId?._id || folder.parentFolderId;
    if (!parentId) return [folder];
    
    return [...buildPathToFolder(parentId, folders), folder];
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const buildFolderTree = (folders: any[], parentId: string | null = null): any[] => {
    return folders
      .filter(f => {
        const pid = f.parentFolderId?._id || f.parentFolderId || null;
        return pid === parentId;
      })
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folders, folder._id)
      }));
  };

  const renderFolderTree = (folders: any[], level: number = 0): JSX.Element[] => {
    return folders.map((folder) => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder._id);
      const isActive = currentFolder === folder._id;

      return (
        <div key={folder._id} className="mb-0.5">
          <div
            className={`group flex items-center gap-1 px-2 py-2 rounded-lg cursor-pointer transition-all ${
              isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-slate-100 text-slate-700'
            }`}
            style={{ paddingLeft: `${8 + level * 20}px` }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => toggleFolder(folder._id, e)}
                className="p-1 hover:bg-slate-200 rounded flex-shrink-0"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div
              onClick={() => openFolder(folder)}
              className="flex items-center gap-2 flex-1 min-w-0"
            >
              <FolderOpen size={16} className={`flex-shrink-0 ${folder.restricted ? 'text-red-500' : ''}`} />
              <span className={`flex-1 truncate text-sm ${folder.restricted ? 'text-red-600 font-medium' : ''}`}>
                {folder.name} {folder.restricted && '🔒'}
              </span>
            </div>
            {currentUser?.role === 'admin' && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleFolderDownload(folder._id, folder.name); }}
                  disabled={downloadingFolderId === folder._id || folder.restricted}
                  className={`p-1 rounded hover:bg-green-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    folder.restricted ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'
                  }`}
                  title={folder.restricted ? 'Folder is restricted' : 'Download Folder'}
                >
                  {downloadingFolderId === folder._id ? (
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Download size={12} />
                  )}
                </button>
                <button
                  onClick={(e) => handleEditFolder(folder, e)}
                  className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-all"
                  title="Edit"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={(e) => handleDeleteFolder(folder._id, folder.name, e)}
                  className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-all"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div>{renderFolderTree(folder.children, level + 1)}</div>
          )}
        </div>
      );
    });
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
        parentFolderId: currentFolder || undefined,
        restricted: folderRestricted
      });
      showToast('Folder created successfully', 'success');
      setShowCreateModal(false);
      setFolderName('');
      setFolderRestricted(false);
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create folder', 'error');
    }
  };

  const handleEditFolder = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderRestricted(folder.restricted || false);
    setShowEditFolderModal(true);
  };

  const handleUpdateFolder = async () => {
    try {
      await folderService.updateFolder(editingFolder._id, { 
        name: folderName,
        restricted: folderRestricted
      });
      showToast('Folder updated successfully', 'success');
      setShowEditFolderModal(false);
      setEditingFolder(null);
      setFolderName('');
      setFolderRestricted(false);
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
    setDownloadingId(id);
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
    } finally {
      setDownloadingId(null);
    }
  };

  const getViewUrl = (filePath: string) => {
    const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/documents/${fileName}`;
    console.log('View URL:', url);
    return url;
  };

  const isImageFile = (fileType: string, fileName: string) => {
    return fileType.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(fileName);
  };

  const isPowerPointFile = (fileType: string, fileName: string) => {
    return fileType.includes('presentation') || 
           fileType.includes('powerpoint') ||
           /\.(ppt|pptx|pps|ppsx|potx|potm|pptm)$/i.test(fileName);
  };

  const canPreview = (fileType: string, fileName: string) => {
    return fileType.startsWith('image/') || 
           fileType === 'application/pdf' || 
           fileType.startsWith('video/') || 
           fileType.startsWith('audio/') ||
           isPowerPointFile(fileType, fileName);
  };

  const handleViewDocument = async (doc: any) => {
    // Check if it's a PowerPoint file first
    if (isPowerPointFile(doc.fileType, doc.fileName)) {
      setPowerPointDocument(doc);
      setShowPowerPointViewer(true);
      return;
    }

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

  const handleCreateCategory = async () => {
    try {
      await categoryService.createCategory({ name: categoryName });
      showToast('Category created successfully', 'success');
      setShowCategoryModal(false);
      setCategoryName('');
      await loadCategories();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to create category', 'error');
    }
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(new Set(documents.map(doc => doc._id)));
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBulkDownload = async () => {
    if (selectedDocuments.size === 0) {
      showToast('Please select documents to download', 'error');
      return;
    }

    setBulkDownloading(true);
    try {
      const blob = await folderService.multiDownload(Array.from(selectedDocuments));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents_${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast(`${selectedDocuments.size} documents downloaded successfully`, 'success');
      clearSelection();
    } catch (error: any) {
      let errorMessage = 'Failed to download documents';
      
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
    } finally {
      setBulkDownloading(false);
    }
  };

  const handleFolderDownload = async (folderId: string, folderName: string) => {
    setDownloadingFolderId(folderId);
    try {
      const blob = await folderService.downloadFolder(folderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast(`Folder "${folderName}" downloaded successfully`, 'success');
    } catch (error: any) {
      let errorMessage = 'Failed to download folder';
      
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
    } finally {
      setDownloadingFolderId(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 min-h-full">
      {/* Top Bar - Search & Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents"
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
          <div>
            <SearchableKeywordDropdown
              keywords={allCategories.map(c => ({ _id: c._id, name: c.name }))} 
              selectedKeywords={filterCategories}
              onChange={setFilterCategories}
              placeholder="📁 Filter by categories..."
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              placeholder="End Date"
            />
          </div>
        </div>
        {(searchKeyword || filterKeywords.length > 0 || filterCategories.length > 0 || startDate || endDate) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
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
            {filterCategories.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                Categories: {filterCategories.length}
                <button onClick={() => setFilterCategories([])} className="hover:bg-green-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium">
                Date: {startDate || '...'} to {endDate || '...'}
                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hover:bg-orange-200 rounded-full p-0.5">
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Split Layout - Folders Left, Documents Right */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
        <div className="flex h-full">
          {/* Left Sidebar - Folders */}
          <div className="w-80 border-r border-slate-200 bg-slate-50/50 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-white/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FolderOpen size={18} className="text-blue-600" />
                <span>Folders</span>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
                >
                  <Plus size={18} /> New Folder
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {/* Root Folder */}
              <div
                onClick={() => { setCurrentFolder(null); setFolderPath([]); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all mb-1 ${
                  currentFolder === null ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <FolderOpen size={18} />
                <span className="flex-1 truncate">🏠 Root</span>
              </div>
              {/* Folder Tree */}
              {!searchKeyword && filterKeywords.length === 0 && filterCategories.length === 0 && !startDate && !endDate && renderFolderTree(buildFolderTree(allFoldersData))}
            </div>
          </div>

          {/* Right Panel - Documents */}
          <div className="flex-1 flex flex-col">
            {/* Breadcrumb */}
            <div className="p-4 border-b border-slate-200 bg-white/50">
              <div className="flex items-center justify-between">
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
                <div className="flex gap-2">
                  {folderPath.length > 0 && (
                    <button
                      onClick={goBack}
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all shadow-sm"
                    >
                      <ArrowLeft size={16} /> <span>Back</span>
                    </button>
                  )}
                  {currentFolder && (
                    <button
                      onClick={() => {
                        const currentFolderData = folderPath[folderPath.length - 1];
                        if (currentFolderData?.restricted) {
                          showToast('This folder is restricted and cannot be downloaded', 'error');
                          return;
                        }
                        handleFolderDownload(currentFolder, currentFolderData?.name || 'Current Folder');
                      }}
                      disabled={downloadingFolderId === currentFolder || folderPath[folderPath.length - 1]?.restricted}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        folderPath[folderPath.length - 1]?.restricted 
                          ? 'bg-gray-400 text-gray-700' 
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                      title={folderPath[folderPath.length - 1]?.restricted ? 'Folder is restricted' : 'Download Current Folder'}
                    >
                      {downloadingFolderId === currentFolder ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Downloading...
                        </>
                      ) : folderPath[folderPath.length - 1]?.restricted ? (
                        <>
                          🔒 Restricted
                        </>
                      ) : (
                        <>
                          <Package size={16} /> Download Folder
                        </>
                      )}
                    </button>
                  )}
                  <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                      title="Grid View"
                    >
                      <Grid3x3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                      title="List View"
                    >
                      <List size={16} />
                    </button>
                  </div>
                  {documents.length > 0 && (
                    <button
                      onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-sm ${
                        isMultiSelectMode 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Multi-select Mode"
                    >
                      <CheckSquare size={16} /> Select
                    </button>
                  )}
                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm"
                    >
                      <Upload size={16} /> Upload
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Multi-select Controls */}
            {isMultiSelectMode && documents.length > 0 && (
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-700">
                      {selectedDocuments.size} of {documents.length} selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={selectAllDocuments}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedDocuments.size > 0 && (
                      <button
                        onClick={handleBulkDownload}
                        disabled={bulkDownloading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {bulkDownloading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Package size={16} /> Download Selected ({selectedDocuments.size})
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setIsMultiSelectMode(false)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-all shadow-sm"
                    >
                      <X size={16} /> Exit Select Mode
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Grid/List */}
            <div className="flex-1 overflow-y-auto p-6 relative">
              {loading ? (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
                  <ModernLoader size="lg" variant="primary" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <File size={64} className="mb-4" />
                  <p className="text-lg font-medium">No documents found</p>
                  <p className="text-sm">Upload documents to get started</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents.map((doc) => (
                    <div 
                      key={doc._id} 
                      className={`group relative p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 border cursor-pointer ${
                        isMultiSelectMode && selectedDocuments.has(doc._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => isMultiSelectMode ? toggleDocumentSelection(doc._id) : handleViewDocument(doc)}
                    >
                      {isMultiSelectMode && (
                        <div className="absolute top-3 left-3 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDocumentSelection(doc._id);
                            }}
                            className="p-1 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50"
                          >
                            {selectedDocuments.has(doc._id) ? (
                              <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                              <Square size={16} className="text-slate-400" />
                            )}
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center overflow-hidden">
                          {isImageFile(doc.fileType, doc.fileName) ? (
                            <img
                              src={getViewUrl(doc.filePath)}
                              alt={doc.fileName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <File className={`text-white ${isImageFile(doc.fileType, doc.fileName) ? 'hidden' : ''}`} size={20} />
                        </div>
                        {!isMultiSelectMode && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === doc._id ? null : doc._id);
                              }}
                              className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                              title="More actions"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === doc._id && (
                              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewDocument(doc);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                                >
                                  <Eye size={14} /> View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(doc._id, doc.fileName);
                                    setOpenMenuId(null);
                                  }}
                                  disabled={downloadingId === doc._id}
                                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {downloadingId === doc._id ? (
                                    <>
                                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <Download size={14} /> Download
                                    </>
                                  )}
                                </button>
                                {currentUser?.role === 'admin' && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditDocument(doc);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                                    >
                                      <Edit2 size={14} /> Edit
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteDocument(doc._id, doc.title || doc.fileName);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mb-1 truncate" title={doc.fileName}>{doc.fileName}</div>
                      <div className="font-bold text-slate-900 truncate" title={doc.title}>{doc.title}</div>
                      {/* {doc.subtitle && <div className="text-xs text-slate-600 mt-1 truncate">{doc.subtitle}</div>} */}
                      <div className="text-xs text-slate-500 mt-1 capitalize">{doc.category}</div>
                      {/* {(searchKeyword || filterKeywords.length > 0) && doc.folderId && (
                        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <FolderOpen size={12} />
                          <span className="truncate">{doc.folderId?.name || 'Unknown Folder'}</span>
                        </div>
                      )} */}
                      {/* {doc.keywords && doc.keywords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {doc.keywords.slice(0, 3).map((k: any) => (
                            <span key={k._id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">{k.name}</span>
                          ))}
                          {doc.keywords.length > 3 && <span className="text-xs text-slate-500">+{doc.keywords.length - 3}</span>}
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc._id} 
                      className={`group flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border cursor-pointer ${
                        isMultiSelectMode && selectedDocuments.has(doc._id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      }`}
                      onClick={() => isMultiSelectMode ? toggleDocumentSelection(doc._id) : handleViewDocument(doc)}
                    >
                      {isMultiSelectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDocumentSelection(doc._id);
                          }}
                          className="p-1 bg-white rounded-lg shadow-sm border border-slate-200 hover:bg-slate-50 flex-shrink-0"
                        >
                          {selectedDocuments.has(doc._id) ? (
                            <CheckSquare size={16} className="text-blue-600" />
                          ) : (
                            <Square size={16} className="text-slate-400" />
                          )}
                        </button>
                      )}
                      <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {isImageFile(doc.fileType, doc.fileName) ? (
                          <img
                            src={getViewUrl(doc.filePath)}
                            alt={doc.fileName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <File className={`text-white ${isImageFile(doc.fileType, doc.fileName) ? 'hidden' : ''}`} size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{doc.title}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 truncate">{doc.fileName}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500 capitalize">{doc.category}</span>
                          {doc.subtitle && (
                            <>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500 truncate">{doc.subtitle}</span>
                            </>
                          )}
                        </div>
                        {doc.keywords && doc.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.keywords.slice(0, 5).map((k: any) => (
                              <span key={k._id} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{k.name}</span>
                            ))}
                            {doc.keywords.length > 5 && <span className="text-xs text-slate-500">+{doc.keywords.length - 5}</span>}
                          </div>
                        )}
                      </div>
                      {!isMultiSelectMode && (
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === doc._id ? null : doc._id);
                            }}
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all"
                            title="More actions"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === doc._id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(doc);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                              >
                                <Eye size={14} /> View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(doc._id, doc.fileName);
                                  setOpenMenuId(null);
                                }}
                                disabled={downloadingId === doc._id}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloadingId === doc._id ? (
                                  <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <Download size={14} /> Download
                                  </>
                                )}
                              </button>
                              {currentUser?.role === 'admin' && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditDocument(doc);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"
                                  >
                                    <Edit2 size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteDocument(doc._id, doc.title || doc.fileName);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setFolderName(''); setFolderRestricted(false); }}
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
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={folderRestricted}
                onChange={(e) => setFolderRestricted(e.target.checked)}
                className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-semibold text-slate-700">🔒 Restrict Download</span>
                <p className="text-xs text-slate-500 mt-1">Prevent this folder from being downloaded directly</p>
              </div>
            </label>
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
              onClick={() => { setShowCreateModal(false); setFolderName(''); setFolderRestricted(false); }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditFolderModal}
        onClose={() => { setShowEditFolderModal(false); setEditingFolder(null); setFolderName(''); setFolderRestricted(false); }}
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
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={folderRestricted}
                onChange={(e) => setFolderRestricted(e.target.checked)}
                className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <div>
                <span className="text-sm font-semibold text-slate-700">🔒 Restrict Download</span>
                <p className="text-xs text-slate-500 mt-1">Prevent this folder from being downloaded directly</p>
              </div>
            </label>
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
              onClick={() => { setShowEditFolderModal(false); setEditingFolder(null); setFolderName(''); setFolderRestricted(false); }}
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
            <div className="flex gap-2">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="flex-1 px-5 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
                required
              >
                <option value="">Select category</option>
                {allCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-2xl hover:bg-blue-200 transition-all font-semibold"
                  title="Add Category"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
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
              <option value="">Select category</option>
              {allCategories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
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
              {canPreview(viewDocument.fileType, viewDocument.fileName) ? (
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

      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setCategoryName('');  }}
        title="➕ Create Category"
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateCategory(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Category Name <span className="text-xs text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Enter category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-5 py-4 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              required
              autoFocus
            />
          </div>
          <div className="flex space-x-4 pt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl hover:opacity-80 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ➕ Create Category
            </button>
            <button
              type="button"
              onClick={() => { setShowCategoryModal(false); setCategoryName('');  }}
              className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-2xl hover:bg-slate-300 transition-all duration-200 font-semibold text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* PowerPoint Viewer */}
      <PowerPointViewer
        isOpen={showPowerPointViewer}
        onClose={() => {
          setShowPowerPointViewer(false);
          setPowerPointDocument(null);
        }}
        document={powerPointDocument}
        onDownload={handleDownload}
      />
    </div>
  );
}

