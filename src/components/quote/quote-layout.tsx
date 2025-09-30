'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FilePlus2,
  Building,
  Users,
  Loader2,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CompanyProfilesPanel from '../data-management/company-profiles-panel';
import CustomersPanel from '../data-management/customers-panel';
import { Customer, CompanyProfile, Quote, DbData, QuoteStatus } from '@/lib/schema';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDbData, saveDbData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

type QuoteLayoutContextType = {
  quotes: Quote[];
  customers: Customer[];
  companyProfiles: CompanyProfile[];
  loading: boolean;
  handleSaveAll: (data: DbData) => Promise<boolean>;
  handleSaveCustomer: (customer: Customer) => Promise<void>;
  handleDeleteCustomer: (id: string) => Promise<void>;
  handleSaveCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  handleDeleteCompanyProfile: (id: string) => Promise<void>;
  handleStatusChange: (quoteId: string, status: QuoteStatus) => Promise<void>;
  handleDeleteQuote: (quoteId: string) => Promise<void>;
  handleReviseQuote: (quoteId: string) => string | undefined;
};

const QuoteLayoutContext = createContext<QuoteLayoutContextType | null>(null);

export const useQuoteLayout = () => {
  const context = useContext(QuoteLayoutContext);
  if (!context) {
    throw new Error('useQuoteLayout must be used within a QuoteLayoutProvider');
  }
  return context;
};

function QuoteLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isAuthLoading, logout } = useAuth();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated && pathname !== '/login') {
        router.push('/login');
      } else if (isAuthenticated && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  // Data Management (DB)
  const handleSaveAll = useCallback(async (data: DbData): Promise<boolean> => {
    const result = await saveDbData(data);
    
    if (result.success) {
      setQuotes(data.quotes);
      setCustomers(data.customers);
      setCompanyProfiles(data.companyProfiles);
      return true;
    } else {
      console.error("Veritabanına kaydetme hatası: ", result.error);
      toast({
        title: "Kaydetme Başarısız",
        description: "Veriler veritabanına kaydedilemedi. Lütfen internet bağlantınızı ve ayarlarınızı kontrol edin.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDbData();
        setQuotes(data.quotes);
        setCustomers(data.customers);
        setCompanyProfiles(data.companyProfiles);
      } catch (error) {
        console.error('Veri yüklenirken beklenmedik bir hata oluştu:', error);
        toast({ title: "Kritik Veri Yükleme Hatası", description: "Veritabanı yüklenemedi. Lütfen konsol kayıtlarını kontrol edin.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, isAuthenticated, pathname]);

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    const profileExists = companyProfiles.some(p => p.id === profile.id);
    const newProfiles = profileExists
      ? companyProfiles.map(p => p.id === profile.id ? profile : p)
      : [...companyProfiles, profile];
    
    const success = await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    if (success) {
        toast({ title: `Firma Profili ${profileExists ? 'Güncellendi' : 'Kaydedildi'}` });
    }
  };

  const handleDeleteCompanyProfile = async (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    const success = await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    if (success) {
        toast({ title: 'Profil Silindi', variant: 'destructive' });
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    const customerExists = customers.some(c => c.id === customer.id);
     const newCustomers = customerExists
      ? customers.map(c => c.id === customer.id ? customer : c)
      : [...customers, customer];
    const success = await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    if (success) {
        toast({ title: `Müşteri ${customerExists ? 'Güncellendi' : 'Kaydedildi'}` });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    const success = await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    if (success) {
        toast({ title: 'Müşteri Silindi', variant: 'destructive' });
    }
  };
  
  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const newQuotes = quotes.map(q =>
      q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    const success = await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });
    if (success) {
        toast({ title: 'Teklif Durumu Güncellendi', description: `Teklif durumu "${status}" olarak değiştirildi.` });
    }
  };
  
  const handleDeleteQuote = async (quoteId: string) => {
    const newQuotes = quotes.filter(q => q.id !== quoteId);
    const success = await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });
    if (success) {
         toast({
          title: "Teklif Silindi",
          description: `Teklif başarıyla veritabanından silindi.`,
          variant: "destructive"
        });
    }
  };

  const handleReviseQuote = (quoteId: string): string | undefined => {
    const quoteToRevise = quotes.find(q => q.id === quoteId);
    if (!quoteToRevise) return;

    const revisionRegex = new RegExp(`^${(quoteToRevise.quoteNumber || '').split('-rev')[0]}-rev(\\d+)$`);
    const existingRevisions = quotes.filter(q => revisionRegex.test(q.quoteNumber || ''));
    const nextRevisionNumber = existingRevisions.length + 1;

    const newRevisionQuote: Quote = {
      ...quoteToRevise,
      id: `QT-${Date.now()}`,
      quoteNumber: `${(quoteToRevise.quoteNumber || '').split('-rev')[0]}-rev${nextRevisionNumber}`,
      quoteDate: new Date(),
      validUntil: addDays(new Date(), 30),
      updatedAt: new Date(),
      status: 'Taslak',
    };

    const quotesWithRevision = quotes.map(q => 
        q.id === quoteId ? { ...q, status: 'Revize Edildi' as QuoteStatus, updatedAt: new Date() } : q
    );

    const newQuotesList = [...quotesWithRevision, newRevisionQuote];
    
    handleSaveAll({ quotes: newQuotesList, customers, companyProfiles }).then(success => {
        if (success) {
             toast({
              title: "Teklif Revize Edildi",
              description: `Yeni revizyon "${newRevisionQuote.quoteNumber}" oluşturuldu.`,
            });
        }
    });

    return newRevisionQuote.id;
  };
  
  const handleLogout = () => {
    logout();
    toast({
        title: 'Çıkış Yapıldı',
        description: 'Güvenli bir şekilde çıkış yaptınız.'
    });
    router.push('/login');
  };

  const contextValue: QuoteLayoutContextType = {
    quotes,
    customers,
    companyProfiles,
    loading: loading || isAuthLoading,
    handleSaveAll,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveCompanyProfile,
    handleDeleteCompanyProfile,
    handleStatusChange,
    handleDeleteQuote,
    handleReviseQuote,
  };
  
  if (pathname === '/login') {
     return (
       <QuoteLayoutContext.Provider value={contextValue}>
         <main>{children}</main>
       </QuoteLayoutContext.Provider>
     );
  }

  if (isAuthLoading || !isAuthenticated) {
     return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
     );
  }

  return (
    <QuoteLayoutContext.Provider value={contextValue}>
      <SidebarProvider>
        <Sidebar className="no-print">
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <h2 className="text-xl font-bold text-primary">MEDIA ELA® | SATIŞ</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton size="lg" isActive={pathname === '/'}>
                    <LayoutDashboard />
                    Dashboard
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/quote">
                  <SidebarMenuButton size="lg" isActive={pathname.startsWith('/quote')}>
                    <FilePlus2 />
                    Teklif Oluşturucu
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <CompanyProfilesPanel 
                  profiles={companyProfiles} 
                  onSave={handleSaveCompanyProfile} 
                  onDelete={handleDeleteCompanyProfile}
              >
                  <SidebarMenuButton size="lg">
                      <Building />
                      Firma Profilleri
                  </SidebarMenuButton>
              </CompanyProfilesPanel>
              <CustomersPanel 
                  customers={customers} 
                  onSave={handleSaveCustomer}
                  onDelete={handleDeleteCustomer}
              >
                  <SidebarMenuButton size="lg">
                      <Users />
                      Müşteriler
                  </SidebarMenuButton>
              </CustomersPanel>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarSeparator />
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" onClick={handleLogout}>
                        <LogOut />
                        Çıkış Yap
                    </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 lg:h-[60px] no-print">
            <SidebarTrigger className="md:hidden" />
            <div className='flex-1'>
              {/* Header Content can go here */}
            </div>
          </header>
          <main className="flex-1">
             {loading || isAuthLoading ? (
                <div className="flex h-[calc(100vh-60px)] items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            ) : children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </QuoteLayoutContext.Provider>
  );
}

export function QuoteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QuoteLayoutInner>{children}</QuoteLayoutInner>
    </AuthProvider>
  )
}
