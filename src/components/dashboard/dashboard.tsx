'use client';

import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus, quoteStatusSchema } from '@/lib/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, Edit, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface DashboardProps {
  quotes: Quote[];
  onStatusChange: (quoteId: string, status: QuoteStatus) => void;
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

const QuotesTableDialog = ({ quotes, onStatusChange }: { quotes: Quote[], onStatusChange: (quoteId: string, status: QuoteStatus) => void; }) => {
    const router = useRouter();
    const handleRowClick = (quoteId: string) => {
        router.push(`/quote?id=${quoteId}`);
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
                </TableRow>
            </TableHeader>
            <TableBody>
                {quotes.length > 0 ? (
                    quotes.map(quote => (
                        <TableRow key={quote.id} onClick={() => handleRowClick(quote.id)} className="cursor-pointer">
                            <TableCell>{quote.quoteNumber}</TableCell>
                            <TableCell>{quote.customerName}</TableCell>
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
                            <TableCell>{format(new Date(quote.quoteDate), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="text-right">{formatCurrency(quote.items.reduce((acc, item) => acc + (item.quantity * item.price), 0), quote.currency)}</TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Bu kritere uygun teklif bulunamadı.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function Dashboard({ quotes, onStatusChange }: DashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | 'Tümü'>('Tümü');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

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
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            
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
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <QuotesTableDialog quotes={sortedRecentQuotes.slice(0,10)} onStatusChange={onStatusChange} />
                    </div>
                </CardContent>
            </Card>
        </div>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{selectedStatus} Teklifler ({dialogQuotes.length})</DialogTitle>
            </DialogHeader>
            <QuotesTableDialog quotes={dialogQuotes} onStatusChange={onStatusChange} />
        </DialogContent>
    </Dialog>
  );
}
