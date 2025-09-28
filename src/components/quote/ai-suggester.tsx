"use client"

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { suggestImprovements } from '@/ai/flows/suggest-improvements';
import type { Quote } from '@/lib/schema';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type AiSuggesterProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  quote: Quote;
};

export default function AiSuggester({ isOpen, onOpenChange, quote }: AiSuggesterProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const itemsForAI = quote.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
        tax: item.tax,
      }));

      const result = await suggestImprovements({
        companyName: quote.companyName,
        customerName: quote.customerName,
        items: itemsForAI,
        notes: quote.notes || '',
      });
      
      if (result.suggestions && result.suggestions.length > 0) {
        setSuggestions(result.suggestions);
      } else {
        setSuggestions(["Harika görünüyor! İyileştirme için herhangi bir öneri bulunamadı."]);
      }

    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: 'Hata',
        description: 'AI önerileri alınırken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            AI Destekli Teklif İyileştirme
          </DialogTitle>
          <DialogDescription>
            Teklifinizi daha profesyonel ve eksiksiz hale getirmek için yapay zeka önerileri alın.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            suggestions.length > 0 && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Öneriler</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-2 mt-2">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleGetSuggestions} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Öneri Al
          </Button>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
