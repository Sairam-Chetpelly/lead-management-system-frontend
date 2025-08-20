'use client';

import React, { useState } from 'react';
import { Plus, List, Users } from 'lucide-react';
import LeadCreationForm from './LeadCreationForm';
import LeadsTable from './LeadsTable';

interface LeadsManagementProps {
  user: any;
}

export default function LeadsManagement({ user }: LeadsManagementProps) {
  return (
    <div className="min-h-full">
      <LeadsTable user={user} />
    </div>
  );
}