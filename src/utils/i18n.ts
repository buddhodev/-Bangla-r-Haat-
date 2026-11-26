import { Language } from '../types';

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BENGALI_DIGITS[Number(d)] ?? d);
}

export function formatLocalizedNumber(input: string | number, lang: Language): string {
  return lang === 'bn' ? toBengaliDigits(input) : String(input);
}

export function downloadCsvWithBom(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const LABELS = {
  brand: {
    bn: 'বাংলার হাট',
    en: 'Banglaar Haat',
  },
  campusRibbon: {
    bn: 'বঙ্গাব্দ ১৪৩৩ · আইআইটি ইন্দোর বাঙালি সাংস্কৃতিক গোষ্ঠী · সিমরোল ক্যাম্পাস',
    en: 'Bengali Year 1433 · Bengali Cultural Community of IIT Indore · Simrol Campus',
  },
  nav: {
    home: { bn: 'প্রচ্ছদ', en: 'Home' },
    events: { bn: 'উৎসব', en: 'Events' },
    members: { bn: 'দলবল', en: 'Members' },
    gallery: { bn: 'গ্যালারি', en: 'Gallery' },
    admin: { bn: 'প্রশাসন', en: 'Admin' },
  },
  auth: {
    signIn: { bn: 'প্রবেশ করুন', en: 'Sign In' },
    signOut: { bn: 'প্রস্থান', en: 'Sign Out' },
    adminTag: { bn: 'কমিটি প্রশাসক', en: 'Committee Admin' },
    memberTag: { bn: 'সদস্য', en: 'Member' },
  },
  categories: {
    all: { bn: 'সব উৎসব', en: 'All Festivals' },
    pujo: { bn: 'পূজা পার্বণ', en: 'Traditional Pujo' },
    food: { bn: 'খাদ্য উৎসব', en: 'Food Festival' },
    cultural: { bn: 'সাংস্কৃতিক আড্ডা', en: 'Cultural Adda' },
  },
  galleryCategories: {
    all: { bn: 'সমগ্র সংকলন', en: 'Full Archive' },
    kali_pujo: { bn: 'শ্যামা পূজা', en: 'Kali Pujo' },
    fanush_lights: { bn: 'ফানুস ও দীপাবলি', en: 'Fanush & Dipaboli' },
    pratima_jatra: { bn: 'প্রতিমা যাত্রা', en: 'Pratima Jatra' },
    durga_saraswati: { bn: 'দুর্গা ও সরস্বতী পূজা', en: 'Durga & Saraswati' },
    food_fest: { bn: 'বাংলার রসনা', en: 'Bengali Food Fest' },
  },
  foodPrefs: {
    veg_bhog: { bn: 'নিরামিষ ভোগ প্রসাদ', en: 'Vegetarian Bhog Prasad' },
    nonveg_feast: { bn: 'আমিষ বাঙালি ভোজ', en: 'Non-Veg Bengali Feast' },
    both: { bn: 'ভোগ ও ভোজ উভয়ই', en: 'Both Bhog & Feast' },
  },
  volunteerRoles: {
    attendee: { bn: 'অতিথি ও অংশগ্রহণকারী', en: 'Attendee' },
    pujo_setup: { bn: 'পূজা ও মণ্ডপ ব্যবস্থাপনা', en: 'Pujo & Pandal Setup' },
    bhog_seva: { bn: 'ভোগ রন্ধন ও পরিবেশন', en: 'Bhog Seva & Distribution' },
    cultural_program: { bn: 'সাংস্কৃতিক অনুষ্ঠান (গান/আবৃত্তি)', en: 'Cultural Program' },
    alpana_decor: { bn: 'আলপনা ও শোলার সাজসজ্জা', en: 'Alpana & Decor' },
  },
  attendanceStatuses: {
    registered: { bn: 'নিবন্ধিত', en: 'Registered' },
    present: { bn: 'উপস্থিত', en: 'Present' },
    absent: { bn: 'অনুপস্থিত', en: 'Absent' },
    cancelled: { bn: 'বাতিল', en: 'Cancelled' },
  },
  membershipStatuses: {
    active: { bn: 'সক্রিয় সদস্য', en: 'Active' },
    pending: { bn: 'অনুমোদনের অপেক্ষায়', en: 'Pending' },
    alumni: { bn: 'প্রাক্তনী', en: 'Alumni' },
  },
  chandaStatuses: {
    paid: { bn: 'পরিশোধিত', en: 'Paid' },
    pending: { bn: 'বাকি আছে', en: 'Pending' },
    exempt: { bn: 'অব্যাহতিপ্রাপ্ত', en: 'Exempt' },
  },
  committeeTiers: {
    all: { bn: 'সকল সদস্য', en: 'All Members' },
    committee: { bn: 'পরিচালনা কমিটি', en: 'Executive Committee' },
    member: { bn: 'সাধারণ সদস্য', en: 'Campus Members' },
    faculty: { bn: 'অধ্যাপক মণ্ডলী', en: 'Faculty Advisors' },
    alumni: { bn: 'প্রাক্তনী', en: 'Alumni' },
  },
} as const;
