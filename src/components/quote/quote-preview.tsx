
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import type { Quote, CompanyProfile } from "@/lib/schema";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";

type QuotePreviewProps = {
  quote: Quote;
  calculations: {
    subtotal: number;
    taxTotal: number;
    discountAmount: number;
    grandTotal: number;
  };
  companyProfiles: CompanyProfile[];
  onBackToEdit: () => void;
};

export function QuotePreview({ quote, calculations, companyProfiles, onBackToEdit }: QuotePreviewProps) {
  const handlePrint = () => {
    window.print();
  }
  
  const companyProfile = companyProfiles.find(p => p.id === quote.companyProfileId);
  const companyLogoUrl = companyProfile?.companyLogoUrl;

  return (
    <div className="space-y-4">
       <div className="flex justify-between items-center no-print">
        <Button variant="outline" onClick={onBackToEdit}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Düzenlemeye Dön
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Yazdır
        </Button>
      </div>

      <div id="print-area" className="print-container">
        <Card className="print:shadow-none print:border-none print:rounded-none">
          <CardContent className="p-8 md:p-12 print:p-12">
            <header className="flex justify-between items-start mb-8">
                <div className="w-1/2">
                  {companyLogoUrl && (
                    <div className="mb-4 relative w-56 h-28">
                      <Image src={companyLogoUrl} alt="Firma Logosu" layout="fill" objectFit="contain" className="object-left" />
                    </div>
                  )}
                </div>
                <div className="w-1/2 text-right">
                  <h1 className="text-3xl font-bold text-primary uppercase tracking-wider">FİYAT TEKLİFİ</h1>
                  <div className="mt-2 space-y-1 text-xs">
                    <p><span className="text-muted-foreground">Teklif No:</span> <span className="font-semibold">{quote.quoteNumber}</span></p>
                    <p><span className="text-muted-foreground">Teklif Tarihi:</span> <span className="font-semibold">{format(new Date(quote.quoteDate), "dd.MM.yyyy")}</span></p>
                    <p><span className="text-muted-foreground">Geçerlilik:</span> <span className="font-semibold">{format(new Date(quote.validUntil), "dd.MM.yyyy")}</span></p>
                  </div>
                </div>
            </header>
            
            <section className="grid grid-cols-2 gap-12 mt-8 mb-8 print:grid-cols-2">
               <div>
                  <h3 className="text-primary font-semibold mb-2 border-b border-primary/20 pb-1">Müşteri Bilgileri:</h3>
                  <p className="font-bold">{quote.customerName}</p>
                  {quote.customerContact && <p>{quote.customerContact}</p>}
                  <p>{quote.customerAddress}</p>
                  <p>Tel: {quote.customerPhone}</p>
                  <p>E-posta: {quote.customerEmail}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-primary font-semibold mb-2 border-b border-primary/20 pb-1">Teklifi Veren:</h3>
                  <p className="font-bold">{quote.companyName}</p>
                  <p>{quote.companyAddress}</p>
                  <p>Tel: {quote.companyPhone}</p>
                  <p>E-posta: {quote.companyEmail}</p>
                </div>
            </section>

            <section className="mb-8">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="p-3 font-semibold text-sm w-2/5 rounded-l-lg">Ürün/Hizmet</th>
                    <th className="p-3 font-semibold text-sm text-center">Miktar</th>
                    <th className="p-3 font-semibold text-sm text-center">Birim</th>
                    <th className="p-3 font-semibold text-sm text-right">Birim Fiyat</th>
                    <th className="p-3 font-semibold text-sm text-center">KDV</th>
                    <th className="p-3 font-semibold text-sm text-right rounded-r-lg">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr key={item.id} className={cn("border-b", index % 2 === 0 ? 'bg-white' : 'bg-muted/50')}>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3 text-center">{item.quantity}</td>
                      <td className="p-3 text-center">{item.unit}</td>
                      <td className="p-3 text-right">{formatCurrency(item.price, quote.currency)}</td>
                      <td className="p-3 text-center">{item.tax}%</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(item.price * item.quantity, quote.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            
            <section className="mt-8">
                <div className="flex flex-col-reverse md:flex-row justify-between gap-8">
                    <div className="w-full md:w-1/2 flex justify-end">
                         <div className="w-full max-w-xs break-inside-avoid print-summary-box">
                            <div className="space-y-2">
                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ara Toplam:</span>
                                    <span className="font-medium">{formatCurrency(calculations.subtotal, quote.currency)}</span>
                                </div>
                                {calculations.discountAmount > 0 && (
                                    <div className="flex justify-between">
                                    <span className="text-muted-foreground">İndirim:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(calculations.discountAmount, quote.currency)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">KDV Toplam:</span>
                                    <span className="font-medium">{formatCurrency(calculations.taxTotal, quote.currency)}</span>
                                </div>
                                </div>
                                <div className="flex justify-between font-bold text-lg p-4 rounded-lg bg-primary text-primary-foreground">
                                    <span>Genel Toplam:</span>
                                    <span>{formatCurrency(calculations.grandTotal, quote.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="w-full md:w-1/2">
                        {quote.notes && (
                            <div className="break-inside-avoid">
                                <h3 className="font-semibold mb-2 text-primary">Notlar:</h3>
                                <div className="text-sm text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: quote.notes }} />
                            </div>
                        )}
                    </div>
                </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    