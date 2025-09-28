"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-radix";
import type { Quote } from "@/lib/schema";
import { formatCurrency } from "@/lib/utils";
import { currencySymbols } from "@/lib/schema";
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
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left h-4 w-4 mr-2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          Düzenlemeye Dön
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Yazdır
        </Button>
      </div>

      <Card id="print-area" className="print-container">
        <CardContent className="p-8 md:p-12">
          <header className="flex justify-between items-start mb-10">
            <div>
              {quote.companyLogo && (
                <div className="mb-4 relative w-48 h-24">
                  <Image src={quote.companyLogo} alt="Company Logo" layout="fill" objectFit="contain" />
                </div>
              )}
              <h1 className="text-2xl font-bold text-primary">{quote.companyName}</h1>
              <p className="text-muted-foreground">{quote.companyAddress}</p>
              <p className="text-muted-foreground">{quote.companyPhone}</p>
              <p className="text-muted-foreground">{quote.companyEmail}</p>
            </div>
            <div className="text-right">
              <h2 className="text-4xl font-extrabold text-gray-800 uppercase tracking-wider">Teklif</h2>
              <p className="text-muted-foreground mt-2">No: {quote.quoteNumber}</p>
              <p className="text-muted-foreground">Tarih: {format(new Date(quote.quoteDate), "dd.MM.yyyy")}</p>
            </div>
          </header>

          <section className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Müşteri</h3>
              <p className="font-bold">{quote.customerName}</p>
              <p>{quote.customerAddress}</p>
              <p>{quote.customerContact}</p>
              <p>{quote.customerEmail}</p>
              <p>{quote.customerPhone}</p>
            </div>
            <div className="text-right bg-muted/50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Geçerlilik Tarihi</h3>
                <p className="font-bold">{format(new Date(quote.validUntil), "dd.MM.yyyy")}</p>
                <h3 className="text-sm font-semibold uppercase text-muted-foreground mt-4 mb-2">Toplam Tutar</h3>
                <p className="text-3xl font-bold text-primary">{formatCurrency(calculations.grandTotal, quote.currency)}</p>
            </div>
          </section>

          <section className="mb-10">
            <table className="w-full text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 font-semibold w-2/5">Açıklama</th>
                  <th className="p-3 font-semibold text-center">Miktar</th>
                  <th className="p-3 font-semibold text-right">Birim Fiyat</th>
                  <th className="p-3 font-semibold text-right">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                    <td className="p-3 text-right">{formatCurrency(item.price, quote.currency)}</td>
                    <td className="p-3 text-right">{formatCurrency(item.price * item.quantity, quote.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="flex justify-end mb-10">
            <div className="w-full max-w-xs space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ara Toplam:</span>
                <span>{formatCurrency(calculations.subtotal, quote.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KDV Toplam:</span>
                <span>{formatCurrency(calculations.taxTotal, quote.currency)}</span>
              </div>
              {calculations.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İndirim:</span>
                  <span>-{formatCurrency(calculations.discountAmount, quote.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span className="text-primary">Genel Toplam:</span>
                <span>{formatCurrency(calculations.grandTotal, quote.currency)}</span>
              </div>
            </div>
          </section>

          {quote.notes && (
            <footer className="pt-8 border-t">
              <h3 className="font-semibold mb-2">Notlar</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
            </footer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
