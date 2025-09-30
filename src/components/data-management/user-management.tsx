'use client';

import React, { useState } from 'react';
import { User, userSchema, userRoleSchema } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const UserForm = ({ user, onSave, closeDialog }: { user?: User; onSave: (data: User) => void; closeDialog: () => void; }) => {
    const form = useForm<User>({
        resolver: zodResolver(userSchema),
        defaultValues: user || {
            id: `user-${Date.now()}`,
            username: '',
            password: '',
            role: 'user',
        },
    });

    const onSubmit = (data: User) => {
        onSave(data);
        closeDialog();
    };

    return (
        <FormProvider {...form}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kullanıcı Adı</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Şifre</FormLabel>
                            <FormControl><Input type="password" {...field} placeholder={user ? 'Değiştirmek için yeni şifre girin' : ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                        <FormItem>
                             <FormLabel>Rol</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {userRoleSchema.options.map(role => (
                                        <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Kaydet</Button>
                    </div>
                </form>
            </Form>
        </FormProvider>
    );
};


interface UserManagementProps {
    users: User[];
    onSaveUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
}

export default function UserManagement({ users, onSaveUser, onDeleteUser }: UserManagementProps) {
    const [isFormOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    
    const handleSave = async (user: User) => {
        await onSaveUser(user);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => { setEditingUser(undefined); setFormOpen(true); }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kullanıcı Ekle
                </Button>
            </div>
             <ScrollArea className="h-72 border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Kullanıcı Adı</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => { setEditingUser(user); setFormOpen(true); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={user.role === 'admin'}>
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {user.username} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
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
            </ScrollArea>
             <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</DialogTitle>
                    </DialogHeader>
                    <UserForm user={editingUser} onSave={handleSave} closeDialog={() => setFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
