import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AppSection, CulturalEvent, GalleryItem, Language } from '../types';
import { formatLocalizedNumber } from '../utils/i18n';
import { CAMPUS_PHOTOS } from '../data/seedData';
import { AlpanaBorderStrip, AlpanaDivider, AlpanaLotusMark } from './AlpanaMotifs';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  lang: Language;
  events: CulturalEvent[];
  gallery: GalleryItem[];
  memberCount: number;
  onNavigate: (section: AppSection) => void;
  onSelectEventToRegister: (event: CulturalEvent) => void;
}

const HERITAGE_PILLARS = [
  {
    indexBn: '০১',
    indexEn: '01',
    titleBn: 'শারদীয়া দুর্গোৎসব',
    titleEn: 'Sharadiya Durga Pujo',
    descBn:
      'মহাষষ্ঠীর বোধন, অষ্টমীর পুষ্পাঞ্জলি, সন্ধিপূজা, ধুনুচি নাচ আর দশমীর সিঁদুর খেলায় আইআইটি ইন্দোর ক্যাম্পাসে বাংলার শরৎ।',
    descEn:
      'Bodhon, Ashtami Pushpanjali, 108-lamp Sandhi Pujo, Dhunuchi Naach, and Dashami Sindoor Khela bringing autumn Bengal to Simrol.',
    seasonBn: 'আশ্বিন মাস',
    seasonEn: 'Ashwin · October',
  },
  {
    indexBn: '০২',
    indexEn: '02',
    titleBn: 'কোজাগরী লক্ষ্মী পূজা',
    titleEn: 'Kojagori Lakshmi Pujo',
    descBn:
      'শরতের পূর্ণিমায় চালের গুঁড়োর আলপনা, শাঁখ-উলুধ্বনি, লক্ষ্মীর পাঁচালি পাঠ এবং নারকেল নাড়ু ও খিচুড়ি প্রসাদ।',
    descEn:
      'Hand-drawn rice-paste Alpana under the autumn full moon, conch shells, Pachali recitation, coconut naru, and khichuri prasad.',
    seasonBn: 'কার্তিক পূর্ণিমা',
    seasonEn: 'Kartik Full Moon',
  },
  {
    indexBn: '০৩',
    indexEn: '03',
    titleBn: 'শ্যামা পূজা ও দীপাবলি',
    titleEn: 'Shyama Kali Pujo & Dipaboli',
    descBn:
      'শোলার সাজে মা কালীর মধ্যরাত্রির আরাধনা, সিমরোলের রাতের আকাশে ফানুস ওড়ানো, তুবড়ি আর নিশি-রাতের মহাভোগ।',
    descEn:
      'Midnight Dakshina Kali worship in Sholar Saaj, community sky-lanterns (Fanush) rising over Simrol, golden tubri, and midnight bhog.',
    seasonBn: 'কার্তিক অমাবস্যা',
    seasonEn: 'Kartik Amavasya',
  },
  {
    indexBn: '০৪',
    indexEn: '04',
    titleBn: 'শ্রীপঞ্চমী সরস্বতী পূজা',
    titleEn: 'Vasant Panchami Saraswati Pujo',
    descBn:
      'বাসন্তী রঙের শাড়ি-পাঞ্জাবি, সকালের অঞ্জলি, কুল মাখা, রবীন্দ্র-নজরুল গানের আসর ও প্রাণখোলা বাঙালি আড্ডা।',
    descEn:
      'Basanti sarees and punjabis, morning Pushpanjali for learning and arts, seasonal kul-makha, and Rabindra Sangeet recitals.',
    seasonBn: 'মাঘ শুক্ল পঞ্চমী',
    seasonEn: 'Magh · February',
  },
  {
    indexBn: '০৫',
    indexEn: '05',
    titleBn: 'বাংলার রসনা ও খাদ্য উৎসব',
    titleEn: 'Bengali Food Festival & Poush Parbon',
    descBn:
      'নলেন গুড়ের পাটিসাপটা, দুধ পুলি, কলকাতা বিরিয়ানি, লুচি-আলুর দম, কষা মাংস, ফুচকা ও রসগোল্লায় পুরো ক্যাম্পাসের মিলনমেলা।',
    descEn:
      'Nolen Gur Patishapta, Dudh Puli, Kolkata Biryani, Kosha Mangsho, Luchi-Aloor Dum, Phuchka, and hot Rosogolla shared with all of IITI.',
    seasonBn: 'পৌষ পার্বণ',
    seasonEn: 'Poush · January',
  },
];

export function HomeView({
  lang,
  events,
  gallery,
  memberCount,
  onNavigate,
  onSelectEventToRegister,
}: HomeViewProps) {
  const totalRegistrations = events.reduce((acc, ev) => acc + (ev.registeredCount || 0), 0);
  const featuredEvents = events.slice(0, 3);
  const previewPhotos = gallery.slice(0, 6);

  return (
    <div>
      {/* Editorial Exhibition Marquee Hero */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <div className="flex items-center gap-3 text-xs tracking-wider text-[#88151C] font-medium mb-5">
                <AlpanaLotusMark className="w-7 h-7 text-[#A61C24] shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আইআইটি ইন্দোর · বাঙালি সাংস্কৃতিক পরিবার · স্থাপিত ২০১৬'
                    : 'IIT Indore · Bengali Cultural Community · Est. 2016'}
                </span>
              </div>

              <h1 className="font-editorial text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[1.14] text-[#1C1714] mb-6">
                {lang === 'bn'
                  ? 'ইন্দোরের বুকে এক টুকরো বাংলার প্রাণের আসর'
                  : 'A Living Corner of Bengal at IIT Indore'}
              </h1>

              <p className="text-[16px] leading-[1.75] text-[#4A4038] max-w-[60ch] mb-8">
                {lang === 'bn'
                  ? 'বাংলার হাট হলো আইআইটি ইন্দোরের ছাত্রছাত্রী, গবেষক ও অধ্যাপকদের মিলিত বাঙালি সাংস্কৃতিক গোষ্ঠী। শারদীয়া দুর্গোৎসব, লক্ষ্মী পূজা, শ্যামা পূজার ফানুস, সরস্বতী পূজার অঞ্জলি থেকে পৌষ পার্বণের পিঠে-পুলি—ঘর থেকে বহুদূরে আমরা একসাথে গড়ে তুলি বাংলার উষ্ণতা, আড্ডা আর পার্বণের আনন্দ।'
                  : 'Banglaar Haat brings together students, scholars, and faculty at IIT Indore around the timeless rhythm of Bengal. From Sharadiya Durga Pujo, Kojagori Lakshmi Pujo, midnight Shyama Pujo with sky-lanterns, and Basanti Saraswati Pujo to authentic Bengali food festivals — we build a warm, close-knit campus home.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('events')}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors cursor-pointer"
              >
                <span>{lang === 'bn' ? 'আসন্ন উৎসবে নিবন্ধন করুন' : 'Register for Upcoming Events'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('gallery')}
                className="text-sm font-medium text-[#1C1714] underline underline-offset-4 decoration-[#B87314] hover:text-[#A61C24] transition-colors cursor-pointer py-2"
              >
                {lang === 'bn' ? 'সাংস্কৃতিক গ্যালারি দেখুন' : 'Explore Cultural Archive'}
              </button>
            </div>
          </div>

          {/* Right Archival Photo Composition (2 authentic IIT Indore photos) */}
          <div className="lg:col-span-6 grid grid-cols-12 gap-4 items-stretch min-h-[380px] lg:min-h-[460px]">
            <figure className="col-span-7 relative overflow-hidden border border-[#E4DACB] bg-[#1C1714]">
              <SafeImage
                src={CAMPUS_PHOTOS.kaliPratima}
                alt={lang === 'bn' ? 'আইআইটি ইন্দোর শ্যামা পূজার মা কালীর প্রতিমা' : 'Maa Kali Pratima at IIT Indore Banglaar Haat'}
                className="w-full h-full object-cover object-top"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 text-white">
                <p className="text-xs opacity-85">
                  {lang === 'bn' ? 'চিত্র ০১ · ১৪৩৩ বঙ্গাব্দ' : 'Plate 01 · Year 1433 BS'}
                </p>
                <p className="font-editorial text-sm font-semibold mt-0.5">
                  {lang === 'bn' ? 'শোলার সাজে মা শ্যামা, আইআইটি ইন্দোর' : 'Maa Shyama in Sholar Saaj, IIT Indore'}
                </p>
              </figcaption>
            </figure>

            <div className="col-span-5 flex flex-col gap-4">
              <figure className="flex-1 relative overflow-hidden border border-[#E4DACB] bg-[#1C1714]">
                <SafeImage
                  src={CAMPUS_PHOTOS.fanushSaree}
                  alt={lang === 'bn' ? 'দীপাবলির রাতে ফানুস ওড়ানো' : 'Sky lantern release during Dipaboli at IIT Indore'}
                  className="w-full h-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
                  <p className="font-editorial text-xs font-medium">
                    {lang === 'bn' ? 'দীপাবলির ফানুস উৎসব' : 'Dipaboli Fanush Night'}
                  </p>
                </figcaption>
              </figure>

              <figure className="flex-1 relative overflow-hidden border border-[#E4DACB] bg-[#1C1714]">
                <SafeImage
                  src={CAMPUS_PHOTOS.pratimaJatra}
                  alt={lang === 'bn' ? 'প্রতিমা আগমন যাত্রায় আইআইটি ইন্দোর দলবল' : 'IIT Indore Bengali community volunteers during Pratima Agomon'}
                  className="w-full h-full object-cover"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
                  <p className="font-editorial text-xs font-medium">
                    {lang === 'bn' ? 'প্রতিমা আগমন ও দলবল' : 'Pratima Agomon Team'}
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Community Strip (Tabular Bengali/English Numerals) */}
        <div className="mt-10 pt-8 border-t border-[#E4DACB] grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="font-editorial text-3xl font-bold text-[#A61C24] tabular-nums-bengali">
              {formatLocalizedNumber(events.length, lang)}
            </p>
            <p className="text-xs text-[#5C524A] mt-1">
              {lang === 'bn' ? 'বার্ষিক প্রধান পূজা ও খাদ্য উৎসব' : 'Annual Pujos & Food Festivals'}
            </p>
          </div>
          <div>
            <p className="font-editorial text-3xl font-bold text-[#1C1714] tabular-nums-bengali">
              {formatLocalizedNumber(memberCount, lang)}+
            </p>
            <p className="text-xs text-[#5C524A] mt-1">
              {lang === 'bn' ? 'নথিভুক্ত ক্যাম্পাস সদস্য ও প্রাক্তনী' : 'Registered Campus Members'}
            </p>
          </div>
          <div>
            <p className="font-editorial text-3xl font-bold text-[#1C1714] tabular-nums-bengali">
              {formatLocalizedNumber(totalRegistrations, lang)}
            </p>
            <p className="text-xs text-[#5C524A] mt-1">
              {lang === 'bn' ? 'চলতি বর্ষের উৎসব নিবন্ধন' : 'Current Season Registrations'}
            </p>
          </div>
          <div>
            <p className="font-editorial text-3xl font-bold text-[#1C1714] tabular-nums-bengali">
              {formatLocalizedNumber(gallery.length, lang)}
            </p>
            <p className="text-xs text-[#5C524A] mt-1">
              {lang === 'bn' ? 'সাংস্কৃতিক আলোকচিত্র সংকলন' : 'Curated Cultural Photographs'}
            </p>
          </div>
        </div>
      </section>

      <AlpanaBorderStrip />

      {/* Section 2: বারো মাসে তেরো পার্বণ — Five Signature Bengali Campus Traditions */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-medium tracking-wider text-[#A61C24] mb-2">
            {lang === 'bn' ? 'বারো মাসে তেরো পার্বণ · ঐতিহ্যের ধারা' : 'Annual Bengali Calendar · Campus Traditions'}
          </p>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1714]">
            {lang === 'bn'
              ? 'আমাদের পাঁচটি প্রধান উৎসব ও রসনা-মেলা'
              : 'Five Signature Festivities & Culinary Gatherings'}
          </h2>
        </div>

        <div className="divide-y divide-[#E4DACB] border-y border-[#E4DACB]">
          {HERITAGE_PILLARS.map((item) => (
            <div
              key={item.indexEn}
              className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline hover:bg-[#F4EFE6]/50 transition-colors px-2"
            >
              <div className="md:col-span-1 font-editorial text-xl font-bold text-[#A61C24] tabular-nums-bengali">
                {lang === 'bn' ? item.indexBn : item.indexEn}.
              </div>
              <div className="md:col-span-4">
                <h3 className="font-editorial text-xl font-semibold text-[#1C1714]">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </h3>
                <p className="text-xs text-[#7D6E61] mt-1">
                  {lang === 'bn' ? item.seasonBn : item.seasonEn}
                </p>
              </div>
              <div className="md:col-span-7 text-sm leading-relaxed text-[#4A4038]">
                {lang === 'bn' ? item.descBn : item.descEn}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Upcoming Festivals Highlight */}
      <section className="bg-[#F4EFE6]/70 border-y border-[#E4DACB] py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium tracking-wider text-[#A61C24] mb-2">
                {lang === 'bn' ? 'আসন্ন অনুষ্ঠানসূচি · বঙ্গাব্দ ১৪৩৩' : 'Upcoming Schedule · Season 2026–27'}
              </p>
              <h2 className="font-editorial text-3xl font-bold text-[#1C1714]">
                {lang === 'bn' ? 'আসন্ন পূজা ও খাদ্য উৎসব' : 'Upcoming Pujos & Food Festivals'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-sm font-medium text-[#A61C24] hover:underline underline-offset-4 cursor-pointer"
            >
              {lang === 'bn' ? 'সকল উৎসব দেখুন →' : 'View All Events →'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {featuredEvents.map((ev) => (
              <article
                key={ev.id}
                className="bg-white border border-[#E4DACB] flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] overflow-hidden bg-[#1C1714] border-b border-[#E4DACB]">
                    <SafeImage
                      src={ev.imageUrl}
                      alt={lang === 'bn' ? ev.titleBn : ev.titleEn}
                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[#7D6E61] mb-2">
                      <span>{lang === 'bn' ? ev.dateBn : ev.dateEn}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {formatLocalizedNumber(ev.registeredCount, lang)} /{' '}
                        {formatLocalizedNumber(ev.capacity, lang)}{' '}
                        {lang === 'bn' ? 'জন' : 'seats'}
                      </span>
                    </p>
                    <h3 className="font-editorial text-xl font-bold text-[#1C1714] mb-2.5">
                      {lang === 'bn' ? ev.titleBn : ev.titleEn}
                    </h3>
                    <p className="text-sm text-[#4A4038] leading-relaxed line-clamp-3">
                      {lang === 'bn' ? ev.descriptionBn : ev.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-[#F0E9DE]">
                  <span className="text-xs text-[#6E6054] truncate max-w-[55%]">
                    {lang === 'bn' ? ev.venueBn : ev.venueEn}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectEventToRegister(ev)}
                    className="text-sm font-semibold text-[#A61C24] hover:text-[#88151C] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {lang === 'bn' ? 'নাম নথিভুক্ত করুন →' : 'Register →'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Editorial Pull Quote & Authentic Photo Strip */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <AlpanaDivider className="mt-0 mb-8" />
          <blockquote className="font-editorial italic text-2xl sm:text-3xl text-[#1C1714] leading-relaxed">
            {lang === 'bn'
              ? '“ঢাকের কাঠি, শিউলির গন্ধ আর ফানুসের আলোয় — দূর প্রবাসেও জেগে থাকে আমাদের চিরন্তন বাংলা।”'
              : '“Through the beat of the dhak, autumn shiuli, and rising dipaboli lanterns — Bengal stays warmly alive miles from home.”'}
          </blockquote>
          <p className="text-xs text-[#7D6E61] mt-4">
            {lang === 'bn'
              ? '— বাংলার হাট, আইআইটি ইন্দোর বাঙালি সাংস্কৃতিক গোষ্ঠী'
              : '— Banglaar Haat, Bengali Cultural Community of IIT Indore'}
          </p>
          <AlpanaDivider className="mt-8 mb-12" />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-[#A61C24] mb-1">
              {lang === 'bn' ? 'স্মৃতির অ্যালবাম' : 'Campus Visual Chronicle'}
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1714]">
              {lang === 'bn' ? 'আইআইটি ইন্দোরে আমাদের উৎসবের মুহূর্ত' : 'Moments from Our IIT Indore Celebrations'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('gallery')}
            className="text-sm font-medium text-[#A61C24] hover:underline underline-offset-4 cursor-pointer"
          >
            {lang === 'bn' ? 'সম্পূর্ণ গ্যালারি দেখুন →' : 'Open Full Gallery →'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previewPhotos.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate('gallery')}
              className="group text-left bg-white border border-[#E4DACB] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A61C24]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#1C1714]">
                <SafeImage
                  src={item.imageUrl}
                  alt={lang === 'bn' ? item.titleBn : item.titleEn}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                />
              </div>
              <div className="p-3.5">
                <p className="text-[11px] text-[#7D6E61] tabular-nums-bengali">
                  {lang === 'bn'
                    ? `চিত্র ${formatLocalizedNumber(String(idx + 1).padStart(2, '0'), 'bn')} · ${item.yearBn}`
                    : `Fig. ${String(idx + 1).padStart(2, '0')} · ${item.yearEn}`}
                </p>
                <p className="font-editorial text-sm font-semibold text-[#1C1714] mt-0.5 truncate">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
