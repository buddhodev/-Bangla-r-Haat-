import React from 'react';

export function AlpanaDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 my-8 ${className}`} aria-hidden="true">
      <div className="h-px flex-1 bg-[#E4DACB]" />
      <svg
        width="124"
        height="22"
        viewBox="0 0 124 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#A61C24] shrink-0"
      >
        {/* Central 8-petal Bengali Padma (Lotus) Alpana */}
        <path
          d="M62 2C64.2 6.2 66 8.5 66 11C66 13.5 64.2 15.8 62 20C59.8 15.8 58 13.5 58 11C58 8.5 59.8 6.2 62 2Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M62 11C65.5 7 70 5.5 73 7.5C71.5 10.5 68 12.2 62 11Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path
          d="M62 11C58.5 7 54 5.5 51 7.5C52.5 10.5 56 12.2 62 11Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path
          d="M62 11C65.5 15 70 16.5 73 14.5C71.5 11.5 68 9.8 62 11Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <path
          d="M62 11C58.5 15 54 16.5 51 14.5C52.5 11.5 56 9.8 62 11Z"
          stroke="currentColor"
          strokeWidth="1.1"
        />
        <circle cx="62" cy="11" r="2" fill="currentColor" />
        {/* Symmetric Kalka / Rice-paste Alpana swirls */}
        <path
          d="M44 11C41 6.5 34 6.5 31 11C34 15.5 41 15.5 44 11ZM31 11C26 11 21 8.5 15 11C21 13.5 26 11 31 11Z"
          stroke="#B87314"
          strokeWidth="1.1"
        />
        <path
          d="M80 11C83 6.5 90 6.5 93 11C90 15.5 83 15.5 80 11ZM93 11C98 11 103 8.5 109 11C103 13.5 98 11 93 11Z"
          stroke="#B87314"
          strokeWidth="1.1"
        />
        <circle cx="8" cy="11" r="1.5" fill="currentColor" />
        <circle cx="116" cy="11" r="1.5" fill="currentColor" />
        <circle cx="47.5" cy="11" r="1.2" fill="#B87314" />
        <circle cx="76.5" cy="11" r="1.2" fill="#B87314" />
      </svg>
      <div className="h-px flex-1 bg-[#E4DACB]" />
    </div>
  );
}

export function AlpanaLotusMark({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.55" />
      <circle cx="32" cy="32" r="23" stroke="currentColor" strokeWidth="1.1" opacity="0.85" />
      <path
        d="M32 10C35.5 17 37.5 23 32 32C26.5 23 28.5 17 32 10Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M32 54C35.5 47 37.5 41 32 32C26.5 41 28.5 47 32 54Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M10 32C17 28.5 23 26.5 32 32C23 37.5 17 35.5 10 32Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M54 32C47 28.5 41 26.5 32 32C41 37.5 47 35.5 54 32Z"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M16.5 16.5C23 19.5 27.5 23 32 32C23 27.5 19.5 23 16.5 16.5Z"
        stroke="#B87314"
        strokeWidth="1.1"
      />
      <path
        d="M47.5 16.5C41 19.5 36.5 23 32 32C41 27.5 44.5 23 47.5 16.5Z"
        stroke="#B87314"
        strokeWidth="1.1"
      />
      <path
        d="M16.5 47.5C23 44.5 27.5 41 32 32C23 36.5 19.5 41 16.5 47.5Z"
        stroke="#B87314"
        strokeWidth="1.1"
      />
      <path
        d="M47.5 47.5C41 44.5 36.5 41 32 32C41 36.5 44.5 41 47.5 47.5Z"
        stroke="#B87314"
        strokeWidth="1.1"
      />
      <circle cx="32" cy="32" r="3.5" fill="currentColor" />
    </svg>
  );
}

export function AlpanaBorderStrip() {
  return (
    <div className="w-full overflow-hidden border-y border-[#E4DACB] bg-[#F6F0E6] py-1.5" aria-hidden="true">
      <svg
        className="w-full h-3 text-[#A61C24]/55"
        preserveAspectRatio="none"
        viewBox="0 0 1200 16"
        fill="none"
      >
        {Array.from({ length: 40 }).map((_, idx) => {
          const x = idx * 30;
          return (
            <g key={idx} transform={`translate(${x}, 0)`}>
              <path
                d="M0 8 Q7.5 1 15 8 Q22.5 15 30 8"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="15" cy="8" r="1.4" fill="#B87314" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
