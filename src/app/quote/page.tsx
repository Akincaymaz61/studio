'use client';

import QuotePage from '@/app/quote-page';
import { QuoteLayout } from '@/components/quote/quote-layout';
import { Suspense } from 'react';

function QuoteCreator() {
  return (
    <QuoteLayout>
      <QuotePage />
    </QuoteLayout>
  );
}

export default function QuoteCreatorPage() {
  return (
    <Suspense>
      <QuoteCreator />
    </Suspense>
  );
}
