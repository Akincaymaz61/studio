'use client';

import React, { useState } from 'react';
import QuotePage from '@/app/quote-page';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export default function Home() {
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  if (!isAppLoaded) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center">
            <h1 className="text-4xl font-bold text-primary mb-2">Fiyat Teklifi Oluşturucu</h1>
            <p className="text-muted-foreground mb-8">Başlamak için butona tıklayın.</p>
            <Button size="lg" onClick={() => setIsAppLoaded(true)}>
                <Rocket className="mr-2 h-5 w-5" />
                Programı Başlat
            </Button>
        </div>
      </div>
    );
  }

  return <QuotePage />;
}
