'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Quote, quoteSchema, defaultQuote, QuoteItem } from '@/lib/schema';
import { Toolbar } from '@/components/quote/toolbar';
import { QuoteForm } from '@/components/quote/quote-form';
import { QuotePreview } from '@/components/quote/quote-preview';
import AiSuggester from '@/components/quote/ai-suggester';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const getInitialState = (): Quote => {
  if (typeof window === 'undefined') {
    return defaultQuote;
  }
  const savedQuote = localStorage.getItem('currentQuote');
  if (savedQuote) {
    try {
      const parsed = JSON.parse(savedQuote);
      
      // Ensure dates are converted from strings
      if (parsed.quoteDate) parsed.quoteDate = new Date(parsed.quoteDate);
      if (parsed.validUntil) parsed.validUntil = new Date(parsed.validUntil);
      
      const result = quoteSchema.safeParse(parsed);
      if (result.success) {
        return result.data;
      } else {
        // Silently fall back to default quote if parsing fails
        return defaultQuote;
      }
    } catch (error) {
      // Silently fall back to default quote if JSON parsing fails
      return defaultQuote;
    }
  }
  return defaultQuote;
};


export default function QuotePage() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isAiSuggesterOpen, setIsAiSuggesterOpen] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);

  const form = useForm<Quote>({
    resolver: zodResolver(quoteSchema),
    defaultValues: getInitialState(),
  });

  const { control, handleSubmit, reset, watch, getValues } = form;

  const watchedItems = useWatch({ control, name: 'items' });
  const watchedDiscountType = useWatch({ control, name: 'discountType' });
  const watchedDiscountValue = useWatch({ control, name: 'discountValue' });
  const watchedCurrency = useWatch({ control, name: 'currency' });

  useEffect(() => {
    setIsClient(true);
    const storedQuotes = localStorage.getItem('savedQuotes');
    if (storedQuotes) {
      setSavedQuotes(JSON.parse(storedQuotes));
    }
  }, []);

  useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('currentQuote', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const calculations = useMemo(() => {
    const subtotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const taxTotal = watchedItems.reduce((acc, item) => acc + (item.quantity * item.price * (item.tax / 100)), 0);
    let discountAmount = 0;
    if (watchedDiscountType === 'percentage') {
      discountAmount = (subtotal + taxTotal) * (watchedDiscountValue / 100);
    } else {
      discountAmount = watchedDiscountValue;
    }
    const grandTotal = subtotal + taxTotal - discountAmount;

    return { subtotal, taxTotal, discountAmount, grandTotal };
  }, [watchedItems, watchedDiscountType, watchedDiscountValue]);

  const handleNewQuote = () => {
    const newQuoteNumber = `TEK-${new Date().getFullYear()}-${(savedQuotes.length + 1).toString().padStart(3, '0')}`;
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
      id: `TEK-${Date.now()}`,
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
  
  const handlePdfExport = () => {
    setIsPreview(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleLoadQuote = (quote: Quote) => {
    reset(quote);
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

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <FormProvider {...form}>
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary text-center font-headline">Fiyat Teklifi Oluşturucu</h1>
          <p className="text-center text-muted-foreground mt-2">Tekliflerinizi kolayca oluşturun, yönetin ve dışa aktarın.</p>
        </header>
        
        <Toolbar
          onNewQuote={handleNewQuote}
          onSaveQuote={handleSaveQuote}
          onPreviewToggle={() => setIsPreview(!isPreview)}
          onPdfExport={handlePdfExport}
          onAiSuggest={() => setIsAiSuggesterOpen(true)}
          isPreviewing={isPreview}
          savedQuotes={savedQuotes}
          onLoadQuote={handleLoadQuote}
          onDeleteQuote={handleDeleteQuote}
        />
        
        <main className="mt-8">
          {isPreview ? (
            <QuotePreview
              quote={getValues()}
              calculations={calculations}
              onBackToEdit={() => setIsPreview(false)}
            />
          ) : (
            <form>
              <QuoteForm 
                fields={fields} 
                append={append} 
                remove={remove} 
                calculations={calculations} 
              />
            </form>
          )}
        </main>
      </div>

      <AiSuggester
        isOpen={isAiSuggesterOpen}
        onOpenChange={setIsAiSuggesterOpen}
        quote={getValues()}
      />
    </FormProvider>
  );
}
