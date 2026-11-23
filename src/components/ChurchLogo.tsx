import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';
import defaultChurchLogo from '../assets/images/Logo_Gereja_Protestan_Indonesia_di_Papua.jpg';

export const ChurchLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const { data } = usePortal();
  const [imgError, setImgError] = useState(false);

  const dims =
    size === 'sm'
      ? 'h-9 w-9'
      : size === 'lg'
      ? 'h-16 w-16'
      : 'h-11 w-11';

  const rawLogo = data.profile.logoUrl;
  const logoSrc = (!rawLogo || rawLogo === '/icon.svg') ? defaultChurchLogo : rawLogo;

  if (imgError) {
    return (
      <img
        src={defaultChurchLogo}
        alt="Logo Gereja Protestan Indonesia di Papua"
        className={`${dims} shrink-0 rounded-full object-contain bg-white p-0.5 shadow-xs ring-1 ring-amber-500/30`}
      />
    );
  }

  return (
    <img
      src={logoSrc}
      alt="Logo Gereja Protestan Indonesia di Papua"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${dims} shrink-0 rounded-full object-contain bg-white p-0.5 shadow-xs ring-1 ring-amber-500/30`}
    />
  );
};

