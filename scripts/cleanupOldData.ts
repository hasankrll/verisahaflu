import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

async function cleanupOldData() {
  try {
    console.log('Eski publicMatches verilerini temizleniyor...');
    
    // publicMatches koleksiyonundaki tüm belgeleri al
    const publicMatchesRef = collection(db, 'publicMatches');
    const snapshot = await getDocs(publicMatchesRef);
    
    console.log(`${snapshot.docs.length} eski belge bulundu.`);
    
    // Her belgeyi sil
    const deletePromises = snapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(doc(db, 'publicMatches', docSnapshot.id));
      console.log(`Silindi: ${docSnapshot.id}`);
    });
    
    await Promise.all(deletePromises);
    console.log('Tüm eski veriler temizlendi!');
    
  } catch (error) {
    console.error('Temizleme hatası:', error);
  }
}

cleanupOldData().catch(console.error); 