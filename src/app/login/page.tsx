'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Başarıyla giriş yapıldı!');
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        toast.error('Bu email adresi ile kayıtlı kullanıcı bulunamadı');
      } else if (err.code === 'auth/wrong-password') {
        toast.error('Hatalı şifre');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('Geçersiz email adresi');
      } else {
        toast.error('Giriş yapılırken hata oluştu');
      }
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-semibold mb-4">Giriş Yap</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground p-2 rounded"
        >
          Giriş Yap
        </button>
      </form>
      <p className="mt-4">
        Hesabın yok mu?{' '}
        <Link href="/register" className="text-primary">
          Kayıt Ol
        </Link>
      </p>
    </div>
  );
} 