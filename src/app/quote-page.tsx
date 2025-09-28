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
import { Keyboard } from 'lucide-react';
import { isMacOS } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, deleteDoc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function QuotePage() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const getInitialState = useCallback((): Quote => {
    // This function now only returns the default state, preventing localStorage race conditions.
    // The actual quote is loaded from Firestore in the useEffect hook.
    return defaultQuote;
  }, []);


  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: getInitialState(),
  });

  const { handleSubmit, reset, watch, getValues, setValue } = form;
  
  // --- Auth & Data Loading Effect ---
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    setDbLoading(true);

    // Function to load the last active quote from Firestore
    const loadLastActiveQuote = async () => {
      const lastActiveQuoteId = localStorage.getItem('lastActiveQuoteId');
      if (lastActiveQuoteId) {
        try {
          const quoteRef = doc(db, 'quotes', lastActiveQuoteId);
          const docSnap = await getDoc(quoteRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const quoteData = {
              ...data,
              quoteDate: data.quoteDate?.toDate(),
              validUntil: data.validUntil?.toDate(),
            };
             const parsedQuote = quoteSchema.parse(quoteData);
             reset(parsedQuote);
          } else {
             handleNewQuote();
          }
        } catch (error) {
          console.error("Error loading last active quote:", error);
          localStorage.removeItem('lastActiveQuoteId'); // Clear invalid ID
          reset(getInitialState());
        }
      } else {
        // If no last active quote, start with a new one
        reset(getInitialState());
      }
    };
    
    loadLastActiveQuote();


    const unsubscribes = [
      onSnapshot(collection(db, 'quotes'), (snapshot) => {
        try {
          const quotes = snapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Firestore Timestamps to JS Date objects
            return quoteSchema.parse({
              ...data,
              quoteDate: data.quoteDate?.toDate(),
              validUntil: data.validUntil?.toDate(),
            });
          }).sort((a, b) => b.quoteDate.getTime() - a.quoteDate.getTime()); // Sort by date descending
          setSavedQuotes(quotes);
        } catch(error) {
            console.error("Error parsing quotes: ", error);
        }
      }),
      onSnapshot(collection(db, 'customers'), (snapshot) => {
        const customers = snapshot.docs.map(doc => doc.data() as Customer);
        setCustomers(customers);
      }),
      onSnapshot(collection(db, 'companyProfiles'), (snapshot) => {
        const profiles = snapshot.docs.map(doc => doc.data() as CompanyProfile);
        setCompanyProfiles(profiles);
        
        const activeProfileId = localStorage.getItem(`activeCompanyProfile`);
        if(activeProfileId) {
          const activeProfile = profiles.find(p => p.id === activeProfileId);
          if (activeProfile) {
            handleSetCompanyProfile(activeProfile, false);
          }
        }
      })
    ];

    setDbLoading(false);
    
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
      unsubscribes.forEach(unsub => unsub());
    };

  }, [user, loading, router]);


  // --- LocalStorage sync for last active quote ID ---
  useEffect(() => {
    setIsClient(true);
    // This effect no longer saves the whole quote, only the ID on save.
  }, [watch]);
  
  // --- Calculation Logic ---
  const watchedItems = watch('items') || [];
  const watchedDiscountType = watch('discountType');
  const watchedDiscountValue = watch('discountValue') || 0;

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
  const safeDiscountValue = Math.max(0, watchedDiscountValue);
  
  if (watchedDiscountType === 'percentage') {
      const percentage = Math.min(100, safeDiscountValue);
      discountAmount = totalWithTax * (percentage / 100);
  } else {
      discountAmount = safeDiscountValue;
  }
  discountAmount = Math.min(discountAmount, totalWithTax);

  const grandTotal = totalWithTax - discountAmount;
  const calculations = { subtotal, taxTotal, discountAmount, grandTotal };

  // --- Handlers ---
  
  const handleNewQuote = () => {
    const date = new Date();
    const datePart = format(date, 'yyyyMMdd');
    
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

    const newQuoteId = `QT-${Date.now()}`;
    const newQuote = {
      ...defaultQuote,
      ...currentCompanyInfo,
      id: newQuoteId,
      quoteNumber: newQuoteNumber,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
    };
    reset(newQuote);
    localStorage.setItem('lastActiveQuoteId', newQuoteId);
    toast({
      title: "Yeni Teklif",
      description: "Form temizlendi ve yeni bir teklif oluşturuldu.",
    });
  };

  const handleSaveQuote = handleSubmit(async (data) => {
    try {
      const quoteRef = doc(db, 'quotes', data.id);
      
      const dataToSave = {
        ...data,
        quoteDate: Timestamp.fromDate(data.quoteDate),
        validUntil: Timestamp.fromDate(data.validUntil),
      };

      await setDoc(quoteRef, dataToSave);
      localStorage.setItem('lastActiveQuoteId', data.id);
      
      toast({
        title: "Teklif Kaydedildi",
        description: "Teklifiniz buluta başarıyla kaydedildi.",
      });
    } catch (error) {
      console.error("Error saving quote: ", error);
      toast({
        title: "Kaydetme Hatası",
        description: "Teklif kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  });
  
  const handlePdfExport = useCallback(() => {
    const originalTitle = document.title;
    const quoteNumber = getValues('quoteNumber');
    document.title = quoteNumber || 'teklif';
    
    setIsPreview(true);
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 100);
  }, [getValues]);

  const handleLoadQuote = (quote: Quote) => {
    reset(quote);
    localStorage.setItem('lastActiveQuoteId', quote.id);
    toast({
      title: "Teklif Yüklendi",
      description: `${quote.quoteNumber} numaralı teklif yüklendi.`,
    });
  };
  
  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await deleteDoc(doc(db, 'quotes', quoteId));
      
      const lastActiveId = localStorage.getItem('lastActiveQuoteId');
      if(lastActiveId === quoteId) {
        localStorage.removeItem('lastActiveQuoteId');
        handleNewQuote();
      }

      toast({
        title: "Teklif Silindi",
        variant: 'destructive',
        description: `Teklif başarıyla silindi.`,
      });
    } catch(error) {
      console.error("Error deleting quote: ", error);
       toast({
        title: "Silme Hatası",
        description: "Teklif silinirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    try {
      await setDoc(doc(db, 'companyProfiles', profile.id), profile);
      toast({ title: 'Firma Profili Kaydedildi' });
    } catch(error) {
      console.error("Error saving company profile: ", error);
      toast({ title: 'Profil Kaydedilemedi', variant: 'destructive' });
    }
  };

  const handleSetCompanyProfile = (profile: CompanyProfile, showToast = true) => {
    setValue('companyName', profile.companyName);
    setValue('companyAddress', profile.companyAddress || '');
    setValue('companyPhone', profile.companyPhone || '');
    setValue('companyEmail', profile.companyEmail || '');
    setValue('companyLogo', profile.companyLogo || '');
    localStorage.setItem(`activeCompanyProfile`, profile.id);
    if (showToast) {
        toast({ title: `${profile.companyName} profili yüklendi.` });
    }
  };
  
  const handleDeleteCompanyProfile = async (profileId: string) => {
    try {
      await deleteDoc(doc(db, 'companyProfiles', profileId));
      toast({ title: 'Profil Silindi', variant: 'destructive' });
    } catch(error) {
      console.error("Error deleting company profile: ", error);
      toast({ title: 'Profil Silinemedi', variant: 'destructive' });
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    try {
      await setDoc(doc(db, 'customers', customer.id), customer);
      toast({ title: 'Müşteri Kaydedildi' });
    } catch(error) {
       console.error("Error saving customer: ", error);
       toast({ title: 'Müşteri Kaydedilemedi', variant: 'destructive' });
    }
  };
  
  const handleSetCustomer = (customer: Customer) => {
    setValue('customerName', customer.customerName);
    setValue('customerAddress', customer.customerAddress || '');
    setValue('customerContact', customer.customerContact || '');
    setValue('customerEmail', customer.customerEmail || '');
    setValue('customerPhone', customer.customerPhone || '');
    toast({ title: `${customer.customerName} müşterisi yüklendi.` });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteDoc(doc(db, 'customers', customerId));
      toast({ title: 'Müşteri Silindi', variant: 'destructive' });
    } catch(error) {
      console.error("Error deleting customer: ", error);
      toast({ title: 'Müşteri Silinemedi', variant: 'destructive' });
    }
  };

  if (loading || !isClient || !user || dbLoading) {
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
