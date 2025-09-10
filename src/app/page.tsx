'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Trophy, Users, TrendingUp, Target, Zap, Award, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
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

  const [lastMatch, setLastMatch] = useState<{
    distance: number;
    passes: number;
    passesFail: number;
    shots: number;
    shotsFail: number;
    points: number;
    assists: number;
    goals: number;
    teamPasses: number;
    teamPassRate: number;
    possession: number;
    teamPoints: number;
    score: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      try {
        // Fetch user profile and matches in parallel
        const [userSnap, matchesSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDocs(collection(db, 'users', user.uid, 'matches'))
        ]);

        const userData = userSnap.data() || {};
        const docs: any[] = matchesSnap.docs.map(d => ({ id: d.id, ...(d.data()) }));
        
        setMatches(docs);
        setProfile(userData);
        


        // Calculate stats
        const totalMatches = docs.length;
        let totalPasses = 0, totalFails = 0, totalShots = 0, totalShotFails = 0, totalDistance = 0, totalPoints = 0;
        let bestMatch = { id: '', points: -Infinity };
        let lastMatch: any = docs[0] || null;

        docs.forEach(d => {
          totalDistance += d.distance ?? 0;
          totalPasses += d.passes ?? 0;
          totalFails += d.passesFail ?? 0;
          totalShots += d.shots ?? 0;
          totalShotFails += d.shotsFail ?? 0;
          totalPoints += d.points ?? 0;
          if (d.points && d.points > bestMatch.points) bestMatch = { id: d.id, points: d.points };
        });
        const avgPoints = totalMatches ? totalPoints / totalMatches : 0;

        setStats({ totalMatches, totalPasses, totalFails, totalShots, totalShotFails, totalDistance, avgPoints: avgPoints.toFixed(1), bestMatch, lastMatch });

        // Fetch last match for existing functionality
        if (docs.length > 0) {
          const data = docs[0];
          setLastMatch({
            distance: data.distance ?? 0,
            passes: data.passes ?? 0,
            passesFail: data.passesFail ?? 0,
            shots: data.shots ?? 0,
            shotsFail: data.shotsFail ?? 0,
            points: data.points ?? 0,
            assists: data.assists ?? 0,
            goals: data.goals ?? 0,
            teamPasses: data.teamPasses ?? 0,
            teamPassRate: data.teamPassRate ?? 0,
            possession: data.possession ?? 0,
            teamPoints: data.teamPoints ?? 0,
            score: data.score ?? '',
          });
        }
      } catch (err) {
        console.error('Fetch data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    

  }, [user]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto space-y-8">


          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-green-600 text-lg">Yükleniyor...</p>
            </div>
          ) : (
            <>
              {/* Son Maç Özeti - En Üstte */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer" onClick={() => lastMatch && router.push(`/matches/${matches[0]?.id}`)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold">Son Maç Özeti</h3>
                    <div className="px-4 py-2 rounded-xl font-bold text-2xl bg-white/30 text-white border-2 border-white/50 shadow-lg">
                      {lastMatch?.score ?? '--'}
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl font-bold text-lg bg-blue-500 text-white">
                    {lastMatch ? `${calculateRating(lastMatch)}` : '--'}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Gol
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.goals ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Asist
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.assists ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Toplam Şut
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.shots ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Başarılı Şut
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.shots ? lastMatch.shots - (lastMatch.shotsFail || 0) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Toplam Pas
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.passes ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Başarılı Pas
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.passes ? lastMatch.passes - (lastMatch.passesFail || 0) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Pas Oranı
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.passes && lastMatch?.passesFail ? `${Math.round(((lastMatch.passes - lastMatch.passesFail) / lastMatch.passes) * 100)}%` : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Koşu Mesafesi
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.distance ?? '--'} km</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Takım Pasları
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.teamPasses ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Topla Oynama
                    </span>
                    <span className="font-bold text-lg">{lastMatch?.possession ? `${lastMatch.possession}%` : '--'}</span>
                  </div>

                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Genel İstatistikler */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer" onClick={() => router.push('/graphs')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Genel İstatistikler</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Toplam Maç</span>
                    <span className="font-bold">{stats?.totalMatches || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Başarılı Pas</span>
                    <span className="font-bold">{stats?.totalPasses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Başarılı Şut</span>
                    <span className="font-bold">{stats?.totalShots || 0}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/20 rounded-xl p-3 border-2 border-white/30">
                    <span className="font-semibold">Ortalama Performans</span>
                    <span className="font-bold text-xl">
                      {matches.length > 0 ? 
                        (matches.reduce((sum, m) => sum + (m.rating || calculateRating(m)), 0) / matches.length).toFixed(1) 
                        : '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Takım İstatistiği */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer" onClick={() => lastMatch && router.push(`/matches/${matches[0]?.id}`)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Takım İstatistiği</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Takım Pas</span>
                    <span className="font-bold">{lastMatch?.teamPasses ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Pas Başarı %</span>
                    <span className="font-bold">{lastMatch?.teamPassRate ?? '--'}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Topla Oynama %</span>
                    <span className="font-bold">{lastMatch?.possession ?? '--'}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                    <span>Ortalama Puan</span>
                    <span className="font-bold">{lastMatch?.teamPoints ?? '--'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/20 rounded-xl p-3 border-2 border-white/30">
                    <span className="font-semibold">Maç Skoru</span>
                    <span className="font-bold text-xl">{lastMatch?.score ?? '--'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Son 5 Maç */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                Son 5 Maç
              </h3>
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.slice(0, 5).map((m, index) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-800">Maç {index + 1}</h4>
                          <p className="text-sm text-green-600">
                            {m.rating || calculateRating(m)} puan
                          </p>
                          <p className="text-xs text-green-500">{m.date || 'Tarih yok'}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center bg-white/50 rounded-lg p-2">
                          <div className="font-bold text-green-700">{m.distance || 0}</div>
                          <div className="text-green-600">km</div>
                        </div>
                        <div className="text-center bg-white/50 rounded-lg p-2">
                          <div className="font-bold text-green-700">{m.passes || 0}</div>
                          <div className="text-green-600">pas</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Henüz maç kaydı bulunmuyor</p>
              )}
            </div>


          </>
          )}


        </div>
      </div>
    </ProtectedRoute>
  );
}
