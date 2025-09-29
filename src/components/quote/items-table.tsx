'use client';

import { useFormContext, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { taxOptions, unitOptions, Quote, QuoteItem } from '@/lib/schema';
import { formatCurrency } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export function ItemsTable() {
  const { control } = useFormContext<Quote>();

  const currency = useWatch({ control, name: 'currency' });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

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
  
  const handleNumericChange = (field: any, value: string) => {
    const parsedValue = parseFloat(value);
    field.onChange(isNaN(parsedValue) ? '' : parsedValue);
  };
  
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/12"></TableHead>
                <TableHead className="w-2/5">Ürün/Hizmet</TableHead>
                <TableHead>Miktar</TableHead>
                <TableHead>Birim</TableHead>
                <TableHead>Birim Fiyat</TableHead>
                <TableHead>KDV</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <Droppable droppableId="items">
              {(provided: any) => (
                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                  {fields.map((item, index) => {
                    const currentItem = watchedItems[index] || {};
                    const total = (currentItem.quantity || 0) * (currentItem.price || 0);

                    return (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided: any) => (
                          <TableRow ref={provided.innerRef} {...provided.draggableProps} className="items-table-row">
                             <TableCell {...provided.dragHandleProps} className="w-12 cursor-move">
                               <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </TableCell>
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
                                render={({ field }) => <Input type="number" {...field} onChange={e => handleNumericChange(field, e.target.value)} onFocus={(e) => e.target.select()} className="w-20" />}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.unit`}
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={field.onChange} value={field.value}>
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
                                render={({ field }) => <Input type="number" {...field} onChange={e => handleNumericChange(field, e.target.value)} onFocus={(e) => e.target.select()} className="w-28" />}
                              />
                            </TableCell>
                            <TableCell>
                              <Controller
                                name={`items.${index}.tax`}
                                control={control}
                                render={({ field }) => (
                                  <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {taxOptions.map(t => <SelectItem key={t} value={String(t)}>{`%${t}`}</SelectItem>)}
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
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </div>
      <div className="mt-4">
        <Button variant="outline" type="button" onClick={addNewItem}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Satır Ekle
        </Button>
      </div>
    </div>
  );
}
