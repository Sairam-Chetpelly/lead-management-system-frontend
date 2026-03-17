'use client';

import { useState } from 'react';
import PowerPointViewer from '@/components/PowerPointViewer';
import { Upload, FileText, Eye } from 'lucide-react';

export default function DocumentViewerTest() {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Sample PowerPoint documents for testing
  const sampleDocuments = [
    {
      _id: '1',
      fileName: 'sample-presentation.pptx',
      title: 'Sample PowerPoint Presentation',
      subtitle: 'Test document for PowerPoint viewer',
      filePath: 'sample-presentation.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    },
    {
      _id: '2',
      fileName: 'business-plan.ppt',
      title: 'Business Plan Presentation',
      subtitle: 'Q4 2024 Business Strategy',
      filePath: 'business-plan.ppt',
      fileType: 'application/vnd.ms-powerpoint'
    },
    {
      _id: '3',
      fileName: 'training-slides.pptx',
      title: 'Employee Training Slides',
      subtitle: 'New Employee Onboarding',
      filePath: 'training-slides.pptx',
      fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
  ];

  const handleViewDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowViewer(true);
  };

  const handleDownload = (id: string, fileName: string) => {
    // Mock download function
    console.log(`Downloading document: ${fileName} (ID: ${id})`);
    alert(`Download started for: ${fileName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            📊 PowerPoint Document Viewer
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Test the PowerPoint viewer functionality with PPT and PPTX files using @cyntler/react-doc-viewer
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="text-blue-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">PPT Support</h3>
            <p className="text-sm text-slate-600">View classic PowerPoint (.ppt) files directly in the browser</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="text-green-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">PPTX Support</h3>
            <p className="text-sm text-slate-600">View modern PowerPoint (.pptx) files with full formatting</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Eye className="text-purple-600" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">View Only</h3>
            <p className="text-sm text-slate-600">Secure viewing without editing capabilities</p>
          </div>
        </div>

        {/* Sample Documents */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Upload className="text-blue-600" size={28} />
            Sample PowerPoint Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleDocuments.map((doc) => (
              <div 
                key={doc._id}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-blue-300 cursor-pointer"
                onClick={() => handleViewDocument(doc)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDocument(doc);
                    }}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all opacity-0 group-hover:opacity-100"
                    title="View Presentation"
                  >
                    <Eye size={16} />
                  </button>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-2 truncate">{doc.title}</h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{doc.subtitle}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{doc.fileName}</span>
                  <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">
                    {doc.fileName.endsWith('.pptx') ? 'PPTX' : 'PPT'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 How to Test</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                Click on any sample document card above to open the PowerPoint viewer
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                The viewer will attempt to load and display the PowerPoint file
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                Use the download button if the file cannot be previewed
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                Close the viewer using the X button in the top-right corner
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* PowerPoint Viewer */}
      <PowerPointViewer
        isOpen={showViewer}
        onClose={() => {
          setShowViewer(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onDownload={handleDownload}
      />
    </div>
  );
}