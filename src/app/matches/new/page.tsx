// src/app/matches/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

export default function NewMatchPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [distance, setDistance] = useState('');
  const [passes, setPasses] = useState('');
  const [passesFail, setPassesFail] = useState('');
  const [shots, setShots] = useState('');
  const [shotsFail, setShotsFail] = useState('');
  const [assists, setAssists] = useState('');
  const [goals, setGoals] = useState('');
  const [points, setPoints] = useState('');
  const [teamPasses, setTeamPasses] = useState('');
  const [teamPassRate, setTeamPassRate] = useState('');
  const [possession, setPossession] = useState('');
  const [teamPoints, setTeamPoints] = useState('');
  const [score, setScore] = useState('');
  const [calculatedRating, setCalculatedRating] = useState(6.0);

  // Puan hesaplama fonksiyonu
  const calculateRating = (matchData: any) => {
    let rating = 6.0; // Başlangıç puanı

    // Pozitif katkılar
    rating += (matchData.passes || 0) * 0.03; // Başarılı pas
    rating += (matchData.shots || 0) * 0.1; // Başarılı şut
    rating += (matchData.assists || 0) * 0.4; // Asist
    rating += (matchData.goals || 0) * 0.7; // Gol
    rating += (matchData.distance || 0) * 0.1; // Koşu mesafesi (km başına)

    // Negatif katkılar
    rating -= (matchData.passesFail || 0) * 0.02; // Başarısız pas
    rating -= (matchData.shotsFail || 0) * 0.05; // Başarısız şut

    // Sınırlamalar
    rating = Math.max(3.0, Math.min(10.0, rating));

    return Math.round(rating * 10) / 10; // 1 ondalık basamağa yuvarla
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      // Hesaplanan puanı al
      const calculatedRating = calculateRating({
        distance: Number(distance) / 1000, // m'yi km'ye çevir
        passes: Number(passes),
        passesFail: Number(passesFail),
        shots: Number(shots),
        shotsFail: Number(shotsFail),
        assists: Number(assists),
        goals: Number(goals)
      });

      const data = {
        distance: Number(distance),
        passes: Number(passes),
        passesFail: Number(passesFail),
        shots: Number(shots),
        shotsFail: Number(shotsFail),
        assists: Number(assists),
        goals: Number(goals),
        rating: calculatedRating, // Hesaplanan puanı ekle
        points: Number(points),
        teamPasses: Number(teamPasses),
        teamPassRate: Number(teamPassRate),
        possession: Number(possession),
        teamPoints: Number(teamPoints),
        score,
        createdAt: serverTimestamp(),
      };
      
      // Ana koleksiyona ekle
      const docRef = await addDoc(collection(db, 'users', user.uid, 'matches'), data);
      
      // Eğer veri paylaşımı açıksa, public koleksiyona da ekle
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.dataSharingEnabled) {
        await addDoc(collection(db, 'publicMatches'), {
          userId: user.uid,
          matchId: docRef.id,
          ...data,
          createdAt: new Date()
        });
      }
      
      toast.success('Maç kaydı başarıyla eklendi!');
      router.push('/matches');
    } catch (err) {
      console.error('Match save error:', err);
      toast.error('Maç kaydı eklenirken hata oluştu');
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto p-8">
        <h2 className="text-2xl font-semibold mb-4">Yeni Maç Kaydı</h2>
        
        {/* Puan Önizlemesi */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Hesaplanan Puan</h3>
              <p className="text-sm text-blue-600">İstatistiklere göre otomatik hesaplanır</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {calculateRating({
                  distance: Number(distance) / 1000, // m'yi km'ye çevir
                  passes: Number(passes),
                  passesFail: Number(passesFail),
                  shots: Number(shots),
                  shotsFail: Number(shotsFail),
                  assists: Number(assists),
                  goals: Number(goals)
                })}
              </div>
              <div className="text-sm text-blue-500">/ 10.0</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="number" 
              value={distance} 
              onChange={e => setDistance(e.target.value)} 
              placeholder="Koşulan Mesafe (m)" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={passes} 
              onChange={e => setPasses(e.target.value)} 
              placeholder="Başarılı Pas Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={passesFail} 
              onChange={e => setPassesFail(e.target.value)} 
              placeholder="Başarısız Pas Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={shots} 
              onChange={e => setShots(e.target.value)} 
              placeholder="Başarılı Şut Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={shotsFail} 
              onChange={e => setShotsFail(e.target.value)} 
              placeholder="Başarısız Şut Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={assists} 
              onChange={e => setAssists(e.target.value)} 
              placeholder="Asist Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <input 
              type="number" 
              value={goals} 
              onChange={e => setGoals(e.target.value)} 
              placeholder="Gol Sayısı" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Takım İstatistikleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="number" 
                value={teamPasses} 
                onChange={e => setTeamPasses(e.target.value)} 
                placeholder="Takımın Toplam Pası" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="number" 
                value={teamPassRate} 
                onChange={e => setTeamPassRate(e.target.value)} 
                placeholder="Takım Pas Başarı %" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="number" 
                value={possession} 
                onChange={e => setPossession(e.target.value)} 
                placeholder="Topla Oynama %" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <input 
                type="number" 
                value={teamPoints} 
                onChange={e => setTeamPoints(e.target.value)} 
                placeholder="Takım Ortalama Puan" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>

          <input 
            type="text" 
            value={score} 
            onChange={e => setScore(e.target.value)} 
            placeholder="Maç Skoru (örn: 2-1)" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            Maç Kaydını Kaydet
          </button>
        </form>
      </div>
    </ProtectedRoute>
  );
} 