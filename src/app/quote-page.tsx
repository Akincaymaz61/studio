'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, CompanyProfile, Customer } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard, HelpCircle } from 'lucide-react';
import { isMacOS } from '@/lib/utils';

const getInitialState = (): Quote => {
  if (typeof window === 'undefined') {
    return defaultQuote;
  }
  try {
    const savedQuote = localStorage.getItem('currentQuote');
    if (savedQuote) {
      const parsed = JSON.parse(savedQuote);
      
      if (parsed.quoteDate) parsed.quoteDate = new Date(parsed.quoteDate);
      if (parsed.validUntil) parsed.validUntil = new Date(parsed.validUntil);
      
      const result = quoteSchema.safeParse(parsed);
      if (result.success) {
        // Ensure all fields have a default value to avoid uncontrolled to controlled error
        return { ...defaultQuote, ...result.data };
      }
    }
  } catch (error) {
    // Silently fall back
  }
  return defaultQuote;
};


export default function QuotePage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: getInitialState(),
  });

  const { handleSubmit, reset, watch, getValues, setValue } = form;
  
  const watchedItems = watch('items') || [];
  const watchedDiscountType = watch('discountType');
  const watchedDiscountValue = watch('discountValue') || 0;

  // --- START OF CALCULATION LOGIC ---
  const subtotal = watchedItems.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return acc + quantity * price;
  }, 0);

  const taxTotal = watchedItems.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const taxRate = Number(item.tax) || 0;
    const itemTotal = quantity * price;
    return acc + (itemTotal * (taxRate / 100));
  }, 0);
  
  const totalWithTax = subtotal + taxTotal;

  let discountAmount = 0;
  if (watchedDiscountType === 'percentage') {
      discountAmount = totalWithTax * ((Number(watchedDiscountValue) || 0) / 100);
  } else {
      discountAmount = Number(watchedDiscountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, totalWithTax);

  const grandTotal = totalWithTax - discountAmount;
  
  const calculations = { subtotal, taxTotal, discountAmount, grandTotal };
  // --- END OF CALCULATION LOGIC ---


  useEffect(() => {
    setIsClient(true);
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) setSavedQuotes(JSON.parse(storedQuotes));

    const storedProfiles = localStorage.getItem('companyProfiles');
    if (storedProfiles) setCompanyProfiles(JSON.parse(storedProfiles));
    
    const storedCustomers = localStorage.getItem('customers');
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));

    const storedActiveProfileId = localStorage.getItem('activeCompanyProfile');
    const activeId = storedActiveProfileId ? JSON.parse(storedActiveProfileId) : null;
    
    const currentQuote = getInitialState();
    reset(currentQuote);

    if (activeId) {
       const activeProfile = (storedProfiles ? JSON.parse(storedProfiles) : []).find((p: CompanyProfile) => p.id === activeId);
       if (activeProfile) {
         handleSetCompanyProfile(activeProfile, false); // don't show toast on initial load
       }
    }

    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = isMacOS() ? event.metaKey : event.ctrlKey;
      if (modifier && event.key === 's') {
        event.preventDefault();
        handleSaveQuote();
      }
      if (modifier && event.key === 'p') {
        event.preventDefault();
        handlePdfExport();
      }
      if (modifier && event.key === 'n') {
        event.preventDefault();
        handleNewQuote();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };

  }, [setValue, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('currentQuote', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);
  
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  
  const handleNewQuote = () => {
    const date = new Date();
    const datePart = format(date, 'yyyyMMdd');
    
    // Find the highest sequence for the current day
    const todayQuotes = savedQuotes.filter(q => q.quoteNumber?.startsWith(`QT-${datePart}`));
    const lastSequence = todayQuotes.reduce((max, q) => {
        const parts = q.quoteNumber?.split('-') || [];
        const seq = parseInt(parts[2] || '0');
        return Math.max(max, seq);
    }, 0);

    const sequence = (lastSequence + 1).toString().padStart(4, '0');
    const newQuoteNumber = `QT-${datePart}-${sequence}`;
    
    const currentCompanyInfo = {
      companyName: getValues('companyName'),
      companyAddress: getValues('companyAddress'),
      companyPhone: getValues('companyPhone'),
      companyEmail: getValues('companyEmail'),
      companyLogo: getValues('companyLogo'),
    };
    const newQuote = {
      ...defaultQuote,
      ...currentCompanyInfo,
      id: `QT-${Date.now()}`,
      quoteNumber: newQuoteNumber,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
      items: [{
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unit: 'adet',
        price: 0,
        tax: 20,
      }],
    };
    reset(newQuote);
    toast({
      title: "Yeni Teklif",
      description: "Form temizlendi ve yeni bir teklif oluşturuldu.",
    });
  };

  const handleSaveQuote = () => {
    handleSubmit((data) => {
      const newSavedQuotes = [...savedQuotes.filter(q => q.id !== data.id), data];
      setSavedQuotes(newSavedQuotes);
      localStorage.setItem('savedQuotes', JSON.stringify(newSavedQuotes));
      toast({
        title: "Teklif Kaydedildi",
        description: "Mevcut teklifiniz başarıyla kaydedildi.",
      });
    })();
  };
  
  const handlePdfExport = useCallback(() => {
    const originalTitle = document.title;
    const quoteNumber = getValues('quoteNumber');
    if (quoteNumber) {
      document.title = quoteNumber;
    }
    
    setIsPreview(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  }, [getValues]);

  const handleLoadQuote = (quote: Quote) => {
    const parsedQuote = quoteSchema.parse({
      ...quote,
      quoteDate: new Date(quote.quoteDate),
      validUntil: new Date(quote.validUntil),
    });
    reset(parsedQuote);
    toast({
      title: "Teklif Yüklendi",
      description: `${quote.quoteNumber} numaralı teklif yüklendi.`,
    });
  };
  
  const handleDeleteQuote = (quoteId: string) => {
    const newSavedQuotes = savedQuotes.filter(q => q.id !== quoteId);
    setSavedQuotes(newSavedQuotes);
    localStorage.setItem('savedQuotes', JSON.stringify(newSavedQuotes));
    toast({
      title: "Teklif Silindi",
      variant: 'destructive',
      description: `Teklif başarıyla silindi.`,
    });
  };

  // Company Profile Handlers
  const handleSaveCompanyProfile = (profile: CompanyProfile) => {
    const newProfiles = [...companyProfiles.filter(p => p.id !== profile.id), profile];
    setCompanyProfiles(newProfiles);
    localStorage.setItem('companyProfiles', JSON.stringify(newProfiles));
    toast({ title: 'Firma Profili Kaydedildi' });
  };

  const handleSetCompanyProfile = (profile: CompanyProfile, showToast = true) => {
    setValue('companyName', profile.companyName);
    setValue('companyAddress', profile.companyAddress || '');
    setValue('companyPhone', profile.companyPhone || '');
    setValue('companyEmail', profile.companyEmail || '');
    setValue('companyLogo', profile.companyLogo || '');
    setActiveProfileId(profile.id);
    localStorage.setItem('activeCompanyProfile', JSON.stringify(profile.id));
    if (showToast) {
        toast({ title: `${profile.companyName} profili yüklendi.` });
    }
  };
  
  const handleDeleteCompanyProfile = (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    setCompanyProfiles(newProfiles);
    localStorage.setItem('companyProfiles', JSON.stringify(newProfiles));
    toast({ title: 'Profil Silindi', variant: 'destructive' });
  };

  // Customer Handlers
  const handleSaveCustomer = (customer: Customer) => {
    const newCustomers = [...customers.filter(c => c.id !== customer.id), customer];
    setCustomers(newCustomers);
    localStorage.setItem('customers', JSON.stringify(newCustomers));
    toast({ title: 'Müşteri Kaydedildi' });
  };
  
  const handleSetCustomer = (customer: Customer) => {
    setValue('customerName', customer.customerName);
    setValue('customerAddress', customer.customerAddress || '');
    setValue('customerContact', customer.customerContact || '');
    setValue('customerEmail', customer.customerEmail || '');
    setValue('customerPhone', customer.customerPhone || '');
    toast({ title: `${customer.customerName} müşterisi yüklendi.` });
  };

  const handleDeleteCustomer = (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    setCustomers(newCustomers);
localStorage.setItem('customers', JSON.stringify(newCustomers));
    toast({ title: 'Müşteri Silindi', variant: 'destructive' });
  };

  if (!isClient) {
    return null; // or a loading skeleton
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
            <h1 className="text-4xl font-bold text-primary text-center font-headline">TeklifAI</h1>
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
          onSaveQuote={handleSaveQuote}
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
                if(e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.closest('.items-table-row')) {
                    e.preventDefault();
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
