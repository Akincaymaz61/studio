'use client';

import { QuoteLayout } from '@/components/quote/quote-layout';

export default function Template({ children }: { children: React.ReactNode }) {
  return <QuoteLayout>{children}</QuoteLayout>;
}
