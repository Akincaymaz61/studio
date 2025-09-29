"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Quote, CompanyProfile, Customer, quoteStatusSchema, QuoteStatus } from "@/lib/schema";
import { formatCurrency, cn } from "@/lib/utils";
import {
  FilePlus2,
  Save,
  Eye,
  FileDown,
  FolderOpen,
  Trash2,
  List,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';


const statusColors: Record<QuoteStatus, string> = {
    Taslak: "bg-gray-200 text-gray-800",
    Gönderildi: "bg-blue-200 text-blue-800",
    Onaylandı: "bg-green-200 text-green-800",
    Reddedildi: "bg-red-200 text-red-800",
    'Revize Edildi': "bg-yellow-200 text-yellow-800",
};


type ToolbarProps = {
  onNewQuote: () => void;
  onSaveQuote: () => void;
  onPreviewToggle: () => void;
  onPdfExport: () => void;
  isPreviewing: boolean;
  savedQuotes: Quote[];
  onLoadQuote: (quoteId: string) => void;
  onDeleteQuote: (quoteId: string) => void;
  companyProfiles: CompanyProfile[];
  onSetCompanyProfile: (profileId: string) => void;
  customers: Customer[];
  onSetCustomer: (customerId: string) => void;
  onReviseQuote: (quoteId: string) => void;
  onStatusChange: (quoteId: string, status: QuoteStatus) => void;
};


export function Toolbar({
  onNewQuote,
  onSaveQuote,
  onPreviewToggle,
  onPdfExport,
  isPreviewing,
  savedQuotes,
  onLoadQuote,
  onDeleteQuote,
  companyProfiles,
  onSetCompanyProfile,
  customers,
  onSetCustomer,
  onReviseQuote,
  onStatusChange,
}: ToolbarProps) {
  const { toast } = useToast();
  const [isQuotesDialogOpen, setQuotesDialogOpen] = useState(false);
  
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-2 shadow-sm no-print">
      <div className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <FilePlus2 />
              Yeni Teklif
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Yeni Teklif Oluştur</AlertDialogTitle>
              <AlertDialogDescription>
                Mevcut teklifteki kaydedilmemiş değişiklikler kaybolabilir. Firma bilgileriniz korunacak. Devam etmek istediğinize emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={onNewQuote}>Devam Et</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isQuotesDialogOpen} onOpenChange={setQuotesDialogOpen}>
          <DialogTrigger asChild><Button variant="outline"><List /> Kayıtlı Teklifler</Button></DialogTrigger>
          <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Kaydedilmiş Teklifler</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Teklif No</TableHead><TableHead>Müşteri</TableHead><TableHead>Durum</TableHead><TableHead>Tarih</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                <TableBody>
                  {savedQuotes.length > 0 ? savedQuotes.sort((a,b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>{quote.quoteNumber}</TableCell><TableCell>{quote.customerName}</TableCell>
                      <TableCell>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Badge className={cn("cursor-pointer", statusColors[quote.status])}>{quote.status}</Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {quoteStatusSchema.options.map(status => (
                                <DropdownMenuItem key={status} onSelect={() => onStatusChange(quote.id, status)}>
                                    <div className={cn("w-2 h-2 rounded-full mr-2", statusColors[status])} />
                                    {status}
                                </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>{format(new Date(quote.quoteDate), "dd/MM/yyyy")}</TableCell><TableCell>{formatCurrency(quote.items.reduce((acc, item) => acc + item.quantity * item.price, 0), quote.currency)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => { onLoadQuote(quote.id); setQuotesDialogOpen(false); }}><FolderOpen className="h-4 w-4 mr-2" /> Yükle</Button>
                        <Button variant="ghost" size="sm" onClick={() => { onReviseQuote(quote.id); setQuotesDialogOpen(false); }}><Copy className="h-4 w-4 mr-2" /> Revize Et</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Teklifi Sil</AlertDialogTitle><AlertDialogDescription>Bu işlem geri alınamaz. {quote.quoteNumber} numaralı teklifi kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteQuote(quote.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="text-center">Kaydedilmiş teklif bulunamadı.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSaveQuote}><Save /> Teklifi Kaydet</Button>
        <Button variant="secondary" onClick={onPreviewToggle}><Eye /> {isPreviewing ? 'Düzenle' : 'Önizle'}</Button>
        <Button variant="default" onClick={onPdfExport}><FileDown /> PDF İndir</Button>
      </div>
    </div>
  );
}
