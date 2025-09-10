'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Trophy, Target, Zap, Award, TrendingUp, BarChart3, Users } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { useRouter } from 'next/navigation';

export default function MatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const { matchId } = use(params);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMatch = async () => {
      try {
        const ref = doc(db, 'users', user.uid, 'matches', matchId);
        const snap = await getDoc(ref);
        if (snap.exists()) setMatch(snap.data());
      } catch (err) {
        console.error('Fetch match error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [user, matchId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="max-w-6xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-green-600 text-lg">Maç verileri yükleniyor...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!match) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Maç Bulunamadı</h3>
              <p>Bu maç verisi bulunamadı veya silinmiş olabilir.</p>
              <button 
                onClick={() => router.back()}
                className="inline-block mt-4 text-red-600 hover:underline bg-white/50 px-4 py-2 rounded-lg hover:bg-white/70"
              >
                ← Geri Dön
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Puan hesaplama fonksiyonu
  const calculateRating = (matchData: any) => {
    let rating = 6.0; // Başlangıç puanı

    // Pozitif katkılar
    rating += (matchData.passes || 0) * 0.03; // Başarılı pas
    rating += (matchData.shots || 0) * 0.1; // Başarılı şut
    rating += (matchData.assists || 0) * 0.4; // Asist
    rating += (matchData.goals || 0) * 0.7; // Gol
    rating += ((matchData.distance || 0) / 1000) * 0.1; // Koşu mesafesi (km başına)

    // Negatif katkılar
    rating -= (matchData.passesFail || 0) * 0.02; // Başarısız pas
    rating -= (matchData.shotsFail || 0) * 0.05; // Başarısız şut

    // Sınırlamalar
    rating = Math.max(3.0, Math.min(10.0, rating));

    return Math.round(rating * 10) / 10; // 1 ondalık basamağa yuvarla
  };

  // İstatistik hesaplamaları
  const passRate = match.passes && match.passesFail ? 
    Math.round((match.passes / (match.passes + match.passesFail)) * 100) : 0;
  const shotRate = match.shots && match.shotsFail ? 
    Math.round((match.shots / (match.shots + match.shotsFail)) * 100) : 0;
  const totalPasses = (match.passes || 0) + (match.passesFail || 0);
  const totalShots = (match.shots || 0) + (match.shotsFail || 0);
  
  // Yeni puanlama sistemine göre puan hesapla
  const calculatedRating = calculateRating(match);
  const displayRating = match.rating || calculatedRating; // Eğer rating varsa onu kullan, yoksa hesapla

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors bg-white/50 px-4 py-2 rounded-lg hover:bg-white/70"
              >
                <ArrowLeft className="w-5 h-5" />
                Geri Dön
              </button>
            </div>
            <h1 className="text-4xl font-bold text-green-800 mb-2">Maç Analizi</h1>
            <p className="text-green-600 text-lg">{match.date || 'Tarih belirtilmemiş'}</p>
          </div>

          {/* Toplam Puan Kartı */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h2 className="text-3xl font-bold">Maç Puanı</h2>
            </div>
            <div className="text-6xl font-bold mb-2">{displayRating}</div>
            <p className="text-purple-100">Maç puanınız</p>
          </div>

          {/* Ana İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6" />
                <h3 className="text-lg font-bold">Koşu Mesafesi</h3>
              </div>
              <div className="text-4xl font-bold mb-2">{match.distance || 0}</div>
              <div className="text-blue-100 text-sm">kilometre</div>
              <div className="mt-3 text-blue-200 text-xs">
                {match.distance && match.distance > 8 ? '🏃‍♂️ Mükemmel performans!' : 
                 match.distance && match.distance > 6 ? '💪 İyi çaba!' : '📈 Gelişim alanı'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6" />
                <h3 className="text-lg font-bold">Başarılı Pas</h3>
              </div>
              <div className="text-4xl font-bold mb-2">{match.passes || 0}</div>
              <div className="text-green-100 text-sm">pas</div>
              <div className="mt-3 text-green-200 text-xs">
                {match.passes && match.passes > 20 ? '🎯 Pas ustası!' : 
                 match.passes && match.passes > 10 ? '👍 İyi paslar!' : '⚽ Daha fazla pas!'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6" />
                <h3 className="text-lg font-bold">Başarılı Şut</h3>
              </div>
              <div className="text-4xl font-bold mb-2">{match.shots || 0}</div>
              <div className="text-orange-100 text-sm">şut</div>
              <div className="mt-3 text-orange-200 text-xs">
                {match.shots && match.shots > 5 ? '⚽ Gol makinesi!' : 
                 match.shots && match.shots > 2 ? '🎯 İyi şutlar!' : '🎪 Daha fazla şut!'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6" />
                <h3 className="text-lg font-bold">Pas Başarısı</h3>
              </div>
              <div className="text-4xl font-bold mb-2">{passRate}%</div>
              <div className="text-purple-100 text-sm">başarı oranı</div>
              <div className="mt-3 text-purple-200 text-xs">
                {passRate > 90 ? '🏆 Mükemmel!' : 
                 passRate > 80 ? '⭐ Çok iyi!' : 
                 passRate > 70 ? '👍 İyi!' : '📚 Gelişim alanı'}
              </div>
            </div>
          </div>

          {/* Detaylı İstatistikler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pas İstatistikleri */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6" />
                Pas İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-green-50 rounded-xl p-4">
                  <span className="text-green-700">Başarılı Pas</span>
                  <span className="font-bold text-green-800">{match.passes || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 rounded-xl p-4">
                  <span className="text-red-700">Başarısız Pas</span>
                  <span className="font-bold text-red-800">{match.passesFail || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4">
                  <span className="text-blue-700">Toplam Pas</span>
                  <span className="font-bold text-blue-800">{totalPasses}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <span className="text-purple-700 font-semibold">Pas Başarı Oranı</span>
                  <span className="font-bold text-purple-800 text-xl">{passRate}%</span>
                </div>
              </div>
            </div>

            {/* Şut İstatistikleri */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <Award className="w-6 h-6" />
                Şut İstatistikleri
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-green-50 rounded-xl p-4">
                  <span className="text-green-700">Başarılı Şut</span>
                  <span className="font-bold text-green-800">{match.shots || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-red-50 rounded-xl p-4">
                  <span className="text-red-700">Başarısız Şut</span>
                  <span className="font-bold text-red-800">{match.shotsFail || 0}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl p-4">
                  <span className="text-blue-700">Toplam Şut</span>
                  <span className="font-bold text-blue-800">{totalShots}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <span className="text-purple-700 font-semibold">Şut Başarı Oranı</span>
                  <span className="font-bold text-purple-800 text-xl">{shotRate}%</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </ProtectedRoute>
  );
} 