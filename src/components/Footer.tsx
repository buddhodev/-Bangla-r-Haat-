import React from 'react';
import { AppSection, Language } from '../types';
import { LABELS } from '../utils/i18n';
import { AlpanaLotusMark } from './AlpanaMotifs';

interface FooterProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

export function Footer({ lang, onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-[#E4DACB] bg-[#F4EFE6] mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-6">
          <div className="flex items-center gap-3 mb-3">
            <AlpanaLotusMark className="w-8 h-8 text-[#A61C24]" />
            <span className="font-editorial text-2xl font-bold text-[#A61C24]">
              {LABELS.brand[lang]}
            </span>
          </div>
          <p className="text-sm text-[#4A4038] leading-relaxed max-w-md">
            {lang === 'bn'
              ? 'ভারতীয় প্রযুক্তিবিদ্যা প্রতিষ্ঠান ইন্দোর (আইআইটি ইন্দোর)-এর বাঙালি সাংস্কৃতিক গোষ্ঠী। শারদীয়া দুর্গোৎসব, লক্ষ্মী পূজা, শ্যামা পূজা, সরস্বতী পূজা ও বাঙালি খাদ্য উৎসবের মাধ্যমে ক্যাম্পাসে এক নিবিড় সাংস্কৃতিক বন্ধন।'
              : 'The Bengali Cultural Community of Indian Institute of Technology Indore. Fostering campus warmth through Durga Pujo, Lakshmi Pujo, Kali Pujo, Saraswati Pujo, and Bengali culinary gatherings.'}
          </p>
        </div>

        <div className="md:col-span-3">
          <h4 className="font-editorial text-sm font-bold text-[#1C1714] mb-3">
            {lang === 'bn' ? 'বিভাগসমূহ' : 'Sections'}
          </h4>
          <ul className="space-y-2 text-sm text-[#5C524A]">
            {(['home', 'events', 'members', 'gallery', 'admin'] as AppSection[]).map((sec) => (
              <li key={sec}>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(sec);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#A61C24] transition-colors cursor-pointer"
                >
                  {LABELS.nav[sec][lang]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h4 className="font-editorial text-sm font-bold text-[#1C1714] mb-3">
            {lang === 'bn' ? 'ক্যাম্পাস ঠিকানা' : 'Campus Location'}
          </h4>
          <p className="text-sm text-[#5C524A] leading-relaxed">
            {lang === 'bn'
              ? 'আইআইটি ইন্দোর, খান্ডোয়া রোড, সিমরোল, ইন্দোর – ৪৫৩৫৫২, মধ্যপ্রদেশ'
              : 'IIT Indore, Khandwa Road, Simrol, Indore – 453552, Madhya Pradesh'}
          </p>
        </div>
      </div>

      <div className="border-t border-[#E4DACB] py-4 px-4 sm:px-6 text-center text-xs text-[#6E6054]">
        {lang === 'bn'
          ? '© ১৪৩৩ বঙ্গাব্দ (২০২৬) বাংলার হাট · আইআইটি ইন্দোর বাঙালি সাংস্কৃতিক গোষ্ঠী'
          : '© 2026 (1433 BS) Banglaar Haat · Bengali Cultural Community of IIT Indore'}
      </div>
    </footer>
  );
}
