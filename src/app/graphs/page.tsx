'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, BarChart3, Target, Zap, Award, Activity, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GraphsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const matchesRef = collection(db, 'users', user.uid, 'matches');
        const q = query(matchesRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        const arr = snapshot.docs.map((doc, idx) => {
          const d: any = doc.data();
          const passRate = d.passes && d.passesFail ? (d.passes / (d.passes + d.passesFail)) * 100 : 0;
          const shotRate = d.shots && d.shotsFail ? (d.shots / (d.shots + d.shotsFail)) * 100 : 0;
          return { name: `M${idx + 1}`, passRate, shotRate, points: d.points, distance: d.distance };
        });
        setData(arr);
      } catch (err) {
        console.error('Graphs fetch error:', err);
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
            <h1 className="text-4xl font-bold text-green-800 mb-2">Gelişim Grafikleri</h1>
            <p className="text-green-600 text-lg">Performansınızın zaman içindeki değişimini analiz edin</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-green-600 text-lg">Yükleniyor...</p>
            </div>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pas Başarı Oranı */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Pas Başarı Oranı</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#14532d'
                      }} 
                    />
                    <Bar dataKey="passRate" fill="#ffffff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Şut Başarı Oranı */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Şut Başarı Oranı</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#1e40af'
                      }} 
                    />
                    <Bar dataKey="shotRate" fill="#ffffff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ortalama Puan */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Ortalama Puan</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <XAxis dataKey="name" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#7c3aed'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#ffffff" 
                      strokeWidth={4}
                      dot={{ fill: '#ffffff', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Koşu Mesafesi */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">Koşu Mesafesi</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <XAxis dataKey="name" stroke="#ffffff" />
                    <YAxis stroke="#ffffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        border: 'none', 
                        borderRadius: '12px',
                        color: '#ea580c'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="distance" 
                      stroke="#ffffff" 
                      strokeWidth={4}
                      dot={{ fill: '#ffffff', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">Henüz Veri Yok</h3>
                <p className="text-green-600">Grafikleri görüntülemek için önce maç verilerinizi ekleyin</p>
              </div>
            </div>
          )}

          {/* İstatistik Özeti */}
          {data.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200">
              <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                Performans Özeti
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">
                    {data.length}
                  </div>
                  <div className="text-sm text-green-600">Toplam Maç</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {Math.round(data.reduce((sum, d) => sum + d.passRate, 0) / data.length)}%
                  </div>
                  <div className="text-sm text-blue-600">Ortalama Pas Başarı</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-800">
                    {Math.round(data.reduce((sum, d) => sum + d.shotRate, 0) / data.length)}%
                  </div>
                  <div className="text-sm text-purple-600">Ortalama Şut Başarı</div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-800">
                    {Math.round(data.reduce((sum, d) => sum + (d.points || 0), 0) / data.length)}
                  </div>
                  <div className="text-sm text-orange-600">Ortalama Puan</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 