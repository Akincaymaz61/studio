'use client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Customer,
  customerSchema,
  DbData,
  dbDataSchema,
} from '@/lib/schema';
import { useState, useEffect, useCallback } from 'react';
import { getDbData, saveDbData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CustomerForm = ({
  customer,
  onSave,
  closeDialog,
}: {
  customer?: Customer;
  onSave: (data: Customer) => void;
  closeDialog: () => void;
}) => {
  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues:
      customer || {
        id: `CUS-${Date.now()}`,
        customerName: '',
        customerContact: '',
        customerAddress: '',
        customerEmail: '',
        customerPhone: '',
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
          <div className="flex justify-end pt-4">
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  )
};

export default function CustomersPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<
    Customer | undefined
  >(undefined);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDbData();
      const parsedData = dbDataSchema.safeParse(data);
      if (parsedData.success) {
        setDbData(parsedData.data);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Hata',
        description: 'Veriler yüklenemedi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSheetOpen) {
      loadData();
    }
  }, [isSheetOpen, loadData]);

  const handleSave = async (customer: Customer) => {
    if (!dbData) return;

    const newCustomers = dbData.customers.filter(p => p.id !== customer.id);
    newCustomers.push(customer);
    const newData = { ...dbData, customers: newCustomers };

    try {
      await saveDbData(newData);
      setDbData(newData);
      toast({ title: 'Müşteri Kaydedildi' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Müşteri kaydedilemedi.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!dbData) return;

    const newCustomers = dbData.customers.filter(p => p.id !== customerId);
    const newData = { ...dbData, customers: newCustomers };

    try {
      await saveDbData(newData);
      setDbData(newData);
      toast({ title: 'Müşteri Silindi', variant: 'destructive' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Müşteri silinemedi.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-3xl w-full">
        <SheetHeader>
          <SheetTitle>Müşteri Yönetimi</SheetTitle>
          <SheetDescription>
            Kayıtlı müşterileri görüntüleyin, düzenleyin veya yenisini
            ekleyin.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingCustomer(undefined);
                setFormOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Müşteri Ekle
            </Button>
          </div>
          {loading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri Adı</TableHead>
                     <TableHead>İlgili Kişi</TableHead>
                     <TableHead>Telefon</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbData?.customers.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>{c.customerName}</TableCell>
                       <TableCell>{c.customerContact}</TableCell>
                       <TableCell>{c.customerPhone}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(c);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {c.customerName} müşterisini silmek istediğinize
                                emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(c.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm
            customer={editingCustomer}
            onSave={handleSave}
            closeDialog={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
