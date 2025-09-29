'use client';

import QuotePage from '@/app/quote-page';
import { Suspense } from 'react';

function QuoteCreator() {
  return (
      <QuotePage />
  );
}

export default function QuoteCreatorPage() {
  return (
    <Suspense>
      <QuoteCreator />
    </Suspense>
  );
}
