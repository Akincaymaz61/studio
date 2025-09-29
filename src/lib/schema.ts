import { z } from 'zod';
import { addDays, format } from 'date-fns';

export const companyProfileSchema = z.object({
  id: z.string(),
  companyName: z.string().min(1, 'Firma adı gereklidir'),
  companyLogo: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email('Geçersiz e-posta').optional().or(z.literal('')),
});
export type CompanyProfile = z.infer<typeof companyProfileSchema>;

export const customerSchema = z.object({
  id: z.string(),
  customerName: z.string().min(1, 'Müşteri adı gereklidir'),
  customerContact: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email('Geçersiz e-posta').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
});
export type Customer = z.infer<typeof customerSchema>;

export const quoteStatusSchema = z.enum(['Taslak', 'Gönderildi', 'Onaylandı', 'Reddedildi', 'Revize Edildi']);
export type QuoteStatus = z.infer<typeof quoteStatusSchema>;

export const quoteItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  quantity: z.coerce.number().min(0, 'Miktar pozitif olmalıdır').default(1),
  unit: z.string().default('adet'),
  price: z.coerce.number().min(0, 'Fiyat pozitif olmalıdır').default(0),
  tax: z.coerce.number().min(0).max(100).default(20),
});

export const quoteSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  companyLogo: z.string().optional(),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email('Geçersiz e-posta').optional().or(z.literal('')),
  
  customerName: z.string(),
  customerContact: z.string().optional(),
  customerAddress: z.string().optional(),
  customerEmail: z.string().email('Geçersiz e-posta').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  
  quoteNumber: z.string().optional(),
  quoteDate: z.coerce.date(),
  validUntil: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  
  currency: z.string().default('USD'),
  items: z.array(quoteItemSchema),
  notes: z.string().optional(),
  
  discountType: z.enum(['percentage', 'fixed']).default('percentage'),
  discountValue: z.coerce.number().min(0).default(0),

  status: quoteStatusSchema.default('Taslak'),
});

export type Quote = z.infer<typeof quoteSchema>;
export type QuoteItem = z.infer<typeof quoteItemSchema>;

export const dbDataSchema = z.object({
    quotes: z.array(quoteSchema),
    customers: z.array(customerSchema),
    companyProfiles: z.array(companyProfileSchema),
});
export type DbData = z.infer<typeof dbDataSchema>;


export const defaultQuote: Omit<Quote, 'id' | 'quoteNumber' | 'quoteDate' | 'validUntil' | 'updatedAt' | 'items'> = {
  companyName: '',
  companyLogo: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  customerName: '',
  customerContact: '',
  customerAddress: '',
  customerEmail: '',
  customerPhone: '',
  currency: 'USD',
  discountType: 'percentage',
  discountValue: 0,
  notes: '',
  status: 'Taslak',
};

export const currencySymbols: { [key: string]: string } = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
};

export const unitOptions = ["adet", "gün", "ay", "mt", "m2", "paket", "proje"];
export const taxOptions = [0, 1, 8, 10, 18, 20];
