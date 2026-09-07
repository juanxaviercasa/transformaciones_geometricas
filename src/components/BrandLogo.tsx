import React from 'react';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ISOTIPO GEOMÉTRICO DINÁMICO */}
      <div className="relative group cursor-pointer">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition duration-300" />
        <div className="relative flex items-center justify-center h-9 w-9 rounded-2xl bg-surface border border-border shadow-md overflow-hidden p-1.5">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
              <linearGradient id="gtGradPre" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="gtGradPost" x1="16" y1="16" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#d946ef" />
              </linearGradient>
              <linearGradient id="gtRay" x1="10" y1="20" x2="30" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Triángulo Preimagen F (Azul / Índigo) */}
            <polygon points="6,30 18,8 24,26" fill="url(#gtGradPre)" fillOpacity="0.85" stroke="#2563eb" strokeWidth="1.5" />

            {/* Triángulo Transformado F' (Violeta / Fucsia translúcido) */}
            <polygon points="16,34 32,12 36,28" fill="url(#gtGradPost)" fillOpacity="0.7" stroke="#a855f7" strokeWidth="1.5" />

            {/* Vector o Eje de Simetría Dinámico */}
            <line x1="8" y1="32" x2="34" y2="10" stroke="url(#gtRay)" strokeWidth="1.8" strokeDasharray="3 2" />

            {/* Vértices brillantes */}
            <circle cx="18" cy="8" r="2.2" fill="#60a5fa" stroke="#ffffff" strokeWidth="1" />
            <circle cx="32" cy="12" r="2.2" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
            <circle cx="21" cy="21" r="1.8" fill="#fbbf24" />
          </svg>
        </div>
      </div>

      {/* LOGOTIPO TIPOGRÁFICO Y BADGE */}
      {!compact && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
              GeoTransform
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs">
              PRO
            </span>
          </div>
          <span className="text-[10px] font-medium text-ink-soft dark:text-ink-soft/80 tracking-normal leading-tight">
            Laboratorio de Geometría Dinámica
          </span>
        </div>
      )}
    </div>
  );
};
