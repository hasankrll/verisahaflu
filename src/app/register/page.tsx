'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebaseClient';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Username kontrolü
    if (!username.trim()) {
      setError('Kullanıcı adı gereklidir');
      return;
    }
    
    // Username formatı kontrolü
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
      return;
    }
    
    // Doğum tarihi kontrolü
    if (!birthDate.trim()) {
      setError('Doğum tarihi gereklidir');
      return;
    }
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    if (age < 1 || age > 120) {
      setError('Geçerli bir doğum tarihi giriniz');
      return;
    }
    
    try {
      // Firebase Auth ile kullanıcı oluştur
      const user = await signup(email, password);
      
      // Firestore'a kullanıcı verilerini kaydet
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        email,
        username,
        birthDate,
        createdAt: serverTimestamp(),
        // Profil tamamlanma durumu
        profileCompleted: false,
      });
      
      router.push('/profile');
    } catch (err: any) {
      console.error('Register Error:', err.code, err.message, err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu email adresi zaten kullanılıyor');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre en az 6 karakter olmalıdır');
      } else if (err.code === 'permission-denied') {
        setError('Firebase güvenlik kuralları güncellenmeli. Lütfen yönetici ile iletişime geçin.');
      } else {
        setError('Kayıt sırasında bir hata oluştu: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-green-800 mb-2">Kayıt Ol</h2>
          <p className="text-gray-600">VERİ SAHA'ya katıl ve performansını takip et</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Adınız"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Soyadınız"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="kullaniciadi"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sadece harf, rakam ve alt çizgi kullanabilirsiniz
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doğum Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
          >
            Kayıt Ol
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 