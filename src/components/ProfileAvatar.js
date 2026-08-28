import React, { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';

const SIZE_MAP = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-20 w-20 text-lg',
};

const ProfileAvatar = ({ avatarUrl, fullName, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const initials = useMemo(() => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  }, [fullName]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const showImage = avatarUrl && !imageError;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={avatarUrl}
          alt={fullName ? `${fullName} avatar` : 'Profilbild'}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : initials ? (
        <span className="font-semibold text-slate-700">{initials}</span>
      ) : (
        <UserRound size={18} className="text-slate-400" />
      )}
    </div>
  );
};

export default ProfileAvatar;
