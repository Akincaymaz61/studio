'use client';

import QuotePage from '@/app/quote-page';
import { QuoteLayout } from '@/components/quote/quote-layout';

export default function QuoteCreatorPage() {
  return (
    <QuoteLayout>
      <QuotePage />
    </QuoteLayout>
  );
}
