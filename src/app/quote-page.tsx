'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, CompanyProfile, Customer } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard } from 'lucide-react';
import { isMacOS } from '@/lib/utils';
import { collection, doc, onSnapshot, deleteDoc, setDoc, Timestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const { handleSubmit, reset, watch, getValues, setValue, formState: {isDirty} } = form;
  
  const handleSaveQuote = useCallback(async (data: Quote) => {
    try {
      const quoteRef = doc(db, 'quotes', data.id);
      
      const dataToSave = {
        ...data,
        quoteDate: Timestamp.fromDate(data.quoteDate),
        validUntil: Timestamp.fromDate(data.validUntil),
        updatedAt: Timestamp.now(),
      };

      await setDoc(quoteRef, dataToSave, { merge: true });
      
    } catch (error) {
      console.error("Error saving quote: ", error);
      toast({
        title: "Kaydetme Hatası",
        description: "Teklif kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  }, [toast]);
  
  useEffect(() => {
    const loadInitialData = async () => {
      setDbLoading(true);
      try {
        const q = query(collection(db, 'quotes'), orderBy('updatedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data();
          const quoteData = {
            ...data,
            quoteDate: data.quoteDate?.toDate(),
            validUntil: data.validUntil?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
          const parsedQuote = quoteSchema.parse(quoteData);
          reset(parsedQuote, { keepDirty: false });
        } else {
            // Create a sample quote if the database is empty
            const sampleQuote: Quote = {
                id: `QT-${Date.now()}`,
                companyName: 'ABC Teknoloji Hizmetleri A.Ş.',
                companyAddress: 'Teknoloji Mah. İnovasyon Cad. No:12/3, Teknopark, İstanbul',
                companyPhone: '0212 555 1234',
                companyEmail: 'info@abcteknoloji.com',
                companyLogo: '',
                customerName: 'XYZ Holding',
                customerAddress: 'Finans Merkezi, Barbaros Bulv. No:1, Beşiktaş, İstanbul',
                customerContact: 'Sn. Ahmet Yılmaz',
                customerEmail: 'ahmet.yilmaz@xyzholding.com',
                customerPhone: '0212 999 5678',
                quoteNumber: `QT-${format(new Date(), 'yyyyMMdd')}-0001`,
                quoteDate: new Date(),
                validUntil: addDays(new Date(), 30),
                currency: 'TRY',
                items: [
                    { id: 'item-1', description: 'Kurumsal Web Sitesi Geliştirme (CMS Entegrasyonlu)', quantity: 1, unit: 'proje', price: 75000, tax: 20 },
                    { id: 'item-2', description: 'SEO ve Dijital Pazarlama Danışmanlığı', quantity: 6, unit: 'ay', price: 15000, tax: 20 },
                    { id: 'item-3', description: 'Sunucu Barındırma ve Bakım Hizmeti (Yıllık)', quantity: 1, unit: 'adet', price: 20000, tax: 20 },
                ],
                discountType: 'fixed',
                discountValue: 5000,
                notes: 'Belirtilen fiyatlara KDV dahildir. Teklif, onay tarihinden itibaren 30 gün geçerlidir. Ödeme %50 peşin, %50 iş tesliminde yapılacaktır.',
                updatedAt: new Date(),
            };
            reset(sampleQuote, { keepDirty: false });
            await handleSaveQuote(sampleQuote);
        }
      } catch (error) {
        console.error("Error loading initial quote:", error);
        reset(defaultQuote);
      } finally {
        setDbLoading(false);
      }
    };
    
    loadInitialData();
    setIsClient(true);
    
    const unsubscribes = [
      onSnapshot(collection(db, 'quotes'), (snapshot) => {
        const quotes = snapshot.docs.map(doc => {
            const data = doc.data();
            const parsed = quoteSchema.safeParse({
              ...data,
              quoteDate: data.quoteDate?.toDate(),
              validUntil: data.validUntil?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            });
            if (parsed.success) {
                return parsed.data;
            }
            console.warn("Failed to parse quote from DB:", parsed.error);
            return null;
          }).filter((q): q is Quote => q !== null);
          setSavedQuotes(quotes.sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)));
      }),
      onSnapshot(collection(db, 'customers'), (snapshot) => {
        const customers = snapshot.docs.map(doc => doc.data() as Customer);
        setCustomers(customers);
      }),
      onSnapshot(collection(db, 'companyProfiles'), (snapshot) => {
        const profiles = snapshot.docs.map(doc => doc.data() as CompanyProfile);
        setCompanyProfiles(profiles);
      })
    ];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = isMacOS() ? event.metaKey : event.ctrlKey;
      if (modifier && event.key === 's') {
        event.preventDefault();
        handleSubmit(async (data) => {
            await handleSaveQuote(data);
            toast({
              title: "Teklif Kaydedildi",
              description: "Değişiklikleriniz buluta başarıyla kaydedildi.",
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
    };
    
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unsubscribes.forEach(unsub => unsub());
    };

  }, [reset, toast, handleSubmit, handleSaveQuote]); // handleSaveQuote is memoized, safe to include

  // --- Autosave Effect ---
  const isInitialLoad = useRef(true);
  useEffect(() => {
     if (isInitialLoad.current && !dbLoading) {
        isInitialLoad.current = false;
        return;
    }
    
    const subscription = watch((values, { name, type }) => {
        if (!isDirty) return;
        
        const debouncedSave = setTimeout(() => {
          handleSubmit(handleSaveQuote)();
        }, 1500); // 1.5 second debounce

        return () => clearTimeout(debouncedSave);
    });


    return () => subscription.unsubscribe();
  }, [watch, isDirty, dbLoading, handleSubmit, handleSaveQuote]);
  
  
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
  
  const handleNewQuote = useCallback(async () => {
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

    const newQuote: Quote = {
      ...defaultQuote,
      ...currentCompanyInfo,
      id: `QT-${Date.now()}`,
      quoteNumber: newQuoteNumber,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
      updatedAt: new Date(),
    };
    reset(newQuote);

    try {
        await handleSaveQuote(newQuote);
        toast({
          title: "Yeni Teklif Oluşturuldu",
          description: "Yeni, boş bir teklif oluşturuldu ve kaydedildi.",
        });
    } catch (error) {
        toast({
            title: "Yeni Teklif Kaydedilemedi",
            description: "Yeni teklif oluşturulurken bir hata meydana geldi.",
            variant: "destructive"
        });
    }
  }, [savedQuotes, getValues, reset, handleSaveQuote, toast]);
  
  const handlePdfExport = useCallback(() => {
    const originalTitle = document.title;
    const quoteNumber = getValues('quoteNumber');
    document.title = quoteNumber || 'teklif';
    
    setIsPreview(true);
    setTimeout(() => {
      window.print();
      setIsPreview(false);
      document.title = originalTitle;
    }, 100);
  }, [getValues]);

  const handleLoadQuote = useCallback((quote: Quote) => {
    const quoteData = {
        ...quote,
        quoteDate: quote.quoteDate instanceof Timestamp ? quote.quoteDate.toDate() : quote.quoteDate,
        validUntil: quote.validUntil instanceof Timestamp ? quote.validUntil.toDate() : quote.validUntil,
        updatedAt: quote.updatedAt instanceof Timestamp ? quote.updatedAt.toDate() : quote.updatedAt,
    }
    const parsedQuote = quoteSchema.parse(quoteData)
    reset(parsedQuote);
    toast({
      title: "Teklif Yüklendi",
      description: `${quote.quoteNumber} numaralı teklif yüklendi.`,
    });
  }, [reset, toast]);
  
  const handleDeleteQuote = async (quoteId: string) => {
    const currentQuoteId = getValues('id');
    try {
      await deleteDoc(doc(db, 'quotes', quoteId));
      
      if(currentQuoteId === quoteId) {
        const q = query(collection(db, 'quotes'), orderBy('updatedAt', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
           const quoteData = {
                ...docData,
                quoteDate: docData.quoteDate.toDate(),
                validUntil: docData.validUntil.toDate(),
                updatedAt: docData.updatedAt.toDate(),
            } as Quote
          handleLoadQuote(quoteData);
        } else {
          await handleNewQuote();
        }
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
      toast({ title: 'Müşteri Kaydedilemedi', variant: 'destructive' });
    }
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
            handleSubmit(handleSaveQuote)().then(() => {
                toast({
                  title: "Teklif Kaydedildi",
                  description: "Değişiklikleriniz buluta başarıyla kaydedildi.",
                });
            });
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
