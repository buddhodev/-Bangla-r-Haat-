import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
} from './firebase';
import {
  AppSection,
  CulturalEvent,
  EventRegistration,
  GalleryItem,
  Language,
  MemberPublicProfile,
} from './types';
import { INITIAL_EVENTS, INITIAL_GALLERY, INITIAL_MEMBERS } from './data/seedData';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { EventsView } from './components/EventsView';
import { MembersView } from './components/MembersView';
import { GalleryView } from './components/GalleryView';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [firestoreEvents, setFirestoreEvents] = useState<CulturalEvent[]>([]);
  const [firestoreMembers, setFirestoreMembers] = useState<MemberPublicProfile[]>([]);
  const [firestoreGallery, setFirestoreGallery] = useState<GalleryItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Record<string, EventRegistration>>({});
  const [preselectedEvent, setPreselectedEvent] = useState<CulturalEvent | null>(null);
  const [authBanner, setAuthBanner] = useState('');

  // Sync HTML lang attribute for screen readers and Bengali rendering
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Listen to Firebase Auth state & resolve RBAC admin status
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setMyRegistrations({});
        setAuthReady(true);
        return;
      }

      if (nextUser.emailVerified && nextUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setIsAdmin(true);
        setAuthReady(true);
        return;
      }

      try {
        const admSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAdmin(admSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthReady(true);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to public events, public member profiles, and public gallery items
  // Explicitly match security rules constraints on every list query
  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      where('status', 'in', ['open', 'closed', 'completed'])
    );
    const unsubEvents = onSnapshot(
      eventsQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<CulturalEvent, 'id'>) }))
          .sort((a, b) => a.isoDate.localeCompare(b.isoDate));
        setFirestoreEvents(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'events')
    );

    const membersQuery = query(
      collection(db, 'memberProfiles'),
      where('isPublic', '==', true)
    );
    const unsubMembers = onSnapshot(
      membersQuery,
      (snap) => {
        setFirestoreMembers(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MemberPublicProfile, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'memberProfiles')
    );

    const galleryQuery = query(
      collection(db, 'galleryItems'),
      where('isPublic', '==', true)
    );
    const unsubGallery = onSnapshot(
      galleryQuery,
      (snap) => {
        setFirestoreGallery(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GalleryItem, 'id'>) }))
        );
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'galleryItems')
    );

    return () => {
      unsubEvents();
      unsubMembers();
      unsubGallery();
    };
  }, []);

  // Load current user's own registrations via direct document reads (zero composite indexes, strict owner access)
  useEffect(() => {
    if (!authReady || !user || firestoreEvents.length === 0) {
      setMyRegistrations({});
      return;
    }

    let cancelled = false;
    async function loadMyRegs() {
      if (!user) return;
      const results: Record<string, EventRegistration> = {};
      await Promise.all(
        firestoreEvents.map(async (ev) => {
          try {
            const snap = await getDoc(doc(db, 'events', ev.id, 'registrations', user.uid));
            if (snap.exists()) {
              results[ev.id] = {
                id: snap.id,
                ...(snap.data() as Omit<EventRegistration, 'id'>),
              };
            }
          } catch {
            // Ignore missing or unauthorized doc
          }
        })
      );
      if (!cancelled) {
        setMyRegistrations(results);
      }
    }

    void loadMyRegs();
    return () => {
      cancelled = true;
    };
  }, [authReady, user, firestoreEvents]);

  const isSeedMode = firestoreEvents.length === 0;
  const activeEvents: CulturalEvent[] = isSeedMode ? INITIAL_EVENTS : firestoreEvents;
  const activeMembers: MemberPublicProfile[] =
    firestoreMembers.length > 0 ? firestoreMembers : INITIAL_MEMBERS;
  const activeGallery: GalleryItem[] =
    firestoreGallery.length > 0 ? firestoreGallery : INITIAL_GALLERY;

  const handleSignIn = async () => {
    setAuthBanner('');
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthBanner(
          lang === 'bn'
            ? 'প্রবেশ করতে সমস্যা হয়েছে। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে পুনরায় চেষ্টা করুন।'
            : 'Sign-in could not be completed. Please allow popups and try again.'
        );
      }
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleSelectEventToRegister = (ev: CulturalEvent) => {
    setPreselectedEvent(ev);
    setActiveSection('events');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1714]">
        <Navbar
          activeSection={activeSection}
          onNavigate={setActiveSection}
          lang={lang}
          onToggleLang={setLang}
          user={user}
          isAdmin={isAdmin}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

        {authBanner && (
          <div className="bg-[#A61C24]/10 border-b border-[#A61C24]/25 px-4 py-2 text-center text-xs text-[#88151C]">
            {authBanner}
          </div>
        )}

        <main className="flex-1">
          {activeSection === 'home' && (
            <HomeView
              lang={lang}
              events={activeEvents}
              gallery={activeGallery}
              memberCount={activeMembers.length}
              onNavigate={setActiveSection}
              onSelectEventToRegister={handleSelectEventToRegister}
            />
          )}

          {activeSection === 'events' && (
            <EventsView
              lang={lang}
              events={activeEvents}
              user={user}
              myRegistrations={myRegistrations}
              isSeedMode={isSeedMode}
              preselectedEvent={preselectedEvent}
              onClearPreselectedEvent={() => setPreselectedEvent(null)}
              onSignIn={handleSignIn}
              onRegistrationUpdated={(eventId, reg) =>
                setMyRegistrations((prev) => ({ ...prev, [eventId]: reg }))
              }
            />
          )}

          {activeSection === 'members' && (
            <MembersView
              lang={lang}
              members={activeMembers}
              user={user}
              onSignIn={handleSignIn}
              onProfileSaved={() => {}}
            />
          )}

          {activeSection === 'gallery' && (
            <GalleryView lang={lang} items={activeGallery} />
          )}

          {activeSection === 'admin' && (
            <AdminDashboard
              lang={lang}
              user={user}
              isAdmin={isAdmin}
              events={activeEvents}
              isSeedMode={isSeedMode}
              onSignIn={handleSignIn}
            />
          )}
        </main>

        <Footer lang={lang} onNavigate={setActiveSection} />
      </div>
    </ErrorBoundary>
  );
}
