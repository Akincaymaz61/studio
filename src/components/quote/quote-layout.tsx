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
  UserCog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CompanyProfilesPanel from '../data-management/company-profiles-panel';
import CustomersPanel from '../data-management/customers-panel';
import { Customer, CompanyProfile, Quote, DbData, QuoteStatus, User, userSchema, defaultAdminUser } from '@/lib/schema';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDbData, saveDbData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';
import { addDays } from 'date-fns';
import UserManagement from '../data-management/user-management';


type QuoteLayoutContextType = {
  quotes: Quote[];
  customers: Customer[];
  companyProfiles: CompanyProfile[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  handleSaveAll: (data: DbData) => Promise<boolean>;
  handleSaveCustomer: (customer: Customer) => Promise<void>;
  handleDeleteCustomer: (id: string) => Promise<void>;
  handleSaveCompanyProfile: (profile: CompanyProfile) => Promise<void>;
  handleDeleteCompanyProfile: (id: string) => Promise<void>;
  handleSaveUser: (user: User) => Promise<void>;
  handleDeleteUser: (userId: string) => Promise<void>;
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

export function QuoteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for auth status only on client-side
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);

    if (authStatus) {
        const storedUser = localStorage.getItem('currentUser');
        if(storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch(e) {
                console.error("Mevcut kullanıcı verisi okunamadı.", e);
                handleLogout(); // Corrupted data, force logout
            }
        }
    }

    if (!authStatus && pathname !== '/login') {
      router.push('/login');
    } else if (authStatus && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);


  const handleSaveAll = useCallback(async (data: DbData): Promise<boolean> => {
    const result = await saveDbData(data);
    
    if (result.success) {
      setQuotes(data.quotes);
      setCustomers(data.customers);
      setCompanyProfiles(data.companyProfiles);
      setUsers(data.users);
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
        // Ensure there is at least one admin user
        if (data.users.length === 0) {
            console.log("Kullanıcı listesi boş, varsayılan admin oluşturuluyor.");
            const initialUsers = [defaultAdminUser];
            setUsers(initialUsers);
            await handleSaveAll({ ...data, users: initialUsers });
        } else {
            setUsers(data.users);
        }

      } catch (error) {
        console.error('Veri yüklenirken beklenmedik bir hata oluştu:', error);
         toast({ title: "Kritik Veri Yükleme Hatası", description: "Veritabanı yüklenemedi. Lütfen konsol kayıtlarını kontrol edin.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, isAuthenticated, pathname, handleSaveAll]);

  const handleSaveCompanyProfile = async (profile: CompanyProfile) => {
    const profileExists = companyProfiles.some(p => p.id === profile.id);
    const newProfiles = profileExists
      ? companyProfiles.map(p => p.id === profile.id ? profile : p)
      : [...companyProfiles, profile];
    
    const success = await handleSaveAll({ quotes, customers, companyProfiles: newProfiles, users });
    if (success) {
        toast({ title: `Firma Profili ${profileExists ? 'Güncellendi' : 'Kaydedildi'}` });
    }
  };

  const handleDeleteCompanyProfile = async (profileId: string) => {
    const newProfiles = companyProfiles.filter(p => p.id !== profileId);
    const success = await handleSaveAll({ quotes, customers, companyProfiles: newProfiles, users });
    if (success) {
        toast({ title: 'Profil Silindi', variant: 'destructive' });
    }
  };

  const handleSaveCustomer = async (customer: Customer) => {
    const customerExists = customers.some(c => c.id === customer.id);
     const newCustomers = customerExists
      ? customers.map(c => c.id === customer.id ? customer : c)
      : [...customers, customer];
    const success = await handleSaveAll({ quotes, customers: newCustomers, companyProfiles, users });
    if (success) {
        toast({ title: `Müşteri ${customerExists ? 'Güncellendi' : 'Kaydedildi'}` });
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    const newCustomers = customers.filter(c => c.id !== customerId);
    const success = await handleSaveAll({ quotes, customers: newCustomers, companyProfiles, users });
    if (success) {
        toast({ title: 'Müşteri Silindi', variant: 'destructive' });
    }
  };
  
  const handleSaveUser = async (user: User) => {
    const userExists = users.some(u => u.id === user.id);
     const newUsers = userExists
      ? users.map(u => u.id === user.id ? user : u)
      : [...users, user];
    const success = await handleSaveAll({ quotes, customers, companyProfiles, users: newUsers });
    if (success) {
        toast({ title: `Kullanıcı ${userExists ? 'Güncellendi' : 'Kaydedildi'}` });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === defaultAdminUser.id) {
        toast({ title: 'Silme Başarısız', description: 'Ana admin kullanıcısı silinemez.', variant: 'destructive' });
        return;
    }
    const newUsers = users.filter(u => u.id !== userId);
    const success = await handleSaveAll({ quotes, customers, companyProfiles, users: newUsers });
    if (success) {
        toast({ title: 'Kullanıcı Silindi', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (quoteId: string, status: QuoteStatus) => {
    const newQuotes = quotes.map(q =>
      q.id === quoteId ? { ...q, status, updatedAt: new Date() } : q
    );
    const success = await handleSaveAll({ quotes: newQuotes, customers, companyProfiles, users });
    if (success) {
        toast({ title: 'Teklif Durumu Güncellendi', description: `Teklif durumu "${status}" olarak değiştirildi.` });
    }
  };
  
  const handleDeleteQuote = async (quoteId: string) => {
    const newQuotes = quotes.filter(q => q.id !== quoteId);
    const success = await handleSaveAll({ quotes: newQuotes, customers, companyProfiles, users });
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
    
    handleSaveAll({ quotes: newQuotesList, customers, companyProfiles, users }).then(success => {
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
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
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
    users,
    currentUser,
    loading,
    isAuthenticated,
    handleSaveAll,
    handleSaveCustomer,
    handleDeleteCustomer,
    handleSaveCompanyProfile,
    handleDeleteCompanyProfile,
    handleSaveUser,
    handleDeleteUser,
    handleStatusChange,
    handleDeleteQuote,
    handleReviseQuote,
  };
  
   if (pathname === '/login') {
     return (
       <QuoteLayoutContext.Provider value={contextValue}>
         <main className="p-4 sm:p-6 md:p-8">{children}</main>
       </QuoteLayoutContext.Provider>
     );
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
