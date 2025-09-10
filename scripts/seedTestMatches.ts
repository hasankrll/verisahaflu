import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config
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

// Test kullanıcı UID - mevcut kullanıcıdan
const userId = 'Uhg5nK1IY2Vcfps7ocLOYhmY4Bp1';

async function seedTestMatches() {
  try {
    console.log('10 test maçı yükleniyor... Kullanıcı UID:', userId);

    const testMatches = [
      {
        id: 'match1',
        distance: 8.2,
        passes: 25,
        passesFail: 3,
        shots: 4,
        shotsFail: 1,
        assists: 2,
        goals: 1,
        points: 85,
        teamPasses: 180,
        teamPassRate: 85.2,
        possession: 58.5,
        teamPoints: 3,
        score: '3-1',
        date: '2024-01-15'
      },
      {
        id: 'match2',
        distance: 7.8,
        passes: 22,
        passesFail: 2,
        shots: 3,
        shotsFail: 0,
        assists: 1,
        goals: 0,
        points: 78,
        teamPasses: 165,
        teamPassRate: 82.1,
        possession: 52.3,
        teamPoints: 1,
        score: '1-1',
        date: '2024-01-20'
      },
      {
        id: 'match3',
        distance: 9.1,
        passes: 30,
        passesFail: 4,
        shots: 5,
        shotsFail: 2,
        assists: 3,
        goals: 2,
        points: 92,
        teamPasses: 200,
        teamPassRate: 88.5,
        possession: 65.2,
        teamPoints: 3,
        score: '4-2',
        date: '2024-01-25'
      },
      {
        id: 'match4',
        distance: 6.5,
        passes: 18,
        passesFail: 1,
        shots: 2,
        shotsFail: 0,
        assists: 0,
        goals: 0,
        points: 72,
        teamPasses: 140,
        teamPassRate: 78.9,
        possession: 45.6,
        teamPoints: 0,
        score: '0-2',
        date: '2024-02-01'
      },
      {
        id: 'match5',
        distance: 8.9,
        passes: 28,
        passesFail: 3,
        shots: 4,
        shotsFail: 1,
        assists: 2,
        goals: 1,
        points: 88,
        teamPasses: 190,
        teamPassRate: 86.3,
        possession: 61.4,
        teamPoints: 3,
        score: '3-0',
        date: '2024-02-05'
      },
      {
        id: 'match6',
        distance: 7.3,
        passes: 20,
        passesFail: 2,
        shots: 3,
        shotsFail: 1,
        assists: 1,
        goals: 0,
        points: 75,
        teamPasses: 155,
        teamPassRate: 80.2,
        possession: 48.7,
        teamPoints: 1,
        score: '1-1',
        date: '2024-02-10'
      },
      {
        id: 'match7',
        distance: 9.5,
        passes: 32,
        passesFail: 5,
        shots: 6,
        shotsFail: 2,
        assists: 4,
        goals: 3,
        points: 95,
        teamPasses: 220,
        teamPassRate: 90.1,
        possession: 68.9,
        teamPoints: 3,
        score: '5-1',
        date: '2024-02-15'
      },
      {
        id: 'match8',
        distance: 6.8,
        passes: 19,
        passesFail: 2,
        shots: 2,
        shotsFail: 0,
        assists: 0,
        goals: 0,
        points: 70,
        teamPasses: 150,
        teamPassRate: 79.5,
        possession: 43.2,
        teamPoints: 0,
        score: '0-3',
        date: '2024-02-20'
      },
      {
        id: 'match9',
        distance: 8.7,
        passes: 26,
        passesFail: 3,
        shots: 4,
        shotsFail: 1,
        assists: 2,
        goals: 1,
        points: 86,
        teamPasses: 185,
        teamPassRate: 84.7,
        possession: 59.8,
        teamPoints: 3,
        score: '2-1',
        date: '2024-02-25'
      },
      {
        id: 'match10',
        distance: 7.9,
        passes: 24,
        passesFail: 2,
        shots: 3,
        shotsFail: 0,
        assists: 1,
        goals: 1,
        points: 82,
        teamPasses: 170,
        teamPassRate: 83.2,
        possession: 55.6,
        teamPoints: 3,
        score: '2-0',
        date: '2024-03-01'
      }
    ];

    // Her maçı yükle
    for (const match of testMatches) {
      const matchRef = doc(collection(db, 'users', userId, 'matches'), match.id);
      await setDoc(matchRef, {
        ...match,
        createdAt: serverTimestamp()
      });
      console.log(`Maç yüklendi: ${match.id} - ${match.score} (${match.points} puan)`);
    }

    console.log('✅ 10 test maçı başarıyla yüklendi!');
    
  } catch (error) {
    console.error('Maç yükleme hatası:', error);
  }
}

seedTestMatches().catch(console.error); 