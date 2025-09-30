'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isAuthenticated, isAuthLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthLoading) return;

    const success = login(username, password);

    if (success) {
      toast({
        title: 'Giriş Başarılı',
        description: `Hoş geldiniz, ${username}.`,
      });
      router.push('/'); // Anında yönlendirme
    } else {
      toast({
        title: 'Giriş Başarısız',
        description: 'Kullanıcı adı veya şifre yanlış.',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">MEDIA ELA® | SATIŞ</h1>
        </div>
        <p className="text-2xl font-semibold mb-2">Fiyat Teklif Programına Hoşgeldiniz</p>
        <p className="text-muted-foreground mb-8">Devam etmek için lütfen giriş yapın.</p>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Giriş Yap</CardTitle>
            <CardDescription>Kullanıcı bilgilerinizi girin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Kullanıcı adınız"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                Giriş Yap
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
