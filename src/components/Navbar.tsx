'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Kullanıcı profilini getir
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Kullanıcı profili getirme hatası:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Bekleyen arkadaşlık isteklerini dinle
  useEffect(() => {
    if (!user) {
      setPendingRequests(0);
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'friendRequests'),
        where('to', '==', user.uid),
        where('status', '==', 'pending')
      ),
      (snapshot) => {
        setPendingRequests(snapshot.docs.length);
      },
      (error) => {
        console.error('Bekleyen istekleri dinleme hatası:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="space-x-4 flex items-center">
      <Link href="/" className="hover:underline">Anasayfa</Link>
      <Link href="/profile" className="hover:underline relative">
        Profil
        {pendingRequests > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {pendingRequests}
          </span>
        )}
      </Link>
      <Link href="/matches" className="hover:underline">Maçlar</Link>
      {user ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
            {userProfile?.profilePhoto || userProfile?.photoURL ? (
              <img 
                src={userProfile.profilePhoto || userProfile.photoURL} 
                alt="Profil fotoğrafı"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">Çıkış Yap</button>
        </div>
      ) : (
        <>
          <Link href="/login" className="hover:underline">Giriş</Link>
          <Link href="/register" className="hover:underline">Kayıt</Link>
        </>
      )}
    </nav>
  );
} 