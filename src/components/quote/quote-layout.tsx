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
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  FilePlus2,
  Building,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CompanyProfilesPanel from '../data-management/company-profiles-panel';
import CustomersPanel from '../data-management/customers-panel';

export function QuoteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
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
             <CompanyProfilesPanel>
                <SidebarMenuButton>
                    <Building />
                    Firma Profilleri
                </SidebarMenuButton>
            </CompanyProfilesPanel>
             <CustomersPanel>
                <SidebarMenuButton>
                    <Users />
                    Müşteriler
                </SidebarMenuButton>
            </CustomersPanel>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 lg:h-[60px]">
          <SidebarTrigger className="md:hidden" />
           <div className='flex-1'>
            {/* Header Content can go here */}
           </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
