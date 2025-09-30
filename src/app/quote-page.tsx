'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, QuoteStatus, Customer } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Keyboard, Loader2 } from 'lucide-react';
import { isMacOS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuoteLayout } from '@/components/quote/quote-layout';
import { useIsMobile } from '@/hooks/use-mobile';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


export default function QuotePage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const {
    quotes,
    customers,
    companyProfiles,
    handleSaveAll,
    handleSaveCustomer,
    handleDeleteQuote,
    handleReviseQuote,
    handleStatusChange,
    loading
  } = useQuoteLayout();

  const [isPreview, setIsPreview] = useState(false);
  
  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      ...defaultQuote,
    }
  });

  const { handleSubmit, reset, watch, getValues, setValue, formState: { isDirty } } = form;

  const createNewQuoteObject = useCallback((currentCompanyInfo?: {
      companyName: string;
      companyAddress: string;
      companyPhone: string;
      companyEmail: string;
      companyProfileId?: string;
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
      companyProfileId: getValues('companyProfileId'),
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
          companyProfileId: getValues('companyProfileId'),
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
        const defaultProfile = companyProfiles[0];
        reset(createNewQuoteObject(defaultProfile ? {
            companyName: defaultProfile.companyName,
            companyAddress: defaultProfile.companyAddress || '',
            companyPhone: defaultProfile.companyPhone || '',
            companyEmail: defaultProfile.companyEmail || '',
            companyProfileId: defaultProfile.id,
        } : companyInfoFromCurrentQuote));
      }
  }, [quotes, reset, searchParams, createNewQuoteObject, getValues, router, companyProfiles]);
  
  useEffect(() => {
    if(!loading) { // Wait for data to be loaded
       loadInitialQuote();
    }
  }, [loading, loadInitialQuote]);
  
 const saveCurrentQuote = useCallback(async () => {
    const currentData = getValues();
    
    const validationResult = quoteSchema.safeParse(currentData);
    if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
            title: "Kaydetme Başarısız",
            description: `Lütfen zorunlu alanları doldurun. Hata: ${firstError.path.join('.')} - ${firstError.message}`,
            variant: 'destructive',
        });
        return;
    }

    const dataToSave: Quote = {
        ...validationResult.data,
        updatedAt: new Date(),
    };

    const quoteExists = quotes.some(q => q.id === dataToSave.id);
    const newQuotes = quoteExists
        ? quotes.map(q => (q.id === dataToSave.id ? dataToSave : q))
        : [...quotes, dataToSave];

    const success = await handleSaveAll({
        quotes: newQuotes,
        customers: customers,
        companyProfiles: companyProfiles,
    });

    if (success) {
        toast({
            title: "Teklif Kaydedildi",
            description: "Değişiklikleriniz başarıyla veritabanına kaydedildi.",
        });
    }
  }, [getValues, quotes, customers, companyProfiles, handleSaveAll, toast]);

  
  const handlePdfExport = useCallback(async () => {
    const quoteNumber = getValues('quoteNumber') || 'teklif';
    
    if (isMobile) {
      setIsGeneratingPdf(true);
      setIsPreview(true);
      await new Promise(resolve => setTimeout(resolve, 200));

      const printArea = document.getElementById('print-area');
      if (printArea) {
        try {
          const canvas = await html2canvas(printArea, {
            scale: 2,
            useCORS: true,
            logging: false,
          });
          const imgData = canvas.toDataURL('image/png');
          
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });

          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const canvasAspectRatio = canvasWidth / canvasHeight;
          
          let finalWidth = pdfWidth;
          let finalHeight = finalWidth / canvasAspectRatio;

          if (finalHeight > pdfHeight) {
            finalHeight = pdfHeight;
            finalWidth = finalHeight * canvasAspectRatio;
          }
          
          const x = (pdfWidth - finalWidth) / 2;
          const y = 0;
          
          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
          pdf.save(`${quoteNumber}.pdf`);

        } catch (error) {
          console.error("PDF oluşturulurken hata:", error);
          toast({ title: "PDF Oluşturulamadı", description: "PDF oluşturulurken bir hata meydana geldi.", variant: "destructive" });
        }
      }
      
      setIsPreview(false);
      setIsGeneratingPdf(false);
    } else {
      const originalTitle = document.title;
      document.title = quoteNumber;
      setIsPreview(true);
      setTimeout(() => {
        window.print();
        document.title = originalTitle;
        setIsPreview(false);
      }, 100);
    }
  }, [getValues, isMobile, toast]);


  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const modifier = isMacOS() ? event.metaKey : event.ctrlKey;
    if (modifier && event.key === 's') {
      event.preventDefault();
      saveCurrentQuote();
    }
    if (modifier && event.key === 'p') {
      event.preventDefault();
      handlePdfExport();
    }
     if (modifier && event.key === 'n') {
      event.preventDefault();
      handleNewQuote();
    }
  }, [saveCurrentQuote, handleNewQuote, handlePdfExport]);

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
      setValue('companyProfileId', profile.id);
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
      toast({
        title: "Müşteri Yüklendi",
        description: `${customer.customerName} bilgileri forma yüklendi.`
      });
    }
  }, [customers, setValue, toast]);

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
            onSaveQuote={saveCurrentQuote}
            onPreviewToggle={() => setIsPreview(!isPreview)}
            onPdfExport={handlePdfExport}
            isPreviewing={isPreview}
            isGeneratingPdf={isGeneratingPdf}
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
                companyProfiles={companyProfiles}
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

    
