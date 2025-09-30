'use client';

import React from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import { useQuoteLayout } from '@/components/quote/quote-layout';

export default function DashboardPage() {
  const { 
    quotes, 
    users,
    currentUser,
    handleStatusChange, 
    loading, 
    handleDeleteQuote, 
    handleReviseQuote,
    handleSaveUser,
    handleDeleteUser
  } = useQuoteLayout();
  
  if (loading) return null;

  return (
      <Dashboard 
        quotes={quotes} 
        users={users}
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
        onDeleteQuote={handleDeleteQuote}
        onReviseQuote={handleReviseQuote}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
       />
  );
}
