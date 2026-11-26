import React, { useState } from 'react';
import { AlpanaLotusMark } from './AlpanaMotifs';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({ src, alt, className = '', fallbackTitle }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F2ECE1] text-[#6E6054] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <AlpanaLotusMark className="w-12 h-12 text-[#A61C24]/70 mb-2" />
        <span className="text-xs font-medium tracking-wide">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
