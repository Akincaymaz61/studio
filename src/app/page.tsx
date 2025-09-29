'use client';

import React from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import { useQuoteLayout } from '@/components/quote/quote-layout';

export default function DashboardPage() {
  const { quotes, handleStatusChange } = useQuoteLayout();

  return (
      <Dashboard quotes={quotes} onStatusChange={handleStatusChange} />
  );
}
