import React from 'react';

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  switch (name) {
    case 'echo':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="3" fill="currentColor" />
          <path d="M3 20c0-4 4-7 9-7s9 3 9 7" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'puzzle':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" fill="currentColor" />
          <rect x="14" y="3" width="7" height="7" fill="currentColor" opacity="0.9" />
        </svg>
      );
    case 'flower':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2c1.2 2.4 4 3 6 2s3 3 2 5-1 3-3 3-4-1-5-3-3 1-5 3-3 0-3-3 2-6 5-6 1.8-1.6 3-1z" fill="currentColor" />
        </svg>
      );
    case 'world':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="currentColor" opacity="0.95" />
        </svg>
      );
    case 'progress':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6" cy="12" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
          <circle cx="18" cy="12" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'events':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.08" />
          <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    default:
      return <span className={className}>•</span>;
  }
};

export default Icon;