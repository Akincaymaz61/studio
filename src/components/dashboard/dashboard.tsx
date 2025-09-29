'use client';

import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus, quoteStatusSchema } from '@/lib/schema';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, CheckCircle2, XCircle, Edit, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface DashboardProps {
  quotes: Quote[];
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

const QuotesTableDialog = ({ quotes, status, onStatusChange }: { quotes: Quote[], status: QuoteStatus | 'Tümü', onStatusChange: (quoteId: string, status: QuoteStatus) => void; }) => {
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

export default function Dashboard({ quotes: initialQuotes }: DashboardProps) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | 'Tümü'>('Tümü');
  const [isDialogOpen, setDialogOpen] = useState(false);
  
  const stats = useMemo(() => {
    return {
      Tümü: quotes.length,
      Taslak: quotes.filter(q => q.status === 'Taslak').length,
      Gönderildi: quotes.filter(q => q.status === 'Gönderildi').length,
      Onaylandı: quotes.filter(q => q.status === 'Onaylandı').length,
      Reddedildi: quotes.filter(q => q.status === 'Reddedildi').length,
      'Revize Edildi': quotes.filter(q => q.status === 'Revize Edildi').length,
    };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    if (selectedStatus === 'Tümü') return quotes;
    return quotes.filter(q => q.status === selectedStatus);
  }, [quotes, selectedStatus]);
  
  const handleCardClick = (status: QuoteStatus | 'Tümü') => {
      setSelectedStatus(status);
      setDialogOpen(true);
  }

  const sortedRecentQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).slice(0, 10);
  }, [quotes]);

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    // This is an optimistic update. In a real app, you'd call an API here.
    const newQuotes = quotes.map(q => 
        q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    setQuotes(newQuotes);
    // You would also need to persist this change, e.g., by calling saveDbData.
    // This part is omitted here for simplicity as the dashboard is read-only for now.
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            
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
                        <QuotesTableDialog quotes={sortedRecentQuotes} status="Tümü" onStatusChange={handleStatusChange} />
                    </div>
                </CardContent>
            </Card>
        </div>
        <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{selectedStatus} Teklifler ({filteredQuotes.length})</DialogTitle>
            </DialogHeader>
            <QuotesTableDialog quotes={filteredQuotes} status={selectedStatus} onStatusChange={handleStatusChange} />
        </DialogContent>
    </Dialog>
  );
}
