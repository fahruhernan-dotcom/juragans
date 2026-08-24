import React, { useState } from 'react';
import { Package } from 'lucide-react';

export default function ImageWithFallback({ src, alt, className, fallbackText, badgeText, loading }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-gradient-to-br from-brand-maroon/10 to-brand-maroon/5 border-2 border-dashed border-brand-maroon/20 text-center select-none p-6`}>
        <div className="w-14 h-14 bg-brand-maroon/10 text-brand-maroon rounded-full flex items-center justify-center mb-3">
          <Package className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-brand-maroon mb-1 font-sans">{fallbackText || 'Gambar Produk'}</p>
        <span className="text-[10px] tracking-wider uppercase bg-brand-gold/20 text-brand-maroon-dark px-2.5 py-0.5 rounded-full font-semibold">
          {badgeText || 'JURAGANS'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} transition-opacity duration-500 ease-in-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      loading={loading}
    />
  );
}
