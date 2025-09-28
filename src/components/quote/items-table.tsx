'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus } from 'lucide-react';
import { currencySymbols, taxOptions, unitOptions, Quote } from '@/lib/schema';
import { formatCurrency } from '@/lib/utils';
import { FormItem, FormControl, FormMessage } from '@/components/ui/form';

export function ItemsTable({ fields, append, remove, currency }: { fields: any[], append: any, remove: any, currency: string }) {
  const { control, getValues } = useFormContext<Quote>();

  const watchedItems = useWatch({ control, name: 'items' });

  const addNewItem = () => {
    append({
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'adet',
      price: 0,
      tax: 20,
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Ürün/Hizmet</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>KDV</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((item, index) => {
              const currentItem = watchedItems[index] || {};
              const total = (currentItem.quantity || 0) * (currentItem.price || 0);

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Controller
                      name={`items.${index}.description`}
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="Açıklama" />}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field }) => <Input type="number" {...field} className="w-20" />}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.unit`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.price`}
                      control={control}
                      render={({ field }) => <Input type="number" {...field} className="w-28" />}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.tax`}
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {taxOptions.map(t => <SelectItem key={t} value={String(t)}>{t}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(total, currency)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4">
        <Button variant="outline" type="button" onClick={addNewItem}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Satır Ekle
        </Button>
      </div>
    </div>
  );
}
