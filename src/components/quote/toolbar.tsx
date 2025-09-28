"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Quote, CompanyProfile, Customer, companyProfileSchema, customerSchema } from "@/lib/schema";
import { formatCurrency } from "@/lib/utils";
import {
  FilePlus2,
  Save,
  Eye,
  FileDown,
  FolderOpen,
  Trash2,
  List,
  Building,
  Users,
  PlusCircle,
  Edit,
  LogOut,
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/hooks/use-auth';

type ToolbarProps = {
  onNewQuote: () => void;
  onSaveQuote: () => void;
  onPreviewToggle: () => void;
  onPdfExport: () => void;
  isPreviewing: boolean;
  savedQuotes: Quote[];
  onLoadQuote: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
  companyProfiles: CompanyProfile[];
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  onSetCompanyProfile: (profile: CompanyProfile) => void;
  onDeleteCompanyProfile: (profileId: string) => void;
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onSetCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  getValues: any;
};

const CompanyProfileForm = ({ profile, onSave, closeDialog }: { profile?: CompanyProfile, onSave: (data: CompanyProfile) => void, closeDialog: () => void }) => {
  const form = useForm<CompanyProfile>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: profile || { id: `CP-${Date.now()}`, companyName: '', companyLogo: '', companyAddress: '', companyPhone: '', companyEmail: '' },
  });

  const onSubmit = (data: CompanyProfile) => {
    onSave(data);
    closeDialog();
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="companyName" render={({ field }) => (
            <FormItem><FormLabel>Firma Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="companyAddress" render={({ field }) => (
            <FormItem><FormLabel>Adres</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="companyPhone" render={({ field }) => (
            <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="companyEmail" render={({ field }) => (
            <FormItem><FormLabel>E-posta</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          {/* Logo uploader could be added here if needed in the future */}
          <DialogFooter>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </Form>
    </FormProvider>
  )
}

const CustomerForm = ({ customer, onSave, closeDialog }: { customer?: Customer, onSave: (data: Customer) => void, closeDialog: () => void }) => {
  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      id: customer?.id || `CUS-${Date.now()}`,
      customerName: customer?.customerName || '',
      customerContact: customer?.customerContact || '',
      customerAddress: customer?.customerAddress || '',
      customerEmail: customer?.customerEmail || '',
      customerPhone: customer?.customerPhone || '',
    },
  });

  const onSubmit = (data: Customer) => {
    onSave(data);
    closeDialog();
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="customerName" render={({ field }) => (
            <FormItem><FormLabel>Müşteri Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="customerContact" render={({ field }) => (
            <FormItem><FormLabel>İlgili Kişi</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
           <FormField control={form.control} name="customerAddress" render={({ field }) => (
            <FormItem><FormLabel>Adres</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="customerPhone" render={({ field }) => (
            <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="customerEmail" render={({ field }) => (
            <FormItem><FormLabel>E-posta</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <DialogFooter>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </Form>
    </FormProvider>
  )
}

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
  onSaveCompanyProfile,
  onSetCompanyProfile,
  onDeleteCompanyProfile,
  customers,
  onSaveCustomer,
  onSetCustomer,
  onDeleteCustomer,
  getValues,
}: ToolbarProps) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isCompanyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<CompanyProfile | undefined>(undefined);
  const [isProfileFormOpen, setProfileFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
  const [isCustomerFormOpen, setCustomerFormOpen] = useState(false);

  const handleCreateNewProfile = () => {
    const currentValues = getValues();
    const newProfile: CompanyProfile = {
      id: `CP-${Date.now()}`,
      companyName: currentValues.companyName || 'Yeni Profil',
      companyAddress: currentValues.companyAddress,
      companyPhone: currentValues.companyPhone,
      companyEmail: currentValues.companyEmail,
      companyLogo: currentValues.companyLogo || '',
    };
    onSaveCompanyProfile(newProfile);
    setEditingProfile(newProfile); 
    setProfileFormOpen(true);
  };


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
          <DialogTrigger asChild><Button variant="outline"><List /> Kayıtlı Teklifler</Button></DialogTrigger>
          <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Kaydedilmiş Teklifler</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Teklif No</TableHead><TableHead>Müşteri</TableHead><TableHead>Tarih</TableHead><TableHead>Tutar</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                <TableBody>
                  {savedQuotes.length > 0 ? savedQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>{quote.quoteNumber}</TableCell><TableCell>{quote.customerName}</TableCell><TableCell>{format(new Date(quote.quoteDate), "dd/MM/yyyy")}</TableCell><TableCell>{formatCurrency(quote.items.reduce((acc, item) => acc + item.quantity * item.price, 0), quote.currency)}</TableCell>
                      <TableCell className="text-right">
                        <DialogClose asChild><Button variant="ghost" size="sm" onClick={() => onLoadQuote(quote)}><FolderOpen className="h-4 w-4 mr-2" /> Yükle</Button></DialogClose>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Teklifi Sil</AlertDialogTitle><AlertDialogDescription>Bu işlem geri alınamaz. {quote.quoteNumber} numaralı teklifi kalıcı olarak silmek istediğinizden emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteQuote(quote.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="text-center">Kaydedilmiş teklif bulunamadı.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Company Profiles */}
        <Dialog open={isCompanyDialogOpen} onOpenChange={setCompanyDialogOpen}>
          <DialogTrigger asChild><Button variant="outline"><Building /> Firma Profilleri</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Firma Profilleri</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Firma Adı</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                <TableBody>
                  {companyProfiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.companyName}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { onSetCompanyProfile(p); setCompanyDialogOpen(false); }}><FolderOpen className="h-4 w-4 mr-2" /> Yükle</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingProfile(p); setProfileFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Düzenle</Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Profili Sil</AlertDialogTitle><AlertDialogDescription>{p.companyName} profilini silmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteCompanyProfile(p.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateNewProfile}><PlusCircle className="mr-2 h-4 w-4" /> Mevcut Bilgilerle Profil Oluştur</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customers */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setCustomerDialogOpen}>
          <DialogTrigger asChild><Button variant="outline"><Users /> Müşteriler</Button></DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Müşteri Listesi</DialogTitle></DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
               <Table>
                <TableHeader><TableRow><TableHead>Müşteri Adı</TableHead><TableHead>İlgili Kişi</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
                <TableBody>
                  {customers.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.customerName}</TableCell><TableCell>{c.customerContact}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => { onSetCustomer(c); setCustomerDialogOpen(false); }}><FolderOpen className="h-4 w-4 mr-2" /> Yükle</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingCustomer(c); setCustomerFormOpen(true); }}><Edit className="h-4 w-4 mr-2" /> Düzenle</Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Sil</Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle><AlertDialogDescription>{c.customerName} müşterisini silmek istediğinize emin misiniz?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>İptal</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteCustomer(c.id)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => { setEditingCustomer(undefined); setCustomerFormOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Yeni Müşteri</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSaveQuote}><Save /> Teklifi Kaydet</Button>
        <Button variant="secondary" onClick={onPreviewToggle}><Eye /> {isPreviewing ? 'Düzenle' : 'Önizle'}</Button>
        <Button variant="default" onClick={onPdfExport}><FileDown /> PDF İndir</Button>
        {user && <Button variant="destructive" onClick={logout}><LogOut/>Çıkış Yap</Button>}
      </div>

      {/* Profile Form Dialog */}
      <Dialog open={isProfileFormOpen} onOpenChange={setProfileFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProfile?.companyName !== 'Yeni Profil' ? 'Profili Düzenle' : 'Yeni Profil Ekle'}</DialogTitle></DialogHeader>
          <CompanyProfileForm profile={editingProfile} onSave={onSaveCompanyProfile} closeDialog={() => setProfileFormOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Customer Form Dialog */}
      <Dialog open={isCustomerFormOpen} onOpenChange={setCustomerFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}</DialogTitle></DialogHeader>
          <CustomerForm customer={editingCustomer} onSave={onSaveCustomer} closeDialog={() => setCustomerFormOpen(false)} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
