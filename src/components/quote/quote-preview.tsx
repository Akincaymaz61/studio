"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import type { Quote } from "@/lib/schema";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { Separator } from "../ui/separator";

type QuotePreviewProps = {
  quote: Quote;
  calculations: {
    subtotal: number;
    taxTotal: number;
    discountAmount: number;
    grandTotal: number;
  };
  onBackToEdit: () => void;
};

export function QuotePreview({ quote, calculations, onBackToEdit }: QuotePreviewProps) {
  const handlePrint = () => {
    window.print();
  }
  
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

      <Card id="print-area" className="print-container">
        <CardContent className="p-8 md:p-12">
          <header className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-muted/30 p-4 rounded-lg">
              {quote.companyLogo && (
                <div className="mb-4 relative w-48 h-24">
                  <Image src={quote.companyLogo} alt="Firma Logosu" layout="fill" objectFit="contain" className="object-left" />
                </div>
              )}
              <h2 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Teklifi Veren</h2>
              <h1 className="text-xl font-bold text-primary">{quote.companyName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{quote.companyAddress}</p>
              <p className="text-sm text-muted-foreground">{quote.companyPhone}</p>
              <p className="text-sm text-muted-foreground">{quote.companyEmail}</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">TEKLİF</h2>
              <div className="mt-4 space-y-1 text-sm">
                <p><span className="text-muted-foreground">Teklif No:</span> <span className="font-semibold">{quote.quoteNumber}</span></p>
                <p><span className="text-muted-foreground">Teklif Tarihi:</span> <span className="font-semibold">{format(new Date(quote.quoteDate), "dd.MM.yyyy")}</span></p>
                <p><span className="text-muted-foreground">Geçerlilik:</span> <span className="font-semibold">{format(new Date(quote.validUntil), "dd.MM.yyyy")}</span></p>
              </div>
            </div>
          </header>

          <section className="mb-10 bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Müşteri</h3>
              <p className="font-bold text-primary">{quote.customerName}</p>
              {quote.customerContact && <p className="text-sm">{quote.customerContact}</p>}
              <p className="text-sm text-muted-foreground mt-1">{quote.customerAddress}</p>
              <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
              <p className="text-sm text-muted-foreground">{quote.customerPhone}</p>
          </section>

          <section className="mb-10">
            <table className="w-full text-left">
              <thead className="border-b-2 border-primary">
                <tr>
                  <th className="p-3 font-semibold text-sm w-2/5">Açıklama</th>
                  <th className="p-3 font-semibold text-sm text-center">Miktar</th>
                  <th className="p-3 font-semibold text-sm text-center">KDV</th>
                  <th className="p-3 font-semibold text-sm text-right">Birim Fiyat</th>
                  <th className="p-3 font-semibold text-sm text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 text-sm">{item.description}</td>
                    <td className="p-3 text-sm text-center">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-sm text-center">{item.tax}%</td>
                    <td className="p-3 text-sm text-right">{formatCurrency(item.price, quote.currency)}</td>
                    <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.price * item.quantity, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end mb-10">
            <div className="w-full max-w-sm space-y-2 text-sm">
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
              <Separator className="my-2"/>
              <div className="flex justify-between font-bold text-xl">
                <span className="text-primary">Genel Toplam:</span>
                <span className="text-primary">{formatCurrency(calculations.grandTotal, quote.currency)}</span>
              </div>
            </div>
          </section>

          {quote.notes && (
            <footer className="pt-6 border-t mt-10">
              <h3 className="font-semibold mb-2 text-sm">Notlar ve Koşullar</h3>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
            </footer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
