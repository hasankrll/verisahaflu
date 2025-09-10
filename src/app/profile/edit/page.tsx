'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { User, Save, ArrowLeft, Camera, Upload, X } from 'lucide-react';
import Link from 'next/link';

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    username: '',
    birthDate: '',
    foot: 'Sağ Ayak',
    position: 'Orta Saha',
    email: '',
    photoURL: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            username: data.username || '',
            birthDate: data.birthDate || '',
            foot: data.foot || 'Sağ Ayak',
            position: data.position || 'Orta Saha',
            email: data.email || user.email || '',
            photoURL: data.photoURL || ''
          });
          if (data.photoURL) {
            setPhotoPreview(data.photoURL);
          }
        } else {
          setProfile({
            firstName: '',
            lastName: '',
            username: '',
            birthDate: '',
            foot: 'Sağ Ayak',
            position: 'Orta Saha',
            email: user.email || '',
            photoURL: ''
          });
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPhotoPreview(result);
        setProfile(prev => ({ ...prev, photoURL: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setProfile(prev => ({ ...prev, photoURL: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Username validasyonu
    if (!profile.username.trim()) {
      alert('Kullanıcı adı zorunludur!');
      return;
    }

    // Username formatı kontrolü (sadece harf, rakam ve alt çizgi)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(profile.username)) {
      alert('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir!');
      return;
    }

    // Doğum tarihi validasyonu
    if (!profile.birthDate.trim()) {
      alert('Doğum tarihi zorunludur!');
      return;
    }

    const birthDate = new Date(profile.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1 || age > 120) {
      alert('Geçerli bir doğum tarihi giriniz');
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        await updateDoc(userRef, {
          ...profile,
          profilePhoto: profile.photoURL, // Arkadaşlar sayfası için
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          ...profile,
          profilePhoto: profile.photoURL, // Arkadaşlar sayfası için
          createdAt: serverTimestamp()
        });
      }
      
      router.push('/profile');
    } catch (error) {
      console.error('Profil kaydetme hatası:', error);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-green-600 text-lg">Yükleniyor...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri Dön
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">Profil Düzenle</h1>
            <p className="text-green-600 text-lg">Kişisel bilgilerinizi güncelleyin</p>
          </div>



          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ad</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Adınız"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Soyad</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Soyadınız"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı Adı <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Kullanıcı adınız (örn: ahmet_yilmaz)"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Bu kullanıcı adı arkadaşlık istekleri için kullanılacak</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doğum Tarihi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={profile.birthDate}
                onChange={(e) => setProfile(prev => ({ ...prev, birthDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ayak Tercihi</label>
                <select
                  value={profile.foot}
                  onChange={(e) => setProfile(prev => ({ ...prev, foot: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Sağ Ayak">Sağ Ayak</option>
                  <option value="Sol Ayak">Sol Ayak</option>
                  <option value="İki Ayak">İki Ayak</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pozisyon</label>
                <select
                  value={profile.position}
                  onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Kaleci">Kaleci</option>
                  <option value="Defans">Defans</option>
                  <option value="Orta Saha">Orta Saha</option>
                  <option value="Forvet">Forvet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                placeholder="E-posta adresiniz"
              />
              <p className="text-sm text-gray-500 mt-1">E-posta adresi değiştirilemez</p>
            </div>

            {/* Profil Fotoğrafı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profil Fotoğrafı</label>
              <div className="space-y-4">
                {photoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={photoPreview}
                      alt="Profil önizleme"
                      className="w-24 h-24 rounded-full object-cover border-2 border-green-200"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                    <Camera className="w-4 h-4" />
                    Fotoğraf Seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {photoFile && (
                    <span className="text-sm text-gray-600">
                      Seçilen: {photoFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 transition-all shadow-lg"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
} 