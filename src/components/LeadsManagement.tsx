'use client';

import React, { useState } from 'react';
import { Plus, List, Users } from 'lucide-react';
import LeadCreationForm from './LeadCreationForm';
import LeadsTable from './LeadsTable';

export default function LeadsManagement() {
  return (
    <div className="min-h-full">
      <LeadsTable />
    </div>
  );
}