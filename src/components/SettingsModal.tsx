import React from 'react';
import { X, Check, Grid, Eye, Moon, Sun, Palette, MousePointer2 } from 'lucide-react';
import { AppSettings } from '../types/geometry';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export function SettingsModal({ isOpen, onClose, settings, setSettings }: SettingsModalProps) {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div 
        className="bg-surface border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-panel">
          <h2 className="text-sm font-bold text-ink">Ajustes Globales</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-ink-faint hover:text-ink transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-4 overflow-y-auto max-h-[70vh] flex flex-col gap-6">
          
          {/* SECCIÓN 1: Preferencias de Dibujo */}
          <section>
            <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Preferencias de Dibujo</h3>
            <div className="space-y-4">
              {/* Tamaño de puntos */}
              <div>
                <label className="text-xs text-ink-soft mb-1.5 block">Tamaño de Puntos por Defecto</label>
                <div className="flex items-center gap-2 p-1 bg-panel rounded-xl">
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => updateSetting('pointSize', size as 'small' | 'medium' | 'large')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                        settings.pointSize === size ? 'bg-surface shadow text-accent' : 'text-ink-soft hover:bg-black/5'
                      }`}
                    >
                      {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Normal' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grosor de Línea */}
              <div>
                <label className="text-xs text-ink-soft mb-1.5 block">Grosor de Trazos</label>
                <div className="flex items-center gap-2 p-1 bg-panel rounded-xl">
                  {['thin', 'normal', 'thick'].map(thickness => (
                    <button
                      key={thickness}
                      onClick={() => updateSetting('lineThickness', thickness as 'thin' | 'normal' | 'thick')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                        settings.lineThickness === thickness ? 'bg-surface shadow text-accent' : 'text-ink-soft hover:bg-black/5'
                      }`}
                    >
                      {thickness === 'thin' ? 'Fino' : thickness === 'normal' ? 'Normal' : 'Grueso'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color por defecto */}
              <div>
                <label className="text-xs text-ink-soft mb-1.5 block">Color de Nuevos Puntos/Segmentos</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#1e293b', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateSetting('defaultColor', color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${
                        settings.defaultColor === color ? 'border-accent' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {settings.defaultColor === color && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* SECCIÓN 2: Comportamiento del Lienzo */}
          <section>
            <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Comportamiento del Lienzo</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-panel cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Atracción a la cuadrícula (Snap)</p>
                    <p className="text-xs text-ink-faint">Forzar puntos a coordenadas enteras</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.snapToGrid ? 'bg-accent' : 'bg-border-strong'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.snapToGrid ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={settings.snapToGrid} 
                  onChange={(e) => updateSetting('snapToGrid', e.target.checked)} 
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-panel cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">Mostrar etiquetas automáticamente</p>
                    <p className="text-xs text-ink-faint">Crear letras (A, B, C...) al dibujar</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.showLabels ? 'bg-accent' : 'bg-border-strong'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.showLabels ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={settings.showLabels} 
                  onChange={(e) => updateSetting('showLabels', e.target.checked)} 
                />
              </label>
            </div>
          </section>

          <hr className="border-border" />

          {/* SECCIÓN 3: Apariencia */}
          <section>
            <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-3">Apariencia</h3>
            <div className="space-y-4">
              {/* Tamaño de la Fuente (UI) */}
              <div>
                <label className="text-xs text-ink-soft mb-1.5 block">Tamaño de Textos y Controles</label>
                <div className="flex items-center gap-2 p-1 bg-panel rounded-xl">
                  {['normal', 'large', 'extra-large'].map(size => (
                    <button
                      key={size}
                      onClick={() => updateSetting('uiFontSize', size as 'normal' | 'large' | 'extra-large')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                        (settings.uiFontSize || 'normal') === size ? 'bg-surface shadow text-accent' : 'text-ink-soft hover:bg-black/5'
                      }`}
                    >
                      {size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Muy Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema Oscuro */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-panel cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  {settings.isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Tema Oscuro</p>
                  <p className="text-xs text-ink-faint">Proteger la vista en ambientes de poca luz</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.isDarkMode ? 'bg-accent' : 'bg-border-strong'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={settings.isDarkMode} 
                onChange={(e) => {
                  updateSetting('isDarkMode', e.target.checked);
                  // Apply to document immediately
                  if (e.target.checked) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                }} 
              />
              </label>
            </div>
          </section>

        </div>
        
        {/* FOOTER */}
        <div className="p-4 border-t border-border bg-panel flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-xl hover:bg-accent/90 transition shadow-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
