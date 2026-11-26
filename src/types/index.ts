import { Timestamp } from 'firebase/firestore';

export type Language = 'bn' | 'en';
export type AppSection = 'home' | 'events' | 'members' | 'gallery' | 'admin';

export type EventCategory = 'pujo' | 'food' | 'cultural';
export type EventStatus = 'open' | 'closed' | 'completed';
export type FoodPreference = 'veg_bhog' | 'nonveg_feast' | 'both';
export type VolunteerRole =
  | 'attendee'
  | 'pujo_setup'
  | 'bhog_seva'
  | 'cultural_program'
  | 'alpana_decor';
export type AttendanceStatus = 'registered' | 'present' | 'absent' | 'cancelled';
export type CommitteeTier = 'committee' | 'member' | 'alumni' | 'faculty';
export type MembershipStatus = 'active' | 'pending' | 'alumni';
export type ChandaStatus = 'paid' | 'pending' | 'exempt';
export type GalleryCategory =
  | 'kali_pujo'
  | 'fanush_lights'
  | 'pratima_jatra'
  | 'durga_saraswati'
  | 'food_fest';

export interface CulturalEvent {
  id: string;
  titleBn: string;
  titleEn: string;
  category: EventCategory;
  dateBn: string;
  dateEn: string;
  isoDate: string;
  timeBn: string;
  timeEn: string;
  venueBn: string;
  venueEn: string;
  descriptionBn: string;
  descriptionEn: string;
  bhogMenuBn: string;
  bhogMenuEn: string;
  imageUrl: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  fullName: string;
  rollNumber: string;
  department: string;
  hostel: string;
  phone: string;
  email: string;
  foodPreference: FoodPreference;
  guestCount: number;
  volunteerRole: VolunteerRole;
  attendanceStatus: AttendanceStatus;
  passCode: string;
  isWalkIn: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MemberPublicProfile {
  id: string;
  userId: string;
  nameBn: string;
  nameEn: string;
  roleTitleBn: string;
  roleTitleEn: string;
  committeeTier: CommitteeTier;
  department: string;
  batch: string;
  hometownBn: string;
  hometownEn: string;
  culturalInterestBn: string;
  culturalInterestEn: string;
  bioBn: string;
  bioEn: string;
  avatarUrl: string;
  membershipStatus: MembershipStatus;
  isPublic: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MemberPrivateRecord {
  id: string;
  userId: string;
  email: string;
  phone: string;
  rollNumber: string;
  hostel: string;
  chandaStatus: ChandaStatus;
  notes: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface GalleryItem {
  id: string;
  titleBn: string;
  titleEn: string;
  captionBn: string;
  captionEn: string;
  category: GalleryCategory;
  yearBn: string;
  yearEn: string;
  locationBn: string;
  locationEn: string;
  photographer: string;
  imageUrl: string;
  isPublic: boolean;
  featured: boolean;
  createdBy: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AdminRecord {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'committee_admin';
  addedBy: string;
  createdAt?: Timestamp | null;
}

// Validation helpers strictly synced with firebase-blueprint.json constraints
export const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const PASSCODE_PATTERN = /^[A-Z0-9-]+$/;

export function sanitizeText(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function generateSafeId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'doc';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanPrefix}-${Date.now().toString(36)}-${rand}`;
}

export function generatePassCode(eventSlug: string): string {
  const shortCode = eventSlug
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'B');
  const num = Math.floor(1000 + Math.random() * 9000);
  return `BH-${shortCode}-${num}`;
}
