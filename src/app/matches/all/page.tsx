'use client';

import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { BarChart3, Calendar, Target, Zap, Award, TrendingUp, ArrowLeft, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
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
  teamPoints: number;
  score: string;
  createdAt: any;
}

export default function AllMatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const matchesPerPage = 10;

  useEffect(() => {
    if (!user) return;
    fetchMatches();
  }, [user]);

  const fetchMatches = async (isLoadMore = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const matchesRef = collection(db, 'users', user.uid, 'matches');
      let q = query(
        matchesRef,
        orderBy('createdAt', 'desc'),
        limit(matchesPerPage)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          matchesRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(matchesPerPage)
        );
      }

      const querySnapshot = await getDocs(q);
      const matchesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Match[];

      if (isLoadMore) {
        setMatches(prev => [...prev, ...matchesData]);
      } else {
        setMatches(matchesData);
      }

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === matchesPerPage);
      
      if (isLoadMore) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Maçları getirme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMatches(true);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/matches"
              className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-green-600" />
            </Link>
            <h1 className="text-4xl font-bold text-green-800 flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Tüm Maçlar
            </h1>
          </div>
          <p className="text-green-600 text-lg">Tüm maç performanslarınızın detaylı listesi</p>
        </div>

        {/* Maçlar Listesi */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-green-800 flex items-center gap-3">
              <Calendar className="w-6 h-6" />
              Maç Geçmişi ({matches.length} maç)
            </h2>
          </div>

          {loading && matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-green-800">Maçlar yükleniyor...</p>
            </div>
          ) : matches.length > 0 ? (
            <>
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
                          {match.points || 0} Puan
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

              {/* Daha Fazla Yükle Butonu */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        Daha Fazla Maç Yükle
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Sayfa Bilgisi */}
              <div className="text-center mt-6 text-green-600">
                <p>Sayfa {currentPage} • Toplam {matches.length} maç yüklendi</p>
                {!hasMore && matches.length > 0 && (
                  <p className="text-sm mt-2">Tüm maçlar yüklendi</p>
                )}
              </div>
            </>
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