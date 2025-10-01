'use client';

import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus, quoteStatusSchema } from '@/lib/schema';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, Edit, Send, FolderOpen, Copy, Trash2, MoreVertical, Music, Tags } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth.tsx';

interface DashboardProps {
  quotes: Quote[];
  onStatusChange: (quoteId: string, status: QuoteStatus) => void;
  onDeleteQuote: (quoteId: string) => void;
  onReviseQuote: (quoteId: string) => string | undefined;
}

const statusColors: Record<QuoteStatus, string> = {
    Taslak: "bg-gray-200 text-gray-800",
    Gönderildi: "bg-blue-200 text-blue-800",
    Onaylandı: "bg-green-200 text-green-800",
    Reddedildi: "bg-red-200 text-red-800",
    'Revize Edildi': "bg-yellow-200 text-yellow-800",
};

const StatCard = ({ title, value, icon, onClick, colorClass }: { title: string; value: number; icon: React.ReactNode; onClick: () => void; colorClass: string; }) => (
  <DialogTrigger asChild>
    <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClass} text-white`}>
            {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  </DialogTrigger>
);

const QuotesTable = ({ quotes, onStatusChange, onDeleteQuote, onReviseQuote }: { quotes: Quote[], onStatusChange: (quoteId: string, status: QuoteStatus) => void, onDeleteQuote: (id: string) => void, onReviseQuote: (id: string) => string | undefined }) => {
    const router = useRouter();
    const handleEditClick = (quoteId: string) => {
        router.push(`/quote?id=${quoteId}`);
    };
    const handleReviseClick = (quoteId: string) => {
        const newId = onReviseQuote(quoteId);
        if (newId) {
            router.push(`/quote?id=${newId}`);
        }
    };


  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Teklif No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-center">İşlemler</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {quotes.length > 0 ? (
                    quotes.map(quote => (
                        <TableRow key={quote.id} className="cursor-pointer">
                            <TableCell onClick={() => handleEditClick(quote.id)}>{quote.quoteNumber}</TableCell>
                            <TableCell onClick={() => handleEditClick(quote.id)}>{quote.customerName}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
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
                            <TableCell onClick={() => handleEditClick(quote.id)}>{format(new Date(quote.quoteDate), 'dd/MM/yyyy')}</TableCell>
                            <TableCell onClick={() => handleEditClick(quote.id)} className="text-right">{formatCurrency(quote.items.reduce((acc, item) => acc + (item.quantity * item.price), 0), quote.currency)}</TableCell>
                             <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => handleEditClick(quote.id)}>
                                            <FolderOpen className="h-4 w-4 mr-2" />
                                            Yükle & Düzenle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleReviseClick(quote.id)}>
                                            <Copy className="h-4 w-4 mr-2" />
                                            Revize Et
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                  <Trash2 className="h-4 w-4 mr-2" />
                                                  Sil
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Teklifi Sil</AlertDialogTitle><AlertDialogDescription>Bu işlem geri alınamaz. {quote.quoteNumber} numaralı teklifi kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteQuote(quote.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">Bu kritere uygun teklif bulunamadı.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function Dashboard({ quotes, onStatusChange, onDeleteQuote, onReviseQuote }: DashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | 'Tümü'>('Tümü');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const { currentUser, users } = useAuth();


  const filteredQuotesByDate = useMemo(() => {
    const now = new Date();
    if (dateRange === 'all') return quotes;
    if (dateRange === '7d') return quotes.filter(q => new Date(q.quoteDate) >= subDays(now, 7));
    if (dateRange === '30d') return quotes.filter(q => new Date(q.quoteDate) >= subDays(now, 30));
    if (dateRange === 'this_month') return quotes.filter(q => new Date(q.quoteDate) >= startOfMonth(now) && new Date(q.quoteDate) <= endOfMonth(now));
    if (dateRange === 'last_month') return quotes.filter(q => new Date(q.quoteDate) >= startOfMonth(subDays(startOfMonth(now), 1)) && new Date(q.quoteDate) <= endOfMonth(subDays(startOfMonth(now), 1)));
    return quotes;
  }, [quotes, dateRange]);
  
  const stats = useMemo(() => {
    return {
      Tümü: filteredQuotesByDate.length,
      Taslak: filteredQuotesByDate.filter(q => q.status === 'Taslak').length,
      Gönderildi: filteredQuotesByDate.filter(q => q.status === 'Gönderildi').length,
      Onaylandı: filteredQuotesByDate.filter(q => q.status === 'Onaylandı').length,
      Reddedildi: filteredQuotesByDate.filter(q => q.status === 'Reddedildi').length,
      'Revize Edildi': filteredQuotesByDate.filter(q => q.status === 'Revize Edildi').length,
    };
  }, [filteredQuotesByDate]);

  const dialogQuotes = useMemo(() => {
    if (selectedStatus === 'Tümü') return filteredQuotesByDate;
    return filteredQuotesByDate.filter(q => q.status === selectedStatus);
  }, [filteredQuotesByDate, selectedStatus]);

  const handleCardClick = (status: QuoteStatus | 'Tümü') => {
      setSelectedStatus(status);
      setDialogOpen(true);
  }

  const sortedRecentQuotes = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = filteredQuotesByDate.filter(quote => 
        (quote.quoteNumber?.toLowerCase().includes(searchLower)) ||
        (quote.customerName.toLowerCase().includes(searchLower)) ||
        (quote.items.reduce((acc, item) => acc + (item.quantity * item.price), 0).toString().includes(searchLower))
    );
    return [...filtered].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
  }, [filteredQuotesByDate, searchTerm]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <div className="space-y-8 p-4 sm:p-6 md:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            
            <div className="flex flex-wrap gap-4">
               <a
                href="https://www.musiccleaner.fiyatteklifprogrami.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-4 text-center p-4 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors h-16 text-lg font-bold min-w-[250px]"
              >
                <Music className="h-8 w-8" />
                MusicCleaner
              </a>
              <a
                href="https://tagcleaner.fiyatteklifprogrami.online/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-4 text-center p-4 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors h-16 text-lg font-bold min-w-[250px]"
              >
                <Tags className="h-8 w-8" />
                TagCleaner
              </a>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtreler</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Dönem Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="7d">Son 7 Gün</SelectItem>
                                <SelectItem value="30d">Son 30 Gün</SelectItem>
                                <SelectItem value="this_month">Bu Ay</SelectItem>
                                <SelectItem value="last_month">Geçen Ay</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 min-w-[250px]">
                        <Input 
                            placeholder="Tekliflerde ara (No, Müşteri, Tutar...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Toplam Teklif" value={stats.Tümü} icon={<FileText size={20} />} onClick={() => handleCardClick('Tümü')} colorClass="bg-gray-500" />
                <StatCard title="Taslaklar" value={stats.Taslak} icon={<Edit size={20} />} onClick={() => handleCardClick('Taslak')} colorClass="bg-yellow-500"/>
                <StatCard title="Gönderilenler" value={stats.Gönderildi} icon={<Send size={20} />} onClick={() => handleCardClick('Gönderildi')} colorClass="bg-blue-500"/>
                <StatCard title="Onaylananlar" value={stats.Onaylandı} icon={<CheckCircle2 size={20} />} onClick={() => handleCardClick('Onaylandı')} colorClass="bg-green-500" />
                <StatCard title="Reddedilenler" value={stats.Reddedildi} icon={<XCircle size={20} />} onClick={() => handleCardClick('Reddedildi')} colorClass="bg-red-500" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Son Aktiviteler</CardTitle>
                    <CardDescription>En son güncellenen 10 teklif.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <QuotesTable quotes={sortedRecentQuotes.slice(0,10)} onStatusChange={onStatusChange} onDeleteQuote={onDeleteQuote} onReviseQuote={onReviseQuote} />
                    </div>
                </CardContent>
            </Card>
        </div>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{selectedStatus} Teklifler ({dialogQuotes.length})</DialogTitle>
            </DialogHeader>
            <QuotesTable quotes={dialogQuotes} onStatusChange={onStatusChange} onDeleteQuote={onDeleteQuote} onReviseQuote={onReviseQuote} />
        </DialogContent>
    </Dialog>
  );
}

    