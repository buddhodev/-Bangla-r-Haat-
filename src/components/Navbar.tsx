import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Menu, X } from 'lucide-react';
import { AppSection, Language } from '../types';
import { LABELS } from '../utils/i18n';

interface NavbarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  user: User | null;
  isAdmin: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function Navbar({
  activeSection,
  onNavigate,
  lang,
  onToggleLang,
  user,
  isAdmin,
  onSignIn,
  onSignOut,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { id: AppSection; label: string }[] = [
    { id: 'home', label: LABELS.nav.home[lang] },
    { id: 'events', label: LABELS.nav.events[lang] },
    { id: 'members', label: LABELS.nav.members[lang] },
    { id: 'gallery', label: LABELS.nav.gallery[lang] },
    { id: 'admin', label: LABELS.nav.admin[lang] },
  ];

  const handleNavClick = (section: AppSection) => {
    onNavigate(section);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E4DACB]">
      {/* Strict 3-Zone Top Bar Contract: [Brand one-line] — [5 single-line nav links] — [1 primary action] */}
      <header className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="font-editorial text-2xl font-bold tracking-tight text-[#A61C24] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A61C24]"
        >
          {LABELS.brand[lang]}
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-[15px] font-medium text-[#4A4038]"
        >
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#A61C24] font-semibold'
                    : 'text-[#4A4038] hover:text-[#1C1714]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#A61C24]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action (plus mobile menu icon on small screens) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('events')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-[#A61C24] text-white hover:bg-[#88151C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'bn' ? 'উৎসবে নিবন্ধন' : 'Register Now'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 text-[#1C1714] hover:text-[#A61C24] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Operational Cultural Ribbon: Panjika info + Bilingual Switcher (বাংলা | English) + Account */}
      <div className="border-t border-[#ECE4D7] bg-[#F4EFE6]/90">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-[#5C524A]">
          <span className="truncate">{LABELS.campusRibbon[lang]}</span>

          <div className="flex items-center gap-4 shrink-0">
            {/* Bilingual Language Switcher */}
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex items-center border border-[#D8CCB9] bg-white p-0.5"
            >
              <button
                type="button"
                onClick={() => onToggleLang('bn')}
                className={`px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-[#A61C24] text-white'
                    : 'text-[#4A4038] hover:text-[#1C1714]'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`px-2.5 py-0.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#A61C24] text-white'
                    : 'text-[#4A4038] hover:text-[#1C1714]'
                }`}
              >
                English
              </button>
            </div>

            <span className="text-[#C7B9A4]" aria-hidden="true">|</span>

            {user ? (
              <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
                <span className="text-[#1C1714] font-medium max-w-[150px] truncate">
                  {user.displayName || user.email}
                </span>
                {isAdmin && (
                  <span className="text-[#A61C24] font-medium">
                    · {LABELS.auth.adminTag[lang]}
                  </span>
                )}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-[#5C524A] underline underline-offset-2 hover:text-[#A61C24] cursor-pointer"
                >
                  {LABELS.auth.signOut[lang]}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="text-[#1C1714] font-medium underline underline-offset-2 hover:text-[#A61C24] whitespace-nowrap shrink-0 cursor-pointer"
              >
                {LABELS.auth.signIn[lang]}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-[#E4DACB] bg-[#FBF9F5] px-4 py-3 flex flex-col gap-1"
        >
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F4EFE6] text-[#A61C24] font-semibold'
                    : 'text-[#1C1714] hover:bg-[#F4EFE6]/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
