'use client';

import { useState, useEffect } from 'react';

interface Lead {
  _id: string;
  name: string;
  email: string;
  contactNumber: string;
  currentStage: string;
  assignmentType: string;
  leadValue?: string;
  isQualified: boolean;
  outcome: string;
}

interface WorkflowProps {
  leadId: string;
}

export default function LeadWorkflow({ leadId }: WorkflowProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeadWorkflow();
  }, [leadId]);

  const fetchLeadWorkflow = async () => {
    try {
      const response = await fetch(`/api/leads/${leadId}/workflow`);
      const data = await response.json();
      setLead(data.lead);
    } catch (error) {
      console.error('Error fetching workflow:', error);
    }
  };

  if (!lead) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Lead Workflow: {lead.name}</h2>
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div><strong>Email:</strong> {lead.email}</div>
        <div><strong>Phone:</strong> {lead.contactNumber}</div>
        <div><strong>Source:</strong> {lead.assignmentType}</div>
        <div><strong>Value:</strong> {lead.leadValue || 'Not set'}</div>
      </div>
    </div>
  );
}