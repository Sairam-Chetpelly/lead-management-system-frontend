'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import LeadView from '@/components/LeadView';

interface LeadPageProps {
  params: {
    id: string;
  };
}

export default function LeadPage({ params }: LeadPageProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <LeadView
      leadId={params.id}
      onBack={handleBack}
    />
  );
}