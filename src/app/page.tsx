'use client';

import React from 'react';
import QuotePage from '@/app/quote-page';

export default function Home() {
  // Directly render the QuotePage, as there's no need for a DB connection test anymore.
  return <QuotePage />;
}
