import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Search, UserPlus, X } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CommitteeTier,
  Language,
  MemberPrivateRecord,
  MemberPublicProfile,
  sanitizeText,
} from '../types';
import { formatLocalizedNumber, LABELS } from '../utils/i18n';
import { AlpanaLotusMark } from './AlpanaMotifs';

interface MembersViewProps {
  lang: Language;
  members: MemberPublicProfile[];
  user: User | null;
  onSignIn: () => void;
  onProfileSaved: () => void;
}

export function MembersView({
  lang,
  members,
  user,
  onSignIn,
  onProfileSaved,
}: MembersViewProps) {
  const [tierFilter, setTierFilter] = useState<'all' | CommitteeTier>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Member profile form state (split into public + PII private)
  const [existingPublic, setExistingPublic] = useState<MemberPublicProfile | null>(null);
  const [existingPrivate, setExistingPrivate] = useState(false);
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [batch, setBatch] = useState('B.Tech 2027');
  const [hometownBn, setHometownBn] = useState('কলকাতা');
  const [hometownEn, setHometownEn] = useState('Kolkata');
  const [culturalInterestBn, setCulturalInterestBn] = useState('রবীন্দ্রসঙ্গীত ও আলপনা');
  const [culturalInterestEn, setCulturalInterestEn] = useState('Rabindra Sangeet & Alpana');
  const [bioBn, setBioBn] = useState('');
  const [bioEn, setBioEn] = useState('');
  // Private PII fields (saved only to /memberPrivate/{uid})
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [hostel, setHostel] = useState('APJ Kalam Hall');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (!drawerOpen || !user) return;
    let active = true;

    async function loadMyProfile() {
      if (!user) return;
      try {
        const pubSnap = await getDoc(doc(db, 'memberProfiles', user.uid));
        const privSnap = await getDoc(doc(db, 'memberPrivate', user.uid));
        if (!active) return;

        if (pubSnap.exists()) {
          const pub = { id: pubSnap.id, ...(pubSnap.data() as Omit<MemberPublicProfile, 'id'>) };
          setExistingPublic(pub);
          setNameBn(pub.nameBn);
          setNameEn(pub.nameEn);
          setDepartment(pub.department);
          setBatch(pub.batch);
          setHometownBn(pub.hometownBn);
          setHometownEn(pub.hometownEn);
          setCulturalInterestBn(pub.culturalInterestBn);
          setCulturalInterestEn(pub.culturalInterestEn);
          setBioBn(pub.bioBn);
          setBioEn(pub.bioEn);
          setIsPublic(pub.isPublic);
        } else {
          setExistingPublic(null);
          setNameEn(user.displayName || '');
          setNameBn(user.displayName || '');
        }

        if (privSnap.exists()) {
          const priv = privSnap.data() as MemberPrivateRecord;
          setExistingPrivate(true);
          setRollNumber(priv.rollNumber);
          setPhone(priv.phone);
          setHostel(priv.hostel);
        } else {
          setExistingPrivate(false);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `memberProfiles/${user.uid}`);
      }
    }

    void loadMyProfile();
    return () => {
      active = false;
    };
  }, [drawerOpen, user]);

  const filteredMembers = members.filter((m) => {
    if (tierFilter !== 'all' && m.committeeTier !== tierFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.nameBn.toLowerCase().includes(q) ||
      m.nameEn.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.hometownBn.toLowerCase().includes(q) ||
      m.hometownEn.toLowerCase().includes(q) ||
      m.culturalInterestBn.toLowerCase().includes(q) ||
      m.culturalInterestEn.toLowerCase().includes(q)
    );
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onSignIn();
      return;
    }

    const cleanNameBn = sanitizeText(nameBn || nameEn, 120);
    const cleanNameEn = sanitizeText(nameEn || nameBn, 120);
    const cleanRoll = sanitizeText(rollNumber, 40);
    const cleanPhone = sanitizeText(phone, 24);
    const cleanHostel = sanitizeText(hostel, 80);
    const cleanEmail = sanitizeText(user.email || '', 160);

    if (cleanNameEn.length < 1 || cleanRoll.length < 2 || cleanPhone.length < 6) {
      setStatusMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে নাম, রোল নম্বর এবং ফোন নম্বর সঠিকভাবে পূরণ করুন।'
          : 'Please enter valid name, IIT Indore roll number, and phone number.'
      );
      return;
    }

    setSaving(true);
    setStatusMsg('');

    const pubRef = doc(db, 'memberProfiles', user.uid);
    const privRef = doc(db, 'memberPrivate', user.uid);

    try {
      const dbBatch = writeBatch(db);
      if (existingPublic) {
        // Tier 2 Owner update: strictly allowed personal display fields only
        dbBatch.update(pubRef, {
          nameBn: cleanNameBn,
          nameEn: cleanNameEn,
          department: sanitizeText(department, 80),
          batch: sanitizeText(batch, 40),
          hometownBn: sanitizeText(hometownBn, 80),
          hometownEn: sanitizeText(hometownEn, 80),
          culturalInterestBn: sanitizeText(culturalInterestBn, 140),
          culturalInterestEn: sanitizeText(culturalInterestEn, 140),
          bioBn: sanitizeText(bioBn, 400),
          bioEn: sanitizeText(bioEn, 400),
          avatarUrl: sanitizeText(user.photoURL || '', 500),
          isPublic,
          updatedAt: serverTimestamp(),
        });
        if (existingPrivate) {
          dbBatch.update(privRef, {
            email: cleanEmail,
            phone: cleanPhone,
            rollNumber: cleanRoll,
            hostel: cleanHostel,
            updatedAt: serverTimestamp(),
          });
        } else {
          dbBatch.set(privRef, {
            userId: user.uid,
            email: cleanEmail,
            phone: cleanPhone,
            rollNumber: cleanRoll,
            hostel: cleanHostel,
            chandaStatus: 'pending',
            notes: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Brand-new member self-registration (enforces pending status & member tier)
        dbBatch.set(pubRef, {
          userId: user.uid,
          nameBn: cleanNameBn,
          nameEn: cleanNameEn,
          roleTitleBn: 'সদস্য',
          roleTitleEn: 'Member',
          committeeTier: 'member',
          department: sanitizeText(department, 80),
          batch: sanitizeText(batch, 40),
          hometownBn: sanitizeText(hometownBn, 80),
          hometownEn: sanitizeText(hometownEn, 80),
          culturalInterestBn: sanitizeText(culturalInterestBn, 140),
          culturalInterestEn: sanitizeText(culturalInterestEn, 140),
          bioBn: sanitizeText(bioBn, 400),
          bioEn: sanitizeText(bioEn, 400),
          avatarUrl: sanitizeText(user.photoURL || '', 500),
          membershipStatus: 'pending',
          isPublic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        dbBatch.set(privRef, {
          userId: user.uid,
          email: cleanEmail,
          phone: cleanPhone,
          rollNumber: cleanRoll,
          hostel: cleanHostel,
          chandaStatus: 'pending',
          notes: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await dbBatch.commit();
      onProfileSaved();
      setDrawerOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `memberProfiles/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const tierTabs: { id: 'all' | CommitteeTier; label: string }[] = [
    { id: 'all', label: LABELS.committeeTiers.all[lang] },
    { id: 'committee', label: LABELS.committeeTiers.committee[lang] },
    { id: 'faculty', label: LABELS.committeeTiers.faculty[lang] },
    { id: 'member', label: LABELS.committeeTiers.member[lang] },
    { id: 'alumni', label: LABELS.committeeTiers.alumni[lang] },
  ];

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('');

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E4DACB]">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#A61C24] mb-2">
            {lang === 'bn'
              ? `দলবল ও সদস্য পরিচিতি · ${formatLocalizedNumber(members.length, 'bn')} জন সদস্য`
              : `Community Directory · ${members.length} Members`}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1714]">
            {lang === 'bn' ? 'আমাদের বাংলার হাট পরিবার' : 'Members & Committee Profiles'}
          </h1>
          <p className="text-sm text-[#5C524A] mt-2 max-w-2xl">
            {lang === 'bn'
              ? 'আইআইটি ইন্দোরের বাঙালি ছাত্রছাত্রী, গবেষক ও অধ্যাপকদের পরিচিতি। ব্যক্তিগত যোগাযোগের তথ্য কেবল কমিটি প্রশাসকের জন্য সংরক্ষিত থাকে।'
              : 'Meet the students, scholars, faculty advisors, and alumni sustaining Bengali culture at IIT Indore. Private contact details stay strictly protected for committee records.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => (user ? setDrawerOpen(true) : onSignIn())}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors self-start md:self-auto whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>
            {user
              ? lang === 'bn'
                ? 'আমার সদস্য প্রোফাইল'
                : 'My Member Profile'
              : lang === 'bn'
                ? 'সদস্য হিসেবে যোগ দিন'
                : 'Join Community'}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="py-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#E4DACB]">
        <div className="inline-flex items-center p-1 bg-[#EFE8DC] border border-[#E4DACB] overflow-x-auto">
          {tierTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTierFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                tierFilter === tab.id
                  ? 'bg-white text-[#A61C24] shadow-xs'
                  : 'text-[#5C524A] hover:text-[#1C1714]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#7D6E61] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn' ? 'নাম, জেলা বা বিভাগ খুঁজুন...' : 'Search name, hometown, dept...'
            }
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#D8CCB9] text-sm text-[#1C1714] focus:outline-none focus:border-[#A61C24]"
          />
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="py-20 text-center">
          <AlpanaLotusMark className="w-10 h-10 text-[#A61C24]/70 mx-auto mb-3" />
          <p className="text-sm text-[#5C524A]">
            {lang === 'bn' ? 'কোনো সদস্য খুঁজে পাওয়া যায়নি।' : 'No matching community members found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {filteredMembers.map((member) => (
            <article
              key={member.id}
              className="bg-white border border-[#E4DACB] p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#F4EFE6] border border-[#D8CCB9] flex items-center justify-center font-editorial font-bold text-[#A61C24] text-lg shrink-0">
                    {getInitials(lang === 'bn' ? member.nameBn : member.nameEn)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-editorial text-xl font-bold text-[#1C1714] truncate">
                      {lang === 'bn' ? member.nameBn : member.nameEn}
                    </h2>
                    <p className="text-xs font-medium text-[#A61C24] mt-0.5">
                      {lang === 'bn' ? member.roleTitleBn : member.roleTitleEn}
                    </p>
                    <p className="text-xs text-[#6E6054] mt-0.5">
                      {member.department} · {formatLocalizedNumber(member.batch, lang)}
                    </p>
                  </div>
                </div>

                {(member.bioBn || member.bioEn) && (
                  <p className="text-sm text-[#4A4038] leading-relaxed mb-4">
                    {lang === 'bn' ? member.bioBn : member.bioEn}
                  </p>
                )}
              </div>

              <dl className="pt-4 border-t border-[#F0E9DE] space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7D6E61] shrink-0">
                    {lang === 'bn' ? 'আদি নিবাস' : 'Hometown'}
                  </dt>
                  <dd className="font-medium text-[#1C1714] text-right">
                    {lang === 'bn' ? member.hometownBn : member.hometownEn}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#7D6E61] shrink-0">
                    {lang === 'bn' ? 'সাংস্কৃতিক আগ্রহ' : 'Cultural Focus'}
                  </dt>
                  <dd className="text-[#4A4038] text-right">
                    {lang === 'bn' ? member.culturalInterestBn : member.culturalInterestEn}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      {/* Join / Edit Profile Modal */}
      {drawerOpen && user && (
        <div
          className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-2xl my-8">
            <div className="flex items-start justify-between px-6 py-5 bg-white border-b border-[#E4DACB]">
              <div>
                <p className="text-xs text-[#A61C24] font-medium mb-1">
                  {lang === 'bn' ? 'বাংলার হাট সদস্য নিবন্ধন' : 'Community Membership Record'}
                </p>
                <h3 className="font-editorial text-2xl font-bold text-[#1C1714]">
                  {existingPublic
                    ? lang === 'bn'
                      ? 'আপনার সদস্য প্রোফাইল সম্পাদনা করুন'
                      : 'Update Your Member Profile'
                    : lang === 'bn'
                      ? 'বাংলার হাট পরিবারে যোগ দিন'
                      : 'Join Banglaar Haat Community'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close member form"
                className="p-1 text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {statusMsg && (
                <div className="p-3 bg-[#A61C24]/10 border border-[#A61C24]/30 text-xs text-[#88151C]">
                  {statusMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'নাম (বাংলায়) *' : 'Name in Bengali *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: অরিত্র সেন"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'নাম (ইংরেজিতে) *' : 'Name in English *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g., Aritra Sen"
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
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
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'ব্যাচ / প্রোগ্রাম *' : 'Batch / Program *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'আদি নিবাস (বাংলায়) *' : 'Hometown (Bengali) *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={hometownBn}
                    onChange={(e) => setHometownBn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'আদি নিবাস (ইংরেজিতে) *' : 'Hometown (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={hometownEn}
                    onChange={(e) => setHometownEn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'সাংস্কৃতিক আগ্রহ (বাংলায়)' : 'Cultural Interests (BN)'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={culturalInterestBn}
                    onChange={(e) => setCulturalInterestBn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4A4038] mb-1">
                    {lang === 'bn' ? 'সাংস্কৃতিক আগ্রহ (ইংরেজিতে)' : 'Cultural Interests (EN)'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={culturalInterestEn}
                    onChange={(e) => setCulturalInterestEn(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4DACB]">
                <p className="text-xs font-semibold text-[#A61C24] mb-3">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত ক্যাম্পাস তথ্য (কেবল কমিটি প্রশাসকের জন্য সংরক্ষিত)'
                    : 'Private Campus Record (Visible only to you & Committee Admins)'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'রোল / আইডি *' : 'Roll / ID *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'ফোন নম্বর *' : 'Phone *'}
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#4A4038] mb-1">
                      {lang === 'bn' ? 'হোস্টেল *' : 'Hostel *'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CCB9] text-sm"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-xs text-[#4A4038] pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="accent-[#A61C24]"
                />
                <span>
                  {lang === 'bn'
                    ? 'দলবল পাতায় আমার নাম, বিভাগ ও সাংস্কৃতিক আগ্রহ প্রদর্শন করুন (ফোন ও ইমেইল গোপন থাকবে)'
                    : 'Show my name, department & cultural interests in the public directory (phone/email always stay private)'}
                </span>
              </label>

              <div className="pt-4 border-t border-[#E4DACB] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2 text-sm text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] disabled:opacity-60 cursor-pointer"
                >
                  {saving
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                      ? 'প্রোফাইল সংরক্ষণ করুন'
                      : 'Save Member Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
