'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { BarChart3, Calendar, Target, Zap, Award, TrendingUp, ArrowRight, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  userId: string;
  date: string;
  distance: number;
  passes: number;
  shots: number;
  points: number;
  rating?: number;
  teamPoints: number;
  score: string;
  createdAt: any;
}

export default function MatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
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

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

          const fetchMatches = async () => {
        try {
                  const matchesRef = collection(db, 'users', user.uid, 'matches');
        const q = query(
          matchesRef,
          orderBy('createdAt', 'desc')
        );
          
          const querySnapshot = await getDocs(q);
          const matchesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Match[];
          
          setMatches(matchesData);
        } catch (error) {
          console.error('Maçları getirme hatası:', error);
          // Hata durumunda kullanıcıya bilgi ver
          console.log('Hata detayı:', error);
        } finally {
          setLoading(false);
        }
      };

    fetchMatches();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-800 mb-4">Giriş yapmanız gerekiyor</h1>
          <Link href="/login" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800">Maçlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Tüm Maçlar
          </h1>
          <p className="text-green-600 text-lg">Tüm maçlarınızın detaylı analizi</p>
        </div>

        {/* Tüm Maçlar */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-green-800 flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Tüm Maçlar
            </h2>
          </div>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div 
                  key={match.id}
                  onClick={() => router.push(`/matches/${match.id}`)}
                  className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-800">Maç {index + 1}</h3>
                        <p className="text-green-600">{match.date || 'Tarih yok'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                        {match.rating || calculateRating(match)} Puan
                      </div>
                    </div>
                  </div>

                  {/* Maç Detayları */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Mesafe</span>
                      </div>
                      <div className="font-bold text-green-800 text-lg">{match.distance || 0}</div>
                      <div className="text-xs text-green-600">km</div>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-600">Pas</span>
                      </div>
                      <div className="font-bold text-blue-800 text-lg">{match.passes || 0}</div>
                      <div className="text-xs text-blue-600">toplam</div>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-sm text-purple-600">Şut</span>
                      </div>
                      <div className="font-bold text-purple-800 text-lg">{match.shots || 0}</div>
                      <div className="text-xs text-purple-600">toplam</div>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-600">Takım</span>
                      </div>
                      <div className="font-bold text-orange-800 text-lg">{match.teamPoints || 0}</div>
                      <div className="text-xs text-orange-600">puan</div>
                    </div>
                  </div>

                  {/* Maç Skoru */}
                  {match.score && (
                    <div className="mt-4 bg-white/70 rounded-lg p-3 text-center">
                      <span className="text-sm text-green-600 font-medium">Maç Skoru:</span>
                      <span className="ml-2 font-bold text-green-800 text-lg">{match.score}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Henüz maç kaydı yok</h3>
              <p className="text-green-600 mb-6">İlk maçınızı kaydetmek için aşağıdaki butona tıklayın</p>
              <Link 
                href="/matches/new" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Yeni Maç Ekle
              </Link>
            </div>
          )}
        </div>


      </div>
    </div>
  );
} 