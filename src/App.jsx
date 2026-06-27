import React, { useState, useEffect, useRef } from 'react';
import './responsive.css';
// NOTE: We deliberately do NOT use react-router-dom — App.jsx does its own
// page/section routing via local state. An earlier `react-router-dom` import
// here was unused and caused the dev server to crash (the package is not in
// package.json).
// (Removed 16 imports for non-existent files: ./context/* and ./utils/auth|data|
//  payments|academic|batches|students|teachers|notices|offers|liveClasses|
//  attendance|schedule|profile.js — every imported name was either a
//  translation-key or shadowed by a local declaration, so nothing referenced
//  these in real code. Vite was failing to resolve them, breaking the whole
//  module. All actual logic uses ./services/apiClient.js + ./config/database.js.)
// (Removed dead imports for non-existent utils/adminData.js, utils/teacherData.js,
//  utils/studentData.js, utils/dashboard.js — those functions were imported but
//  never called, and the files don't exist. Vite was failing to resolve them.)
// (Removed duplicate `useRef` import — now in the main React import on line 1.)
import { t, getLang } from './utils/translate.js';

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

import { DB, initDB } from './config/database.js';
import { SEC, AUTH_DB } from './config/auth.js';
import { C } from './constants/colors.js';
import { RES } from './constants/responsive.js';

// ============================================================
// UTILITIES
// ============================================================

// import { t, getLang } from './utils/translate.js';

// ============================================================
// HOOKS
// ============================================================

import { useScreenSize } from './hooks/useScreenSize.js';
import { useToast } from './hooks/useToast.jsx';
import { useConfirm } from './hooks/useConfirm.jsx';
import useStudentClass from './hooks/useStudentClass.js';
import { apiCall, profileAPI } from './services/apiClient.js';

// Extracted pages
import LoginPage from './pages/LoginPage.jsx';
import AdminSecretPortal from './pages/AdminSecretPortal.jsx';
import ProdSubscriptionPage from './components/SubscriptionPage.jsx';
import PaymentResult from './components/PaymentResult.jsx';
import Onboarding from './components/Onboarding/Onboarding.jsx';

// ============================================================
// SHARED COMPONENTS
// ============================================================

import { LangSwitcher } from './components/Shared/index.jsx';
import { Btn, Input, Card, Avatar, Badge, Modal, Stat, PBar } from './components/Shared/SharedComponents.jsx';
import { ProfilePage } from './components/Auth/ProfilePage.jsx';
import { AdminPaymentDashboard } from './components/AdminPaymentDashboard.jsx';
import { AdminStudentManager } from './components/AdminStudentManager.jsx';
import { TeacherPaymentDashboard } from './components/TeacherPaymentDashboard.jsx';
import AdminPlansManager from './components/Admin/AdminPlansManager.jsx';

// Teacher Components
import { TeacherHomePage, TeachersManager } from './components/Teachers/index.js';

// Admin Components (only those not locally defined in this file)
import { 
  OffersManager, AlumniManager, FeaturesManager,
  AdminDashboard
} from './components/Admin/index.js';


// ============================================================
// RESPONSIVE UTILITIES & HOOKS
// ============================================================
// Responsive padding helper
const getResponsivePadding = (width) => {
  if (width < RES.mobile) return "12px 14px";
  if (width < RES.tablet) return "16px 20px";
  return "20px 32px";
};

// Responsive grid columns
const getGridCols = (width, defaultCols = 3) => {
  if (width < RES.mobile) return 1;
  if (width < RES.tablet) return 2;
  return defaultCols;
};

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

// ============================================================
// SAMPLE DATA
// ============================================================
// Production defaults — Admin updates these from Settings
const SAMPLE_STATS = {
  students: 0, teachers: 0, batches: 0, results: 0, years: 1, toppers: 0, cbse: 0, state: 0
};

const SAMPLE_ALUMNI = []; // Production: empty — Admin adds real alumni

const SAMPLE_BATCHES = []; // Production: empty — Admin creates real batches

const SAMPLE_STUDENTS = []; // Production: empty — Admin adds real students

const SAMPLE_TEACHERS = []; // Production: empty — Admin adds real teachers

const SAMPLE_NOTICES = []; // Production: empty — Admin posts real notices

const SAMPLE_OFFERS = []; // Production: empty — Admin adds real offers

const SAMPLE_LIVE_CLASSES = []; // Production: empty — Teachers schedule real live classes

// ============================================================
// SHARED COMPONENTS
// ============================================================
// (Avatar, Badge, Card, Stat, PBar, Input, Btn, Modal imported from SharedComponents.jsx)
// (useConfirm imported from hooks/useConfirm.js)

// ============================================================
// MULTI-LANGUAGE SYSTEM
// ============================================================
const LANGUAGES = {
  en: { name: "English", flag: "🇬🇧", dir: "ltr" },
  hi: { name: "हिंदी", flag: "🇮🇳", dir: "ltr" },
  ta: { name: "தமிழ்", flag: "🇮🇳", dir: "ltr" },
  te: { name: "తెలుగు", flag: "🇮🇳", dir: "ltr" },
  ml: { name: "മലയാളം", flag: "🇮🇳", dir: "ltr" },
  mr: { name: "मराठी", flag: "🇮🇳", dir: "ltr" },
  bn: { name: "বাংলা", flag: "🇮🇳", dir: "ltr" },
  gu: { name: "ગુજરાતી", flag: "🇮🇳", dir: "ltr" },
  pa: { name: "ਪੰਜਾਬੀ", flag: "🇮🇳", dir: "ltr" },
  kn: { name: "ಕನ್ನಡ", flag: "🇮🇳", dir: "ltr" },
};

const T = {
  en: {
    // Auth
    login: "Login", logout: "Logout", signup: "Sign Up", register: "Register",
    student: "Student", teacher: "Teacher", admin: "Admin",
    password: "Password", email: "Email", phone: "Phone",
    enterPassword: "Enter Password", enterEmail: "Enter valid email",
    forgotPassword: "Forgot Password?", resetPassword: "Reset Password",
    sendOtp: "Send OTP to My Email", verifyOtp: "Verify OTP",
    resendOtp: "Resend OTP", otpSent: "OTP sent to",
    loginBtn: "Verify Password → OTP will be sent",
    verifyLogin: "Verify & Login", backToLogin: "Back to Login",
    newPassword: "New Password", confirmPassword: "Confirm Password",
    passwordUpdated: "Password Reset Successful!",
    // Dashboard
    dashboard: "Dashboard", home: "Home", profile: "Profile",
    // Sections
    liveClasses: "Live Classes", attendance: "Attendance",
    schedule: "Schedule", fees: "Fees", notices: "Notices",
    batches: "Batches", students: "Students", teachers: "Teachers",
    reports: "Reports", settings: "Settings", subscription: "Subscription",
    // Common
    save: "Save", cancel: "Cancel", edit: "Edit", delete: "Delete",
    add: "Add", update: "Update", submit: "Submit", search: "Search",
    approve: "Approve", reject: "Reject", back: "Go Back",
    loading: "Loading...", noData: "No data found",
    required: "is required", success: "Success!", error: "Error",
    // Landing
    callUs: "Call Us", contactUs: "Contact Us", courses: "Courses",
    toppers: "Toppers", offers: "Offers", about: "About",
    joinNow: "Join Now", learnMore: "Learn More",
    // Fees
    paid: "Paid", pending: "Pending", totalFees: "Total Fees",
    payNow: "Pay Now", paymentHistory: "Payment History",
    // Subscription  
    subscribe: "Subscribe Now", activeSubscription: "Active Subscriber!",
    subscriptionExpires: "Expires", monthlyPlan: "Monthly Plan",
    // Messages
    approvalPending: "Admin approval pending. Please wait.",
    wrongCredentials: "Incorrect ID/Email/Phone or Password!",
    otpExpired: "OTP expired! Please request again",
    passwordMismatch: "Passwords do not match!",
    minPassword: "Password must be at least 6 characters",
    emailNotFound: "No email found in account. Contact admin.",
    notRegistered: "This ID/Phone/Email is not registered",
    tooManyAttempts: "Too many attempts!",
    waitMinutes: "min wait required.",
  },
  hi: {
    login: "लॉगिन", logout: "लॉगआउट", signup: "साइन अप", register: "रजिस्टर",
    student: "छात्र", teacher: "शिक्षक", admin: "व्यवस्थापक",
    password: "पासवर्ड", email: "ईमेल", phone: "फ़ोन",
    enterPassword: "पासवर्ड डालें", enterEmail: "वैध ईमेल डालें",
    forgotPassword: "पासवर्ड भूल गए?", resetPassword: "पासवर्ड रीसेट करें",
    sendOtp: "मेरी ईमेल पर OTP भेजें", verifyOtp: "OTP सत्यापित करें",
    resendOtp: "OTP दोबारा भेजें", otpSent: "OTP भेजा गया",
    loginBtn: "पासवर्ड जांचें → OTP आएगा",
    verifyLogin: "सत्यापित करें & लॉगिन", backToLogin: "लॉगिन पर वापस",
    newPassword: "नया पासवर्ड", confirmPassword: "पासवर्ड की पुष्टि करें",
    passwordUpdated: "पासवर्ड सफलतापूर्वक रीसेट हुआ!",
    dashboard: "डैशबोर्ड", home: "होम", profile: "प्रोफ़ाइल",
    liveClasses: "लाइव क्लासेस", attendance: "उपस्थिति",
    schedule: "समय-सारणी", fees: "फ़ीस", notices: "सूचनाएं",
    batches: "बैच", students: "छात्र", teachers: "शिक्षक",
    reports: "रिपोर्ट", settings: "सेटिंग्स", subscription: "सदस्यता",
    save: "सेव करें", cancel: "रद्द करें", edit: "संपादित करें", delete: "हटाएं",
    add: "जोड़ें", update: "अपडेट करें", submit: "सबमिट करें", search: "खोजें",
    approve: "स्वीकृत करें", reject: "अस्वीकृत करें", back: "वापस जाएं",
    loading: "लोड हो रहा है...", noData: "कोई डेटा नहीं मिला",
    required: "आवश्यक है", success: "सफलता!", error: "त्रुटि",
    callUs: "हमें कॉल करें", contactUs: "संपर्क करें", courses: "कोर्स",
    toppers: "टॉपर्स", offers: "ऑफर", about: "हमारे बारे में",
    joinNow: "अभी जुड़ें", learnMore: "और जानें",
    paid: "भुगतान हो गया", pending: "बकाया", totalFees: "कुल फ़ीस",
    payNow: "अभी भुगतान करें", paymentHistory: "भुगतान इतिहास",
    subscribe: "अभी सदस्यता लें", activeSubscription: "सक्रिय सदस्य!",
    subscriptionExpires: "समाप्ति", monthlyPlan: "मासिक योजना",
    approvalPending: "व्यवस्थापक की स्वीकृति प्रतीक्षित है।",
    wrongCredentials: "गलत ID/ईमेल/फ़ोन या पासवर्ड!",
    otpExpired: "OTP की समय सीमा समाप्त! कृपया दोबारा अनुरोध करें",
    passwordMismatch: "पासवर्ड मेल नहीं खाते!",
    minPassword: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए",
    emailNotFound: "खाते में ईमेल नहीं है। व्यवस्थापक से संपर्क करें।",
    notRegistered: "यह ID/फ़ोन/ईमेल पंजीकृत नहीं है",
    tooManyAttempts: "बहुत अधिक प्रयास!",
    waitMinutes: "मिनट प्रतीक्षा करें।",
  },
  ta: {
    login: "உள்நுழைய", logout: "வெளியேறு", signup: "பதிவு செய்க", register: "பதிவு",
    student: "மாணவர்", teacher: "ஆசிரியர்", admin: "நிர்வாகி",
    password: "கடவுச்சொல்", email: "மின்னஞ்சல்", phone: "தொலைபேசி",
    enterPassword: "கடவுச்சொல் உள்ளிடவும்", enterEmail: "சரியான மின்னஞ்சல் உள்ளிடவும்",
    forgotPassword: "கடவுச்சொல் மறந்தீர்களா?", resetPassword: "கடவுச்சொல் மீட்டமைக்க",
    sendOtp: "என் மின்னஞ்சலுக்கு OTP அனுப்பு", verifyOtp: "OTP சரிபார்க்க",
    resendOtp: "OTP மீண்டும் அனுப்பு", otpSent: "OTP அனுப்பப்பட்டது",
    loginBtn: "கடவுச்சொல் சரிபார்க்க → OTP வரும்",
    verifyLogin: "சரிபார்த்து உள்நுழைய", backToLogin: "உள்நுழைவுக்கு திரும்பு",
    newPassword: "புதிய கடவுச்சொல்", confirmPassword: "கடவுச்சொல் உறுதிப்படுத்தவும்",
    passwordUpdated: "கடவுச்சொல் மீட்டமைக்கப்பட்டது!",
    dashboard: "டாஷ்போர்டு", home: "முகப்பு", profile: "சுயவிவரம்",
    liveClasses: "நேரடி வகுப்புகள்", attendance: "வருகை",
    schedule: "அட்டவணை", fees: "கட்டணம்", notices: "அறிவிப்புகள்",
    batches: "தொகுதிகள்", students: "மாணவர்கள்", teachers: "ஆசிரியர்கள்",
    reports: "அறிக்கைகள்", settings: "அமைப்புகள்", subscription: "சந்தா",
    save: "சேமி", cancel: "ரத்து", edit: "திருத்து", delete: "நீக்கு",
    add: "சேர்", update: "புதுப்பி", submit: "சமர்ப்பி", search: "தேடு",
    approve: "ஒப்புகொள்", reject: "நிராகரி", back: "திரும்பு",
    loading: "ஏற்றுகிறது...", noData: "தரவு இல்லை",
    required: "தேவை", success: "வெற்றி!", error: "பிழை",
    callUs: "அழைக்கவும்", contactUs: "தொடர்பு கொள்ளவும்", courses: "படிப்புகள்",
    toppers: "டாப்பர்கள்", offers: "சலுகைகள்", about: "பற்றி",
    joinNow: "இப்போது சேரவும்", learnMore: "மேலும் அறிய",
    paid: "செலுத்தப்பட்டது", pending: "நிலுவை", totalFees: "மொத்த கட்டணம்",
    payNow: "இப்போது செலுத்து", paymentHistory: "கட்டண வரலாறு",
    subscribe: "இப்போது சந்தா செய்க", activeSubscription: "சந்தாதாரர்!",
    subscriptionExpires: "காலாவதி", monthlyPlan: "மாதாந்திர திட்டம்",
    approvalPending: "நிர்வாகி ஒப்புதல் நிலுவையில் உள்ளது.",
    wrongCredentials: "தவறான ID/மின்னஞ்சல்/தொலைபேசி அல்லது கடவுச்சொல்!",
    otpExpired: "OTP காலாவதியானது! மீண்டும் கோரவும்",
    passwordMismatch: "கடவுச்சொற்கள் பொருந்தவில்லை!",
    minPassword: "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்",
    emailNotFound: "கணக்கில் மின்னஞ்சல் இல்லை. நிர்வாகியை தொடர்புகொள்ளவும்.",
    notRegistered: "இந்த ID/தொலைபேசி/மின்னஞ்சல் பதிவு செய்யப்படவில்லை",
    tooManyAttempts: "அதிகமான முயற்சிகள்!",
    waitMinutes: "நிமிட காத்திருப்பு.",
  },
  te: {
    login: "లాగిన్", logout: "లాగ్అవుట్", signup: "సైన్ అప్", register: "నమోదు",
    student: "విద్యార్థి", teacher: "ఉపాధ్యాయుడు", admin: "నిర్వాహకుడు",
    password: "పాస్‌వర్డ్", email: "ఇమెయిల్", phone: "ఫోన్",
    enterPassword: "పాస్‌వర్డ్ నమోదు చేయండి", enterEmail: "చెల్లుబాటు అయ్యే ఇమెయిల్ నమోదు చేయండి",
    forgotPassword: "పాస్‌వర్డ్ మర్చిపోయారా?", resetPassword: "పాస్‌వర్డ్ రీసెట్ చేయండి",
    sendOtp: "నా ఇమెయిల్‌కు OTP పంపండి", verifyOtp: "OTP ధృవీకరించండి",
    resendOtp: "OTP మళ్ళీ పంపండి", otpSent: "OTP పంపబడింది",
    loginBtn: "పాస్‌వర్డ్ ధృవీకరించు → OTP వస్తుంది",
    verifyLogin: "ధృవీకరించు & లాగిన్", backToLogin: "లాగిన్‌కు తిరిగి",
    newPassword: "కొత్త పాస్‌వర్డ్", confirmPassword: "పాస్‌వర్డ్ నిర్ధారించండి",
    passwordUpdated: "పాస్‌వర్డ్ విజయవంతంగా రీసెట్ అయింది!",
    dashboard: "డాష్‌బోర్డ్", home: "హోమ్", profile: "ప్రొఫైల్",
    liveClasses: "లైవ్ తరగతులు", attendance: "హాజరు",
    schedule: "షెడ్యూల్", fees: "రుసుము", notices: "నోటీసులు",
    batches: "బ్యాచ్‌లు", students: "విద్యార్థులు", teachers: "ఉపాధ్యాయులు",
    reports: "నివేదికలు", settings: "సెట్టింగ్‌లు", subscription: "చందా",
    save: "సేవ్", cancel: "రద్దు", edit: "సవరించు", delete: "తొలగించు",
    add: "జోడించు", update: "నవీకరించు", submit: "సమర్పించు", search: "వెతకండి",
    approve: "అంగీకరించు", reject: "తిరస్కరించు", back: "వెనక్కి",
    loading: "లోడ్ అవుతోంది...", noData: "డేటా కనుగొనబడలేదు",
    required: "అవసరం", success: "విజయం!", error: "లోపం",
    callUs: "మాకు కాల్ చేయండి", contactUs: "సంప్రదించండి", courses: "కోర్సులు",
    toppers: "టాపర్లు", offers: "ఆఫర్లు", about: "గురించి",
    joinNow: "ఇప్పుడే చేరండి", learnMore: "మరింత తెలుసుకోండి",
    paid: "చెల్లించబడింది", pending: "పెండింగ్", totalFees: "మొత్తం రుసుము",
    payNow: "ఇప్పుడు చెల్లించండి", paymentHistory: "చెల్లింపు చరిత్ర",
    subscribe: "ఇప్పుడే సభ్యత్వం తీసుకోండి", activeSubscription: "యాక్టివ్ సభ్యుడు!",
    subscriptionExpires: "గడువు", monthlyPlan: "నెలవారీ ప్లాన్",
    approvalPending: "నిర్వాహకుడి అనుమతి పెండింగ్‌లో ఉంది.",
    wrongCredentials: "తప్పు ID/ఇమెయిల్/ఫోన్ లేదా పాస్‌వర్డ్!",
    otpExpired: "OTP గడువు ముగిసింది! మళ్ళీ అభ్యర్థించండి",
    passwordMismatch: "పాస్‌వర్డ్‌లు సరిపోలడం లేదు!",
    minPassword: "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి",
    emailNotFound: "ఖాతాలో ఇమెయిల్ లేదు. నిర్వాహకుడిని సంప్రదించండి.",
    notRegistered: "ఈ ID/ఫోన్/ఇమెయిల్ నమోదు కాలేదు",
    tooManyAttempts: "చాలా ఎక్కువ ప్రయత్నాలు!",
    waitMinutes: "నిమిషాల వేచి.",
  },
  ml: {
    login: "ലോഗിൻ", logout: "ലോഗ് ഔട്ട്", signup: "സൈൻ അപ്", register: "രജിസ്റ്റർ",
    student: "വിദ്യാർത്ഥി", teacher: "അദ്ധ്യാപകൻ", admin: "അഡ്മിൻ",
    password: "പാസ്‌വേഡ്", email: "ഇമെയിൽ", phone: "ഫോൺ",
    enterPassword: "പാസ്‌വേഡ് നൽകുക", enterEmail: "സാധുവായ ഇമെയിൽ നൽകുക",
    forgotPassword: "പാസ്‌വേഡ് മറന്നോ?", resetPassword: "പാസ്‌വേഡ് പുനഃസജ്ജമാക്കുക",
    sendOtp: "എന്റെ ഇമെയിലിലേക്ക് OTP അയക്കുക", verifyOtp: "OTP സ്ഥിരീകരിക്കുക",
    resendOtp: "OTP വീണ്ടും അയക്കുക", otpSent: "OTP അയച്ചു",
    loginBtn: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക → OTP വരും",
    verifyLogin: "സ്ഥിരീകരിക്കുക & ലോഗിൻ", backToLogin: "ലോഗിനിലേക്ക് തിരിച്ച്",
    newPassword: "പുതിയ പാസ്‌വേഡ്", confirmPassword: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക",
    passwordUpdated: "പാസ്‌വേഡ് വിജയകരമായി പുനഃസജ്ജമാക്കി!",
    dashboard: "ഡാഷ്‌ബോർഡ്", home: "ഹോം", profile: "പ്രൊഫൈൽ",
    liveClasses: "തത്സമയ ക്ലാസുകൾ", attendance: "ഹാജർ",
    schedule: "ഷെഡ്യൂൾ", fees: "ഫീസ്", notices: "അറിയിപ്പുകൾ",
    batches: "ബാച്ചുകൾ", students: "വിദ്യാർത്ഥികൾ", teachers: "അദ്ധ്യാപകർ",
    reports: "റിപ്പോർട്ടുകൾ", settings: "ക്രമീകരണങ്ങൾ", subscription: "സബ്സ്ക്രിപ്ഷൻ",
    save: "സേവ്", cancel: "റദ്ദാക്കുക", edit: "എഡിറ്റ്", delete: "ഇല്ലാതാക്കുക",
    add: "ചേർക്കുക", update: "അപ്ഡേറ്റ്", submit: "സമർപ്പിക്കുക", search: "തിരയുക",
    approve: "അംഗീകരിക്കുക", reject: "നിരസിക്കുക", back: "തിരിച്ച്",
    loading: "ലോഡ് ചെയ്യുന്നു...", noData: "ഡാറ്റ കണ്ടെത്തിയില്ല",
    required: "ആവശ്യമാണ്", success: "വിജയം!", error: "പിശക്",
    callUs: "ഞങ്ങളെ വിളിക്കുക", contactUs: "ബന്ധപ്പെടുക", courses: "കോഴ്സുകൾ",
    toppers: "ടോപ്പർമാർ", offers: "ഓഫറുകൾ", about: "ഞങ്ങളെ കുറിച്ച്",
    joinNow: "ഇപ്പോൾ ചേരുക", learnMore: "കൂടുതൽ അറിയുക",
    paid: "അടച്ചു", pending: "കുടിശ്ശിക", totalFees: "ആകെ ഫീസ്",
    payNow: "ഇപ്പോൾ അടയ്ക്കുക", paymentHistory: "പേയ്‌മെന്റ് ചരിത്രം",
    subscribe: "ഇപ്പോൾ സബ്സ്ക്രൈബ് ചെയ്യുക", activeSubscription: "സജീവ അംഗം!",
    subscriptionExpires: "കാലഹരണം", monthlyPlan: "മാസ പ്ലാൻ",
    approvalPending: "അഡ്മിൻ അനുമതി തീർപ്പുകൽപ്പിക്കാത്തതാണ്.",
    wrongCredentials: "തെറ്റായ ID/ഇമെയിൽ/ഫോൺ അല്ലെങ്കിൽ പാസ്‌വേഡ്!",
    otpExpired: "OTP കാലഹരണപ്പെട്ടു! വീണ്ടും അഭ്യർത്ഥിക്കുക",
    passwordMismatch: "പാസ്‌വേഡുകൾ പൊരുത്തപ്പെടുന്നില്ല!",
    minPassword: "പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ആയിരിക്കണം",
    emailNotFound: "അക്കൗണ്ടിൽ ഇമെയിൽ ഇല്ല. അഡ്മിനെ ബന്ധപ്പെടുക.",
    notRegistered: "ഈ ID/ഫോൺ/ഇമെയിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല",
    tooManyAttempts: "വളരെ കൂടുതൽ ശ്രമങ്ങൾ!",
    waitMinutes: "മിനിറ്റ് കാത്തിരിക്കുക.",
  },
  mr: {
    login: "लॉगिन", logout: "लॉगआउट", signup: "नोंदणी", register: "नोंदणी",
    student: "विद्यार्थी", teacher: "शिक्षक", admin: "प्रशासक",
    password: "पासवर्ड", email: "ईमेल", phone: "फोन",
    enterPassword: "पासवर्ड टाका", enterEmail: "वैध ईमेल टाका",
    forgotPassword: "पासवर्ड विसरलात?", resetPassword: "पासवर्ड रीसेट करा",
    sendOtp: "माझ्या ईमेलवर OTP पाठवा", verifyOtp: "OTP सत्यापित करा",
    resendOtp: "OTP पुन्हा पाठवा", otpSent: "OTP पाठवला",
    loginBtn: "पासवर्ड तपासा → OTP येईल",
    verifyLogin: "सत्यापित करा & लॉगिन", backToLogin: "लॉगिनवर परत",
    newPassword: "नवीन पासवर्ड", confirmPassword: "पासवर्ड पुष्टी करा",
    passwordUpdated: "पासवर्ड यशस्वीरित्या रीसेट झाला!",
    dashboard: "डॅशबोर्ड", home: "होम", profile: "प्रोफाइल",
    liveClasses: "थेट वर्ग", attendance: "उपस्थिती",
    schedule: "वेळापत्रक", fees: "फी", notices: "सूचना",
    batches: "बॅच", students: "विद्यार्थी", teachers: "शिक्षक",
    reports: "अहवाल", settings: "सेटिंग्ज", subscription: "सदस्यता",
    save: "जतन करा", cancel: "रद्द करा", edit: "संपादन", delete: "हटवा",
    add: "जोडा", update: "अद्यतनित करा", submit: "सादर करा", search: "शोधा",
    approve: "मंजूर करा", reject: "नाकारा", back: "मागे",
    loading: "लोड होत आहे...", noData: "डेटा सापडला नाही",
    required: "आवश्यक", success: "यश!", error: "त्रुटी",
    callUs: "आम्हाला कॉल करा", contactUs: "संपर्क करा", courses: "अभ्यासक्रम",
    toppers: "टॉपर्स", offers: "ऑफर", about: "आमच्याबद्दल",
    joinNow: "आत्ता सामील व्हा", learnMore: "अधिक जाणून घ्या",
    paid: "भरले", pending: "प्रलंबित", totalFees: "एकूण फी",
    payNow: "आता भरा", paymentHistory: "पेमेंट इतिहास",
    subscribe: "आत्ता सदस्यता घ्या", activeSubscription: "सक्रिय सदस्य!",
    subscriptionExpires: "कालबाह्य", monthlyPlan: "मासिक योजना",
    approvalPending: "प्रशासक मंजुरी प्रलंबित आहे.", wrongCredentials: "चुकीचा ID/ईमेल/फोन किंवा पासवर्ड!",
    otpExpired: "OTP कालबाह्य! पुन्हा विनंती करा", passwordMismatch: "पासवर्ड जुळत नाहीत!",
    minPassword: "पासवर्ड किमान 6 अक्षरांचा असावा", emailNotFound: "खात्यात ईमेल नाही. प्रशासकाशी संपर्क करा.",
    notRegistered: "हा ID/फोन/ईमेल नोंदणीकृत नाही", tooManyAttempts: "खूप जास्त प्रयत्न!", waitMinutes: "मिनिट थांबा.",
  },
  bn: {
    login: "লগইন", logout: "লগআউট", signup: "সাইন আপ", register: "নিবন্ধন",
    student: "শিক্ষার্থী", teacher: "শিক্ষক", admin: "প্রশাসক",
    password: "পাসওয়ার্ড", email: "ইমেইল", phone: "ফোন",
    enterPassword: "পাসওয়ার্ড লিখুন", enterEmail: "সঠিক ইমেইল লিখুন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?", resetPassword: "পাসওয়ার্ড রিসেট করুন",
    sendOtp: "আমার ইমেইলে OTP পাঠান", verifyOtp: "OTP যাচাই করুন",
    resendOtp: "OTP আবার পাঠান", otpSent: "OTP পাঠানো হয়েছে",
    loginBtn: "পাসওয়ার্ড যাচাই → OTP আসবে",
    verifyLogin: "যাচাই করুন ও লগইন", backToLogin: "লগইনে ফিরুন",
    newPassword: "নতুন পাসওয়ার্ড", confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
    passwordUpdated: "পাসওয়ার্ড সফলভাবে রিসেট হয়েছে!",
    dashboard: "ড্যাশবোর্ড", home: "হোম", profile: "প্রোফাইল",
    liveClasses: "লাইভ ক্লাস", attendance: "উপস্থিতি",
    schedule: "সময়সূচি", fees: "ফি", notices: "নোটিশ",
    batches: "ব্যাচ", students: "শিক্ষার্থীরা", teachers: "শিক্ষকরা",
    reports: "রিপোর্ট", settings: "সেটিংস", subscription: "সাবস্ক্রিপশন",
    save: "সেভ", cancel: "বাতিল", edit: "সম্পাদনা", delete: "মুছুন",
    add: "যোগ করুন", update: "আপডেট", submit: "জমা দিন", search: "খুঁজুন",
    approve: "অনুমোদন", reject: "প্রত্যাখ্যান", back: "ফিরুন",
    loading: "লোড হচ্ছে...", noData: "কোনো ডেটা পাওয়া যায়নি",
    required: "প্রয়োজনীয়", success: "সফল!", error: "ত্রুটি",
    callUs: "আমাদের কল করুন", contactUs: "যোগাযোগ করুন", courses: "কোর্স",
    toppers: "টপার্স", offers: "অফার", about: "আমাদের সম্পর্কে",
    joinNow: "এখনই যোগ দিন", learnMore: "আরও জানুন",
    paid: "পরিশোধিত", pending: "বকেয়া", totalFees: "মোট ফি",
    payNow: "এখনই পরিশোধ করুন", paymentHistory: "পেমেন্ট ইতিহাস",
    subscribe: "এখনই সাবস্ক্রাইব করুন", activeSubscription: "সক্রিয় সদস্য!",
    subscriptionExpires: "মেয়াদ শেষ", monthlyPlan: "মাসিক পরিকল্পনা",
    approvalPending: "অ্যাডমিন অনুমোদন বাকি।", wrongCredentials: "ভুল ID/ইমেইল/ফোন বা পাসওয়ার্ড!",
    otpExpired: "OTP মেয়াদোত্তীর্ণ! আবার অনুরোধ করুন", passwordMismatch: "পাসওয়ার্ড মেলেনি!",
    minPassword: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", emailNotFound: "অ্যাকাউন্টে ইমেইল নেই। অ্যাডমিনকে যোগাযোগ করুন।",
    notRegistered: "এই ID/ফোন/ইমেইল নিবন্ধিত নয়", tooManyAttempts: "অনেক বেশি চেষ্টা!", waitMinutes: "মিনিট অপেক্ষা করুন।",
  },
  gu: {
    login: "લૉગિન", logout: "લૉગ આઉટ", signup: "સાઇન અપ", register: "નોંધણી",
    student: "વિદ્યાર્થી", teacher: "શિક્ષક", admin: "વ્યવસ્થાપક",
    password: "પાસવર્ડ", email: "ઇમેઇલ", phone: "ફોન",
    enterPassword: "પાસવર્ડ દાખલ કરો", enterEmail: "માન્ય ઇમેઇલ દાખલ કરો",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા?", resetPassword: "પાસવર્ડ રીસેટ કરો",
    sendOtp: "મારા ઇમેઇલ પર OTP મોકલો", verifyOtp: "OTP ચકાસો",
    resendOtp: "OTP ફરીથી મોકલો", otpSent: "OTP મોકલ્યો",
    loginBtn: "પાસવર્ડ ચકાસો → OTP આવશે",
    verifyLogin: "ચકાસો & લૉગિન", backToLogin: "લૉગિન પર પાછા",
    newPassword: "નવો પાસવર્ડ", confirmPassword: "પાસવર્ડ કન્ફર્મ કરો",
    passwordUpdated: "પાસવર્ડ સફળતાપૂર્વક રીસેટ થયો!",
    dashboard: "ડૅશબોર્ડ", home: "હોમ", profile: "પ્રોફાઇલ",
    liveClasses: "લાઇવ ક્લાસ", attendance: "હાજરી",
    schedule: "સમયપત્રક", fees: "ફી", notices: "સૂચनाएं",
    batches: "બૅચ", students: "વિદ્યાર્થીઓ", teachers: "શિક્ષકો",
    reports: "અહેવાલ", settings: "સેટિંગ્સ", subscription: "સદસ્યતા",
    save: "સેવ", cancel: "રદ", edit: "સંપાદન", delete: "કાઢી નાખો",
    add: "ઉમેરો", update: "અપડેટ", submit: "સબમિટ", search: "શોધો",
    approve: "મંજૂર", reject: "નકારો", back: "પાછા",
    loading: "લોડ થઈ રહ્યું છે...", noData: "કોઈ ડેટા મળ્યો નહીં",
    required: "જરૂરી", success: "સફળ!", error: "ભૂલ",
    callUs: "અમને કૉલ કરો", contactUs: "સંપર્ક કરો", courses: "અભ્યાસક્રમ",
    toppers: "ટૉપર્સ", offers: "ઑફર", about: "અમારા વિશે",
    joinNow: "હમણાં જોડાઓ", learnMore: "વધુ જાણો",
    paid: "ચૂકવ્યું", pending: "બાકી", totalFees: "કુલ ફી",
    payNow: "હમણાં ચૂકવો", paymentHistory: "ચૂકવણી ઇતિહાસ",
    subscribe: "હમણાં સદસ્ય બનો", activeSubscription: "સક્રિય સભ્ય!",
    subscriptionExpires: "સમાપ્તિ", monthlyPlan: "માસિક યોજना",
    approvalPending: "વ્યવસ્થાપક મંજૂરી બાકી.", wrongCredentials: "ખોટું ID/ઇમેઇલ/ફોન અથવા પાસવર્ડ!",
    otpExpired: "OTP સમાપ્ત! ફરી વિનંતી કરો", passwordMismatch: "પાસવર્ડ મેળ ખાતા નથી!",
    minPassword: "પાસવર્ડ ઓછામાં ઓછો 6 અક્ષરનો હોવો જોઈએ", emailNotFound: "ખાતામાં ઇમેઇલ નથી. વ્યવસ્થાપકનો સંપર્ક કરો.",
    notRegistered: "આ ID/ફોન/ઇમેઇલ નોંધાયેલ નથી", tooManyAttempts: "ઘણા વધારે પ્રયાસ!", waitMinutes: "મિનિટ રાહ જુઓ.",
  },
  pa: {
    login: "ਲੌਗਇਨ", logout: "ਲੌਗਆਉਟ", signup: "ਸਾਈਨ ਅੱਪ", register: "ਰਜਿਸਟ੍ਰੇਸ਼ਨ",
    student: "ਵਿਦਿਆਰਥੀ", teacher: "ਅਧਿਆਪਕ", admin: "ਪ੍ਰਬੰਧਕ",
    password: "ਪਾਸਵਰਡ", email: "ਈਮੇਲ", phone: "ਫ਼ੋਨ",
    enterPassword: "ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ", enterEmail: "ਸਹੀ ਈਮੇਲ ਦਰਜ ਕਰੋ",
    forgotPassword: "ਪਾਸਵਰਡ ਭੁੱਲ ਗਏ?", resetPassword: "ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਕਰੋ",
    sendOtp: "ਮੇਰੀ ਈਮੇਲ ਤੇ OTP ਭੇਜੋ", verifyOtp: "OTP ਜਾਂਚੋ",
    resendOtp: "OTP ਦੁਬਾਰਾ ਭੇਜੋ", otpSent: "OTP ਭੇਜਿਆ",
    loginBtn: "ਪਾਸਵਰਡ ਜਾਂਚੋ → OTP ਆਵੇਗਾ",
    verifyLogin: "ਜਾਂਚੋ ਅਤੇ ਲੌਗਇਨ", backToLogin: "ਲੌਗਇਨ ਤੇ ਵਾਪਸ",
    newPassword: "ਨਵਾਂ ਪਾਸਵਰਡ", confirmPassword: "ਪਾਸਵਰਡ ਪੁਸ਼ਟੀ ਕਰੋ",
    passwordUpdated: "ਪਾਸਵਰਡ ਸਫਲਤਾਪੂਰਵਕ ਰੀਸੈੱਟ ਹੋਇਆ!",
    dashboard: "ਡੈਸ਼ਬੋਰਡ", home: "ਹੋਮ", profile: "ਪ੍ਰੋਫਾਈਲ",
    liveClasses: "ਲਾਈਵ ਕਲਾਸਾਂ", attendance: "ਹਾਜ਼ਰੀ",
    schedule: "ਸਮਾਂ-ਸੂਚੀ", fees: "ਫ਼ੀਸ", notices: "ਸੂਚਨਾਵਾਂ",
    batches: "ਬੈਚ", students: "ਵਿਦਿਆਰਥੀ", teachers: "ਅਧਿਆਪਕ",
    reports: "ਰਿਪੋਰਟਾਂ", settings: "ਸੈਟਿੰਗਜ਼", subscription: "ਸਦੱਸਤਾ",
    save: "ਸੇਵ", cancel: "ਰੱਦ", edit: "ਸੰਪਾਦਨ", delete: "ਮਿਟਾਓ",
    add: "ਜੋੜੋ", update: "ਅੱਪਡੇਟ", submit: "ਜਮ੍ਹਾਂ ਕਰੋ", search: "ਖੋਜੋ",
    approve: "ਮਨਜ਼ੂਰ", reject: "ਰੱਦ ਕਰੋ", back: "ਵਾਪਸ",
    loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...", noData: "ਕੋਈ ਡੇਟਾ ਨਹੀਂ ਮਿਲਿਆ",
    required: "ਜ਼ਰੂਰੀ", success: "ਸਫਲਤਾ!", error: "ਗਲਤੀ",
    callUs: "ਸਾਨੂੰ ਕਾਲ ਕਰੋ", contactUs: "ਸੰਪਰਕ ਕਰੋ", courses: "ਕੋਰਸ",
    toppers: "ਟੌਪਰਜ਼", offers: "ਆਫ਼ਰ", about: "ਸਾਡੇ ਬਾਰੇ",
    joinNow: "ਹੁਣੇ ਸ਼ਾਮਲ ਹੋਵੋ", learnMore: "ਹੋਰ ਜਾਣੋ",
    paid: "ਭੁਗਤਾਨ ਕੀਤਾ", pending: "ਬਕਾਇਆ", totalFees: "ਕੁੱਲ ਫ਼ੀਸ",
    payNow: "ਹੁਣੇ ਭੁਗਤਾਨ ਕਰੋ", paymentHistory: "ਭੁਗਤਾਨ ਇਤਿਹਾਸ",
    subscribe: "ਹੁਣੇ ਸਦੱਸ ਬਣੋ", activeSubscription: "ਸਰਗਰਮ ਸਦੱਸ!",
    subscriptionExpires: "ਮਿਆਦ", monthlyPlan: "ਮਾਸਿਕ ਯੋਜਨਾ",
    approvalPending: "ਪ੍ਰਬੰਧਕ ਦੀ ਮਨਜ਼ੂਰੀ ਬਾਕੀ ਹੈ।", wrongCredentials: "ਗਲਤ ID/ਈਮੇਲ/ਫ਼ੋਨ ਜਾਂ ਪਾਸਵਰਡ!",
    otpExpired: "OTP ਦੀ ਮਿਆਦ ਖਤਮ! ਦੁਬਾਰਾ ਬੇਨਤੀ ਕਰੋ", passwordMismatch: "ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ!",
    minPassword: "ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ", emailNotFound: "ਖਾਤੇ ਵਿੱਚ ਈਮੇਲ ਨਹੀਂ ਹੈ। ਪ੍ਰਬੰਧਕ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    notRegistered: "ਇਹ ID/ਫ਼ੋਨ/ਈਮੇਲ ਰਜਿਸਟਰ ਨਹੀਂ ਹੈ", tooManyAttempts: "ਬਹੁਤ ਜ਼ਿਆਦਾ ਕੋਸ਼ਿਸ਼ਾਂ!", waitMinutes: "ਮਿੰਟ ਉਡੀਕ ਕਰੋ।",
  },
  kn: {
    login: "ಲಾಗಿನ್", logout: "ಲಾಗ್ ಔಟ್", signup: "ಸೈನ್ ಅಪ್", register: "ನೋಂದಣಿ",
    student: "ವಿದ್ಯಾರ್ಥಿ", teacher: "ಶಿಕ್ಷಕ", admin: "ನಿರ್ವಾಹಕ",
    password: "ಪಾಸ್‌ವರ್ಡ್", email: "ಇಮೇಲ್", phone: "ಫೋನ್",
    enterPassword: "ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ", enterEmail: "ಮಾನ್ಯ ಇಮೇಲ್ ನಮೂದಿಸಿ",
    forgotPassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರೆತಿರಾ?", resetPassword: "ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಸಿ",
    sendOtp: "ನನ್ನ ಇಮೇಲ್‌ಗೆ OTP ಕಳುಹಿಸಿ", verifyOtp: "OTP ಪರಿಶೀಲಿಸಿ",
    resendOtp: "OTP ಮತ್ತೆ ಕಳುಹಿಸಿ", otpSent: "OTP ಕಳುಹಿಸಲಾಗಿದೆ",
    loginBtn: "ಪಾಸ್‌ವರ್ಡ್ ಪರಿಶೀಲಿಸಿ → OTP ಬರುತ್ತದೆ",
    verifyLogin: "ಪರಿಶೀಲಿಸಿ & ಲಾಗಿನ್", backToLogin: "ಲಾಗಿನ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    newPassword: "ಹೊಸ ಪಾಸ್‌ವರ್ಡ್", confirmPassword: "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    passwordUpdated: "ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಮರುಹೊಂದಿಸಲಾಗಿದೆ!",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", home: "ಹೋಮ್", profile: "ಪ್ರೊಫೈಲ್",
    liveClasses: "ನೇರ ತರಗತಿಗಳು", attendance: "ಹಾಜರಾತಿ",
    schedule: "ವೇಳಾಪಟ್ಟಿ", fees: "ಶುಲ್ಕ", notices: "ಸೂಚನೆಗಳು",
    batches: "ಬ್ಯಾಚ್‌ಗಳು", students: "ವಿದ್ಯಾರ್ಥಿಗಳು", teachers: "ಶಿಕ್ಷಕರು",
    reports: "ವರದಿಗಳು", settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", subscription: "ಚಂದಾ",
    save: "ಉಳಿಸಿ", cancel: "ರದ್ದು", edit: "ಸಂಪಾದಿಸಿ", delete: "ಅಳಿಸಿ",
    add: "ಸೇರಿಸಿ", update: "ಅಪ್‌ಡೇಟ್", submit: "ಸಲ್ಲಿಸಿ", search: "ಹುಡುಕಿ",
    approve: "ಅನುಮೋದಿಸಿ", reject: "ತಿರಸ್ಕರಿಸಿ", back: "ಹಿಂದೆ",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...", noData: "ಯಾವುದೇ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ",
    required: "ಅಗತ್ಯವಿದೆ", success: "ಯಶಸ್ಸು!", error: "ದೋಷ",
    callUs: "ನಮಗೆ ಕರೆ ಮಾಡಿ", contactUs: "ಸಂಪರ್ಕಿಸಿ", courses: "ಕೋರ್ಸ್‌ಗಳು",
    toppers: "ಟಾಪರ್‌ಗಳು", offers: "ಆಫರ್‌ಗಳು", about: "ನಮ್ಮ ಬಗ್ಗೆ",
    joinNow: "ಈಗ ಸೇರಿ", learnMore: "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
    paid: "ಪಾವತಿಸಲಾಗಿದೆ", pending: "ಬಾಕಿ", totalFees: "ಒಟ್ಟು ಶುಲ್ಕ",
    payNow: "ಈಗ ಪಾವತಿಸಿ", paymentHistory: "ಪಾವತಿ ಇತಿಹಾಸ",
    subscribe: "ಈಗ ಚಂದಾ ತೆಗೆದುಕೊಳ್ಳಿ", activeSubscription: "ಸಕ್ರಿಯ ಸದಸ್ಯ!",
    subscriptionExpires: "ಮುಕ್ತಾಯ", monthlyPlan: "ಮಾಸಿಕ ಯೋಜನೆ",
    approvalPending: "ನಿರ್ವಾಹಕ ಅನುಮೋದನೆ ಬಾಕಿ ಇದೆ.", wrongCredentials: "ತಪ್ಪು ID/ಇಮೇಲ್/ಫೋನ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್!",
    otpExpired: "OTP ಅವಧಿ ಮೀರಿದೆ! ಮತ್ತೆ ವಿನಂತಿಸಿ", passwordMismatch: "ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ!",
    minPassword: "ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಿರಬೇಕು", emailNotFound: "ಖಾತೆಯಲ್ಲಿ ಇಮೇಲ್ ಇಲ್ಲ. ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    notRegistered: "ಈ ID/ಫೋನ್/ಇಮೇಲ್ ನೋಂದಾಯಿತವಾಗಿಲ್ಲ", tooManyAttempts: "ತುಂಬಾ ಹೆಚ್ಚು ಪ್ರಯತ್ನಗಳು!", waitMinutes: "ನಿಮಿಷ ಕಾಯಿರಿ.",
  },
};

// Fill missing keys from English (fallback)
Object.keys(T).forEach(lang => {
  if (lang !== "en") Object.keys(T.en).forEach(k => { if (!T[lang][k]) T[lang][k] = T.en[k]; });
});

// ============================================================
// LANDING PAGE — fully dynamic, reads from DB
// ============================================================
const LandingPage = ({ onLogin, onDashboard, onProfile, currentUser, role }) => {
  const screenSize = useScreenSize();
  const studentClass = useStudentClass();
  // Responsive section padding
  const sectionPadding = screenSize.isMobile ? "36px 16px" : screenSize.isTablet ? "48px 24px" : "60px 32px";
  const heroSection = screenSize.isMobile ? "44px 16px 52px" : screenSize.isTablet ? "56px 24px 64px" : "70px 32px 80px";
  
  const [alumni, setAlumni] = useState([]);
  const [stats, setStats] = useState(SAMPLE_STATS);
  const [contact, setContact] = useState({ phone: "9654144974", email: "samagra.bharat.coaching@gmail.com", address: "Ghaziabad, UP, India", whatsapp: "9315622644", mapLink: "" });
  const [offers, setOffers] = useState([]);
  const [features, setFeatures] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [offerBannerIdx, setOfferBannerIdx] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [popupOffer, setPopupOffer] = useState(null);
  const [bannerAnimate, setBannerAnimate] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [playingCourse, setPlayingCourse] = useState(null);
  const [embedUrl, setEmbedUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  // Mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Footer secret-click state: click 7 times within 4s to open teacher login
  const [footerSecretCount, setFooterSecretCount] = useState(0);
  const [footerSecretLast, setFooterSecretLast] = useState(0);
  const handleFooterSecretClick = () => {
    const now = Date.now();
    const elapsed = now - (footerSecretLast || 0);
    let next = (elapsed > 4000) ? 1 : (footerSecretCount + 1);
    if (next >= 7) {
      setFooterSecretCount(0);
      setFooterSecretLast(0);
      // Use URL hash to trigger teacher-login handling in App (handled in useEffect)
      window.location.hash = '#teacher-login';
      try { addNotification?.('info', 'Secret', 'Teacher login enabled'); } catch(_){ }
      return;
    }
    setFooterSecretCount(next);
    setFooterSecretLast(now);
  };


  const getEmbedUrl = (url) => {
    if (!url) return null;
    url = url.trim();
    // All YouTube URL formats — including Unlisted
    if (url.includes("youtube.com/embed/")) return url;
    const shortsM = url.includes("shorts/") ? [null, url.split("shorts/")[1].split("?")[0].slice(0,11)] : null;
    if (shortsM) return "https://www.youtube.com/embed/" + shortsM[1] + "?autoplay=1";
    const shortM = url.includes("youtu.be/") ? [null, url.split("youtu.be/")[1].split("?")[0].slice(0,11)] : null;
    if (shortM) return "https://www.youtube.com/embed/" + shortM[1] + "?autoplay=1";
    const watchM = url.includes("v=") ? [null, url.split("v=")[1].split("&")[0].slice(0,11)] : null;
    if (watchM) return "https://www.youtube.com/embed/" + watchM[1] + "?autoplay=1";
    const plMatch = url.includes("list=") ? [null, url.split("list=")[1].split("&")[0]] : null;
    if (plMatch) return "https://www.youtube.com/embed/videoseries?list=" + plMatch[1] + "&autoplay=1";
    return null;
  };

  useEffect(() => {
    initDB();
    setAlumni(DB.get("alumni") || []);
    setStats(DB.get("stats") || SAMPLE_STATS);
    setContact(DB.get("contact") || { phone: "9654144974", email: "samagra.bharat.coaching@gmail.com", address: "Ghaziabad, UP, India", whatsapp: "9315622644", mapLink: "" });
    const savedOffers = DB.get("offers") || [];
    setOffers(savedOffers);
    const savedFeatures = DB.get("features") || [
      { id: 1, icon: "🎓", title: "Expert Faculty", desc: "M.Sc./M.A./B.Ed. qualified, 5-15 yrs exp" },
      { id: 2, icon: "📊", title: "Results", desc: "Distinction in Board every year" },
      { id: 3, icon: "📱", title: "Digital Portal", desc: "Attendance, fees, schedule sab online" },
      { id: 4, icon: "👨‍👩‍👧", title: "Small Batches", desc: "Max 40 students, personal attention" },
      { id: 5, icon: "🧪", title: "Regular Tests", desc: "Weekly + monthly unit tests" },
      { id: 6, icon: "💰", title: "Affordable Fees", desc: "Rs.1200/month se, EMI available" },
    ];
    setFeatures(savedFeatures);
    setBatches(DB.get("batches") || []);
    const urgentOffer = savedOffers.find(o => o.active && o.showPopup);
    if (urgentOffer) { setPopupOffer(urgentOffer); setTimeout(() => setShowOfferPopup(true), 1800); }
    const s = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", s);
    return () => window.removeEventListener("scroll", s);
  }, []);

  // Close the mobile menu when switching to larger screens
  useEffect(() => {
    if (!screenSize?.isMobile) setIsMenuOpen(false);
  }, [screenSize?.isMobile]);

  const activeOffers = offers.filter(o => o.active);

  // Sliding banner auto-advance
  useEffect(() => {
    if (activeOffers.length < 2) return;
    const t = setInterval(() => {
      setBannerAnimate(false);
      setTimeout(() => { setOfferBannerIdx(i => (i + 1) % activeOffers.length); setBannerAnimate(true); }, 300);
    }, 3500);
    return () => clearInterval(t);
  }, [activeOffers.length]);

  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setActiveSection(id); };
  const filteredAlumni = alumni.filter(a => {
    if (activeTab === "all") return true;
    if (activeTab === "cbse") return a.board === "CBSE" || a.stream?.toLowerCase().includes("cbse");
    if (activeTab === "state") return a.board === "State" || a.stream?.toLowerCase().includes("state");
    if (activeTab === "science") return a.stream?.toLowerCase().includes("science");
    if (activeTab === "commerce") return a.stream?.toLowerCase().includes("commerce");
    return true;
  }).sort((a, b) => b.percentage - a.percentage);

  const currentOffer = activeOffers[offerBannerIdx];

  return (
    <div style={{ background: C.bg, fontFamily: "'Segoe UI', 'Noto Sans Devanagari', sans-serif", color: C.text, minHeight: "100vh" }}>

      {/* ── OFFER POPUP MODAL ── */}
      {showOfferPopup && popupOffer && (
        <div style={{ position: "fixed", inset: 0, background: "#000000BB", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.bgCard, borderRadius: 24, maxWidth: 440, width: "100%", overflow: "hidden", boxShadow: `0 24px 80px ${popupOffer.color}44`, border: `2px solid ${popupOffer.color}55` }}>
            <div style={{ background: `linear-gradient(135deg, ${popupOffer.color}, ${popupOffer.color}BB)`, padding: "28px", textAlign: "center" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎉</div>
              {popupOffer.badge && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, padding: "4px 18px", display: "inline-block", fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 14 }}>{popupOffer.badge}</div>}
              <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>{popupOffer.title}</h2>
              <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 14, margin: 0, lineHeight: 1.65 }}>{popupOffer.desc}</p>
            </div>
            <div style={{ padding: "20px 28px 26px" }}>
              {popupOffer.validTill && <p style={{ color: C.textMuted, fontSize: 12, textAlign: "center", margin: "0 0 18px" }}>Valid till: {popupOffer.validTill}</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <a href={"tel:" + contact.phone} style={{ textDecoration: "none", flex: 1 }}>
                  <button style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${popupOffer.color}, ${popupOffer.color}CC)`, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>Call Now</button>
                </a>
                <button onClick={() => setShowOfferPopup(false)} style={{ padding: "13px 18px", borderRadius: 12, border: `1px solid ${C.border}`, background: "none", color: C.textMuted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SLIDING OFFERS BANNER (TOP) ── */}
      {activeOffers.length > 0 && currentOffer && (
        <div style={{ background: `linear-gradient(90deg, ${currentOffer.color}EE, ${currentOffer.color}BB, ${currentOffer.color}EE)`, padding: "0", overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", transition: bannerAnimate ? "opacity 0.4s ease" : "none", opacity: bannerAnimate ? 1 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
              <span style={{ background: "rgba(255,255,255,0.28)", borderRadius: 99, padding: "3px 14px", fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{currentOffer.badge || "OFFER"}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{currentOffer.title}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", display: "none", "@media(min-width:600px)": { display: "inline" } }}> — {currentOffer.desc}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              {activeOffers.length > 1 && (
                <div style={{ display: "flex", gap: 4 }}>
                  {activeOffers.map((_, i) => (
                    <button key={i} onClick={() => setOfferBannerIdx(i)} style={{ width: i === offerBannerIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === offerBannerIdx ? "#fff" : "rgba(255,255,255,0.4)", border: "none", cursor: "pointer", transition: "width 0.3s" }} />
                  ))}
                </div>
              )}
              <a href={"tel:" + contact.phone} style={{ textDecoration: "none" }}>
                <button style={{ padding: "5px 14px", borderRadius: 8, border: "2px solid rgba(255,255,255,0.6)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Call Now</button>
              </a>
              <button onClick={() => setShowOfferPopup(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, width: "100%", zIndex: 9999, padding: "12px 28px", background: scrolled ? C.bgCard + "F2" : "transparent", backdropFilter: "blur(16px)", borderBottom: scrolled ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.3s", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#111", boxShadow: `0 4px 20px ${C.primary}55` }}>SBC</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: C.text, lineHeight: 1.2 }}>Samagra Bharat</div>
            <div style={{ fontSize: 10, color: C.primary, fontWeight: 600 }}>Coaching Classes</div>
          </div>
        </div>
        {/* Responsive links: horizontal on desktop, hamburger on mobile */}
        {screenSize?.isMobile ? (
          <div style={{ position: "relative" }}>
            <button onClick={() => setIsMenuOpen(o => !o)} aria-label={isMenuOpen ? "Close menu" : "Open menu"} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, fontSize: 20, color: C.text }}>
              {isMenuOpen ? "✕" : "☰"}
            </button>
            {isMenuOpen && (
              <div style={{ position: "absolute", top: 56, right: 12, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 6, zIndex: 10001, minWidth: 160 }}>
                <div style={{ padding: '6px 8px' }}><LangSwitcher /></div>
                {[ ["home","Home"],["offers",t("offers")||"Offers"],["courses",t("courses")||"Courses"],["batches",t("batches")||"Batches"] ].map(([id, label]) => (
                  <button key={id} onClick={() => { scrollTo(id); setIsMenuOpen(false); }} style={{ background: "none", border: "none", textAlign: "left", cursor: "pointer", padding: "8px 10px", borderRadius: 8, fontSize: 14, fontWeight: 700, color: activeSection === id ? C.primary : C.text }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {[["home","Home"],["offers",t("offers")||"Offers"],["courses",t("courses")||"Courses"],["batches",t("batches")||"Batches"],["toppers",t("toppers")||"Toppers"],["about",t("about")||"About"],["contact",t("contactUs")||"Contact"]].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 11px", borderRadius: 8, fontSize: 12, fontWeight: 600, color: activeSection === id ? C.primary : C.textMuted, borderBottom: activeSection === id ? `2px solid ${C.primary}` : "2px solid transparent" }}>{label}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {currentUser ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!screenSize?.isMobile && <LangSwitcher />}
              {/* Profile circle — initials, click = dashboard */}
              <div title={currentUser?.name || "Click to view Profile"} onClick={onProfile||onDashboard}
                style={{ width:38, height:38, borderRadius:"50%", cursor:"pointer",
                  background:`linear-gradient(135deg,${role==="teacher"?C.info:role==="admin"?C.danger:C.success},${role==="teacher"?C.primary:role==="admin"?C.warning:C.success}88)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:900, fontSize:13, color:"#fff", border:"2px solid rgba(255,255,255,0.2)",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.3)", flexShrink:0 }}>
                {(currentUser?.name||currentUser?.id||"U").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)}
              </div>
            </div>
          ) : (
            <>
              {!screenSize?.isMobile && <LangSwitcher />}
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ marginTop: "70px", padding: heroSection, textAlign: "center", position: "relative", backgroundImage: `radial-gradient(ellipse 70% 50% at 50% 0%, ${C.primary}18 0%, transparent 70%)`, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 20% 80%, ${C.gold}08 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${C.primary}08 0%, transparent 50%)`, pointerEvents: "none" }} />
        <div style={{ display: "inline-block", background: `${C.gold}18`, border: `1px solid ${C.gold}44`, borderRadius: 99, padding: "6px 20px", fontSize: 13, color: C.gold, fontWeight: 700, marginBottom: 24 }}>Founder & CEO Amit Kumar</div>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 60px)", fontWeight: 900, margin: "0 0 16px", background: `linear-gradient(135deg, ${C.text} 40%, ${C.primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.15, letterSpacing: -1 }}>Samagra Bharat<br />Coaching Classes</h1>
        <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: C.textMuted, maxWidth: 550, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Class 6th to 12th — CBSE &amp; State Board<br />
          <strong style={{ color: C.text }}>{stats.years}+ years of experience &middot; {stats.students}+ students &middot; {stats.results}% results</strong>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {currentUser
            ? <Btn variant="primary" size="lg" onClick={() => onLogin("student")}>Student Portal</Btn>
            : <Btn variant="primary" size="lg" onClick={() => onLogin("student")}>Student Portal</Btn>
          }
          <a href={"tel:" + contact.phone} style={{ textDecoration: "none" }}>
            <Btn variant="gold" size="lg">Call: {contact.phone}</Btn>
          </a>
          {activeOffers.length > 0 && <Btn variant="outline" size="lg" onClick={() => scrollTo("offers")}>Offers ({activeOffers.length})</Btn>}
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 52 }}>
          {[{ val: stats.students + "+", label: "Students" }, { val: stats.results + "%", label: "Board Results" }, { val: stats.years + "+", label: "Years" }, { val: stats.toppers + "+", label: t("toppers")||"Toppers" }].map((s, i) => (
            <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 24px", textAlign: "center", minWidth: 100 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: C.primary }}>{s.val}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OFFERS CARDS SECTION ── */}
      {activeOffers.length > 0 && (
        <section id="offers" style={{ padding: "50px 32px", background: `linear-gradient(135deg, ${C.bgCard}AA, ${C.bgCard2}AA)` }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 12, color: C.warning, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>LIMITED TIME</div>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: C.text, margin: 0 }}>Special Offers &amp; Discounts</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
            {activeOffers.map(offer => (
              <div key={offer.id} style={{ borderRadius: 20, overflow: "hidden", border: `1px solid ${offer.color}44`, boxShadow: `0 8px 32px ${offer.color}18`, transition: "transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                <div style={{ background: `linear-gradient(135deg, ${offer.color}, ${offer.color}CC)`, padding: "22px 24px" }}>
                  {offer.badge && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 99, padding: "3px 14px", display: "inline-block", fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 12 }}>{offer.badge}</div>}
                  <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 900, margin: "0 0 8px" }}>{offer.title}</h3>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{offer.desc}</p>
                </div>
                <div style={{ background: C.bgCard, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{offer.validTill ? "Valid till: " + offer.validTill : ""}</span>
                  <a href={"tel:" + contact.phone} style={{ textDecoration: "none" }}>
                    <button style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: offer.color, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Call Now</button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TOPPERS / ALUMNI ── */}
      <section id="toppers" style={{ padding: sectionPadding, background: C.bgCard + "88" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>OUR STAR PERFORMERS</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 900, color: C.text, margin: "0 0 12px" }}>Toppers &amp; Alumni</h2>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32, flexWrap: "wrap" }}>
          {[["all","All"],["cbse","CBSE"],["state","State Board"],["science","Science"],["commerce","Commerce"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "8px 18px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: activeTab === key ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : C.bgCard2, color: activeTab === key ? "#fff" : C.textMuted }}>{label}</button>
          ))}
        </div>
        {filteredAlumni.length === 0
          ? <div style={{ textAlign: "center", padding: "48px", color: C.textMuted }}><div style={{ fontSize: 44 }}>🏆</div><div style={{ marginTop: 14, fontWeight: 700, color: C.text }}>No alumni found</div></div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
              {filteredAlumni.map((a, i) => (
                <div key={a.id} style={{ background: C.bgCard, border: `1px solid ${i < 3 ? C.gold + "55" : C.border}`, borderRadius: 20, overflow: "hidden", boxShadow: i < 3 ? `0 0 24px ${C.gold}15` : "none", transition: "transform 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                  <div style={{ height: 130, background: a.photo ? "none" : `linear-gradient(135deg, ${a.color}33, ${a.color}11)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {a.photo
                      ? <img src={a.photo} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }}/>
                      : <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${a.color}, ${a.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 24, color: "#fff", border: `3px solid ${a.color}55` }}>{a.initials}</div>
                    }
                    {i < 3 && <div style={{ position: "absolute", top: 8, right: 8, background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`, borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#111" }}>#{i + 1}</div>}
                    <div style={{ position: "absolute", bottom: 8, left: 8, background: a.color + "EE", borderRadius: 99, padding: "3px 10px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{a.percentage}%</div>
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 3 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: a.color, fontWeight: 700, marginBottom: 5 }}>{a.stream} &middot; {a.batch}</div>
                    {a.college && <div style={{ fontSize: 11, color: C.textMuted }}>🎓 {a.college}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </section>

      {/* ── BATCHES ── */}
      <section id="batches" style={{ padding: sectionPadding }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>ADMISSIONS OPEN</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 38px)", fontWeight: 900, color: C.text, margin: 0 }}>Available Batches</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
           {batches.map(b => (
            <div key={b.id} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, padding: 22, transition: "transform 0.2s, border-color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = C.primary + "55"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = C.border; }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{b.name}</div>
                <Badge text={b.board} type={b.board === "CBSE" ? "primary" : "warning"} />
              </div>
              {[["Time", b.time], ["Days", b.days], ["Teacher", b.teacher], ["Fees", b.fees + "/month"]].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: 8, fontSize: 13, color: C.textMuted, marginBottom: 6 }}><span style={{ color: C.textDim, minWidth: 52 }}>{label}</span><span>{val}</span></div>
              ))}
              <div style={{ marginTop:14, display:"flex", gap:8 }}>
                <a href={contact?.phone ? "tel:" + contact.phone : "#"} style={{ textDecoration:"none", flex:1 }}>
                  <Btn variant="ghost" style={{ width:"100%" }}>📞 Enquire</Btn>
                </a>
                <Btn variant="primary" style={{ flex:1 }} onClick={()=>{ if(!currentUser) setShowLoginPrompt(true); else onDashboard(); }}>
                  {currentUser ? "My Dashboard →" : "Enroll Now →"}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── YOUTUBE PLAYLIST / COURSES ── */}
      {(() => {
        const playlist = DB.get("youtubePlaylist") || [];
        const appCourses = DB.get("appCourses") || [];
        const displayList = playlist;
        return (
          <section id="courses" style={{ padding: sectionPadding, background:C.bgCard+"66" }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ fontSize:12, color:"#FF0000", fontWeight:700, letterSpacing:2, marginBottom:10 }}>▶️ FREE VIDEO LESSONS</div>
              <h2 style={{ fontSize:"clamp(22px, 4vw, 36px)", fontWeight:900, color:C.text, margin:"0 0 10px" }}>Courses &amp; Playlists</h2>
              <p style={{ color:C.textMuted, fontSize:14, margin:0 }}>
                {currentUser ? "Watch directly in the app — no YouTube redirect!" : "Login to watch courses inside the app"}
              </p>
            </div>
            {/* Empty state */}
            {displayList.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", maxWidth:500, margin:"0 auto" }}>
                <div style={{ fontSize:52, marginBottom:12 }}>📚</div>
                <p style={{ color:C.textMuted, fontSize:14, marginBottom:16 }}>
                  {currentUser ? "Courses coming soon! Admin se contact karein." : "Login karein to access all courses & recordings"}
                </p>
                {!currentUser && (
                  <button onClick={()=>onLogin("student")} style={{ padding:"12px 28px", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                    Login / Sign Up →
                  </button>
                )}
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(270px, 1fr))", gap:16, maxWidth:1100, margin:"0 auto" }}>
              {displayList.map(item => {
                const embedUrl = getEmbedUrl(item.url);
                return (
                  <div key={item.id} style={{ background:C.bgCard, border:"1px solid "+C.border, borderRadius:18, overflow:"hidden", transition:"transform 0.2s, box-shadow 0.2s", cursor:"pointer" }}
                    onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 8px 32px ${C.primary}22`; }}
                    onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
                    onClick={()=>{ if(!currentUser){ setShowLoginPrompt(true); } else { setPlayingCourse({...item, embedUrl}); } }}>
                    {/* Thumbnail */}
                    <div style={{ position:"relative" }}>
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} style={{ width:"100%", height:160, objectFit:"cover", display:"block" }} onError={e=>{ e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                      ) : null}
                      <div style={{ height:item.thumbnail?0:140, background:"linear-gradient(135deg, #FF000022, #FF000011)", display:item.thumbnail?"none":"flex", alignItems:"center", justifyContent:"center", fontSize:52 }}>▶️</div>
                      {/* Play button overlay */}
                      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.15)" }}>
                        <div style={{ width:56, height:56, borderRadius:"50%", background:currentUser?"rgba(255,0,0,0.92)":"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:"0 4px 16px rgba(0,0,0,0.4)" }}>
                          {currentUser ? "▶" : "🔒"}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:4 }}>{item.title}</div>
                      {item.desc && <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5, marginBottom:8 }}>{item.desc}</div>}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        {item.videos && <div style={{ fontSize:11, color:"#FF0000", fontWeight:700 }}>▶️ {item.videos} videos</div>}
                        <div style={{ fontSize:11, color:currentUser?C.success:C.textMuted, fontWeight:700 }}>
                          {currentUser ? "▶ Watch Now" : "🔒 Login to Watch"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {!currentUser && (
              <div style={{ textAlign:"center", marginTop:28 }}>
                <Btn variant="primary" size="lg" onClick={()=>setShowLoginPrompt(true)}>
                  🎓 Login to Access All Courses
                </Btn>
              </div>
            )}
          </section>
        );
      })()}

      {/* ── WHY SBC ── */}
      <section id="about" style={{ padding: sectionPadding, background: C.bgCard + "66" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: C.text, margin: 0 }}>Why Choose SBC Classes?</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
          {features.length > 0 ? features.map((item, i) => (
            <div key={item.id || i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{item.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text, marginBottom: 7 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          )) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: C.textMuted, fontSize: 14 }}>👨‍💼 Features coming soon! Admin is setting up...</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: sectionPadding }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: C.text, margin: "0 0 10px" }}>Contact Us</h2>
          <p style={{ color: C.textMuted, fontSize: 14 }}>For admission or any queries, contact us</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, maxWidth: 900, margin: "0 auto 36px" }}>
          {[{ icon: "📞", label: "Phone", value: contact.phone, href: "tel:" + contact.phone, color: C.success },
            { icon: "💬", label: "WhatsApp", value: contact.whatsapp, href: "https://wa.me/91" + contact.whatsapp, color: "#25D366" },
            { icon: "✉️", label: "Email", value: contact.email, href: "mailto:" + contact.email, color: C.info },
            { icon: "📍", label: "Address", value: contact.address, href: contact.mapLink || "#", color: C.warning }
          ].map((item, i) => (
            <a key={i} href={item.href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center", transition: "border-color 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            </a>
          ))}
        </div>
        {contact.mapLink && (
          <div style={{ maxWidth: 900, margin: "0 auto", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}` }}>
            <iframe src={contact.mapLink} width="100%" height="280" style={{ border: 0, display: "block" }} allowFullScreen loading="lazy" title="Map" />
          </div>
        )}
      </section>

      {/* ── LOGIN PROMPT MODAL ── */}
      {showLoginPrompt && (
        <div onClick={()=>setShowLoginPrompt(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:C.bgCard, borderRadius:24, padding:"36px 32px", maxWidth:380, width:"100%", textAlign:"center", border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🔐</div>
            <h2 style={{ color:C.text, fontWeight:900, fontSize:20, margin:"0 0 10px" }}>Login Required</h2>
            <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.7, marginBottom:24 }}>Please login to access courses, batches &amp; all content.</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <Btn variant="primary" size="lg" onClick={()=>{ setShowLoginPrompt(false); onLogin("student"); }}>🎓 Student Login</Btn>
              <Btn variant="ghost" size="lg" onClick={()=>{ setShowLoginPrompt(false); onLogin("teacher"); }}>👨‍🏫 Teacher Login</Btn>
            </div>
            <button onClick={()=>setShowLoginPrompt(false)} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginTop:16 }}>{t("cancel")||"Cancel"}</button>
          </div>
        </div>
      )}

      {/* ── IN-APP COURSE PLAYER ── */}
      {playingCourse && (
        <div onClick={()=>setPlayingCourse(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.93)", zIndex:10001, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:900, padding:"0 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
              <div>
                <div style={{ color:"#fff", fontWeight:900, fontSize:18 }}>{playingCourse.title}</div>
                {playingCourse.desc && <div style={{ color:"#aaa", fontSize:13, marginTop:3 }}>{playingCourse.desc}</div>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <a href={playingCourse.url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <button style={{ background:"rgba(255,0,0,0.85)", border:"none", color:"#fff", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>▶ YouTube par Kholo</button>
                </a>
                <button onClick={()=>setPlayingCourse(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:99, width:38, height:38, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
            </div>
            {playingCourse.embedUrl ? (
              <div style={{ position:"relative", paddingBottom:"56.25%", height:0, borderRadius:16, overflow:"hidden", background:"#000" }}>
                <iframe src={playingCourse.embedUrl} style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={playingCourse.title} />
              </div>
            ) : (
              <div style={{ background:"#111", borderRadius:16, padding:"40px 20px", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:16 }}>▶️</div>
                <p style={{ color:"#aaa", marginBottom:20 }}>Cannot embed. Open on YouTube?</p>
                <a href={playingCourse.url} target="_blank" rel="noreferrer"><Btn variant="primary">Open on YouTube →</Btn></a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ padding: "32px", borderTop: `1px solid ${C.border}`, background: C.bgCard }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 18 }}>
          <div onClick={handleFooterSecretClick} style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: C.text }}>Samagra Bharat Coaching Classes</div>
            <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>Excellence in Education since 2020</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {currentUser
              ? <button onClick={()=>onLogin("student")} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>View Courses</button>
              : <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Btn variant="primary" onClick={() => onLogin("student")}>Student Login</Btn>
                    {studentClass ? <div style={{ fontSize:12, color:C.textMuted, background:C.bgCard, border:`1px solid ${C.border}`, padding:'6px 8px', borderRadius:8 }}>Class {studentClass}th</div> : null}
                  </div>
                </>
            }
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {["📞 " + contact.phone, "✉️ " + contact.email, "📍 " + contact.address].map((item, i) => (
            <span key={i} style={{ color: C.textMuted, fontSize: 12, wordBreak: "break-all" }}>{item}</span>
          ))}
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// SECURITY LAYER - Using imported SEC from config/auth.js
// ============================================================

// AUTH_DB is imported from config/auth.js

// ============================================================
// ADMIN SECRET PORTAL (completely separate from public login)
// ============================================================
const _OLD_AdminSecretPortal = ({ onAdminLogin, onBack }) => {
  const [step, setStep] = useState(1); // 1=credentials, 2=secret key, 3=blocked
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { q: `${a} + ${b} = ?`, ans: String(a + b) };
  });
  const [captchaInput, setCaptchaInput] = useState("");

  useEffect(() => {
    let t;
    if (blockTimer > 0) t = setInterval(() => setBlockTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [blockTimer]);

  const handleStep1 = () => {
    if (captchaInput !== captcha.ans) {
      setErr("❌ Wrong CAPTCHA! Please try again.");
      return;
    }
    const rl = SEC.checkRateLimit("admin_login");
    if (!rl.allowed) {
      setStep(3);
      setBlockTimer(rl.wait * 60);
      SEC.logEvent("BLOCKED", "Admin login rate limit exceeded");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (id.trim() === AUTH_DB.admin.id && SEC.hash(pass) === AUTH_DB.admin.passHash) {
        SEC.logEvent("ADMIN_STEP1_OK", id);
        setErr("");
        setStep(2);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        SEC.logEvent("ADMIN_FAIL", `ID: ${id}, Attempt: ${newAttempts}`);
        if (newAttempts >= 3) {
          setStep(3);
          setBlockTimer(5 * 60);
          setErr("");
        } else {
          setErr(`❌ Wrong Credentials! ${3 - newAttempts} attempts remaining.`);
        }
      }
    }, 800);
  };

  const handleStep2 = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (secretKey === AUTH_DB.admin.secretKey) {
        SEC.clearRateLimit("admin_login");
        SEC.logEvent("ADMIN_LOGIN_SUCCESS", AUTH_DB.admin.id);
        const token = SEC.genToken("admin", AUTH_DB.admin.id);
        localStorage.setItem("sbc_admin_token", token);
        onAdminLogin();
      } else {
        SEC.logEvent("ADMIN_SECRET_FAIL", AUTH_DB.admin.id);
        setErr("❌ Wrong Secret Key!");
      }
    }, 600);
  };

  // Blocked screen
  if (step === 3) return (
    <div style={{ minHeight: "100vh", background: "#0A0005", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: 20 }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
        <h2 style={{ color: C.danger, fontSize: 24, fontWeight: 900, margin: "0 0 12px" }}>Access Blocked!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
          Too many failed attempts. This portal is temporarily blocked.
        </p>
        {blockTimer > 0 && (
          <div style={{ background: "#EF444411", border: "1px solid #EF444433", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.danger }}>
              {Math.floor(blockTimer / 60)}:{String(blockTimer % 60).padStart(2, "0")}
            </div>
            <div style={{ color: C.textMuted, fontSize: 13, marginTop: 6 }}>minutes remaining</div>
          </div>
        )}
        <p style={{ color: C.textMuted, fontSize: 12 }}>This event has been recorded in the security log.</p>
        <Btn variant="ghost" onClick={onBack} style={{ marginTop: 20 }}>← Go Back</Btn>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#08060F",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Segoe UI', sans-serif", padding: 20,
      backgroundImage: `radial-gradient(ellipse at 50% 0%, #FF6B0008 0%, transparent 60%)`
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 13, marginBottom: 28, display: "flex", alignItems: "center", gap: 6 }}>
          ← Back
        </button>

        {/* Secure Badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#EF444411", border: "1px solid #EF444433", borderRadius: 99, padding: "8px 18px" }}>
            <span style={{ fontSize: 14 }}>🔐</span>
            <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>SECURE ADMIN PORTAL</span>
          </div>
        </div>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 70, height: 70, borderRadius: 18, margin: "0 auto 14px",
            background: "linear-gradient(135deg, #1A1A2E, #16213E)",
            border: "2px solid #EF444444",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: "#EF4444",
            boxShadow: "0 0 40px #EF444422"
          }}>🛡️</div>
          <h1 style={{ color: C.text, fontSize: 20, fontWeight: 900, margin: "0 0 6px" }}>Owner / Admin Login</h1>
          <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
            {step === 1 ? "Step 1 of 2 — Verify Credentials" : "Step 2 of 2 — Enter Secret Key"}
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 99, background: step >= s ? C.danger : C.border }} />
          ))}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${step === 2 ? "#EF444444" : C.border}`, borderRadius: 20, padding: 28 }}>

          {step === 1 && (
            <>
              <div style={{ marginBottom: 18 }}>
                <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>OWNER ID</label>
                <input value={id} onChange={e => setId(e.target.value)} placeholder="Enter Owner ID"
                  autoComplete="off" spellCheck={false}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>PASSWORD</label>
                <div style={{ position: "relative" }}>
                  <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? "text" : "password"}
                    placeholder="Strong password"
                    autoComplete="new-password"
                    style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 16 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {/* Captcha */}
              <div style={{ background: C.bgCard2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8, fontWeight: 700 }}>🤖 CAPTCHA VERIFICATION</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ background: C.bgCard3, borderRadius: 8, padding: "8px 16px", fontSize: 18, fontWeight: 900, color: C.gold, letterSpacing: 4, fontFamily: "monospace" }}>
                    {captcha.q}
                  </div>
                  <input value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} placeholder="Answer"
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bgCard3, color: C.text, fontSize: 16, outline: "none", textAlign: "center", fontWeight: 700 }} />
                </div>
              </div>
              {err && (
                <div style={{ background: "#EF444411", border: "1px solid #EF444433", borderRadius: 10, padding: "10px 14px", color: C.danger, fontSize: 13, marginBottom: 16, textAlign: "center" }}>
                  {err}
                </div>
              )}
              <Btn variant="danger" size="lg" onClick={handleStep1} style={{ width: "100%", background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                {loading ? "⏳ Verifying..." : "🔐 Verify →"}
              </Btn>
              <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 10, background: "#FFFFFF08", fontSize: 12, color: C.textDim, textAlign: "center" }}>
                ⚠️ This portal is for Owner only. Unauthorized access is logged.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24, padding: "16px", background: "#10B98111", border: "1px solid #10B98133", borderRadius: 14 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ color: C.success, fontWeight: 800, fontSize: 15 }}>Credentials Verified!</div>
                <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>Step 2: Enter Secret Key</div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>SECRET ACCESS KEY</label>
                <input value={secretKey} onChange={e => setSecretKey(e.target.value)} type="password"
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && handleStep2()}
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid #EF444444`, background: C.bgCard2, color: C.text, fontSize: 18, outline: "none", boxSizing: "border-box", textAlign: "center", letterSpacing: 6 }} />
              </div>
              {err && (
                <div style={{ background: "#EF444411", border: "1px solid #EF444433", borderRadius: 10, padding: "10px 14px", color: C.danger, fontSize: 13, marginBottom: 16, textAlign: "center" }}>{err}</div>
              )}
              <Btn variant="danger" size="lg" onClick={handleStep2} style={{ width: "100%", background: "linear-gradient(135deg, #EF4444, #DC2626)" }}>
                {loading ? "⏳ Unlocking..." : "🔓 Open Admin Panel"}
              </Btn>
              <div style={{ marginTop: 14, textAlign: "center", fontSize: 11, color: C.textDim }}>
                💡 Demo Secret Key: <strong style={{ color: C.textMuted }}>SBC2024</strong>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// LoginPage + ProfilePage imported from modular files
// ============================================================
// BOTTOM NAVIGATION BAR (Mobile-first, replaces Sidebar for Student/Teacher)
// ============================================================
// ============================================================
const _OLD_LoginPage = ({ defaultRole = "student", onLogin, onAdminLogin, onBack, onAdminPortal }) => {
  const [mode, setMode] = useState("login"); // login | studentSignup | teacherSignup | loginOtp | forgotStep1 | forgotStep2 | forgotStep3
  const [role, setRole] = useState(defaultRole === "admin" ? "student" : defaultRole);
  const [id, setId] = useState(""); 
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0); 
  const [locked, setLocked] = useState(false); 
  const [lockTimer, setLockTimer] = useState(0);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [playingCourse, setPlayingCourse] = useState(null); // for in-app course player
  const [currentUser, setCurrentUser] = useState(null); // for demo purposes, holds the logged-in user object
  const [showSidebar, setShowSidebar] = useState(false); // for mobile sidebar toggle
  const [activeSection, setActiveSection] = useState("home"); // for scrollspy on landing page
  const [showAdminLogin, setShowAdminLogin] = useState(false); // toggle admin login form
  const [adminLoginErr, setAdminLoginErr] = useState(""); // error message for admin login
  const [adminLoginLoading, setAdminLoginLoading] = useState(false); // loading state for admin login
  const [adminId, setAdminId] = useState(""); // admin login ID input
  const [adminPass, setAdminPass] = useState(""); // admin login password input 
  const [adminShowPass, setAdminShowPass] = useState(false); // toggle admin login password visibility
  const [adminCaptcha] = useState(() => { // captcha for admin login
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { q: `${a} + ${b} = ?`, ans: String(a + b) };
  });
  const [adminCaptchaInput, setAdminCaptchaInput] = useState(""); // admin login captcha input
  const [adminLoginAttempts, setAdminLoginAttempts] = useState(0); // admin login attempts for rate limiting 
  const [adminBlockTimer, setAdminBlockTimer] = useState(0); // timer for blocking admin login after too many attempts
  const [adminStep, setAdminStep] = useState(6); // step in admin login flow (6=credentials, 2=secret key, 3=blocked)
  const [adminSecretKey, setAdminSecretKey] = useState(""); // admin login secret key input 
  const [adminLoginSuccess, setAdminLoginSuccess] = useState(false); // whether admin login was successful (for demo purposes)
  const [adminToken, setAdminToken] = useState(""); // token generated on successful admin login (for demo purposes)   

  // OTP state (signup + email login)
  const [signupStep, setSignupStep] = useState(1);
  const [generatedOTP, setGeneratedOTP] = useState(""); 
  const [otpInput, setOtpInput] = useState(""); 
  const [otpTimer, setOtpTimer] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // for locked users trying to access courses
  const [otpTargetUser, setOtpTargetUser] = useState(null); // user object for email OTP login / forgot password
  const [fpId, setFpId] = useState(""); // forgot password: ID entered
  const [fpNewPass, setFpNewPass] = useState(""); // new password
  const [fpConfirm, setFpConfirm] = useState(""); // confirm new password
  const [fpStep, setFpStep] = useState(1); // forgot password step  

  
  const [contact, setContact] = useState({ phone:"", email:"", address:"", mapLink:"" }); // for forgot password help info  
  const [features, setFeatures] = useState([]); // for landing page features section 
  const [courses, setCourses] = useState([]); // for landing page courses section
  const [testimonials, setTestimonials] = useState([]); // for landing page testimonials section
  const [t] = useState(() => key => key); // placeholder translation function (i18n)
  const [C] = useState(() => ({ // color palette
    primary: "#4F46E5",
    primaryLight: "#818CF8",
    success: "#10B981",
    info: "#3B82F6",
    warning: "#F59E0B",
    danger: "#EF4444",
    text: "#E5E7EB",
    textMuted: "#9CA3AF",
    textDim: "#6B7280",
    border: "#374151",
    bgCard: "#1F2937",
    bgCard2: "#11181C",
    bgCard3: "#11181C88",
    gold: "#D4AF37"
  }));
  const { addNotification } = useContext(NotificationContext); // for showing notifications
  const DB = useContext(DBContext); // for accessing local "database" (localStorage wrapper)  
  const SEC = useContext(SecurityContext); // for accessing security functions (OTP generation/verification, hashing, token generation, rate limiting)
  const AUTH_DB = useContext(AuthDBContext); // for accessing authentication database (admin credentials, etc.)
  const { onAdminLogin: appOnAdminLogin } = useContext(AppContext); // for calling admin login function in App component after successful login
  // const { onLogin } = useContext(AppContext); // for calling login function in App component after successful login
  // const { currentUser } = useContext(AppContext); // for accessing currently logged-in user (for demo purposes)
  // const {setCurrentUser} = useContext(AppContext); // for setting currently logged-in user (for demo purposes)
  // const { onLogout } = useContext(AppContext); // for calling logout function in App component (for demo purposes)
  // const { notifications } = useContext(NotificationContext); // for accessing notifications (for demo purposes)
 

  // Student signup form
  const emptySF = { name:"", phone:"", email:"", class:"", board:"CBSE", batchId:"", password:"", confirm:"" };
  const [sf, setSf] = useState(emptySF);
  const [showBatchOptions, setShowBatchOptions] = useState(false); // for showing batch options dropdown in student signup form
  const [filteredBatches, setFilteredBatches] = useState([]); // for storing filtered batch options based on class/board selection in student signup form
  const [batchSearch, setBatchSearch] = useState(""); // for batch search input in student signup form
  const [selectedBatch, setSelectedBatch] = useState(null); // for storing selected batch object in student signup form 
  const [showClassBoardOptions, setShowClassBoardOptions] = useState(false); // for showing class/board options dropdown in student signup form
  const classes = Array.from(new Set((DB.get("batches") || []).map(b => b.class))).sort((a,b) => a.localeCompare(b, undefined, { numeric: true })); // unique sorted classes from batches
  const boards = Array.from(new Set((DB.get("batches") || []).map(b => b.board))).sort(); // unique sorted boards from batches  
  const handleBatchSearch = (query) => {
    setBatchSearch(query);
    const filtered = batches.filter(b => {
      const matchesClass = sf.class ? b.class === sf.class : true;
      const matchesBoard = sf.board ? b.board === sf.board : true;
      const matchesSearch = query ? b.name.toLowerCase().includes(query.toLowerCase()) : true;
      return matchesClass && matchesBoard && matchesSearch;
    });
    setFilteredBatches(filtered);
  };
  const handleSelectBatch = (batch) => {
    setSelectedBatch(batch);
    setSf(p => ({ ...p, batchId: batch.id }));
    setShowBatchOptions(false);
  };

  // Teacher signup form
  const emptyTF = { name:"", phone:"", email:"", subject:"", qualification:"", experience:"", password:"", confirm:"" };
  const [tf, setTf] = useState(emptyTF);

  const batches = DB.get("batches") || [];

  useEffect(() => { let t; if (lockTimer > 0) t = setInterval(() => setLockTimer(p => { if(p<=1){setLocked(false);return 0;} return p-1;}),1000); return ()=>clearInterval(t); }, [lockTimer]);
  useEffect(() => { let t; if (otpTimer > 0) t = setInterval(() => setOtpTimer(p => p<=1?0:p-1),1000); return ()=>clearInterval(t); }, [otpTimer]);

  const resetAll = () => { setMode("login"); setSignupStep(1); setSf(emptySF); setTf(emptyTF); setErr(""); setOtpInput(""); setOtpTargetUser(null); setFpId(""); setFpNewPass(""); setFpConfirm(""); };

  // ══════════════════════════════════════════════════════
  // FORGOT PASSWORD FLOW (3 steps):
  // Step 1 — ID/Phone/Email dalo → registered email dhundo → OTP bhejo
  // Step 2 — OTP verify karo
  // Step 3 — New password set karo
  // ══════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════
  // STUDENT SIGNUP FLOW
  // Step 1: Fill form → Send OTP
  // Step 2: Verify OTP → Save student as "Pending" → Show temp ID
  // Admin sees pending students → assigns real Roll No + approves
  // ══════════════════════════════════════════════════════

  const handleStudentOTP = () => {
    const { name, phone, email, password, confirm } = sf;
    if (!name.trim()) { setErr("Full name is required"); return; }
    if (!phone || phone.length !== 10) { setErr("Enter valid 10-digit phone number"); return; }
    if (!email || !email.includes("@")) { setErr("Enter valid email address"); return; }
    if (!password || password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setErr("Passwords do not match!"); return; }
    // Check duplicate
    const existing = DB.get("students") || [];
    if (existing.find(s => s.email?.toLowerCase() === email.toLowerCase())) { setErr("This email is already registered!"); return; }
    if (existing.find(s => s.phone === phone)) { setErr("This phone number is already registered!"); return; }
    // Send OTP
    const otp = SEC.generateOTP(email);
    setGeneratedOTP(otp);
    setOtpTimer(600);
    setSignupStep(2);
    setErr("");
    SEC.logEvent("STUDENT_SIGNUP_OTP_SENT", email);
  };

  const handleStudentVerify = () => {
    if (!otpInput || otpInput.length !== 6) { setErr("Enter 6-digit OTP"); return; }
    const res = SEC.verifyOTP(sf.email, otpInput);
    if (!res.ok) { setErr(res.msg); return; }
    // OTP verified — save student with Pending status + temp ID
    const existing = DB.get("students") || [];
    const tempNum = "P" + String(Date.now()).slice(-5); // Temp pending ID e.g. P98765
    const batches = DB.get("batches") || [];
    const myBatch = batches.find(b => String(b.id) === String(sf.batchId));
    const avatar = sf.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
    const AUTO_APPROVE_HOURS = 12;
    const newStudent = {
      id: Date.now(),
      rollNo: "",
      tempId: tempNum,
      name: sf.name.trim(),
      phone: sf.phone,
      email: sf.email,
      class: "",        // Admin assigns later
      board: "",        // Admin assigns later
      batchId: "",      // Admin assigns later
      batch: "",        // Admin assigns later
      password: sf.password,
      avatar,
      status: "Pending Approval",
      attendance: 0,
      fees: "Pending",
      joinedOn: new Date().toLocaleDateString("en-IN"),
      signupAt: Date.now(),
      autoApproveAt: Date.now() + (AUTO_APPROVE_HOURS * 60 * 60 * 1000), // 12 hrs
      everLoggedIn: false,
    };
    DB.set("students", [...existing, newStudent]);
    // 🔔 Notify admin
    addNotification(
      "signup",
      "🎓 New Student Signup",
      `${sf.name.trim()} ne signup kiya (${sf.phone}) — Approval pending`,
      { name: sf.name.trim(), phone: sf.phone, email: sf.email, tempId: tempNum }
    );
    setSf(p => ({ ...p, _tempId: tempNum }));
    setSignupStep(3);
    setErr("");
    setOtpInput("");
    SEC.logEvent("STUDENT_SIGNUP_COMPLETE", sf.email);
  };

  // ══════════════════════════════════════════════════════
  // TEACHER SIGNUP FLOW (same pattern)
  // ══════════════════════════════════════════════════════

  const handleTeacherOTP = () => {
    const { name, phone, email, subject, password, confirm } = tf;
    if (!name.trim()) { setErr("Full name is required"); return; }
    if (!phone || phone.length !== 10) { setErr("Enter valid 10-digit phone number"); return; }
    if (!email || !email.includes("@")) { setErr("Enter valid email address"); return; }
    if (!subject.trim()) { setErr("Enter subject(s) you teach"); return; }
    if (!password || password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setErr("Passwords do not match!"); return; }
    const existing = DB.get("teachers") || [];
    if (existing.find(t => t.email?.toLowerCase() === email.toLowerCase())) { setErr("This email is already registered!"); return; }
    const otp = SEC.generateOTP(email);
    setGeneratedOTP(otp);
    setOtpTimer(600);
    setSignupStep(2);
    setErr("");
    SEC.logEvent("TEACHER_SIGNUP_OTP_SENT", email);
  };

  const handleTeacherVerify = () => {
    if (!otpInput || otpInput.length !== 6) { setErr("Enter 6-digit OTP"); return; }
    const res = SEC.verifyOTP(tf.email, otpInput);
    if (!res.ok) { setErr(res.msg); return; }
    const existing = DB.get("teachers") || [];
    const teacherId = "TCH" + String(Date.now()).slice(-4);
    const avatar = tf.name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
    const newTeacher = {
      id: Date.now(),
      teacherId,
      name: tf.name.trim(),
      phone: tf.phone,
      email: tf.email,
      subject: tf.subject,
      qualification: tf.qualification || "",
      experience: tf.experience || "",
      avatar,
      password: tf.password,
      status: "Pending Approval",
      joinedOn: new Date().toLocaleDateString("en-IN"),
      signupAt: Date.now(),
      everLoggedIn: false,
    };
    DB.set("teachers", [...existing, newTeacher]);
    addNotification(
      "teacher_signup",
      "👨‍🏫 New Teacher Application",
      `${tf.name.trim()} ne teacher application submit ki — Approval required`,
      { name: tf.name.trim(), phone: tf.phone, email: tf.email, subject: tf.subject, teacherId }
    );
    setTf(p => ({ ...p, _teacherId: teacherId }));
    setSignupStep(3);
    setErr("");
    setOtpInput("");
    SEC.logEvent("TEACHER_SIGNUP_COMPLETE", tf.email);
  };

  const handleForgotSendOTP = () => {
    const val = fpId.trim();
    const valLow = val.toLowerCase();
    if (!val) { setErr("Enter Roll No / Phone / Email"); return; }
    let foundUser = null;
    if (role === "student") {
      const students = DB.get("students") || [];
      foundUser = students.find(s =>
        s.rollNo?.toLowerCase()===valLow ||
        s.email?.toLowerCase()===valLow ||
        s.phone===val
      );
    } else {
      const teachers = DB.get("teachers") || [];
      foundUser = teachers.find(t =>
        t.teacherId?.toLowerCase()===valLow ||
        t.email?.toLowerCase()===valLow ||
        t.phone===val
      );
    }
    if (!foundUser) { setErr("❌ This ID/Phone/Email is not registered"); return; }
    if (!foundUser.email) { setErr("No email found in account. Contact admin."); return; }
    const otp = SEC.generateOTP("FP_" + foundUser.email);
    setGeneratedOTP(otp);
    setOtpTimer(600);
    setOtpTargetUser(foundUser);
    setMode("forgotStep2");
    setErr("");
    SEC.logEvent("FORGOT_PASSWORD_OTP", `${role}: ${val}`);
  };

  const handleForgotVerifyOTP = () => {
    if (!otpInput || otpInput.length !== 6) { setErr("Enter 6-digit OTP"); return; }
    const res = SEC.verifyOTP("FP_" + otpTargetUser?.email, otpInput);
    if (!res.ok) { setErr(res.msg); return; }
    setMode("forgotStep3");
    setErr("");
    setOtpInput("");
  };

  const handleForgotResetPass = () => {
    if (fpNewPass.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (fpNewPass !== fpConfirm) { setErr("Passwords do not match!"); return; }
    // Save new password
    if (role === "student") {
      const students = DB.get("students") || [];
      const updated = students.map(s => s.id===otpTargetUser.id ? {...s, password: fpNewPass} : s); // stored plain for demo compatibility
      DB.set("students", updated);
    } else {
      const teachers = DB.get("teachers") || [];
      const updated = teachers.map(t => t.id===otpTargetUser.id ? {...t, password: fpNewPass} : t);
      DB.set("teachers", updated);
    }
    SEC.logEvent("PASSWORD_RESET_SUCCESS", `${role}: ${otpTargetUser?.email}`);
    setMode("forgotStep3done");
    setErr("");
  };

  // ══════════════════════════════════════════════════════
  // LOGIN FLOW (2 steps):
  // Step 1 — ID + Password verify karein
  // Step 2 — OTP registered email par jaayega → enter karein → login
  // ══════════════════════════════════════════════════════

  // STEP 1: Verify ID + Password → if correct, send OTP to their email
  const handleLogin = () => {
    if (locked) return;
    const rl = SEC.checkRateLimit(role+"_login");
    if (!rl.allowed) { setLocked(true); setLockTimer(rl.wait*60); setErr("🔒 Too many attempts! "+rl.wait+" min wait required."); return; }
    const idVal = id.trim();
    const idLow = idVal.toLowerCase();
    if (!idVal) { setErr("Enter ID / Phone"); return; }
    if (!pass) { setErr("Enter Password"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      let foundUser = null;
      if (role === "student") {
        const students = DB.get("students") || [];
        foundUser = students.find(s => (
          s.rollNo?.toLowerCase()===idLow ||
          s.email?.toLowerCase()===idLow ||
          s.phone===idVal
        ) && (SEC.hash(pass)===SEC.hash(s.password) || pass===s.password) && s.status!=="Rejected");
        if (foundUser && foundUser.status==="Pending Approval") {
          setErr("⏳ Your account is pending admin approval. Temp ID: " + (foundUser.tempId||"—") + " · Please wait or contact admin."); return;
        }
      } else {
        const teachers = DB.get("teachers") || [];
        foundUser = teachers.find(t => (
          t.teacherId?.toLowerCase()===idLow ||
          t.email?.toLowerCase()===idLow ||
          t.phone===idVal
        ) && (SEC.hash(pass)===SEC.hash(t.password) || pass===t.password));
        if (foundUser && foundUser.status==="Pending Approval" && !foundUser.everLoggedIn) {
          setErr("⏳ Admin approval required for first login. Contact admin."); return;
        }
      }
      if (!foundUser) {
        const na=attempts+1; setAttempts(na); SEC.logEvent("LOGIN_FAIL",`Role:${role} ID:${idVal}`);
        if(na>=5){setLocked(true);setLockTimer(5*60);setErr("🔒 5 failed attempts! Try again after 5 min.");}
        else setErr("❌ Galat ID/Phone ya Password! ("+(5-na)+" attempts remaining)");
        return;
      }
      // ✅ Password correct — now send OTP to their registered email
      const userEmail = foundUser.email;
      if (!userEmail) { setErr("No email found in account. Contact admin."); return; }
      // Demo accounts - skip OTP for instant login
      const isDemoAccount = foundUser.id === "demo_stu1" || foundUser.id === "demo_tch1";
      if (isDemoAccount) {
        if (role === "teacher") {
          const teachers = DB.get("teachers") || [];
          const updated = teachers.map(t => t.id===foundUser.id ? {...t, everLoggedIn:true} : t);
          DB.set("teachers", updated);
        }
        SEC.logEvent(role.toUpperCase()+"_LOGIN_SUCCESS", foundUser.rollNo||foundUser.teacherId||"");
        SEC.clearRateLimit(role+"_login");
        onLogin(role, foundUser);
        return;
      }
      const otp = SEC.generateOTP("LOGIN_"+userEmail);
      setGeneratedOTP(otp);
      setOtpTimer(600);
      setOtpTargetUser(foundUser);
      setMode("loginOtp");
      setErr("");
      SEC.logEvent("LOGIN_OTP_SENT", `${role}: ${idVal}`);
    }, 700);
  };

  // STEP 2: Verify OTP → complete login
  const handleLoginOTPVerify = () => {
    if (!otpInput || otpInput.length!==6) { setErr("Enter 6-digit OTP"); return; }
    const userEmail = otpTargetUser?.email;
    const res = SEC.verifyOTP("LOGIN_"+userEmail, otpInput);
    if (!res.ok) { setErr(res.msg); return; }
    // Teacher — mark everLoggedIn
    if (role === "teacher") {
      const teachers = DB.get("teachers") || [];
      const updated = teachers.map(t => t.id===otpTargetUser.id ? {...t, everLoggedIn:true} : t);
      DB.set("teachers", updated);
    }
    SEC.logEvent(role.toUpperCase()+"_LOGIN_SUCCESS", otpTargetUser?.rollNo||otpTargetUser?.teacherId||"");
    SEC.clearRateLimit(role+"_login");
    onLogin(role, otpTargetUser);
  };
  const isTeacher = mode==="teacherSignup";
  const W = { minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI','Noto Sans Devanagari',sans-serif", padding:20, backgroundImage:`radial-gradient(ellipse at 30% 40%, ${C.primary}10 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, ${C.gold}08 0%, transparent 55%)` };

  // ── SUCCESS SCREEN ──
  if ((mode==="studentSignup"||mode==="teacherSignup") && signupStep===3) {
    const idLabel = isTeacher ? "YOUR TEACHER ID" : "YOUR TEMPORARY ID";
    const idValue = isTeacher ? (tf._teacherId||"") : (sf._tempId||"");
    const contact = DB.get("contact") || {};
    const waMsg = isTeacher
      ? "Hello! My teacher account is pending approval. Teacher ID: " + idValue
      : "Hello! My student account is pending approval. Roll No: " + idValue;
    return (
      <div style={W}><div style={{ width:"100%", maxWidth:430, textAlign:"center" }}>
        <div style={{ fontSize:64, marginBottom:14 }}>🎉</div>
        <h2 style={{ color:C.text, fontWeight:900, fontSize:22, margin:"0 0 6px" }}>Registration Successful!</h2>
        <p style={{ color:C.textMuted, fontSize:14, marginBottom:20 }}>Your account has been created. Please wait for admin approval to login.</p>

        {/* ID Card */}
        <div style={{ background:`linear-gradient(135deg, ${C.primary}18, ${C.gold}10)`, border:`2px solid ${C.primary}44`, borderRadius:18, padding:"20px 24px", marginBottom:16, position:"relative" }}>
          <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:8 }}>{idLabel}</div>
          <div style={{ fontSize:28, fontWeight:900, color:C.primary, letterSpacing:4, marginBottom:6 }}>{idValue}</div>
          <div style={{ fontSize:12, color:C.warning, fontWeight:700 }}>⚠️ Save this ID — you'll need it to login!</div>
        </div>

        {/* Steps card */}
        <Card style={{ marginBottom:16, textAlign:"left" }}>
          <div style={{ fontSize:13, color:C.text, fontWeight:800, marginBottom:12 }}>📋 What happens next?</div>
          {[
            { icon:"1️⃣", text:"Admin will review your application" },
            { icon:"2️⃣", text:"You'll be approved within 24 hours" },
            { icon:"3️⃣", text:isTeacher?"Login using Teacher ID + password after approval":"Admin will assign your Roll Number and approve your account" },
            { icon:"4️⃣", text:"Enter OTP sent to your email — done!" },
          ].map((step,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{step.icon}</span>
              <span style={{ fontSize:13, color:C.textMuted, lineHeight:1.5 }}>{step.text}</span>
            </div>
          ))}
        </Card>

        {/* Contact admin */}
        {(contact.phone || contact.whatsapp) && (
          <div style={{ background:`${C.info}11`, border:`1px solid ${C.info}33`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:12, color:C.info, fontWeight:800, marginBottom:10 }}>📞 Contact Admin directly:</div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
              {contact.phone && (
                <a href={"tel:"+contact.phone} style={{ textDecoration:"none" }}>
                  <button style={{ background:`${C.success}22`, border:`1px solid ${C.success}44`, color:C.success, borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    📞 {contact.phone}
                  </button>
                </a>
              )}
              {contact.whatsapp && (
                <a href={"https://wa.me/91"+contact.whatsapp+"?text="+encodeURIComponent(waMsg)} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <button style={{ background:"#25D36622", border:"1px solid #25D36644", color:"#25D366", borderRadius:10, padding:"8px 16px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                    💬 WhatsApp
                  </button>
                </a>
              )}
            </div>
          </div>
        )}  
        <Btn variant="primary" size="lg" onClick={resetAll} style={{ width:"100%" }}>← Go to Login Page</Btn>
      </div></div>
    );
  }

  // ── OTP VERIFY SCREEN ──
  if ((mode==="studentSignup"||mode==="teacherSignup") && signupStep===2) return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <button onClick={() => { setSignupStep(1); setErr(""); }} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>← Go Back</button>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:48, marginBottom:10 }}>📧</div>
        <h2 style={{ color:C.text, fontWeight:900, margin:"0 0 8px" }}>Verify Email</h2>
        <p style={{ color:C.textMuted, fontSize:13 }}>
          6-digit OTP <strong style={{color:C.text}}>{isTeacher?SEC.maskEmail(tf.email):SEC.maskEmail(sf.email)}</strong> 
        </p>
      </div>
      <div style={{ background:`${C.warning}15`, border:`2px dashed ${C.warning}55`, borderRadius:14, padding:"14px 18px", marginBottom:18, textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.warning, fontWeight:800, marginBottom:8, letterSpacing:1 }}>⚡ TEST MODE — OTP (until email service is connected)</div>
        <div style={{ fontSize:36, fontWeight:900, color:C.text, letterSpacing:8 }}>{generatedOTP}</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>In production, OTP will be sent via email (Nodemailer / SendGrid)</div>
      </div>
      <Card style={{ padding:24 }}>
        <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:8, letterSpacing:1 }}>6-DIGIT OTP *</label>
        <input value={otpInput} onChange={e=>{setOtpInput(e.target.value.replace(/\D/g,"").slice(0,6));setErr("");}} maxLength={6} placeholder="_ _ _ _ _ _"
          style={{ width:"100%", padding:"14px", borderRadius:12, border:`2px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:26, fontWeight:900, textAlign:"center", letterSpacing:10, outline:"none", boxSizing:"border-box" }}
          onKeyDown={e=>e.key==="Enter"&&(isTeacher?handleTeacherVerify():handleStudentVerify())} />
        {otpTimer>0&&<div style={{ fontSize:12, color:C.textMuted, marginTop:6, textAlign:"center" }}>Expires: {Math.floor(otpTimer/60)}:{String(otpTimer%60).padStart(2,"0")}</div>}
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"12px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={isTeacher?handleTeacherVerify:handleStudentVerify} style={{ width:"100%", marginTop:16 }}>✅ Verify &amp; Register</Btn>
        <button onClick={()=>{ const p=isTeacher?tf.email:sf.email; const o=SEC.generateOTP(p); setGeneratedOTP(o); setOtpTimer(600); setErr(""); }} disabled={otpTimer>540}
          style={{ background:"none", border:"none", color:otpTimer>540?C.textMuted:C.primary, cursor:otpTimer>540?"not-allowed":"pointer", fontSize:13, fontWeight:600, marginTop:12, width:"100%", textAlign:"center" }}>
          🔄 Resend OTP {otpTimer>540?"("+(otpTimer-540)+"s)":""}
        </button>
      </Card>
    </div></div>
  );

  // ── STUDENT SIGNUP FORM ──
  if (mode==="studentSignup") return (
    <div style={{...W, alignItems:"flex-start", paddingTop:40}}><div style={{ width:"100%", maxWidth:460 }}>
      <button onClick={resetAll} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Back to Login</button>
      <div style={{ textAlign:"center", marginBottom:22 }}>
        <div style={{ width:60, height:60, borderRadius:18, margin:"0 auto 12px", background:`linear-gradient(135deg, ${C.primary}, ${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:"#111" }}>SBC</div>
        <h1 style={{ color:C.text, fontSize:22, fontWeight:900, margin:"0 0 6px" }}>🎓 Student Registration</h1>
        <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Quick signup — OTP verify karein, bas!</p>
      </div>
      <Card style={{ padding:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Input label="FULL NAME *" value={sf.name} onChange={e=>setSf({...sf,name:e.target.value})} placeholder="e.g. Rahul Kumar Sharma" />
          <Input label="PHONE NUMBER *" value={sf.phone} onChange={e=>setSf({...sf,phone:e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="10-digit mobile number" type="tel" />
          <div>
            <Input label="EMAIL ADDRESS * (OTP yahan aayega)" value={sf.email} onChange={e=>setSf({...sf,email:e.target.value})} placeholder="your@email.com" type="email" />
            <div style={{ fontSize:11, color:C.warning, marginTop:4, display:"flex", alignItems:"center", gap:5 }}>
              <span>📧</span> Email se login hoga aur OTP bhi yahan aayega
            </div>
          </div>
          <Input label="PASSWORD *" value={sf.password} onChange={e=>setSf({...sf,password:e.target.value})} type="password" placeholder="Minimum 6 characters" />
          <Input label="CONFIRM PASSWORD *" value={sf.confirm} onChange={e=>setSf({...sf,confirm:e.target.value})} type="password" placeholder="Password dobara likhein" />
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:`${C.info}10`, border:`1px solid ${C.info}33`, borderRadius:10, fontSize:12, color:C.textMuted, lineHeight:1.7 }}>
          ℹ️ Batch, Class, Roll Number — Admin signup ke baad assign karega. Aapko kuch fill nahi karna.
        </div>
        {err&&<div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:10, padding:"10px 14px", color:C.danger, fontSize:13, margin:"12px 0 0", textAlign:"center" }}>{err}</div>}
        <button onClick={handleStudentOTP}
          style={{ width:"100%", marginTop:16, padding:"14px 0", borderRadius:13, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontSize:16, fontWeight:900, cursor:"pointer" }}>
          📧 Send OTP to Email →
        </button>
        <div style={{ textAlign:"center", marginTop:14, fontSize:13, color:C.textMuted }}>
          Already registered? <button onClick={resetAll} style={{ background:"none", border:"none", color:C.primary, cursor:"pointer", fontWeight:700, fontSize:13 }}>Login here</button>
        </div>
      </Card>
    </div></div>
  );

  // ── TEACHER SIGNUP FORM ──
  if (mode==="teacherSignup") return (
    <div style={{...W, alignItems:"flex-start", paddingTop:40}}><div style={{ width:"100%", maxWidth:520 }}>
      <button onClick={resetAll} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:20, display:"flex", alignItems:"center", gap:6 }}>← Back to Login</button>
      <div style={{ textAlign:"center", marginBottom:22 }}>
        <div style={{ width:56, height:56, borderRadius:16, margin:"0 auto 10px", background:`linear-gradient(135deg, ${C.info}, ${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, color:"#fff" }}>👨‍🏫</div>
        <h1 style={{ color:C.text, fontSize:20, fontWeight:900, margin:"0 0 4px" }}>👨‍🏫 Teacher Registration</h1>
        <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>You can login after admin approval</p>
      </div>
      <Card style={{ padding:22 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
          <div style={{ gridColumn:"1 / -1" }}><Input label="FULL NAME *" value={tf.name} onChange={e=>setTf({...tf,name:e.target.value})} placeholder="E.g.: Rajesh Kumar Sharma" /></div>
          <Input label="PHONE *" value={tf.phone} onChange={e=>setTf({...tf,phone:e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="10-digit mobile" />
          <div>
            <Input label="EMAIL * (OTP will be sent here)" value={tf.email} onChange={e=>setTf({...tf,email:e.target.value})} placeholder="email@example.com" type="email" />
            <div style={{ fontSize:11, color:C.warning, marginTop:-10, marginBottom:4, paddingLeft:2 }}>📧 Email is mandatory — also used for login</div>
          </div>
          <Input label="SUBJECT(S) *" value={tf.subject} onChange={e=>setTf({...tf,subject:e.target.value})} placeholder="e.g. Maths, Physics" />
          <Input label="QUALIFICATION *" value={tf.qualification} onChange={e=>setTf({...tf,qualification:e.target.value})} placeholder="e.g. M.Sc. Maths, B.Ed." />
          <div style={{ gridColumn:"1 / -1" }}>
            <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7, letterSpacing:1 }}>EXPERIENCE</label>
            <select value={tf.experience} onChange={e=>setTf({...tf,experience:e.target.value})} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }}>
              <option value="">Select experience...</option>
              {["Fresher","1-2 Years","3-5 Years","5-10 Years","10+ Years"].map(x=><option key={x} value={x}>{x}</option>)}
            </select>
          </div>
          <Input label="PASSWORD *" value={tf.password} onChange={e=>setTf({...tf,password:e.target.value})} type="password" placeholder="Min 6 characters" />
          <Input label="CONFIRM PASSWORD *" value={tf.confirm} onChange={e=>setTf({...tf,confirm:e.target.value})} type="password" placeholder="Re-enter password" />
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:`${C.info}11`, border:`1px solid ${C.info}33`, borderRadius:10, fontSize:12, color:C.info, lineHeight:1.6 }}>
          ℹ️ Your application will be reviewed by Admin · Account activates after approval
        </div>
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"12px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleTeacherOTP} style={{ width:"100%", marginTop:16 }}>📧 Send OTP →</Btn>
      </Card>
    </div></div>
  );

  // ── LOGIN OTP SCREEN (Step 2: password verified, now OTP) ──
  if (mode === "loginOtp") return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <button onClick={()=>{setMode("login");setErr("");setOtpInput("");setOtpTargetUser(null);}} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>← Go Back</button>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:48, marginBottom:10 }}>📧</div>
        <h2 style={{ color:C.text, fontWeight:900, margin:"0 0 8px" }}>Verify Email OTP</h2>
        <p style={{ color:C.textMuted, fontSize:13 }}>Password verified ✅ — OTP sent to <strong style={{color:C.text}}>{SEC.maskEmail(otpTargetUser?.email||"")}</strong> </p>
      </div>
      <div style={{ background:`${C.warning}15`, border:`2px dashed ${C.warning}55`, borderRadius:14, padding:"14px 18px", marginBottom:18, textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.warning, fontWeight:800, marginBottom:8, letterSpacing:1 }}>⚡ TEST MODE — OTP (until email service is connected)</div>
        <div style={{ fontSize:36, fontWeight:900, color:C.text, letterSpacing:8 }}>{generatedOTP}</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>In production, OTP will be sent via email (SendGrid / Nodemailer)</div>
      </div>
      <Card style={{ padding:24 }}>
        <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:8, letterSpacing:1 }}>6-DIGIT OTP *</label>
        <input value={otpInput} onChange={e=>{setOtpInput(e.target.value.replace(/\D/g,"").slice(0,6));setErr("");}} maxLength={6} placeholder="_ _ _ _ _ _"
          style={{ width:"100%", padding:"14px", borderRadius:12, border:`2px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:26, fontWeight:900, textAlign:"center", letterSpacing:10, outline:"none", boxSizing:"border-box" }}
          onKeyDown={e=>e.key==="Enter"&&handleLoginOTPVerify()} />
        {otpTimer>0&&<div style={{ fontSize:12, color:C.textMuted, marginTop:6, textAlign:"center" }}>Expires: {Math.floor(otpTimer/60)}:{String(otpTimer%60).padStart(2,"0")}</div>}
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"12px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleLoginOTPVerify} style={{ width:"100%", marginTop:16 }}>✅ Verify &amp; Login</Btn>
        <button onClick={()=>{ const otp=SEC.generateOTP("LOGIN_"+(otpTargetUser?.email||"")); setGeneratedOTP(otp); setOtpTimer(600); setErr(""); }} disabled={otpTimer>540}
          style={{ background:"none", border:"none", color:otpTimer>540?C.textMuted:C.info, cursor:otpTimer>540?"not-allowed":"pointer", fontSize:13, fontWeight:600, marginTop:12, width:"100%", textAlign:"center" }}>
          🔄 Resend OTP {otpTimer>540?"("+(otpTimer-540)+"s)":""}
        </button>
      </Card>
    </div></div>
  );

  // ── FORGOT PASSWORD: STEP 1 — Enter ID ──
  if (mode === "forgotStep1") return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <button onClick={()=>{setMode("login");setErr("");setFpId("");}} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>← Go Back</button>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🔑</div>
        <h2 style={{ color:C.text, fontWeight:900, margin:"0 0 8px", fontSize:20 }}>Forgot Password?</h2>
        <p style={{ color:C.textMuted, fontSize:13, lineHeight:1.6 }}>Apna Enter Roll No / Phone / Email — OTP aapki registered email par bheja jaayega</p>
      </div>
      <Card style={{ padding:24 }}>
        <Input label={role==="student"?"ROLL NO / PHONE / EMAIL":"TEACHER ID / PHONE / EMAIL"} value={fpId} onChange={e=>{setFpId(e.target.value);setErr("");}} placeholder={role==="student"?"SBC12345 or phone or email":"TCH1234 or phone or email"} />
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"8px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleForgotSendOTP} style={{ width:"100%", marginTop:16 }}>
          📧 Send OTP to My Email
        </Btn>
        <div style={{ marginTop:14, padding:"10px 14px", background:`${C.info}10`, border:`1px solid ${C.info}22`, borderRadius:10, fontSize:12, color:C.textMuted, textAlign:"center", lineHeight:1.6 }}>
          💡 OTP will only be sent to the email provided at signup
        </div>
            {/* Hidden secret: multiple clicks here open teacher login */}
      </Card>
    </div></div>
  );

  // ── FORGOT PASSWORD: STEP 2 — Verify Email (OTP) ──
  if (mode === "forgotStep2") return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <button onClick={()=>{setMode("forgotStep1");setErr("");setOtpInput("");}} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, marginBottom:24, display:"flex", alignItems:"center", gap:6 }}>← Go Back</button>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>📧</div>
        <h2 style={{ color:C.text, fontWeight:900, margin:"0 0 8px", fontSize:20 }}>Verify Email</h2>
        <p style={{ color:C.textMuted, fontSize:13 }}>OTP <strong style={{color:C.text}}>{SEC.maskEmail(otpTargetUser?.email||"")}</strong> </p>
      </div>
      <div style={{ background:`${C.warning}15`, border:`2px dashed ${C.warning}55`, borderRadius:14, padding:"14px 18px", marginBottom:18, textAlign:"center" }}>
        <div style={{ fontSize:11, color:C.warning, fontWeight:800, marginBottom:8, letterSpacing:1 }}>⚡ TEST MODE — OTP (until email service is connected)</div>
        <div style={{ fontSize:36, fontWeight:900, color:C.text, letterSpacing:8 }}>{generatedOTP}</div>
        <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>In production, OTP will be sent via email</div>
      </div>
      <Card style={{ padding:24 }}>
        <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:8, letterSpacing:1 }}>6-DIGIT OTP *</label>
        <input value={otpInput} onChange={e=>{setOtpInput(e.target.value.replace(/\D/g,"").slice(0,6));setErr("");}} maxLength={6} placeholder="_ _ _ _ _ _"
          style={{ width:"100%", padding:"14px", borderRadius:12, border:`2px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:26, fontWeight:900, textAlign:"center", letterSpacing:10, outline:"none", boxSizing:"border-box" }}
          onKeyDown={e=>e.key==="Enter"&&handleForgotVerifyOTP()} />
        {otpTimer>0&&<div style={{ fontSize:12, color:C.textMuted, marginTop:6, textAlign:"center" }}>Expires: {Math.floor(otpTimer/60)}:{String(otpTimer%60).padStart(2,"0")}</div>}
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"12px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleForgotVerifyOTP} style={{ width:"100%", marginTop:16 }}>✅ OTP Verify Karein</Btn>
        <button onClick={()=>{const otp=SEC.generateOTP("FP_"+(otpTargetUser?.email||""));setGeneratedOTP(otp);setOtpTimer(600);setErr("");}} disabled={otpTimer>540}
          style={{ background:"none", border:"none", color:otpTimer>540?C.textMuted:C.info, cursor:otpTimer>540?"not-allowed":"pointer", fontSize:13, fontWeight:600, marginTop:12, width:"100%", textAlign:"center" }}>
          🔄 Resend OTP {otpTimer>540?"("+(otpTimer-540)+"s)":""}
        </button>
      </Card>
    </div></div>
  );

  // ── FORGOT PASSWORD: STEP 3 — New Password ──
  if (mode === "forgotStep3") return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🔒</div>
        <h2 style={{ color:C.text, fontWeight:900, margin:"0 0 8px", fontSize:20 }}>Set New Password</h2>
        <p style={{ color:C.textMuted, fontSize:13 }}>OTP verified ✅ — Now create your new password</p>
      </div>
      <Card style={{ padding:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Input label="NEW PASSWORD *" value={fpNewPass} onChange={e=>{setFpNewPass(e.target.value);setErr("");}} type="password" placeholder="Minimum 6 characters" />
          <Input label="CONFIRM PASSWORD *" value={fpConfirm} onChange={e=>{setFpConfirm(e.target.value);setErr("");}} type="password" placeholder="Re-enter new password" />
        </div>
        <div style={{ marginTop:10, padding:"9px 13px", background:`${C.info}10`, border:`1px solid ${C.info}22`, borderRadius:9, fontSize:11, color:C.textMuted, lineHeight:1.7 }}>
          💡 Strong password: Uppercase + lowercase + numbers + symbols
        </div>
        {err&&<div style={{ color:C.danger, fontSize:13, margin:"10px 0 0", textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleForgotResetPass} style={{ width:"100%", marginTop:16 }}>
          🔐 Update Password
        </Btn>
      </Card>
    </div></div>
  );

  // ── FORGOT PASSWORD: DONE ──
  if (mode === "forgotStep3done") return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <Card style={{ padding:"40px 28px", textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
        <h2 style={{ color:C.success, fontWeight:900, fontSize:22, margin:"0 0 12px" }}>Password Reset Successful!</h2>
        <p style={{ color:C.textMuted, fontSize:14, lineHeight:1.7, marginBottom:20 }}>
          Your new password has been set successfully.
        </p>
        {/* Step-by-step next instructions */}
        <div style={{ background:`${C.info}10`, border:`1px solid ${C.info}33`, borderRadius:14, padding:"16px 18px", marginBottom:24, textAlign:"left" }}>
          <div style={{ fontSize:12, color:C.info, fontWeight:800, marginBottom:10, letterSpacing:1 }}>WHAT TO DO NEXT:</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ background:C.primary, color:"#fff", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, flexShrink:0, marginTop:1 }}>1</span>
              <span style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>Go to login page, enter your <strong>ID + New Password</strong> daalein</span>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ background:C.primary, color:"#fff", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, flexShrink:0, marginTop:1 }}>2</span>
              <span style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>If password is correct, <strong>OTP will be sent to your email</strong></span>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ background:C.success, color:"#fff", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, flexShrink:0, marginTop:1 }}>3</span>
              <span style={{ fontSize:13, color:C.text, lineHeight:1.5 }}>Verify OTP → <strong>Login complete!</strong></span>
            </div>
          </div>
        </div>
        <Btn variant="primary" size="lg" onClick={resetAll} style={{ width:"100%" }}>
          Go to Login Page →
        </Btn>
      </Card>
    </div></div>
  );

  // ── LOGIN FORM ──
  return (
    <div style={W}><div style={{ width:"100%", maxWidth:400 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6 }}>← Back to Home</button>
        <LangSwitcher />
      </div>
      <div style={{ textAlign:"center", marginBottom:26 }}>
        <div style={{ width:68, height:68, borderRadius:18, margin:"0 auto 14px", background:`linear-gradient(135deg, ${C.primary}, ${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:900, color:"#111", boxShadow:`0 8px 32px ${C.primary}55` }}>SBC</div>
        <h1 style={{ color:C.text, fontSize:20, fontWeight:900, margin:"0 0 4px" }}>Samagra Bharat Coaching</h1>
        <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Login to your panel</p>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:22, background:C.bgCard, borderRadius:12, padding:5, border:`1px solid ${C.border}` }}>
        {[["student","🎓 Student"],["teacher","👨‍🏫 Teacher"]].map(([r,label])=>(
          <button key={r} onClick={()=>{setRole(r);setErr("");setId("");setPass("");setAttempts(0);}}
            style={{ flex:1, padding:"11px 8px", borderRadius:9, border:"none", background:role===r?`linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`:"transparent", color:role===r?"#fff":C.textMuted, fontWeight:700, fontSize:13, cursor:"pointer" }}>{label}</button>
        ))}
      </div>
      <Card style={{ padding:26 }}>
        <Input label={role==="student"?"ROLL NO / EMAIL / PHONE":"TEACHER ID / EMAIL / PHONE"} value={id} onChange={e=>setId(e.target.value)}
          placeholder={role==="student"?"Roll No / Email / Phone":"Teacher ID / Email / Phone"} />
        <div style={{ marginBottom:12, padding:"8px 12px", background:`${C.info}10`, border:`1px solid ${C.info}22`, borderRadius:9, fontSize:11, color:C.textMuted, lineHeight:1.7 }}>
          💡 ID: <span style={{color:C.info,fontWeight:700}}>Roll No</span> ya <span style={{color:C.info,fontWeight:700}}>Email</span> ya <span style={{color:C.info,fontWeight:700}}>Phone</span> · If password is correct, <span style={{color:C.success,fontWeight:700}}>OTP will be sent to your email</span>
        </div>
        <Input label="PASSWORD" value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="Enter Password"
          onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
        {locked&&lockTimer>0&&(
          <div style={{ background:"#EF444411", border:"1px solid #EF444433", borderRadius:10, padding:"12px 14px", marginBottom:14, textAlign:"center" }}>
            <div style={{ color:C.danger, fontSize:13, fontWeight:700 }}>🔒 Temporarily Locked</div>
            <div style={{ color:C.danger, fontSize:20, fontWeight:900, marginTop:4 }}>{Math.floor(lockTimer/60)}:{String(lockTimer%60).padStart(2,"0")}</div>
          </div>
        )}
        {err&&!locked&&<div style={{ color:C.danger, fontSize:13, marginBottom:14, textAlign:"center" }}>{err}</div>}
        <Btn variant="primary" size="lg" onClick={handleLogin} style={{ width:"100%", opacity:locked?0.5:1 }}>
          {loading?"⏳ Verifying password...":locked?"🔒 Locked":"Verify Password → OTP will be sent"}
        </Btn>

        {/* OTP is sent after password verification — see handleLogin */}

        <div style={{ marginTop:10, display:"flex", gap:8 }}>
          <button onClick={()=>{setMode(role==="teacher"?"teacherSignup":"studentSignup");setSignupStep(1);setErr("");}}
            style={{ flex:1, padding:"10px", borderRadius:10, border:`1px solid ${C.primary}44`, background:`${C.primary}08`, color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer" }}>
            ✏️ {role==="teacher"?"New Teacher?":"New Student?"} Register Here
          </button>
        </div>
        {/* Demo credentials */}
        <div style={{ background:`${C.info}08`, border:`1px solid ${C.info}22`, borderRadius:12, padding:"12px 14px", marginTop:12 }}>
          <div style={{ fontSize:11, color:C.info, fontWeight:800, marginBottom:6 }}>🧪 Demo Accounts — Tap to login instantly:</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setRole("student"); setId("SBC00001"); setPass("demo123"); setErr(""); setTimeout(()=>document.getElementById("sbc-login-btn")?.click(), 100); }}
              style={{ flex:1, padding:"7px 8px", borderRadius:9, border:`1px solid ${C.success}44`, background:`${C.success}12`, color:C.success, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              🎓 Student<br/><span style={{fontSize:10,fontWeight:400,color:C.textMuted}}>SBC00001 / demo123</span>
            </button>
            <button onClick={()=>{ setRole("teacher"); setId("TCH0001"); setPass("demo123"); setErr(""); setTimeout(()=>document.getElementById("sbc-login-btn")?.click(), 100); }}
              style={{ flex:1, padding:"7px 8px", borderRadius:9, border:`1px solid ${C.info}44`, background:`${C.info}12`, color:C.info, fontSize:12, fontWeight:700, cursor:"pointer" }}>
              👨‍🏫 Teacher<br/><span style={{fontSize:10,fontWeight:400,color:C.textMuted}}>TCH0001 / demo123</span>
            </button>
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:12 }}>
          <button onClick={()=>{setMode("forgotStep1");setFpId("");setErr("");}}
            style={{ background:"none", border:"none", color:C.textMuted, cursor:"pointer", fontSize:13, fontWeight:600, textDecoration:"underline" }}>
            🔑 Forgot Password?
          </button>
        </div>
      </Card>
      <div style={{ textAlign:"center", marginTop:28 }}>
        {/* Admin login is via secret route only — no visible button here */}
      </div>
    </div></div>
  );
};



// ============================================================
// BOTTOM NAVIGATION BAR (Mobile-first, replaces Sidebar for Student/Teacher)
// ============================================================
const StudentHomePage = ({ currentUser, onNavigate }) => {
  const students   = DB.get("students")  || [];
  const s          = students.find(st =>
    st.id===currentUser?.id ||
    st.rollNo===currentUser?.id ||
    st.rollNo===currentUser?.rollNo
  ) || currentUser || {};

  const name       = s.name || currentUser?.name || "Student";
  const rollNo     = s.rollNo || currentUser?.rollNo || currentUser?.id || "";
  const initials   = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "S";
  const attPct     = s.attendance || 0;

  const batches    = DB.get("batches")    || [];
  const classes    = DB.get("liveClasses")|| [];
  const notices    = (DB.get("notices")   || []).slice(0,3);
  const recordings = (DB.get("classRecordings")||[]).slice(0,3);
  const ytPlaylists= (DB.get("youtubePlaylist") ||[]).slice(0,3);

  const myBatch  = batches.find(b => String(b.id)===String(s.batchId)) || null;
  const liveNow  = classes.filter(c => c.status==="live");
  const upcoming = classes.filter(c => c.status==="upcoming").slice(0,2);

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, letterSpacing:1, marginBottom:10 }}>⚡ QUICK ACTIONS</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
          {[
            {icon:"📡", label:"Go Live",     section:"liveClass",  color:C.danger,   bg:`${C.danger}18`},
            {icon:"🎬", label:"Recording",   section:"recordings", color:"#FF0000",  bg:"#FF000018"},
            {icon:"✅", label:"Attendance",  section:"attendance", color:C.success,  bg:`${C.success}18`},
            {icon:"📢", label:"Notice",      section:"notices",    color:C.warning,  bg:`${C.warning}18`},
          ].map(a=>(
            <button key={a.section} onClick={()=>onNavigate(a.section)}
              style={{ padding:"14px 6px", borderRadius:16, border:`1px solid ${a.color}33`, background:a.bg, cursor:"pointer", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:26 }}>{a.icon}</span>
              <span style={{ fontSize:11, fontWeight:800, color:a.color }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MY BATCHES ── */}
      {myBatches.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>📚 My Batches</div>
            <button onClick={()=>onNavigate("myBatches")} style={{ background:"none", border:"none", color:C.info, cursor:"pointer", fontSize:12, fontWeight:700 }}>View All →</button>
          </div>
          {myBatches.slice(0,2).map(b => {
            const bStudents = allStudents.filter(s=>String(s.batchId)===String(b.id)).length;
            return (
              <div key={b.id} onClick={()=>onNavigate("myBatches")}
                style={{ background:C.bgCard, border:`1px solid ${C.info}33`, borderRadius:16, padding:"14px 16px", marginBottom:8, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{b.name}</div>
                  <span style={{ background:`${C.success}22`, color:C.success, fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>👥 {bStudents}</span>
                </div>
                <div style={{ display:"flex", gap:12, fontSize:12, color:C.textMuted }}>
                  <span>⏰ {b.time||"—"}</span>
                  <span>📅 {b.days||"—"}</span>
                  <span>🏫 {b.board||"—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── UPCOMING CLASSES ── */}
      {upcoming.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>📅 Upcoming Classes</div>
            <button onClick={()=>onNavigate("liveClass")} style={{ background:"none", border:"none", color:C.info, cursor:"pointer", fontSize:12, fontWeight:700 }}>View All →</button>
          </div>
          {upcoming.map(c=>(
            <div key={c.id} onClick={()=>onNavigate("liveClass")}
              style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, display:"flex", gap:12, alignItems:"center", cursor:"pointer" }}>
              <div style={{ width:40, height:40, borderRadius:11, background:`${C.info}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{c.title}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>📅 {c.date} · ⏰ {c.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RECENT RECORDINGS ── */}
      {recordings.length>0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>🎬 My Recordings</div>
            <button onClick={()=>onNavigate("recordings")} style={{ background:"none", border:"none", color:C.info, cursor:"pointer", fontSize:12, fontWeight:700 }}>View All →</button>
          </div>
          {recordings.map(r=>(
            <div key={r.id} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, display:"flex", gap:12, alignItems:"center" }}>
              <div style={{ width:40, height:40, borderRadius:11, background:"#FF000018", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>▶️</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{r.title}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{r.date||""} · {r.type==="youtube"?"YouTube":"Uploaded"}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NOTICES ── */}
      {notices.length>0 && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:14, fontWeight:800, color:C.text }}>📢 Latest Notices</div>
            <button onClick={()=>onNavigate("notices")} style={{ background:"none", border:"none", color:C.info, cursor:"pointer", fontSize:12, fontWeight:700 }}>View All →</button>
          </div>
          {notices.map(n=>(
            <div key={n.id} style={{ background:C.bgCard, border:`1px solid ${n.important?C.danger+"44":C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, borderLeft:`3px solid ${n.important?C.danger:C.info}` }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{n.important && "🔴 "}{n.title}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{n.date}</div>
            </div>
          ))}
        </div>
      )}

      {myBatches.length===0 && upcoming.length===0 && (
        <Card style={{ textAlign:"center", padding:"32px 20px" }}>
          <div style={{ fontSize:48, marginBottom:10 }}>👨‍🏫</div>
          <div style={{ fontWeight:800, color:C.text, marginBottom:6 }}>Welcome, Teacher!</div>
          <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>Admin will assign you batches. Meanwhile, schedule a class or upload a recording.</p>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={()=>onNavigate("liveClass")} style={{ padding:"10px 18px", borderRadius:11, border:"none", background:C.info, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>📡 Schedule Class</button>
            <button onClick={()=>onNavigate("recordings")} style={{ padding:"10px 18px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontWeight:700, cursor:"pointer", fontSize:13 }}>🎬 Add Recording</button>
          </div>
        </Card>
      )}
    </div>
  );
};


const BottomNav = ({ role, active, setActive, user, onLogout }) => {
  // NOTE: We deliberately do NOT keep a local `showProfile` state any more.
  // Earlier code rendered a fullscreen <ProfilePage/> that completely replaced
  // the bottom nav, which is why "clicking Profile made the navbar disappear".
  // The Profile route is now handled by App.renderSection() like every other
  // route, so the layout (with the navbar) stays intact.
  const [showMenu, setShowMenu] = useState(false);

  // Helper: navigate to a section. Clicking the active tab is a no-op so
  // re-clicking the same route never breaks layout or causes flicker.
  const goTo = (id) => {
    setShowMenu(false);
    if (id === active) return;
    setActive(id);
  };

  // Nav items per role — Home is CENTER (index 2)
  const teacherNav = [
    { id: "liveClass",   icon: "📡", label: t("liveClasses")||"Classes" },
    { id: "recordings",  icon: "📚", label: t("courses")||t("courses")||"Courses" },
    { id: "home",        icon: "🏠", label: t("home")||"Home",   center: true, isHome: true },
    { id: "attendance",  icon: "✅", label: t("attendance")||"Attend" },
    { id: "dashboard",   icon: "📊", label: "Dash" },
  ];
  const teacherMenuItems = [
    { id: "liveClass",   icon: "📡", label: "Live Classes",   desc: "Schedule & manage live classes" },
    { id: "recordings",  icon: "📚", label: t("courses")||t("courses")||"Courses",         desc: "Add recordings, courses, YouTube links" },
    { id: "attendance",  icon: "✅", label: "Attendance",     desc: "Mark & view attendance" },
    { id: "myBatches",   icon: "📚", label: "My Batches",     desc: "View your assigned batches" },
    { id: "students",    icon: "🎓", label: "My Students",    desc: "View students in your batches" },
    { id: "schedule",    icon: "📅", label: "Schedule",       desc: "Class timetable & schedule" },
    { id: "notices",     icon: "📢", label: t("notices")||"Notices",        desc: "Post & view notices" },
    { id: "dashboard",   icon: "📊", label: t("dashboard")||"Dashboard",      desc: "Stats & overview" },
  ];
  const studentNav = [
    { id: "courses",      icon: "📺", label: t("courses")||t("courses")||"Courses" },
    { id: "liveClass",    icon: "📡", label: t("liveClasses")||"Live" },
    { id: "home",         icon: "🏠", label: t("home")||"Home",  center: true },
    { id: "attendance",   icon: "✅", label: t("attendance")||"Attend" },
    { id: "subscription", icon: "💎", label: t("subscription")||"Premium" },
  ];
  const nav = role === "teacher" ? teacherNav : studentNav;
  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";
  const roleColor = role === "teacher" ? C.info : C.success;

  // Profile is rendered through the regular route system now — no fullscreen
  // overlay that hides the navbar.

  const initials2 = user?.name ? user.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "?";

  return (
    <>
      <ToastContainer />
      {/* Teacher full menu drawer */}
      {role === "teacher" && showMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:9990 }}>
          <div onClick={()=>setShowMenu(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)" }} />
          <div style={{ position:"absolute", top:0, right:0, bottom:0, width:280, background:C.bgCard, borderLeft:`1px solid ${C.border}`, padding:"20px 0 80px", overflowY:"auto", zIndex:1 }}>
            <div style={{ padding:"0 20px 16px", borderBottom:`1px solid ${C.border}`, marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${C.info},${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:17 }}>{initials2}</div>
                <div>
                  <div style={{ fontWeight:900, color:C.text, fontSize:15 }}>{user?.name||"Teacher"}</div>
                  <div style={{ fontSize:12, color:C.info }}>{user?.subject||""}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{user?.teacherId||""}</div>
                </div>
              </div>
            </div>
            {teacherMenuItems.map(item => (
              <button key={item.id} onClick={()=>goTo(item.id)}
                style={{ width:"100%", padding:"14px 20px", display:"flex", gap:14, alignItems:"center", background:active===item.id?`${C.info}15`:"transparent", border:"none", borderLeft:active===item.id?`3px solid ${C.info}`:"3px solid transparent", cursor:"pointer", textAlign:"left" }}>
                <span style={{ fontSize:20, width:28 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:active===item.id?C.info:C.text }}>{item.label}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{item.desc}</div>
                </div>
              </button>
            ))}
            <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}`, marginTop:10 }}>
              <button onClick={()=>goTo("profile")}
                style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:8 }}>
                👤 My Profile
              </button>
              <button onClick={onLogout}
                style={{ width:"100%", padding:"12px 16px", borderRadius:12, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:14, cursor:"pointer" }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top bar — hide on home, show on inner pages */}
      {active !== "home" && <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:999, background:`${C.bgCard}F5`, backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.border}`, padding:"0 12px", display:"flex", justifyContent:"space-between", alignItems:"center", height:54 }}>
        {/* Left: Back button OR Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
          {active !== "home" && active !== "dashboard" ? (
            <button onClick={()=>goTo("home")}
              style={{ width:36, height:36, borderRadius:10, background:C.bgCard2, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, color:C.text, flexShrink:0 }}>
              ←
            </button>
          ) : (
            <button onClick={()=>goTo("home")} style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none", cursor:"pointer", padding:0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:`linear-gradient(135deg,${C.primary},${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:"#111", flexShrink:0 }}>SBC</div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.text, lineHeight:1 }}>समग्र भारत CC</div>
                <div style={{ fontSize:10, color:role==="teacher"?C.info:C.success, fontWeight:700, textTransform:"capitalize" }}>{role}</div>
              </div>
            </button>
          )}
          {/* Section title when not home */}
          {active !== "home" && active !== "dashboard" && (
            <div style={{ fontSize:15, fontWeight:800, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {{"liveClass":"📡 Live Classes","courses":"📺 Courses","attendance":"✅ Attendance","fees":"💰 Fees","notices":"📢 Notices","subscription":"💎 Premium","schedule":"📅 Schedule","recordings":"📚 Courses","myBatches":"📚 My Batches","students":"🎓 Students","dashboard":"📊 Dashboard"}[active] || active}
            </div>
          )}
          {active === "dashboard" && (
            <div style={{ fontSize:15, fontWeight:800, color:C.text }}>📊 Dashboard</div>
          )}
        </div>

        {/* Right: Live indicator + Hamburger (teacher) + Profile */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          {/* Live class indicator */}
          {(DB.get("liveClasses")||[]).some(c=>c.status==="live") && (
            <div style={{ background:`${C.danger}22`, border:`1px solid ${C.danger}55`, borderRadius:99, padding:"4px 8px", display:"flex", alignItems:"center", gap:4, cursor:"pointer" }} onClick={()=>goTo("liveClass")}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:C.danger }} />
              <span style={{ fontSize:10, fontWeight:800, color:C.danger }}>LIVE</span>
            </div>
          )}
          {/* Hamburger for teacher */}
          {role === "teacher" && (
            <button onClick={()=>setShowMenu(p=>!p)}
              style={{ width:36, height:36, borderRadius:10, background:C.bgCard2, border:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer" }}>
              <div style={{ width:14, height:2, borderRadius:1, background:C.textMuted }} />
              <div style={{ width:14, height:2, borderRadius:1, background:C.textMuted }} />
              <div style={{ width:14, height:2, borderRadius:1, background:C.textMuted }} />
            </button>
          )}

          {/* Profile avatar — now navigates to the profile route inside the
               normal layout so the bottom nav stays visible. */}
          <button onClick={()=>goTo("profile")}
            style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${roleColor},${roleColor}88)`, border:`2px solid ${roleColor}55`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff", cursor:"pointer" }}>
            {initials}
          </button>
        </div>
      </div>}

      {/* Bottom Navigation Bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:999, background:`${C.bgCard}FA`, backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, padding:"0 4px max(4px, env(safe-area-inset-bottom))", display:"flex", alignItems:"center", justifyContent:"space-around", minHeight:"max(60px, calc(60px + env(safe-area-inset-bottom)))", boxShadow:"0 -4px 24px rgba(0,0,0,0.4)", maxWidth:"100vw" }}>
        {nav.map(item => {
          const isActive = active === item.id;
          if (item.center) return (
            <button key={item.id} onClick={() => goTo(item.id)}
              style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: isActive ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : `linear-gradient(135deg, ${C.primary}EE, ${C.primaryDark})`, color: "#fff", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${C.primary}66`, transform: "translateY(-10px)", flexShrink: 0 }}>
              {item.icon}
            </button>
          );
          return (
            <button key={item.id} onClick={() => goTo(item.id)}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", borderTop: isActive ? `2px solid ${C.primary}` : "2px solid transparent", transition: "all 0.2s" }}>
              <span style={{ fontSize: 20, filter: isActive ? "none" : "grayscale(0.5)", opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 800 : 500, color: isActive ? C.primary : C.textMuted }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

// ============================================================
// ADMIN SIDEBAR (kept for admin — desktop panel style)
// ============================================================
// ── Admin Notification Bell ──
const NotificationBell = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(() => DB.get("admin_notifications") || []);
  const unread = notifs.filter(n => !n.read).length;

  // Refresh every 5 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setNotifs(DB.get("admin_notifications") || []);
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  const markAllRead = () => {
    const updated = notifs.map(n => ({ ...n, read: true }));
    DB.set("admin_notifications", updated);
    setNotifs(updated);
  };

  const clearAll = () => {
    DB.set("admin_notifications", []);
    setNotifs([]);
    setOpen(false);
  };

  const handleNotifClick = (n) => {
    // Mark as read
    const updated = notifs.map(x => x.id === n.id ? { ...x, read: true } : x);
    DB.set("admin_notifications", updated);
    setNotifs(updated);
    // Navigate to relevant section
    if (onNavigate) {
      if (n.type === "payment") onNavigate("fees");
      else if (n.type === "subscription") onNavigate("subscription");
      else if (n.type === "signup") onNavigate("students");
      else if (n.type === "teacher_signup") onNavigate("teachers");
    }
    setOpen(false);
  };

  const typeIcon = { payment: "💰", subscription: "💎", signup: "🎓", teacher_signup: "👨‍🏫" };
  const typeColor = { payment: C.gold, subscription: C.primary, signup: C.success, teacher_signup: C.info };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen(p => !p); if(!open) markAllRead(); }}
        style={{ position: "relative", width: 36, height: 36, borderRadius: 10, border: `1px solid ${unread > 0 ? C.warning+"66" : C.border}`, background: unread > 0 ? `${C.warning}15` : C.bgCard2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
        🔔
        {unread > 0 && (
          <div style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: C.danger, color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.bgCard}` }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </button>

      {open && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998 }} onClick={() => setOpen(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: "absolute", top: 60, left: 20, width: 340, maxHeight: 480, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: "0 20px 60px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 9999 }}>
            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>🔔 Notifications {unread > 0 && <span style={{ color: C.danger, fontSize: 12 }}>({unread} new)</span>}</div>
              <button onClick={clearAll} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Clear All</button>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifs.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: C.textMuted, fontSize: 13 }}>
                  No notifications yet.<br/>Payments, signups will appear here.
                </div>
              ) : notifs.map(n => (
                <div key={n.id} onClick={() => handleNotifClick(n)}
                  style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: n.read ? "transparent" : `${typeColor[n.type]||C.primary}08`, display: "flex", gap: 12, alignItems: "flex-start",
                    transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = `${typeColor[n.type]||C.primary}15`}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : `${typeColor[n.type]||C.primary}08`}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${typeColor[n.type]||C.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                    {typeIcon[n.type] || "🔔"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{n.createdAtStr}</div>
                    {n.data?.txnId && <div style={{ fontSize: 10, color: C.info, marginTop: 2 }}>UTR: {n.data.txnId}</div>}
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.danger, flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const AdminSidebar = ({ active, setActive, onLogout, collapsed, setCollapsed, onHome }) => {
  const menus = [
    { id: "dashboard", icon: "🏠", label: t("dashboard")||"Dashboard" },
    { id: "liveClass", icon: "📡", label: "Online Classes", badge: "LIVE" },
    { id: "content", icon: "📱", label: "App Courses", badge: "NEW" },
    { id: "batches", icon: "📚", label: t("batches")||"Batches" },
    { id: "students", icon: "🎓", label: "Students" },
    { id: "teachers", icon: "👨‍🏫", label: "Teachers" },
    { id: "fees", icon: "💰", label: "Fees" },
    { id: "schedule", icon: "🗓️", label: "Schedule" },
    { id: "offers", icon: "🎁", label: "Offers/Deals", badge: "NEW" },
    { id: "features", icon: "✨", label: "Why SBC Features", badge: "NEW" },
    { id: "alumni", icon: "🏆", label: "Toppers/Alumni" },
    { id: "notices", icon: "📢", label: t("notices")||"Notices" },
    // "plans" — admin creates/edits/deletes subscription plans (plan CRUD UI).
    { id: "plans", icon: "📋", label: "Plans", badge: "NEW" },
    // "subscription" — view all paid subscriptions / payment dashboard.
    { id: "subscription", icon: "💎", label: "Subscriptions", badge: "NEW" },
    { id: "reports", icon: "📊", label: "Reports" },
    { id: "seclog", icon: "🔐", label: "Security Log" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <div style={{ width: collapsed ? 62 : 220, minHeight: "100vh", background: C.bgCard, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.3s", overflow: "hidden" }}>
      {/* NAVBAR HEADER WITH THREE OPTIONS */}
      <div style={{ padding: collapsed ? "12px 10px" : "14px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: collapsed ? "0" : "1" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#111" }}>SBC</div>
          {!collapsed && <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>समग्र भारत CC</div><div style={{ fontSize: 10, color: C.danger, fontWeight: 700 }}>Admin Panel</div></div>}
        </div>
        
        {/* THREE OPTIONS IN NAVBAR */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {!collapsed && <NotificationBell onNavigate={setActive} />}
          
          {/* Homepage Button */}
          <button onClick={onHome} title="Homepage" style={{ width: collapsed ? 34 : "auto", padding: collapsed ? "6px" : "6px 12px", borderRadius: 8, border: "none", background: `${C.primary}15`, color: C.primary, cursor: "pointer", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <span>🌐</span>{!collapsed && <span>Home</span>}
          </button>
          
          {/* Language Switcher */}
          {!collapsed && <div style={{ height: 28, display: "flex", alignItems: "center" }}><LangSwitcher /></div>}
          
          {/* Logout Button */}
          <button onClick={onLogout} title="Logout" style={{ width: collapsed ? 34 : "auto", padding: collapsed ? "6px" : "6px 12px", borderRadius: 8, border: "none", background: "#EF444415", color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
            <span>🚪</span>{!collapsed && <span>Logout</span>}
          </button>
          
          {/* Collapse Button */}
          <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 14, padding: "6px", borderRadius: 8, transition: "all 0.2s" }} title={collapsed ? "Expand" : "Collapse"}>
            {collapsed ? "▶" : "◀"}
          </button>
        </div>
      </div>

      {/* SIDEBAR MENU */}
      <nav style={{ flex: 1, padding: "10px 7px", overflowY: "auto" }}>
        {menus.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} title={collapsed ? item.label : ""}
            style={{ width: "100%", padding: collapsed ? "11px 0" : "10px 11px", borderRadius: 10, border: "none", marginBottom: 3, background: active === item.id ? `${C.primary}18` : "transparent", borderLeft: active === item.id ? `3px solid ${C.primary}` : "3px solid transparent", color: active === item.id ? C.primary : C.textMuted, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontWeight: active === item.id ? 700 : 400, fontSize: 13, justifyContent: collapsed ? "center" : "flex-start" }}>
            <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <><span style={{ whiteSpace: "nowrap", flex: 1 }}>{item.label}</span>{item.badge && <span style={{ background: item.badge === "LIVE" ? C.danger : C.success, color: "#fff", fontSize: 8, fontWeight: 900, padding: "2px 5px", borderRadius: 4 }}>{item.badge}</span>}</>}
          </button>
        ))}
      </nav>
    </div>
  );
};

// Keep old Sidebar as alias for Admin
const Sidebar = AdminSidebar;


// CopyBtn — copies text to clipboard, shows "Copied!" feedback
const CopyBtn = ({ text, label = "Copy", big = false }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else { fallbackCopy(text); }
    } catch(e) { fallbackCopy(text); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const fallbackCopy = (t) => {
    const el = document.createElement("textarea");
    el.value = t; el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.select();
    try { document.execCommand("copy"); } catch(e) {}
    document.body.removeChild(el);
  };
  return (
    <button onClick={doCopy}
      style={{ padding: big ? "13px 18px" : "7px 12px", borderRadius: big ? 14 : 9,
        border: `1px solid ${copied ? C.success+"55" : C.border}`,
        background: copied ? `${C.success}18` : C.bgCard2,
        color: copied ? C.success : C.textMuted,
        fontWeight: 700, fontSize: big ? 13 : 11, cursor: "pointer",
        display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", flexShrink:0,
        transition:"all 0.2s" }}>
      {copied ? "✅ Copied!" : `📋 ${label}`}
    </button>
  );
};


// ── Notification System ──
// Har payment/signup event ko DB mein store karo
const addNotification = (type, title, message, data = {}) => {
  const notifs = DB.get("admin_notifications") || [];
  const newNotif = {
    id: Date.now(),
    type,       // "payment" | "subscription" | "signup" | "teacher_signup"
    title,
    message,
    data,
    read: false,
    createdAt: Date.now(),
    createdAtStr: new Date().toLocaleString("en-IN"),
  };
  DB.set("admin_notifications", [newNotif, ...notifs].slice(0, 100)); // keep last 100
};


// ── Toast Notification (replaces alert() which fails in sandbox) ──
let _toastSetFn = null;
const toast = (msg, type = "success", duration = 3000) => {
  if (_toastSetFn) _toastSetFn({ msg, type, id: Date.now() });
};
const ToastContainer = () => {
  const [t, setT] = useState(null);
  useEffect(() => { _toastSetFn = setT; return () => { _toastSetFn = null; }; }, []);
  useEffect(() => {
    if (t) { const tm = setTimeout(() => setT(null), t.duration || 3000); return () => clearTimeout(tm); }
  }, [t]);
  if (!t) return null;
  const colors = { success: C.success, error: C.danger, info: C.info, warning: C.warning };
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:99999, pointerEvents:"none" }}>
      <div style={{ background: colors[t.type]||C.success, color:"#fff", borderRadius:14, padding:"12px 24px", fontSize:14, fontWeight:700, boxShadow:"0 8px 32px rgba(0,0,0,0.4)", whiteSpace:"nowrap", animation:"fadeInUp 0.3s ease" }}>
        {t.type==="success"?"✅":t.type==="error"?"❌":t.type==="warning"?"⚠️":"ℹ️"} {t.msg}
      </div>
    </div>
  );
};


// ============================================================
// ONLINE CLASS SYSTEM
// ============================================================
const SAMPLE_CLASSES = []; // Production: empty — Admin schedules real classes

const LiveClassSystem = ({ role, currentUser }) => {
  const [classes, setClasses] = useState(() => DB.get("liveClasses") || []);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedClass, setSelectedClass] = useState(null);
  const [batches, setBatches] = useState(() => DB.get("batches") || []);
  const emptyForm = { title: "", batchId: "", teacher: "", date: "", time: "", duration: 60, platform: "zoom", link: "", meetingId: "", password: "", subject: "", description: "", status: "upcoming", recordingLink: "" };
  const [form, setForm] = useState(emptyForm);

  // When batch is selected, auto-fill teacher, time, fees info
  const handleBatchSelect = (batchId) => {
    const batch = batches.find(b => String(b._id || b.id) === String(batchId));
    if (batch) {
      setForm(f => ({
        ...f, batchId,
        batchName: batch.name,
        teacher: batch.teacher || f.teacher,
        time: batch.time ? batch.time.split(" - ")[0].trim() : f.time,
        feeInfo: batch.fees ? `Rs.${batch.fees}/month` : "",
        subject: f.subject || batch.class || "",
        title: f.title || batch.name + " — Online Class",
      }));
    } else {
      setForm(f => ({ ...f, batchId, batchName: "" }));
    }
  };

  const save = () => {
    if (!form.title || !form.link || !form.date || !form.time) { toast("Title, Date and Meeting Link are required!", "error"); return; }
    (async () => {
      try {
        const payload = {
          topic: form.title,
          description: form.description,
          batchId: form.batchId,
          teacherId: currentUser?._id || undefined,
          startAt: new Date(form.date + 'T' + form.time).toISOString(),
          durationMinutes: Number(form.duration) || 60,
          joinUrl: form.link,
        };
        // If editing existing class, call update
        if (form.id && String(form.id).length > 5 && form.id.toString().match(/^[0-9a-fA-F]{24}$/)) {
          // backend ID looks like ObjectId
          await apiCall(`/live-classes/${form.id}`, { method: 'PUT', body: payload });
        } else {
          const resp = await apiCall('/live-classes', { method: 'POST', body: payload });
          const created = resp?.data || resp;
          // merge created data into local DB list
          const updated = [...classes, created];
          setClasses(updated);
          DB.set('liveClasses', updated);
        }
        setShowForm(false);
        setForm(emptyForm);
        toast('Live class saved', 'success');
      } catch (err) {
        console.error(err);
        toast(err?.message || 'Failed to save class', 'error');
      }
    })();
  };

  const del = (id) => {
    (async () => {
      try {
        // If id appears to be backend ObjectId, call API
        if (String(id).match(/^[0-9a-fA-F]{24}$/)) {
          await apiCall(`/live-classes/${id}`, { method: 'DELETE' });
          const u = classes.filter(c => String(c._id || c.id) !== String(id));
          setClasses(u); DB.set('liveClasses', u);
        } else {
          const u = classes.filter(c => c.id !== id);
          setClasses(u); DB.set('liveClasses', u);
        }
        if (selectedClass && (selectedClass.id === id || selectedClass._id === id)) setSelectedClass(null);
        toast('Deleted', 'success');
      } catch (err) {
        console.error(err);
        toast('Delete failed', 'error');
      }
    })();
  };
  const setStatus = (id, status) => {
    (async () => {
      try {
        if (String(id).match(/^[0-9a-fA-F]{24}$/)) {
          await apiCall(`/live-classes/${id}`, { method: 'PUT', body: { status } });
          const u = classes.map(c => (String(c._id || c.id) === String(id) ? { ...(c._doc || c), status } : c));
          setClasses(u); DB.set('liveClasses', u);
          if (selectedClass && (selectedClass.id === id || selectedClass._id === id)) setSelectedClass(p => ({ ...p, status }));
        } else {
          const u = classes.map(c => c.id === id ? { ...c, status } : c);
          setClasses(u); DB.set('liveClasses', u);
          if (selectedClass?.id === id) setSelectedClass(p => ({ ...p, status }));
        }
      } catch (err) {
        console.error(err);
        toast('Failed to update status', 'error');
      }
    })();
  };

  // Sync from backend on mount: fetch live classes and batches
  useEffect(() => {
    (async () => {
      try {
        const lcResp = await apiCall('/live-classes');
        const items = lcResp?.data || [];
        if (items && items.length) {
          // normalize date/time and compute status
          const norm = items.map((c) => {
            try {
              const start = c.startAt ? new Date(c.startAt) : (c.date && c.time ? new Date(c.date + 'T' + c.time) : null);
              const duration = Number(c.durationMinutes || c.duration || 60) || 60;
              if (start) {
                c.date = start.toLocaleDateString('en-IN');
                c.time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                c.duration = duration;
                const now = new Date();
                const end = new Date(start.getTime() + duration * 60000);
                c.status = now >= start && now <= end ? 'live' : now < start ? 'upcoming' : 'completed';
              }
            } catch (_) {}
            return c;
          });
          setClasses(norm);
          DB.set('liveClasses', norm);
        }
      } catch (e) {
        // ignore — fall back to local DB
      }
      try {
        const bResp = await apiCall('/batches?all=1&limit=200');
        const bitems = bResp?.data || [];
        if (bitems && bitems.length) {
          setBatches(bitems);
          DB.set('batches', bitems);
        }
      } catch (e) {}
    })();
  }, []);

  // Listen for live-classes updates dispatched by other admin pages
  useEffect(() => {
    const handler = () => {
      try {
        const items = DB.get('liveClasses') || [];
        // recompute status for any stored items
        const norm = (items || []).map((c) => {
          try {
            const start = c.startAt ? new Date(c.startAt) : (c.date && c.time ? new Date(c.date + 'T' + c.time) : null);
            const duration = Number(c.durationMinutes || c.duration || 60) || 60;
            if (start) {
              c.date = start.toLocaleDateString('en-IN');
              c.time = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              c.duration = duration;
              const now = new Date();
              const end = new Date(start.getTime() + duration * 60000);
              c.status = now >= start && now <= end ? 'live' : now < start ? 'upcoming' : 'completed';
            }
          } catch (_) {}
          return c;
        });
        setClasses(norm);
      } catch (_) {}
    };
    window.addEventListener('sbc:live-classes-updated', handler);
    return () => window.removeEventListener('sbc:live-classes-updated', handler);
  }, []);

  // Periodically recompute statuses so the UI flips to LIVE when time arrives
  useEffect(() => {
    const tick = () => {
      setClasses((prev) => {
        const now = new Date();
        const updated = (prev || []).map((c) => {
          try {
            const start = c.startAt ? new Date(c.startAt) : (c.date && c.time ? new Date(c.date + 'T' + c.time) : null);
            const duration = Number(c.durationMinutes || c.duration || 60) || 60;
            if (start) {
              const end = new Date(start.getTime() + duration * 60000);
              const newStatus = now >= start && now <= end ? 'live' : now < start ? 'upcoming' : 'completed';
              if (newStatus !== c.status) {
                return { ...c, status: newStatus, date: start.toLocaleDateString('en-IN'), time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration };
              }
            }
          } catch (_) {}
          return c;
        });
        // persist if any status changed
        try { DB.set('liveClasses', updated); } catch (_) {}
        return updated;
      });
    };
    const id = setInterval(tick, 15000); // check every 15s
    return () => clearInterval(id);
  }, []);
  const editClass = (cls) => { setForm({ ...cls }); setShowForm(true); setSelectedClass(null); };

  // Students see only their batch's classes
  const myBatch = currentUser?.batch || "";
  const visibleClasses = role === "student"
    ? classes.filter(c => !myBatch || c.batchName === myBatch || c.batchId === currentUser?.batchId)
    : classes;
  const filtered = visibleClasses.filter(c => activeTab === "all" || c.status === activeTab);

  const platformInfo = {
    zoom:       { name: "Zoom",         color: "#2D8CFF", icon: "🎥", hint: "Zoom → Schedule Meeting → Copy Link + ID + Password" },
    googlemeet: { name: "Google Meet",  color: "#00897B", icon: "📹", hint: "Google Meet → New Meeting → Copy Link" },
    teams:      { name: "MS Teams",     color: "#6264A7", icon: "💼", hint: "Teams → Calendar → New Meeting → Copy Join Link" },
    youtube:    { name: "YouTube Live", color: "#FF0000", icon: "▶️", hint: "YouTube Studio → Go Live → Copy Stream URL (shows directly in app!)" },
    custom:     { name: "Custom Link",  color: C.primary, icon: "🔗", hint: "Paste any meeting/class link here" },
  };

  // ── CLASS DETAIL VIEW ──
  if (selectedClass) {
    const cls = selectedClass;
    const pl = platformInfo[cls.platform] || platformInfo.custom;
    const batchData = batches.find(b => String(b.id) === String(cls.batchId));
    const isYoutubeLive = cls.platform === "youtube";
    const embedSrc = cls.link
      ? (cls.link.includes("embed") ? cls.link
        : cls.link.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/")) + (cls.status==="live"?"?autoplay=1":"")
      : null;

    const copyText = (text, label) => {
      try {
        navigator.clipboard.writeText(text).then(()=>{}).catch(()=>{});
      } catch(e) {}
      // Show visual feedback via state
    };

    return (
      <div style={{ paddingBottom: 16 }}>
        {/* Back button */}
        <button onClick={() => setSelectedClass(null)}
          style={{ background:"none", border:"none", color:C.primary, cursor:"pointer", fontSize:13, fontWeight:700, marginBottom:18, display:"flex", alignItems:"center", gap:6 }}>
          ← Back to Classes
        </button>

        {/* Status header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, flexWrap:"wrap" }}>
          <div style={{ width:12, height:12, borderRadius:"50%",
            background: cls.status==="live" ? C.danger : cls.status==="upcoming" ? C.info : C.success,
            boxShadow: cls.status==="live" ? `0 0 12px ${C.danger}` : "none"
          }} />
          <div>
            <h2 style={{ color:C.text, margin:0, fontSize:19, fontWeight:900 }}>{cls.title}</h2>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
              {cls.batchName && <span style={{marginRight:10}}>📚 {cls.batchName}</span>}
              {cls.teacher && <span style={{marginRight:10}}>👨‍🏫 {cls.teacher}</span>}
              <span style={{ padding:"2px 10px", borderRadius:99, fontWeight:700, fontSize:11,
                background: cls.status==="live"?`${C.danger}22`:cls.status==="upcoming"?`${C.info}22`:`${C.success}22`,
                color: cls.status==="live"?C.danger:cls.status==="upcoming"?C.info:C.success
              }}>
                {cls.status==="live"?"🔴 LIVE NOW":cls.status==="upcoming"?"⏰ Upcoming":"✅ Completed"}
              </span>
            </div>
          </div>
        </div>

        {/* ── YOUTUBE LIVE: embed directly ── */}
        {cls.status === "live" && isYoutubeLive && embedSrc && (
          <div style={{ background:C.bgCard, borderRadius:18, overflow:"hidden", border:`2px solid ${C.danger}`, marginBottom:18 }}>
            <div style={{ background:C.danger, padding:"10px 18px", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:9, height:9, borderRadius:"50%", background:"#fff" }} />
              <span style={{ color:"#fff", fontWeight:800, fontSize:13 }}>🔴 LIVE — {cls.title}</span>
            </div>
            <div style={{ position:"relative", paddingBottom:"56.25%", height:0, background:"#000" }}>
              <iframe src={embedSrc} style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                allow="autoplay; encrypted-media" allowFullScreen title="Live Class" />
            </div>
          </div>
        )}

        {/* ── COMPLETED: show recording if available ── */}
        {cls.status === "completed" && cls.recordingLink && (
          <div style={{ background:C.bgCard, borderRadius:18, overflow:"hidden", border:`1px solid ${C.border}`, marginBottom:18 }}>
            <div style={{ background:C.bgCard2, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:16 }}>📹</span>
              <span style={{ color:C.text, fontWeight:800, fontSize:13 }}>Class Recording</span>
            </div>
            <div style={{ position:"relative", paddingBottom:"56.25%", height:0, background:"#000" }}>
              <iframe
                src={cls.recordingLink.includes("embed")?cls.recordingLink:cls.recordingLink.replace("watch?v=","embed/").replace("youtu.be/","youtube.com/embed/")}
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                allowFullScreen title="Recording" />
            </div>
          </div>
        )}

        {/* ── JOIN SECTION: Zoom / Meet / Teams / non-YT ── */}
        {(cls.status === "live" || cls.status === "upcoming") && !isYoutubeLive && (
          <div style={{ background:C.bgCard, border:`2px solid ${cls.status==="live"?C.danger+"66":C.border}`, borderRadius:18, padding:"22px 20px", marginBottom:18 }}>
            {/* Platform badge */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${pl.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{pl.icon}</div>
              <div>
                <div style={{ fontWeight:800, color:C.text, fontSize:15 }}>{pl.name}</div>
                <div style={{ fontSize:12, color:C.textMuted }}>{cls.status==="live"?"Class is live now — join immediately!":"Class scheduled for " + cls.date + " at " + cls.time}</div>
              </div>
            </div>

            {/* Meeting ID & Password — with copy buttons */}
            {(cls.meetingId || cls.password) && (
              <div style={{ background:C.bgCard2, borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", flexDirection:"column", gap:10 }}>
                {cls.meetingId && (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, marginBottom:2 }}>MEETING ID</div>
                      <div style={{ fontSize:18, fontWeight:900, color:C.text, letterSpacing:3 }}>{cls.meetingId}</div>
                    </div>
                    <CopyBtn text={cls.meetingId} label="Copy ID" />
                  </div>
                )}
                {cls.meetingId && cls.password && <div style={{ height:1, background:C.border }} />}
                {cls.password && (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, marginBottom:2 }}>PASSWORD</div>
                      <div style={{ fontSize:16, fontWeight:800, color:C.text, letterSpacing:2 }}>{cls.password}</div>
                    </div>
                    <CopyBtn text={cls.password} label="Copy" />
                  </div>
                )}
              </div>
            )}

            {/* Join Link */}
            {cls.link && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:C.textMuted, fontWeight:700, marginBottom:8 }}>MEETING LINK</div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ flex:1, background:C.bgCard2, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {cls.link}
                  </div>
                  <CopyBtn text={cls.link} label="Copy" />
                </div>
              </div>
            )}

            {/* BIG JOIN BUTTON */}
            <div style={{ display:"flex", gap:10 }}>
              {cls.status === "live" && (
                <button
                  onClick={() => window.open(cls.link, "_blank")}
                  style={{ flex:1, padding:"15px 0", borderRadius:14, border:"none", background:`linear-gradient(135deg, ${pl.color}, ${pl.color}bb)`, color:"#fff", fontSize:16, fontWeight:900, cursor:"pointer", boxShadow:`0 6px 24px ${pl.color}55`, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {pl.icon} Join {pl.name} Now →
                </button>
              )}
              {cls.status === "upcoming" && (
                <button
                  onClick={() => window.open(cls.link, "_blank")}
                  style={{ flex:1, padding:"13px 0", borderRadius:14, border:`2px solid ${pl.color}55`, background:`${pl.color}12`, color:pl.color, fontSize:14, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {pl.icon} Open {pl.name} Link
                </button>
              )}
              <CopyBtn text={cls.link} label="Copy Link" big />
            </div>

            {cls.status === "upcoming" && (
              <div style={{ marginTop:12, padding:"10px 14px", background:`${C.info}10`, borderRadius:10, fontSize:12, color:C.textMuted, textAlign:"center" }}>
                📅 Class will start on <strong style={{color:C.text}}>{cls.date}</strong> at <strong style={{color:C.text}}>{cls.time}</strong>
                {cls.duration && ` · Duration: ${cls.duration} min`}
              </div>
            )}
          </div>
        )}

        {/* Class info grid */}
        <Card style={{ marginBottom:14 }}>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📋 Class Details</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              ["📖", "Subject", cls.subject],
              ["📅", "Date", cls.date],
              ["⏰", "Time", cls.time],
              ["⏱️", "Duration", cls.duration ? cls.duration+" min" : ""],
              ["👥", "Batch", cls.batchName || cls.batch],
              ["👨‍🏫", "Teacher", cls.teacher],
            ].filter(([,,v])=>v).map(([icon,label,val])=>(
              <div key={label} style={{ background:C.bgCard2, borderRadius:10, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:C.textMuted, fontWeight:700 }}>{icon} {label}</div>
                <div style={{ fontSize:13, color:C.text, fontWeight:700, marginTop:3 }}>{val}</div>
              </div>
            ))}
          </div>
          {cls.description && (
            <p style={{ color:C.textMuted, fontSize:13, margin:"12px 0 0", lineHeight:1.6, padding:"10px 12px", background:C.bgCard2, borderRadius:10 }}>{cls.description}</p>
          )}
        </Card>

        {/* Admin / Teacher controls */}
        {(role === "admin" || role === "teacher") && (
          <Card style={{ border:`1px solid ${C.warning}33` }}>
            <div style={{ fontSize:12, color:C.warning, fontWeight:800, marginBottom:12, letterSpacing:1 }}>⚙️ CLASS CONTROLS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {cls.status === "upcoming" && (
                <button onClick={()=>setStatus(cls.id,"live")}
                  style={{ flex:1, minWidth:120, padding:"10px 0", borderRadius:11, border:"none", background:C.danger, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  🔴 Start Live Now
                </button>
              )}
              {cls.status === "live" && (
                <button onClick={()=>setStatus(cls.id,"completed")}
                  style={{ flex:1, minWidth:120, padding:"10px 0", borderRadius:11, border:`1px solid ${C.success}55`, background:`${C.success}15`, color:C.success, fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  ✅ End Class
                </button>
              )}
              <button onClick={()=>editClass(cls)}
                style={{ flex:1, minWidth:100, padding:"10px 0", borderRadius:11, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                ✏️ Edit
              </button>
              <button onClick={()=>del(cls.id)}
                style={{ padding:"10px 16px", borderRadius:11, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                🗑️
              </button>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── MAIN LIST VIEW ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>📡 Online Live Classes</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "6px 0 0" }}>Zoom · Google Meet · MS Teams · YouTube Live</p>
        </div>
        {(role === "admin" || role === "teacher") && (
          <Btn variant="primary" onClick={() => { setForm(emptyForm); setShowForm(!showForm); }}>+ Schedule Class</Btn>
        )}
      </div>

      {/* LIVE NOW BANNER */}
      {visibleClasses.filter(c => c.status === "live").map(cls => {
        const pl = platformInfo[cls.platform] || platformInfo.custom;
        return (
          <div key={cls.id} onClick={() => setSelectedClass(cls)} style={{ background: `linear-gradient(135deg, ${C.danger}22, ${C.bgCard2})`, border: `2px solid ${C.danger}66`, borderRadius: 16, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", flexWrap: "wrap" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.danger, boxShadow: `0 0 10px ${C.danger}`, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: C.text }}>🔴 LIVE NOW: {cls.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>{cls.batchName} · {cls.teacher} · {pl.name}</div>
            </div>
            <button onClick={(e)=>{ e.stopPropagation(); window.open(cls.link,"_blank"); }}
              style={{ padding:"10px 20px", borderRadius:11, border:"none", background:C.danger, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", flexShrink:0 }}>
              🔴 Join Now →
            </button>
          </div>
        );
      })}

      {/* SCHEDULE FORM */}
      {showForm && (role === "admin" || role === "teacher") && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44` }}>
          <h3 style={{ color: C.text, margin: "0 0 20px", fontSize: 16 }}>{form.id ? "✏️ Edit Class" : "📡 Schedule New Online Class"}</h3>

          {/* Batch selector — auto-fills teacher, time, fees */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>BATCH CHUNEN (automatically teacher, time, fees fill hoga) *</label>
            {batches.length === 0 ? (
              <div style={{ padding: "12px 16px", background: `${C.warning}11`, border: `1px solid ${C.warning}33`, borderRadius: 10, fontSize: 13, color: C.warning }}>
                ⚠️ Pehle Admin panel mein Batches add karein
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {batches.filter(b => b.active !== false).map(b => {
                  const key = b._id || b.id;
                  const stringKey = String(key);
                  const isSelected = String(form.batchId) === stringKey;
                  return (
                    <div key={stringKey} onClick={() => handleBatchSelect(stringKey)} style={{
                      padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                      border: `2px solid ${isSelected ? C.primary : C.border}`,
                      background: isSelected ? `${C.primary}10` : C.bgCard2,
                      transition: "all 0.2s"
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                        {b.teacher} · {b.time} · Rs.{b.fees}/mo
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="CLASS TITLE *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Mathematics — Chapter 5 Revision" />
            <Input label="SUBJECT" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" />
            <Input label="TEACHER" value={form.teacher} onChange={e => setForm({ ...form, teacher: e.target.value })} placeholder="Auto-filled from batch" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>PLATFORM</label>
              <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none" }}>
                <option value="zoom">🎥 Zoom</option>
                <option value="googlemeet">📹 Google Meet</option>
                <option value="teams">💼 Microsoft Teams</option>
                <option value="youtube">▶️ YouTube Live (app mein direct dikhega)</option>
                <option value="custom">🔗 Custom Link</option>
              </select>
            </div>
            <Input label="DATE *" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} type="date" />
            <Input label="TIME *" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} type="time" />
            <Input label="DURATION (minutes)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} type="number" placeholder="60" />
            <div style={{ gridColumn: "1 / -1", padding: "10px 14px", background: `${(platformInfo[form.platform] || platformInfo.custom).color}11`, border: `1px solid ${(platformInfo[form.platform] || platformInfo.custom).color}33`, borderRadius: 10, fontSize: 12, color: C.textMuted }}>
              💡 {(platformInfo[form.platform] || platformInfo.custom).hint}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="MEETING LINK *" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://zoom.us/j/... ya meet.google.com/..." />
            </div>
            {form.platform === "zoom" && (
              <>
                <Input label="ZOOM MEETING ID" value={form.meetingId} onChange={e => setForm({ ...form, meetingId: e.target.value })} placeholder="123 456 7890" />
                <Input label="ZOOM PASSWORD" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="SBC2024" />
              </>
            )}
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="DESCRIPTION (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Topics covered, chapter details..." />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <Input label="RECORDING LINK (add after class — YouTube embed URL)" value={form.recordingLink} onChange={e => setForm({ ...form, recordingLink: e.target.value })} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>STATUS</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none" }}>
                <option value="upcoming">⏰ Upcoming</option>
                <option value="live">🔴 Live Now</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <Btn variant="primary" onClick={save}>{form.id ? "✅ Update" : "✅ Schedule"}</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); setForm(emptyForm); }}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[["upcoming","⏰ Upcoming"],["live","🔴 Live"],["completed","✅ Done"],["all","📋 All"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "8px 16px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: activeTab === key ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : C.bgCard2, color: activeTab === key ? "#fff" : C.textMuted }}>
            {label} ({visibleClasses.filter(c => key === "all" || c.status === key).length})
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "52px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📡</div>
          <div style={{ fontWeight: 800, color: C.text, fontSize: 17, marginBottom: 8 }}>
            {activeTab === "live" ? "No live class running right now" : "No classes found"}
          </div>
          <div style={{ color: C.textMuted, fontSize: 13 }}>
            {(role === "admin" || role === "teacher")
              ? "Use the + Schedule Class button above to add a class"
              : role === "student"
                ? "Classes will appear here when teacher schedules them"
                : "Classes jald schedule hongi"
            }
          </div>
          {(role === "admin" || role === "teacher") && batches.length === 0 && (
            <div style={{ marginTop: 16, padding: "12px 20px", background: `${C.warning}11`, border: `1px solid ${C.warning}33`, borderRadius: 12, fontSize: 13, color: C.warning }}>
              ⚠️ First create a batch in Admin → Batches, then schedule a class
            </div>
          )}
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(cls => {
            const pl = platformInfo[cls.platform] || platformInfo.custom;
            return (
              <div key={cls.id} style={{ background: C.bgCard, border: `1px solid ${cls.status === "live" ? C.danger + "66" : C.border}`, borderRadius: 18, overflow: "hidden", boxShadow: cls.status === "live" ? `0 0 20px ${C.danger}22` : "none", transition: "transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                <div style={{ background: `${pl.color}15`, padding: "11px 16px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 17 }}>{pl.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: pl.color }}>{pl.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: cls.status === "live" ? `${C.danger}22` : cls.status === "upcoming" ? `${C.info}22` : `${C.textMuted}22`, color: cls.status === "live" ? C.danger : cls.status === "upcoming" ? C.info : C.textMuted }}>
                    {cls.status === "live" ? "🔴 LIVE" : cls.status === "upcoming" ? "⏰ Soon" : "✅ Done"}
                  </span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 4 }}>{cls.title}</div>
                  {cls.subject && <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, marginBottom: 8 }}>{cls.subject}</div>}
                  {[
                    ["👥", cls.batchName || cls.batch],
                    ["👨‍🏫", cls.teacher],
                    ["📅", cls.date + " · " + cls.time],
                    ["⏱️", cls.duration + " min"],
                    ["💰", cls.feeInfo],
                  ].filter(([,v]) => v).map(([icon, val]) => (
                    <div key={val} style={{ display: "flex", gap: 8, fontSize: 12, color: C.textMuted, marginBottom: 4 }}><span>{icon}</span><span>{val}</span></div>
                  ))}
                </div>
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                  {cls.status === "live" ? (
                    <button onClick={()=>setSelectedClass(cls)}
                      style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:C.danger, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                      🔴 Join Class
                    </button>
                  ) : cls.status === "completed" ? (
                    <button onClick={()=>setSelectedClass(cls)}
                      style={{ flex:1, padding:"9px 0", borderRadius:10, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      📹 Recording
                    </button>
                  ) : (
                    <button onClick={()=>setSelectedClass(cls)}
                      style={{ flex:1, padding:"9px 0", borderRadius:10, border:`1px solid ${C.info}44`, background:`${C.info}12`, color:C.info, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      👁️ View Details
                    </button>
                  )}
                  {(role === "admin" || role === "teacher") && (
                    <>
                      <Btn variant="ghost" size="sm" onClick={() => editClass(cls)}>✏️</Btn>
                      <Btn variant="danger" size="sm" onClick={() => del(cls.id)}>🗑️</Btn>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; // ← end of LiveClassSystem (was missing — caused all components below to be nested inside it)

// ============================================================
// NOTE: OffersManager, AlumniManager, FeaturesManager are imported
// from ./components/Admin/index.js at line 43
// ============================================================

// ============================================================
// BatchesManager - Batch Management Component
// ============================================================
const BatchesManager = () => {
  const emptyForm = { name:"", class:"", board:"CBSE", time:"", days:"Mon-Sat", teacher:"", fees:"", students:0, description:"" };
  const [batches, setBatches] = useState(() => DB.get("batches") || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const { confirm: askConfirm, Dialog: ConfirmDialog } = useConfirm();

  // Get teachers list for dropdown
  const teachersList = (DB.get("teachers") || []).filter(t => t.status === "Approved" || t.status === "approved");

  const openAdd = () => { setForm(emptyForm); setErr(""); setShowForm(true); };
  const openEdit = (b) => { setForm({ ...b, fees: String(b.fees||""), students: String(b.students||0) }); setErr(""); setShowForm(true); };

  const saveBatch = () => {
    setErr("");
    if (!form.name.trim()) { setErr("Batch name is required"); return; }
    if (!form.class.trim()) { setErr("Class is required"); return; }
    if (!form.time.trim()) { setErr("Time is required"); return; }
    if (!form.teacher.trim()) { setErr("Teacher name is required"); return; }

    const record = {
      ...form,
      id: form.id || Date.now(),
      fees: parseInt(form.fees) || 0,
      students: parseInt(form.students) || 0,
      active: true,
    };
    const updated = form.id
      ? batches.map(b => String(b.id) === String(form.id) ? record : b)
      : [...batches, record];
    setBatches(updated);
    DB.set("batches", updated);
    setShowForm(false);
    setForm(emptyForm);
  };

  const deleteBatch = async (id, name) => {
    const ok = await askConfirm(`Delete batch "${name}"?\nThis cannot be undone!`);
    if (!ok) return;
    const updated = batches.filter(b => b.id !== id);
    setBatches(updated);
    DB.set("batches", updated);
  };

  const toggleActive = (id) => {
    const updated = batches.map(b => b.id === id ? { ...b, active: !b.active } : b);
    setBatches(updated);
    DB.set("batches", updated);
  };

  const filtered = batches.filter(b =>
    !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.teacher?.toLowerCase().includes(search.toLowerCase()) ||
    b.class?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {ConfirmDialog}
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📚 Batch Management</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>{batches.length} batches · {batches.filter(b=>b.active).length} active</p>
        </div>
        <Btn variant="primary" onClick={openAdd}>+ New Batch</Btn>
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:18 }}>
        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.textMuted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batches..."
          style={{ width:"100%", padding:"10px 14px 10px 38px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card style={{ marginBottom:22, border:`2px solid ${C.primary}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:17, fontWeight:900 }}>
              {form.id ? "✏️ Edit Batch" : "➕ New Batch"}
            </h3>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          {err && (
            <div style={{ background:`${C.danger}15`, border:`1px solid ${C.danger}44`, borderRadius:10, padding:"10px 14px", color:C.danger, fontSize:13, marginBottom:14 }}>
              ⚠️ {err}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <Input label="BATCH NAME *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Class 10 CBSE Morning Batch" />
            </div>
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>CLASS *</label>
              <select value={form.class} onChange={e=>setForm({...form,class:e.target.value})}
                style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:form.class?C.text:C.textMuted, fontSize:14, outline:"none" }}>
                <option value="">Select Class...</option>
                {["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12","All Classes"].map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>BOARD *</label>
              <select value={form.board} onChange={e=>setForm({...form,board:e.target.value})}
                style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }}>
                <option value="CBSE">CBSE</option>
                <option value="State">State Board</option>
                <option value="CBSE/State">CBSE / State</option>
                <option value="ICSE">ICSE</option>
              </select>
            </div>
            <Input label="TIME *" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} placeholder="e.g. 7:00 AM - 9:00 AM" />
            <Input label="DAYS" value={form.days} onChange={e=>setForm({...form,days:e.target.value})} placeholder="e.g. Mon, Wed, Fri" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>TEACHER *</label>
              {teachersList.length > 0 ? (
                <select value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:form.teacher?C.text:C.textMuted, fontSize:14, outline:"none" }}>
                  <option value="">Select Teacher...</option>
                  {teachersList.map(t=>(
                    <option key={t.id} value={t.name}>{t.name} — {t.subject}</option>
                  ))}
                  <option value="__custom">Type manually...</option>
                </select>
              ) : (
                <input value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})} placeholder="Teacher name"
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }} />
              )}
              {form.teacher === "__custom" && (
                <input value={form._customTeacher||""} onChange={e=>setForm({...form,teacher:e.target.value,_customTeacher:e.target.value})}
                  placeholder="Enter teacher name" autoFocus
                  style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.primary}55`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", marginTop:8 }} />
              )}
            </div>
            <Input label="MONTHLY FEES (₹)" value={form.fees} onChange={e=>setForm({...form,fees:e.target.value})} placeholder="1200" type="number" />
            <Input label="NO. OF STUDENTS" value={form.students} onChange={e=>setForm({...form,students:e.target.value})} placeholder="0" type="number" />
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>DESCRIPTION (Optional)</label>
              <input value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}
                placeholder="e.g. Focused on board exam preparation, small batch of 20 students"
                style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:20 }}>
            <Btn variant="primary" onClick={saveBatch} style={{ flex:1 }}>
              {form.id ? "✅ Update Batch" : "✅ Create Batch"}
            </Btn>
            <Btn variant="ghost" onClick={()=>{ setShowForm(false); setForm(emptyForm); setErr(""); }}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}

      {/* Batch Cards */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📭</div>
          <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>{search ? "No batches match your search" : "No batches yet"}</div>
          <p style={{ color:C.textMuted, fontSize:13 }}>Click "+ New Batch" to create your first batch.</p>
        </Card>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(290px, 1fr))", gap:16 }}>
          {filtered.map(b => (
            <Card key={b.id} style={{ opacity: b.active===false ? 0.65 : 1, border:`1px solid ${b.active===false?C.border:C.border}` }}>
              {/* Card header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:4 }}>{b.name}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Badge text={b.board} type={b.board==="CBSE"?"primary":"warning"} />
                    <Badge text={b.class} type="default" />
                    {b.active===false && <Badge text="Inactive" type="danger" />}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:14 }}>
                {[
                  ["⏰", "Time", b.time],
                  ["📅", "Days", b.days],
                  ["👨‍🏫", "Teacher", b.teacher],
                  ["💰", "Fees", b.fees ? `₹${b.fees}/month` : "—"],
                  ["👥", "Students", b.students || 0],
                ].map(([icon, label, val]) => (
                  <div key={label} style={{ display:"flex", gap:10, fontSize:13 }}>
                    <span style={{ minWidth:20 }}>{icon}</span>
                    <span style={{ color:C.textMuted, minWidth:52 }}>{label}:</span>
                    <span style={{ color:C.text, fontWeight:600, flex:1 }}>{val}</span>
                  </div>
                ))}
                {b.description && (
                  <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5, marginTop:4, padding:"8px 10px", background:C.bgCard2, borderRadius:8 }}>{b.description}</div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => openEdit(b)}
                  style={{ flex:1, padding:"9px 0", borderRadius:10, border:`1px solid ${C.primary}55`, background:`${C.primary}12`, color:C.primary, fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  ✏️ Edit
                </button>
                <button onClick={() => toggleActive(b.id)}
                  style={{ padding:"9px 12px", borderRadius:10, border:`1px solid ${C.warning}55`, background:`${C.warning}12`, color:C.warning, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                  {b.active===false ? "▶ Activate" : "⏸ Pause"}
                </button>
                <button onClick={() => deleteBatch(b.id, b.name)}
                  style={{ padding:"9px 12px", borderRadius:10, border:`1px solid ${C.danger}55`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  🗑️
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// STUDENTS MANAGER
// ============================================================

const StudentsManager = ({ role }) => {
  const [students, setStudents] = useState(() => DB.get("students") || []);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // for inline approval edit
  const [assignForm, setAssignForm] = useState({});
  const [tick, setTick] = useState(0);
  const batches = DB.get("batches") || [];
  const emptyForm = { name:"", class:"", board:"CBSE", batch:"", batchId:"", rollNo:"", phone:"", fees:"Pending", attendance:0, avatar:"", password:"student123", email:"" };
  const [form, setForm] = useState(emptyForm);

  // Live tick every second for countdown timers
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t+1), 1000);
    return () => clearInterval(iv);
  }, []);

  // Refresh students from DB (in case auto-approve fired)
  useEffect(() => {
    setStudents(DB.get("students") || []);
  }, [tick]);

  const pending = students.filter(s => s.status === "Pending Approval");
  const approved = students.filter(s => s.status === "approved" || s.status === "Approved");
  const rejected = students.filter(s => s.status === "Rejected");

  const filtered = (tab==="pending"?pending:tab==="approved"?approved:tab==="rejected"?rejected:students)
    .filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.rollNo?.includes(search));

  const approveStudent = (s) => {
    const af = assignForm[s.id] || {};
    const allStudents = DB.get("students") || [];
    const approvedCount = allStudents.filter(x => x.rollNo?.startsWith("SBC")).length;
    const rollNo = af.rollNo?.trim() || s.rollNo || ("SBC" + String(approvedCount + 1).padStart(5, "0"));
    const batch = batches.find(b => String(b.id) === String(af.batchId));
    const updated = allStudents.map(x => x.id === s.id ? {
      ...x,
      status: "approved",
      rollNo,
      class: af.class || x.class || "",
      board: af.board || x.board || "CBSE",
      batchId: af.batchId || x.batchId || "",
      batch: batch?.name || x.batch || "",
      approvedAt: Date.now(),
      approvedBy: "admin",
    } : x);
    DB.set("students", updated);
    setStudents(updated);
    setEditingId(null);
    toast("✅ Student approved! Roll No: " + rollNo);
  };

  const rejectStudent = (id) => {
    const updated = (DB.get("students")||[]).map(s => s.id===id ? {...s, status:"Rejected"} : s);
    DB.set("students", updated); setStudents(updated);
    toast("Student rejected", "warning");
  };

  const deleteStudent = (id) => {
    const updated = (DB.get("students")||[]).filter(s => s.id !== id);
    DB.set("students", updated); setStudents(updated);
    toast("Student deleted");
  };

  const saveNewStudent = () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    const allS = DB.get("students") || [];
    const approvedCount = allS.filter(x => x.rollNo?.startsWith("SBC")).length;
    const rollNo = form.rollNo || ("SBC" + String(approvedCount + 1).padStart(5, "0"));
    const avatar = form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
    const batch = batches.find(b => String(b.id) === String(form.batchId));
    const updated = [...allS, { ...form, id:Date.now(), rollNo, avatar, batch:batch?.name||form.batch, attendance:parseInt(form.attendance)||0, status:"approved", joinedOn:new Date().toLocaleDateString("en-IN") }];
    DB.set("students", updated); setStudents(updated);
    setShowForm(false); setForm(emptyForm);
    toast("Student enrolled! Roll No: " + rollNo);
  };

  // Countdown timer display
  const getCountdown = (autoApproveAt) => {
    if (!autoApproveAt) return null;
    const ms = autoApproveAt - Date.now();
    if (ms <= 0) return "⏳ Auto-approving...";
    const h = Math.floor(ms/3600000);
    const m = Math.floor((ms%3600000)/60000);
    const s = Math.floor((ms%60000)/1000);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>🎓 Students</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>
            {pending.length > 0 && <span style={{ color:C.warning, fontWeight:700 }}>🔔 {pending.length} pending approval · </span>}
            {approved.length} approved · {students.length} total
          </p>
        </div>
        {role === "admin" && <button onClick={()=>setShowForm(!showForm)}
          style={{ padding:"10px 18px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontWeight:800, fontSize:13, cursor:"pointer" }}>
          + Enroll Student
        </button>}
      </div>

      {/* Manual Enroll Form */}
      {showForm && (
        <Card style={{ marginBottom:20, border:`1px solid ${C.primary}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:16, fontWeight:800 }}>➕ Enroll New Student</h3>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><Input label="FULL NAME *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Arjun Sharma" /></div>
            <Input label="PHONE" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="9876543210" />
            <Input label="EMAIL" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="student@email.com" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>CLASS</label>
              <select value={form.class} onChange={e=>setForm({...form,class:e.target.value})} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }}>
                <option value="">Select...</option>
                {["6th","7th","8th","9th","10th","11th","12th"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>BOARD</label>
              <select value={form.board} onChange={e=>setForm({...form,board:e.target.value})} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }}>
                <option value="CBSE">CBSE</option><option value="State">State Board</option><option value="ICSE">ICSE</option>
              </select>
            </div>
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>BATCH</label>
              <select value={form.batchId} onChange={e=>setForm({...form,batchId:e.target.value})} style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }}>
                <option value="">No batch</option>
                {batches.map(b=><option key={b.id} value={String(b.id)}>{b.name}</option>)}
              </select>
            </div>
            <Input label="PASSWORD" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="student123" />
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={saveNewStudent} style={{ flex:1, padding:"11px 0", borderRadius:11, border:"none", background:C.primary, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>✅ Enroll Student</button>
            <button onClick={()=>{setShowForm(false);setForm(emptyForm);}} style={{ padding:"11px 18px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.textMuted, fontWeight:700, cursor:"pointer" }}>{t("cancel")||"Cancel"}</button>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {[
          ["pending", `🔔 Pending (${pending.length})`, C.warning],
          ["approved", `✅ Approved (${approved.length})`, C.success],
          ["rejected", `❌ Rejected (${rejected.length})`, C.danger],
          ["all", `📋 All (${students.length})`, C.primary],
        ].map(([k,l,col])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ padding:"8px 16px", borderRadius:99, border:`1px solid ${tab===k?col:C.border}`, cursor:"pointer", fontWeight:700, fontSize:12,
              background:tab===k?`${col}22`:"transparent", color:tab===k?col:C.textMuted }}>
            {l}
          </button>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by name, phone, email, roll no..."
        style={{ width:"100%", padding:"11px 16px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontSize:14, outline:"none", marginBottom:14, boxSizing:"border-box" }} />

      {/* Pending Students — with timer and approve form */}
      {tab === "pending" && pending.length === 0 && (
        <Card style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ fontSize:48, marginBottom:10 }}>✅</div>
          <div style={{ fontWeight:700, color:C.text }}>No pending approvals</div>
          <p style={{ color:C.textMuted, fontSize:13 }}>All students have been reviewed</p>
        </Card>
      )}

      {tab === "pending" && filtered.map(s => {
        const countdown = getCountdown(s.autoApproveAt);
        const isEditing = editingId === s.id;
        const af = assignForm[s.id] || {};
        const msLeft = s.autoApproveAt ? s.autoApproveAt - Date.now() : null;
        const pctLeft = msLeft && s.signupAt ? Math.max(0, msLeft / (s.autoApproveAt - s.signupAt) * 100) : 0;
        return (
          <Card key={s.id} style={{ marginBottom:14, border:`2px solid ${C.warning}44` }}>
            {/* Student info header */}
            <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ width:46, height:46, borderRadius:"50%", background:`linear-gradient(135deg,${C.warning},${C.warning}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900, fontSize:16, flexShrink:0 }}>
                {s.avatar||s.name?.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:16, color:C.text }}>{s.name}</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>
                  📞 {s.phone} · ✉️ {s.email}
                </div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>
                  🆔 Temp ID: <strong style={{color:C.warning}}>{s.tempId}</strong> · 📅 {s.joinedOn}
                </div>
              </div>
              <span style={{ padding:"4px 10px", borderRadius:99, background:`${C.warning}22`, color:C.warning, fontWeight:700, fontSize:11 }}>⏳ Pending</span>
            </div>

            {/* Auto-approve countdown */}
            {s.autoApproveAt && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:11, color:C.textMuted, fontWeight:700 }}>⏰ Auto-approve in</span>
                  <span style={{ fontSize:12, fontWeight:900, color: msLeft < 3600000 ? C.danger : C.warning, fontFamily:"monospace" }}>{countdown}</span>
                </div>
                <div style={{ height:6, borderRadius:99, background:C.bgCard2, overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:99, background: msLeft < 3600000 ? C.danger : C.warning, width:`${pctLeft}%`, transition:"width 1s" }} />
                </div>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:3 }}>
                  If not approved manually, account auto-activates when timer reaches zero
                </div>
              </div>
            )}

            {/* Assign details + Approve */}
            {isEditing ? (
              <div style={{ background:C.bgCard2, borderRadius:12, padding:14, marginBottom:12 }}>
                <div style={{ fontSize:12, color:C.primary, fontWeight:800, marginBottom:12 }}>📝 Assign Details & Approve</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div>
                    <label style={{ fontSize:11, color:C.textMuted, fontWeight:700, display:"block", marginBottom:5 }}>ROLL NUMBER</label>
                    <input value={af.rollNo||""} onChange={e=>setAssignForm(p=>({...p,[s.id]:{...af,rollNo:e.target.value}}))}
                      placeholder="e.g. SBC00045 (auto if empty)"
                      style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:C.textMuted, fontWeight:700, display:"block", marginBottom:5 }}>CLASS</label>
                    <select value={af.class||""} onChange={e=>setAssignForm(p=>({...p,[s.id]:{...af,class:e.target.value}}))}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none" }}>
                      <option value="">Select class...</option>
                      {["6th","7th","8th","9th","10th","11th","12th"].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:C.textMuted, fontWeight:700, display:"block", marginBottom:5 }}>BOARD</label>
                    <select value={af.board||"CBSE"} onChange={e=>setAssignForm(p=>({...p,[s.id]:{...af,board:e.target.value}}))}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none" }}>
                      <option value="CBSE">CBSE</option><option value="State">State Board</option><option value="ICSE">ICSE</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:C.textMuted, fontWeight:700, display:"block", marginBottom:5 }}>BATCH</label>
                    <select value={af.batchId||""} onChange={e=>setAssignForm(p=>({...p,[s.id]:{...af,batchId:e.target.value}}))}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${C.border}`, background:C.bg, color:C.text, fontSize:13, outline:"none" }}>
                      <option value="">No batch</option>
                      {batches.map(b=><option key={b.id} value={String(b.id)}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={()=>approveStudent(s)}
                    style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:C.success, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                    ✅ Approve & Assign
                  </button>
                  <button onClick={()=>setEditingId(null)}
                    style={{ padding:"11px 16px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.textMuted, fontWeight:700, cursor:"pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setEditingId(s.id)}
                  style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:C.success, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
                  ✅ Review & Approve
                </button>
                <button onClick={()=>rejectStudent(s.id)}
                  style={{ padding:"10px 16px", borderRadius:10, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, cursor:"pointer" }}>
                  ❌ Reject
                </button>
              </div>
            )}
          </Card>
        );
      })}

      {/* Approved / All tab - table view */}
      {(tab === "approved" || tab === "all" || tab === "rejected") && (
        <Card style={{ padding:0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center", color:C.textMuted }}>No students found</div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["Roll No","Student","Class/Board","Batch","Attendance","Status",""].map(h=>(
                      <th key={h} style={{ padding:"12px 14px", color:C.textMuted, fontSize:11, fontWeight:700, textAlign:"left", borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s=>(
                    <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"12px 14px", fontSize:12, color:C.textMuted, fontFamily:"monospace", fontWeight:700 }}>{s.rollNo||s.tempId||"—"}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primary}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
                            {s.avatar||s.name?.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.name}</div>
                            <div style={{ fontSize:11, color:C.textMuted }}>{s.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ fontSize:13, color:C.text }}>{s.class||"—"}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{s.board||"—"}</div>
                      </td>
                      <td style={{ padding:"12px 14px", fontSize:12, color:C.textMuted }}>{s.batch||"—"}</td>
                      <td style={{ padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, minWidth:100 }}>
                          <div style={{ flex:1 }}><PBar value={s.attendance||0} color={(s.attendance||0)>=75?C.success:C.warning} /></div>
                          <span style={{ fontSize:12, fontWeight:700, color:(s.attendance||0)>=75?C.success:C.warning }}>{s.attendance||0}%</span>
                        </div>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:700,
                          background: s.status==="approved"||s.status==="Approved"?`${C.success}22`:s.status==="Rejected"?`${C.danger}22`:`${C.warning}22`,
                          color: s.status==="approved"||s.status==="Approved"?C.success:s.status==="Rejected"?C.danger:C.warning }}>
                          {s.status==="approved"?"✅ Active":s.status==="Approved"?"✅ Active":s.status==="Rejected"?"❌ Rejected":"⏳ Pending"}
                          {s.autoApprovedAt?" (Auto)":""}
                        </span>
                      </td>
                      <td style={{ padding:"12px 14px" }}>
                        <button onClick={()=>deleteStudent(s.id)}
                          style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:11, cursor:"pointer" }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// ============================================================
// NOTICES
// ============================================================
const NoticesPage = ({ role }) => {
  const [notices, setNotices] = useState(() => DB.get("notices") || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Exam", message: "", important: false, target: "all" });

  const save = () => {
    const updated = [{ ...form, id: Date.now(), date: new Date().toISOString().split("T")[0] }, ...notices];
    setNotices(updated);
    DB.set("notices", updated);
    setShowForm(false);
    setForm({ title: "", type: "Exam", message: "", important: false, target: "all" });
  };

  const typeColors = { Exam: "danger", Holiday: "success", Fees: "warning", Academic: "info" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>📢 Notices</h2>
        {(role === "admin" || role === "teacher") && <Btn variant="primary" onClick={() => setShowForm(!showForm)}>+ Post Notice</Btn>}
      </div>
      {showForm && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44` }}>
          <h3 style={{ color: C.text, margin: "0 0 20px" }}>New Notice</h3>
          <Input label="NOTICE TITLE *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Notice का title" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7 }}>TYPE</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none" }}>
                <option>Exam</option><option>Holiday</option><option>Fees</option><option>Academic</option>
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7 }}>TARGET</label>
              <select value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none" }}>
                <option value="all">All</option><option value="student">Students</option><option value="teacher">Teachers</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7 }}>MESSAGE</label>
            <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Notice details (optional)..."
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: C.text, fontSize: 14, marginBottom: 20 }}>
            <input type="checkbox" checked={form.important} onChange={e => setForm({ ...form, important: e.target.checked })} />
            ⚠️ Important Notice
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="primary" onClick={save}>✅ Post Notice</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}
      {notices.length === 0 && (
        <Card style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📢</div>
          <div style={{ fontWeight:800, color:C.text, marginBottom:6 }}>No Notices Yet</div>
          <p style={{ color:C.textMuted, fontSize:13 }}>
            {(role==="admin"||role==="teacher") ? "Upar '+ Post Notice' button se notice add karein" : "Admin ya Teacher ke notices yahan dikhenge"}
          </p>
        </Card>
      )}
      {notices.map(n => (
        <Card key={n.id} style={{ marginBottom: 14, borderLeft: `4px solid ${n.important ? C.danger : C.primary}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{n.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>📅 {n.date}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge text={n.type} type={typeColors[n.type] || "default"} />
              {n.important && <Badge text="⚠️ Important" type="danger" />}
            </div>
          </div>
          <p style={{ color: C.textMuted, fontSize: 14, margin: 0, lineHeight: 1.7 }}>{n.message}</p>
        </Card>
      ))}
    </div>
  );
};

// ============================================================
// SCHEDULE
// ============================================================
const SchedulePage = () => {
  const batches  = DB.get("batches")     || [];
  const classes  = DB.get("liveClasses") || [];
  const today    = new Date();
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const todayName = dayNames[today.getDay()];
  const shortDay  = todayName.slice(0,3);

  // Upcoming live classes (next 7 days)
  const upcoming = classes.filter(c => c.status==="upcoming")
    .sort((a,b) => new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time))
    .slice(0,6);

  // Batches that run today
  const todayBatches = batches.filter(b => {
    if (!b.days) return false;
    const d = b.days.toLowerCase();
    return d.includes(shortDay.toLowerCase()) || d.includes("daily") || d.includes("mon-sat");
  });

  return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>🗓️ Class Schedule</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:20 }}>Today: <strong style={{color:C.text}}>{todayName}, {today.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</strong></p>

      {/* Today's classes */}
      {todayBatches.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.warning, fontWeight:800, marginBottom:10, letterSpacing:1 }}>📅 TODAY'S CLASSES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {todayBatches.map(b=>(
              <div key={b.id} style={{ background:`${C.warning}10`, border:`1px solid ${C.warning}33`, borderRadius:14, padding:"14px 16px", display:"flex", gap:14, alignItems:"center" }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${C.primary},${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#111", fontWeight:900, fontSize:14, flexShrink:0 }}>
                  {b.class?.replace(/[a-z]/g,"")||"?"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, color:C.text, fontSize:14 }}>{b.name}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>⏰ {b.time} · 👨‍🏫 {b.teacher}</div>
                </div>
                <Badge text={b.board} type="primary" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming scheduled classes */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, color:C.info, fontWeight:800, marginBottom:10, letterSpacing:1 }}>📡 UPCOMING ONLINE CLASSES</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {upcoming.map(c=>(
              <div key={c.id} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${C.info}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📡</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:13 }}>{c.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>📅 {c.date} · ⏰ {c.time} · 👨‍🏫 {c.teacher}</div>
                </div>
                <span style={{ fontSize:11, padding:"3px 9px", borderRadius:99, background:`${C.info}18`, color:C.info, fontWeight:700 }}>{c.batchName||"All"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Batches weekly schedule */}
      <div style={{ fontSize:12, color:C.textMuted, fontWeight:800, marginBottom:12, letterSpacing:1 }}>📚 ALL BATCHES SCHEDULE</div>
      {batches.length === 0
        ? <Card style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:48, marginBottom:10 }}>📭</div>
            <div style={{ color:C.textMuted, fontSize:13 }}>No batches created yet. Admin can create batches in Batch Management.</div>
          </Card>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:14 }}>
            {batches.map(b=>(
              <Card key={b.id} style={{ borderLeft:`3px solid ${b.active===false?C.danger:C.primary}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div style={{ fontWeight:800, fontSize:14, color:C.text }}>{b.name}</div>
                  <Badge text={b.board} type={b.board==="CBSE"?"primary":"warning"} />
                </div>
                {[["⏰","Time",b.time],["📅","Days",b.days],["👨‍🏫","Teacher",b.teacher],["🎓","Class",b.class],["💰","Fees","₹"+(b.fees||0)+"/month"]].filter(([,,v])=>v).map(([icon,label,val])=>(
                  <div key={label} style={{ display:"flex", gap:8, fontSize:12, color:C.textMuted, marginBottom:6 }}>
                    <span>{icon}</span><span style={{color:C.text,fontWeight:600}}>{val}</span>
                  </div>
                ))}
                {b.active===false && <Badge text="⏸ Paused" type="danger" />}
              </Card>
            ))}
          </div>
      }
    </div>
  );
};

// ============================================================
// UPI QR GENERATOR UTILITY
// ============================================================
const makeUPIUrl = (upiId, name, amount, note) =>
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

const QRCanvas = ({ value, size = 180 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !value) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const n = 25;
    const cell = size / n;
    // Simple deterministic QR-like pattern from string hash
    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      return Math.abs(h);
    };
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#111220";
    // Finder patterns (corners)
    [[0,0],[0,n-7],[n-7,0]].forEach(([r,c]) => {
      ctx.fillRect(c*cell, r*cell, 7*cell, 7*cell);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect((c+1)*cell, (r+1)*cell, 5*cell, 5*cell);
      ctx.fillStyle = "#111220";
      ctx.fillRect((c+2)*cell, (r+2)*cell, 3*cell, 3*cell);
    });
    // Data modules
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const inFinder = (r<8&&c<8)||(r<8&&c>n-9)||(r>n-9&&c<8);
        if (!inFinder) {
          const seed = hash(value + r * 31 + c * 17 + r * c);
          if (seed % 3 === 0) { ctx.fillStyle = "#111220"; ctx.fillRect(c*cell, r*cell, cell, cell); }
        }
      }
    }
    // Orange SBC center logo
    ctx.fillStyle = "#FF6B00";
    const cx = size/2 - cell*2, cy = size/2 - cell*2;
    ctx.fillRect(cx, cy, cell*4, cell*4);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${cell*2}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("SBC", size/2, size/2 + cell*0.7);
  }, [value, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 12, display: "block" }} />;
};

// ============================================================
// UPI PAYMENT MODAL
// ============================================================
const UPIPayModal = ({ open, onClose, student, amount, upiId, upiName, onConfirm }) => {
  const [step, setStep] = useState(1); // 1=QR, 2=confirm, 3=success
  const [txnId, setTxnId] = useState("");
  const [method, setMethod] = useState("qr");
  const upiUrl = makeUPIUrl(upiId, upiName, amount, `Fees - ${student?.name} - ${student?.rollNo}`);
  const apps = [
    { name: "GPay", color: "#4285F4", icon: "G" },
    { name: "PhonePe", color: "#6739B7", icon: "P" },
    { name: "Paytm", color: "#00BAF2", icon: "T" },
    { name: "BHIM", color: "#FF6B00", icon: "B" },
  ];

  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h3 style={{ color: C.text, margin: 0, fontSize: 20, fontWeight: 900 }}>💳 UPI Payment</h3>
            <div style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{student?.name} · {student?.rollNo}</div>
          </div>
          <button onClick={onClose} style={{ background: C.bgCard2, border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: "50%", width: 34, height: 34, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {step === 1 && (
          <>
            {/* Amount Box */}
            <div style={{
              background: `linear-gradient(135deg, ${C.primary}22, ${C.bgCard2})`,
              border: `1px solid ${C.primary}44`, borderRadius: 16, padding: "18px 24px",
              textAlign: "center", marginBottom: 24
            }}>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Payment Amount</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: C.gold }}>₹{amount}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>Monthly Fees · {new Date().toLocaleString("default", { month: "long", year: "numeric" })}</div>
            </div>

            {/* Method tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, background: C.bgCard2, borderRadius: 12, padding: 5 }}>
              {[["qr", "📱 QR Code"], ["apps", "📲 UPI Apps"], ["manual", "🔗 UPI Link"]].map(([k, l]) => (
                <button key={k} onClick={() => setMethod(k)} style={{
                  flex: 1, padding: "9px 6px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: method === k ? `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})` : "transparent",
                  color: method === k ? "#fff" : C.textMuted, fontWeight: 700, fontSize: 12
                }}>{l}</button>
              ))}
            </div>

            {method === "qr" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "inline-block", padding: 16, background: "#fff", borderRadius: 16, marginBottom: 16, boxShadow: `0 0 32px ${C.primary}33` }}>
                  <QRCanvas value={upiUrl} size={190} />
                </div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Scan with any UPI app</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>{upiId}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{upiName}</div>
              </div>
            )}

            {method === "apps" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {apps.map(app => (
                    <a key={app.name} href={upiUrl} style={{ textDecoration: "none" }}>
                      <div style={{
                        background: C.bgCard2, border: `1px solid ${C.border}`, borderRadius: 14,
                        padding: "16px", textAlign: "center", cursor: "pointer",
                        transition: "border-color 0.2s"
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = app.color}
                        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, background: app.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 900, fontSize: 20, color: "#fff", margin: "0 auto 10px"
                        }}>{app.icon}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{app.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>Tap to Pay</div>
                      </div>
                    </a>
                  ))}
                </div>
                <div style={{ padding: "12px 16px", background: C.bgCard2, borderRadius: 10, fontSize: 12, color: C.textMuted, textAlign: "center" }}>
                  📱 UPI app will open automatically on mobile
                </div>
              </div>
            )}

            {method === "manual" && (
              <div>
                <div style={{ padding: "16px 20px", background: C.bgCard2, borderRadius: 14, marginBottom: 16 }}>
                  {[["UPI ID", upiId], ["Name", upiName], ["Amount", `₹${amount}`], ["Note", `Fees - ${student?.name}`]].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ color: C.textMuted, fontSize: 13 }}>{label}</span>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <a href={upiUrl} style={{
                  display: "block", textAlign: "center", padding: "13px", borderRadius: 12,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
                  color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none"
                }}>🔗 Open in UPI App</a>
              </div>
            )}

            <Btn variant="primary" size="lg" onClick={() => setStep(2)} style={{ width: "100%", marginTop: 20 }}>
              ✅ Payment Done — Confirm
            </Btn>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
              <h3 style={{ color: C.text, margin: "0 0 8px" }}>Confirm Payment</h3>
              <p style={{ color: C.textMuted, fontSize: 14, margin: 0 }}>Enter Transaction ID (optional)</p>
            </div>
            <Input label="UPI TRANSACTION ID (UTR)" value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="e.g. 4235678901234" />
            <div style={{ padding: "14px 16px", background: `${C.success}11`, border: `1px solid ${C.success}33`, borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: C.textMuted, fontSize: 13 }}>Student</span>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{student?.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ color: C.textMuted, fontSize: 13 }}>Amount</span>
                <span style={{ color: C.success, fontWeight: 900, fontSize: 16 }}>₹{amount}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</Btn>
              <Btn variant="primary" onClick={() => { onConfirm(student?.id, txnId); setStep(3); }} style={{ flex: 2 }}>✅ Confirm Payment</Btn>
            </div>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: C.success, margin: "0 0 10px", fontSize: 26 }}>Payment Done!</h2>
            <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 8 }}>{student?.name} 's fees marked</p>
            {txnId && <p style={{ color: C.textMuted, fontSize: 13 }}>UTR: <strong style={{ color: C.text }}>{txnId}</strong></p>}
            <div style={{ margin: "24px 0", padding: "16px", background: `${C.success}11`, border: `1px solid ${C.success}33`, borderRadius: 14 }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: C.success }}>₹{amount}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Successfully Received</div>
            </div>
            <Btn variant="success" size="lg" onClick={onClose} style={{ width: "100%" }}>✅ Done</Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// FEES PAGE
// ============================================================
const FeesPage = ({ role, currentUser }) => {
  const [students, setStudents] = useState(() => DB.get("students") || []);
  const [upiSettings, setUpiSettings] = useState(() => DB.get("upiSettings") || { upiId: "sbcclasses@upi", upiName: "Samagra Bharat CC", phone: "9876543000" });
  const [payModal, setPayModal] = useState({ open: false, student: null });
  const [showUpiEdit, setShowUpiEdit] = useState(false);
  const [upiForm, setUpiForm] = useState(upiSettings);
  const [txnHistory, setTxnHistory] = useState(() => DB.get("txnHistory") || []);
  const [historyTab, setHistoryTab] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const batches = DB.get("batches") || [];

  // For student view: show only own data
  const myData = role === "student" && currentUser
    ? students.find(s => s.id === currentUser.id || s.rollNo === currentUser.rollNo)
    : null;

  const getFeeAmount = (student) => {
    const b = batches.find(b => b.name === student?.batch || String(b.id) === String(student?.batchId));
    return b?.fees || student?.feeAmount || 0;
  };

  const confirmPayment = (studentId, txnId, method) => {
    const student = students.find(s => s.id === studentId);
    const amount = getFeeAmount(student);
    const updated = students.map(s => s.id === studentId
      ? { ...s, fees: "Paid", lastTxn: txnId, paidOn: new Date().toLocaleDateString(), payMethod: method }
      : s);
    setStudents(updated);
    DB.set("students", updated);
    const newTxn = {
      id: Date.now(),
      studentId,
      studentName: student?.name, student: student?.name, rollNo: student?.rollNo, batch: student?.batch,
      amount, txnId, method: method || "UPI",
      date: new Date().toLocaleDateString(), month: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
      status: "Success"
    };
    const history = [newTxn, ...txnHistory];
    setTxnHistory(history);
    DB.set("txnHistory", history);
    // 🔔 Notify admin (student ne khud payment confirm ki)
    if (role === "student") {
      addNotification(
        "payment",
        "💰 Fees Payment Received",
        `${student?.name} (${student?.rollNo||"—"}) ne ₹${amount} fees pay ki via ${method||"UPI"}`,
        { studentId, studentName: student?.name, amount, txnId, method: method||"UPI", batch: student?.batch }
      );
    }
    toast("✅ Payment confirmed!");
  };

  const markPending = (studentId) => {
    const updated = students.map(s => s.id === studentId ? { ...s, fees: "Pending", lastTxn: null, paidOn: null } : s);
    setStudents(updated); DB.set("students", updated);
  };

  const saveUpi = () => { setUpiSettings(upiForm); DB.set("upiSettings", upiForm); setShowUpiEdit(false); };

  const paid = students.filter(s => s.fees === "Paid").length;
  const pending = students.filter(s => s.fees === "Pending").length;
  const totalCollected = txnHistory.filter(t => t.status === "Success").reduce((sum, t) => sum + (t.amount || 0), 0);

  const filteredStudents = students.filter(s =>
    !searchQ || s.name?.toLowerCase().includes(searchQ.toLowerCase()) || s.rollNo?.toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredHistory = txnHistory.filter(t =>
    historyTab === "all" || t.method?.toLowerCase() === historyTab
  );

  // ── STUDENT OWN VIEW ──
  if (role === "student") {
    const me = myData || currentUser;
    const amt = getFeeAmount(me);
    const myTxns = txnHistory.filter(t => t.rollNo === me?.rollNo);
    return (
      <div>
        <h2 style={{ color: C.text, margin: "0 0 20px", fontSize: 22, fontWeight: 900 }}>💰 My Fees</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <Card style={{ border: `2px solid ${me?.fees === "Paid" ? C.success : C.danger}33` }}>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 8 }}>THIS MONTH STATUS</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: me?.fees === "Paid" ? C.success : C.danger }}>
              {me?.fees === "Paid" ? "✅ Paid" : "⏳ Pending"}
            </div>
            {me?.paidOn && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>Paid on: {me.paidOn}</div>}
          </Card>
          <Card>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 700, marginBottom: 8 }}>MONTHLY FEES</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.gold }}>₹{amt}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 6 }}>{me?.batch}</div>
          </Card>
        </div>
        {me?.fees === "Pending" && amt > 0 && (
          <Btn variant="primary" size="lg" onClick={() => setPayModal({ open: true, student: me })} style={{ width: "100%", marginBottom: 20 }}>
            📲 Pay ₹{amt} via UPI Now
          </Btn>
        )}
        {myTxns.length > 0 && (
          <Card>
            <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>🧾 My Payment History</h3>
            {myTxns.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < myTxns.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${C.success}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💸</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>₹{t.amount} — {t.method}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{t.month} · {t.date}{t.txnId ? ` · UTR: ${t.txnId}` : ""}</div>
                </div>
                <Badge text="✅ Paid" type="success" />
              </div>
            ))}
          </Card>
        )}
        <UPIPayModal open={payModal.open} onClose={() => setPayModal({ open: false, student: null })} student={payModal.student} amount={amt} upiId={upiSettings.upiId} upiName={upiSettings.upiName} onConfirm={(sid, txnId) => { confirmPayment(sid, txnId, "UPI"); setPayModal({ open: false, student: null }); }} />
      </div>
    );
  }

  // ── ADMIN / TEACHER VIEW ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>💰 Fees &amp; Payment Management</h2>
        <Btn variant="outline" onClick={() => { setUpiForm(upiSettings); setShowUpiEdit(!showUpiEdit); }}>⚙️ UPI Settings</Btn>
      </div>

      {showUpiEdit && (
        <Card style={{ marginBottom: 20, border: `1px solid ${C.primary}44`, background: `${C.primary}08` }}>
          <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16 }}>⚙️ Coaching UPI Details Set Karein</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="UPI ID *" value={upiForm.upiId} onChange={e => setUpiForm({ ...upiForm, upiId: e.target.value })} placeholder="sbcclasses@paytm" />
            <Input label="ACCOUNT NAME *" value={upiForm.upiName} onChange={e => setUpiForm({ ...upiForm, upiName: e.target.value })} placeholder="Samagra Bharat CC" />
            <Input label="PHONE / WHATSAPP" value={upiForm.phone} onChange={e => setUpiForm({ ...upiForm, phone: e.target.value })} placeholder="9876543000" />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="primary" onClick={saveUpi}>💾 Save</Btn>
            <Btn variant="ghost" onClick={() => setShowUpiEdit(false)}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}

      {/* UPI Active badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", background: `${C.success}11`, border: `1px solid ${C.success}33`, borderRadius: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ fontSize: 28 }}>📲</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>Active UPI: <span style={{ color: C.primary }}>{upiSettings.upiId}</span></div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{upiSettings.upiName} · 📞 {upiSettings.phone}</div>
        </div>
        <Badge text="✅ UPI Active" type="success" />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
        <Stat icon="✅" label="Paid" value={paid} color={C.success} />
        <Stat icon="⏳" label="Pending" value={pending} color={C.danger} />
        <Stat icon="💵" label="Collected" value={"₹" + (totalCollected >= 1000 ? (totalCollected/1000).toFixed(1) + "K" : totalCollected)} color={C.gold} />
        <Stat icon="📊" label="Total Students" value={students.length} color={C.info} />
      </div>

      {/* Students Fees Table */}
      <Card style={{ padding: 0, marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ color: C.text, margin: 0, fontSize: 16, fontWeight: 800 }}>📋 Students Fees Status</h3>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Search student..." style={{ padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, outline: "none", width: 200 }} />
        </div>
        {filteredStudents.length === 0
          ? <div style={{ textAlign: "center", padding: "40px", color: C.textMuted }}>Koi student nahi mila</div>
          : <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>{["Student","Class","Batch","Fees","Status","Action"].map(h => (
                    <th key={h} style={{ padding: "11px 14px", color: C.textMuted, fontSize: 11, fontWeight: 700, textAlign: "left", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar initials={s.avatar} size={32} />
                          <div>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                            <div style={{ color: C.textMuted, fontSize: 11 }}>{s.rollNo}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px" }}><Badge text={s.class} type="primary" /></td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: C.textMuted, maxWidth: 140 }}>{s.batch}</td>
                      <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 900, color: C.gold }}>₹{getFeeAmount(s)}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <Badge text={s.fees || "Pending"} type={s.fees === "Paid" ? "success" : "danger"} />
                        {s.paidOn && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>📅 {s.paidOn}</div>}
                        {s.payMethod && <div style={{ fontSize: 10, color: C.textMuted }}>{s.payMethod}</div>}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        {s.fees !== "Paid"
                          ? <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <Btn variant="primary" size="sm" onClick={() => setPayModal({ open: true, student: s })}>📲 UPI</Btn>
                              <Btn variant="ghost" size="sm" onClick={() => confirmPayment(s.id, "CASH-" + Date.now().toString().slice(-6), "Cash")}>💵 Cash</Btn>
                            </div>
                          : <div>
                              <Badge text="✅ Paid" type="success" />
                              {s.lastTxn && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3 }}>Ref: {s.lastTxn.slice(-8)}</div>}
                              <button onClick={() => markPending(s.id)} style={{ background: "none", border: "none", color: C.textMuted, fontSize: 10, cursor: "pointer", marginTop: 2 }}>↩ Undo</button>
                            </div>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </Card>

      {/* Payment History — Admin Full View */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ color: C.text, margin: 0, fontSize: 16, fontWeight: 800 }}>🧾 Payment History</h3>
          <div style={{ display: "flex", gap: 6 }}>
            {[["all","All"],["upi","UPI"],["cash","Cash"]].map(([k, l]) => (
              <button key={k} onClick={() => setHistoryTab(k)} style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: historyTab === k ? C.primary : C.bgCard2, color: historyTab === k ? "#fff" : C.textMuted }}>{l}</button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0
          ? <div style={{ textAlign: "center", padding: "32px", color: C.textMuted }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              Abhi koi payment record nahi hai
            </div>
          : <>
              {/* Summary row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16, padding: "12px 16px", background: C.bgCard2, borderRadius: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.success }}>₹{filteredHistory.filter(t=>t.status==="Success").reduce((s,t)=>s+(t.amount||0),0).toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>Total Collected</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{filteredHistory.length}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>Transactions</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>₹{filteredHistory.length ? Math.round(filteredHistory.reduce((s,t)=>s+(t.amount||0),0)/filteredHistory.length).toLocaleString() : 0}</div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>Avg per txn</div>
                </div>
              </div>

              {filteredHistory.map((t, i) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < filteredHistory.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: t.method === "Cash" ? `${C.gold}22` : `${C.success}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {t.method === "Cash" ? "💵" : "📲"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.student}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{t.rollNo} · {t.batch}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{t.month} · {t.date}{t.txnId ? ` · Ref: ${t.txnId}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: C.success }}>+₹{t.amount}</div>
                    <Badge text={t.method || "UPI"} type={t.method === "Cash" ? "warning" : "success"} />
                  </div>
                </div>
              ))}
            </>
        }
      </Card>

      <UPIPayModal open={payModal.open} onClose={() => setPayModal({ open: false, student: null })} student={payModal.student} amount={payModal.student ? getFeeAmount(payModal.student) : 0} upiId={upiSettings.upiId} upiName={upiSettings.upiName}
        onConfirm={(sid, txnId) => { confirmPayment(sid, txnId, "UPI"); setPayModal({ open: false, student: null }); }} />
    </div>
  );
};

const AttendancePage = ({ role, currentUser }) => {
  const allStudents = DB.get("students") || [];
  const allClasses = DB.get("liveClasses") || [];
  const batches = DB.get("batches") || [];

  const completedClasses = allClasses.filter(c => c.status === "completed");
  const [selectedClassId, setSelectedClassId] = useState(completedClasses[0]?.id || "");
  const [marks, setMarks] = useState({});
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("mark"); // "mark" | "report"

  // Load existing attendance when class changes
  useEffect(() => {
    if (selectedClassId) {
      const existing = DB.get("attendance_" + selectedClassId) || {};
      const m = {};
      allStudents.forEach(s => {
        if (existing[s.id]) m[s.id] = existing[s.id].present ? "P" : "A";
      });
      setMarks(m); setSaved(false);
    }
  }, [selectedClassId]);

  const toggle = (id) => { setSaved(false); setMarks(p => ({ ...p, [id]: p[id] === "P" ? "A" : "P" })); };
  const markAll = (val) => { setSaved(false); const m = {}; allStudents.forEach(s => m[s.id] = val); setMarks(m); };

  const saveAttendance = () => {
    if (!selectedClassId) { toast("Please select a class first", "error"); return; }
    const att = {};
    allStudents.forEach(s => { att[s.id] = { present: marks[s.id] === "P", via: "manual", markedAt: Date.now() }; });
    DB.set("attendance_" + selectedClassId, att);
    // Update student attendance percentage
    const students = DB.get("students") || [];
    const updatedStudents = students.map(s => {
      const myCls = completedClasses.filter(c => !s.batchId || c.batchId === s.batchId);
      const attended = myCls.filter(c => { const a = DB.get("attendance_"+c.id)||{}; return a[s.id]?.present; }).length;
      const pct = myCls.length > 0 ? Math.round(attended/myCls.length*100) : s.attendance || 0;
      return { ...s, attendance: pct };
    });
    DB.set("students", updatedStudents);
    setSaved(true);
    toast("Attendance saved! ✅");
  };

  // Per-student report across all classes
  const getStudentReport = (s) => {
    const myCls = completedClasses.filter(c => !s.batchId || c.batchId === s.batchId);
    const attended = myCls.filter(c => { const a = DB.get("attendance_"+c.id)||{}; return a[s.id]?.present; }).length;
    const pct = myCls.length > 0 ? Math.round(attended/myCls.length*100) : (s.attendance || 0);
    return { attended, total: myCls.length, pct };
  };

  const presentCount = Object.values(marks).filter(v=>v==="P").length;
  const absentCount = Object.values(marks).filter(v=>v==="A").length;
  const unmarkedCount = allStudents.length - presentCount - absentCount;
  const selectedCls = completedClasses.find(c=>c.id===selectedClassId);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:10 }}>
        <h2 style={{ color:C.text, margin:0, fontSize:22, fontWeight:900 }}>✅ Attendance</h2>
        <div style={{ display:"flex", gap:0, background:C.bgCard2, borderRadius:12, padding:3 }}>
          {[["mark","📝 Mark"],["report","📊 Report"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{ padding:"8px 18px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                background:tab===k?`linear-gradient(135deg,${C.primary},${C.primaryLight})`:"transparent",
                color:tab===k?"#fff":C.textMuted }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* MARK ATTENDANCE TAB */}
      {tab === "mark" && (role === "teacher" || role === "admin") && (
        <Card style={{ marginBottom:18, border:`1px solid ${C.success}33` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:15, fontWeight:800 }}>📝 Mark Today's Attendance</h3>
            {saved && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
          </div>

          {/* Class selector */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:11, color:C.textMuted, fontWeight:700, display:"block", marginBottom:6 }}>SELECT CLASS</label>
            <select value={selectedClassId} onChange={e=>setSelectedClassId(e.target.value)}
              style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none" }}>
              <option value="">— Select completed class —</option>
              {completedClasses.map(c=>(
                <option key={c.id} value={c.id}>{c.title} ({c.date||"no date"}) — {c.batchName||"All"}</option>
              ))}
            </select>
          </div>

          {selectedClassId && (
            <>
              {/* Quick stats */}
              <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                {[
                  {label:"Present", val:presentCount, color:C.success},
                  {label:"Absent", val:absentCount, color:C.danger},
                  {label:"Unmarked", val:unmarkedCount, color:C.textMuted},
                ].map(s=>(
                  <div key={s.label} style={{ padding:"6px 14px", borderRadius:99, background:`${s.color}18`, border:`1px solid ${s.color}33`, fontSize:12, fontWeight:700, color:s.color }}>
                    {s.val} {s.label}
                  </div>
                ))}
                <button onClick={()=>markAll("P")} style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${C.success}44`, background:`${C.success}12`, color:C.success, fontSize:12, fontWeight:700, cursor:"pointer" }}>All Present</button>
                <button onClick={()=>markAll("A")} style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontSize:12, fontWeight:700, cursor:"pointer" }}>All Absent</button>
              </div>

              {/* Student grid */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
                {allStudents.map(s => {
                  const st = marks[s.id];
                  const init = s.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) || "?";
                  return (
                    <div key={s.id} onClick={()=>toggle(s.id)}
                      style={{ padding:"12px 14px", borderRadius:14, cursor:"pointer", minWidth:110, textAlign:"center",
                        background: st==="P"?`${C.success}18`:st==="A"?`${C.danger}18`:C.bgCard2,
                        border:`2px solid ${st==="P"?C.success:st==="A"?C.danger:C.border}`,
                        transition:"all 0.15s" }}>
                      <div style={{ width:34, height:34, borderRadius:"50%", margin:"0 auto 8px",
                        background:`linear-gradient(135deg,${st==="P"?C.success:st==="A"?C.danger:C.textMuted},${st==="P"?C.success+"88":st==="A"?C.danger+"88":C.textMuted+"88"})`,
                        display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13 }}>{init}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{s.name?.split(" ")[0]}</div>
                      <div style={{ fontSize:11, marginTop:4, fontWeight:700, color: st==="P"?C.success:st==="A"?C.danger:C.textMuted }}>
                        {st==="P"?"✅ Present":st==="A"?"❌ Absent":"Tap to mark"}
                      </div>
                    </div>
                  );
                })}
              </div>
              {allStudents.length === 0 && <p style={{ color:C.textMuted, fontSize:13 }}>No students found. Add students first.</p>}
              <button onClick={saveAttendance}
                style={{ width:"100%", padding:"13px 0", borderRadius:12, border:"none", background:`linear-gradient(135deg,${C.success},#22c55e)`, color:"#fff", fontSize:15, fontWeight:900, cursor:"pointer" }}>
                💾 Save Attendance ({presentCount} Present / {allStudents.length} Total)
              </button>
            </>
          )}
          {!selectedClassId && (
            <div style={{ textAlign:"center", padding:"24px 0", color:C.textMuted, fontSize:13 }}>
              Select a class above to mark attendance
            </div>
          )}
        </Card>
      )}

      {/* REPORT TAB */}
      {tab === "report" && (
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📊 Attendance Report — All Students</h3>
          {allStudents.length === 0 && <p style={{ color:C.textMuted, fontSize:13 }}>No students yet</p>}
          {allStudents.map(s => {
            const { attended, total, pct } = getStudentReport(s);
            const init = s.name?.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
            return (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primary}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>{init}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.rollNo} · {s.batch||"—"}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color: pct>=75?C.success:C.danger }}>{pct}%</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{attended}/{total} classes</div>
                  <PBar value={pct} color={pct>=75?C.success:C.danger} />
                  <Badge text={pct>=75?"Regular":"⚠️ Low"} type={pct>=75?"success":"danger"} />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* Student view */}
      {role === "student" && tab === "mark" && (
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📅 My Attendance Record</h3>
          {completedClasses.slice(0,10).map(c => {
            const att = DB.get("attendance_"+c.id) || {};
            const myStatus = att[currentUser?.id];
            return (
              <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{c.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{c.date} · {c.batchName}</div>
                </div>
                <span style={{ padding:"4px 12px", borderRadius:99, fontSize:12, fontWeight:700,
                  background: myStatus?.present?`${C.success}22`:myStatus?`${C.danger}22`:`${C.textMuted}22`,
                  color: myStatus?.present?C.success:myStatus?C.danger:C.textMuted }}>
                  {myStatus?.present?"✅ Present":myStatus?"❌ Absent":myStatus?.via==="recording"?"📹 Via Recording":"—"}
                </span>
              </div>
            );
          })}
          {completedClasses.length === 0 && <p style={{ color:C.textMuted, fontSize:13 }}>No classes completed yet</p>}
        </Card>
      )}
    </div>
  );
};

// ============================================================
// STUDENT DASHBOARD
// ============================================================
const StudentDashboard = ({ currentUser }) => {
  // Get live student data from DB
  const students = DB.get("students") || [];
  const s = students.find(st => st.id === currentUser?.id || st.rollNo === currentUser?.id) || currentUser || {};
  const initials = s.name ? s.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "?";

  // Attendance calculation
  const allClasses = DB.get("liveClasses") || [];
  const myClasses = allClasses.filter(c => c.status === "completed" && (!s.batchId || c.batchId === s.batchId));
  const attendedCount = myClasses.filter(c => {
    const att = DB.get("attendance_" + c.id) || {};
    return att[s.id]?.present;
  }).length;
  const attPct = myClasses.length > 0 ? Math.round((attendedCount / myClasses.length) * 100) : (s.attendance || 0);

  // Subscription
  const subData = DB.get("sub_" + s.id) || {};
  const hasSub = subData.status === "active" && new Date(subData.expiry) > new Date();

  // My batch
  const batches = DB.get("batches") || [];
  const myBatch = batches.find(b => String(b.id) === String(s.batchId)) || batches.find(b => b.name === s.batch);

  // Fees status
  const txns = (DB.get("txnHistory") || []).filter(t => t.studentId === s.id);
  const lastTxn = txns[txns.length - 1];
  const feesStatus = lastTxn ? (lastTxn.month === new Date().toLocaleString("en",{month:"short",year:"numeric"}) ? "Paid ✅" : "Check fees") : (s.fees || "Pending");

  // Notices
  const notices = (DB.get("notices") || []).slice(0, 3);

  // Live class now?
  const liveNow = allClasses.filter(c => c.status === "live" && (!s.batchId || c.batchId === s.batchId));

  // Recordings watched
  const watchLog = DB.get("recWatchLog_" + s.id) || {};
  const watchedCount = Object.values(watchLog).filter(l => l.attendanceMarked).length;

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* Live class alert */}
      {liveNow.length > 0 && (
        <div style={{ background:`${C.danger}18`, border:`2px solid ${C.danger}55`, borderRadius:16, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:C.danger, animation:"pulse 1s infinite" }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:C.danger, fontSize:14 }}>🔴 Class Live Now!</div>
            <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{liveNow[0].title}</div>
          </div>
          <a href={liveNow[0].link} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button style={{ background:C.danger, border:"none", color:"#fff", borderRadius:10, padding:"7px 14px", fontWeight:800, fontSize:12, cursor:"pointer" }}>Join →</button>
          </a>
        </div>
      )}

      {/* Welcome card */}
      <div style={{ background:`linear-gradient(135deg, ${C.primary}18, ${C.bgCard})`, border:`1px solid ${C.primary}33`, borderRadius:20, padding:"20px 22px", marginBottom:18, display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ width:58, height:58, borderRadius:"50%", background:`linear-gradient(135deg, ${C.primary}, ${C.gold})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#111", flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:2 }}>Welcome, {s.name || "Student"}! 👋</div>
          <div style={{ fontSize:12, color:C.textMuted }}>
            {s.rollNo && <span style={{ marginRight:10 }}>🎫 {s.rollNo}</span>}
            {(s.class||s.className) && <span style={{ marginRight:10 }}>📖 {s.class||s.className}</span>}
            {s.board && <span style={{ marginRight:10 }}>🏫 {s.board}</span>}
          </div>
          {(s.batch || myBatch?.name) && (
            <div style={{ fontSize:12, color:C.primary, marginTop:4, fontWeight:700 }}>📚 {s.batch || myBatch?.name}</div>
          )}
        </div>
        {hasSub && (
          <div style={{ background:`${C.gold}22`, border:`1px solid ${C.gold}55`, borderRadius:12, padding:"6px 12px", textAlign:"center" }}>
            <div style={{ fontSize:16 }}>💎</div>
            <div style={{ fontSize:10, fontWeight:800, color:C.gold }}>PREMIUM</div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:10, marginBottom:16 }}>
        {[
          { icon:"✅", label:"Attendance", value: attPct + "%", color: attPct >= 75 ? C.success : attPct >= 50 ? C.warning : C.danger, sub: `${attendedCount}/${myClasses.length} classes` },
          { icon:"📹", label:"Recordings Watched", value: watchedCount, color:C.info, sub:"via recording" },
          { icon:"💰", label:"Fees Status", value: feesStatus, color: feesStatus.includes("✅") ? C.success : C.danger, sub: myBatch ? "₹"+myBatch.fees+"/mo" : "" },
          { icon:"💎", label:"Subscription", value: hasSub ? "Active" : "Inactive", color: hasSub ? C.success : C.textMuted, sub: hasSub ? "Expires "+new Date(subData.expiry).toLocaleDateString("en-IN") : "No plan" },
        ].map((stat, i) => (
          <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>{stat.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:stat.color }}>{stat.value}</div>
            <div style={{ fontSize:12, color:C.textMuted, fontWeight:600 }}>{stat.label}</div>
            {stat.sub && <div style={{ fontSize:11, color:C.textMuted, marginTop:2, opacity:0.7 }}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* My Batch Info */}
      {!myBatch && s.status === "Pending Approval" && (
        <div style={{ background:`${C.warning}12`, border:`2px dashed ${C.warning}55`, borderRadius:16, padding:"18px 20px", marginBottom:14, textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <div style={{ fontWeight:800, color:C.warning, marginBottom:4 }}>Account Pending Approval</div>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Admin approve karega — phir batch assign hogi. Temp ID: <strong style={{color:C.text}}>{s.tempId||"—"}</strong></p>
        </div>
      )}
      {!myBatch && (s.status === "approved" || s.status === "Approved") && (
        <div style={{ background:`${C.info}10`, border:`1px solid ${C.info}33`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontWeight:700, color:C.info, marginBottom:4 }}>📚 No Batch Assigned Yet</div>
          <p style={{ color:C.textMuted, fontSize:12, margin:0 }}>Admin se contact karein batch assignment ke liye.</p>
        </div>
      )}
      {myBatch && (
        <Card style={{ marginBottom:14 }}>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:15, fontWeight:800 }}>📚 My Batch</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["Batch", myBatch.name],
              ["Class", myBatch.class],
              ["Board", myBatch.board],
              ["Teacher", myBatch.teacher],
              ["Timing", myBatch.time],
              ["Days", myBatch.days],
            ].filter(([,v])=>v).map(([label,val])=>(
              <div key={label} style={{ fontSize:13 }}>
                <span style={{ color:C.textMuted, fontSize:11 }}>{label}: </span>
                <span style={{ color:C.text, fontWeight:600 }}>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Today's schedule + Notices */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>🗓️ Today's Schedule</h3>
          {(DB.get("batches")||[]).filter(b=>!s.batchId||String(b.id)===String(s.batchId)).slice(0,3).map((b,i)=>(
            <div key={i} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.primary, fontWeight:700, minWidth:50, flexShrink:0 }}>{(b.time||"").split(" - ")[0]}</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{b.name}</div>
                <div style={{ fontSize:11, color:C.textMuted }}>{b.teacher}</div>
              </div>
            </div>
          ))}
          {(DB.get("batches")||[]).length === 0 && <p style={{ color:C.textMuted, fontSize:12 }}>No schedule added yet</p>}
        </Card>
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📢 Notices</h3>
          {notices.length === 0 && <p style={{ color:C.textMuted, fontSize:12 }}>No notices</p>}
          {notices.map(n=>(
            <div key={n.id} style={{ padding:"8px 10px", background:C.bgCard2, borderRadius:9, marginBottom:8, borderLeft:`3px solid ${n.important?C.danger:C.primary}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{n.title}</div>
              <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{n.date}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// TEACHER DASHBOARD
// ============================================================
const TeacherBatchView = ({ currentUser }) => {
  const allBatches = DB.get("batches") || [];
  const myBatches = allBatches.filter(b => b.teacher === currentUser?.name);
  const allStudents = DB.get("students") || [];

  if (myBatches.length === 0) return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 20px", fontSize:22, fontWeight:900 }}>📚 My Batches</h2>
      <Card style={{ textAlign:"center", padding:"48px 20px" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
        <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>No batches assigned yet</div>
        <p style={{ color:C.textMuted, fontSize:13 }}>Admin will assign you to a batch. Contact admin if needed.</p>
      </Card>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📚 My Batches</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>{myBatches.length} batch{myBatches.length!==1?"es":""} assigned to you</p>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {myBatches.map(b => {
          const batchStudents = allStudents.filter(s => String(s.batchId) === String(b.id));
          const avgAtt = batchStudents.length > 0
            ? Math.round(batchStudents.reduce((sum,s)=>sum+(s.attendance||0),0)/batchStudents.length)
            : 0;
          return (
            <Card key={b.id}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:17, color:C.text }}>{b.name}</div>
                  <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                    <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.primary}18`, color:C.primary, fontSize:11, fontWeight:700 }}>{b.board}</span>
                    <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.info}18`, color:C.info, fontSize:11, fontWeight:700 }}>{b.class}</span>
                    {b.active===false && <span style={{ padding:"3px 10px", borderRadius:99, background:`${C.danger}18`, color:C.danger, fontSize:11, fontWeight:700 }}>Paused</span>}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:C.success }}>{batchStudents.length}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>Students</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                {[
                  ["⏰", "Time", b.time||"—"],
                  ["📅", "Days", b.days||"—"],
                  ["💰", "Fees", b.fees?`₹${b.fees}/month`:"—"],
                  ["✅", "Avg Attend.", avgAtt+"%"],
                ].map(([icon,label,val])=>(
                  <div key={label} style={{ background:C.bgCard2, borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ fontSize:11, color:C.textMuted }}>{icon} {label}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:C.text, marginTop:3 }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Students list */}
              {batchStudents.length > 0 && (
                <div>
                  <div style={{ fontSize:12, color:C.textMuted, fontWeight:700, marginBottom:8 }}>STUDENTS IN THIS BATCH</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {batchStudents.slice(0,8).map(s=>(
                      <div key={s.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 10px", background:C.bgCard2, borderRadius:10 }}>
                        <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg,${C.primary},${C.primary}88)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:11 }}>
                          {s.name?.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{s.name?.split(" ")[0]}</div>
                          <div style={{ fontSize:10, color:s.attendance>=75?C.success:C.warning }}>{s.attendance||0}%</div>
                        </div>
                      </div>
                    ))}
                    {batchStudents.length > 8 && (
                      <div style={{ padding:"6px 12px", background:C.bgCard2, borderRadius:10, fontSize:12, color:C.textMuted, display:"flex", alignItems:"center" }}>
                        +{batchStudents.length-8} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};


const TeacherDashboard = ({ currentUser, onNavigate }) => {
  const allBatches = DB.get("batches") || [];
  const myBatches = allBatches.filter(b => b.teacher === currentUser?.name || allBatches.length <= 2 ? allBatches : []);
  const displayBatches = currentUser?.name ? allBatches.filter(b => b.teacher === currentUser.name) : allBatches;
  const allStudents = DB.get("students") || [];
  const myStudentCount = allStudents.filter(s => displayBatches.some(b => String(b.id) === String(s.batchId))).length;
  const allClasses = DB.get("liveClasses") || [];
  const myClasses = allClasses.filter(c => c.teacher === currentUser?.name);
  const liveNow = myClasses.filter(c => c.status === "live");
  const upcoming = myClasses.filter(c => c.status === "upcoming").slice(0,3);
  const notices = (DB.get("notices") || []).slice(0,3);
  const initials = currentUser?.name ? currentUser.name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "T";

  // Avg attendance across my classes
  const completedMyClasses = myClasses.filter(c => c.status === "completed");
  let avgAtt = 0;
  if (completedMyClasses.length > 0) {
    const tots = completedMyClasses.map(c => {
      const att = DB.get("attendance_"+c.id) || {};
      const present = Object.values(att).filter(a=>a.present).length;
      const total = Object.keys(att).length || 1;
      return present/total*100;
    });
    avgAtt = Math.round(tots.reduce((a,b)=>a+b,0)/tots.length);
  }

  return (
    <div>
      {/* Live class alert */}
      {liveNow.length > 0 && (
        <div style={{ background:`${C.danger}18`, border:`2px solid ${C.danger}55`, borderRadius:16, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:C.danger }} />
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, color:C.danger, fontSize:14 }}>🔴 Your class is LIVE now!</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{liveNow[0].title}</div>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div style={{ background:`linear-gradient(135deg, ${C.info}18, ${C.bgCard})`, border:`1px solid ${C.info}33`, borderRadius:20, padding:"20px 22px", marginBottom:18, display:"flex", gap:16, alignItems:"center" }}>
        <div style={{ width:56, height:56, borderRadius:"50%", background:`linear-gradient(135deg, ${C.info}, ${C.primary})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:"#fff", flexShrink:0 }}>{initials}</div>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:C.text }}>Welcome, {currentUser?.name || "Teacher"}! 👋</div>
          <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>
            {currentUser?.teacherId && <span style={{marginRight:10}}>🎫 {currentUser.teacherId}</span>}
            {currentUser?.subject && <span>📖 {currentUser.subject}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          { icon:"👥", label:"My Students",   value: myStudentCount||allStudents.length, color:C.success, go:"students" },
          { icon:"📚", label:"My Batches",    value: displayBatches.length||allBatches.length, color:C.info, go:"myBatches" },
          { icon:"📡", label:"Classes Taken", value: completedMyClasses.length, color:C.primary, go:"liveClass" },
          { icon:"✅", label:"Avg Attendance",value: avgAtt?avgAtt+"%":"—", color:C.gold, go:"attendance" },
        ].map((s,i) => (
          <div key={i} onClick={()=>onNavigate(s.go)} style={{ background:C.bgCard, border:`1px solid ${s.color}33`, borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, marginTop:4 }}>{s.value}</div>
            <div style={{ fontSize:12, color:C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {/* My Batches */}
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📚 My Batches</h3>
          {(displayBatches.length ? displayBatches : allBatches).slice(0,3).map(b => (
            <div key={b.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:11, marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{b.name}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:4 }}>⏰ {b.time} · 👥 {b.students||0} students</div>
            </div>
          ))}
          {!allBatches.length && <p style={{ color:C.textMuted, fontSize:12 }}>No batches assigned yet</p>}
        </Card>

        {/* Upcoming Classes */}
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📅 Upcoming Classes</h3>
          {upcoming.length ? upcoming.map(c => (
            <div key={c.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:11, marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{c.title}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>📅 {c.date} · ⏰ {c.time}</div>
            </div>
          )) : <p style={{ color:C.textMuted, fontSize:12 }}>No upcoming classes</p>}
        </Card>

        {/* Notices */}
        <Card style={{ gridColumn:"1/-1" }}>
          <h3 style={{ color:C.text, margin:"0 0 12px", fontSize:14, fontWeight:800 }}>📢 Latest Notices</h3>
          {notices.length ? notices.map(n => (
            <div key={n.id} style={{ padding:"10px 12px", background:C.bgCard2, borderRadius:10, marginBottom:8, borderLeft:`3px solid ${n.important?C.danger:C.primary}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{n.title}</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{n.date}</div>
            </div>
          )) : <p style={{ color:C.textMuted, fontSize:12 }}>No notices posted</p>}
        </Card>
      </div>

      {/* Quick Actions */}
      {onNavigate && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, color:C.textMuted, fontWeight:700, marginBottom:10, letterSpacing:1 }}>⚡ QUICK ACTIONS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { icon:"📡", label:"Start Live Class",  section:"liveClass",  color:C.danger,   desc:"Schedule or go live" },
              { icon:"📚", label:"Add to Courses",      section:"recordings", color:C.primary,  desc:"Recording, Course, YouTube" },
              { icon:"✅", label:"Mark Attendance",    section:"attendance", color:C.success,  desc:"Today's attendance" },
              { icon:"📢", label:"Post Notice",        section:"notices",    color:C.warning,  desc:"Announce to students" },
              { icon:"🎓", label:"View Students",      section:"students",   color:C.info,     desc:"My batch students" },
              { icon:"📅", label:"View Schedule",      section:"schedule",   color:C.gold,     desc:"Class timetable" },
            ].map(a => (
              <button key={a.section} onClick={()=>onNavigate(a.section)}
                style={{ padding:"12px 14px", borderRadius:14, border:`1px solid ${a.color}33`, background:`${a.color}10`, cursor:"pointer", textAlign:"left", display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:a.color }}>{a.label}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// REPORTS
// ============================================================
// ============================================================
// SUBSCRIPTION MANAGER (Admin) + Student Subscription Page
// ============================================================
const SubscriptionManager = () => {
  const defaultPlan = { name: "Monthly All-Access", price: 999, duration: 30, description: "All courses, live classes, recordings — unlimited access", active: true, features: ["All Live Classes", "All Recordings", "Course Notes", "Doubt Sessions", "Priority Support"] };
  const [plan, setPlan] = useState(() => DB.get("subscriptionPlan") || defaultPlan);
  const [editPlan, setEditPlan] = useState({ ...plan });
  const [editing, setEditing] = useState(false);
  const [subscribers, setSubscribers] = useState(() => {
    const students = DB.get("students") || [];
    return students.filter(s => s.subscription?.active);
  });
  const [featureInput, setFeatureInput] = useState("");

  const savePlan = () => {
    DB.set("subscriptionPlan", editPlan);
    setPlan({ ...editPlan });
    setEditing(false);
    SEC.logEvent("SUBSCRIPTION_PLAN_UPDATED", `Price: ₹${editPlan.price}`);
  };

  const revokeSubscription = (studentId) => {
    const students = DB.get("students") || [];
    const updated = students.map(s => s.id === studentId ? { ...s, subscription: { ...s.subscription, active: false, revokedOn: new Date().toLocaleDateString() } } : s);
    DB.set("students", updated);
    setSubscribers(updated.filter(s => s.subscription?.active));
  };

  const grantSubscription = (studentId, months = 1) => {
    const allStu = DB.get("students") || [];
    const student = allStu.find(s => s.id === studentId);
    const expiry = new Date(); expiry.setDate(expiry.getDate() + months * 30);
    const updated = allStu.map(s => s.id === studentId ? {
      ...s,
      subscription: {
        active: true, pending: false, rejected: false,
        grantedOn: new Date().toLocaleDateString(),
        expiresOn: expiry.toLocaleDateString(),
        months, grantedBy: "admin",
        txnId: s.subscription?.txnId || "",
        amount: s.subscription?.amount || plan.price,
      }
    } : s);
    DB.set("students", updated);
    setSubscribers(updated.filter(s => s.subscription?.active));
    toast(`✅ ${student?.name||"Student"} ka subscription activate! Expires: ${expiry.toLocaleDateString("en-IN")}`);
  };

  const allStudents = DB.get("students") || [];
  const nonSubscribers = allStudents.filter(s => !s.subscription?.active);
  const revenue = subscribers.length * plan.price;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 900 }}>💎 Subscription Plans</h2>
          <p style={{ color: C.textMuted, fontSize: 13, margin: "4px 0 0" }}>Monthly subscription — Admin controls everything</p>
        </div>
        <Btn variant="primary" onClick={() => { setEditPlan({ ...plan }); setEditing(!editing); }}>✏️ Edit Plan</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 14, marginBottom: 24 }}>
        <Stat icon="💎" label="Active Subscribers" value={subscribers.length} color={C.primary} />
        <Stat icon="💵" label="Monthly Revenue" value={"₹" + revenue.toLocaleString()} color={C.success} />
        <Stat icon="📊" label="Subscription Price" value={"₹" + plan.price} color={C.gold} />
        <Stat icon="🔓" label="Plan Active" value={plan.active ? "YES" : "OFF"} color={plan.active ? C.success : C.danger} />
      </div>

      {/* Edit Plan */}
      {editing && (
        <Card style={{ marginBottom: 24, border: `1px solid ${C.primary}44`, background: `${C.primary}05` }}>
          <h3 style={{ color: C.text, margin: "0 0 18px", fontSize: 16, fontWeight: 800 }}>✏️ Plan Edit Karein</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="PLAN NAME" value={editPlan.name} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} placeholder="Monthly All-Access" />
            <Input label="PRICE (₹) *" value={editPlan.price} onChange={e => setEditPlan({ ...editPlan, price: Number(e.target.value) })} type="number" placeholder="999" />
            <Input label="DURATION (days)" value={editPlan.duration} onChange={e => setEditPlan({ ...editPlan, duration: Number(e.target.value) })} type="number" placeholder="30" />
            <div>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>PLAN STATUS</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setEditPlan({ ...editPlan, active: v })} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${editPlan.active === v ? C.primary : C.border}`, background: editPlan.active === v ? `${C.primary}15` : C.bgCard2, color: editPlan.active === v ? C.primary : C.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    {v ? "✅ Active" : "❌ Inactive"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>DESCRIPTION</label>
              <textarea value={editPlan.description} onChange={e => setEditPlan({ ...editPlan, description: e.target.value })} rows={2} style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ color: C.textMuted, fontSize: 11, fontWeight: 700, display: "block", marginBottom: 7, letterSpacing: 1 }}>FEATURES (jo student ko milega)</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {(editPlan.features || []).map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.success}15`, border: `1px solid ${C.success}33`, borderRadius: 99, padding: "4px 12px", fontSize: 12, color: C.success }}>
                    ✓ {f}
                    <button onClick={() => setEditPlan({ ...editPlan, features: editPlan.features.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && featureInput.trim()) { setEditPlan({ ...editPlan, features: [...(editPlan.features || []), featureInput.trim()] }); setFeatureInput(""); } }} placeholder="Add feature — Press Enter" style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bgCard2, color: C.text, fontSize: 13, outline: "none" }} />
                <Btn variant="outline" size="sm" onClick={() => { if (featureInput.trim()) { setEditPlan({ ...editPlan, features: [...(editPlan.features || []), featureInput.trim()] }); setFeatureInput(""); } }}>+ Add</Btn>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn variant="primary" onClick={savePlan}>💾 Save Plan</Btn>
            <Btn variant="ghost" onClick={() => setEditing(false)}>{t("cancel")||"Cancel"}</Btn>
          </div>
        </Card>
      )}

      {/* Current Plan Card */}
      <Card style={{ marginBottom: 24, border: `2px solid ${C.primary}44`, background: `linear-gradient(135deg, ${C.primary}08, transparent)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: C.primary, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>CURRENT PLAN</div>
            <h3 style={{ color: C.text, fontWeight: 900, fontSize: 20, margin: "0 0 6px" }}>💎 {plan.name}</h3>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 12px" }}>{plan.description}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(plan.features || []).map((f, i) => (
                <span key={i} style={{ background: `${C.success}15`, border: `1px solid ${C.success}33`, borderRadius: 99, padding: "3px 10px", fontSize: 11, color: C.success }}>✓ {f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", background: `${C.primary}15`, border: `1px solid ${C.primary}44`, borderRadius: 20, padding: "20px 28px", flexShrink: 0 }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.primary }}>₹{plan.price}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>per {plan.duration} days</div>
            <Badge text={plan.active ? "✅ Active" : "❌ Inactive"} type={plan.active ? "success" : "danger"} style={{ marginTop: 8 }} />
          </div>
        </div>
      </Card>

      {/* Pending Payment Verification */}
      {(() => {
        const pendingSubs = (DB.get("students")||[]).filter(s => s.subscription?.pending && !s.subscription?.active);
        if (pendingSubs.length === 0) return null;
        return (
          <Card style={{ marginBottom: 24, border: `2px solid ${C.warning}55`, background: `${C.warning}05` }}>
            <h3 style={{ color: C.warning, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>⏳ Pending Payment Verification ({pendingSubs.length})</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {pendingSubs.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.warning}33` }}>
                  <Avatar initials={s.avatar} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
                      📞 {s.phone||"—"} · 🎓 {s.rollNo||s.tempId||"—"} · 📚 {s.batch||"No batch"}
                    </div>
                    <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap" }}>
                      <span style={{ background:`${C.gold}18`, color:C.gold, padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:800 }}>
                        💰 ₹{s.subscription?.amount||plan.price}
                      </span>
                      {s.subscription?.txnId && (
                        <span style={{ background:`${C.info}18`, color:C.info, padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:700 }}>
                          🧾 UTR: {s.subscription.txnId}
                        </span>
                      )}
                      <span style={{ background:`${C.textMuted}18`, color:C.textMuted, padding:"2px 10px", borderRadius:99, fontSize:11 }}>
                        📅 {s.subscription?.paidOn||"—"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
                    <button onClick={() => grantSubscription(s.id, 1)}
                      style={{ padding:"9px 16px", borderRadius:10, border:"none", background:C.success, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }}>
                      ✅ Approve & Activate
                    </button>
                    <button onClick={() => {
                      const sts = DB.get("students")||[];
                      const upd = sts.map(x => x.id===s.id ? {...x, subscription: {...x.subscription, pending:false, rejected:true}} : x);
                      DB.set("students", upd);
                      setStudents(upd);
                      toast("Subscription request rejected", "warning");
                    }}
                      style={{ padding:"7px 14px", borderRadius:10, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:12, cursor:"pointer" }}>
                      ❌ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}

      {/* Grant subscription to student */}
      <Card style={{ marginBottom: 24 }}>
        <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>🎁 Student ko Subscription Grant Karein</h3>
        {nonSubscribers.length === 0
          ? <p style={{ color: C.textMuted, fontSize: 13 }}>Sabhi students subscribed hain!</p>
          : <div style={{ display: "grid", gap: 10 }}>
              {nonSubscribers.slice(0, 20).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C.bgCard2, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <Avatar initials={s.avatar} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{s.rollNo} · {s.class} · {s.batch}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="primary" size="sm" onClick={() => grantSubscription(s.id, 1)}>+1 Month</Btn>
                    <Btn variant="ghost" size="sm" onClick={() => grantSubscription(s.id, 3)}>+3 Months</Btn>
                  </div>
                </div>
              ))}
            </div>
        }
      </Card>

      {/* Active Subscribers */}
      <Card>
        <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>💎 Active Subscribers ({subscribers.length})</h3>
        {subscribers.length === 0
          ? <p style={{ color: C.textMuted, textAlign: "center", padding: 20 }}>Abhi koi active subscriber nahi hai</p>
          : <div style={{ display: "grid", gap: 10 }}>
              {subscribers.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: `${C.primary}08`, border: `1px solid ${C.primary}22`, borderRadius: 12 }}>
                  <Avatar initials={s.avatar} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{s.rollNo} · Expires: {s.subscription?.expiresOn}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn variant="ghost" size="sm" onClick={() => grantSubscription(s.id, 1)}>+1 Month</Btn>
                    <Btn size="sm" onClick={() => revokeSubscription(s.id)} style={{ background: `${C.danger}15`, color: C.danger, border: `1px solid ${C.danger}33`, padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Revoke</Btn>
                  </div>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  );
};

// Student Subscription Page
// Production: delegate to the API-driven SubscriptionPage which lists
// every published batch + every active plan, and triggers Paytm UPI.
const StudentSubscriptionPage = ({ currentUser }) => {
  // eslint-disable-next-line no-unused-vars
  const _ = currentUser;
  return <ProdSubscriptionPage />;
};

// Keep the old demo flow available behind a feature flag for reference.
const _OLD_StudentSubscriptionPage = ({ currentUser }) => {
  const plan = DB.get("subscriptionPlan") || { name: "Monthly All-Access", price: 999, duration: 30, description: "All courses, live classes, recordings", active: true, features: ["All Live Classes", "All Recordings", "Course Notes", "Doubt Sessions"] };
  const students = DB.get("students") || [];
  const me = students.find(s => s.id === currentUser?.id) || currentUser;
  const isSubscribed = me?.subscription?.active;
  const expiresOn = me?.subscription?.expiresOn;
  const upi = DB.get("upiSettings") || {};

  const [payStep, setPayStep] = useState(0); // 0=info, 1=payment, 2=confirm, 3=success
  const [txnId, setTxnId] = useState("");
  const [err, setErr] = useState("");

  const confirmPay = () => {
    if (!txnId.trim() || txnId.trim().length < 6) { setErr("Enter valid UTR/Transaction ID (min 6 chars)"); return; }
    const updated = students.map(s => s.id === me.id ? {
      ...s,
      subscription: { active: false, pending: true, txnId: txnId.trim(), paidOn: new Date().toLocaleDateString(), amount: plan.price, planName: plan.name }
    } : s);
    DB.set("students", updated);
    // 🔔 Notify admin
    addNotification(
      "subscription",
      "💎 New Subscription Payment",
      `${me.name} (${me.rollNo||me.tempId||"—"}) ne ₹${plan.price} ka payment kiya`,
      { studentId: me.id, studentName: me.name, rollNo: me.rollNo, amount: plan.price, txnId: txnId.trim(), plan: plan.name }
    );
    SEC.logEvent("SUBSCRIPTION_REQUEST", `${me.name} | ₹${plan.price} | UTR:${txnId}`);
    setPayStep(3);
  };

  if (!plan.active) return (
    <Card style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h3 style={{ color: C.text, fontWeight: 900 }}>Subscription not available yet</h3>
      <p style={{ color: C.textMuted }}>Admin se contact karein.</p>
    </Card>
  );

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ color: C.text, margin: "0 0 20px", fontSize: 22, fontWeight: 900 }}>💎 Subscription Plans</h2>

      {/* Status Banner */}
      {isSubscribed ? (
        <div style={{ background: `${C.success}15`, border: `2px solid ${C.success}44`, borderRadius: 18, padding: "20px 24px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: C.success }}>Active Subscriber!</div>
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Sab kuch access hai · Expires: <strong style={{ color: C.text }}>{expiresOn}</strong></div>
          </div>
        </div>
      ) : me?.subscription?.pending ? (
        <div style={{ background: `${C.warning}15`, border: `2px solid ${C.warning}44`, borderRadius: 18, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontWeight: 800, color: C.warning, fontSize: 16 }}>⏳ Payment Verification Pending</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>UTR: {me.subscription.txnId} · Admin verify karega jaldi</div>
        </div>
      ) : null}

      {/* Plan Card */}
      <Card style={{ marginBottom: 20, border: `2px solid ${C.primary}55`, background: `linear-gradient(135deg, ${C.primary}08, transparent)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>BEST VALUE PLAN</div>
            <h3 style={{ color: C.text, fontWeight: 900, fontSize: 20, margin: "0 0 8px" }}>💎 {plan.name}</h3>
            <p style={{ color: C.textMuted, fontSize: 13, margin: "0 0 14px", lineHeight: 1.6 }}>{plan.description}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(plan.features || []).map((f, i) => (
                <span key={i} style={{ background: `${C.success}15`, border: `1px solid ${C.success}33`, borderRadius: 99, padding: "4px 11px", fontSize: 11, color: C.success }}>✓ {f}</span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", background: `${C.primary}15`, border: `1px solid ${C.primary}44`, borderRadius: 20, padding: "18px 24px", flexShrink: 0 }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: C.primary }}>₹{plan.price}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>per {plan.duration} days</div>
          </div>
        </div>
      </Card>

      {/* Payment Flow */}
      {!isSubscribed && !me?.subscription?.pending && (
        <>
          {payStep === 0 && (
            <Btn variant="primary" size="lg" onClick={() => setPayStep(1)} style={{ width: "100%" }}>
              💎 Subscribe Now — ₹{plan.price}
            </Btn>
          )}

          {payStep === 1 && (
            <Card>
              <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>💳 UPI se Pay Karein</h3>
              <div style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}33`, borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>UPI ID par pay karein:</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.primary }}>{upi.upiId || "sbcclasses@upi"}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>{upi.upiName} · Amount: <strong style={{ color: C.gold }}>₹{plan.price}</strong></div>
              </div>
              <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                📱 Pay karein <strong style={{ color: C.text }}>GPay / PhonePe / Paytm / BHIM</strong> se → Transaction ID note karein → Next button click karein
              </div>
              <Btn variant="primary" onClick={() => setPayStep(2)} style={{ width: "100%" }}>Maine Pay Kar Diya →</Btn>
              <button onClick={() => setPayStep(0)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 13, marginTop: 10, width: "100%", textAlign: "center" }}>← Go Back</button>
            </Card>
          )}

          {payStep === 2 && (
            <Card>
              <h3 style={{ color: C.text, margin: "0 0 16px", fontSize: 16, fontWeight: 800 }}>🧾 Transaction ID Daalein</h3>
              <Input label="UTR / TRANSACTION ID *" value={txnId} onChange={e => { setTxnId(e.target.value); setErr(""); }} placeholder="12-digit UTR ya Transaction ID" />
              {err && <div style={{ color: C.danger, fontSize: 13, margin: "8px 0" }}>{err}</div>}
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
                💡 UTR / Ref number payment screenshot mein milega. Admin 24 hours mein verify karega.
              </div>
              <Btn variant="primary" onClick={confirmPay} style={{ width: "100%" }}>✅ Submit for Verification</Btn>
            </Card>
          )}

          {payStep === 3 && (
            <Card style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h3 style={{ color: C.success, fontWeight: 900, fontSize: 20, margin: "0 0 10px" }}>Payment Submitted!</h3>
              <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7 }}>
                Admin 24 hours mein verify karega.<br />
                Verification ke baad aapka subscription activate ho jayega.
              </p>
              <div style={{ background: `${C.info}11`, border: `1px solid ${C.info}33`, borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 12, color: C.info }}>
                UTR: {txnId} · Amount: ₹{plan.price}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};


// ============================================================
// RECORDINGS MANAGER — Admin & Teacher
// Videos stored as: { id, classId, title, batchName, subject,
//   date, type: "upload"|"youtube"|"zoom", url, fileData(base64),
//   fileName, size, duration, addedBy, addedAt, free: bool }
// ============================================================
const RecordingsManager = ({ role = "admin", currentUser }) => {
  const [recordings, setRecordings] = useState(() => DB.get("classRecordings") || []);
  const [classes]   = useState(() => DB.get("liveClasses") || []);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("youtube"); // youtube | upload | zoom
  const [form, setForm] = useState({ title:"", classId:"", type:"youtube", url:"", fileData:"", fileName:"", size:0, subject:"", batchName:"", date:"", free:true, notes:"", isCourse:false });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [err, setErr] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [playing, setPlaying] = useState(null); // rec object being played
  const [search, setSearch] = useState("");
  const fileRef = useRef(null);
  const { confirm: askConfirm, Dialog: ConfirmDialog } = useConfirm();

  const myRecordings = role === "admin"
    ? recordings
    : recordings.filter(r => r.addedBy === currentUser?.id || r.addedByRole === role);

  const filtered = myRecordings.filter(r => {
    const matchType = filterType==="all" || r.type===filterType || (filterType==="course"&&r.isCourse);
    const matchSearch = !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.batchName?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const parseYT = (url) => {
    if (!url) return null;
    url = url.trim();
    if (url.includes("youtube.com/embed")) return url;
    const s = url.includes("shorts/") ? [null, url.split("shorts/")[1].split("?")[0].slice(0,11)] : null;
    if (s) return "https://www.youtube.com/embed/"+s[1]+"?autoplay=1";
    const b = url.includes("youtu.be/") ? [null, url.split("youtu.be/")[1].split("?")[0].slice(0,11)] : null;
    if (b) return "https://www.youtube.com/embed/"+b[1]+"?autoplay=1";
    const w = url.includes("v=") ? [null, url.split("v=")[1].split("&")[0].slice(0,11)] : null;
    if (w) return "https://www.youtube.com/embed/"+w[1]+"?autoplay=1";
    const p = url.includes("list=") ? [null, url.split("list=")[1].split("&")[0]] : null;
    if (p) return "https://www.youtube.com/embed/videoseries?list="+p[1]+"&autoplay=1";
    return null;
  };

  const getEmbed = (rec) => {
    if (rec.type==="upload") return rec.fileData || null;
    const yt = parseYT(rec.url);
    if (yt) return yt;
    if (rec.url?.includes("zoom.us")||rec.url?.includes("drive.google")||rec.url?.includes("loom.com")) return rec.url;
    return null;
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 13000 * 1024 * 1024) { setErr("File too large (max 13GB)"); return; }
    setUploading(true); setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = ev => { if (ev.lengthComputable) setUploadProgress(Math.round(ev.loaded/ev.total*100)); };
    reader.onload = ev => { setForm(f=>({...f, fileData:ev.target.result, fileName:file.name, size:Math.round(file.size/1024/1024*10)/10, type:"upload"})); setUploading(false); setUploadProgress(100); };
    reader.onerror = () => { setErr("File read failed."); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const openAdd = (type) => {
    setForm({ title:"", classId:"", type, url:"", fileData:"", fileName:"", size:0, subject:"", batchName:"", date:new Date().toISOString().split("T")[0], free:true, notes:"", isCourse:type==="course" });
    setFormType(type==="course"?"youtube":type);
    setErr(""); setShowForm(true);
  };

  const save = () => {
    setErr("");
    if (!form.title.trim()) { setErr("Title required"); return; }
    if (form.type!=="upload" && !form.url.trim()) { setErr("URL required"); return; }
    if (form.type==="upload" && !form.fileData) { setErr("Please upload a video file"); return; }
    const rec = { ...form, type:formType==="upload"?"upload":"youtube",
      id: form.id||Date.now(),
      addedBy: currentUser?.id||"admin", addedByName: currentUser?.name||"Admin",
      addedByRole: role||"admin", addedAt: new Date().toLocaleDateString("en-IN") };
    const updated = form.id ? recordings.map(r=>r.id===form.id?rec:r) : [...recordings, rec];
    setRecordings(updated); DB.set("classRecordings", updated);
    setShowForm(false);
    toast(form.id?"Updated!":"Added!");
  };

  const del = async (id, title) => {
    const ok = await askConfirm(`Delete "${title}"?`);
    if (!ok) return;
    const updated = recordings.filter(r=>r.id!==id);
    setRecordings(updated); DB.set("classRecordings", updated);
    toast("Deleted");
  };

  const batches = DB.get("batches")||[];

  // ── VIDEO PLAYER MODAL ──
  if (playing) {
    const embed = getEmbed(playing);
    return (
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.97)", zIndex:10002, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:16 }}>
        <div style={{ width:"100%", maxWidth:900 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, gap:12 }}>
            <div>
              <div style={{ color:"#fff", fontWeight:900, fontSize:17 }}>{playing.title}</div>
              <div style={{ color:"#aaa", fontSize:12, marginTop:4 }}>{playing.subject||""}{playing.batchName?" · "+playing.batchName:""}{playing.date?" · "+playing.date:""}</div>
            </div>
            <button onClick={()=>setPlaying(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:40, height:40, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          {embed ? (
            playing.type==="upload" ? (
              <video controls autoPlay style={{ width:"100%", maxHeight:480, borderRadius:14, background:"#000" }} src={embed} />
            ) : (
              <div style={{ position:"relative", paddingBottom:"56.25%", height:0, borderRadius:14, overflow:"hidden", background:"#000" }}>
                <iframe src={embed} style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={playing.title} />
              </div>
            )
          ) : (
            <div style={{ background:"#111", borderRadius:14, padding:"48px 20px", textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:16 }}>🔗</div>
              <p style={{ color:"#aaa", marginBottom:20 }}>Cannot embed this link. Open externally?</p>
              <button onClick={()=>window.open(playing.url,"_blank")} style={{ background:C.primary, border:"none", color:"#fff", borderRadius:12, padding:"12px 28px", fontWeight:800, cursor:"pointer", fontSize:14 }}>Open Link →</button>
            </div>
          )}
          {playing.notes && <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, marginTop:10, textAlign:"center" }}>{playing.notes}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      {ConfirmDialog}

      {/* Header + 3 Add buttons */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
          <div>
            <h2 style={{ color:C.text, margin:"0 0 3px", fontSize:22, fontWeight:900 }}>📚 Courses & Recordings</h2>
            <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>{myRecordings.length} items · Tap any card to play</p>
          </div>
        </div>
        {/* 3 Add Buttons */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {[
            { type:"upload",  icon:"📹", label:"Add Recording", color:C.success },
            { type:"youtube", icon:"▶️", label:"YouTube Link",  color:"#FF0000" },
            { type:"course",  icon:"📚", label:"Upload Course", color:C.primary },
          ].map(b=>(
            <button key={b.type} onClick={()=>openAdd(b.type)}
              style={{ padding:"10px 6px", borderRadius:11, border:`1px solid ${b.color}44`, background:`${b.color}12`, color:b.color, fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <span style={{fontSize:20}}>{b.icon}</span>
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[
          {v:"all",     label:`All (${myRecordings.length})`},
          {v:"upload",  label:`📤 Uploaded (${myRecordings.filter(r=>r.type==="upload").length})`},
          {v:"youtube", label:`▶️ YouTube (${myRecordings.filter(r=>r.type==="youtube").length})`},
          {v:"course",  label:`📚 Courses (${myRecordings.filter(r=>r.isCourse).length})`},
        ].map(f=>(
          <button key={f.v} onClick={()=>setFilterType(f.v)}
            style={{ padding:"6px 14px", borderRadius:99, border:`1px solid ${filterType===f.v?C.primary:C.border}`, background:filterType===f.v?`${C.primary}18`:"transparent", color:filterType===f.v?C.primary:C.textMuted, fontSize:12, fontWeight:filterType===f.v?700:400, cursor:"pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search recordings..."
        style={{ width:"100%", padding:"10px 14px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontSize:14, outline:"none", marginBottom:14, boxSizing:"border-box" }} />

      {/* ADD FORM */}
      {showForm && (
        <Card style={{ marginBottom:18, border:`2px solid ${C.primary}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:16, fontWeight:800 }}>
              {form.id?"✏️ Edit":"➕ Add"} {form.isCourse?"Course":"Recording"}
            </h3>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          {err && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:10, padding:"10px 14px", color:C.danger, fontSize:13, marginBottom:12 }}>{err}</div>}

          {/* Type selector tabs */}
          <div style={{ display:"flex", gap:4, background:C.bgCard2, borderRadius:10, padding:3, marginBottom:14 }}>
            {[{v:"youtube",icon:"▶️",label:"YouTube"},{v:"upload",icon:"📹",label:"Video File"},{v:"zoom",icon:"🔗",label:"Zoom/Drive"}].map(t=>(
              <button key={t.v} onClick={()=>setFormType(t.v)}
                style={{ flex:1, padding:"8px 4px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
                  background:formType===t.v?`linear-gradient(135deg,${C.primary},${C.gold})`:"transparent",
                  color:formType===t.v?"#111":C.textMuted }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <Input label="TITLE *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Chapter 5 — Quadratic Equations" />

          {/* YouTube URL */}
          {(formType==="youtube"||formType==="zoom") && (
            <div style={{ marginTop:12 }}>
              <Input label={formType==="zoom"?"ZOOM/DRIVE/LOOM LINK *":"YOUTUBE URL *"}
                value={form.url} onChange={e=>setForm({...form,url:e.target.value})}
                placeholder={formType==="zoom"?"https://zoom.us/rec/... or drive.google.com/...":"https://youtu.be/... or youtube.com/watch?v=..."} />
              {formType==="youtube" && form.url && parseYT(form.url) && (
                <div style={{ marginTop:10, position:"relative", paddingBottom:"35%", height:0, borderRadius:12, overflow:"hidden", background:"#000" }}>
                  <iframe src={parseYT(form.url)} style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                    allow="autoplay; encrypted-media" allowFullScreen title="preview" />
                </div>
              )}
              {formType==="youtube" && form.url && !parseYT(form.url) && (
                <div style={{ color:C.warning, fontSize:12, marginTop:6 }}>⚠️ Invalid YouTube URL. Try: youtu.be/xxxxx or youtube.com/watch?v=xxxxx</div>
              )}
            </div>
          )}

          {/* File Upload */}
          {formType==="upload" && (
            <div style={{ marginTop:12 }}>
              <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={handleFile} />
              <button onClick={()=>fileRef.current?.click()}
                style={{ width:"100%", padding:"14px", borderRadius:12, border:`2px dashed ${form.fileData?C.success:C.border}`, background:`${form.fileData?C.success:C.primary}08`, color:form.fileData?C.success:C.primary, fontWeight:700, cursor:"pointer", fontSize:14 }}>
                {form.fileData ? `✅ ${form.fileName} (${form.size}MB)` : "📁 Click to select video file"}
              </button>
              {uploading && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.textMuted, marginBottom:4 }}>
                    <span>Uploading...</span><span style={{fontWeight:700,color:C.primary}}>{uploadProgress}%</span>
                  </div>
                  <div style={{ height:6, background:C.bgCard2, borderRadius:99 }}>
                    <div style={{ height:"100%", width:uploadProgress+"%", background:`linear-gradient(90deg,${C.primary},${C.success})`, borderRadius:99, transition:"width 0.3s" }} />
                  </div>
                </div>
              )}
              <div style={{ fontSize:11, color:C.textMuted, marginTop:6 }}>💡 Video stored in browser (localStorage). For large files, use YouTube Unlisted.</div>
            </div>
          )}

          {/* Extra fields */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12 }}>
            <Input label="SUBJECT" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Maths, Science..." />
            <Input label="DATE" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} type="date" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>BATCH</label>
              <select value={form.batchName} onChange={e=>setForm({...form,batchName:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none" }}>
                <option value="">All Batches</option>
                {batches.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>ACCESS</label>
              <select value={form.free?"free":"premium"} onChange={e=>setForm({...form,free:e.target.value==="free"})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none" }}>
                <option value="free">🆓 Free for all</option>
                <option value="premium">💎 Premium only</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop:10 }}>
            <Input label="NOTES (optional)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Any notes about this recording..." />
          </div>

          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={save} style={{ flex:1, padding:"12px 0", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontWeight:800, fontSize:14, cursor:"pointer" }}>
              ✅ {form.id?"Update":"Save"}
            </button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"12px 18px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.textMuted, fontWeight:700, cursor:"pointer" }}>{t("cancel")||"Cancel"}</button>
          </div>
        </Card>
      )}

      {/* RECORDINGS LIST */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"48px 20px" }}>
          <div style={{ fontSize:52, marginBottom:12 }}>📭</div>
          <div style={{ fontWeight:800, color:C.text, marginBottom:6 }}>No recordings yet</div>
          <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>
            {filterType!=="all" ? `No ${filterType} recordings. Try "All" filter.` : "Add your first recording using the buttons above."}
          </p>
        </Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(rec => {
            const embed = getEmbed(rec);
            const canPlay = !!embed;
            return (
              <div key={rec.id}
                onClick={()=>canPlay&&setPlaying(rec)}
                style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", cursor:canPlay?"pointer":"default", transition:"transform 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e=>{if(canPlay){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 24px ${C.primary}22`;}}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <div style={{ display:"flex", gap:0 }}>
                  {/* Color bar */}
                  <div style={{ width:4, background:rec.type==="upload"?C.success:"#FF0000", flexShrink:0 }} />
                  <div style={{ flex:1, padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
                          {canPlay && <span style={{ fontSize:16 }}>{rec.type==="upload"?"📹":"▶️"}</span>}
                          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rec.title}</span>
                        </div>
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:700,
                            background:rec.type==="upload"?`${C.success}22`:"#FF000022",
                            color:rec.type==="upload"?C.success:"#FF0000" }}>
                            {rec.type==="upload"?"📤 Uploaded":"▶️ YouTube"}
                          </span>
                          {rec.isCourse && <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:`${C.primary}22`, color:C.primary, fontWeight:700 }}>📚 Course</span>}
                          {rec.batchName && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{rec.batchName}</span>}
                          {rec.subject && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{rec.subject}</span>}
                          {rec.date && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📅 {rec.date}</span>}
                          <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:rec.free?`${C.success}18`:`${C.primary}18`, color:rec.free?C.success:C.primary, fontWeight:700 }}>
                            {rec.free?"🆓 Free":"💎 Premium"}
                          </span>
                        </div>
                        {rec.notes && <p style={{ color:C.textMuted, fontSize:12, margin:"5px 0 0" }}>{rec.notes}</p>}
                      </div>
                      {/* Action buttons */}
                      <div style={{ display:"flex", gap:5, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                        {canPlay && (
                          <button onClick={()=>setPlaying(rec)}
                            style={{ padding:"7px 12px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontSize:12, fontWeight:800, cursor:"pointer" }}>
                            ▶ Play
                          </button>
                        )}
                        {!canPlay && rec.url && (
                          <button onClick={()=>window.open(rec.url,"_blank")}
                            style={{ padding:"7px 12px", borderRadius:9, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                            🔗 Open
                          </button>
                        )}
                        {(role==="admin"||rec.addedBy===currentUser?.id) && (
                          <>
                            <button onClick={()=>{ setForm({...rec}); setFormType(rec.type==="upload"?"upload":"youtube"); setShowForm(true); setErr(""); }}
                              style={{ padding:"7px 10px", borderRadius:9, border:`1px solid ${C.info}44`, background:`${C.info}12`, color:C.info, fontSize:12, cursor:"pointer" }}>✏️</button>
                            <button onClick={()=>del(rec.id, rec.title)}
                              style={{ padding:"7px 10px", borderRadius:9, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontSize:12, cursor:"pointer" }}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


const WatchTicker = ({ classId, duration, onTick }) => {
  useEffect(() => {
    const iv = setInterval(() => onTick(classId, duration), 1000);
    return () => clearInterval(iv);
  }, [classId]);
  return null;
};


// ============================================================
// STUDENT COURSES PAGE — YouTube Playlists In-App
// ============================================================
// ============================================================
// STUDENT COURSES PAGE — 2 Tabs: App Courses + YouTube Free
// ============================================================
const StudentCoursesPage = ({ currentUser }) => {
  const [tab, setTab] = useState("recordings");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState(null);
  const [watchLog, setWatchLog] = useState(() => DB.get("recWatchLog_"+(currentUser?.id||"")) || {});
  const [watchTimers, setWatchTimers] = useState({});

  // ── Recordings from DB ──
  const allRecordings = DB.get("classRecordings") || [];
  const legacyRecs = (DB.get("liveClasses")||[])
    .filter(c => c.status==="completed" && c.recordingLink)
    .map(c => ({ id:"leg_"+c.id, classId:c.id, title:c.title, batchName:c.batchName,
      subject:c.subject, date:c.date, type:"youtube", url:c.recordingLink, free:true }));
  const recordings = [...allRecordings, ...legacyRecs].filter(r =>
    r.free || !r.batchName ||
    r.batchName===currentUser?.batch || r.batchName===currentUser?.batchName
  );

  // ── App Courses ──
  const appCourses = DB.get("appCourses") || [
    { id:"ac1", title:"Mathematics Complete Course", subject:"Maths", class:"Class 10", access:"subscription", price:499, desc:"Algebra, Geometry, Trigonometry — full syllabus", lessons:32 },
    { id:"ac2", title:"Science Mastery — Class 9", subject:"Science", class:"Class 9", access:"free", price:0, desc:"Physics, Chemistry, Biology — CBSE & State Board", lessons:24 },
    { id:"ac3", title:"English Grammar & Writing", subject:"English", class:"Class 6-12", access:"subscription", price:299, desc:"Grammar, essay writing, comprehension", lessons:18 },
    { id:"ac4", title:"Social Science — History+Geo", subject:"SST", class:"Class 8", access:"free", price:0, desc:"History, Geography, Civics chapter wise", lessons:20 },
  ];

  // ── YouTube Playlists ──
  const ytPlaylists = DB.get("youtubePlaylist") || [];

  const subData = DB.get("sub_"+currentUser?.id) || {};
  const hasSub = subData.status==="active" && new Date(subData.expiry) > new Date();

  // YouTube URL → embed
  const toEmbed = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/embed/")) return url;
    const s = url.includes("shorts/") ? [null, url.split("shorts/")[1].split("?")[0].slice(0,11)] : null;
    if (s) return "https://www.youtube.com/embed/"+s[1];
    const b = url.includes("youtu.be/") ? [null, url.split("youtu.be/")[1].split("?")[0].slice(0,11)] : null;
    if (b) return "https://www.youtube.com/embed/"+b[1];
    const v = url.includes("v=") ? [null, url.split("v=")[1].split("&")[0].slice(0,11)] : null;
    if (v) return "https://www.youtube.com/embed/"+v[1];
    const p = url.includes("list=") ? [null, url.split("list=")[1].split("&")[0]] : null;
    if (p) return "https://www.youtube.com/embed/videoseries?list="+p[1];
    return null;
  };

  const watchRecording = (rec) => {
    const now = Date.now();
    const classTime = rec.date ? new Date(rec.date+"T00:00").getTime() : 0;
    const within24hr = !rec.date || (now-classTime)<24*60*60*1000;
    let src = null;
    if (rec.type==="upload" && rec.fileData) src = rec.fileData;
    else src = toEmbed(rec.url || rec.recordingLink || "");
    setPlaying({ ...rec, src, within24hr, isRecording:true });
  };

  const watchCourse = (course) => {
    setPlaying({ ...course, src: toEmbed(course.url||""), isRecording:false });
  };

  const tickWatch = (id, duration) => {
    setWatchTimers(prev => {
      const newSecs = (prev[id]||0)+1;
      const required = Math.min((duration||60)*60*0.9, 30*60);
      if (newSecs>=required) {
        const log = DB.get("recWatchLog_"+(currentUser?.id||""))||{};
        if (!log[id]?.attendanceMarked) {
          const updated = {...log, [id]:{attendanceMarked:true, markedAt:Date.now()}};
          DB.set("recWatchLog_"+(currentUser?.id||""), updated);
          setWatchLog(updated);
          const att = DB.get("attendance_"+id)||{};
          att[currentUser?.id] = {present:true, via:"recording", markedAt:Date.now()};
          DB.set("attendance_"+id, att);
          toast("✅ Attendance marked for this class!");
        }
      }
      return {...prev, [id]:newSecs};
    });
  };

  const filteredRec = recordings.filter(r =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) ||
    (r.batchName||"").toLowerCase().includes(search.toLowerCase()) ||
    (r.subject||"").toLowerCase().includes(search.toLowerCase())
  );
  const filteredApp = appCourses.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
    (c.subject||"").toLowerCase().includes(search.toLowerCase())
  );
  const filteredYT = ytPlaylists.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) ||
    (p.desc||"").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📚 Courses & Recordings</h2>
        <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>
          {recordings.length} recordings · {appCourses.length} courses · {ytPlaylists.length} playlists
        </p>
      </div>

      {/* 3 Tab Switcher */}
      <div style={{ display:"flex", gap:0, background:C.bgCard2, borderRadius:14, padding:4, marginBottom:16, border:`1px solid ${C.border}` }}>
        {[
          { key:"recordings", icon:"📹", label:"Recordings",   count:recordings.length },
          { key:"app",        icon:"📱", label:"App Courses",  count:appCourses.length },
          { key:"youtube",    icon:"▶️", label:"YouTube",      count:ytPlaylists.length },
        ].map(t => (
          <button key={t.key} onClick={()=>{ setTab(t.key); setSearch(""); setPlaying(null); }}
            style={{ flex:1, padding:"10px 4px", border:"none", borderRadius:11, cursor:"pointer",
              background: tab===t.key ? `linear-gradient(135deg,${C.primary},${C.primaryLight})` : "transparent",
              color: tab===t.key ? "#fff" : C.textMuted, transition:"all 0.2s" }}>
            <div style={{ fontSize:20 }}>{t.icon}</div>
            <div style={{ fontSize:12, fontWeight:800, marginTop:2 }}>{t.label}</div>
            <div style={{ fontSize:10, marginTop:1, opacity:tab===t.key?1:0.6 }}>{t.count} {t.key==="recordings"?"videos":t.key==="app"?"courses":"playlists"}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position:"relative", marginBottom:16 }}>
        <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", color:C.textMuted }}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder={tab==="recordings"?"Search recordings...":tab==="app"?"Search courses...":"Search playlists..."}
          style={{ width:"100%", padding:"11px 14px 11px 40px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* ══ RECORDINGS TAB ══ */}
      {tab==="recordings" && (
        <div>
          <div style={{ background:`${C.info}12`, border:`1px solid ${C.info}33`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:13, color:C.text, lineHeight:1.6 }}>
            ⏱️ <strong>Watch within 24 hours</strong> of class → attendance <span style={{color:C.success,fontWeight:700}}>auto-marked ✅</span>
          </div>
          {filteredRec.length===0
            ? <Card style={{ textAlign:"center", padding:"48px 20px" }}>
                <div style={{ fontSize:52, marginBottom:10 }}>📭</div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:6 }}>No Recordings Yet</div>
                <p style={{ color:C.textMuted, fontSize:13 }}>Teacher ke baad class complete karne par recordings yahan dikhenge.</p>
              </Card>
            : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filteredRec.map(rec => {
                  const log = watchLog[rec.id]||{};
                  const secs = watchTimers[rec.id]||0;
                  const classTime = rec.date ? new Date(rec.date+"T00:00").getTime() : 0;
                  const within24hr = !rec.date || (Date.now()-classTime)<24*60*60*1000;
                  const required = Math.min((rec.duration||60)*60*0.9, 30*60);
                  const pct = Math.min(100, Math.round(secs/required*100));
                  const marked = log.attendanceMarked;
                  return (
                    <Card key={rec.id} style={{ border:`1px solid ${marked?C.success+"55":C.border}`, padding:0, overflow:"hidden" }}>
                      <div style={{ display:"flex", gap:0 }}>
                        <div style={{ width:5, background:rec.type==="upload"?C.success:"#FF0000", flexShrink:0 }} />
                        <div style={{ flex:1, padding:"14px 16px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:4 }}>{rec.title}</div>
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                {rec.batchName && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📚 {rec.batchName}</span>}
                                {rec.subject && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📖 {rec.subject}</span>}
                                {rec.date && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📅 {rec.date}</span>}
                                <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:700,
                                  background:rec.type==="upload"?`${C.success}22`:"#FF000022",
                                  color:rec.type==="upload"?C.success:"#FF0000" }}>
                                  {rec.type==="upload"?"📤 Uploaded":"▶️ YouTube"}
                                </span>
                              </div>
                            </div>
                            <div>
                              {marked && <span style={{ fontSize:11, background:`${C.success}22`, color:C.success, padding:"3px 10px", borderRadius:99, fontWeight:800 }}>✅ Attended</span>}
                              {!marked && within24hr && <span style={{ fontSize:11, background:`${C.warning}22`, color:C.warning, padding:"3px 10px", borderRadius:99, fontWeight:700 }}>⏱️ 24hr Open</span>}
                              {!marked && !within24hr && <span style={{ fontSize:11, background:`${C.textMuted}22`, color:C.textMuted, padding:"3px 10px", borderRadius:99 }}>🔒 Closed</span>}
                            </div>
                          </div>
                          {secs>0 && !marked && (
                            <div style={{ marginBottom:10 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:C.textMuted, marginBottom:4 }}>
                                <span>Watch progress</span><span style={{ fontWeight:700, color:C.primary }}>{pct}%</span>
                              </div>
                              <div style={{ height:5, background:C.bgCard2, borderRadius:99, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:pct+"%", background:`linear-gradient(90deg,${C.primary},${C.success})`, transition:"width 1s" }} />
                              </div>
                            </div>
                          )}
                          <button onClick={()=>watchRecording(rec)}
                            style={{ width:"100%", padding:"11px 0", borderRadius:11, border:"none",
                              background:marked?`linear-gradient(135deg,${C.success},#22c55e)`:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,
                              color:"#fff", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                            {marked ? "▶ Watch Again" : "▶ Watch Recording"+(within24hr?" (Attendance Eligible)":"")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ══ APP COURSES TAB ══ */}
      {tab==="app" && (
        <div>
          {!hasSub && (
            <div style={{ background:`linear-gradient(135deg,${C.primary}22,${C.gold}11)`, border:`1px solid ${C.primary}44`, borderRadius:14, padding:"14px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>💎</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14, color:C.text }}>Get Premium — Unlock All Courses</div>
                <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>Subscribe karo to access all paid courses</div>
              </div>
            </div>
          )}
          {hasSub && (
            <div style={{ background:`${C.success}15`, border:`1px solid ${C.success}44`, borderRadius:12, padding:"10px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
              <span>✅</span><div style={{ fontSize:13, color:C.success, fontWeight:700 }}>Premium Active — All courses unlocked!</div>
            </div>
          )}
          {filteredApp.length===0
            ? <Card style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:44, marginBottom:10 }}>📱</div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:8 }}>No App Courses Yet</div>
                <p style={{ color:C.textMuted, fontSize:13 }}>Admin courses add karega — yahan dikhenge.</p>
              </Card>
            : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {filteredApp.map(course => {
                  const accessible = course.access==="free" || hasSub;
                  return (
                    <Card key={course.id} style={{ padding:0, overflow:"hidden", opacity:accessible?1:0.85 }}>
                      <div style={{ display:"flex", gap:0 }}>
                        <div style={{ width:5, background:course.access==="free"?C.success:C.primary, flexShrink:0 }} />
                        <div style={{ flex:1, padding:"14px 16px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:10 }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:800, fontSize:15, color:C.text, marginBottom:4 }}>{course.title}</div>
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                                <span style={{ fontSize:11, background:`${C.primary}22`, color:C.primary, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>{course.subject}</span>
                                <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{course.class}</span>
                                {course.lessons && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📖 {course.lessons} lessons</span>}
                              </div>
                              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>{course.desc}</div>
                            </div>
                            <div style={{ textAlign:"center", flexShrink:0 }}>
                              {course.access==="free"
                                ? <span style={{ background:`${C.success}20`, color:C.success, fontWeight:900, fontSize:12, padding:"4px 10px", borderRadius:99, border:`1px solid ${C.success}44` }}>FREE</span>
                                : <div>
                                    <span style={{ background:`${C.primary}20`, color:C.primary, fontWeight:900, fontSize:12, padding:"4px 10px", borderRadius:99, border:`1px solid ${C.primary}44` }}>💎 PAID</span>
                                    {course.price>0 && <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>₹{course.price}</div>}
                                  </div>
                              }
                            </div>
                          </div>
                          {accessible
                            ? <button onClick={()=>watchCourse(course)}
                                style={{ width:"100%", padding:"11px 0", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`, color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer" }}>
                                ▶ Start Learning
                              </button>
                            : <div style={{ display:"flex", gap:8 }}>
                                <div style={{ flex:1, background:C.bgCard2, border:`1px solid ${C.border}`, borderRadius:10, padding:"9px 0", fontSize:12, fontWeight:700, color:C.textMuted, textAlign:"center" }}>
                                  🔒 Subscription Required
                                </div>
                              </div>
                          }
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* ══ YOUTUBE TAB ══ */}
      {tab==="youtube" && (
        <div>
          <div style={{ background:`${C.info}12`, border:`1px solid ${C.info}33`, borderRadius:12, padding:"10px 14px", marginBottom:14, fontSize:13, color:C.text }}>
            ▶️ <strong>100% Free</strong> — Opens directly on YouTube. No subscription needed.
          </div>
          {filteredYT.length===0
            ? <Card style={{ textAlign:"center", padding:"40px 20px" }}>
                <div style={{ fontSize:44, marginBottom:10 }}>▶️</div>
                <div style={{ fontWeight:700, color:C.text, marginBottom:8 }}>No YouTube Playlists Yet</div>
                <p style={{ color:C.textMuted, fontSize:13 }}>Admin YouTube playlists add karega — sab yahan free mein dikhenge.</p>
              </Card>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
                {filteredYT.map(item => (
                  <div key={item.id} onClick={()=>window.open(item.url,"_blank")}
                    style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:18, overflow:"hidden", cursor:"pointer", transition:"transform 0.2s" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-4px)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="none"}>
                    <div style={{ position:"relative", height:150, background:"linear-gradient(135deg,#FF000018,#FF660011)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff" }}>▶</div>
                      {item.videos && (
                        <div style={{ position:"absolute", bottom:8, right:10, background:"rgba(0,0,0,0.78)", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>
                          📹 {item.videos} videos
                        </div>
                      )}
                      <div style={{ position:"absolute", top:10, left:10, background:"#FF0000", color:"#fff", fontSize:10, fontWeight:900, padding:"3px 9px", borderRadius:99 }}>FREE</div>
                    </div>
                    <div style={{ padding:"14px 16px" }}>
                      <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:5 }}>{item.title}</div>
                      {item.desc && <div style={{ fontSize:12, color:C.textMuted, marginBottom:8, lineHeight:1.5 }}>{item.desc}</div>}
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:16, height:16, borderRadius:4, background:"#FF0000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:900 }}>▶</div>
                        <span style={{ fontSize:12, color:"#FF0000", fontWeight:700 }}>Watch on YouTube →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {/* ══ VIDEO PLAYER OVERLAY ══ */}
      {playing && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.96)", zIndex:10002, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ width:"100%", maxWidth:900 }}>
            {/* Player Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12, gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:6, marginBottom:6, flexWrap:"wrap" }}>
                  {playing.isRecording && <span style={{ fontSize:11, background:"#FF000099", color:"#fff", padding:"2px 8px", borderRadius:99, fontWeight:800 }}>📹 RECORDING</span>}
                  {playing.isRecording && playing.within24hr && !(watchLog[playing.id]||{}).attendanceMarked && (
                    <span style={{ fontSize:11, background:`${C.warning}99`, color:"#fff", padding:"2px 8px", borderRadius:99, fontWeight:800 }}>⏱️ Attendance Eligible</span>
                  )}
                  {(watchLog[playing.id]||{}).attendanceMarked && (
                    <span style={{ fontSize:11, background:`${C.success}99`, color:"#fff", padding:"2px 8px", borderRadius:99, fontWeight:800 }}>✅ Attendance Marked</span>
                  )}
                </div>
                <div style={{ color:"#fff", fontWeight:900, fontSize:16 }}>{playing.title}</div>
                <div style={{ color:"#aaa", fontSize:12, marginTop:3 }}>{playing.subject||""} {playing.batchName?"· "+playing.batchName:""}</div>
              </div>
              <button onClick={()=>setPlaying(null)}
                style={{ background:"rgba(255,255,255,0.12)", border:"none", color:"#fff", borderRadius:99, width:38, height:38, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>✕</button>
            </div>

            {/* Progress bar */}
            {playing.isRecording && playing.within24hr && !(watchLog[playing.id]||{}).attendanceMarked && (() => {
              const secs = watchTimers[playing.id]||0;
              const required = Math.min((playing.duration||60)*60*0.9, 30*60);
              const pct = Math.min(100, Math.round(secs/required*100));
              return (
                <div style={{ marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#aaa", marginBottom:4 }}>
                    <span>⌛ Watch progress (don't skip)</span>
                    <span style={{ color:pct>=100?"#4ade80":C.primaryLight, fontWeight:700 }}>{pct}%{pct>=100?" — ✅ Done!":""}</span>
                  </div>
                  <div style={{ height:5, background:"rgba(255,255,255,0.1)", borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:pct+"%", background:`linear-gradient(90deg,${C.primary},#4ade80)`, borderRadius:99, transition:"width 1s" }} />
                  </div>
                </div>
              );
            })()}

            {/* Video */}
            {playing.src ? (
              playing.type==="upload" && playing.fileData ? (
                <video controls style={{ width:"100%", maxHeight:460, borderRadius:14, background:"#000" }}
                  onTimeUpdate={()=>tickWatch(playing.id, playing.duration)}>
                  <source src={playing.src} />
                </video>
              ) : (
                <div style={{ position:"relative", paddingBottom:"56.25%", height:0, borderRadius:14, overflow:"hidden" }}>
                  <iframe src={playing.src}
                    style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen title={playing.title}
                    onLoad={()=>{ if(playing.isRecording){ const iv=setInterval(()=>tickWatch(playing.id,playing.duration),1000); return ()=>clearInterval(iv); }}} />
                </div>
              )
            ) : (
              <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:14, padding:"48px 20px", textAlign:"center" }}>
                <div style={{ fontSize:52, marginBottom:12 }}>🎬</div>
                <p style={{ color:"#aaa", fontSize:14, marginBottom:16 }}>Video link not set for this item.</p>
                {playing.url && (
                  <button onClick={()=>window.open(playing.url,"_blank")}
                    style={{ background:"#FF0000", border:"none", color:"#fff", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:800, cursor:"pointer" }}>
                    ▶ Open on YouTube
                  </button>
                )}
              </div>
            )}

            {/* WatchTicker for recordings */}
            {playing.isRecording && playing.src && playing.type!=="upload" && (
              <WatchTicker classId={playing.id} duration={playing.duration} onTick={tickWatch} />
            )}

            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, textAlign:"center", marginTop:10 }}>
              {playing.isRecording && playing.within24hr && !(watchLog[playing.id]||{}).attendanceMarked
                ? "⚠️ Don't skip — watch fully for attendance"
                : "Tap ✕ to close"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};


// ============================================================
// APP COURSES MANAGER (Admin) — Add/Edit/Delete app courses
// ============================================================
const AppCoursesManager = ({ onNavigate }) => {
  const emptyCourse = { title:"", subject:"", class:"", desc:"", lessons:0, price:0, access:"free", active:true };
  const [courses, setCourses] = useState(() => DB.get("appCourses") || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCourse);
  const [search, setSearch] = useState("");

  const save = () => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    const record = { ...form, id: form.id || Date.now(), lessons: parseInt(form.lessons)||0, price: parseInt(form.price)||0 };
    const updated = form.id ? courses.map(c => c.id===form.id ? record : c) : [...courses, record];
    setCourses(updated); DB.set("appCourses", updated);
    setShowForm(false); setForm(emptyCourse);
    toast("Course saved!");
  };

  const del = (id) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated); DB.set("appCourses", updated);
    toast("Course deleted");
  };

  const toggle = (id) => {
    const updated = courses.map(c => c.id===id ? {...c, active: !c.active} : c);
    setCourses(updated); DB.set("appCourses", updated);
  };

  const filtered = courses.filter(c =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📱 App Courses</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>{courses.length} courses · Students ko "App Courses" tab mein dikhenge</p>
        </div>
        <button onClick={()=>{ setForm(emptyCourse); setShowForm(true); }}
          style={{ padding:"10px 18px", borderRadius:11, border:"none", background:`linear-gradient(135deg,${C.primary},${C.gold})`, color:"#111", fontWeight:800, fontSize:13, cursor:"pointer" }}>
          + Add Course
        </button>
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search courses..."
        style={{ width:"100%", padding:"11px 14px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard, color:C.text, fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }} />

      {/* Form */}
      {showForm && (
        <Card style={{ marginBottom:20, border:`2px solid ${C.primary}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ color:C.text, margin:0, fontSize:16, fontWeight:800 }}>{form.id ? "✏️ Edit Course" : "➕ New Course"}</h3>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:20, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1/-1" }}><Input label="COURSE TITLE *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Mathematics Complete Course — Class 10" /></div>
            <Input label="SUBJECT" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Maths, Science" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>CLASS</label>
              <select value={form.class} onChange={e=>setForm({...form,class:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none" }}>
                <option value="">All Classes</option>
                {["Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <Input label="NO. OF LESSONS" value={form.lessons} onChange={e=>setForm({...form,lessons:e.target.value})} placeholder="24" type="number" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>ACCESS TYPE</label>
              <select value={form.access} onChange={e=>setForm({...form,access:e.target.value})}
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none" }}>
                <option value="free">🆓 Free for all</option>
                <option value="subscription">💎 Subscription required</option>
              </select>
            </div>
            {form.access==="subscription" && (
              <Input label="PRICE (₹)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="499" type="number" />
            )}
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7 }}>DESCRIPTION</label>
              <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Course ke baare mein brief detail..."
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={save} style={{ flex:1, padding:"12px 0", borderRadius:11, border:"none", background:C.primary, color:"#fff", fontWeight:800, cursor:"pointer" }}>✅ Save Course</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"12px 18px", borderRadius:11, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.textMuted, fontWeight:700, cursor:"pointer" }}>{t("cancel")||"Cancel"}</button>
          </div>
        </Card>
      )}

      {/* Courses List */}
      {filtered.length === 0
        ? <Card style={{ textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:48, marginBottom:10 }}>📭</div>
            <div style={{ fontWeight:700, color:C.text }}>No courses yet</div>
            <p style={{ color:C.textMuted, fontSize:13 }}>Click "+ Add Course" to create your first course.</p>
          </Card>
        : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map(c => (
              <Card key={c.id} style={{ opacity:c.active===false?0.65:1, border:`1px solid ${c.access==="free"?C.success+"33":C.primary+"33"}` }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`linear-gradient(135deg,${c.access==="free"?C.success:C.primary},${c.access==="free"?C.success:C.primary}88)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                    📚
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:4 }}>{c.title}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                      <span style={{ fontSize:11, padding:"2px 8px", borderRadius:99, background:c.access==="free"?`${C.success}22`:`${C.primary}22`, color:c.access==="free"?C.success:C.primary, fontWeight:700 }}>{c.access==="free"?"🆓 Free":"💎 Paid"}</span>
                      {c.subject && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{c.subject}</span>}
                      {c.class && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{c.class}</span>}
                      {c.lessons>0 && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>📖 {c.lessons} lessons</span>}
                      {c.price>0 && <span style={{ fontSize:11, background:`${C.gold}22`, color:C.gold, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>₹{c.price}</span>}
                      {c.active===false && <span style={{ fontSize:11, background:`${C.danger}22`, color:C.danger, padding:"2px 8px", borderRadius:99 }}>⏸ Hidden</span>}
                    </div>
                    {c.desc && <p style={{ fontSize:12, color:C.textMuted, margin:0 }}>{c.desc}</p>}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={()=>{ setForm({...c}); setShowForm(true); }}
                      style={{ padding:"7px 12px", borderRadius:9, border:`1px solid ${C.info}44`, background:`${C.info}12`, color:C.info, fontWeight:700, fontSize:12, cursor:"pointer" }}>✏️</button>
                    <button onClick={()=>toggle(c.id)}
                      style={{ padding:"7px 12px", borderRadius:9, border:`1px solid ${C.warning}44`, background:`${C.warning}12`, color:C.warning, fontWeight:700, fontSize:12, cursor:"pointer" }}>{c.active===false?"▶":"⏸"}</button>
                    <button onClick={()=>del(c.id)}
                      style={{ padding:"7px 12px", borderRadius:9, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontWeight:700, fontSize:12, cursor:"pointer" }}>🗑️</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      }
    </div>
  );
};

// ============================================================
// YOUTUBE PLAYLIST MANAGER (Admin Settings)
// ============================================================
const YoutubePlaylistManager = () => {
  const emptyItem = { title:"", url:"", desc:"", videos:"", subject:"", class:"" };
  const [playlists, setPlaylists] = useState(() => DB.get("youtubePlaylist") || []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [preview, setPreview] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com/embed")) return url;
    const plMatch = url.includes("list=") ? [null, url.split("list=")[1].split("&")[0]] : null;
    const vMatch = url.includes("v=") ? [null, url.split("v=")[1].split("&")[0].slice(0,11)] : null;
    const sMatch = url.includes("youtu.be/") ? [null, url.split("youtu.be/")[1].split("?")[0].slice(0,11)] : null;
    if (plMatch) return "https://www.youtube.com/embed/videoseries?list=" + plMatch[1];
    if (vMatch)  return "https://www.youtube.com/embed/" + vMatch[1];
    if (sMatch)  return "https://www.youtube.com/embed/" + sMatch[1];
    return null;
  };

  const save = () => {
    if (!form.title.trim() || !form.url.trim()) { toast("Title and URL required", "error"); return; }
    const record = { ...form, id: form.id || Date.now() };
    const updated = form.id
      ? playlists.map(p => p.id===form.id ? record : p)
      : [...playlists, record];
    setPlaylists(updated); DB.set("youtubePlaylist", updated);
    setShowForm(false); setForm(emptyItem);
    toast("Playlist saved!");
  };

  const del = (id) => {
    const updated = playlists.filter(p => p.id !== id);
    setPlaylists(updated); DB.set("youtubePlaylist", updated);
    toast("Playlist deleted");
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h3 style={{ color:C.text, margin:"0 0 4px", fontSize:18, fontWeight:900 }}>▶️ YouTube Playlists</h3>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Free playlists — students ko YouTube par directly open honge</p>
        </div>
        <button onClick={()=>{ setForm(emptyItem); setShowForm(true); }}
          style={{ padding:"9px 16px", borderRadius:10, border:"none", background:"#FF0000", color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer" }}>
          + Add Playlist
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom:16, border:"2px solid #FF000044" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <h4 style={{ color:C.text, margin:0, fontWeight:800 }}>{form.id ? "✏️ Edit Playlist" : "➕ New YouTube Playlist"}</h4>
            <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", color:C.textMuted, fontSize:18, cursor:"pointer" }}>✕</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <Input label="PLAYLIST TITLE *" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Class 10 Maths Complete" />
            <div>
              <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:6 }}>YOUTUBE URL * (playlist or video)</label>
              <input value={form.url} onChange={e=>setForm({...form,url:e.target.value})}
                placeholder="https://youtube.com/playlist?list=... or youtube.com/watch?v=..."
                style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
              {form.url && getEmbedUrl(form.url) && (
                <div style={{ marginTop:8, fontSize:12, color:"#FF0000", fontWeight:700 }}>✅ Valid YouTube URL</div>
              )}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="SUBJECT" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="e.g. Maths" />
              <Input label="CLASS" value={form.class} onChange={e=>setForm({...form,class:e.target.value})} placeholder="e.g. Class 10" />
              <Input label="VIDEO COUNT" value={form.videos} onChange={e=>setForm({...form,videos:e.target.value})} placeholder="e.g. 45" type="number" />
              <Input label="DESCRIPTION" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Brief description" />
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <button onClick={save} style={{ flex:1, padding:"11px 0", borderRadius:10, border:"none", background:"#FF0000", color:"#fff", fontWeight:800, cursor:"pointer" }}>✅ Save Playlist</button>
            <button onClick={()=>setShowForm(false)} style={{ padding:"11px 16px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.textMuted, fontWeight:700, cursor:"pointer" }}>{t("cancel")||"Cancel"}</button>
          </div>
        </Card>
      )}

      {playlists.length === 0
        ? <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
            <div style={{ fontSize:48, marginBottom:10 }}>▶️</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>No playlists yet</div>
            <p style={{ fontSize:13 }}>Add YouTube playlists — students ko free mein dikhenge</p>
          </div>
        : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {playlists.map(p => {
              const embed = getEmbedUrl(p.url);
              return (
                <Card key={p.id}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:"#FF000022", border:"1px solid #FF000044", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>▶️</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:C.text, marginBottom:4 }}>{p.title}</div>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                        {p.subject && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{p.subject}</span>}
                        {p.class   && <span style={{ fontSize:11, background:C.bgCard2, color:C.textMuted, padding:"2px 8px", borderRadius:99 }}>{p.class}</span>}
                        {p.videos  && <span style={{ fontSize:11, background:"#FF000018", color:"#FF0000", padding:"2px 8px", borderRadius:99, fontWeight:700 }}>📹 {p.videos} videos</span>}
                        <span style={{ fontSize:11, background:`${C.success}18`, color:C.success, padding:"2px 8px", borderRadius:99, fontWeight:700 }}>🆓 FREE</span>
                      </div>
                      {p.desc && <p style={{ fontSize:12, color:C.textMuted, margin:0 }}>{p.desc}</p>}
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <button onClick={()=>setPreview(preview===p.id?null:p.id)}
                        style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, color:C.primary, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                        {preview===p.id?"⬆ Close":"▶ Preview"}
                      </button>
                      <button onClick={()=>{ setForm({...p}); setShowForm(true); }}
                        style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.info}44`, background:`${C.info}12`, color:C.info, fontSize:12, cursor:"pointer" }}>✏️</button>
                      <button onClick={()=>del(p.id)}
                        style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontSize:12, cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>
                  {preview === p.id && embed && (
                    <div style={{ marginTop:12, position:"relative", paddingBottom:"56.25%", height:0, borderRadius:12, overflow:"hidden" }}>
                      <iframe src={embed} style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
                        allow="accelerometer; autoplay; encrypted-media" allowFullScreen title={p.title} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
      }
    </div>
  );
};


// ============================================================
// ADMIN CONTENT HUB — Recordings + App Courses + YouTube in ONE page
// ============================================================
const AdminContentHub = ({ onNavigate }) => {
  const [tab, setTab] = useState("recordings");
  const recordings = DB.get("classRecordings") || [];
  const appCourses = DB.get("appCourses") || [];
  const ytPlaylists = DB.get("youtubePlaylist") || [];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📱 App Courses</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>Recordings · App Courses · YouTube Playlists — sab ek jagah</p>
        </div>
      </div>

      {/* 3 Tab Switcher */}
      <div style={{ display:"flex", gap:0, background:C.bgCard2, borderRadius:14, padding:4, marginBottom:20, border:`1px solid ${C.border}` }}>
        {[
          { key:"recordings", icon:"📹", label:"Recordings",    count:recordings.length,   color:"#FF0000" },
          { key:"courses",    icon:"📱", label:"App Courses",   count:appCourses.length,   color:C.primary },
          { key:"youtube",    icon:"▶️", label:"YouTube",       count:ytPlaylists.length,  color:"#FF0000" },
        ].map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ flex:1, padding:"12px 8px", border:"none", borderRadius:11, cursor:"pointer",
              background: tab===t.key ? `linear-gradient(135deg,${t.color},${t.color}99)` : "transparent",
              color: tab===t.key ? "#fff" : C.textMuted, transition:"all 0.2s" }}>
            <div style={{ fontSize:22 }}>{t.icon}</div>
            <div style={{ fontSize:13, fontWeight:800, marginTop:2 }}>{t.label}</div>
            <div style={{ fontSize:11, opacity:tab===t.key?1:0.6 }}>{t.count} items</div>
          </button>
        ))}
      </div>

      {tab === "recordings" && <RecordingsManager role="admin" />}
      {tab === "courses"    && <AppCoursesManager />}
      {tab === "youtube"    && <YoutubePlaylistManager />}
    </div>
  );
};

// ============================================================
// REPORTS PAGE (Admin) — Real DB data
// ============================================================
const ReportsPage = () => {
  const students   = DB.get("students")   || [];
  const teachers   = DB.get("teachers")   || [];
  const batches    = DB.get("batches")    || [];
  const txns       = DB.get("txnHistory") || [];
  const classes    = DB.get("liveClasses")|| [];
  const recordings = DB.get("classRecordings")|| [];

  const approved   = students.filter(s => s.status==="approved"||s.status==="Approved");
  const pending    = students.filter(s => s.status==="Pending Approval");
  const approvedT  = teachers.filter(t => t.status==="Approved"||t.status==="approved");
  const active     = batches.filter(b => b.active!==false);

  const paidTxns   = txns.filter(t => t.amount);
  const totalRev   = paidTxns.reduce((s,t)=>s+(parseInt(t.amount)||0),0);
  const thisMonth  = new Date().getMonth();
  const monthRev   = paidTxns.filter(t=>{ try{return new Date(t.date).getMonth()===thisMonth;}catch(e){return false;} })
                              .reduce((s,t)=>s+(parseInt(t.amount)||0),0);
  const withAtt    = approved.filter(s=>s.attendance>0);
  const avgAtt     = withAtt.length ? Math.round(withAtt.reduce((s,x)=>s+x.attendance,0)/withAtt.length) : 0;

  const cbse  = approved.filter(s=>s.board==="CBSE").length;
  const state = approved.filter(s=>s.board==="State"||s.board==="State Board").length;
  const icse  = approved.filter(s=>s.board==="ICSE").length;
  const total = cbse+state+icse||1;

  return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>📊 Reports & Analytics</h2>
      <p style={{ color:C.textMuted, fontSize:13, marginBottom:20 }}>Live data · {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
        {[
          {icon:"🎓",label:"Total Students",     value:students.length,           sub:`${approved.length} active · ${pending.length} pending`, color:C.success},
          {icon:"👨‍🏫",label:"Teachers",            value:teachers.length,           sub:`${approvedT.length} approved`, color:C.info},
          {icon:"📚",label:"Active Batches",     value:active.length,             sub:`${batches.length} total`, color:C.primary},
          {icon:"✅",label:"Avg Attendance",     value:avgAtt?avgAtt+"%":"—",     sub:`${withAtt.length} tracked`, color:C.gold},
          {icon:"📡",label:"Classes Completed",  value:classes.filter(c=>c.status==="completed").length, sub:`${classes.length} total`, color:C.warning},
          {icon:"🎬",label:"Recordings",         value:recordings.length,         sub:"in library", color:"#FF0000"},
          {icon:"💰",label:"This Month",         value:monthRev?"₹"+monthRev.toLocaleString("en-IN"):"₹0", sub:"fees collected", color:C.gold},
          {icon:"🏦",label:"Total Revenue",      value:totalRev?"₹"+totalRev.toLocaleString("en-IN"):"₹0", sub:"all time", color:C.success},
        ].map((s,i)=>(
          <div key={i} style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, marginTop:4 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{s.label}</div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>💰 Batch-wise Revenue</h3>
          {active.length===0 && <p style={{ color:C.textMuted, fontSize:13 }}>No batches yet</p>}
          {active.map(b=>{
            const bs = approved.filter(s=>String(s.batchId)===String(b.id)).length;
            const rev = bs*(b.fees||0);
            const maxRev = Math.max(...active.map(x=>approved.filter(s=>String(s.batchId)===String(x.id)).length*(x.fees||0)),1);
            return (
              <div key={b.id} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:C.text, fontSize:12, fontWeight:600 }}>{b.name}</span>
                  <span style={{ color:C.gold, fontSize:12, fontWeight:800 }}>₹{rev.toLocaleString("en-IN")}</span>
                </div>
                <PBar value={Math.round(rev/maxRev*100)} color={C.gold} />
                <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>{bs} students · ₹{b.fees||0}/month</div>
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>📋 Board Distribution</h3>
          {approved.length===0 && <p style={{ color:C.textMuted, fontSize:13 }}>No students yet</p>}
          {[["CBSE",cbse,C.info],["State Board",state,C.warning],["ICSE",icse,C.success]].filter(([,c])=>c>0).map(([l,c,col])=>(
            <div key={l} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ color:C.text, fontSize:13, fontWeight:700 }}>{l}</span>
                <span style={{ color:col, fontWeight:800 }}>{c} ({Math.round(c/total*100)}%)</span>
              </div>
              <PBar value={Math.round(c/total*100)} color={col} />
            </div>
          ))}
          {approved.length>0 && !cbse && !state && !icse && <p style={{ color:C.textMuted, fontSize:12 }}>Board data not assigned yet</p>}
        </Card>

        <Card style={{ gridColumn:"1/-1" }}>
          <h3 style={{ color:C.text, margin:"0 0 14px", fontSize:15, fontWeight:800 }}>⚠️ Low Attendance (&lt;75%)</h3>
          {approved.filter(s=>(s.attendance||0)<75).length===0
            ? <p style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ All students have good attendance (75%+)</p>
            : approved.filter(s=>(s.attendance||0)<75).map(s=>(
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:`${C.danger}22`, display:"flex", alignItems:"center", justifyContent:"center", color:C.danger, fontWeight:800, fontSize:13 }}>
                  {s.name?.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{s.rollNo} · {s.batch||"—"}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:14, fontWeight:900, color:C.danger }}>{s.attendance||0}%</div>
                  <PBar value={s.attendance||0} color={C.danger} />
                </div>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// SECURITY LOG PAGE (Admin only)
// ============================================================
const SecurityLogPage = () => {
  const logs = JSON.parse(localStorage.getItem("sbc_seclog") || "[]");
  const typeColor = {
    ADMIN_LOGIN_SUCCESS:"success", STUDENT_LOGIN_SUCCESS:"success", TEACHER_LOGIN_SUCCESS:"success",
    ADMIN_FAIL:"danger", LOGIN_FAIL:"danger", BLOCKED:"danger",
    ADMIN_STEP1_OK:"warning", ADMIN_SECRET_FAIL:"danger",
    STUDENT_SIGNUP_COMPLETE:"info", TEACHER_SIGNUP_COMPLETE:"info",
    TEACHER_APPROVED:"success", STUDENT_APPROVED:"success",
    PASSWORD_RESET_SUCCESS:"warning",
  };
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <h2 style={{ color:C.text, margin:"0 0 4px", fontSize:22, fontWeight:900 }}>🔐 Security Log</h2>
          <p style={{ color:C.textMuted, fontSize:13, margin:0 }}>All login attempts and security events are logged here.</p>
        </div>
        <Badge text={logs.length + " events"} type="default" />
      </div>
      <Card style={{ padding:0 }}>
        {logs.length===0
          ? <div style={{ padding:40, textAlign:"center", color:C.textMuted }}>No logs found. Login events will appear here.</div>
          : [...logs].reverse().map((log,i) => (
            <div key={i} style={{ display:"flex", gap:14, padding:"13px 18px", borderBottom:`1px solid ${C.border}`, alignItems:"flex-start" }}>
              <Badge text={log.type?.replace(/_/g," ")||"EVENT"} type={typeColor[log.type]||"default"} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:C.text, fontWeight:600 }}>{log.detail||"—"}</div>
                <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{log.time||"—"}</div>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
};

// ============================================================
// SETTINGS PAGE (Admin)
// ============================================================
const SettingsPage = () => {
  const [contact, setContact] = useState(() => DB.get("contact") || { phone:"", email:"", address:"", whatsapp:"", mapLink:"" });
  const [ticker, setTicker]   = useState(() => DB.get("ticker")  || []);
  const [newTicker, setNewTicker] = useState("");
  const [saved, setSaved]     = useState("");
  const [upi, setUpi]         = useState(() => DB.get("upiSettings") || { upiId:"", name:"SBC Classes", amount:"" });

  const saveSection = (key) => {
    if (key==="contact") { DB.set("contact", contact); setSaved("contact"); setTimeout(()=>setSaved(""), 2000); toast("Contact settings saved!"); }
    if (key==="ticker")  { DB.set("ticker", ticker);   setSaved("ticker");  setTimeout(()=>setSaved(""), 2000); toast("Ticker saved!"); }
    if (key==="upi")     { DB.set("upiSettings", upi); setSaved("upi");     setTimeout(()=>setSaved(""), 2000); toast("UPI settings saved!"); }
  };

  const clearData = (key, label) => {
    DB.set(key, []);
    toast(label + " cleared!");
  };

  return (
    <div>
      <h2 style={{ color:C.text, margin:"0 0 20px", fontSize:22, fontWeight:900 }}>⚙️ Settings</h2>

      {/* CONTACT */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.info}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>📞 Contact & Location — Shown on Homepage</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="PHONE NUMBER"      value={contact.phone}    onChange={e=>setContact({...contact,phone:e.target.value})}    placeholder="9876543000" />
          <Input label="WHATSAPP NUMBER"   value={contact.whatsapp} onChange={e=>setContact({...contact,whatsapp:e.target.value})} placeholder="9876543000" />
          <Input label="EMAIL ADDRESS"     value={contact.email}    onChange={e=>setContact({...contact,email:e.target.value})}    placeholder="info@sbcclasses.in" />
          <Input label="FULL ADDRESS"      value={contact.address}  onChange={e=>setContact({...contact,address:e.target.value})}  placeholder="Main Road, City, MP" />
        </div>
        <div style={{ marginTop:12 }}>
          <label style={{ color:C.textMuted, fontSize:11, fontWeight:700, display:"block", marginBottom:7, letterSpacing:1 }}>GOOGLE MAPS EMBED LINK (optional)</label>
          <input value={contact.mapLink} onChange={e=>setContact({...contact,mapLink:e.target.value})} placeholder="https://www.google.com/maps/embed?..."
            style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:13, outline:"none", boxSizing:"border-box" }} />
          <div style={{ fontSize:11, color:C.textMuted, marginTop:5 }}>💡 Google Maps → Share → Embed map → Copy the src="..." URL</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <button onClick={()=>saveSection("contact")}
            style={{ padding:"11px 22px", borderRadius:11, border:"none", background:C.primary, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>
            💾 Save Contact
          </button>
          {saved==="contact" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* UPI SETTINGS */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.success}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>💰 UPI Payment Settings</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input label="UPI ID *" value={upi.upiId} onChange={e=>setUpi({...upi,upiId:e.target.value})} placeholder="yourname@upi" />
          <Input label="DISPLAY NAME" value={upi.name} onChange={e=>setUpi({...upi,name:e.target.value})} placeholder="SBC Classes" />
          <Input label="DEFAULT AMOUNT (₹)" value={upi.amount} onChange={e=>setUpi({...upi,amount:e.target.value})} placeholder="Leave blank for custom" type="number" />
        </div>
        <div style={{ marginTop:12, padding:"10px 14px", background:`${C.info}10`, borderRadius:10, fontSize:12, color:C.textMuted }}>
          💡 UPI ID set karne ke baad Fees page mein QR code automatically generate hoga
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <button onClick={()=>saveSection("upi")}
            style={{ padding:"11px 22px", borderRadius:11, border:"none", background:C.success, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>
            💾 Save UPI
          </button>
          {saved==="upi" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* TICKER */}
      <Card style={{ marginBottom:18, border:`1px solid ${C.warning}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 16px", fontSize:16, fontWeight:800 }}>📢 Ticker Bar Messages — Homepage scrolling banner</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
          {ticker.map((t,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:C.bgCard2, borderRadius:10 }}>
              <span style={{ flex:1, fontSize:13, color:C.text }}>📢 {t}</span>
              <button onClick={()=>setTicker(ticker.filter((_,j)=>j!==i))}
                style={{ background:"none", border:"none", color:C.danger, cursor:"pointer", fontSize:18 }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <input value={newTicker} onChange={e=>setNewTicker(e.target.value)} placeholder="New announcement message..."
            onKeyDown={e=>e.key==="Enter"&&newTicker.trim()&&(setTicker([...ticker,newTicker.trim()]),setNewTicker(""))}
            style={{ flex:1, padding:"11px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bgCard2, color:C.text, fontSize:14, outline:"none" }} />
          <button onClick={()=>{ if(newTicker.trim()){ setTicker([...ticker,newTicker.trim()]); setNewTicker(""); }}}
            style={{ padding:"11px 16px", borderRadius:10, border:`1px solid ${C.primary}44`, background:`${C.primary}12`, color:C.primary, fontWeight:700, cursor:"pointer" }}>+ Add</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:12 }}>
          <button onClick={()=>saveSection("ticker")}
            style={{ padding:"11px 22px", borderRadius:11, border:"none", background:C.warning, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>
            💾 Save Ticker
          </button>
          {saved==="ticker" && <span style={{ color:C.success, fontSize:13, fontWeight:700 }}>✅ Saved!</span>}
        </div>
      </Card>

      {/* DATA MANAGEMENT */}
      <Card style={{ border:`1px solid ${C.danger}33` }}>
        <h3 style={{ color:C.text, margin:"0 0 6px", fontSize:16, fontWeight:800 }}>🗂️ Data Management</h3>
        <p style={{ color:C.textMuted, fontSize:13, marginBottom:16 }}>Manage app stored data. These actions cannot be undone.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {[
            { key:"students",       label:"Clear Students",    icon:"🎓" },
            { key:"teachers",       label:"Clear Teachers",    icon:"👨‍🏫" },
            { key:"batches",        label:"Clear Batches",     icon:"📚" },
            { key:"liveClasses",    label:"Clear Classes",     icon:"📡" },
            { key:"classRecordings",label:"Clear Recordings",  icon:"🎬" },
            { key:"txnHistory",     label:"Clear Transactions", icon:"💰" },
            { key:"notices",        label:"Clear Notices",     icon:"📢" },
            { key:"alumni",         label:"Clear Alumni",      icon:"🏆" },
          ].map(item => (
            <button key={item.key} onClick={()=>clearData(item.key, item.label)}
              style={{ padding:"12px 14px", borderRadius:11, border:`1px solid ${C.danger}33`, background:`${C.danger}08`, color:C.danger, fontWeight:700, fontSize:13, cursor:"pointer", textAlign:"left", display:"flex", gap:8, alignItems:"center" }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop:14, padding:"12px 16px", background:`${C.danger}10`, border:`1px solid ${C.danger}33`, borderRadius:12 }}>
          <div style={{ fontWeight:800, color:C.danger, marginBottom:6 }}>⚠️ Full Reset</div>
          <p style={{ color:C.textMuted, fontSize:12, margin:"0 0 10px" }}>Delete ALL data — students, teachers, batches, classes, fees. This is irreversible!</p>
          <button onClick={()=>{
            ["students","teachers","batches","liveClasses","classRecordings","txnHistory","notices","alumni","offers","sbc_seclog","appCourses"].forEach(k=>DB.set(k,[]));
            localStorage.removeItem("sbc_demo_seeded");
            toast("Full reset done! Please refresh the page.", "warning");
          }} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.danger, color:"#fff", fontWeight:800, cursor:"pointer" }}>
            🗑️ Full Reset
          </button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// MAIN APP — Routing + Auth
// ============================================================

export default function App() {
   const screenSize = useScreenSize();
  const studentClass = useStudentClass();
   const [page, setPage]         = useState("landing");
   const [role, setRole]         = useState(null);
   const [user, setUser]         = useState(null);
   const [section, setSection]   = useState("dashboard");
   const [collapsed, setCollapsed] = useState(screenSize.isMobile);
  const [keySeq, setKeySeq]     = useState([]);
  // Auto-approve + DB init
  useEffect(() => {
    initDB();
    const checkAutoApprove = () => {
      const students = DB.get("students") || [];
      const now = Date.now();
      let changed = false;
      let rollCounter = students.filter(x=>x.rollNo?.startsWith("SBC")).length;
      const updated = students.map(s => {
        if (s.status==="Pending Approval" && s.autoApproveAt && now >= s.autoApproveAt) {
          rollCounter++;
          changed = true;
          const rollNo = s.rollNo || ("SBC" + String(rollCounter).padStart(5,"0"));
          return { ...s, status:"approved", rollNo, autoApprovedAt:now };
        }
        return s;
      });
      if (changed) DB.set("students", updated);
    };
    checkAutoApprove();
    const iv = setInterval(checkAutoApprove, 30000);
    return () => clearInterval(iv);
  }, []);

  // Secret admin keyboard shortcut
  useEffect(() => {
    const handleKey = (e) => {
      const newSeq = [...keySeq, e.key].slice(-8);
      setKeySeq(newSeq);
      if (newSeq.join("") === "SBCADMIN") {
        setPage("adminPortal");
        setKeySeq([]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [keySeq]);

  // URL hash #sbc-admin
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#sbc-admin") {
        window.location.hash = "";
        setPage("adminPortal");
      }
      if (window.location.hash === "#teacher-login") {
        window.location.hash = "";
        setAllowTeacherLogin(true);
        setPage("login");
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Session restore
  useEffect(() => {
    const session = SEC.getSession();
    if (session && session.role && session.user) {
      setRole(session.role);
      setUser(session.user);
      setSection(session.role === "admin" ? "dashboard" : "home");
      setPage("app");
    }
  }, []);

  const [onboardingRole, setOnboardingRole] = useState('student');
  const [allowTeacherLogin, setAllowTeacherLogin] = useState(false);

  // Inactivity logout (30 min)
  useEffect(() => {
    if (!user) return;
    let timer;
    const reset = () => { clearTimeout(timer); timer = setTimeout(()=>handleLogout("session_expired"), 30*60*1000); };
    ["mousemove","keydown","click","touchstart"].forEach(e=>window.addEventListener(e, reset));
    reset();
    return () => { clearTimeout(timer); ["mousemove","keydown","click","touchstart"].forEach(e=>window.removeEventListener(e, reset)); };
  }, [user]);

  const handleLogin = (r, u) => {
    // JWT (token) was already stored by the LoginPage via authStore.setToken().
    // Mirror to legacy session keys for any old code that still reads them.
    try {
      localStorage.setItem("sbc_session", JSON.stringify({
        token: localStorage.getItem("sbc_token"), role: r, user: u, createdAt: Date.now(),
      }));
    } catch (_) { /* noop */ }
    // Merge any onboarding choices (saved pre-login) into the user profile so
    // downstream code can filter content based on it.
    let onboard = null;
    try { onboard = JSON.parse(localStorage.getItem('sbc_onboarding')); } catch (_) { onboard = null; }
    const mergedUser = onboard ? { ...(u||{}), onboarding: onboard } : (u||{});
    try { localStorage.setItem('sbc_user', JSON.stringify(mergedUser)); } catch (_) {}
    setRole(r); setUser(mergedUser);
    // Fetch server-side profile (async) and merge onboarding if present
    (async () => {
      try {
        const resp = await profileAPI.me();
        const profile = resp?.data || resp || null;
        const onboardingFromProfile = profile?.onboarding || null;
        if (onboardingFromProfile) {
          const merged = { ...(mergedUser||{}), onboarding: onboardingFromProfile };
          try { localStorage.setItem('sbc_user', JSON.stringify(merged)); } catch (_) {}
          setUser(merged);
        }
      } catch (_) { /* ignore profile fetch errors */ }
    })();
    // Reset temporary teacher-login allowance after a login attempt
    setAllowTeacherLogin(false);
    // Students and teachers start at home page; admins start at dashboard.
    setSection(r === "admin" ? "dashboard" : "home");
    setPage("app");
  };

  const handleLogout = (reason) => {
    try {
      localStorage.removeItem("sbc_session");
      localStorage.removeItem("sbc_token");
      localStorage.removeItem("sbc_user");
    } catch (_) { /* noop */ }
    setRole(null); setUser(null); setPage("landing"); setSection("dashboard");
    if (reason === "session_expired") toast("Session expired. Please login again.", "warning");
  };

  // ── Allowed routes per role (declared once so we can also use them in
  //    a useEffect that snaps the user back to a safe section if `section`
  //    is somehow invalid — never call setSection() during render). ──
  const ADMIN_SECTIONS   = ["home","dashboard","liveClass","content","recordings","courses","batches","students","teachers","fees","schedule","offers","features","alumni","notices","plans","subscription","student-subscriptions","teacher-payments","reports","seclog","settings"];
  const TEACHER_SECTIONS = ["home","dashboard","liveClass","recordings","myBatches","students","attendance","schedule","notices","profile","fees","subscription"];
  const STUDENT_SECTIONS = ["home","dashboard","liveClass","courses","myBatch","schedule","attendance","fees","notices","subscription","profile"];

  // Snap to a safe section if the current one isn't allowed for the role.
  // Doing this inside useEffect avoids "Cannot update a component while
  // rendering" warnings and the brief layout flicker that came with it.
  useEffect(() => {
    if (!role) return;
    const allowed =
      role === "admin"   ? ADMIN_SECTIONS   :
      role === "teacher" ? TEACHER_SECTIONS :
      role === "student" ? STUDENT_SECTIONS : [];
    if (allowed.length && !allowed.includes(section)) {
      setSection(role === "admin" ? "dashboard" : "home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, section]);

  // Render section for the current role
  const renderSection = () => {
    if (section === "home") {
      // All roles see main Landing Page when on Home
      return (
        <div style={{ margin:"-28px", minHeight:"100vh" }}>
          <LandingPage
            onLogin={()=>{}}
            onDashboard={()=>setSection("dashboard")}
            onProfile={()=>setSection("profile")}
            currentUser={user}
            role={role}
          />
        </div>
      );
    }

    if (role === "admin") {
      switch (section) {
        case "dashboard":    return <AdminDashboard onNavigate={setSection} />;
        case "liveClass":    return <LiveClassSystem role="admin" />;
        case "content":      return <AdminContentHub onNavigate={setSection} />;
        case "recordings":   return <AdminContentHub onNavigate={setSection} />;
        case "courses":      return <AdminContentHub onNavigate={setSection} />;
        case "batches":      return <BatchesManager />;
        case "students":     return <StudentsManager role="admin" />;
        case "teachers":     return <TeachersManager />;
        case "fees":         return <FeesPage role="admin" currentUser={user} />;
        case "schedule":     return <SchedulePage />;
        case "offers":       return <OffersManager />;
        case "features":     return <FeaturesManager />;
        case "alumni":       return <AlumniManager />;
        case "notices":      return <NoticesPage role="admin" />;
        // Plan CRUD UI — admin creates/edits/deletes subscription plans here.
        // Uses real /api/plans (Mongoose) so changes show up for students immediately.
        case "plans":        return <AdminPlansManager />;
        case "subscription": return <AdminPaymentDashboard C={C} RES={RES} Btn={Btn} Card={Card} Badge={Badge} useScreenSize={useScreenSize} Modal={Modal} />;
        case "student-subscriptions": return <AdminStudentManager C={C} RES={RES} Btn={Btn} Card={Card} Badge={Badge} useScreenSize={useScreenSize} Modal={Modal} />;
        case "teacher-payments": return <TeacherPaymentDashboard C={C} RES={RES} Btn={Btn} Card={Card} Badge={Badge} useScreenSize={useScreenSize} Modal={Modal} />;
        case "reports":      return <ReportsPage />;
        case "seclog":       return <SecurityLogPage />;
        case "settings":     return <SettingsPage />;
        default:             return <AdminDashboard onNavigate={setSection} />;
      }
    }

    if (role === "teacher") {
      switch (section) {
        case "home":         return <TeacherHomePage currentUser={user} onNavigate={setSection} />;
        case "dashboard":    return <TeacherDashboard currentUser={user} onNavigate={setSection} />;
        case "liveClass":    return <LiveClassSystem role="teacher" currentUser={user} />;
        case "recordings":   return <RecordingsManager role="teacher" currentUser={user} />;
        case "myBatches":    return <TeacherBatchView currentUser={user} />;
        case "students":     return <StudentsManager role="teacher" />;
        case "attendance":   return <AttendancePage role="teacher" currentUser={user} />;
        case "schedule":     return <SchedulePage />;
        case "notices":      return <NoticesPage role="teacher" />;
        // Teachers can also view fees & their subscription (previously fell
        // through to TeacherDashboard which was a silent dead end).
        case "fees":         return <FeesPage role="teacher" currentUser={user} />;
        case "subscription": return <StudentSubscriptionPage currentUser={user} />;
        case "profile":      return <div style={{padding:"60px 16px 80px"}}><ProfilePage role="teacher" user={user} onLogout={()=>handleLogout("manual")} onNavigate={setSection} /></div>;
        default:             return <TeacherDashboard currentUser={user} onNavigate={setSection} />;
      }
    }

    if (role === "student") {
      switch (section) {
        case "home":         return <StudentHomePage currentUser={user} onNavigate={setSection} />;
        case "dashboard":    return <StudentDashboard currentUser={user} />;
        case "liveClass":    return <LiveClassSystem role="student" currentUser={user} />;
        case "courses":      return <StudentCoursesPage currentUser={user} />;
        case "myBatch":      return <SchedulePage />;
        case "schedule":     return <SchedulePage />;
        case "attendance":   return <AttendancePage role="student" currentUser={user} />;
        case "fees":         return <FeesPage role="student" currentUser={user} />;
        case "notices":      return <NoticesPage role="student" />;
        case "subscription": return <StudentSubscriptionPage currentUser={user} />;
        case "profile":      return <div style={{padding:"60px 16px 80px"}}><ProfilePage role="student" user={user} onLogout={()=>handleLogout("manual")} onNavigate={setSection} /></div>;
        default:             return <StudentHomePage currentUser={user} onNavigate={setSection} />;
      }
    }
    handleLogout("unauthorized");
    return null;
  };

  // ── Page router ──
  // Paytm redirect lands at /payment-result?status=…&orderId=…
  if (typeof window !== "undefined" && window.location.pathname === "/payment-result") {
    return <PaymentResult />;
  }

  if (page === "landing") {
    const openOnboarding = (r) => { setOnboardingRole(r || 'student'); setPage('onboarding'); };
    return <LandingPage
      onLogin={() => setPage('login')}
      onSignup={openOnboarding}
      onDashboard={user ? ()=>setPage("app") : ()=>setPage("login")}
      currentUser={user}
      role={role}
    />;
  }

  if (page === 'onboarding') {
    return <Onboarding role={onboardingRole} onFinish={() => { setAllowTeacherLogin(false); setPage('login'); }} onCancel={() => setPage('landing')} />;
  }

  if (page === "login") {
    return <LoginPage
      defaultRole="student"
      allowTeacher={allowTeacherLogin}
      onLogin={handleLogin}
      onBack={()=>setPage("landing")}
      onAdminPortal={()=>setPage("adminPortal")}
      addNotification={addNotification}
    />;
  }

  if (page === "adminPortal") {
    return <AdminSecretPortal
      onAdminLogin={(adminUser)=>{
        const u = adminUser || { name: "Admin", role: "admin", id: "admin" };
        handleLogin("admin", u);
      }}
      onBack={()=>setPage("landing")}
    />;
  }

  // ── Not logged in but page="app" ──
  if (!role || !user) {
    return <LoginPage
      defaultRole="student"
      allowTeacher={allowTeacherLogin}
      onLogin={handleLogin}
      onBack={()=>setPage("landing")}
      onAdminPortal={()=>setPage("adminPortal")}
      addNotification={addNotification}
    />;
  }

  // ── Main App ──
  // ALWAYS show BottomNav for all roles on all devices
  const showBottomNav = role === "teacher" || role === "student";
  
  if (role === "admin") return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI','Noto Sans Devanagari',sans-serif", color:C.text }}>
      <ToastContainer />
      <AdminSidebar active={section} setActive={setSection} onLogout={()=>handleLogout("manual")} collapsed={collapsed} setCollapsed={setCollapsed} onHome={()=>setSection("home")} />
      <main style={{ 
        flex:1, 
        padding: screenSize.isMobile ? "14px 12px" : screenSize.isTablet ? "16px 18px" : "20px 24px",
        overflowY:"auto", 
        minWidth:0, 
        maxWidth:"100%",
        fontSize: RES.fontMd,
        paddingBottom: screenSize.isMobile ? "80px" : "24px"
      }}>
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16, gap:10, alignItems:"center", flexWrap: screenSize.isMobile ? "wrap" : "nowrap" }}>
          <Badge text="🔐 Secure Session" type="success" />
          <Badge text="Admin / Owner" type="danger" />
          <button onClick={()=>handleLogout("manual")} style={{ padding:"7px 14px", borderRadius:9, border:`1px solid ${C.danger}44`, background:`${C.danger}12`, color:C.danger, fontSize: screenSize.isMobile ? "10px" : "12px", fontWeight:700, cursor:"pointer" }}>Logout</button>
        </div>
        {renderSection()}
      </main>
      {/* Bottom Nav for Admin on Mobile */}
      {screenSize.isMobile && <BottomNav role="admin" active={section} setActive={setSection} user={user} onLogout={()=>handleLogout("manual")} />}
    </div>
  );

  // Teacher + Student — Bottom Nav Layout (ALL DEVICES)
  const mainPadding = section==="home" ? (screenSize.isMobile ? "0 0 max(60px, calc(60px + env(safe-area-inset-bottom)))" : "0 0 80px") : screenSize.isMobile ? "60px 12px max(80px, calc(80px + env(safe-area-inset-bottom)))" : "70px 20px 100px";
  const maxContentWidth = section==="home" ? "100%" : screenSize.isMobile ? "100%" : screenSize.isTablet ? "90%" : "720px";
  
  // NOTE: `return` MUST be on the same line as `(` — JS automatic-semicolon-insertion
  // will otherwise turn `return\n(...)` into `return undefined;` and the whole
  // student/teacher layout will silently render nothing (this was the "navbar
  // disappears" bug).
  return (
    <>
      <ToastContainer />
      <BottomNav role={role} active={section} setActive={setSection} user={user} onLogout={()=>handleLogout("manual")} />
      <main style={{ 
        padding: mainPadding,
        minHeight:"100vh", 
        maxWidth: maxContentWidth, 
        margin:"0 auto", 
        boxSizing:"border-box", 
        width:"100%",
        fontSize: RES.fontMd,
        overflow:"hidden"
      }}>
        {renderSection()}
      </main>
    </>     
  );
}
