/* ===================================================
   YATHARTH TOUR AND TRAVELS — FIREBASE BACKEND
   Ye file Firebase initialize karti hai aur quote
   ko Firestore me save karne ka function deti hai.
   =================================================== */

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import { getAnalytics }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

/* ---------- Firebase Config ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBdS9XG14ScTM7HBgu4dRFYzWoD9h9HX00",
  authDomain: "school-6b9ea.firebaseapp.com",
  projectId: "school-6b9ea",
  storageBucket: "school-6b9ea.firebasestorage.app",
  messagingSenderId: "1019910090815",
  appId: "1:1019910090815:web:14372adfec9d0a0e39c88a",
  measurementId: "G-WH0FXMVLN3"
};

/* ---------- Initialize Firebase ---------- */
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Analytics optional — agar fail ho to app crash na ho
try { getAnalytics(app); } catch (e) { console.warn('Analytics skipped:', e); }

/* =================================================
   GLOBAL FUNCTION: saveQuoteToFirestore(data)
   script.js se call hoga.
   Return: docId (string) — success par
   ================================================= */
window.saveQuoteToFirestore = async function (data) {
  // Number fields ko integer me convert karo (rules isi ki expect karti hain)
  const payload = {
    schoolName:        String(data.schoolName).trim(),
    contactName:       String(data.contactName).trim(),
    contactNumber:     String(data.contactNumber).trim(),
    emailAddress:      String(data.emailAddress || '').trim(),

    numStudents:       parseInt(data.numStudents, 10),
    numTeachers:       parseInt(data.numTeachers, 10),

    startLocation:     String(data.startLocation).trim(),
    destination:       String(data.destination).trim(),
    travelDate:        String(data.travelDate).trim(),
    numDays:           parseInt(data.numDays, 10),

    budgetPerStudent:  String(data.budgetPerStudent).trim(),

    foodRequirement:   String(data.foodRequirement || 'Discuss'),
    transportPref:     String(data.transportPref || 'Mixed'),
    accommodationReq:  String(data.accommodationReq || 'Yes'),
    additionalReq:     String(data.additionalReq || '').trim(),

    // Meta
    status:            'new',
    createdAt:         serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'quotes'), payload);
  console.log('✅ Quote saved to Firestore. ID:', docRef.id);
  return docRef.id;
};