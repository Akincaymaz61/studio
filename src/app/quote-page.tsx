'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    handleDeleteQuote,
    handleReviseQuote,
    handleStatusChange,
    loading
  } = useQuoteLayout();

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
          id: `item-${Date.now()}`,
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
      const companyInfoFromCurrentQuote = {
          companyName: getValues('companyName'),
          companyAddress: getValues('companyAddress'),
          companyPhone: getValues('companyPhone'),
          companyEmail: getValues('companyEmail'),
          companyLogo: getValues('companyLogo'),
      };
      
      if (quoteId) {
        const quoteToLoad = quotes.find(q => q.id === quoteId);
        if (quoteToLoad) {
           reset(quoteToLoad, { keepDirty: false });
        } else {
          router.push('/quote');
          reset(createNewQuoteObject(companyInfoFromCurrentQuote));
        }
      } else {
        reset(createNewQuoteObject(companyInfoFromCurrentQuote));
      }
  }, [quotes, reset, searchParams, createNewQuoteObject, getValues, router]);
  
  useEffect(() => {
    if(!loading) { // Wait for data to be loaded
       loadInitialQuote();
    }
  }, [loading, loadInitialQuote]);
  
  const saveCurrentQuote = useCallback(() => {
      const currentData = getValues();
      if (!currentData.id) return; // Do not save if it's a new quote without ID yet
      
      // Ensure all date fields are Date objects before saving
      const dataToSave: Quote = {
        ...currentData,
        quoteDate: new Date(currentData.quoteDate),
        validUntil: new Date(currentData.validUntil),
        updatedAt: new Date(),
      };
      
      handleSaveAll({
          quotes: [...quotes.filter(q => q.id !== dataToSave.id), dataToSave],
          customers: customers,
          companyProfiles: companyProfiles,
      });
  }, [getValues, quotes, customers, companyProfiles, handleSaveAll]);
  
  
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
      saveCurrentQuote();
      toast({
          title: "Teklif Kaydedildi",
          description: "Değişiklikleriniz veritabanına başarıyla kaydedildi.",
      });
    }
    if (modifier && event.key === 'p') {
      event.preventDefault();
      handlePdfExport();
    }
     if (modifier && event.key === 'n') {
      event.preventDefault();
      handleNewQuote();
    }
  }, [saveCurrentQuote, toast, handleNewQuote, handlePdfExport]);

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
    }
  }, [quotes, reset, router]);
  
  const handleDeleteQuoteAndRedirect = async (quoteId: string) => {
      await handleDeleteQuote(quoteId);
      if (getValues('id') === quoteId) {
        handleNewQuote();
      }
  };

  const handleReviseQuoteAndRedirect = (quoteId: string) => {
      const newId = handleReviseQuote(quoteId);
      if (newId) {
        router.push(`/quote?id=${newId}`);
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
    }
  }, [customers, setValue]);

  const handleLocalStatusChange = async (quoteId: string, status: QuoteStatus) => {
    if (getValues('id') === quoteId) {
      setValue('status', status, { shouldDirty: true });
    }
    await handleStatusChange(quoteId, status);
  };


  if (loading || !getValues('id')) {
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
                saveCurrentQuote();
                toast({
                    title: "Teklif Kaydedildi",
                    description: "Değişiklikleriniz veritabanına başarıyla kaydedildi.",
                });
            }}
            onPreviewToggle={() => setIsPreview(!isPreview)}
            onPdfExport={handlePdfExport}
            isPreviewing={isPreview}
            savedQuotes={quotes}
            onLoadQuote={handleLoadQuote}
            onDeleteQuote={handleDeleteQuoteAndRedirect}
            onReviseQuote={handleReviseQuoteAndRedirect}
            onStatusChange={handleLocalStatusChange}
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
