import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';

const fbConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(fbConfig);
const auth = getAuth(app);
const db = getFirestore(app, fbConfig.firestoreDatabaseId);

async function run() {
  const email = `test${Date.now()}@test.com`;
  await createUserWithEmailAndPassword(auth, email, '123456');
  const user = auth.currentUser;
  
  await setDoc(doc(db, 'users', user.uid), {
    name: 'Test',
    email: email,
    subscriptionTier: 'trial',
    trialEndsAt: Date.now() + 7 * 24 * 60 * 60 * 1000, 
    onboardingComplete: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  console.log("Logged in:", user.uid);
  
  try {
    const dogsRef = collection(db, 'users', user.uid, 'dogs');
    console.log("Fetching dogs...");
    const snap = await getDocs(dogsRef);
    console.log("Dogs fetched, count:", snap.size);
    
    console.log("Saving dog profile...");
    const dogId = Date.now().toString();
    const now = Date.now();
    await setDoc(doc(dogsRef, dogId), {
          name: 'Cão Test',
          breed: 'SRD',
          age: '0',
          weight: '10',
          routine: [],
          energyLevel: 'medium',
          behaviorIssues: [],
          trainingBase: 'beginner',
          knownCommands: [],
          goals: [],
          diet: 'Ração seca',
          foodBrand: 'Pedigree',
          mealsPerDay: '2 refeições',
          lastVaccine: '',
          nextCheckup: '',
          observations: '',
          createdAt: now,
          updatedAt: now
    }, { merge: true });
    console.log("Dog saved!");
  } catch (e) {
    console.error("Error saving dog:", e.message);
  }
}
run();
