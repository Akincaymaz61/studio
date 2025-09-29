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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { CompanyProfile, companyProfileSchema } from '@/lib/schema';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import Image from 'next/image';
import { LOGOS } from '@/lib/logos';
import { cn } from '@/lib/utils';

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
        companyLogoId: 'logo1',
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
            name="companyLogoId"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Firma Logosu Seçin</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-4"
                  >
                    {LOGOS.map(logo => (
                      <FormItem
                        key={logo.id}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem
                            value={logo.id}
                            id={logo.id}
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor={logo.id}
                          className={cn(
                            'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer w-full',
                            field.value === logo.id &&
                              'border-primary'
                          )}
                        >
                          <Image
                            src={logo.url}
                            alt={logo.name}
                            width={120}
                            height={45}
                            className="mb-2 object-contain h-[45px]"
                          />
                          {logo.name}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
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
  profiles,
  onSave,
  onDelete,
}: {
  children: React.ReactNode;
  profiles: CompanyProfile[];
  onSave: (profile: CompanyProfile) => void;
  onDelete: (profileId: string) => void;
}) {
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<
    CompanyProfile | undefined
  >(undefined);

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

          <div className="max-h-[70vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma Adı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map(p => (
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
                              onClick={() => onDelete(p.id)}
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
            onSave={onSave}
            closeDialog={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
