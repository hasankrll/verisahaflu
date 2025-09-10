import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config - gerçek değerler
const firebaseConfig = {
  apiKey: "AIzaSyA8XyWGKoXTxjYQQkhiyuTGdDeskerhgGU",
  authDomain: "verisahaflu-38861.firebaseapp.com",
  projectId: "verisahaflu-38861",
  storageBucket: "verisahaflu-38861.appspot.com",
  messagingSenderId: "136877018432",
  appId: "1:136877018432:web:58109a0a9a2242d7f1fea5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Manuel UID - kullanıcıdan alındı
const userId = 'Uhg5nK1IY2Vcfps7ocLOYhmY4Bp1';

async function seedData() {
  try {
    if (!userId) {
      console.log('Lütfen önce userId değişkenini güncelleyin!');
      return;
    }

    // Kullanıcı var mı kontrol et
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.log('Böyle bir kullanıcı bulunamamıştır. UID:', userId);
      return;
    }

    console.log('Veriler ekleniyor... Kullanıcı UID:', userId);

    // Profil bilgilerini güncelle
    await setDoc(userRef, {
      firstName: 'Reşit',
      lastName: 'Başoğlu',
      email: 'resit@example.com',
      foot: 'Sol Ayak',
      position: 'Forvet',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('Profil bilgileri güncellendi');

    // 10 maç verisi ekle
    const matches = [
      { id: 'match1', distance: 8.2, passes: 15, passesFail: 3, shots: 3, shotsFail: 1, points: 75, date: '2024-01-15' },
      { id: 'match2', distance: 9.1, passes: 22, passesFail: 5, shots: 5, shotsFail: 2, points: 82, date: '2024-01-22' },
      { id: 'match3', distance: 10.5, passes: 30, passesFail: 4, shots: 7, shotsFail: 3, points: 90, date: '2024-01-29' },
      { id: 'match4', distance: 7.8, passes: 18, passesFail: 6, shots: 4, shotsFail: 2, points: 68, date: '2024-02-05' },
      { id: 'match5', distance: 11.2, passes: 25, passesFail: 3, shots: 6, shotsFail: 1, points: 88, date: '2024-02-12' },
      { id: 'match6', distance: 8.9, passes: 20, passesFail: 4, shots: 5, shotsFail: 2, points: 78, date: '2024-02-19' },
      { id: 'match7', distance: 12.1, passes: 28, passesFail: 2, shots: 8, shotsFail: 2, points: 95, date: '2024-02-26' },
      { id: 'match8', distance: 6.7, passes: 16, passesFail: 5, shots: 3, shotsFail: 1, points: 72, date: '2024-03-05' },
      { id: 'match9', distance: 9.8, passes: 24, passesFail: 3, shots: 6, shotsFail: 1, points: 85, date: '2024-03-12' },
      { id: 'match10', distance: 10.3, passes: 26, passesFail: 4, shots: 7, shotsFail: 2, points: 89, date: '2024-03-19' },
    ];

    for (const m of matches) {
      const matchRef = doc(collection(db, 'users', userId, 'matches'), m.id);
      await setDoc(matchRef, {
        distance: m.distance,
        passes: m.passes,
        passesFail: m.passesFail,
        shots: m.shots,
        shotsFail: m.shotsFail,
        points: m.points,
        date: m.date,
        createdAt: serverTimestamp(),
      });
      console.log(`Maç ${m.id} eklendi: ${m.points} puan`);
    }

    // Arkadaş verileri ekle
    const friends = [
      { id: 'friend1', firstName: 'Ahmet', lastName: 'Yılmaz', position: 'Orta Saha', lastMatchPoints: 78 },
      { id: 'friend2', firstName: 'Mehmet', lastName: 'Kaya', position: 'Defans', lastMatchPoints: 65 },
      { id: 'friend3', firstName: 'Ali', lastName: 'Demir', position: 'Kaleci', lastMatchPoints: 82 },
    ];

    for (const f of friends) {
      const friendRef = doc(db, 'users', f.id);
      await setDoc(friendRef, {
        firstName: f.firstName,
        lastName: f.lastName,
        position: f.position,
        lastMatchPoints: f.lastMatchPoints,
        createdAt: serverTimestamp(),
      });
      console.log(`Arkadaş ${f.firstName} ${f.lastName} eklendi`);
    }

    // Test kullanıcıları ekle (arkadaş arama için)
    const testUsers = [
      { id: 'test-user-1', firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@example.com', position: 'Orta Saha' },
      { id: 'test-user-2', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@example.com', position: 'Defans' },
      { id: 'test-user-3', firstName: 'Ali', lastName: 'Demir', email: 'ali@example.com', position: 'Kaleci' },
      { id: 'test-user-4', firstName: 'Fatma', lastName: 'Özkan', email: 'fatma@example.com', position: 'Forvet' },
      { id: 'test-user-5', firstName: 'Ayşe', lastName: 'Çelik', email: 'ayse@example.com', position: 'Orta Saha' },
    ];

    for (const u of testUsers) {
      const userRef = doc(db, 'users', u.id);
      await setDoc(userRef, {
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        position: u.position,
        createdAt: serverTimestamp(),
      });
      console.log(`Test kullanıcısı ${u.firstName} ${u.lastName} eklendi`);
    }

    console.log('Tüm veriler başarıyla eklendi!');
  } catch (error: any) {
    console.error('Hata:', error);
    if (error.code === 'permission-denied') {
      console.log('Firestore izin hatası: Lütfen Firestore güvenlik kurallarını kontrol edin!');
    }
  }
}

seedData().catch(console.error); 