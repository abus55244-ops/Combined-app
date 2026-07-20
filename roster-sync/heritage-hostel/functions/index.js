/**
 * এই ফাংশনটি "heritage-hostel" Firebase প্রজেক্টে ডিপ্লয় করতে হবে।
 * কাজ: /studentRoster পরিবর্তন হলে, একই পরিবর্তন abu-sayed-6c6b9 (HAIS) প্রজেক্টের
 *      /hais_data_v3/customStudents-এ প্রতিফলিত করে।
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ── এই প্রজেক্টের (heritage-hostel) নিজস্ব অ্যাডমিন অ্যাপ ──
admin.initializeApp();

// ── HAIS (abu-sayed-6c6b9) প্রজেক্টে লেখার জন্য দ্বিতীয় অ্যাডমিন অ্যাপ ──
// serviceAccountKey.json = abu-sayed-6c6b9 প্রজেক্টের service account (এই ফোল্ডারেই রাখুন)
const haisServiceAccount = require("./serviceAccountKey.json");
const haisApp = admin.initializeApp(
  {
    credential: admin.credential.cert(haisServiceAccount),
    databaseURL: "https://abu-sayed-6c6b9-default-rtdb.firebaseio.com",
  },
  "haisApp"
);

// ── দুই অ্যাপের কোডে হার্ডকোড করা বেসলাইন রোস্টার (উভয় অ্যাপেই অভিন্ন) ──
// HAIS-এ কোনো ক্লাস customStudents-এ override না থাকলে এই বেসলাইন ধরা হয়।
const DEFAULT_STUDENTS = {
  IV: ["ARHAM RAFIN"],
  V: ["MD.MURSALIN SHEIKH","ABDULLAH AL TAMIM","ALIF ISLAM","ARIFUL PRAMANIK","ASIBUL ISLAM LIHAD CHOWDURY","HABIBUR RAHMAN BEPARI","HUJAIFA BIN SALMAN","SOHAN KHAN","TAWHID MAHTAB"],
  VI: ["MIR TANZIBUL ISLAM","HASNAT IMTIAZ TASHIN","MUBASHIR RAHMAN NAFIJ SIKDER","MD. AL AMIN","IFAT UDDIN","MD. SALMAN ALI KHAN","ROOZBEH ZAIN","TANJIM ISLAM TAMIM","ABU BOKKOR SHEIKH","AL MUBASSIR MUNSHI","BAYEJID SHEIKH","UDVAB DAS ARNOB","MD SOHANUR RAHMAN SIYAM","ABIR KHAN"],
  VII: ["SHAMSUL ALAM JOBAYER","SAKIBUL HASAN","MAHIDUL BISWAS","JISAN","MD NAZMUL SAKIB","ANTOR KUMAR GHOSH","MUBASSHIR IMAN","HOSSAIN FIROZ","AL RAFI","MD.ABDULLAH SHEIKH","MESBAH UDDIN KHOLIFA","APON SUTRODHAR","MD SIYAM MOLLA"],
  VIII: ["MD WALIDUJJAMAN SOHAN","RAKIBUL MUNSHI","SYED MD TANZIM HUDA","RAJBE NUR ISLAM","SAIFULLAH SADAT JARRAH","SALAMA SABIT","ZIHAD AHMED SHARON","MD. MOSHIUR RAHMAN","MD MEZBAUL ISLAM","SHAH MUHAMMAD MAHI","ENAMUL HAQUE SIFAT","KAZI FAYEKUZZAMAN","MD.TAYEB HASAN MUSA","MD.ALIF RAHMAN","MD. REZWAN AHMED","MD ARAF SARDER","TAMIM KAZI","SHAHRIAR MAHMUD","HAMIDUR RAHMAN","SIMRAN HOSSAIN RIHAD","MD FARHAN RAHMAN AVI","ARAFAT MIA"],
  IX: ["ABUL HAYAT","SAHADAT BEPARY","MD ABDULLAH BIN RAJ","RIYAN KHAN","MD.ADOL","NAZMUS SAKIB","AMIR HAMJA GIHAD","MASHFIN MAHIN","MD.SAMIR KHAN","ABIR BISWAS","BISHWJIT BISWAS TIRTHO","FAHAD HOSSEN","MD.AHSANUL ISLAM MAHIM","RAFIUL ISLAM AYAN","SHAJID KHAN MAHIN","KHANDOKER FARHAN","RAFIUL BAIZED","MD SIZAN SHEIKH","MD ABDULLAH"],
  X: ["MD. FAHIM FOKIR","MD. SIAM MONDOL","MD. SHAWON MONDOL","MD. TAHSIN ZAMAN","SAFWAN BIN SATTAR","SHAFAYET BIN JABBAR","ARHAM HASAN AKASH","SHAHRIAR NAFIZ SIFAT","ABDULLAH MOMIN","MD SHAD REZA","SOHEL MRIDHA","MD. SHOHIDUL ISLAM","MITUL BHUIYA","ABDULLAH BIN MUKHTER","MUNNA KHA","SABID ISLAM","MD. ALAMIN MRIDHA","SHAHRIYA MATUBBER","ADNAN HOSSEN ALIF","MUHTAMIM KABIR","S M RAHMAT ULLAH","AL HOSSAIN","MD OMOR FARUK TALHA","TAWHID ISLAM"],
};

// দুটো array-কে (ক্রম উপেক্ষা করে) তুলনা করার হেল্পার
function sameList(a, b) {
  const x = [...(a || [])].sort();
  const y = [...(b || [])].sort();
  if (x.length !== y.length) return false;
  return x.every((v, i) => v === y[i]);
}

exports.syncHostelRosterToHAIS = functions.database
  .ref("/studentRoster")
  .onWrite(async (change) => {
    const hostelRoster = change.after.val() || {};
    const haisDb = haisApp.database();

    const customSnap = await haisDb.ref("hais_data_v3/customStudents").once("value");
    const haisCustom = customSnap.val() || {};

    const allClasses = new Set([
      ...Object.keys(DEFAULT_STUDENTS),
      ...Object.keys(hostelRoster),
    ]);

    const updates = {};
    for (const cls of allClasses) {
      const hostelList = hostelRoster[cls] || [];
      const haisList =
        haisCustom[cls] !== undefined ? haisCustom[cls] : DEFAULT_STUDENTS[cls] || [];

      if (!sameList(hostelList, haisList)) {
        // হোস্টেলের বর্তমান তালিকাই এখন "সঠিক" ধরে HAIS-এর customStudents override-এ বসানো হচ্ছে
        updates[`hais_data_v3/customStudents/${cls}`] = hostelList;
      }
    }

    if (Object.keys(updates).length > 0) {
      await haisDb.ref("/").update(updates);
      console.log(
        `HAIS-এ ${Object.keys(updates).length}টি ক্লাসের রোস্টার সিঙ্ক করা হলো:`,
        Object.keys(updates)
      );
    }
  });
