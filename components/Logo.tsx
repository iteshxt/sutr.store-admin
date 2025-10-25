'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export default function Logo({ 
  className = "h-14 md:h-16 w-auto transition-all duration-200 hover:scale-110", 
  alt = "Sutr Logo",
  width = 200,
  height = 64,
}: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // Always use the light (white) logo for our black navbar and footer
  const src = imageError 
    ? '/images/logo/logo-light.svg'
    : 'https://res.cloudinary.com/dkau2pwup/image/upload/v1754753259/sutr-store/logo/logo-dark.svg';

  return (
    <div className="flex items-center h-full">
      <Image 
        src={src} 
        alt={alt} 
        className={className}
        width={width}
        height={height}
        style={{ maxHeight: '100%', width: 'auto', objectFit: 'contain' }}
        priority
        onError={() => setImageError(true)}
      />
    </div>
  );
}
