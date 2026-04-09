'use client';

import { useState, useEffect } from 'react';
import { File, Download, AlertCircle, RefreshCw, FileText, FileSpreadsheet, FileImage, Video, Music, Presentation } from 'lucide-react';
import { documentService } from '@/services/documentService';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface DocumentReaderProps {
  document: {
    _id: string;
    fileName: string;
    title?: string;
    subtitle?: string;
    fileType: string;
  };
  onDownload: (id: string, fileName: string) => void;
}

export default function DocumentReader({ document, onDownload }: DocumentReaderProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [contentType, setContentType] = useState<'html' | 'table' | 'text' | 'media' | 'iframe'>('html');

  useEffect(() => {
    loadDocument();
  }, [document._id]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    setContent('');

    try {
      // Get S3 presigned URL
      const urlData = await documentService.getFileUrl(document._id);
      setFileUrl(urlData.url);

      // Determine file type and handle accordingly
      const fileType = document.fileType.toLowerCase();
      const fileName = document.fileName.toLowerCase();

      if (isTextFile(fileType, fileName)) {
        await handleTextFile(urlData.url);
      } else if (isCsvFile(fileType, fileName)) {
        await handleCsvFile(urlData.url);
      } else if (isExcelFile(fileType, fileName)) {
        await handleExcelFile(urlData.url);
      } else if (isWordFile(fileType, fileName)) {
        await handleWordFile(urlData.url);
      } else if (isPdfFile(fileType, fileName)) {
        handlePdfFile(urlData.url);
      } else if (isPowerPointFile(fileType, fileName)) {
        handlePowerPointFile(urlData.url);
      } else if (isImageFile(fileType, fileName)) {
        handleImageFile(urlData.url);
      } else if (isVideoFile(fileType, fileName)) {
        handleVideoFile(urlData.url);
      } else if (isAudioFile(fileType, fileName)) {
        handleAudioFile(urlData.url);
      } else {
        setError('File type not supported for preview');
        setContentType('html');
      }
    } catch (err: any) {
      console.error('Document loading error:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  // File type detection functions
  const isTextFile = (fileType: string, fileName: string) => {
    return fileType.includes('text/plain') || 
           fileName.endsWith('.txt') || 
           fileName.endsWith('.rtf') ||
           fileName.endsWith('.log');
  };

  const isCsvFile = (fileType: string, fileName: string) => {
    return fileType.includes('text/csv') || 
           fileName.endsWith('.csv') ||
           fileName.endsWith('.tsv');
  };

  const isExcelFile = (fileType: string, fileName: string) => {
    return fileType.includes('spreadsheet') || 
           fileType.includes('excel') ||
           fileName.match(/\.(xlsx|xls|xlsm|xlsb|xltx|xltm|xlt)$/);
  };

  const isWordFile = (fileType: string, fileName: string) => {
    return fileType.includes('word') || 
           fileType.includes('document') ||
           fileType.includes('msword') ||
           fileType.includes('wordprocessingml') ||
           fileName.match(/\.(docx|doc|docm|dotx|dotm|dot|odt)$/);
  };

  const isPdfFile = (fileType: string, fileName: string) => {
    return fileType.includes('pdf') || fileName.endsWith('.pdf');
  };

  const isPowerPointFile = (fileType: string, fileName: string) => {
    return fileType.includes('presentation') || 
           fileType.includes('powerpoint') ||
           fileName.match(/\.(ppt|pptx|pps|ppsx|potx|potm|pptm)$/);
  };

  const isImageFile = (fileType: string, fileName: string) => {
    return fileType.startsWith('image/') || 
           fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico)$/);
  };

  const isVideoFile = (fileType: string, fileName: string) => {
    return fileType.startsWith('video/') || 
           fileName.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp)$/);
  };

  const isAudioFile = (fileType: string, fileName: string) => {
    return fileType.startsWith('audio/') || 
           fileName.match(/\.(mp3|wav|ogg|aac|flac|wma|m4a)$/);
  };

  // File handling functions
  const handleTextFile = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const text = await response.text();
      setContent(`<pre class="whitespace-pre-wrap p-4 text-sm font-mono bg-gray-50 rounded-lg overflow-auto max-h-96">${escapeHtml(text)}</pre>`);
      setContentType('html');
    } catch (err) {
      throw new Error('Failed to read text file');
    }
  };

  const handleCsvFile = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch CSV file');
      const text = await response.text();
      
      Papa.parse(text, {
        complete: (result) => {
          if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
          }
          
          const html = `
            <div class="overflow-auto max-h-96">
              <table class="min-w-full border-collapse border border-gray-300 text-sm">
                ${result.data.map((row: any, i: number) => `
                  <tr class="${i === 0 ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}">
                    ${Array.isArray(row) ? row.map((cell: any) => 
                      `<td class="border border-gray-300 px-3 py-2">${escapeHtml(String(cell || ''))}</td>`
                    ).join('') : ''}
                  </tr>
                `).join('')}
              </table>
            </div>
          `;
          setContent(html);
          setContentType('html');
        },
        error: (error) => {
          throw new Error(`CSV parsing error: ${error.message}`);
        }
      });
    } catch (err: any) {
      throw new Error(`Failed to read CSV file: ${err.message}`);
    }
  };

  const handleExcelFile = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Excel file');
      const arrayBuffer = await response.arrayBuffer();
      
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to HTML with better styling
      const html = XLSX.utils.sheet_to_html(worksheet, { 
        header: '', 
        footer: '',
        editable: false 
      });
      
      // Enhanced styling for Excel tables
      const styledHtml = `
        <div class="overflow-auto max-h-96">
          <div class="mb-2 text-sm font-medium text-gray-700">Sheet: ${firstSheetName}</div>
          ${html
            .replace('<table', '<table class="min-w-full border-collapse border border-gray-300 text-sm"')
            .replace(/<td/g, '<td class="border border-gray-300 px-3 py-2"')
            .replace(/<th/g, '<th class="border border-gray-300 px-3 py-2 font-semibold bg-gray-100"')
          }
        </div>
      `;
      
      setContent(styledHtml);
      setContentType('html');
      
      // Show sheet selector if multiple sheets
      if (workbook.SheetNames.length > 1) {
        console.log('Multiple sheets available:', workbook.SheetNames);
      }
    } catch (err: any) {
      throw new Error(`Failed to read Excel file: ${err.message}`);
    }
  };

  const handleWordFile = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch Word document');
      const arrayBuffer = await response.arrayBuffer();
      
      // Check if it's a DOCX file (mammoth only supports DOCX)
      if (document.fileName.toLowerCase().endsWith('.docx') || 
          document.fileType.includes('wordprocessingml')) {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        if (result.messages.length > 0) {
          console.warn('Word conversion warnings:', result.messages);
        }
        
        const styledHtml = `
          <div class="prose prose-sm max-w-none p-4 bg-white rounded-lg border overflow-auto max-h-96">
            ${result.value}
          </div>
        `;
        setContent(styledHtml);
        setContentType('html');
      } else {
        // For older DOC files or other formats
        setError('This Word document format is not supported for preview. Please download to view.');
        setContentType('html');
      }
    } catch (err: any) {
      throw new Error(`Failed to read Word document: ${err.message}`);
    }
  };

  const handlePdfFile = (url: string) => {
    setContent(`${url}#toolbar=0&navpanes=0&scrollbar=0`);
    setContentType('iframe');
  };

  const handlePowerPointFile = (url: string) => {
    // For PowerPoint files, we'll use iframe with Office Online viewer
    // Note: This might not work with all S3 presigned URLs due to CORS
    setContent(url);
    setContentType('iframe');
    setError('PowerPoint preview may not be available. Please download to view the presentation.');
  };

  const handleImageFile = (url: string) => {
    setContent(url);
    setContentType('media');
  };

  const handleVideoFile = (url: string) => {
    setContent(url);
    setContentType('media');
  };

  const handleAudioFile = (url: string) => {
    setContent(url);
    setContentType('media');
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const getFileIcon = () => {
    const fileType = document.fileType.toLowerCase();
    const fileName = document.fileName.toLowerCase();

    if (isImageFile(fileType, fileName)) return <FileImage className="text-blue-500" size={48} />;
    if (isVideoFile(fileType, fileName)) return <Video className="text-purple-500" size={48} />;
    if (isAudioFile(fileType, fileName)) return <Music className="text-green-500" size={48} />;
    if (isPdfFile(fileType, fileName)) return <FileText className="text-red-500" size={48} />;
    if (isExcelFile(fileType, fileName)) return <FileSpreadsheet className="text-green-600" size={48} />;
    if (isWordFile(fileType, fileName)) return <FileText className="text-blue-600" size={48} />;
    if (isPowerPointFile(fileType, fileName)) return <Presentation className="text-orange-500" size={48} />;
    return <File className="text-gray-500" size={48} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Preview</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={loadDocument}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw size={16} /> Retry
            </button>
            <button
              onClick={() => onDownload(document._id, document.fileName)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} /> Download
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {contentType === 'html' && (
        <div 
          className="h-full overflow-auto"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
      
      {contentType === 'iframe' && (
        <div className="relative h-full">
          <iframe
            src={content}
            className="w-full h-full border-0"
            title={document.fileName}
            sandbox="allow-same-origin allow-scripts"
          />
          <div 
            className="absolute inset-0 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
      )}
      
      {contentType === 'media' && (
        <div className="flex items-center justify-center h-full">
          {isImageFile(document.fileType, document.fileName) && (
            <img
              src={content}
              alt={document.fileName}
              className="max-w-full max-h-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          )}
          
          {isVideoFile(document.fileType, document.fileName) && (
            <video
              src={content}
              controls
              controlsList="nodownload"
              className="max-w-full max-h-full"
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
          
          {isAudioFile(document.fileType, document.fileName) && (
            <div className="text-center">
              <div className="mb-6">
                {getFileIcon()}
              </div>
              <h3 className="text-lg font-semibold mb-4">{document.title || document.fileName}</h3>
              <audio
                src={content}
                controls
                controlsList="nodownload"
                className="w-full max-w-md"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}