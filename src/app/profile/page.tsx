'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, collection, getDocs, query, orderBy, where, updateDoc, deleteDoc, addDoc, limit } from 'firebase/firestore';
import { User, Search, UserPlus, Check, X, Users, UserCheck, Clock, ArrowRight, Target, Zap, Award, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Define match document types
interface MatchData {
  distance?: number;
  passes?: number;
  passesFail?: number;
  shots?: number;
  shotsFail?: number;
  points?: number;
}
interface MatchDoc extends MatchData {
  id: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  
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

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  
  // Arkadaşlar için state'ler
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFriendsPerformance, setShowFriendsPerformance] = useState(false);
  const [friendsPerformance, setFriendsPerformance] = useState<any[]>([]);
  const [friendsPerformanceLoading, setFriendsPerformanceLoading] = useState(false);
  
  // Profil tamamlama modal'ı için state'ler
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    position: '',
    footPreference: ''
  });
  
  // Veri paylaşım ayarı için state
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  
  // Maç detay modal'ı için state'ler
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showMatchDetail, setShowMatchDetail] = useState(false);

  // Component mount olduğunda setMounted(true) yap
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user || !mounted) return;
    
    setLoading(true);
    setError(null);
    
    const fetchProfile = async () => {
      try {
        // Check if we're online first
        const testDoc = doc(db, 'users', 'connection-test');
        await getDoc(testDoc);
        
        // Fetch user profile and matches in parallel
        const [userSnap, matchesSnap] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDocs(collection(db, 'users', user.uid, 'matches'))
        ]);

        const userData = userSnap.data() || {};
        const docs: any[] = matchesSnap.docs.map(d => ({ id: d.id, ...(d.data()) }));
        
        setMatches(docs);
        
        // Prepare graph data
        const arr = docs.map((d, idx) => {
          const passRate = d.passes && d.passesFail ? (d.passes/(d.passes+d.passesFail))*100 : 0;
          const shotRate = d.shots && d.shotsFail ? (d.shots/(d.shots+d.shotsFail))*100 : 0;
          return { name: `M${idx+1}`, passRate, shotRate, points: d.points, distance: d.distance };
        });
        setGraphData(arr);

        // Calculate stats
        const totalMatches = docs.length;
        let totalPasses = 0, totalFails = 0, totalShots = 0, totalShotFails = 0, totalDistance = 0, totalPoints = 0;
        let bestMatch = { id: '', points: -Infinity };
        let lastMatch: MatchDoc | null = docs[0] || null;

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

        setProfile(userData);
        setStats({ totalMatches, totalPasses, totalFails, totalShots, totalShotFails, totalDistance, avgPoints: avgPoints.toFixed(1), bestMatch, lastMatch });
        setDataSharingEnabled(userData.dataSharingEnabled || false);
        
        // Profil tamamlanma kontrolü - yaş artık zorunlu olduğu için sadece pozisyon ve ayak tercihini kontrol et
        if (!userData.profileCompleted || !userData.position || !userData.footPreference) {
          setShowProfileModal(true);
          // Mevcut bilgileri form'a yükle
          setProfileForm({
            position: userData.position || '',
            footPreference: userData.footPreference || ''
          });
        }
        
        // Veri paylaşımı açıksa arkadaş verilerini senkronize et
        if (userData.dataSharingEnabled) {
          setTimeout(() => syncFriendsData(), 2000); // 2 saniye sonra çalıştır
        }
      } catch (err: any) {
        console.error('Profile fetch error:', err);
        if (err.code === 'failed-precondition' || err.message?.includes('offline') || err.code === 'unavailable') {
          setError('İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin ve sayfayı yenileyin.');
        } else {
          setError('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Add retry mechanism
    const retryFetch = () => {
      fetchProfile().catch(() => {
        // If first attempt fails, wait 2 seconds and try again
        setTimeout(() => {
          fetchProfile().catch(() => {
            setError('Bağlantı sorunu devam ediyor. Lütfen internet bağlantınızı kontrol edin.');
            setLoading(false);
          });
        }, 2000);
      });
    };
    
    retryFetch();
    
    // Arkadaşlar verilerini getir
    fetchRequests();
  }, [user, mounted]);

  const fetchRequests = async () => {
    if (!user || !mounted) return;
    try {
      const incSnap = await getDocs(query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'pending')));
      const outSnap = await getDocs(query(collection(db, 'friendRequests'), where('from', '==', user.uid), where('status', '==', 'pending')));
      const accFrom = await getDocs(query(collection(db, 'friendRequests'), where('from', '==', user.uid), where('status', '==', 'accepted')));
      const accTo = await getDocs(query(collection(db, 'friendRequests'), where('to', '==', user.uid), where('status', '==', 'accepted')));

      // Map incoming and outgoing requests to typed objects with user names
      const incRequests = await Promise.all(
        incSnap.docs.map(async d => {
          const data = d.data();
          const fromName = await getUserName(data.from);
          return { id: d.id, ...data, fromName };
        })
      );
      const outRequests = await Promise.all(
        outSnap.docs.map(async d => {
          const data = d.data();
          const toName = await getUserName(data.to);
          return { id: d.id, ...data, toName };
        })
      );
      setIncoming(incRequests);
      setOutgoing(outRequests);

      // Combine accepted requests and map to typed objects
      const acceptedRequests = [...accFrom.docs, ...accTo.docs].map(d => {
        const data = d.data() as any;
        return { id: d.id, ...data };
      });
      
      // friends array: collect other user IDs
      const friendIds = Array.from(new Set(acceptedRequests.map(r => r.from === user.uid ? r.to : r.from)));
      const friendData = await Promise.all(
        friendIds.map(async uid => {
          const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
          const uDoc = uSnap.docs[0];
          const userData = uDoc.data();
          return { 
            uid, 
            ...userData,
            profilePhoto: userData.profilePhoto || userData.photoURL
          };
        })
      );
      setFriends(friendData);
    } catch (err) {
      console.error('Fetch friends error:', err);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) {
      toast.error('Lütfen arama terimi girin');
      return;
    }
    
    setSearching(true);
    try {
      // Tüm kullanıcıları getir
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(d => {
        const userData = d.data();
        return { 
          uid: d.id, 
          ...userData,
          profilePhoto: userData.profilePhoto || userData.photoURL
        };
      });
      
      // Sadece mevcut kullanıcıyı hariç tut
      const availableUsers = allUsers.filter(u => u.uid !== user.uid);
      
      // Arama terimini temizle ve böl
      const cleanQuery = searchQuery.trim().toLowerCase();
      const searchTerms = cleanQuery.split(/\s+/).filter(term => term.length > 0);
      
              const filteredUsers = availableUsers.filter(u => {
          const userData = u as any;
          const firstName = (userData.firstName || '').toLowerCase();
          const lastName = (userData.lastName || '').toLowerCase();
          const username = (userData.username || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();
          const email = (userData.email || '').toLowerCase();
        
        // Eğer tek kelime varsa, daha esnek arama yap
        if (searchTerms.length === 1) {
          const term = searchTerms[0];
          return firstName.includes(term) || 
                 lastName.includes(term) || 
                 username.includes(term) ||
                 fullName.includes(term) || 
                 email.includes(term);
        }
        
        // Birden fazla kelime varsa, her kelimeyi kontrol et
        return searchTerms.every(term => {
          return firstName.includes(term) || 
                 lastName.includes(term) || 
                 username.includes(term) ||
                 fullName.includes(term) || 
                 email.includes(term);
        });
      });
      
      // Her kullanıcı için arkadaşlık durumunu kontrol et
      const usersWithStatus = await Promise.all(
        filteredUsers.map(async (userData) => {
          // Zaten arkadaş mı kontrol et
          const isFriend = friends.find(f => f.uid === userData.uid);
          
          // Bekleyen istek var mı kontrol et
          const pendingRequest = outgoing.find(req => req.to === userData.uid);
          
          return {
            ...userData,
            isFriend: !!isFriend,
            hasPendingRequest: !!pendingRequest
          };
        })
      );
      
      setSearchResults(usersWithStatus);
      setHasSearched(true);
      
      if (usersWithStatus.length === 0) {
        toast.warning('Arama kriterlerine uygun kullanıcı bulunamadı');
      }
    } catch (err) {
      console.error('Search users error:', err);
      toast.error('Arama sırasında hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    searchUsers();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers();
    }
  };

  const sendFriendRequest = async (toUserId: string) => {
    if (!user) return;
    
    try {
      // Önce mevcut istekleri kontrol et
      const existingRequest = await getDocs(
        query(
          collection(db, 'friendRequests'), 
          where('from', '==', user.uid), 
          where('to', '==', toUserId)
        )
      );
      
      if (!existingRequest.empty) {
        toast.error('Bu kullanıcıya zaten arkadaşlık isteği gönderilmiş!');
        return;
      }
      
      // Zaten arkadaş mı kontrol et
      const isAlreadyFriend = friends.find(f => f.uid === toUserId);
      if (isAlreadyFriend) {
        toast.error('Bu kullanıcı zaten arkadaşınız!');
        return;
      }
      
      await addDoc(collection(db, 'friendRequests'), {
        from: user.uid,
        to: toUserId,
        status: 'pending',
        createdAt: new Date()
      });
      
      toast.success('Arkadaşlık isteği gönderildi!');
      
      // Arama sonuçlarını güncelle - bu kullanıcıyı "İstek Gönderildi" olarak işaretle
      setSearchResults(prev => prev.map(u => 
        u.uid === toUserId ? { ...u, hasPendingRequest: true } : u
      ));
      
      // Gönderilen istekleri yenile
      fetchRequests();
    } catch (err) {
      console.error('Send friend request error:', err);
      toast.error('Arkadaşlık isteği gönderilirken hata oluştu');
    }
  };

  const handleAccept = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', reqId), { status: 'accepted' });
      fetchRequests();
      toast.success('Arkadaşlık isteği kabul edildi!');
    } catch (err) {
      toast.error('İstek kabul edilirken hata oluştu');
    }
  };
  
  const handleReject = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'friendRequests', reqId), { status: 'rejected' });
      fetchRequests();
      toast.success('Arkadaşlık isteği reddedildi');
    } catch (err) {
      toast.error('İstek reddedilirken hata oluştu');
    }
  };
  
  const handleCancel = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', reqId));
      fetchRequests();
      toast.success('Arkadaşlık isteği iptal edildi');
    } catch (err) {
      toast.error('İstek iptal edilirken hata oluştu');
    }
  };

  const getUserName = async (uid: string) => {
    try {
      const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
      const userDoc = userSnap.docs[0];
      if (userDoc) {
        const userData = userDoc.data();
        return `${userData.firstName} ${userData.lastName}`;
      }
      return uid;
    } catch (err) {
      return uid;
    }
  };

  const fetchFriendsPerformance = async () => {
    if (!user || friends.length === 0) return;
    
    setFriendsPerformanceLoading(true);
    try {
      const performanceData = await Promise.all(
        friends.map(async (friend) => {
          try {
            // Önce arkadaşın veri paylaşım ayarını kontrol et
            const friendDoc = await getDoc(doc(db, 'users', friend.uid));
            const friendData = friendDoc.data();
            
            // Veri paylaşımı kapalıysa, public koleksiyonda veri olup olmadığını kontrol et
            if (!friendData?.dataSharingEnabled) {
              try {
                const publicMatchesQuery = query(
                  collection(db, 'publicMatches'),
                  where('userId', '==', friend.uid)
                );
                const publicMatchesSnap = await getDocs(publicMatchesQuery);
                
                // Client-side'da sırala ve ilkini al
                const sortedDocs = publicMatchesSnap.docs.sort((a, b) => {
                  const aDate = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt) || new Date(0);
                  const bDate = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt) || new Date(0);
                  return bDate.getTime() - aDate.getTime();
                });
                
                if (sortedDocs.length > 0) {
                  // Public koleksiyonda veri varsa göster (eski veriler)
                  const lastMatch = sortedDocs[0].data();
                  return {
                    ...friend,
                    lastMatch: lastMatch ? { points: lastMatch.points ?? 0 } : null,
                    hasAccess: true,
                    note: 'Eski veriler'
                  };
                } else {
                  return {
                    ...friend,
                    lastMatch: null,
                    hasAccess: false,
                    error: 'Arkadaş veri paylaşımını kapalı tutuyor',
                    details: `${friend.firstName} ${friend.lastName} arkadaşının veri paylaşımı kapalı`
                  };
                }
              } catch (err) {
                return {
                  ...friend,
                  lastMatch: null,
                  hasAccess: false,
                  error: 'Arkadaş veri paylaşımını kapalı tutuyor',
                  details: `${friend.firstName} ${friend.lastName} arkadaşının veri paylaşımı kapalı`
                };
              }
            }
            
            // Önce public koleksiyondan dene
            let lastMatch = null;
            try {
              const publicMatchesQuery = query(
                collection(db, 'publicMatches'),
                where('userId', '==', friend.uid)
              );
              const publicMatchesSnap = await getDocs(publicMatchesQuery);
              
              // Client-side'da sırala ve ilkini al
              const sortedDocs = publicMatchesSnap.docs.sort((a, b) => {
                const aDate = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt) || new Date(0);
                const bDate = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt) || new Date(0);
                return bDate.getTime() - aDate.getTime();
              });
              lastMatch = sortedDocs.length > 0 ? sortedDocs[0].data() : null;
            } catch (err) {
              console.warn('Public koleksiyondan veri çekilemedi, direkt koleksiyondan deneniyor:', err);
              
              // Public koleksiyondan çekilemezse, direkt kullanıcı koleksiyonundan dene
              try {
                const matchesQuery = query(
                  collection(db, 'users', friend.uid, 'matches'), 
                  orderBy('createdAt', 'desc'), 
                  limit(1)
                );
                const matchesSnap = await getDocs(matchesQuery);
                lastMatch = matchesSnap.docs.length > 0 ? matchesSnap.docs[0].data() : null;
              } catch (directErr) {
                console.error('Direkt koleksiyondan da veri çekilemedi:', directErr);
              }
            }
            
            return {
              ...friend,
              lastMatch: lastMatch ? { points: lastMatch.points ?? 0 } : null,
              hasAccess: true
            };
          } catch (err: any) {
            // Eğer izin hatası varsa, sadece temel bilgileri döndür
            console.warn(`Arkadaş ${friend.uid} verilerine erişim yok:`, err.message);
            return {
              ...friend,
              lastMatch: null,
              hasAccess: false,
              error: 'Veri erişimi yok'
            };
          }
        })
      );
      setFriendsPerformance(performanceData);
    } catch (err) {
      console.error('Fetch friends performance error:', err);
    } finally {
      setFriendsPerformanceLoading(false);
    }
  };

  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [showFriendDetail, setShowFriendDetail] = useState(false);

  const handleFriendsCardClick = () => {
    setShowFriendsPerformance(true);
    fetchFriendsPerformance();
  };

  const handleFriendClick = async (friend: any) => {
    setSelectedFriend(friend);
    setShowFriendDetail(true);
    
    try {
      // Önce arkadaşın veri paylaşım ayarını kontrol et
      const friendDoc = await getDoc(doc(db, 'users', friend.uid));
      const friendData = friendDoc.data();
      
      if (!friendData?.dataSharingEnabled) {
        setSelectedFriend({
          ...friend,
          matches: [],
          hasAccess: false,
          error: 'Arkadaş veri paylaşımını kapalı tutuyor',
          details: `${friend.firstName} ${friend.lastName} arkadaşının profil sayfasından "Veri Paylaşımı" ayarını açması gerekiyor.`
        });
        return;
      }
      
      // Sadece publicMatches koleksiyonundan oku (index olmadan)
      const publicMatchesQuery = query(
        collection(db, 'publicMatches'),
        where('userId', '==', friend.uid)
      );
      const publicMatchesSnap = await getDocs(publicMatchesQuery);
      
      // Client-side'da sırala
      const sortedDocs = publicMatchesSnap.docs.sort((a, b) => {
        const aDate = a.data().createdAt?.toDate?.() || new Date(a.data().createdAt) || new Date(0);
        const bDate = b.data().createdAt?.toDate?.() || new Date(b.data().createdAt) || new Date(0);
        return bDate.getTime() - aDate.getTime();
      }).slice(0, 5);
      
      if (sortedDocs.length > 0) {
        const matches = sortedDocs.map(d => ({ 
          id: d.data().matchId, 
          ...d.data() 
        }));
        
        setSelectedFriend({
          ...friend,
          matches,
          hasAccess: true
        });
      } else {
        setSelectedFriend({
          ...friend,
          matches: [],
          hasAccess: true // Veri paylaşımı açık ama veri yok
        });
      }
    } catch (err) {
      console.error('Friend data fetch error:', err);
      setSelectedFriend({
        ...friend,
        matches: [],
        hasAccess: false,
        error: 'Veri erişimi yok',
        details: 'Firebase hatası: ' + (err as any).message
      });
    }
  };

  const handleProfileComplete = async () => {
    if (!user || !profileForm.position || !profileForm.footPreference) {
      toast.error('Pozisyon ve ayak tercihi zorunludur!');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        position: profileForm.position,
        footPreference: profileForm.footPreference,
        profileCompleted: true
      });

      // Profil state'ini güncelle
      setProfile((prev: any) => ({
        ...prev,
        position: profileForm.position,
        footPreference: profileForm.footPreference,
        profileCompleted: true
      }));

      setShowProfileModal(false);
      toast.success('Profil bilgileri başarıyla güncellendi!');
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Profil güncellenirken hata oluştu');
    }
  };

    // Arkadaşların verilerini public koleksiyona kopyala
  const syncFriendsData = async () => {
    if (!user || friends.length === 0) return;
    
    try {
      for (const friend of friends) {
        // Arkadaşın veri paylaşımı açık mı kontrol et
        const friendDoc = await getDoc(doc(db, 'users', friend.uid));
        const friendData = friendDoc.data();
        
        if (friendData?.dataSharingEnabled) {
          console.log(`${friend.firstName} ${friend.lastName} veri paylaşımı açık`);
          // Arkadaşın verilerini kopyalamaya çalışma - izin hatası alırız
          // Bunun yerine sadece log yazdır
        } else {
          console.log(`${friend.firstName} ${friend.lastName} veri paylaşımı kapalı`);
        }
      }
    } catch (err) {
      console.warn('Arkadaş verilerini kontrol etme hatası:', err);
    }
  };

  const handleDataSharingToggle = async () => {
    if (!user) return;
    
    try {
      const newValue = !dataSharingEnabled;
      
      // Ana kullanıcı dokümanını güncelle
      await updateDoc(doc(db, 'users', user.uid), {
        dataSharingEnabled: newValue
      });
      
      // Eğer veri paylaşımı açılıyorsa, public koleksiyona kopyala
      if (newValue) {
        try {
          // Önce mevcut public verileri temizle
          const existingPublicSnap = await getDocs(
            query(collection(db, 'publicMatches'), where('userId', '==', user.uid))
          );
          const deletePromises = existingPublicSnap.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          
          // Tüm maç verilerini public koleksiyona kopyala
          const matchesSnap = await getDocs(collection(db, 'users', user.uid, 'matches'));
          const copyPromises = matchesSnap.docs.map(doc => {
            const data = doc.data();
            return addDoc(collection(db, 'publicMatches'), {
              userId: user.uid,
              matchId: doc.id,
              ...data,
              createdAt: new Date()
            });
          });
          await Promise.all(copyPromises);
          console.log('Maç verileri public koleksiyona kopyalandı');
          
          // Arkadaşların verilerini de kopyala
          await syncFriendsData();
        } catch (err) {
          console.warn('Public koleksiyona kopyalama hatası:', err);
          // Kopyalama hatası olsa bile devam et
        }
      } else {
        // Veri paylaşımı kapatılıyorsa, sadece ana ayarı güncelle
        // Public koleksiyondan silme işlemini atla - güvenlik kuralları engelleyebilir
        console.log('Veri paylaşımı kapatıldı - public koleksiyon temizlenmedi');
        
        // Test için: Veri paylaşımı kapatıldığında da public koleksiyona kopyala
        try {
          const matchesSnap = await getDocs(collection(db, 'users', user.uid, 'matches'));
          const copyPromises = matchesSnap.docs.map(doc => {
            const data = doc.data();
            return addDoc(collection(db, 'publicMatches'), {
              userId: user.uid,
              matchId: doc.id,
              ...data,
              createdAt: new Date()
            });
          });
          await Promise.all(copyPromises);
          console.log('Test: Maç verileri public koleksiyona kopyalandı');
        } catch (err) {
          console.warn('Test kopyalama hatası:', err);
        }
      }
      
      setDataSharingEnabled(newValue);
      setProfile((prev: any) => ({
        ...prev,
        dataSharingEnabled: newValue
      }));
      
      toast.success(newValue ? 'Veri paylaşımı açıldı' : 'Veri paylaşımı kapatıldı');
    } catch (err) {
      console.error('Data sharing toggle error:', err);
      toast.error('Ayar güncellenirken hata oluştu');
    }
  };

  // Hydration hatası için mounted kontrolü
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Hata</h3>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-800 mb-4">Profil</h1>
            <div className="mt-4">
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                <User className="w-5 h-5" />
                Profilini Düzenle
              </Link>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Kişisel Bilgiler */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                {profile?.profilePhoto || profile?.photoURL ? (
                  <img
                    src={profile.profilePhoto || profile.photoURL}
                    alt="Profil fotoğrafı"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <h3 className="text-2xl font-bold">Kişisel Bilgiler</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                  <span>Ad Soyad</span>
                  <span className="font-bold">{profile?.firstName || '--'} {profile?.lastName || '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                  <span>Kullanıcı Adı</span>
                  <span className="font-bold">@{profile?.username || '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                  <span>Yaş</span>
                  <span className="font-bold">
                    {profile?.birthDate ? (() => {
                      const birthDate = new Date(profile.birthDate);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      return age;
                    })() : '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                  <span>Ayak Tercihi</span>
                  <span className="font-bold">{profile?.footPreference || '--'}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-xl p-3">
                  <span>Pozisyon</span>
                  <span className="font-bold">{profile?.position || '--'}</span>
                </div>
              </div>
            </div>

            {/* Arkadaşlar Listesi */}
            <div 
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform cursor-pointer"
              onClick={handleFriendsCardClick}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5" />
                <h3 className="text-xl font-bold">Arkadaşlarım</h3>
                <span className="bg-white/20 text-white text-sm font-medium px-2 py-1 rounded-full">
                  {friends.length}
                </span>
              </div>
              {friends.length === 0 ? (
                <p className="text-center py-4 text-white/70">Henüz arkadaşınız yok</p>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div key={friend.uid} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                      {friend.profilePhoto ? (
                        <img
                          src={friend.profilePhoto}
                          alt="Profil fotoğrafı"
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {friend.firstName} {friend.lastName}
                        </p>
                        <p className="text-sm text-white/70">@{friend.username}</p>
                      </div>
                      <UserCheck className="w-5 h-5 text-green-300" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Alt Bölüm */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kullanıcı Arama */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5" />
                <h3 className="text-xl font-bold">Kullanıcı Ara</h3>
              </div>
              
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ad, soyad, kullanıcı adı veya email..."
                  className="flex-1 px-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-white/70"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                >
                  {searching ? 'Aranıyor...' : 'Ara'}
                </button>
              </div>

              {/* Arama Sonuçları */}
              {hasSearched && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Arama Sonuçları</h4>
                    <span className="text-sm text-white/70">
                      {searchResults.length} sonuç bulundu
                    </span>
                  </div>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <p className="text-white/70 font-medium mb-2">Kullanıcı Bulunamadı</p>
                      <p className="text-white/50 text-sm">
                        "{searchQuery}" aramasına uygun kullanıcı bulunamadı
                      </p>
                      <div className="mt-4 text-xs text-white/40">
                        💡 Ad, soyad, kullanıcı adı veya email ile arama yapabilirsin
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((userData) => (
                        <div key={userData.uid} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/15 transition-colors">
                          {userData.profilePhoto ? (
                            <img
                              src={userData.profilePhoto}
                              alt="Profil fotoğrafı"
                              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">
                              {userData.firstName} {userData.lastName}
                            </p>
                            <p className="text-sm text-white/70">@{userData.username}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {userData.isFriend ? (
                              <span className="text-green-300 text-sm font-medium flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-lg">
                                <UserCheck className="w-4 h-4" />
                                Zaten Arkadaş
                              </span>
                            ) : userData.hasPendingRequest ? (
                              <span className="text-orange-300 text-sm font-medium flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-lg">
                                <Clock className="w-4 h-4" />
                                İstek Gönderildi
                              </span>
                            ) : (
                              <button
                                onClick={() => sendFriendRequest(userData.uid)}
                                className="flex items-center gap-1 px-3 py-1 bg-white text-indigo-600 text-sm rounded-lg hover:bg-gray-100 transition-colors font-medium"
                              >
                                <UserPlus className="w-4 h-4" />
                                İstek Gönder
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gelen Arkadaşlık İstekleri */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5" />
                <h3 className="text-xl font-bold">Gelen İstekler</h3>
                <span className="bg-white/20 text-white text-sm font-medium px-2 py-1 rounded-full">
                  {incoming.length}
                </span>
              </div>
              {incoming.length === 0 ? (
                <p className="text-center py-4 text-white/70">Henüz gelen istek yok</p>
              ) : (
                <div className="space-y-3">
                  {incoming.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium">{request.fromName}</p>
                        <p className="text-sm text-white/70">Arkadaşlık isteği gönderdi</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Veri Paylaşım Ayarı */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-xs">🔒</span>
                </div>
                <h3 className="text-xl font-bold">Veri Paylaşımı</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-white/80">
                  Arkadaşlarının maç verilerini görebilmesi için veri paylaşımını aç
                </p>
                <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                  <span className="font-medium">Veri Paylaşımı</span>
                  <button
                    onClick={handleDataSharingToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      dataSharingEnabled ? 'bg-green-400' : 'bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dataSharingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-white/60">
                  {dataSharingEnabled 
                    ? '✅ Arkadaşların maç verilerini görebilir' 
                    : '❌ Arkadaşların maç verilerini göremez'
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Arkadaş Performansları Modal */}
      {showFriendsPerformance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-green-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Arkadaşlarının Son Maç Performansı</h2>
                </div>
                <button
                  onClick={() => setShowFriendsPerformance(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {friendsPerformanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-green-600">Yükleniyor...</p>
                </div>
              ) : friendsPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsPerformance.map((friend) => (
                    <div 
                      key={friend.uid} 
                      className={`rounded-xl p-4 border transition-shadow cursor-pointer hover:scale-105 ${
                        friend.hasAccess 
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-md' 
                          : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                      }`}
                      onClick={() => handleFriendClick(friend)}
                    >
                      <div className="flex items-center gap-3">
                        {friend.profilePhoto ? (
                          <img
                            src={friend.profilePhoto}
                            alt="Profil fotoğrafı"
                            className={`w-10 h-10 rounded-full object-cover border-2 ${
                              friend.hasAccess ? 'border-green-300' : 'border-gray-300'
                            }`}
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            friend.hasAccess ? 'bg-green-600' : 'bg-gray-500'
                          }`}>
                            <span className="text-white font-bold text-sm">
                              {friend.firstName?.charAt(0)}{friend.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className={`font-semibold ${
                            friend.hasAccess ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            {friend.firstName} {friend.lastName}
                          </h4>
                          <p className={`text-sm ${
                            friend.hasAccess ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {friend.hasAccess 
                              ? (friend.lastMatch ? `${friend.lastMatch.points} puan` : 'Maç kaydı yok')
                              : 'Veri erişimi yok'
                            }
                          </p>
                          {!friend.hasAccess && (
                            <div className="text-xs text-gray-400 mt-1">
                              <p>Arkadaş verilerini paylaşmıyor</p>
                              {friend.details && (
                                <p className="text-gray-500 mt-1">{friend.details}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          Tıkla →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Henüz arkadaşınız yok</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Arkadaş Detay Modal */}
      {showFriendDetail && selectedFriend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedFriend.profilePhoto ? (
                    <img
                      src={selectedFriend.profilePhoto}
                      alt="Profil fotoğrafı"
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {selectedFriend.firstName?.charAt(0)}{selectedFriend.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedFriend.firstName} {selectedFriend.lastName}
                  </h2>
                </div>
                <button
                  onClick={() => setShowFriendDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedFriend.note && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <p className="text-yellow-800 text-sm">
                      <strong>Not:</strong> {selectedFriend.note}
                    </p>
                  </div>
                </div>
              )}
              
              {!selectedFriend.hasAccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Veri Erişimi Yok</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedFriend.details || 'Bu arkadaşın maç verilerini görebilmek için arkadaşının veri paylaşımını açması gerekiyor.'}
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      💡 <strong>Çözüm:</strong> Arkadaşına profil sayfasından "Veri Paylaşımı" ayarını açmasını söyleyebilirsin.
                    </p>
                  </div>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      ℹ️ <strong>Bilgi:</strong> Veri paylaşımı hem senin hem de arkadaşının açık olması gerekiyor.
                    </p>
                  </div>
                </div>
              ) : selectedFriend.matches && selectedFriend.matches.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Toplam Maç</h4>
                      <p className="text-2xl font-bold text-blue-600">{selectedFriend.matches.length}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Son Maç Puanı</h4>
                      <p className="text-2xl font-bold text-green-600">{selectedFriend.matches[0]?.points || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-2">Ortalama Puan</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedFriend.matches.length > 0 
                          ? (selectedFriend.matches.reduce((sum: number, match: any) => sum + (match.points || 0), 0) / selectedFriend.matches.length).toFixed(1)
                          : 0
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Son Maçlar</h4>
                    <div className="space-y-3">
                      {selectedFriend.matches.map((match: any, index: number) => (
                        <div 
                          key={match.id} 
                          className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group"
                          onClick={() => {
                            // Maç detaylarını modal'da göster
                            setSelectedMatch(match);
                            setShowMatchDetail(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-800 group-hover:text-gray-900">Maç {index + 1}</h5>
                              <p className="text-sm text-gray-600">{match.date || 'Tarih belirtilmemiş'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-green-600 group-hover:text-green-700">{match.points || 0} puan</p>
                              <p className="text-sm text-gray-500">{match.distance || 0} km</p>
                            </div>
                            <div className="ml-3 text-gray-400 group-hover:text-gray-600 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg">Maç kaydı bulunmamaktadır</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profil Tamamlama Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">Profil Bilgilerini Tamamla</h2>
              </div>
              <p className="text-gray-600 mt-2">VERİ SAHA'da performansını takip etmek için pozisyon ve ayak tercihini belirt</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozisyon <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileForm.position}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pozisyon seçin</option>
                    <option value="Kaleci">Kaleci</option>
                    <option value="Defans">Defans</option>
                    <option value="Orta Saha">Orta Saha</option>
                    <option value="Forvet">Forvet</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayak Tercihi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileForm.footPreference}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, footPreference: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Ayak tercihi seçin</option>
                    <option value="Sağ Ayak">Sağ Ayak</option>
                    <option value="Sol Ayak">Sol Ayak</option>
                    <option value="İki Ayak">İki Ayak</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleProfileComplete}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all"
                >
                  Profili Tamamla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maç Detay Modal */}
      {showMatchDetail && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Maç Detayları</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {selectedMatch.date || 'Tarih belirtilmemiş'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMatchDetail(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Ana İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Koşu Mesafesi</h3>
                  </div>
                  <div className="text-4xl font-bold mb-2">{selectedMatch.distance || 0}</div>
                  <div className="text-blue-100 text-sm">kilometre</div>
                  <div className="mt-3 text-blue-200 text-xs">
                    {selectedMatch.distance && selectedMatch.distance > 8 ? '🏃‍♂️ Mükemmel performans!' :
                     selectedMatch.distance && selectedMatch.distance > 6 ? '💪 İyi çaba!' : '📈 Gelişim alanı'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Başarılı Pas</h3>
                  </div>
                  <div className="text-4xl font-bold mb-2">{selectedMatch.passes || 0}</div>
                  <div className="text-green-100 text-sm">pas</div>
                  <div className="mt-3 text-green-200 text-xs">
                    {selectedMatch.passes && selectedMatch.passes > 20 ? '🎯 Pas ustası!' :
                     selectedMatch.passes && selectedMatch.passes > 10 ? '👍 İyi paslar!' : '⚽ Daha fazla pas!'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Başarılı Şut</h3>
                  </div>
                  <div className="text-4xl font-bold mb-2">{selectedMatch.shots || 0}</div>
                  <div className="text-orange-100 text-sm">şut</div>
                  <div className="mt-3 text-orange-200 text-xs">
                    {selectedMatch.shots && selectedMatch.shots > 5 ? '⚽ Gol makinesi!' :
                     selectedMatch.shots && selectedMatch.shots > 2 ? '🎯 İyi şutlar!' : '🎪 Daha fazla şut!'}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Maç Puanı</h3>
                  </div>
                  <div className="text-4xl font-bold mb-2">{selectedMatch.rating || calculateRating(selectedMatch)}</div>
                  <div className="text-purple-100 text-sm">puan</div>
                  <div className="mt-3 text-purple-200 text-xs">
                    {selectedMatch.rating && selectedMatch.rating > 8 ? '🏆 Mükemmel!' :
                     selectedMatch.rating && selectedMatch.rating > 7 ? '⭐ Çok iyi!' :
                     selectedMatch.rating && selectedMatch.rating > 6 ? '👍 İyi!' : '📚 Gelişim alanı'}
                  </div>
                </div>
              </div>

              {/* Detaylı İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Pas İstatistikleri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Başarılı Pas</span>
                      <span className="font-semibold text-green-600">{selectedMatch.passes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Başarısız Pas</span>
                      <span className="font-semibold text-red-600">{selectedMatch.passesFail || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pas Başarısı</span>
                      <span className="font-semibold text-blue-600">
                        {selectedMatch.passes && selectedMatch.passesFail 
                          ? Math.round((selectedMatch.passes / (selectedMatch.passes + selectedMatch.passesFail)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Şut İstatistikleri
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Başarılı Şut</span>
                      <span className="font-semibold text-green-600">{selectedMatch.shots || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Başarısız Şut</span>
                      <span className="font-semibold text-red-600">{selectedMatch.shotsFail || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Şut Başarısı</span>
                      <span className="font-semibold text-blue-600">
                        {selectedMatch.shots && selectedMatch.shotsFail 
                          ? Math.round((selectedMatch.shots / (selectedMatch.shots + selectedMatch.shotsFail)) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 