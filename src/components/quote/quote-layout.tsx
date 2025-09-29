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
import { Customer, CompanyProfile, Quote, DbData, dbDataSchema, QuoteStatus } from '@/lib/schema';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDbData, saveDbData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';

type QuoteLayoutContextType = {
  quotes: Quote[];
  customers: Customer[];
  companyProfiles: CompanyProfile[];
  loading: boolean;
  handleSaveAll: (data: DbData) => Promise<void>;
  handleSaveCustomer: (customer: Customer) => Promise<void>;
  handleDeleteCustomer: (id: string) => Promise<void>;
  handleSaveCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  handleDeleteCompanyProfile: (id: string) => Promise<void>;
  handleStatusChange: (quoteId: string, status: QuoteStatus) => Promise<void>;
};

const QuoteLayoutContext = createContext<QuoteLayoutContextType | null>(null);

export const useQuoteLayout = () => {
  const context = useContext(QuoteLayoutContext);
  if (!context) {
    throw new Error('useQuoteLayout must be used within a QuoteLayoutProvider');
  }
  return context;
};

export function QuoteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for auth status only on client-side
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    if (!authStatus && pathname !== '/login') {
      router.push('/login');
    } else if (authStatus && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);


  const handleSaveAll = useCallback(async (data: DbData) => {
    try {
      await saveDbData(data);
      // After saving, update the state to reflect the changes
      setQuotes(data.quotes);
      setCustomers(data.customers);
      setCompanyProfiles(data.companyProfiles);
    } catch (error) {
      console.error("Error saving to db: ", error);
      toast({
        title: "Kaydetme Hatası",
        description: "Veriler veritabanına kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getDbData();
        const parsedData = dbDataSchema.safeParse(data);
        if (parsedData.success) {
          setQuotes(parsedData.data.quotes);
          setCustomers(parsedData.data.customers);
          setCompanyProfiles(parsedData.data.companyProfiles);
        } else {
             // If parsing fails, it might be an empty object from a new bin
            if (data && Object.keys(data).length === 0) {
                 setQuotes([]);
                 setCustomers([]);
                 setCompanyProfiles([]);
            } else {
                console.error("Zod validation failed for DB data: ", parsedData.error);
                throw new Error("Veritabanı verisi bozuk.");
            }
        }
      } catch (error) {
        console.error('Failed to load data', error);
         toast({ title: "Veri Yükleme Hatası", description: "Veritabanı yüklenirken bir hata oluştu. Lütfen ortam değişkenlerini kontrol edin.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, isAuthenticated]);

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    const profileExists = companyProfiles.some(p => p.id === profile.id);
    const newProfiles = profileExists
      ? companyProfiles.map(p => p.id === profile.id ? profile : p)
      : [...companyProfiles, profile];
    
    await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    setCompanyProfiles(newProfiles);
    toast({ title: `Firma Profili ${profileExists ? 'Güncellendi' : 'Kaydedildi'}` });
  };

  const handleDeleteCompanyProfile = async (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    await handleSaveAll({ quotes, customers, companyProfiles: newProfiles });
    setCompanyProfiles(newProfiles);
    toast({ title: 'Profil Silindi', variant: 'destructive' });
  };

  const handleSaveCustomer = async (customer: Customer) => {
    const customerExists = customers.some(c => c.id === customer.id);
     const newCustomers = customerExists
      ? customers.map(c => c.id === customer.id ? customer : c)
      : [...customers, customer];
    await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    setCustomers(newCustomers);
    toast({ title: `Müşteri ${customerExists ? 'Güncellendi' : 'Kaydedildi'}` });
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    await handleSaveAll({ quotes, customers: newCustomers, companyProfiles });
    setCustomers(newCustomers);
    toast({ title: 'Müşteri Silindi', variant: 'destructive' });
  };

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const newQuotes = quotes.map(q =>
      q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    await handleSaveAll({ quotes: newQuotes, customers, companyProfiles });
    setQuotes(newQuotes);
    toast({ title: 'Teklif Durumu Güncellendi', description: `Teklif durumu "${status}" olarak değiştirildi.` });
  };
  
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
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
    loading,
    handleSaveAll,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveCompanyProfile,
    handleDeleteCompanyProfile,
    handleStatusChange,
  };
  
  if (pathname === '/login') {
     return <main>{children}</main>;
  }

  if (!isAuthenticated) {
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
              <h2 className="text-xl font-bold text-primary">TeklifAI</h2>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton isActive={pathname === '/'}>
                    <LayoutDashboard />
                    Dashboard
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/quote">
                  <SidebarMenuButton isActive={pathname.startsWith('/quote')}>
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
                  <SidebarMenuButton>
                      <Building />
                      Firma Profilleri
                  </SidebarMenuButton>
              </CompanyProfilesPanel>
              <CustomersPanel 
                  customers={customers} 
                  onSave={handleSaveCustomer}
                  onDelete={handleDeleteCustomer}
              >
                  <SidebarMenuButton>
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
                    <SidebarMenuButton onClick={handleLogout}>
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
             {loading ? (
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
