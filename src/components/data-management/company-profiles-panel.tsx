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
import { LogoUploader } from '../quote/logo-uploader';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  CompanyProfile,
  companyProfileSchema,
  DbData,
  dbDataSchema,
} from '@/lib/schema';
import { useState, useEffect, useCallback } from 'react';
import { getDbData, saveDbData } from '@/lib/db-actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const CompanyProfileForm = ({
  profile,
  onSave,
  closeDialog,
}: {
  profile?: CompanyProfile;
  onSave: (data: CompanyProfile) => void;
  closeDialog: () => void;
}) => {
  const form = useForm<CompanyProfile>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues:
      profile || {
        id: `CP-${Date.now()}`,
        companyName: '',
        companyLogo: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
      },
  });

  const onSubmit = (data: CompanyProfile) => {
    onSave(data);
    closeDialog();
  };

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma Adı</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-posta</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LogoUploader logoFieldName="companyLogo" />
          <div className="flex justify-end pt-4">
            <Button type="submit">Kaydet</Button>
          </div>
        </form>
      </Form>
    </FormProvider>
  );
};

export default function CompanyProfilesPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<
    CompanyProfile | undefined
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

  const handleSave = async (profile: CompanyProfile) => {
    if (!dbData) return;

    const newProfiles = dbData.companyProfiles.filter(p => p.id !== profile.id);
    newProfiles.push(profile);
    const newData = { ...dbData, companyProfiles: newProfiles };

    try {
      await saveDbData(newData);
      setDbData(newData);
      toast({ title: 'Profil Kaydedildi' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Profil kaydedilemedi.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!dbData) return;

    const newProfiles = dbData.companyProfiles.filter(p => p.id !== profileId);
    const newData = { ...dbData, companyProfiles: newProfiles };

    try {
      await saveDbData(newData);
      setDbData(newData);
      toast({ title: 'Profil Silindi', variant: 'destructive' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Profil silinemedi.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-2xl w-full">
        <SheetHeader>
          <SheetTitle>Firma Profilleri Yönetimi</SheetTitle>
          <SheetDescription>
            Kayıtlı firma profillerini görüntüleyin, düzenleyin veya yenisini
            ekleyin.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setEditingProfile(undefined);
                setFormOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Yeni Profil Ekle
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
                    <TableHead>Firma Adı</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbData?.companyProfiles.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.companyName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingProfile(p);
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
                              <AlertDialogTitle>Profili Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {p.companyName} profilini silmek istediğinize
                                emin misiniz? Bu işlem geri alınamaz.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(p.id)}
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
              {editingProfile ? 'Profili Düzenle' : 'Yeni Profil Ekle'}
            </DialogTitle>
          </DialogHeader>
          <CompanyProfileForm
            profile={editingProfile}
            onSave={handleSave}
            closeDialog={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
