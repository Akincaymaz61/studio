'use client';

import React, { useState } from 'react';
import QuotePage from '@/app/quote-page';
import { Button } from '@/components/ui/button';
import { Rocket, Loader2, AlertTriangle } from 'lucide-react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  const handleStart = async () => {
    setLoadingState('loading');
    try {
      // Try to connect to the database by performing a simple read operation.
      const q = query(collection(db, 'quotes'), limit(1));
      await getDocs(q);
      // If it succeeds, load the app.
      setLoadingState('success');
    } catch (error) {
      console.error("Firebase connection test failed:", error);
      setLoadingState('error');
    }
  };

  if (loadingState === 'success') {
    return <QuotePage />;
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Fiyat Teklifi Oluşturucu</h1>
        
        {loadingState === 'idle' && (
          <>
            <p className="text-muted-foreground mb-8">Başlamak için butona tıklayarak veritabanı bağlantısını kontrol edin.</p>
            <Button size="lg" onClick={handleStart}>
              <Rocket className="mr-2 h-5 w-5" />
              Programı Başlat
            </Button>
          </>
        )}

        {loadingState === 'loading' && (
          <>
            <p className="text-muted-foreground mb-8">Veritabanı bağlantısı kontrol ediliyor...</p>
            <Button size="lg" disabled>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Lütfen Bekleyin
            </Button>
          </>
        )}

        {loadingState === 'error' && (
           <div className="mt-4 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <p className="text-lg font-semibold">Veritabanı bağlantısı kurulamadı.</p>
              </div>
              <p className="text-muted-foreground max-w-md">
                Lütfen internet bağlantınızı ve Firebase proje ayarlarınızı kontrol edin. Sorun devam ederse, bu bir güvenlik kuralı veya yapılandırma hatası olabilir.
              </p>
              <Button size="lg" onClick={handleStart}>
                <Rocket className="mr-2 h-5 w-5" />
                Tekrar Dene
            </Button>
           </div>
        )}
      </div>
    </div>
  );
}
