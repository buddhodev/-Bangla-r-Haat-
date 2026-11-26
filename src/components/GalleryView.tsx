import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryCategory, GalleryItem, Language } from '../types';
import { formatLocalizedNumber, LABELS } from '../utils/i18n';
import { SafeImage } from './SafeImage';

interface GalleryViewProps {
  lang: Language;
  items: GalleryItem[];
}

export function GalleryView({ lang, items }: GalleryViewProps) {
  const [category, setCategory] = useState<'all' | GalleryCategory>('all');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered =
    category === 'all' ? items : items.filter((item) => item.category === category);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? null : (prev + 1) % filtered.length));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + filtered.length) % filtered.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, filtered.length]);

  const filterTabs: { id: 'all' | GalleryCategory; label: string }[] = [
    { id: 'all', label: LABELS.galleryCategories.all[lang] },
    { id: 'kali_pujo', label: LABELS.galleryCategories.kali_pujo[lang] },
    { id: 'fanush_lights', label: LABELS.galleryCategories.fanush_lights[lang] },
    { id: 'pratima_jatra', label: LABELS.galleryCategories.pratima_jatra[lang] },
    { id: 'durga_saraswati', label: LABELS.galleryCategories.durga_saraswati[lang] },
    { id: 'food_fest', label: LABELS.galleryCategories.food_fest[lang] },
  ];

  const activeItem = activeIndex !== null ? filtered[activeIndex] : null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E4DACB]">
        <div>
          <p className="text-xs font-medium tracking-wider text-[#A61C24] mb-2">
            {lang === 'bn'
              ? `সাংস্কৃতিক আলোকচিত্র আর্কাইভ · ${formatLocalizedNumber(items.length, 'bn')}টি চিত্র`
              : `Cultural Photography Archive · ${items.length} Plates`}
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1714]">
            {lang === 'bn' ? 'বাংলার হাট স্মৃতির গ্যালারি' : 'Cultural Gallery'}
          </h1>
          <p className="text-sm text-[#5C524A] mt-2 max-w-2xl">
            {lang === 'bn'
              ? 'আইআইটি ইন্দোর ক্যাম্পাসে উদযাপিত শ্যামা পূজা, ফানুস উৎসব, প্রতিমা আগমন ও দীপাবলির প্রামাণ্য আলোকচিত্র সংকলন।'
              : 'Documentary photographs from Shyama Pujo, Dipaboli sky-lantern nights, Pratima Agomon processions, and campus festivities at IIT Indore.'}
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-[#EFE8DC] border border-[#E4DACB] overflow-x-auto max-w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCategory(tab.id);
                setActiveIndex(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                category === tab.id
                  ? 'bg-white text-[#A61C24] shadow-xs'
                  : 'text-[#5C524A] hover:text-[#1C1714]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editorial Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 pt-10">
        {filtered.map((item, idx) => (
          <figure
            key={item.id}
            className="bg-white border border-[#E4DACB] group flex flex-col justify-between"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="text-left block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A61C24]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#1C1714] border-b border-[#E4DACB]">
                <SafeImage
                  src={item.imageUrl}
                  alt={lang === 'bn' ? item.titleBn : item.titleEn}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <figcaption className="p-5">
                <p className="text-[11px] text-[#7D6E61] mb-1.5 tabular-nums-bengali">
                  <span>
                    {lang === 'bn'
                      ? `সংকলন নং ${formatLocalizedNumber(String(idx + 1).padStart(2, '0'), 'bn')}`
                      : `Plate ${String(idx + 1).padStart(2, '0')}`}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span>{LABELS.galleryCategories[item.category][lang]}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{lang === 'bn' ? item.yearBn : item.yearEn}</span>
                </p>
                <h2 className="font-editorial text-xl font-bold text-[#1C1714] mb-1.5">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </h2>
                <p className="text-sm text-[#4A4038] leading-relaxed line-clamp-2">
                  {lang === 'bn' ? item.captionBn : item.captionEn}
                </p>
              </figcaption>
            </button>

            <div className="px-5 py-3 border-t border-[#F0E9DE] flex items-center justify-between text-xs text-[#6E6054]">
              <span className="truncate">{lang === 'bn' ? item.locationBn : item.locationEn}</span>
              <button
                type="button"
                onClick={() => setActiveIndex(idx)}
                className="text-[#A61C24] font-medium hover:underline whitespace-nowrap shrink-0 ml-2 cursor-pointer"
              >
                {lang === 'bn' ? 'বিস্তারিত →' : 'Inspect →'}
              </button>
            </div>
          </figure>
        ))}
      </div>

      {/* Museum Accession Lightbox Modal */}
      {activeItem && activeIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FBF9F5] border border-[#D8CCB9] w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 overflow-hidden max-h-[90vh]">
            {/* Image Viewport */}
            <div className="lg:col-span-8 bg-[#120F0D] relative flex items-center justify-center min-h-[300px] max-h-[65vh] lg:max-h-[85vh]">
              <SafeImage
                src={activeItem.imageUrl}
                alt={lang === 'bn' ? activeItem.titleBn : activeItem.titleEn}
                className="max-h-[65vh] lg:max-h-[85vh] w-full object-contain"
              />

              {filtered.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((activeIndex - 1 + filtered.length) % filtered.length)
                    }
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 text-white hover:bg-black/85 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((activeIndex + 1) % filtered.length)}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-black/60 text-white hover:bg-black/85 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Accession Metadata Panel */}
            <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-white overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <p className="text-xs font-medium text-[#A61C24] tabular-nums-bengali">
                    {lang === 'bn'
                      ? `আর্কাইভ চিত্র ${formatLocalizedNumber(activeIndex + 1, 'bn')} / ${formatLocalizedNumber(filtered.length, 'bn')}`
                      : `Archive Plate ${activeIndex + 1} / ${filtered.length}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(null)}
                    aria-label="Close lightbox"
                    className="p-1 text-[#5C524A] hover:text-[#1C1714] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="font-editorial text-2xl font-bold text-[#1C1714] mb-3">
                  {lang === 'bn' ? activeItem.titleBn : activeItem.titleEn}
                </h3>

                <p className="text-sm text-[#4A4038] leading-relaxed mb-6">
                  {lang === 'bn' ? activeItem.captionBn : activeItem.captionEn}
                </p>

                <dl className="divide-y divide-[#ECE4D7] border-y border-[#ECE4D7] text-xs">
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-[#7D6E61]">{lang === 'bn' ? 'উৎসব বিভাগ' : 'Category'}</dt>
                    <dd className="font-medium text-[#1C1714]">
                      {LABELS.galleryCategories[activeItem.category][lang]}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-[#7D6E61]">{lang === 'bn' ? 'বর্ষ' : 'Year'}</dt>
                    <dd className="font-medium text-[#1C1714]">
                      {lang === 'bn' ? activeItem.yearBn : activeItem.yearEn}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-[#7D6E61]">{lang === 'bn' ? 'স্থান' : 'Location'}</dt>
                    <dd className="font-medium text-[#1C1714] text-right">
                      {lang === 'bn' ? activeItem.locationBn : activeItem.locationEn}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-2">
                    <dt className="text-[#7D6E61]">{lang === 'bn' ? 'আলোকচিত্রী' : 'Credit'}</dt>
                    <dd className="font-medium text-[#1C1714]">{activeItem.photographer}</dd>
                  </div>
                </dl>
              </div>

              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="mt-6 w-full py-2.5 bg-[#1C1714] text-white text-sm font-medium hover:bg-[#332B26] cursor-pointer"
              >
                {lang === 'bn' ? 'গ্যালারিতে ফিরে যান' : 'Return to Gallery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
