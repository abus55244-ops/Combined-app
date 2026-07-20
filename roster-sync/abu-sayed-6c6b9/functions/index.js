/**
 * এই ফাংশনটি "abu-sayed-6c6b9" (HAIS) Firebase প্রজেক্টে ডিপ্লয় করতে হবে।
 * কাজ: /hais_data_v3/customStudents পরিবর্তন হলে, একই পরিবর্তন heritage-hostel
 *      প্রজেক্টের /studentRoster-এ প্রতিফলিত করে।
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// ── এই প্রজেক্টের (abu-sayed-6c6b9) নিজস্ব অ্যাডমিন অ্যাপ ──
admin.initializeApp();

// ── হোস্টেল (heritage-hostel) প্রজেক্টে লেখার জন্য দ্বিতীয় অ্যাডমিন অ্যাপ ──
// serviceAccountKey.json = heritage-hostel প্রজেক্টের service account (এই ফোল্ডারেই রাখুন)
const hostelServiceAccount = require("./serviceAccountKey.json");
const hostelApp = admin.initializeApp(
  {
    credential: admin.credential.cert(hostelServiceAccount),
    databaseURL: "https://heritage-hostel-default-rtdb.asia-southeast1.firebasedatabase.app",
  },
  "hostelApp"
);

// ── বেসলাইন রোস্টার — উভয় অ্যাপেই অভিন্ন ──
const DEFAULT_STUDENTS = {
  IV: ["ARHAM RAFIN"],
  V: ["MD.MURSALIN SHEIKH","ABDULLAH AL TAMIM","ALIF ISLAM","ARIFUL PRAMANIK","ASIBUL ISLAM LIHAD CHOWDURY","HABIBUR RAHMAN BEPARI","HUJAIFA BIN SALMAN","SOHAN KHAN","TAWHID MAHTAB"],
  VI: ["MIR TANZIBUL ISLAM","HASNAT IMTIAZ TASHIN","MUBASHIR RAHMAN NAFIJ SIKDER","MD. AL AMIN","IFAT UDDIN","MD. SALMAN ALI KHAN","ROOZBEH ZAIN","TANJIM ISLAM TAMIM","ABU BOKKOR SHEIKH","AL MUBASSIR MUNSHI","BAYEJID SHEIKH","UDVAB DAS ARNOB","MD SOHANUR RAHMAN SIYAM","ABIR KHAN"],
  VII: ["SHAMSUL ALAM JOBAYER","SAKIBUL HASAN","MAHIDUL BISWAS","JISAN","MD NAZMUL SAKIB","ANTOR KUMAR GHOSH","MUBASSHIR IMAN","HOSSAIN FIROZ","AL RAFI","MD.ABDULLAH SHEIKH","MESBAH UDDIN KHOLIFA","APON SUTRODHAR","MD SIYAM MOLLA"],
  VIII: ["MD WALIDUJJAMAN SOHAN","RAKIBUL MUNSHI","SYED MD TANZIM HUDA","RAJBE NUR ISLAM","SAIFULLAH SADAT JARRAH","SALAMA SABIT","ZIHAD AHMED SHARON","MD. MOSHIUR RAHMAN","MD MEZBAUL ISLAM","SHAH MUHAMMAD MAHI","ENAMUL HAQUE SIFAT","KAZI FAYEKUZZAMAN","MD.TAYEB HASAN MUSA","MD.ALIF RAHMAN","MD. REZWAN AHMED","MD ARAF SARDER","TAMIM KAZI","SHAHRIAR MAHMUD","HAMIDUR RAHMAN","SIMRAN HOSSAIN RIHAD","MD FARHAN RAHMAN AVI","ARAFAT MIA"],
  IX: ["ABUL HAYAT","SAHADAT BEPARY","MD ABDULLAH BIN RAJ","RIYAN KHAN","MD.ADOL","NAZMUS SAKIB","AMIR HAMJA GIHAD","MASHFIN MAHIN","MD.SAMIR KHAN","ABIR BISWAS","BISHWJIT BISWAS TIRTHO","FAHAD HOSSEN","MD.AHSANUL ISLAM MAHIM","RAFIUL ISLAM AYAN","SHAJID KHAN MAHIN","KHANDOKER FARHAN","RAFIUL BAIZED","MD SIZAN SHEIKH","MD ABDULLAH"],
  X: ["MD. FAHIM FOKIR","MD. SIAM MONDOL","MD. SHAWON MONDOL","MD. TAHSIN ZAMAN","SAFWAN BIN SATTAR","SHAFAYET BIN JABBAR","ARHAM HASAN AKASH","SHAHRIAR NAFIZ SIFAT","ABDULLAH MOMIN","MD SHAD REZA","SOHEL MRIDHA","MD. SHOHIDUL ISLAM","MITUL BHUIYA","ABDULLAH BIN MUKHTER","MUNNA KHA","SABID ISLAM","MD. ALAMIN MRIDHA","SHAHRIYA MATUBBER","ADNAN HOSSEN ALIF","MUHTAMIM KABIR","S M RAHMAT ULLAH","AL HOSSAIN","MD OMOR FARUK TALHA","TAWHID ISLAM"],
};

function sameList(a, b) {
  const x = [...(a || [])].sort();
  const y = [...(b || [])].sort();
  if (x.length !== y.length) return false;
  return x.every((v, i) => v === y[i]);
}

exports.syncHAISRosterToHostel = functions.database
  .ref("/hais_data_v3/customStudents")
  .onWrite(async (change) => {
    const haisCustom = change.after.val() || {};
    const hostelDb = hostelApp.database();

    const rosterSnap = await hostelDb.ref("studentRoster").once("value");
    const hostelRoster = rosterSnap.val() || {};

    const allClasses = new Set([
      ...Object.keys(DEFAULT_STUDENTS),
      ...Object.keys(haisCustom),
    ]);

    const updates = {};
    for (const cls of allClasses) {
      const haisList =
        haisCustom[cls] !== undefined ? haisCustom[cls] : DEFAULT_STUDENTS[cls] || [];
      const hostelList = hostelRoster[cls] || DEFAULT_STUDENTS[cls] || [];

      if (!sameList(haisList, hostelList)) {
        // HAIS-এর বর্তমান তালিকাই এখন "সঠিক" ধরে হোস্টেলের studentRoster-এ বসানো হচ্ছে
        updates[`studentRoster/${cls}`] = haisList;
      }
    }

    if (Object.keys(updates).length > 0) {
      await hostelDb.ref("/").update(updates);
      console.log(
        `হোস্টেলে ${Object.keys(updates).length}টি ক্লাসের রোস্টার সিঙ্ক করা হলো:`,
        Object.keys(updates)
      );
    }
  });
