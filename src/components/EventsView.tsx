import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { Check, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CulturalEvent,
  EventCategory,
  EventRegistration,
  FoodPreference,
  Language,
  VolunteerRole,
  generatePassCode,
  sanitizeText,
} from '../types';
import { formatLocalizedNumber, LABELS } from '../utils/i18n';
import { AlpanaDivider, AlpanaLotusMark } from './AlpanaMotifs';
import { SafeImage } from './SafeImage';

interface EventsViewProps {
  lang: Language;
  events: CulturalEvent[];
  user: User | null;
  myRegistrations: Record<string, EventRegistration>;
  isSeedMode: boolean;
  preselectedEvent: CulturalEvent | null;
  onClearPreselectedEvent: () => void;
  onSignIn: () => void;
  onRegistrationUpdated: (eventId: string, reg: EventRegistration) => void;
}

export function EventsView({
  lang,
  events,
  user,
  myRegistrations,
  isSeedMode,
  preselectedEvent,
  onClearPreselectedEvent,
  onSignIn,
  onRegistrationUpdated,
}: EventsViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | EventCategory>('all');
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [viewingPassEvent, setViewingPassEvent] = useState<CulturalEvent | null>(null);

  // Registration form fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [hostel, setHostel] = useState('APJ Kalam Hall');
  const [phone, setPhone] = useState('');
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('veg_bhog');
  const [guestCount, setGuestCount] = useState(0);
  const [volunteerRole, setVolunteerRole] = useState<VolunteerRole>('attendee');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedEvent) {
      setSelectedEvent(preselectedEvent);
      onClearPreselectedEvent();
    }
  }, [preselectedEvent, onClearPreselectedEvent]);

  useEffect(() => {
    if (user && selectedEvent) {
      setFullName((prev) => prev || user.displayName || '');
    }
  }, [user, selectedEvent]);

  const filteredEvents =
    categoryFilter === 'all'
      ? events
      : events.filter((e) => e.category === categoryFilter);

  const handleOpenRegistration = (ev: CulturalEvent) => {
    setFormError('');
    const existing = myRegistrations[ev.id];
    if (existing && existing.attendanceStatus !== 'cancelled') {
      setViewingPassEvent(ev);
      return;
    }
    setSelectedEvent(ev);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    if (!user) {
      onSignIn();
      return;
    }
    if (isSeedMode) {
      setFormError(
        lang === 'bn'
          ? 'কমিটি প্রশাসক প্রথমবার ডাটাবেস যুক্ত করলে সরাসরি নিবন্ধন চালু হবে।'
          : 'Live registration opens as soon as a committee admin initializes the festival database.'
      );
      return;
    }

    const cleanName = sanitizeText(fullName, 120);
    const cleanRoll = sanitizeText(rollNumber, 40);
    const cleanDept = sanitizeText(department, 80);
    const cleanHostel = sanitizeText(hostel, 80);
    const cleanPhone = sanitizeText(phone, 24);
    const cleanEmail = sanitizeText(user.email || '', 160);

    if (cleanName.length < 2 || cleanRoll.length < 2 || cleanPhone.length < 6) {
      setFormError(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক নাম, রোল/আইডি নম্বর এবং ফোন নম্বর প্রদান করুন।'
          : 'Please enter a valid full name, IIT Indore roll/ID number, and phone number.'
      );
      return;
    }

    setSubmitting(true);
    setFormError('');

    const passCode = generatePassCode(selectedEvent.id);
    const regRef = doc(db, 'events', selectedEvent.id, 'registrations', user.uid);
    const eventRef = doc(db, 'events', selectedEvent.id);
    const newCount = Math.min(selectedEvent.capacity, (selectedEvent.registeredCount || 0) + 1);

    const payload = {
      eventId: selectedEvent.id,
      userId: user.uid,
      fullName: cleanName,
      rollNumber: cleanRoll,
      department: cleanDept,
      hostel: cleanHostel,
      phone: cleanPhone,
      email: cleanEmail,
      foodPreference,
      guestCount: Math.max(0, Math.min(5, Number(guestCount) || 0)),
      volunteerRole,
      attendanceStatus: 'registered' as const,
      passCode,
      isWalkIn: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(regRef, payload);
      batch.update(eventRef, {
        registeredCount: newCount,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();

      onRegistrationUpdated(selectedEvent.id, {
        id: user.uid,
        ...payload,
        createdAt: null,
        updatedAt: null,
      });
      const registeredEv = selectedEvent;
      setSelectedEvent(null);
      setViewingPassEvent(registeredEv);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        handleFirestoreError(err, OperationType.CREATE, `events/${selectedEvent.id}/registrations/${user.uid}`);
      }
      setFormError(
        lang === 'bn'
          ? 'নিবন্ধন সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।'
          : 'Could not save registration. Please verify details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async (ev: CulturalEvent) => {
    if (!user || isSeedMode) return;
    const existing = myRegistrations[ev.id];
    if (!existing || existing.attendanceStatus !== 'registered') return;

    setCancellingId(ev.id);
    try {
      const regRef = doc(db, 'events', ev.id, 'registrations', user.uid);
      const eventRef = doc(db, 'events', ev.id);
      const batch = writeBatch(db);
      batch.update(regRef, {
        attendanceStatus: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      batch.update(eventRef, {
        registeredCount: Math.max(0, (ev.registeredCount || 1) - 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      onRegistrationUpdated(ev.id, {
        ...existing,
        attendanceStatus: 'cancelled',
      });
      setViewingPassEvent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${ev.id}/registrations/${user.uid}`);
    } finally {
      setCancellingId(null);
    }
  };

  const filterTabs: { id: 'all' | EventCategory; label: string }[] = [
    { id: 'all', label: LABELS.categories.all[lang] },
    { id: 'pujo', label: LABELS.categories.pujo[lang] },
    { id: 'food', label: LABELS.categories.food[lang] },
    { id: 'cultural', label: LABELS.categories.cultural[lang] },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E4DACB]">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#A61C24] mb-2">
            {lang === 'bn' ? 'উৎসব পঞ্জিকা ও নিবন্ধন · বঙ্গাব্দ ১৪৩৩' : 'Festival Calendar & Registration · 2026–27'}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1714]">
            {lang === 'bn' ? 'বাংলার হাট উৎসবসমূহ' : 'Banglaar Haat Festivities & Food Fests'}
          </h1>
          <p className="text-sm text-[#5C524A] mt-2 max-w-2xl">
            {lang === 'bn'
              ? 'দুর্গাপূজা, লক্ষ্মী পূজা, শ্যামা পূজা, সরস্বতী পূজা এবং বাঙালি খাদ্য উৎসবে অংশগ্রহণ ও ভোগ প্রসাদের জন্য অনলাইনে নাম নথিভুক্ত করুন।'
              : 'Reserve your seat for Pushpanjali, Ashtami & Shyama Bhog Prasad, cultural evenings, and Bengali culinary festivals at IIT Indore.'}
          </p>
        </div>

        {/* Segmented Category Filter Tabs */}
        <div className="inline-flex items-center p-1 bg-[#EFE8DC] border border-[#E4DACB] self-start md:self-auto overflow-x-auto max-w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-white text-[#A61C24] shadow-xs'
                  : 'text-[#5C524A] hover:text-[#1C1714]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center border-b border-[#E4DACB]">
          <AlpanaLotusMark className="w-10 h-10 text-[#A61C24]/70 mx-auto mb-3" />
          <p className="text-sm text-[#5C524A]">
            {lang === 'bn'
              ? 'এই বিভাগে বর্তমানে কোনো অনুষ্ঠান নথিভুক্ত নেই।'
              : 'No events are currently scheduled in this category.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E4DACB]">
          {filteredEvents.map((ev, index) => {
            const myReg = myRegistrations[ev.id];
            const isRegistered = myReg && myReg.attendanceStatus !== 'cancelled';
            const fillPct = Math.min(100, Math.round(((ev.registeredCount || 0) / Math.max(1, ev.capacity)) * 100));
            const spotsLeft = Math.max(0, ev.capacity - (ev.registeredCount || 0));

            return (
              <article
                key={ev.id}
                className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-5">
                  <div className="aspect-[4/3] overflow-hidden border border-[#E4DACB] bg-[#1C1714]">
                    <SafeImage
                      src={ev.imageUrl}
                      alt={lang === 'bn' ? ev.titleBn : ev.titleEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="lg:col-span-7 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7D6E61] mb-2">
                      <span className="font-semibold text-[#A61C24] tabular-nums-bengali">
                        {formatLocalizedNumber(String(index + 1).padStart(2, '0'), lang)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{LABELS.categories[ev.category][lang]}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lang === 'bn' ? ev.dateBn : ev.dateEn}</span>
                      <span aria-hidden="true">·</span>
                      <span>{lang === 'bn' ? ev.timeBn : ev.timeEn}</span>
                    </div>

                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1714] mb-3">
                      {lang === 'bn' ? ev.titleBn : ev.titleEn}
                    </h2>

                    <p className="text-[15px] leading-relaxed text-[#4A4038] mb-5">
                      {lang === 'bn' ? ev.descriptionBn : ev.descriptionEn}
                    </p>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#ECE4D7] text-sm mb-6">
                      <div>
                        <dt className="text-xs text-[#7D6E61] mb-0.5">
                          {lang === 'bn' ? 'স্থান' : 'Campus Venue'}
                        </dt>
                        <dd className="font-medium text-[#1C1714]">
                          {lang === 'bn' ? ev.venueBn : ev.venueEn}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#7D6E61] mb-0.5">
                          {lang === 'bn' ? 'ভোগ প্রসাদ ও ভোজের তালিকা' : 'Bhog Prasad & Menu'}
                        </dt>
                        <dd className="font-medium text-[#1C1714]">
                          {lang === 'bn' ? ev.bhogMenuBn : ev.bhogMenuEn}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Seat capacity & Primary Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex items-center justify-between text-xs text-[#5C524A] mb-1.5 tabular-nums-bengali">
                        <span>
                          {lang === 'bn'
                            ? `নিবন্ধিত: ${formatLocalizedNumber(ev.registeredCount, 'bn')} / ${formatLocalizedNumber(ev.capacity, 'bn')}`
                            : `Registered: ${ev.registeredCount} / ${ev.capacity}`}
                        </span>
                        <span>
                          {lang === 'bn'
                            ? `বাকি ${formatLocalizedNumber(spotsLeft, 'bn')} আসন`
                            : `${spotsLeft} left`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E9E1D4] overflow-hidden">
                        <div
                          className="h-full bg-[#A61C24] transition-all duration-300"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isRegistered ? (
                        <button
                          type="button"
                          onClick={() => setViewingPassEvent(ev)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C1714] text-white text-sm font-medium hover:bg-[#332B26] transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>{lang === 'bn' ? 'নিবন্ধন পত্র দেখুন' : 'View Pass'}</span>
                        </button>
                      ) : ev.status === 'open' && spotsLeft > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRegistration(ev)}
                          className="px-5 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {lang === 'bn' ? 'উৎসবে নিবন্ধন করুন' : 'Register Now'}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-[#7D6E61] border border-[#D8CCB9] px-4 py-2">
                          {ev.status === 'completed'
                            ? lang === 'bn'
                              ? 'অনুষ্ঠান সম্পন্ন'
                              : 'Completed'
                            : lang === 'bn'
                              ? 'নিবন্ধন বন্ধ'
                              : 'Registration Closed'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Event Registration Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reg-modal-title"
        >
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-xl my-8">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#E4DACB] bg-white">
              <div>
                <p className="text-xs text-[#A61C24] font-medium mb-1">
                  {lang === 'bn' ? 'অনলাইন উৎসব নিবন্ধন' : 'Festival Registration'}
                </p>
                <h3 id="reg-modal-title" className="font-editorial text-2xl font-bold text-[#1C1714]">
                  {lang === 'bn' ? selectedEvent.titleBn : selectedEvent.titleEn}
                </h3>
                <p className="text-xs text-[#6E6054] mt-1">
                  {lang === 'bn' ? selectedEvent.dateBn : selectedEvent.dateEn} ·{' '}
                  {lang === 'bn' ? selectedEvent.venueBn : selectedEvent.venueEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close registration modal"
                className="p-1.5 text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!user ? (
              <div className="p-8 text-center">
                <AlpanaLotusMark className="w-12 h-12 text-[#A61C24] mx-auto mb-4" />
                <h4 className="font-editorial text-xl font-semibold text-[#1C1714] mb-2">
                  {lang === 'bn' ? 'নিবন্ধনের জন্য প্রবেশ করুন' : 'Sign In to Register'}
                </h4>
                <p className="text-sm text-[#5C524A] mb-6 max-w-sm mx-auto">
                  {lang === 'bn'
                    ? 'আপনার গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করলে সরাসরি নিবন্ধন পত্র ও ভোগের আসন সংরক্ষিত হবে।'
                    : 'Sign in with your Google account to confirm your seat and receive your digital registration pass.'}
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="px-6 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors cursor-pointer"
                >
                  {lang === 'bn' ? 'গুগল দিয়ে প্রবেশ করুন' : 'Sign In with Google'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRegistration} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-[#A61C24]/10 border border-[#A61C24]/30 text-xs text-[#88151C]">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'আইআইটি ইন্দোর রোল / আইডি *' : 'IIT Indore Roll / ID *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      placeholder={lang === 'bn' ? 'যেমন: CSE240001025' : 'e.g., CSE240001025'}
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'বিভাগ (Department) *' : 'Department *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'হোস্টেল / আবাসন *' : 'Hostel / Residence *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'ফোন নম্বর *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      placeholder="+91 98XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'অতিরিক্ত অতিথি সংখ্যা (০–৫)' : 'Additional Guests (0–5)'}
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    >
                      {[0, 1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {formatLocalizedNumber(n, lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'ভোগ ও খাবারের পছন্দ' : 'Bhog / Meal Preference'}
                    </label>
                    <select
                      value={foodPreference}
                      onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    >
                      <option value="veg_bhog">{LABELS.foodPrefs.veg_bhog[lang]}</option>
                      <option value="nonveg_feast">{LABELS.foodPrefs.nonveg_feast[lang]}</option>
                      <option value="both">{LABELS.foodPrefs.both[lang]}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'স্বেচ্ছাসেবক ভূমিকা' : 'Volunteer Role'}
                    </label>
                    <select
                      value={volunteerRole}
                      onChange={(e) => setVolunteerRole(e.target.value as VolunteerRole)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
                    >
                      <option value="attendee">{LABELS.volunteerRoles.attendee[lang]}</option>
                      <option value="pujo_setup">{LABELS.volunteerRoles.pujo_setup[lang]}</option>
                      <option value="bhog_seva">{LABELS.volunteerRoles.bhog_seva[lang]}</option>
                      <option value="cultural_program">{LABELS.volunteerRoles.cultural_program[lang]}</option>
                      <option value="alpana_decor">{LABELS.volunteerRoles.alpana_decor[lang]}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4DACB] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 text-sm text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting
                      ? lang === 'bn'
                        ? 'সংরক্ষণ হচ্ছে...'
                        : 'Saving...'
                      : lang === 'bn'
                        ? 'নিবন্ধন নিশ্চিত করুন'
                        : 'Confirm Registration'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Digital Registration Pass Modal (নিবন্ধন পত্র) */}
      {viewingPassEvent && myRegistrations[viewingPassEvent.id] && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-[#D8CCB9] w-full max-w-md p-7">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <AlpanaLotusMark className="w-8 h-8 text-[#A61C24]" />
                <div>
                  <p className="text-[11px] text-[#A61C24] font-semibold">
                    {lang === 'bn' ? 'বাংলার হাট · নিবন্ধন পত্র' : 'Banglaar Haat · Entry Pass'}
                  </p>
                  <h3 className="font-editorial text-xl font-bold text-[#1C1714]">
                    {lang === 'bn' ? viewingPassEvent.titleBn : viewingPassEvent.titleEn}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingPassEvent(null)}
                aria-label="Close pass"
                className="p-1 text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AlpanaDivider className="my-4" />

            {(() => {
              const reg = myRegistrations[viewingPassEvent.id];
              return (
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b border-[#F0E9DE]">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'পাস নম্বর' : 'Pass Code'}</dt>
                    <dd className="font-mono font-bold text-[#A61C24] tracking-wider">
                      {formatLocalizedNumber(reg.passCode, lang)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0E9DE]">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'নাম' : 'Attendee'}</dt>
                    <dd className="font-medium text-[#1C1714]">{reg.fullName}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0E9DE]">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'রোল / আইডি' : 'Roll / ID'}</dt>
                    <dd className="text-[#1C1714]">{reg.rollNumber}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0E9DE]">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'ভোগ / ভোজ' : 'Meal'}</dt>
                    <dd className="text-[#1C1714]">{LABELS.foodPrefs[reg.foodPreference][lang]}</dd>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F0E9DE]">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'অতিরিক্ত অতিথি' : 'Guests'}</dt>
                    <dd className="text-[#1C1714] tabular-nums-bengali">
                      {formatLocalizedNumber(reg.guestCount, lang)}
                    </dd>
                  </div>
                  <div className="flex justify-between py-1">
                    <dt className="text-[#6E6054]">{lang === 'bn' ? 'উপস্থিতির স্থিতি' : 'Status'}</dt>
                    <dd className="font-semibold text-[#1C1714]">
                      {LABELS.attendanceStatuses[reg.attendanceStatus][lang]}
                    </dd>
                  </div>
                </dl>
              );
            })()}

            <div className="mt-6 pt-4 border-t border-[#E4DACB] flex items-center justify-between gap-3">
              {myRegistrations[viewingPassEvent.id].attendanceStatus === 'registered' && (
                <button
                  type="button"
                  disabled={cancellingId === viewingPassEvent.id}
                  onClick={() => handleCancelRegistration(viewingPassEvent)}
                  className="text-xs text-[#A61C24] underline underline-offset-2 hover:text-[#88151C] cursor-pointer"
                >
                  {cancellingId === viewingPassEvent.id
                    ? lang === 'bn'
                      ? 'বাতিল হচ্ছে...'
                      : 'Cancelling...'
                    : lang === 'bn'
                      ? 'নিবন্ধন বাতিল করুন'
                      : 'Cancel Registration'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingPassEvent(null)}
                className="ml-auto px-5 py-2 bg-[#1C1714] text-white text-sm font-medium hover:bg-[#332B26] cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
