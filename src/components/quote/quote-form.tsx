'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import { Building2, User, FileText, ShoppingCart, StickyNote, Calculator, Upload, Save } from 'lucide-react';
import { ItemsTable } from './items-table';
import type { Quote, Customer } from '@/lib/schema';
import { currencySymbols } from '@/lib/schema';
import { formatCurrency } from '@/lib/utils';
import { DatePicker } from '../ui/date-picker';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

const FormSection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
  <Card className="overflow-hidden">
    <CardHeader className="bg-muted/30">
      <CardTitle className="flex items-center gap-3 text-xl font-semibold">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-6 grid gap-6">
      {children}
    </CardContent>
  </Card>
);

const LogoUploader = () => {
  const { control, setValue, watch } = useFormContext<Quote>();
  const logo = watch('companyLogo');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('companyLogo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="companyLogo">Firma Logosu</Label>
      <div className="relative flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
        <Input
          id="companyLogo"
          type="file"
          className="absolute w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleFileChange}
        />
        {logo ? (
          <Image src={logo} alt="Company Logo" layout="fill" objectFit="contain" className="p-2" />
        ) : (
          <div className="text-center text-muted-foreground">
            <Upload className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">Logo yüklemek için tıklayın veya sürükleyin</p>
            <p className="text-xs">(max 2MB)</p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => setValue('companyLogo', '')} disabled={!logo}>Logoyu Kaldır</Button>
      </div>
    </div>
  );
};


const CustomerAutocomplete = ({ customers, onSetCustomer }: { customers: Customer[], onSetCustomer: (id: string) => void }) => {
    const { control, watch } = useFormContext<Quote>();
    const customerName = watch('customerName');
    const [open, setOpen] = useState(false);

    const filteredCustomers = customerName
        ? customers.filter(c => c.customerName.toLowerCase().includes(customerName.toLowerCase()))
        : [];
    
    return (
        <Popover open={open && filteredCustomers.length > 0} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <FormField name="customerName" control={control} render={({ field }) => (
                    <FormItem>
                        <FormLabel>Müşteri Adı</FormLabel>
                        <FormControl>
                            <Input 
                                placeholder="Müşteri adını yazmaya başlayın..." 
                                {...field} 
                                autoComplete="off"
                                onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value) {
                                        setOpen(true);
                                    } else {
                                        setOpen(false);
                                    }
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <ul className="max-h-60 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                        <li key={customer.id}>
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start font-normal"
                                onClick={() => {
                                    onSetCustomer(customer.id);
                                    setOpen(false);
                                }}
                            >
                                {customer.customerName}
                            </Button>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
};


export function QuoteForm({ calculations, customers, onSetCustomer, onSaveCustomer }: { calculations: any, customers: Customer[], onSetCustomer: (id: string) => void, onSaveCustomer: (customer: Customer) => void }) {
  const { control, getValues } = useFormContext<Quote>();
  const currency = useWatch({ control, name: 'currency' });
  
  const handleNumericChange = (field: any, value: string) => {
    const parsedValue = parseFloat(value);
    field.onChange(isNaN(parsedValue) ? '' : parsedValue);
  };
  
  const handleSaveCurrentCustomer = () => {
    const values = getValues();
    const currentCustomer: Customer = {
      id: `CUS-${Date.now()}`,
      customerName: values.customerName,
      customerContact: values.customerContact,
      customerAddress: values.customerAddress,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone,
    };
    onSaveCustomer(currentCustomer);
  };

  return (
    <div className="space-y-8">
      <FormSection title="Firma Bilgileri" icon={<Building2 />}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField name="companyName" control={control} render={({ field }) => (
              <FormItem>
                <FormLabel>Firma Adı</FormLabel>
                <FormControl><Input placeholder="Firma adınızı girin" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="companyAddress" control={control} render={({ field }) => (
              <FormItem>
                <FormLabel>Firma Adresi</FormLabel>
                <FormControl><Textarea placeholder="Firma adresinizi girin" {...field} /></FormControl>
              </FormItem>
            )} />
            <div className="grid sm:grid-cols-2 gap-6">
              <FormField name="companyPhone" control={control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl><Input placeholder="Telefon" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField name="companyEmail" control={control} render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl><Input type="email" placeholder="E-posta" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <LogoUploader />
        </div>
      </FormSection>

      <FormSection title="Müşteri Bilgileri" icon={<User />}>
        <div className="grid md:grid-cols-2 gap-6">
          <CustomerAutocomplete customers={customers} onSetCustomer={onSetCustomer} />
          <FormField name="customerContact" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>İlgili Kişi</FormLabel>
              <FormControl><Input placeholder="İletişim kurulacak kişi" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>
        <FormField name="customerAddress" control={control} render={({ field }) => (
          <FormItem>
            <FormLabel>Müşteri Adresi</FormLabel>
            <FormControl><Textarea placeholder="Müşteri adresini girin" {...field} /></FormControl>
          </FormItem>
        )} />
        <div className="grid md:grid-cols-2 gap-6">
          <FormField name="customerEmail" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>E-posta</FormLabel>
              <FormControl><Input type="email" placeholder="Müşteri e-posta adresi" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField name="customerPhone" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>Telefon</FormLabel>
              <FormControl><Input placeholder="Müşteri telefon numarası" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>
        <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleSaveCurrentCustomer}>
                <Save className="mr-2 h-4 w-4" />
                Bu Müşteriyi Kaydet
            </Button>
        </div>
      </FormSection>

      <FormSection title="Teklif Bilgileri" icon={<FileText />}>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField name="quoteNumber" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>Teklif Numarası</FormLabel>
              <FormControl><Input placeholder="TEK-2025-001" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField name="quoteDate" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>Teklif Tarihi</FormLabel>
              <FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField name="validUntil" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>Geçerlilik Tarihi</FormLabel>
              <FormControl><DatePicker value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField name="currency" control={control} render={({ field }) => (
            <FormItem>
              <FormLabel>Para Birimi</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Para birimi seçin" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(currencySymbols).map(([code, symbol]) => (
                    <SelectItem key={code} value={code}>{symbol} {code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
      </FormSection>

      <FormSection title="Ürün/Hizmet Kalemleri" icon={<ShoppingCart />}>
        <ItemsTable />
      </FormSection>
      
      <FormSection title="Notlar" icon={<StickyNote />}>
        <FormField name="notes" control={control} render={({ field }) => (
          <FormItem>
            <FormControl><Textarea placeholder="Teklif ile ilgili notlar, ödeme koşulları, teslimat bilgileri vb." rows={5} {...field} /></FormControl>
          </FormItem>
        )} />
      </FormSection>

      <FormSection title="Özet" icon={<Calculator />}>
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ara Toplam:</span>
              <span className="font-medium">{formatCurrency(calculations.subtotal, currency)}</span>
            </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Label htmlFor="discountType" className="text-muted-foreground">İndirim:</Label>
                    <FormField name="discountType" control={control} render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="percentage">Yüzde (%)</SelectItem>
                                <SelectItem value="fixed">Sabit Tutar</SelectItem>
                            </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField name="discountValue" control={control} render={({ field }) => (
                        <FormItem>
                        <FormControl>
                           <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={e => handleNumericChange(field, e.target.value)}
                              onFocus={e => e.target.select()}
                              className="w-24 h-8"
                            />
                        </FormControl>
                        </FormItem>
                    )} />
                </div>
                <span className="font-medium text-red-500">-{formatCurrency(calculations.discountAmount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KDV Toplam:</span>
              <span className="font-medium">{formatCurrency(calculations.taxTotal, currency)}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex justify-between text-xl font-bold">
              <span className="text-primary">Genel Toplam:</span>
              <span>{formatCurrency(calculations.grandTotal, currency)}</span>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
