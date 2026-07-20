# DEPLOYMENT — ধাপে ধাপে

প্রতিটা ধাপ শেষে থামুন, যাচাই করুন, তারপর পরের ধাপে যান। কোনো ধাপে সমস্যা হলে পরের ধাপে যাবেন না।

## ০. আগে যা লাগবে
- [Firebase CLI](https://firebase.google.com/docs/cli) ইনস্টল করা (`npm install -g firebase-tools`)
- `firebase login` দিয়ে আপনার Google অ্যাকাউন্টে লগইন করা (যেটা দিয়ে দুই Firebase প্রজেক্টেই
  অ্যাক্সেস আছে)
- দুই প্রজেক্টেই **Blaze (Pay-as-you-go) প্ল্যান** চালু করা (Firebase Console → প্রজেক্ট → Upgrade)

---

## ধাপ ১: হোস্টেল-সাইড ফাংশন ডিপ্লয়

```bash
cd roster-sync/heritage-hostel
```

১. Firebase Console → `abu-sayed-6c6b9` প্রজেক্ট → Project Settings → Service Accounts →
   "Generate new private key" → ডাউনলোড হওয়া ফাইলটার নাম বদলে `functions/serviceAccountKey.json`
   রাখুন। (এই ফাংশনটা হোস্টেল প্রজেক্টে থাকলেও, এটা HAIS-এ লিখবে — তাই HAIS-এর key লাগবে।)

২. ইনস্টল ও ডিপ্লয়:
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

৩. **যাচাই:** Firebase Console → `heritage-hostel` → Functions ট্যাবে গিয়ে
   `syncHostelRosterToHAIS` ফাংশনটা "deployed" দেখাচ্ছে কিনা দেখুন।

---

## ধাপ ২: HAIS-সাইড ফাংশন ডিপ্লয়

```bash
cd ../abu-sayed-6c6b9
```

১. Firebase Console → `heritage-hostel` প্রজেক্ট → Project Settings → Service Accounts →
   "Generate new private key" → `functions/serviceAccountKey.json` রাখুন (এবার হোস্টেলের key)।

২. ইনস্টল ও ডিপ্লয়:
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

৩. **যাচাই:** Firebase Console → `abu-sayed-6c6b9` → Functions ট্যাবে `syncHAISRosterToHostel`
   "deployed" দেখাচ্ছে কিনা দেখুন।

---

## ধাপ ৩: সিঙ্ক টেস্ট করা (গুরুত্বপূর্ণ — বাদ দেবেন না)

1. Firebase Console → `heritage-hostel` → Realtime Database → `studentRoster` → কোনো একটা
   ক্লাসে (যেমন `IV`) একটা টেস্ট নাম ম্যানুয়ালি যোগ করুন (যেমন `"TEST STUDENT ONE"`)।
2. কয়েক সেকেন্ড অপেক্ষা করে `abu-sayed-6c6b9` → Realtime Database →
   `hais_data_v3/customStudents/IV`-তে গিয়ে দেখুন নামটা এসেছে কিনা।
3. এবার সেটা মুছে ফেলুন, আবার কয়েক সেকেন্ড পর দেখুন `heritage-hostel`-এর `studentRoster`
   থেকেও গায়েব হয়েছে কিনা।
4. উল্টো দিক থেকেও (HAIS-এ যোগ করে হোস্টেলে চেক করে) একই টেস্ট করুন।
5. **টেস্ট নামটা মুছে ফেলতে ভুলবেন না** — এটা শুধু যাচাইয়ের জন্য।

সিঙ্ক কাজ না করলে Functions লগ দেখুন: `firebase functions:log`।

---

## ধাপ ৪: ইউনিফাইড শেল অ্যাপ কনফিগার ও ডিপ্লয়

```bash
cd ../../unified-shell
```

`public/index.html`-এ ৩টা জায়গা এডিট করুন (বিস্তারিত `SETUP.md`-এ):
- `HOSTEL_FIREBASE.apiKey`
- `CONFIG.HOSTEL_APP_URL` ও `CONFIG.HAIS_APP_URL`

**ডিপ্লয়ের দুই বিকল্প:**

**বিকল্প A — Firebase Hosting:**
```bash
firebase use --add   # যেকোনো একটা প্রজেক্ট বেছে নিন, .firebaserc আপডেট হবে
firebase deploy --only hosting
```

**বিকল্প B — GitHub Pages:** শুধু `public/index.html` ফাইলটা একটা GitHub রিপোতে রেখে
Pages চালু করলেই হয়ে যাবে (কোনো বিল্ড ধাপ নেই, বিশুদ্ধ static HTML)।

---

## ধাপ ৫: প্রথম অ্যাডমিন রোল বসানো

Firebase Console → `abu-sayed-6c6b9` → Realtime Database → গিয়ে ম্যানুয়ালি যোগ করুন
(নিয়ম ও উদাহরণ `unified-shell/SETUP.md`-এ)।

---

## ধাপ ৬: পাইলট টেস্ট

শুধু নিজে এবং ১-২ জন বিশ্বস্ত ব্যবহারকারীকে নিয়ে কয়েকদিন চালিয়ে দেখুন, তারপর ধাপে ধাপে
বাকিদের যোগ করুন।
