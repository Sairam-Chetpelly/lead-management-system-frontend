'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Eye, Plus } from 'lucide-react';
import { authAPI } from '@/lib/auth';
import SimpleTable from '../common/SimpleTable';
import Modal from '../Modal';

interface Lead {
  _id: string;
  leadId?: string;
  name: string;
  contactNumber: string;
  email: string;
  sourceId: { _id: string; name: string };
  salesUserId: { _id: string; name: string };
  presalesUserId: { _id: string; name: string };
  leadStatusId: { _id: string; name: string };
  centerId?: { _id: string; name: string };
  createdAt: string;
}

export default function LeadsTableNew() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    email: '',
    sourceId: '',
    salesUserId: '',
    presalesUserId: '',
    leadStatusId: ''
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [usersRes, sourcesRes, statusesRes] = await Promise.all([
        authAPI.admin.getUsers(),
        authAPI.leads.getLeadSources(),
        authAPI.admin.getStatuses()
      ]);
      
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
      setSources(Array.isArray(sourcesRes.data) ? sourcesRes.data : sourcesRes.data.data || []);
      setStatuses(Array.isArray(statusesRes.data) ? statusesRes.data : statusesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const columns = [
    {
      key: 'lead',
      label: 'Lead Info',
      span: 2,
      render: (lead: Lead) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
            {lead.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="text-slate-900 font-bold truncate">{lead.name}</div>
            <div className="text-slate-600 text-sm truncate font-mono">{lead.leadId || 'N/A'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      span: 2,
      render: (lead: Lead) => (
        <div className="flex flex-col justify-center min-w-0">
          <div className="text-slate-700 font-medium truncate">{lead.contactNumber}</div>
          <div className="text-slate-500 text-sm truncate">{lead.email}</div>
        </div>
      )
    },
    {
      key: 'source',
      label: 'Source',
      span: 2,
      render: (lead: Lead) => (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 truncate">
          {lead.sourceId?.name || '--'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      span: 2,
      render: (lead: Lead) => (
        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-800 truncate">
          {lead.leadStatusId?.name || '--'}
        </span>
      )
    },
    {
      key: 'assigned',
      label: 'Assigned',
      span: 2,
      render: (lead: Lead) => (
        <div className="text-xs text-slate-600">
          <div>Sales: {lead.salesUserId?.name || '--'}</div>
          <div>Pre: {lead.presalesUserId?.name || '--'}</div>
        </div>
      )
    }
  ];

  const filters = [
    {
      key: 'search',
      type: 'search' as const,
      placeholder: 'Search leads...',
      span: 2
    },
    {
      key: 'source',
      type: 'select' as const,
      placeholder: 'All Sources',
      options: sources.map(source => ({ value: source._id, label: source.name }))
    },
    {
      key: 'status',
      type: 'select' as const,
      placeholder: 'All Statuses',
      options: statuses.filter(s => s.type === 'leadStatus').map(status => ({ value: status._id, label: status.name }))
    }
  ];

  const handleCall = async (leadId: string) => {
    try {
      await authAPI.leads.createCallLog({ leadId });
      alert('Call log created successfully!');
    } catch (error) {
      console.error('Error creating call log:', error);
      alert('Error creating call log');
    }
  };

  const openViewPage = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const customActions = (lead: Lead) => (
    <>
      <button 
        onClick={() => handleCall(lead._id)} 
        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all" 
        title="Call"
      >
        <Phone size={14} />
      </button>
      <button 
        onClick={() => openViewPage(lead._id)} 
        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all" 
        title="View"
      >
        <Eye size={14} />
      </button>
    </>
  );

  const handleExport = async () => {
    try {
      const response = await authAPI.leads.exportLeads();
      const { downloadCSV } = await import('@/lib/exportUtils');
      downloadCSV(response.data, 'leads.csv');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const mobileCardRender = (lead: Lead) => (
    <>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{lead.name}</div>
            <div className="text-sm text-slate-600 font-mono">{lead.leadId || 'N/A'}</div>
          </div>
        </div>
        <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-green-100 text-green-800">
          {lead.leadStatusId?.name || '--'}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div><span className="font-medium">Contact:</span> {lead.contactNumber}</div>
        <div><span className="font-medium">Email:</span> {lead.email}</div>
        <div><span className="font-medium">Source:</span> {lead.sourceId?.name || '--'}</div>
      </div>
      <div className="flex space-x-2 mt-4">
        <button onClick={() => handleCall(lead._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-700 rounded-xl font-medium text-sm">
          <Phone size={16} className="mr-1" /> Call
        </button>
        <button onClick={() => openViewPage(lead._id)} className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm">
          <Eye size={16} className="mr-1" /> View
        </button>
      </div>
    </>
  );

  return (
    <SimpleTable
      fetchFn={authAPI.leads.getLeads}
      columns={columns}
      filters={filters}
      itemName="leads"
      onAdd={() => setIsModalOpen(true)}
      onDelete={authAPI.leads.deleteLead}
      onExport={handleExport}
      addLabel="Add Lead"
      addIcon={<Plus size={20} />}
      mobileCardRender={mobileCardRender}
      customActions={customActions}
    />
  );
}