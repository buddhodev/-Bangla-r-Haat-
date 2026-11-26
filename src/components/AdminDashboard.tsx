import React, { useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  Calendar,
  Check,
  Database,
  Download,
  Image as ImageIcon,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  AdminRecord,
  AttendanceStatus,
  ChandaStatus,
  CommitteeTier,
  CulturalEvent,
  EventCategory,
  EventRegistration,
  EventStatus,
  FoodPreference,
  GalleryCategory,
  GalleryItem,
  Language,
  MemberPrivateRecord,
  MemberPublicProfile,
  MembershipStatus,
  VolunteerRole,
  generatePassCode,
  generateSafeId,
  sanitizeText,
} from '../types';
import {
  CAMPUS_PHOTOS,
  INITIAL_EVENTS,
  INITIAL_GALLERY,
  INITIAL_MEMBERS,
  INITIAL_MEMBERS_PRIVATE,
} from '../data/seedData';
import { downloadCsvWithBom, formatLocalizedNumber, LABELS } from '../utils/i18n';
import { AlpanaLotusMark } from './AlpanaMotifs';
import { SafeImage } from './SafeImage';

type AdminTab = 'attendance' | 'members' | 'events' | 'gallery_admins';

interface AdminDashboardProps {
  lang: Language;
  user: User | null;
  isAdmin: boolean;
  events: CulturalEvent[];
  isSeedMode: boolean;
  onSignIn: () => void;
}

const PHOTO_PRESETS = [
  { labelBn: 'মা কালীর প্রতিমা', labelEn: 'Maa Kali Pratima', url: CAMPUS_PHOTOS.kaliPratima },
  { labelBn: 'দীপাবলির ফানুস ও শাড়ি', labelEn: 'Dipaboli Fanush Saree', url: CAMPUS_PHOTOS.fanushSaree },
  { labelBn: 'প্রতিমা আগমন দল', labelEn: 'Pratima Agomon Team', url: CAMPUS_PHOTOS.pratimaJatra },
  { labelBn: 'আকাশ ফানুস উৎসব', labelEn: 'Group Fanush Release', url: CAMPUS_PHOTOS.fanushGroup },
  { labelBn: 'দীপাবলি তুবড়ি', labelEn: 'Dipaboli Tubri Sparks', url: CAMPUS_PHOTOS.tubriPlaza },
  { labelBn: 'ফুলঝুরি ও শ্যামা পূজা', labelEn: 'Sparklers Courtyard', url: CAMPUS_PHOTOS.sparklerNight },
];

export function AdminDashboard({
  lang,
  user,
  isAdmin,
  events,
  isSeedMode,
  onSignIn,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('attendance');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [allMembersPublic, setAllMembersPublic] = useState<MemberPublicProfile[]>([]);
  const [allMembersPrivate, setAllMembersPrivate] = useState<Record<string, MemberPrivateRecord>>({});
  const [allGallery, setAllGallery] = useState<GalleryItem[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);

  // Filters
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [memSearch, setMemSearch] = useState('');
  const [memStatusFilter, setMemStatusFilter] = useState<'all' | MembershipStatus>('all');

  // Action states & modals
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAddGalleryModal, setShowAddGalleryModal] = useState(false);

  // Walk-in form
  const [wiName, setWiName] = useState('');
  const [wiRoll, setWiRoll] = useState('');
  const [wiDept, setWiDept] = useState('CSE');
  const [wiHostel, setWiHostel] = useState('APJ Kalam Hall');
  const [wiPhone, setWiPhone] = useState('');
  const [wiEmail, setWiEmail] = useState('');
  const [wiFood, setWiFood] = useState<FoodPreference>('veg_bhog');
  const [wiGuests, setWiGuests] = useState(0);
  const [wiRole, setWiRole] = useState<VolunteerRole>('attendee');

  // Add member form
  const [amNameBn, setAmNameBn] = useState('');
  const [amNameEn, setAmNameEn] = useState('');
  const [amRoleBn, setAmRoleBn] = useState('সদস্য');
  const [amRoleEn, setAmRoleEn] = useState('Member');
  const [amTier, setAmTier] = useState<CommitteeTier>('member');
  const [amDept, setAmDept] = useState('CSE');
  const [amBatch, setAmBatch] = useState('B.Tech 2027');
  const [amHomeBn, setAmHomeBn] = useState('কলকাতা');
  const [amHomeEn, setAmHomeEn] = useState('Kolkata');
  const [amInterestBn, setAmInterestBn] = useState('পূজা ও আড্ডা');
  const [amInterestEn, setAmInterestEn] = useState('Pujo & Adda');
  const [amRoll, setAmRoll] = useState('');
  const [amHostel, setAmHostel] = useState('CV Raman Hall');
  const [amPhone, setAmPhone] = useState('');
  const [amEmail, setAmEmail] = useState('');
  const [amChanda, setAmChanda] = useState<ChandaStatus>('paid');

  // Add Event form
  const [evTitleBn, setEvTitleBn] = useState('');
  const [evTitleEn, setEvTitleEn] = useState('');
  const [evCategory, setEvCategory] = useState<EventCategory>('pujo');
  const [evDateBn, setEvDateBn] = useState('১৫ অগ্রহায়ণ, ১৪৩৩');
  const [evDateEn, setEvDateEn] = useState('01 Dec 2026');
  const [evIsoDate, setEvIsoDate] = useState('2026-12-01');
  const [evTimeBn, setEvTimeBn] = useState('সন্ধ্যা ৬:০০ – রাত ১০:০০');
  const [evTimeEn, setEvTimeEn] = useState('6:00 PM – 10:00 PM');
  const [evVenueBn, setEvVenueBn] = useState('নালন্দা প্রাঙ্গণ, আইআইটি ইন্দোর');
  const [evVenueEn, setEvVenueEn] = useState('Nalanda Lawn, IIT Indore');
  const [evDescBn, setEvDescBn] = useState('');
  const [evDescEn, setEvDescEn] = useState('');
  const [evBhogBn, setEvBhogBn] = useState('খিচুড়ি ভোগ, লাবড়া, চাটনি ও পায়েস');
  const [evBhogEn, setEvBhogEn] = useState('Khichuri Bhog, Labra, Chutney & Payesh');
  const [evCapacity, setEvCapacity] = useState(200);
  const [evImageUrl, setEvImageUrl] = useState<string>(CAMPUS_PHOTOS.kaliPratima);

  // Add Gallery form
  const [galTitleBn, setGalTitleBn] = useState('');
  const [galTitleEn, setGalTitleEn] = useState('');
  const [galCaptionBn, setGalCaptionBn] = useState('');
  const [galCaptionEn, setGalCaptionEn] = useState('');
  const [galCategory, setGalCategory] = useState<GalleryCategory>('kali_pujo');
  const [galYearBn, setGalYearBn] = useState('১৪৩৩ বঙ্গাব্দ');
  const [galYearEn, setGalYearEn] = useState('2026');
  const [galLocBn, setGalLocBn] = useState('আইআইটি ইন্দোর ক্যাম্পাস');
  const [galLocEn, setGalLocEn] = useState('IIT Indore Campus');
  const [galPhotoBy, setGalPhotoBy] = useState('বাংলার হাট আর্কাইভ');
  const [galUrl, setGalUrl] = useState<string>(CAMPUS_PHOTOS.fanushSaree);

  // Add Admin form
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3600);
  };

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  // Admin-only live Firestore listeners
  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsubPub = onSnapshot(
      collection(db, 'memberProfiles'),
      (snap) => {
        setAllMembersPublic(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MemberPublicProfile, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'memberProfiles')
    );

    const unsubPriv = onSnapshot(
      collection(db, 'memberPrivate'),
      (snap) => {
        const map: Record<string, MemberPrivateRecord> = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...(d.data() as Omit<MemberPrivateRecord, 'id'>) };
        });
        setAllMembersPrivate(map);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'memberPrivate')
    );

    const unsubGal = onSnapshot(
      collection(db, 'galleryItems'),
      (snap) => {
        setAllGallery(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'galleryItems')
    );

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminRecords(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminRecord, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'admins')
    );

    return () => {
      unsubPub();
      unsubPriv();
      unsubGal();
      unsubAdmins();
    };
  }, [user, isAdmin]);

  // Listen to registrations for selected event
  useEffect(() => {
    if (!user || !isAdmin || !selectedEventId || isSeedMode) {
      setRegistrations([]);
      return;
    }

    const regPath = `events/${selectedEventId}/registrations`;
    const unsub = onSnapshot(
      collection(db, 'events', selectedEventId, 'registrations'),
      (snap) => {
        setRegistrations(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventRegistration, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, regPath)
    );

    return () => unsub();
  }, [user, isAdmin, selectedEventId, isSeedMode]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  // Seed Firestore with initial festivals, 6 campus photos, and 6 committee members
  const handleSeedDatabase = async () => {
    if (!user || !isAdmin) return;
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      INITIAL_EVENTS.forEach((ev) => {
        const { id, ...rest } = ev;
        batch.set(doc(db, 'events', id), {
          ...rest,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      INITIAL_GALLERY.forEach((gal) => {
        const { id, ...rest } = gal;
        batch.set(doc(db, 'galleryItems', id), {
          ...rest,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      INITIAL_MEMBERS.forEach((mem) => {
        const { id, ...rest } = mem;
        batch.set(doc(db, 'memberProfiles', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      INITIAL_MEMBERS_PRIVATE.forEach((priv) => {
        const { id, ...rest } = priv;
        batch.set(doc(db, 'memberPrivate', id), {
          ...rest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      showNotice(
        lang === 'bn'
          ? 'প্রাথমিক উৎসব, গ্যালারি ও সদস্যদের তথ্য সফলভাবে ডাটাবেসে যুক্ত হয়েছে!'
          : 'Initial festivals, gallery photos, and committee records have been initialized in Firestore!'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'seed_batch');
    } finally {
      setSeeding(false);
    }
  };

  // Update attendance status (1-click check-in)
  const handleUpdateAttendance = async (reg: EventRegistration, nextStatus: AttendanceStatus) => {
    if (!selectedEventId) return;
    try {
      await updateDoc(doc(db, 'events', selectedEventId, 'registrations', reg.id), {
        attendanceStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      showNotice(
        lang === 'bn'
          ? `${reg.fullName}-এর উপস্থিতি হালনাগাদ হয়েছে (${LABELS.attendanceStatuses[nextStatus].bn})`
          : `Updated ${reg.fullName} to ${LABELS.attendanceStatuses[nextStatus].en}`
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `events/${selectedEventId}/registrations/${reg.id}`
      );
    }
  };

  const handleDeleteRegistration = async (reg: EventRegistration) => {
    if (!selectedEvent) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'events', selectedEvent.id, 'registrations', reg.id));
      batch.update(doc(db, 'events', selectedEvent.id), {
        registeredCount: Math.max(0, (selectedEvent.registeredCount || 1) - 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      showNotice(lang === 'bn' ? 'নিবন্ধন মুছে ফেলা হয়েছে।' : 'Registration removed.');
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.DELETE,
        `events/${selectedEvent.id}/registrations/${reg.id}`
      );
    }
  };

  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !user) return;
    const regId = generateSafeId('walkin');
    const passCode = generatePassCode(selectedEvent.id);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'events', selectedEvent.id, 'registrations', regId), {
        eventId: selectedEvent.id,
        userId: regId,
        fullName: sanitizeText(wiName, 120),
        rollNumber: sanitizeText(wiRoll, 40),
        department: sanitizeText(wiDept, 80),
        hostel: sanitizeText(wiHostel, 80),
        phone: sanitizeText(wiPhone, 24),
        email: sanitizeText(wiEmail || 'walkin@iiti.ac.in', 160),
        foodPreference: wiFood,
        guestCount: Math.max(0, Math.min(5, wiGuests)),
        volunteerRole: wiRole,
        attendanceStatus: 'present',
        passCode,
        isWalkIn: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'events', selectedEvent.id), {
        registeredCount: Math.min(selectedEvent.capacity, (selectedEvent.registeredCount || 0) + 1),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setShowWalkInModal(false);
      setWiName('');
      setWiRoll('');
      setWiPhone('');
      setWiEmail('');
      showNotice(
        lang === 'bn' ? 'তাৎক্ষণিক উপস্থিতি নথিভুক্ত হয়েছে।' : 'Walk-in attendee checked in.'
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `events/${selectedEvent.id}/registrations/${regId}`
      );
    }
  };

  // Membership updates
  const handleUpdateMemberStatus = async (memberId: string, membershipStatus: MembershipStatus) => {
    try {
      await updateDoc(doc(db, 'memberProfiles', memberId), {
        membershipStatus,
        updatedAt: serverTimestamp(),
      });
      showNotice(lang === 'bn' ? 'সদস্যের স্থিতি হালনাগাদ হয়েছে।' : 'Membership status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberProfiles/${memberId}`);
    }
  };

  const handleUpdateMemberTier = async (memberId: string, committeeTier: CommitteeTier) => {
    const roleMap: Record<CommitteeTier, { bn: string; en: string }> = {
      committee: { bn: 'পরিচালনা কমিটি সদস্য', en: 'Committee Member' },
      faculty: { bn: 'অধ্যাপক উপদেষ্টা', en: 'Faculty Advisor' },
      member: { bn: 'সক্রিয় সদস্য', en: 'Active Member' },
      alumni: { bn: 'প্রাক্তনী সদস্য', en: 'Alumni Member' },
    };
    try {
      await updateDoc(doc(db, 'memberProfiles', memberId), {
        committeeTier,
        roleTitleBn: roleMap[committeeTier].bn,
        roleTitleEn: roleMap[committeeTier].en,
        updatedAt: serverTimestamp(),
      });
      showNotice(lang === 'bn' ? 'সদস্যের পদবী হালনাগাদ হয়েছে।' : 'Member role updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberProfiles/${memberId}`);
    }
  };

  const handleUpdateChanda = async (memberId: string, chandaStatus: ChandaStatus) => {
    try {
      await updateDoc(doc(db, 'memberPrivate', memberId), {
        chandaStatus,
        updatedAt: serverTimestamp(),
      });
      showNotice(lang === 'bn' ? 'চাঁদার হিসাব হালনাগাদ হয়েছে।' : 'Chanda dues status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberPrivate/${memberId}`);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'memberProfiles', memberId));
      if (allMembersPrivate[memberId]) {
        batch.delete(doc(db, 'memberPrivate', memberId));
      }
      await batch.commit();
      showNotice(lang === 'bn' ? 'সদস্যের নথি মুছে ফেলা হয়েছে।' : 'Member record deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `memberProfiles/${memberId}`);
    }
  };

  const handleAddMemberRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const memberId = generateSafeId('mem');
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'memberProfiles', memberId), {
        userId: memberId,
        nameBn: sanitizeText(amNameBn || amNameEn, 120),
        nameEn: sanitizeText(amNameEn || amNameBn, 120),
        roleTitleBn: sanitizeText(amRoleBn, 80),
        roleTitleEn: sanitizeText(amRoleEn, 80),
        committeeTier: amTier,
        department: sanitizeText(amDept, 80),
        batch: sanitizeText(amBatch, 40),
        hometownBn: sanitizeText(amHomeBn, 80),
        hometownEn: sanitizeText(amHomeEn, 80),
        culturalInterestBn: sanitizeText(amInterestBn, 140),
        culturalInterestEn: sanitizeText(amInterestEn, 140),
        bioBn: '',
        bioEn: '',
        avatarUrl: '',
        membershipStatus: 'active',
        isPublic: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'memberPrivate', memberId), {
        userId: memberId,
        email: sanitizeText(amEmail || `${memberId}@iiti.ac.in`, 160),
        phone: sanitizeText(amPhone, 24),
        rollNumber: sanitizeText(amRoll, 40),
        hostel: sanitizeText(amHostel, 80),
        chandaStatus: amChanda,
        notes: 'Added via Admin Dashboard',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      setShowAddMemberModal(false);
      setAmNameBn('');
      setAmNameEn('');
      setAmRoll('');
      setAmPhone('');
      setAmEmail('');
      showNotice(lang === 'bn' ? 'নতুন সদস্য নথিভুক্ত হয়েছে।' : 'Member record created.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `memberProfiles/${memberId}`);
    }
  };

  // Event Management
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const eventId = generateSafeId('ev');
    try {
      await setDoc(doc(db, 'events', eventId), {
        titleBn: sanitizeText(evTitleBn, 140),
        titleEn: sanitizeText(evTitleEn, 140),
        category: evCategory,
        dateBn: sanitizeText(evDateBn, 80),
        dateEn: sanitizeText(evDateEn, 80),
        isoDate: sanitizeText(evIsoDate, 20),
        timeBn: sanitizeText(evTimeBn, 80),
        timeEn: sanitizeText(evTimeEn, 80),
        venueBn: sanitizeText(evVenueBn, 140),
        venueEn: sanitizeText(evVenueEn, 140),
        descriptionBn: sanitizeText(evDescBn || evDescEn, 1200),
        descriptionEn: sanitizeText(evDescEn || evDescBn, 1200),
        bhogMenuBn: sanitizeText(evBhogBn, 500),
        bhogMenuEn: sanitizeText(evBhogEn, 500),
        imageUrl: sanitizeText(evImageUrl, 500),
        capacity: Math.max(1, Math.min(5000, Number(evCapacity) || 150)),
        registeredCount: 0,
        status: 'open',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddEventModal(false);
      setEvTitleBn('');
      setEvTitleEn('');
      setEvDescBn('');
      setEvDescEn('');
      showNotice(lang === 'bn' ? 'নতুন উৎসব প্রকাশিত হয়েছে!' : 'New festival event published!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `events/${eventId}`);
    }
  };

  const handleUpdateEventStatus = async (ev: CulturalEvent, status: EventStatus) => {
    try {
      await updateDoc(doc(db, 'events', ev.id), {
        status,
        updatedAt: serverTimestamp(),
      });
      showNotice(lang === 'bn' ? 'উৎসবের স্থিতি হালনাগাদ হয়েছে।' : 'Event status updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `events/${ev.id}`);
    }
  };

  const handleDeleteEvent = async (ev: CulturalEvent) => {
    try {
      await deleteDoc(doc(db, 'events', ev.id));
      showNotice(lang === 'bn' ? 'উৎসব মুছে ফেলা হয়েছে।' : 'Event deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `events/${ev.id}`);
    }
  };

  // Gallery Management
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const itemId = generateSafeId('gal');
    try {
      await setDoc(doc(db, 'galleryItems', itemId), {
        titleBn: sanitizeText(galTitleBn, 140),
        titleEn: sanitizeText(galTitleEn, 140),
        captionBn: sanitizeText(galCaptionBn || galCaptionEn, 500),
        captionEn: sanitizeText(galCaptionEn || galCaptionBn, 500),
        category: galCategory,
        yearBn: sanitizeText(galYearBn, 40),
        yearEn: sanitizeText(galYearEn, 40),
        locationBn: sanitizeText(galLocBn, 120),
        locationEn: sanitizeText(galLocEn, 120),
        photographer: sanitizeText(galPhotoBy, 100),
        imageUrl: sanitizeText(galUrl, 500),
        isPublic: true,
        featured: false,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddGalleryModal(false);
      setGalTitleBn('');
      setGalTitleEn('');
      setGalCaptionBn('');
      setGalCaptionEn('');
      showNotice(lang === 'bn' ? 'গ্যালারিতে ছবি যুক্ত হয়েছে।' : 'Gallery photo added.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `galleryItems/${itemId}`);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'galleryItems', id));
      showNotice(lang === 'bn' ? 'গ্যালারি ছবি মুছে ফেলা হয়েছে।' : 'Gallery item deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `galleryItems/${id}`);
    }
  };

  // Admin Access Management
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleanUid = sanitizeText(newAdminUid, 128);
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUid)) {
      showNotice(lang === 'bn' ? 'সঠিক Firebase UID প্রদান করুন।' : 'Enter a valid alphanumeric UID.');
      return;
    }
    try {
      await setDoc(doc(db, 'admins', cleanUid), {
        uid: cleanUid,
        email: sanitizeText(newAdminEmail, 160),
        displayName: sanitizeText(newAdminName, 120),
        role: 'committee_admin',
        addedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewAdminUid('');
      setNewAdminEmail('');
      setNewAdminName('');
      showNotice(lang === 'bn' ? 'নতুন কমিটি অ্যাডমিন যুক্ত হয়েছে।' : 'Committee admin added.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `admins/${cleanUid}`);
    }
  };

  const handleRevokeAdmin = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'admins', uid));
      showNotice(lang === 'bn' ? 'অ্যাডমিন অধিকার প্রত্যাহার করা হয়েছে।' : 'Admin access revoked.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
    }
  };

  // Auth Gate for non-admin visitors
  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-white border border-[#E4DACB] p-10">
          <AlpanaLotusMark className="w-12 h-12 text-[#A61C24] mx-auto mb-4" />
          <p className="text-xs font-medium text-[#A61C24] mb-2">
            {lang === 'bn' ? 'কমিটি প্রশাসন ড্যাশবোর্ড' : 'Committee Administration'}
          </p>
          <h1 className="font-editorial text-3xl font-bold text-[#1C1714] mb-3">
            {lang === 'bn' ? 'বাংলার হাট প্রশাসনিক পোর্টাল' : 'Banglaar Haat Admin Console'}
          </h1>
          <p className="text-sm text-[#5C524A] leading-relaxed mb-6">
            {!user
              ? lang === 'bn'
                ? 'উৎসবের উপস্থিতি, ভোগ তালিকা এবং সদস্যদের খাতা পরিচালনার জন্য অনুমোদিত কমিটি গুগল অ্যাকাউন্ট দিয়ে প্রবেশ করুন।'
                : 'Sign in with an authorized committee Google account to manage event attendance, bhog rosters, and private membership records.'
              : lang === 'bn'
                ? `আপনি ${user.email} হিসেবে প্রবেশ করেছেন। এই অংশটি কেবল বাংলার হাট পরিচালনা কমিটির প্রশাসকদের (${BOOTSTRAPPED_ADMIN_EMAIL}) জন্য সংরক্ষিত।`
                : `Signed in as ${user.email}. This console is restricted to authorized Banglaar Haat committee administrators (${BOOTSTRAPPED_ADMIN_EMAIL}).`}
          </p>

          {!user ? (
            <button
              type="button"
              onClick={onSignIn}
              className="px-6 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'গুগল দিয়ে প্রশাসক প্রবেশ' : 'Admin Sign In with Google'}
            </button>
          ) : (
            <p className="text-xs text-[#7D6E61] font-mono bg-[#F4EFE6] p-3 border border-[#E4DACB]">
              {lang === 'bn' ? 'আপনার ইউজার আইডি (UID): ' : 'Your UID: '}
              {user.uid}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Filtered Attendance List
  const filteredRegs = registrations.filter((r) => {
    if (regStatusFilter !== 'all' && r.attendanceStatus !== regStatusFilter) return false;
    if (!regSearch.trim()) return true;
    const q = regSearch.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.rollNumber.toLowerCase().includes(q) ||
      r.passCode.toLowerCase().includes(q) ||
      r.hostel.toLowerCase().includes(q)
    );
  });

  const presentCount = registrations.filter((r) => r.attendanceStatus === 'present').length;
  const activeRegCount = registrations.filter((r) => r.attendanceStatus !== 'cancelled').length;
  const totalHeadcount = registrations
    .filter((r) => r.attendanceStatus !== 'cancelled')
    .reduce((sum, r) => sum + 1 + (r.guestCount || 0), 0);
  const attendancePct =
    activeRegCount > 0 ? Math.round((presentCount / activeRegCount) * 100) : 0;

  // Filtered Members List
  const filteredMembers = allMembersPublic.filter((m) => {
    if (memStatusFilter !== 'all' && m.membershipStatus !== memStatusFilter) return false;
    if (!memSearch.trim()) return true;
    const q = memSearch.toLowerCase();
    const priv = allMembersPrivate[m.id];
    return (
      m.nameBn.toLowerCase().includes(q) ||
      m.nameEn.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.hometownEn.toLowerCase().includes(q) ||
      (priv?.rollNumber || '').toLowerCase().includes(q) ||
      (priv?.email || '').toLowerCase().includes(q)
    );
  });

  const handleExportAttendanceCsv = () => {
    if (!selectedEvent) return;
    downloadCsvWithBom(
      `banglaar-haat-attendance-${selectedEvent.id}.csv`,
      [
        'Pass Code',
        'Full Name',
        'Roll Number',
        'Department',
        'Hostel',
        'Phone',
        'Email',
        'Meal Preference',
        'Guests',
        'Volunteer Role',
        'Attendance Status',
      ],
      filteredRegs.map((r) => [
        r.passCode,
        r.fullName,
        r.rollNumber,
        r.department,
        r.hostel,
        r.phone,
        r.email,
        LABELS.foodPrefs[r.foodPreference][lang],
        r.guestCount,
        LABELS.volunteerRoles[r.volunteerRole][lang],
        LABELS.attendanceStatuses[r.attendanceStatus][lang],
      ])
    );
  };

  const handleExportMembersCsv = () => {
    downloadCsvWithBom(
      `banglaar-haat-members-1433.csv`,
      [
        'Name (BN)',
        'Name (EN)',
        'Role',
        'Tier',
        'Department',
        'Batch',
        'Roll Number',
        'Hostel',
        'Phone',
        'Email',
        'Hometown',
        'Membership Status',
        'Chanda Dues',
      ],
      filteredMembers.map((m) => {
        const p = allMembersPrivate[m.id];
        return [
          m.nameBn,
          m.nameEn,
          m.roleTitleEn,
          m.committeeTier,
          m.department,
          m.batch,
          p?.rollNumber || '',
          p?.hostel || '',
          p?.phone || '',
          p?.email || '',
          m.hometownEn,
          m.membershipStatus,
          p?.chandaStatus || 'pending',
        ];
      })
    );
  };

  const sidebarItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'attendance',
      label: lang === 'bn' ? 'উপস্থিতি ও নিবন্ধন' : 'Event Attendance',
      icon: <Check className="w-4 h-4" />,
    },
    {
      id: 'members',
      label: lang === 'bn' ? 'সদস্য খাতা' : 'Membership Records',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'events',
      label: lang === 'bn' ? 'উৎসব ব্যবস্থাপনা' : 'Manage Events',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'gallery_admins',
      label: lang === 'bn' ? 'গ্যালারি ও কমিটি' : 'Gallery & Admins',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb + Seed Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E4DACB]">
        <div>
          <p className="text-xs text-[#7D6E61] mb-1">
            {lang === 'bn'
              ? 'বাংলার হাট / প্রশাসন ড্যাশবোর্ড'
              : 'Banglaar Haat / Administration Console'}
          </p>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1714]">
            {lang === 'bn' ? 'উপস্থিতি ও সদস্য পরিচালনা কেন্দ্র' : 'Attendance & Membership Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isSeedMode && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedDatabase}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              <Database className="w-4 h-4" />
              <span>
                {seeding
                  ? lang === 'bn'
                    ? 'ডাটাবেস যুক্ত হচ্ছে...'
                    : 'Initializing...'
                  : lang === 'bn'
                    ? 'প্রাথমিক উৎসব ও গ্যালারি ডাটাবেসে যুক্ত করুন'
                    : 'Initialize Festival & Gallery Database'}
              </span>
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="mt-4 px-4 py-3 bg-[#1C1714] text-white text-xs flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast('')} className="ml-4 opacity-75 hover:opacity-100 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Workspace Grid: 240px Sidebar + Main Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 xl:col-span-2">
          <nav className="bg-white border border-[#E4DACB] divide-y divide-[#F0E9DE]">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#A61C24] text-white font-medium'
                    : 'text-[#4A4038] hover:bg-[#F4EFE6]'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Compact Overview Summary */}
          <div className="mt-6 bg-white border border-[#E4DACB] p-4 space-y-3">
            <p className="text-xs font-semibold text-[#1C1714] border-b border-[#F0E9DE] pb-2">
              {lang === 'bn' ? 'সংক্ষিপ্ত পরিসংখ্যান' : 'Quick Overview'}
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6054]">{lang === 'bn' ? 'মোট উৎসব' : 'Events'}</span>
              <span className="font-semibold text-[#1C1714] tabular-nums-bengali">
                {formatLocalizedNumber(events.length, lang)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6054]">{lang === 'bn' ? 'সদস্য নথি' : 'Members'}</span>
              <span className="font-semibold text-[#1C1714] tabular-nums-bengali">
                {formatLocalizedNumber(allMembersPublic.length, lang)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6054]">{lang === 'bn' ? 'গ্যালারি চিত্র' : 'Gallery'}</span>
              <span className="font-semibold text-[#1C1714] tabular-nums-bengali">
                {formatLocalizedNumber(allGallery.length, lang)}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Panel */}
        <div className="lg:col-span-9 xl:col-span-10 min-w-0">
          {/* TAB 1: EVENT ATTENDANCE MANAGER */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Event Picker + Action Bar */}
              <div className="bg-white border border-[#E4DACB] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs text-[#6E6054] mb-1">
                    {lang === 'bn' ? 'উৎসব নির্বাচন করুন' : 'Select Event Roster'}
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full max-w-md px-3 py-2 bg-[#FBF9F5] border border-[#D8CCB9] text-sm font-medium text-[#1C1714]"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {lang === 'bn' ? ev.titleBn : ev.titleEn} (
                        {formatLocalizedNumber(ev.registeredCount, lang)}/
                        {formatLocalizedNumber(ev.capacity, lang)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={isSeedMode || !selectedEvent}
                    onClick={() => setShowWalkInModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'তাৎক্ষণিক উপস্থিতি' : 'Log Walk-in'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={filteredRegs.length === 0}
                    onClick={handleExportAttendanceCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D8CCB9] text-xs font-medium text-[#1C1714] hover:bg-[#F4EFE6] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'CSV ডাউনলোড' : 'Download CSV'}</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#E4DACB] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E4DACB]">
                <div className="p-4">
                  <p className="text-xs text-[#6E6054]">
                    {lang === 'bn' ? 'সক্রিয় নিবন্ধন' : 'Active Registrations'}
                  </p>
                  <p className="font-editorial text-2xl font-bold text-[#1C1714] mt-1 tabular-nums-bengali">
                    {formatLocalizedNumber(activeRegCount, lang)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6E6054]">
                    {lang === 'bn' ? 'উপস্থিত (চেক-ইন)' : 'Checked-In Present'}
                  </p>
                  <p className="font-editorial text-2xl font-bold text-[#16A34A] mt-1 tabular-nums-bengali">
                    {formatLocalizedNumber(presentCount, lang)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6E6054]">
                    {lang === 'bn' ? 'উপস্থিতির হার' : 'Attendance Rate'}
                  </p>
                  <p className="font-editorial text-2xl font-bold text-[#A61C24] mt-1 tabular-nums-bengali">
                    {formatLocalizedNumber(attendancePct, lang)}%
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-[#6E6054]">
                    {lang === 'bn' ? 'মোট ভোগ সংখ্যা (অতিথিসহ)' : 'Total Bhog Headcount'}
                  </p>
                  <p className="font-editorial text-2xl font-bold text-[#1C1714] mt-1 tabular-nums-bengali">
                    {formatLocalizedNumber(totalHeadcount, lang)}
                  </p>
                </div>
              </div>

              {/* Search & Status Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="inline-flex items-center p-1 bg-[#EFE8DC] border border-[#E4DACB] overflow-x-auto">
                  {(['all', 'registered', 'present', 'absent', 'cancelled'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRegStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                        regStatusFilter === st
                          ? 'bg-white text-[#A61C24]'
                          : 'text-[#5C524A] hover:text-[#1C1714]'
                      }`}
                    >
                      {st === 'all'
                        ? lang === 'bn'
                          ? 'সব'
                          : 'All'
                        : LABELS.attendanceStatuses[st][lang]}
                    </button>
                  ))}
                </div>

                <div className="relative sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#7D6E61] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={regSearch}
                    onChange={(e) => setRegSearch(e.target.value)}
                    placeholder={lang === 'bn' ? 'নাম, রোল বা পাস কোড...' : 'Search name, roll, pass...'}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D8CCB9] text-xs"
                  />
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white border border-[#E4DACB] overflow-x-auto">
                {isSeedMode ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-[#5C524A] mb-3">
                      {lang === 'bn'
                        ? 'লাইভ উপস্থিতি তালিকা চালু করতে প্রথমে উপরের বাটন থেকে প্রাথমিক ডাটাবেস যুক্ত করুন।'
                        : 'Click "Initialize Festival & Gallery Database" above to activate live Firestore attendance rosters.'}
                    </p>
                  </div>
                ) : filteredRegs.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-sm text-[#5C524A] mb-3">
                      {lang === 'bn'
                        ? 'এই উৎসবের জন্য এখনো কোনো নিবন্ধন নেই। তাৎক্ষণিক উপস্থিতি যোগ করুন অথবা সদস্যদের নিবন্ধনের জন্য অপেক্ষা করুন।'
                        : 'No registrations recorded for this event yet. Log a walk-in attendee or wait for campus registrations.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowWalkInModal(true)}
                      className="px-4 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] cursor-pointer"
                    >
                      {lang === 'bn' ? 'প্রথম উপস্থিতি নথিভুক্ত করুন' : 'Log First Attendee'}
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E4DACB] bg-[#F8F4EC] text-[#5C524A]">
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'পাস কোড' : 'Pass'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'নাম ও রোল' : 'Attendee & Roll'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'হোস্টেল ও ফোন' : 'Hostel & Phone'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'ভোগ ও অতিথি' : 'Meal & Guests'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'স্থিতি' : 'Status'}</th>
                        <th className="py-2.5 px-3 font-semibold text-right">{lang === 'bn' ? 'উপস্থিতি নিয়ন্ত্রণ' : 'Check-In Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E9DE]">
                      {filteredRegs.map((reg) => (
                        <tr key={reg.id} className="hover:bg-[#FBF9F5]">
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#A61C24] whitespace-nowrap">
                            {formatLocalizedNumber(reg.passCode, lang)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-[#1C1714]">{reg.fullName}</div>
                            <div className="text-[#6E6054]">
                              {reg.rollNumber} · {reg.department}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[#1C1714]">{reg.hostel}</div>
                            <div className="text-[#6E6054] tabular-nums-bengali">{reg.phone}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[#1C1714]">{LABELS.foodPrefs[reg.foodPreference][lang]}</div>
                            <div className="text-[#6E6054] tabular-nums-bengali">
                              {lang === 'bn'
                                ? `+${formatLocalizedNumber(reg.guestCount, 'bn')} অতিথি`
                                : `+${reg.guestCount} guest(s)`}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`font-semibold ${
                                reg.attendanceStatus === 'present'
                                  ? 'text-[#16A34A]'
                                  : reg.attendanceStatus === 'absent' || reg.attendanceStatus === 'cancelled'
                                    ? 'text-[#DC2626]'
                                    : 'text-[#B87314]'
                              }`}
                            >
                              {LABELS.attendanceStatuses[reg.attendanceStatus][lang]}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAttendance(
                                  reg,
                                  reg.attendanceStatus === 'present' ? 'registered' : 'present'
                                )
                              }
                              className={`px-2.5 py-1 text-[11px] font-medium border cursor-pointer ${
                                reg.attendanceStatus === 'present'
                                  ? 'bg-[#16A34A] text-white border-[#16A34A]'
                                  : 'bg-white text-[#16A34A] border-[#16A34A] hover:bg-[#16A34A]/10'
                              }`}
                            >
                              {reg.attendanceStatus === 'present'
                                ? lang === 'bn'
                                  ? 'উপস্থিত ✓'
                                  : 'Present ✓'
                                : lang === 'bn'
                                  ? 'উপস্থিত চিহ্নিত করুন'
                                  : 'Mark Present'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateAttendance(reg, 'absent')}
                              className="px-2 py-1 text-[11px] border border-[#D8CCB9] text-[#5C524A] hover:text-[#DC2626] cursor-pointer"
                            >
                              {lang === 'bn' ? 'অনুপস্থিত' : 'Absent'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRegistration(reg)}
                              aria-label="Delete registration"
                              className="p-1 text-[#7D6E61] hover:text-[#DC2626] align-middle cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MEMBERSHIP RECORDS MANAGER */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center p-1 bg-[#EFE8DC] border border-[#E4DACB]">
                    {(['all', 'active', 'pending', 'alumni'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setMemStatusFilter(st)}
                        className={`px-3 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                          memStatusFilter === st
                            ? 'bg-white text-[#A61C24]'
                            : 'text-[#5C524A] hover:text-[#1C1714]'
                        }`}
                      >
                        {st === 'all'
                          ? lang === 'bn'
                            ? 'সব সদস্য'
                            : 'All'
                          : LABELS.membershipStatuses[st][lang]}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-60">
                    <Search className="w-3.5 h-3.5 text-[#7D6E61] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={memSearch}
                      onChange={(e) => setMemSearch(e.target.value)}
                      placeholder={lang === 'bn' ? 'নাম, রোল, জেলা...' : 'Search member...'}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D8CCB9] text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সদস্য যোগ করুন' : 'Add Member'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={filteredMembers.length === 0}
                    onClick={handleExportMembersCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#D8CCB9] text-xs font-medium text-[#1C1714] hover:bg-[#F4EFE6] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'CSV ডাউনলোড' : 'Export CSV'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E4DACB] overflow-x-auto">
                {filteredMembers.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#5C524A]">
                    {lang === 'bn'
                      ? 'ডাটাবেসে কোনো সদস্য নথি নেই। নতুন সদস্য যোগ করুন বা প্রাথমিক ডাটা যুক্ত করুন।'
                      : 'No member records stored in Firestore yet. Add a member or initialize seed data.'}
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E4DACB] bg-[#F8F4EC] text-[#5C524A]">
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'সদস্যের নাম' : 'Member'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'রোল ও হোস্টেল (গোপনীয়)' : 'Roll & Hostel (Private)'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'ফোন ও ইমেইল' : 'Contact'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'কমিটি স্তর' : 'Role Tier'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'সদস্যপদ' : 'Status'}</th>
                        <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'চাঁদা (Chanda)' : 'Dues'}</th>
                        <th className="py-2.5 px-3 font-semibold text-right">{lang === 'bn' ? 'মুছুন' : 'Del'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E9DE]">
                      {filteredMembers.map((m) => {
                        const priv = allMembersPrivate[m.id];
                        return (
                          <tr key={m.id} className="hover:bg-[#FBF9F5]">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#1C1714]">
                                {m.nameBn} / {m.nameEn}
                              </div>
                              <div className="text-[#6E6054]">
                                {m.department} · {formatLocalizedNumber(m.batch, lang)} ·{' '}
                                {lang === 'bn' ? m.hometownBn : m.hometownEn}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-[#1C1714]">{priv?.rollNumber || '—'}</div>
                              <div className="text-[#6E6054]">{priv?.hostel || '—'}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-[#1C1714]">{priv?.phone || '—'}</div>
                              <div className="text-[#6E6054] truncate max-w-[170px]">{priv?.email || '—'}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={m.committeeTier}
                                onChange={(e) =>
                                  handleUpdateMemberTier(m.id, e.target.value as CommitteeTier)
                                }
                                className="px-2 py-1 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                              >
                                <option value="committee">{LABELS.committeeTiers.committee[lang]}</option>
                                <option value="faculty">{LABELS.committeeTiers.faculty[lang]}</option>
                                <option value="member">{LABELS.committeeTiers.member[lang]}</option>
                                <option value="alumni">{LABELS.committeeTiers.alumni[lang]}</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              <select
                                value={m.membershipStatus}
                                onChange={(e) =>
                                  handleUpdateMemberStatus(m.id, e.target.value as MembershipStatus)
                                }
                                className="px-2 py-1 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                              >
                                <option value="active">{LABELS.membershipStatuses.active[lang]}</option>
                                <option value="pending">{LABELS.membershipStatuses.pending[lang]}</option>
                                <option value="alumni">{LABELS.membershipStatuses.alumni[lang]}</option>
                              </select>
                            </td>
                            <td className="py-2.5 px-3">
                              {priv ? (
                                <select
                                  value={priv.chandaStatus}
                                  onChange={(e) =>
                                    handleUpdateChanda(m.id, e.target.value as ChandaStatus)
                                  }
                                  className="px-2 py-1 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                                >
                                  <option value="paid">{LABELS.chandaStatuses.paid[lang]}</option>
                                  <option value="pending">{LABELS.chandaStatuses.pending[lang]}</option>
                                  <option value="exempt">{LABELS.chandaStatuses.exempt[lang]}</option>
                                </select>
                              ) : (
                                <span className="text-[#7D6E61]">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id)}
                                aria-label="Delete member"
                                className="p-1 text-[#7D6E61] hover:text-[#DC2626] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-editorial text-xl font-bold text-[#1C1714]">
                  {lang === 'bn' ? 'উৎসব ও খাদ্য মেলা তালিকা' : 'Festival & Food Fest Schedule'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নতুন উৎসব তৈরি করুন' : 'Create Festival Event'}</span>
                </button>
              </div>

              <div className="bg-white border border-[#E4DACB] divide-y divide-[#F0E9DE]">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-12 shrink-0 overflow-hidden border border-[#E4DACB] bg-[#1C1714]">
                        <SafeImage src={ev.imageUrl} alt={ev.titleEn} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-editorial text-base font-bold text-[#1C1714] truncate">
                          {lang === 'bn' ? ev.titleBn : ev.titleEn}
                        </p>
                        <p className="text-xs text-[#6E6054] tabular-nums-bengali">
                          {lang === 'bn' ? ev.dateBn : ev.dateEn} ·{' '}
                          {formatLocalizedNumber(ev.registeredCount, lang)} /{' '}
                          {formatLocalizedNumber(ev.capacity, lang)}
                        </p>
                      </div>
                    </div>

                    {!isSeedMode && (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <select
                          value={ev.status}
                          onChange={(e) => handleUpdateEventStatus(ev, e.target.value as EventStatus)}
                          className="px-2.5 py-1.5 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                        >
                          <option value="open">{lang === 'bn' ? 'নিবন্ধন খোলা' : 'Open'}</option>
                          <option value="closed">{lang === 'bn' ? 'নিবন্ধন বন্ধ' : 'Closed'}</option>
                          <option value="completed">{lang === 'bn' ? 'সম্পন্ন' : 'Completed'}</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev)}
                          aria-label="Delete event"
                          className="p-1.5 text-[#7D6E61] hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: GALLERY & ADMIN ACCESS */}
          {activeTab === 'gallery_admins' && (
            <div className="space-y-8">
              {/* Gallery Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-xl font-bold text-[#1C1714]">
                    {lang === 'bn' ? 'সাংস্কৃতিক গ্যালারি পরিচালনা' : 'Cultural Gallery Archive'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowAddGalleryModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A61C24] text-white text-xs font-medium hover:bg-[#88151C] cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ছবি যুক্ত করুন' : 'Add Gallery Photo'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allGallery.map((g) => (
                    <div key={g.id} className="bg-white border border-[#E4DACB] overflow-hidden">
                      <div className="aspect-[4/3] bg-[#1C1714]">
                        <SafeImage src={g.imageUrl} alt={g.titleEn} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1C1714] truncate">
                            {lang === 'bn' ? g.titleBn : g.titleEn}
                          </p>
                          <p className="text-[11px] text-[#6E6054]">
                            {LABELS.galleryCategories[g.category][lang]}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(g.id)}
                          aria-label="Delete gallery item"
                          className="p-1 text-[#7D6E61] hover:text-[#DC2626] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Committee Admins RBAC Section */}
              <div className="bg-white border border-[#E4DACB] p-6 space-y-4">
                <h2 className="font-editorial text-xl font-bold text-[#1C1714]">
                  {lang === 'bn' ? 'কমিটি প্রশাসক তালিকা (RBAC)' : 'Committee Administrators'}
                </h2>
                <p className="text-xs text-[#5C524A]">
                  {lang === 'bn'
                    ? `প্রধান প্রশাসক: ${BOOTSTRAPPED_ADMIN_EMAIL}। অন্যান্য কমিটি সদস্যদের Firebase UID যোগ করে প্রশাসনিক অধিকার প্রদান করুন।`
                    : `Primary Admin: ${BOOTSTRAPPED_ADMIN_EMAIL}. Grant committee admin privileges by adding a member's Firebase UID.`}
                </p>

                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <input
                    type="text"
                    required
                    value={newAdminUid}
                    onChange={(e) => setNewAdminUid(e.target.value)}
                    placeholder="Firebase UID"
                    className="px-3 py-2 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder={lang === 'bn' ? 'সদস্যের নাম' : 'Admin Name'}
                    className="px-3 py-2 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                  />
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="email@iiti.ac.in"
                    className="px-3 py-2 bg-[#FBF9F5] border border-[#D8CCB9] text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1C1714] text-white text-xs font-medium hover:bg-[#332B26] cursor-pointer"
                  >
                    {lang === 'bn' ? 'প্রশাসক যোগ করুন' : 'Grant Admin'}
                  </button>
                </form>

                {adminRecords.length > 0 && (
                  <div className="divide-y divide-[#F0E9DE] border-t border-[#E4DACB] pt-2">
                    {adminRecords.map((adm) => (
                      <div key={adm.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-[#1C1714]">{adm.displayName}</span>
                          <span className="text-[#6E6054] ml-2">{adm.email}</span>
                          <span className="text-[#8B7D70] ml-2 font-mono">({adm.uid})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeAdmin(adm.id)}
                          className="text-[#DC2626] hover:underline cursor-pointer"
                        >
                          {lang === 'bn' ? 'প্রত্যাহার' : 'Revoke'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Log Walk-in Registration */}
      {showWalkInModal && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E4DACB]">
              <h3 className="font-editorial text-xl font-bold text-[#1C1714]">
                {lang === 'bn' ? 'তাৎক্ষণিক উপস্থিতি নিবন্ধন' : 'Log Walk-in Attendee'}
              </h3>
              <button type="button" onClick={() => setShowWalkInModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWalkIn} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder={lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'} value={wiName} onChange={(e) => setWiName(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder={lang === 'bn' ? 'রোল / আইডি *' : 'Roll / ID *'} value={wiRoll} onChange={(e) => setWiRoll(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder={lang === 'bn' ? 'বিভাগ' : 'Department'} value={wiDept} onChange={(e) => setWiDept(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder={lang === 'bn' ? 'হোস্টেল' : 'Hostel'} value={wiHostel} onChange={(e) => setWiHostel(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder={lang === 'bn' ? 'ফোন নম্বর *' : 'Phone *'} value={wiPhone} onChange={(e) => setWiPhone(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input type="email" placeholder="Email" value={wiEmail} onChange={(e) => setWiEmail(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select value={wiFood} onChange={(e) => setWiFood(e.target.value as FoodPreference)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="veg_bhog">{LABELS.foodPrefs.veg_bhog[lang]}</option>
                  <option value="nonveg_feast">{LABELS.foodPrefs.nonveg_feast[lang]}</option>
                  <option value="both">{LABELS.foodPrefs.both[lang]}</option>
                </select>
                <select value={wiRole} onChange={(e) => setWiRole(e.target.value as VolunteerRole)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="attendee">{LABELS.volunteerRoles.attendee[lang]}</option>
                  <option value="bhog_seva">{LABELS.volunteerRoles.bhog_seva[lang]}</option>
                  <option value="pujo_setup">{LABELS.volunteerRoles.pujo_setup[lang]}</option>
                </select>
                <input type="number" min={0} max={5} value={wiGuests} onChange={(e) => setWiGuests(Number(e.target.value))} placeholder="Guests" className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowWalkInModal(false)} className="px-4 py-2 text-[#5C524A] cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 bg-[#A61C24] text-white font-medium cursor-pointer">
                  {lang === 'bn' ? 'উপস্থিত হিসেবে সংরক্ষণ' : 'Save & Check In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Member Record */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-xl my-8">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E4DACB]">
              <h3 className="font-editorial text-xl font-bold text-[#1C1714]">
                {lang === 'bn' ? 'নতুন সদস্য নথিভুক্ত করুন' : 'Add Member Record'}
              </h3>
              <button type="button" onClick={() => setShowAddMemberModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMemberRecord} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder={lang === 'bn' ? 'নাম (বাংলায়) *' : 'Name (BN) *'} value={amNameBn} onChange={(e) => setAmNameBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder={lang === 'bn' ? 'নাম (ইংরেজিতে) *' : 'Name (EN) *'} value={amNameEn} onChange={(e) => setAmNameEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input required placeholder={lang === 'bn' ? 'পদবী (বাংলা)' : 'Role (BN)'} value={amRoleBn} onChange={(e) => setAmRoleBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder={lang === 'bn' ? 'পদবী (ইংরেজি)' : 'Role (EN)'} value={amRoleEn} onChange={(e) => setAmRoleEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <select value={amTier} onChange={(e) => setAmTier(e.target.value as CommitteeTier)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="member">{LABELS.committeeTiers.member[lang]}</option>
                  <option value="committee">{LABELS.committeeTiers.committee[lang]}</option>
                  <option value="faculty">{LABELS.committeeTiers.faculty[lang]}</option>
                  <option value="alumni">{LABELS.committeeTiers.alumni[lang]}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Department" value={amDept} onChange={(e) => setAmDept(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Batch (e.g., B.Tech 2027)" value={amBatch} onChange={(e) => setAmBatch(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder={lang === 'bn' ? 'আদি নিবাস (বাংলা)' : 'Hometown (BN)'} value={amHomeBn} onChange={(e) => setAmHomeBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder={lang === 'bn' ? 'আদি নিবাস (ইংরেজি)' : 'Hometown (EN)'} value={amHomeEn} onChange={(e) => setAmHomeEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Cultural Interest (BN)" value={amInterestBn} onChange={(e) => setAmInterestBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Cultural Interest (EN)" value={amInterestEn} onChange={(e) => setAmInterestEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E4DACB]">
                <input required placeholder="Roll / ID *" value={amRoll} onChange={(e) => setAmRoll(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Hostel *" value={amHostel} onChange={(e) => setAmHostel(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input required placeholder="Phone *" value={amPhone} onChange={(e) => setAmPhone(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input type="email" required placeholder="Email *" value={amEmail} onChange={(e) => setAmEmail(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <select value={amChanda} onChange={(e) => setAmChanda(e.target.value as ChandaStatus)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="paid">{LABELS.chandaStatuses.paid[lang]}</option>
                  <option value="pending">{LABELS.chandaStatuses.pending[lang]}</option>
                  <option value="exempt">{LABELS.chandaStatuses.exempt[lang]}</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 text-[#5C524A] cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 bg-[#A61C24] text-white font-medium cursor-pointer">
                  {lang === 'bn' ? 'সদস্য সংরক্ষণ করুন' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Festival Event */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E4DACB]">
              <h3 className="font-editorial text-xl font-bold text-[#1C1714]">
                {lang === 'bn' ? 'নতুন উৎসব প্রকাশ করুন' : 'Create Festival Event'}
              </h3>
              <button type="button" onClick={() => setShowAddEventModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="উৎসবের নাম (বাংলায়) *" value={evTitleBn} onChange={(e) => setEvTitleBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Event Title (English) *" value={evTitleEn} onChange={(e) => setEvTitleEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select value={evCategory} onChange={(e) => setEvCategory(e.target.value as EventCategory)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="pujo">{LABELS.categories.pujo[lang]}</option>
                  <option value="food">{LABELS.categories.food[lang]}</option>
                  <option value="cultural">{LABELS.categories.cultural[lang]}</option>
                </select>
                <input type="date" required value={evIsoDate} onChange={(e) => setEvIsoDate(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input type="number" min={10} max={5000} required value={evCapacity} onChange={(e) => setEvCapacity(Number(e.target.value))} placeholder="Capacity" className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="বাংলা তারিখ (যেমন: ১৫ অগ্রহায়ণ, ১৪৩৩)" value={evDateBn} onChange={(e) => setEvDateBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="English Date" value={evDateEn} onChange={(e) => setEvDateEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="সময় (বাংলা)" value={evTimeBn} onChange={(e) => setEvTimeBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Time (English)" value={evTimeEn} onChange={(e) => setEvTimeEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="স্থান (বাংলা)" value={evVenueBn} onChange={(e) => setEvVenueBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Venue (English)" value={evVenueEn} onChange={(e) => setEvVenueEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <textarea required rows={2} placeholder="বিবরণ (বাংলায়) *" value={evDescBn} onChange={(e) => setEvDescBn(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9]" />
              <textarea required rows={2} placeholder="Description (English) *" value={evDescEn} onChange={(e) => setEvDescEn(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9]" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="ভোগ / মেনু (বাংলা)" value={evBhogBn} onChange={(e) => setEvBhogBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input placeholder="Bhog / Menu (English)" value={evBhogEn} onChange={(e) => setEvBhogEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div>
                <label className="block text-[#5C524A] mb-1">{lang === 'bn' ? 'ক্যাম্পাস ছবি নির্বাচন' : 'Select Featured Campus Photo'}</label>
                <select value={evImageUrl} onChange={(e) => setEvImageUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9]">
                  {PHOTO_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {lang === 'bn' ? p.labelBn : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddEventModal(false)} className="px-4 py-2 text-[#5C524A] cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 bg-[#A61C24] text-white font-medium cursor-pointer">
                  {lang === 'bn' ? 'প্রকাশ করুন' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Gallery Photo */}
      {showAddGalleryModal && (
        <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E4DACB]">
              <h3 className="font-editorial text-xl font-bold text-[#1C1714]">
                {lang === 'bn' ? 'গ্যালারিতে ছবি যুক্ত করুন' : 'Add Gallery Photograph'}
              </h3>
              <button type="button" onClick={() => setShowAddGalleryModal(false)} className="cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGalleryItem} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="শিরোনাম (বাংলা) *" value={galTitleBn} onChange={(e) => setGalTitleBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required placeholder="Title (English) *" value={galTitleEn} onChange={(e) => setGalTitleEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <textarea required rows={2} placeholder="বিবরণ (বাংলা) *" value={galCaptionBn} onChange={(e) => setGalCaptionBn(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9]" />
              <textarea required rows={2} placeholder="Caption (English) *" value={galCaptionEn} onChange={(e) => setGalCaptionEn(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9]" />
              <div className="grid grid-cols-3 gap-3">
                <select value={galCategory} onChange={(e) => setGalCategory(e.target.value as GalleryCategory)} className="px-2 py-2 bg-white border border-[#D8CCB9]">
                  <option value="kali_pujo">{LABELS.galleryCategories.kali_pujo[lang]}</option>
                  <option value="fanush_lights">{LABELS.galleryCategories.fanush_lights[lang]}</option>
                  <option value="pratima_jatra">{LABELS.galleryCategories.pratima_jatra[lang]}</option>
                  <option value="durga_saraswati">{LABELS.galleryCategories.durga_saraswati[lang]}</option>
                  <option value="food_fest">{LABELS.galleryCategories.food_fest[lang]}</option>
                </select>
                <input required value={galYearBn} onChange={(e) => setGalYearBn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required value={galYearEn} onChange={(e) => setGalYearEn(e.target.value)} className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input required value={galLocBn} onChange={(e) => setGalLocBn(e.target.value)} placeholder="Location (BN)" className="px-3 py-2 bg-white border border-[#D8CCB9]" />
                <input required value={galLocEn} onChange={(e) => setGalLocEn(e.target.value)} placeholder="Location (EN)" className="px-3 py-2 bg-white border border-[#D8CCB9]" />
              </div>
              <input required value={galPhotoBy} onChange={(e) => setGalPhotoBy(e.target.value)} placeholder="Photographer Credit" className="w-full px-3 py-2 bg-white border border-[#D8CCB9]" />
              <div>
                <label className="block text-[#5C524A] mb-1">{lang === 'bn' ? 'ক্যাম্পাস ছবি বা ইউআরএল' : 'Select Campus Photo or URL'}</label>
                <select value={galUrl} onChange={(e) => setGalUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#D8CCB9] mb-2">
                  {PHOTO_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {lang === 'bn' ? p.labelBn : p.labelEn}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddGalleryModal(false)} className="px-4 py-2 text-[#5C524A] cursor-pointer">
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button type="submit" className="px-5 py-2 bg-[#A61C24] text-white font-medium cursor-pointer">
                  {lang === 'bn' ? 'সংরক্ষণ করুন' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
