"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Quote } from "@/lib/schema";
import { formatCurrency } from "@/lib/utils";
import {
  FilePlus2,
  Save,
  Eye,
  FileDown,
  Sparkles,
  FolderOpen,
  Trash2,
  List,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";

type ToolbarProps = {
  onNewQuote: () => void;
  onSaveQuote: () => void;
  onPreviewToggle: () => void;
  onPdfExport: () => void;
  onAiSuggest: () => void;
  isPreviewing: boolean;
  savedQuotes: Quote[];
  onLoadQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
};

export function Toolbar({
  onNewQuote,
  onSaveQuote,
  onPreviewToggle,
  onPdfExport,
  onAiSuggest,
  isPreviewing,
  savedQuotes,
  onLoadQuote,
  onDeleteQuote
}: ToolbarProps) {
  const { toast } = useToast();

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
                Mevcut teklifteki kaydedilmemiş değişiklikler kaybolacak. Firma bilgileriniz korunacak. Devam etmek istediğinize emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={onNewQuote}>Devam Et</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline"><List /> Teklif Listesi</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Kaydedilmiş Teklifler</DialogTitle>
              <DialogDescription>
                Daha önce kaydettiğiniz teklifleri buradan yönetebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teklif No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedQuotes.length > 0 ? (
                    savedQuotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>{quote.quoteNumber}</TableCell>
                        <TableCell>{quote.customerName}</TableCell>
                        <TableCell>{format(new Date(quote.quoteDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{formatCurrency(quote.items.reduce((acc, item) => acc + item.quantity * item.price, 0), quote.currency)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => onLoadQuote(quote)}><FolderOpen className="h-4 w-4 mr-2" /> Yükle</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Teklifi Sil</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    Bu işlem geri alınamaz. {quote.quoteNumber} numaralı teklifi kalıcı olarak silmek istediğinizden emin misiniz?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDeleteQuote(quote.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Kaydedilmiş teklif bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button variant="outline" onClick={onAiSuggest}><Sparkles /> AI Önerileri</Button>

      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSaveQuote}><Save /> Kaydet</Button>
        <Button variant="secondary" onClick={onPreviewToggle}><Eye /> {isPreviewing ? 'Düzenle' : 'Önizle'}</Button>
        <Button variant="destructive" onClick={onPdfExport}><FileDown /> PDF Olarak Dışa Aktar</Button>
      </div>
    </div>
  );
}
