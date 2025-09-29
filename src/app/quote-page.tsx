'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, QuoteStatus } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard } from 'lucide-react';
import { isMacOS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuoteLayout } from '@/components/quote/quote-layout';

export default function QuotePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const {
    quotes,
    customers,
    companyProfiles,
    handleSaveAll,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveCompanyProfile,
    handleDeleteCompanyProfile,
  } = useQuoteLayout();

  const [isClient, setIsClient] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
  });

  const { handleSubmit, reset, watch, getValues, setValue, formState: { isDirty } } = form;

  const createNewQuoteObject = useCallback((currentCompanyInfo?: {
      companyName: string;
      companyAddress: string;
      companyPhone: string;
      companyEmail: string;
      companyLogo: string;
  }) => {
    const today = new Date();
    const quoteNumber = `QT-${format(today, 'yyyyMMdd')}-${(quotes.length + 1).toString().padStart(4, '0')}`;
    
    const newQuote: Quote = {
      ...defaultQuote,
      id: `QT-${Date.now()}`,
      quoteNumber: quoteNumber,
      quoteDate: today,
      validUntil: addDays(today, 30),
      updatedAt: today,
      items: [{
          id: `item-${crypto.randomUUID()}`,
          description: '',
          quantity: 1,
          unit: 'adet',
          price: 0,
          tax: 20,
      }],
      ...(currentCompanyInfo || {}),
    };
    return newQuote;
  }, [quotes.length]);
  
  const handleNewQuote = useCallback(() => {
    const currentCompanyInfo = {
      companyName: getValues('companyName'),
      companyAddress: getValues('companyAddress'),
      companyPhone: getValues('companyPhone'),
      companyEmail: getValues('companyEmail'),
      companyLogo: getValues('companyLogo'),
    };

    const newQuote = createNewQuoteObject(currentCompanyInfo);
    reset(newQuote);
    router.push('/quote');
    
    toast({
      title: "Yeni Teklif Formu Hazır",
      description: "Yeni, boş bir teklif formu oluşturuldu. Kaydetmeyi unutmayın.",
    });
  }, [getValues, reset, toast, router, createNewQuoteObject]);

  
  const loadInitialQuote = useCallback(() => {
      const quoteId = searchParams.get('id');
      if (quoteId) {
        const quoteToLoad = quotes.find(q => q.id === quoteId);
        if (quoteToLoad) {
           reset(quoteToLoad, { keepDirty: false });
           toast({
            title: "Teklif Yüklendi",
            description: `${quoteToLoad.quoteNumber} numaralı teklif düzenleniyor.`,
          });
        } else {
          // Eğer ID bulunamazsa, yeni bir teklif oluştur.
          reset(createNewQuoteObject());
        }
      } else {
        // ID yoksa, yeni bir teklif oluştur.
        reset(createNewQuoteObject());
      }
      setIsClient(true);
  }, [quotes, reset, searchParams, toast, createNewQuoteObject]);
  
  useEffect(() => {
    if(quotes) { // Wait for quotes to be loaded
       loadInitialQuote();
    }
  }, [quotes, loadInitialQuote]);
  
  const saveCurrentQuote = useCallback((currentData: Quote) => {
      const updatedQuote = { ...currentData, updatedAt: new Date() };
      const otherQuotes = quotes.filter(q => q.id !== updatedQuote.id);
      const newQuotesList = [...otherQuotes, updatedQuote];
      return newQuotesList;
  }, [quotes]);
  
  
  const handlePdfExport = useCallback(() => {
    const originalTitle = document.title;
    document.title = getValues('quoteNumber') || 'teklif';
    setIsPreview(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setIsPreview(false);
    }, 100);
  }, [getValues]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const modifier = isMacOS() ? event.metaKey : event.ctrlKey;
    if (modifier && event.key === 's') {
      event.preventDefault();
      handleSubmit(async (data) => {
        const newQuotesList = saveCurrentQuote(data);
        await handleSaveAll({
            quotes: newQuotesList,
            customers: customers,
            companyProfiles: companyProfiles,
        });
        toast({
            title: "Teklif Kaydedildi",
            description: "Değişiklikleriniz dosyaya başarıyla kaydedildi.",
        });
      })();
    }
    if (modifier && event.key === 'p') {
      event.preventDefault();
      handlePdfExport();
    }
     if (modifier && event.key === 'n') {
      event.preventDefault();
      handleNewQuote();
    }
  }, [handleSubmit, saveCurrentQuote, handleSaveAll, toast, customers, companyProfiles, handleNewQuote, handlePdfExport]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  

  const watchedItems = watch('items') || [];
  const watchedDiscountType = watch('discountType');
  const watchedDiscountValue = watch('discountValue') || 0;

  const subtotal = watchedItems.reduce((acc, item) => (acc + (Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
  const taxTotal = watchedItems.reduce((acc, item) => (acc + ((Number(item.quantity) || 0) * (Number(item.price) || 0)) * (Number(item.tax) / 100)), 0);
  const totalWithTax = subtotal + taxTotal;

  let discountAmount = 0;
  if (watchedDiscountType === 'percentage') {
    discountAmount = totalWithTax * ((Math.min(100, Number(watchedDiscountValue) || 0)) / 100);
  } else {
    discountAmount = Number(watchedDiscountValue) || 0;
  }
  discountAmount = Math.max(0, Math.min(discountAmount, totalWithTax));

  const grandTotal = totalWithTax - discountAmount;
  const calculations = { subtotal, taxTotal, discountAmount, grandTotal };
  
  const handleLoadQuote = useCallback((quoteId: string) => {
    const quoteToLoad = quotes.find(q => q.id === quoteId);
    if (quoteToLoad) {
      reset(quoteToLoad);
      router.push(`/quote?id=${quoteId}`);
      toast({
        title: "Teklif Yüklendi",
        description: `${quoteToLoad.quoteNumber} numaralı teklif yüklendi.`,
      });
    }
  }, [quotes, reset, toast, router]);
  
  const handleDeleteQuote = async (quoteId: string) => {
    const newQuotes = quotes.filter(q => q.id !== quoteId);
    await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });

    if (getValues('id') === quoteId) {
       handleNewQuote();
    }
  };
  
  const handleSetCompanyProfile = (profileId: string) => {
    const profile = companyProfiles.find(p => p.id === profileId);
    if(profile) {
      setValue('companyName', profile.companyName);
      setValue('companyAddress', profile.companyAddress || '');
      setValue('companyPhone', profile.companyPhone || '');
      setValue('companyEmail', profile.companyEmail || '');
      setValue('companyLogo', profile.companyLogo || '');
      toast({ title: `${profile.companyName} profili yüklendi.` });
    }
  };
  
  const handleSetCustomer = useCallback((customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setValue('customerName', customer.customerName);
      setValue('customerAddress', customer.customerAddress || '');
      setValue('customerContact', customer.customerContact || '');
      setValue('customerEmail', customer.customerEmail || '');
      setValue('customerPhone', customer.customerPhone || '');
      toast({ title: `${customer.customerName} müşterisi yüklendi.` });
    }
  }, [customers, setValue, toast]);

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const newQuotes = quotes.map(q => 
        q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    
    if (getValues('id') === quoteId) {
      setValue('status', status, { shouldDirty: true });
    }

    await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });
  };

  const handleReviseQuote = (quoteId: string) => {
    const quoteToRevise = quotes.find(q => q.id === quoteId);
    if (!quoteToRevise) return;

    const revisionRegex = new RegExp(`^${quoteToRevise.quoteNumber.split('-rev')[0]}-rev(\\d+)$`);
    const existingRevisions = quotes.filter(q => revisionRegex.test(q.quoteNumber || ''));
    const nextRevisionNumber = existingRevisions.length + 1;

    const newRevisionQuote: Quote = {
      ...quoteToRevise,
      id: `QT-${Date.now()}`,
      quoteNumber: `${quoteToRevise.quoteNumber.split('-rev')[0]}-rev${nextRevisionNumber}`,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
      updatedAt: new Date(),
      status: 'Taslak',
    };

    const quotesWithRevision = quotes.map(q => 
        q.id === quoteId ? { ...q, status: 'Revize Edildi' as QuoteStatus, updatedAt: new Date() } : q
    );

    const newQuotesList = [...quotesWithRevision, newRevisionQuote];
    reset(newRevisionQuote);
    router.push(`/quote?id=${newRevisionQuote.id}`);

    handleSaveAll({ quotes: newQuotesList, customers, companyProfiles });

    toast({
      title: "Teklif Revize Edildi",
      description: `Yeni revizyon "${newRevisionQuote.quoteNumber}" oluşturuldu.`,
    });
  };

  if (!isClient) {
    return null;
  }

  const KBD = ({ children }: { children: React.ReactNode }) => (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
      {children}
    </kbd>
  );

  return (
        <FormProvider {...form}>
        <div className="container mx-auto p-4 sm:p-6 md:p-8 print:p-0">
            <header className="mb-8 no-print flex justify-between items-center">
            <div/>
            <div>
                <h1 className="text-4xl font-bold text-primary text-center font-headline">Fiyat Teklifi Oluşturucu</h1>
                <p className="text-center text-muted-foreground mt-2">Tekliflerinizi kolayca oluşturun, yönetin ve dışa aktarın.</p>
            </div>
            <Popover>
                <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                    <Keyboard className="h-4 w-4" />
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Kısayollar</h4>
                    <p className="text-sm text-muted-foreground">Hızlı işlemler için klavye kısayolları.</p>
                    <div className="grid gap-2 text-sm">
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Teklifi Kaydet</span>
                        <span><KBD>{isMacOS() ? '⌘' : 'Ctrl'}</KBD> <KBD>S</KBD></span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">Yeni Teklif</span>
                        <span><KBD>{isMacOS() ? '⌘' : 'Ctrl'}</KBD> <KBD>N</KBD></span>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                        <span className="text-muted-foreground">PDF İndir</span>
                        <span><KBD>{isMacOS() ? '⌘' : 'Ctrl'}</KBD> <KBD>P</KBD></span>
                    </div>
                    </div>
                </div>
                </PopoverContent>
            </Popover>
            </header>
            
            <Toolbar
            onNewQuote={handleNewQuote}
            onSaveQuote={() => {
                handleSubmit(async (data) => {
                const newQuotesList = saveCurrentQuote(data);
                await handleSaveAll({
                    quotes: newQuotesList,
                    customers: customers,
                    companyProfiles: companyProfiles,
                });
                toast({
                    title: "Teklif Kaydedildi",
                    description: "Değişiklikleriniz dosyaya başarıyla kaydedildi.",
                });
                })();
            }}
            onPreviewToggle={() => setIsPreview(!isPreview)}
            onPdfExport={handlePdfExport}
            isPreviewing={isPreview}
            savedQuotes={quotes}
            onLoadQuote={handleLoadQuote}
            onDeleteQuote={handleDeleteQuote}
            onReviseQuote={handleReviseQuote}
            onStatusChange={handleStatusChange}
            getValues={getValues}
            />
            
            <main className="mt-8">
            {isPreview ? (
                <QuotePreview
                quote={getValues()}
                calculations={calculations}
                onBackToEdit={() => setIsPreview(false)}
                />
            ) : (
                <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => {
                    if(e.key === 'Enter' && (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                        if (!(e.target instanceof HTMLTextAreaElement)) {
                            e.preventDefault();
                        }
                    }
                }}>
                <QuoteForm 
                    calculations={calculations} 
                    customers={customers}
                    onSetCustomer={handleSetCustomer}
                    onSaveCustomer={handleSaveCustomer}
                    companyProfiles={companyProfiles}
                    onSetCompanyProfile={handleSetCompanyProfile}
                />
                </form>
            )}
            </main>
        </div>
        </FormProvider>
  );
}
