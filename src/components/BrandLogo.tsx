import React, { useState } from 'react';
import { SYSTEM_LOGO_FALLBACKS, DEFAULT_MARESIA_LOGO } from '../lib/storage';

interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackList?: string[];
  containerClassName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  alt = 'Maresia Logo & Capa',
  className = 'w-full h-full object-cover',
  fallbackList = SYSTEM_LOGO_FALLBACKS,
  ...rest
}) => {
  // Compile the search order: given src, followed by all known system paths
  const candidateList = React.useMemo(() => {
    const list: string[] = [];
    if (src && !list.includes(src)) {
      list.push(src);
    }
    fallbackList.forEach((path) => {
      if (!list.includes(path)) {
        list.push(path);
      }
    });
    if (!list.includes('/logo/logo.svg')) {
      list.push('/logo/logo.svg');
    }
    return list;
  }, [src, fallbackList]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleError = () => {
    if (currentIndex < candidateList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const currentSrc = candidateList[currentIndex] || DEFAULT_MARESIA_LOGO;

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      className={className}
      {...rest}
    />
  );
};
