'use client';

import { getDbData, saveDbData } from '@/lib/db-actions';
import { dbDataSchema, Quote, Customer, CompanyProfile } from '@/lib/schema';
import React, { useEffect, useState, useCallback } from 'react';
import Dashboard from '@/components/dashboard/dashboard';
import { QuoteLayout } from '@/components/quote/quote-layout';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const handleSaveAll = useCallback(async (data: { quotes: Quote[], customers: Customer[], companyProfiles: CompanyProfile[] }) => {
    try {
      await saveDbData(data);
    } catch (error) {
      console.error("Error saving to db.json: ", error);
      toast({
        title: "Kaydetme Hatası",
        description: "Veriler dosyaya kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDbData();
        const parsedData = dbDataSchema.safeParse(data);
        if (parsedData.success) {
          setQuotes(parsedData.data.quotes);
          setCustomers(parsedData.data.customers);
          setCompanyProfiles(parsedData.data.companyProfiles);
        }
      } catch (error) {
        console.error('Failed to load data for dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    const otherProfiles = companyProfiles.filter(p => p.id !== profile.id);
    const newProfiles = [...otherProfiles, profile];
    setCompanyProfiles(newProfiles);
    await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    toast({ title: 'Firma Profili Kaydedildi' });
  };

  const handleDeleteCompanyProfile = async (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    setCompanyProfiles(newProfiles);
    await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    toast({ title: 'Profil Silindi', variant: 'destructive' });
  };

  const handleSaveCustomer = async (customer: Customer) => {
    const otherCustomers = customers.filter(c => c.id !== customer.id);
    const newCustomers = [...otherCustomers, customer];
    setCustomers(newCustomers);
    await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    toast({ title: 'Müşteri Kaydedildi' });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    setCustomers(newCustomers);
    await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    toast({ title: 'Müşteri Silindi', variant: 'destructive' });
  };

  const handleStatusChange = async (quoteId: string, status: Quote['status']) => {
    const newQuotes = quotes.map(q =>
      q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    setQuotes(newQuotes);
    await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });
    toast({ title: 'Teklif Durumu Güncellendi', description: `Teklif durumu "${status}" olarak değiştirildi.` });
  };


  if (loading) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QuoteLayout
        customers={customers}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        companyProfiles={companyProfiles}
        onSaveCompanyProfile={handleSaveCompanyProfile}
        onDeleteCompanyProfile={handleDeleteCompanyProfile}
    >
      <Dashboard quotes={quotes} onStatusChange={handleStatusChange} />
    </QuoteLayout>
  );
}
