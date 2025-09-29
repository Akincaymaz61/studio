'use client';

import { getDbData } from '@/lib/db-actions';
import { dbDataSchema, Quote } from '@/lib/schema';
import React, { useEffect, useState } from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import { QuoteLayout } from '@/components/quote/quote-layout';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDbData();
        const parsedData = dbDataSchema.safeParse(data);
        if (parsedData.success) {
          setQuotes(parsedData.data.quotes);
        }
      } catch (error) {
        console.error('Failed to load quotes for dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QuoteLayout>
      <Dashboard quotes={quotes} />
    </QuoteLayout>
  );
}
