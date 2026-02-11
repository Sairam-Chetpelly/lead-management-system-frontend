'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Upload, Download, Search, ArrowLeft, File, Eye, X } from 'lucide-react';
import { folderService } from '@/services/folderService';
import { documentService } from '@/services/documentService';
import { keywordService } from '@/services/keywordService';
import { useToast } from '@/contexts/ToastContext';
import SearchableKeywordDropdown from './SearchableKeywordDropdown';
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
  const [folderName, setFolderName] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadKeywords, setUploadKeywords] = useState<string[]>([]);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [viewDocument, setViewDocument] = useState<any>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewType, setPreviewType] = useState<'csv' | 'excel' | 'doc' | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    loadKeywords();
  }, [currentFolder, searchKeyword]);

  const loadKeywords = async () => {
    try {
      const data = await keywordService.getAllKeywords();
      setAllKeywords(data.keywords || []);
    } catch (error: any) {
      console.error('Failed to load keywords:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, documentsData] = await Promise.all([
        folderService.getFolders(currentFolder || undefined),
        documentService.getDocuments(currentFolder || undefined, searchKeyword || undefined)
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

  const handleUpload = async () => {
    if (!uploadFile) {
      showToast('Please select a file', 'error');
      return;
    }

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
    }
  };

  const handleDeleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this folder and all its contents?')) return;
    try {
      await folderService.deleteFolder(id);
      showToast('Folder deleted successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to delete folder', 'error');
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return;
    try {
      await documentService.deleteDocument(id);
      showToast('Document deleted successfully', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to delete document', 'error');
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
    } catch (error: any) {
      showToast('Failed to download document', 'error');
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Document Management</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <button onClick={() => { setCurrentFolder(null); setFolderPath([]); }} className="hover:text-blue-600">Root</button>
            {folderPath.map((folder, idx) => (
              <span key={folder._id}>
                <span className="mx-1">/</span>
                <button onClick={() => {
                  const newPath = folderPath.slice(0, idx + 1);
                  setFolderPath(newPath);
                  setCurrentFolder(folder._id);
                }} className="hover:text-blue-600">
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {folderPath.length > 0 && (
            <button
              onClick={goBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2"
            >
              <ArrowLeft size={20} /> Back
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus size={20} /> New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Upload size={20} /> Upload
          </button>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by keyword..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full max-w-md"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div
              key={folder._id}
              onClick={() => openFolder(folder)}
              className="p-4 border rounded-lg hover:shadow-lg transition cursor-pointer bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <FolderOpen className="text-blue-600" size={32} />
                <button
                  onClick={(e) => handleDeleteFolder(folder._id, e)}
                  className="hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
              <div className="font-semibold">{folder.name}</div>
            </div>
          ))}

          {documents.map((doc) => (
            <div key={doc._id} className="p-4 border rounded-lg hover:shadow-lg transition bg-white">
              <div className="flex items-center justify-between mb-2">
                <File className="text-gray-600" size={32} />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="hover:bg-blue-50 p-1 rounded"
                    title="View"
                  >
                    <Eye size={16} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc._id, doc.fileName)}
                    className="hover:bg-green-50 p-1 rounded"
                    title="Download"
                  >
                    <Download size={16} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="hover:bg-red-50 p-1 rounded"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>
              <div className="font-semibold truncate" title={doc.fileName}>{doc.title || doc.fileName}</div>
              {doc.subtitle && <div className="text-xs text-gray-600 mt-1">{doc.subtitle}</div>}
              <div className="text-xs text-gray-500 mt-1">{doc.category}</div>
              {doc.keywords && doc.keywords.length > 0 && (
                <div className="text-xs text-blue-600 mt-2 flex flex-wrap gap-1">
                  {doc.keywords.map((k: any) => (
                    <span key={k._id} className="bg-blue-100 px-2 py-1 rounded">{k.name}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Create Folder</h2>
            <input
              type="text"
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <input
              type="file"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <input
              type="text"
              placeholder="Subtitle (optional)"
              value={uploadSubtitle}
              onChange={(e) => setUploadSubtitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            >
              <option value="identity">Identity</option>
              <option value="financial">Financial</option>
              <option value="property">Property</option>
              <option value="agreement">Agreement</option>
              <option value="other">Other</option>
            </select>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
              <SearchableKeywordDropdown
                keywords={allKeywords}
                selectedKeywords={uploadKeywords}
                onChange={setUploadKeywords}
                onCreateKeyword={handleCreateKeyword}
                placeholder="Type 3+ characters to search keywords..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {viewDocument && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h2 className="text-xl font-bold">{viewDocument.title || viewDocument.fileName}</h2>
                {viewDocument.subtitle && <p className="text-sm text-gray-600">{viewDocument.subtitle}</p>}
              </div>
              <button
                onClick={() => setViewDocument(null)}
                className="hover:bg-gray-100 p-2 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
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
                  <div className="flex items-center justify-center h-full">
                    <audio
                      src={getViewUrl(viewDocument.filePath)}
                      controls
                      controlsList="nodownload"
                      className="w-full max-w-2xl"
                      onContextMenu={(e) => e.preventDefault()}
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 mx-auto"
                    >
                      <Download size={20} /> Download to view
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
