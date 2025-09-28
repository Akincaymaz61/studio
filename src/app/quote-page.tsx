'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, CompanyProfile, Customer, DbData, dbDataSchema } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard } from 'lucide-react';
import { isMacOS } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDbData, saveDbData } from '@/lib/db-actions';

export default function QuotePage() {
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: defaultQuote,
  });

  const { handleSubmit, reset, watch, getValues, setValue, formState: { isDirty } } = form;

  const getFullDbData = useCallback((): DbData => {
    return {
      quotes: savedQuotes,
      customers: customers,
      companyProfiles: companyProfiles,
    };
  }, [savedQuotes, customers, companyProfiles]);

  const handleSaveAll = useCallback(async (data: DbData) => {
    try {
      await saveDbData(data);
    } catch (error) {
      console.error("Error saving to db.json: ", error);
      toast({
        title: "Kaydetme Hatası",
        description: "Veriler dosyaya kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  const loadInitialData = useCallback(async () => {
    setDbLoading(true);
    try {
      const data = await getDbData();
      const parsedData = dbDataSchema.safeParse(data);

      if (parsedData.success) {
        const { quotes, customers, companyProfiles } = parsedData.data;
        setSavedQuotes(quotes);
        setCustomers(customers);
        setCompanyProfiles(companyProfiles);

        const latestQuote = quotes.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
        
        if (latestQuote) {
          reset(latestQuote, { keepDirty: false });
        } else {
           const newQuote: Quote = {
            ...defaultQuote,
            id: `QT-${Date.now()}`,
            quoteNumber: `QT-${format(new Date(), 'yyyyMMdd')}-0001`,
            quoteDate: new Date(),
            validUntil: addDays(new Date(), 30),
            updatedAt: new Date(),
          };
          reset(newQuote, { keepDirty: false });
          setSavedQuotes([newQuote]);
          await handleSaveAll({ quotes: [newQuote], customers: [], companyProfiles: [] });
        }
      } else {
         reset(defaultQuote, { keepDirty: false });
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast({ title: "Başlangıç Hatası", description: "Veriler yüklenirken bir hata oluştu.", variant: "destructive" });
      reset(defaultQuote);
    } finally {
      setDbLoading(false);
      setIsClient(true);
    }
  }, [reset, toast, handleSaveAll]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);


  const saveCurrentQuote = useCallback((currentData: Quote) => {
      const updatedQuote = { ...currentData, updatedAt: new Date() };
      const otherQuotes = savedQuotes.filter(q => q.id !== updatedQuote.id);
      const newQuotesList = [...otherQuotes, updatedQuote];
      setSavedQuotes(newQuotesList);
      return newQuotesList;
  }, [savedQuotes]);


  useEffect(() => {
    if (dbLoading) return;
    
    const debouncedSave = setTimeout(() => {
      if (isDirty) {
         handleSubmit(async (data) => {
            const newQuotesList = saveCurrentQuote(data);
            await handleSaveAll({
                quotes: newQuotesList,
                customers: customers,
                companyProfiles: companyProfiles,
            });
         })();
      }
    }, 1500);

    return () => clearTimeout(debouncedSave);
  }, [isDirty, dbLoading, handleSubmit, saveCurrentQuote, handleSaveAll, getFullDbData, customers, companyProfiles, watch()]);
  
  
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
      setIsPreview(true);
      setTimeout(() => {
          window.print();
          setIsPreview(false);
      }, 100);
    }
    if (modifier && event.key === 'n') {
      event.preventDefault();
      // handleNewQuote is defined below and needs the latest state
    }
  }, [handleSubmit, saveCurrentQuote, handleSaveAll, toast, isPreview, customers, companyProfiles]);

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
  discountAmount = Math.min(discountAmount, totalWithTax);

  const grandTotal = totalWithTax - discountAmount;
  const calculations = { subtotal, taxTotal, discountAmount, grandTotal };

  
  const handleNewQuote = useCallback(async () => {
    const currentCompanyInfo = {
      companyName: getValues('companyName'),
      companyAddress: getValues('companyAddress'),
      companyPhone: getValues('companyPhone'),
      companyEmail: getValues('companyEmail'),
      companyLogo: getValues('companyLogo'),
    };

    const newQuote: Quote = {
      ...defaultQuote,
      ...currentCompanyInfo,
      id: `QT-${Date.now()}`,
      quoteNumber: `QT-${format(new Date(), 'yyyyMMdd')}-${(savedQuotes.length + 1).toString().padStart(4, '0')}`,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
      updatedAt: new Date(),
    };
    reset(newQuote);
    
    const newQuotesList = [...savedQuotes, newQuote];
    setSavedQuotes(newQuotesList);
    await handleSaveAll({
        quotes: newQuotesList,
        customers: customers,
        companyProfiles: companyProfiles,
    });

    toast({
      title: "Yeni Teklif Oluşturuldu",
      description: "Yeni, boş bir teklif oluşturuldu ve kaydedildi.",
    });
  }, [getValues, reset, toast, savedQuotes, customers, companyProfiles, handleSaveAll]);

  const handlePdfExport = useCallback(() => {
    const originalTitle = document.title;
    document.title = getValues('quoteNumber') || 'teklif';
    setIsPreview(true);
    setTimeout(() => {
      window.print();
      setIsPreview(false);
      document.title = originalTitle;
    }, 100);
  }, [getValues]);

  const handleLoadQuote = useCallback((quoteId: string) => {
    const quoteToLoad = savedQuotes.find(q => q.id === quoteId);
    if (quoteToLoad) {
      reset(quoteToLoad);
      toast({
        title: "Teklif Yüklendi",
        description: `${quoteToLoad.quoteNumber} numaralı teklif yüklendi.`,
      });
    }
  }, [savedQuotes, reset, toast]);
  
  const handleDeleteQuote = async (quoteId: string) => {
    const newQuotes = savedQuotes.filter(q => q.id !== quoteId);
    setSavedQuotes(newQuotes);
    await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });

    if (getValues('id') === quoteId) {
      const latestQuote = newQuotes.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
      if (latestQuote) {
        reset(latestQuote);
      } else {
        // No quotes left, just reset to a new blank form without saving it automatically
        const newBlankQuote: Quote = {
            ...defaultQuote,
            id: `QT-${Date.now()}`,
            quoteNumber: `QT-${format(new Date(), 'yyyyMMdd')}-0001`,
            quoteDate: new Date(),
            validUntil: addDays(new Date(), 30),
            updatedAt: new Date(),
        };
        reset(newBlankQuote);
      }
    }
    toast({ title: "Teklif Silindi", variant: 'destructive' });
  };

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    const otherProfiles = companyProfiles.filter(p => p.id !== profile.id);
    const newProfiles = [...otherProfiles, profile];
    setCompanyProfiles(newProfiles);
    await handleSaveAll({ quotes: savedQuotes, customers, companyProfiles: newProfiles });
    toast({ title: 'Firma Profili Kaydedildi' });
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
  
  const handleDeleteCompanyProfile = async (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    setCompanyProfiles(newProfiles);
    await handleSaveAll({ quotes: savedQuotes, customers, companyProfiles: newProfiles });
    toast({ title: 'Profil Silindi', variant: 'destructive' });
  };

  const handleSaveCustomer = async (customer: Customer) => {
    const otherCustomers = customers.filter(c => c.id !== customer.id);
    const newCustomers = [...otherCustomers, customer];
    setCustomers(newCustomers);
    await handleSaveAll({ quotes: savedQuotes, customers: newCustomers, companyProfiles });
    toast({ title: 'Müşteri Kaydedildi' });
  };
  
  const handleSetCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setValue('customerName', customer.customerName);
      setValue('customerAddress', customer.customerAddress || '');
      setValue('customerContact', customer.customerContact || '');
      setValue('customerEmail', customer.customerEmail || '');
      setValue('customerPhone', customer.customerPhone || '');
      toast({ title: `${customer.customerName} müşterisi yüklendi.` });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    setCustomers(newCustomers);
    await handleSaveAll({ quotes: savedQuotes, customers: newCustomers, companyProfiles });
    toast({ title: 'Müşteri Silindi', variant: 'destructive' });
  };

  if (!isClient || dbLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
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
          savedQuotes={savedQuotes}
          onLoadQuote={handleLoadQuote}
          onDeleteQuote={handleDeleteQuote}
          companyProfiles={companyProfiles}
          onSaveCompanyProfile={handleSaveCompanyProfile}
          onSetCompanyProfile={handleSetCompanyProfile}
  onDeleteCompanyProfile={handleDeleteCompanyProfile}
          customers={customers}
          onSaveCustomer={handleSaveCustomer}
          onSetCustomer={handleSetCustomer}
          onDeleteCustomer={handleDeleteCustomer}
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
              />
            </form>
          )}
        </main>
      </div>
    </FormProvider>
  );
}
