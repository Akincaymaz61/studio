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
import { PlusCircle, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
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
import React, { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { processLogo } from '@/ai/flows/process-logo-flow';

const LogoUploader = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string) => void;
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        toast({ title: "Dosya Çok Büyük", description: "Lütfen 5MB'dan küçük bir logo dosyası seçin.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const logoDataUri = reader.result as string;
        try {
          const result = await processLogo({ logoDataUri });
          onChange(result.optimizedLogoUrl);
           toast({ title: "Logo İşlendi", description: "Logo başarıyla optimize edildi ve yüklendi." });
        } catch (aiError) {
          console.error("AI logo processing error:", aiError);
          toast({ title: "Logo İşlenemedi", description: "Yapay zeka logoyu işlerken bir hata oluştu.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("File reading error:", error);
      toast({ title: "Dosya Okunamadı", description: "Logo dosyası okunurken bir hata oluştu.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <FormLabel>Firma Logosu</FormLabel>
      <div className="flex items-center gap-4">
        <div className="w-40 h-20 rounded-md border flex items-center justify-center bg-muted/30 overflow-hidden">
          {isProcessing ? (
             <Loader2 className="animate-spin h-8 w-8 text-primary" />
          ) : value ? (
            <Image
              src={value}
              alt="Logo Önizleme"
              width={160}
              height={80}
              className="object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Önizleme</span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? 'İşleniyor...' : 'Logo Yükle'}
        </Button>
      </div>
      <Input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/png, image/jpeg, image/gif, image/webp"
        onChange={handleFileChange}
      />
       <p className="text-xs text-muted-foreground">Önerilen boyut: 240x90 piksel. PNG, JPG, GIF formatları desteklenir.</p>
    </div>
  );
};


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
        companyLogoUrl: '',
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
            name="companyLogoUrl"
            render={({ field }) => (
              <FormItem>
                <LogoUploader value={field.value} onChange={field.onChange} />
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
