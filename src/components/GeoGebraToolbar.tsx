import React, { useEffect, useState, useRef } from 'react';
import {
  MousePointer,
  Hexagon,
  FlipHorizontal,
  Move,
  RotateCw,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  Shapes,
  Maximize,
  BookOpen,
  FileText,
  HelpCircle,
  History,
  ChevronDown,
  Target,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Download,
  FolderOpen,
  FileCode,
  X,
  Check
} from 'lucide-react';
import { ToolMode, TransformationType } from '../types/geometry';
import { BrandLogo } from './BrandLogo';

interface GeoGebraToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  activeTransformation: TransformationType;
  onSelectTransformation: (type: TransformationType) => void;
  onClearCanvas: () => void;
  onOpenPresets: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarTab: 'algebra' | 'notebook' | 'problem';
  onSelectSidebarTab: (tab: 'algebra' | 'notebook' | 'problem') => void;
  onOpenNotebook: () => void;
  onOpenProblem: () => void;
  onOpenTheory: () => void;
  onOpenHistory: () => void;
  onSaveHistory: () => void;
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleFullscreen: () => void;
  onExportPNG?: (fileName?: string, variant?: 'student' | 'teacher') => void;
  onExportPDF?: (variant?: 'student' | 'teacher') => void;
  onExportProjectJSON?: () => void;
  onLoadProject?: (file: File) => void;
}

export const GeoGebraToolbar: React.FC<GeoGebraToolbarProps> = ({
  activeTool,
  onSelectTool,
  activeTransformation,
  onSelectTransformation,
  onClearCanvas,
  onOpenPresets,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  isSidebarOpen,
  onToggleSidebar,
  sidebarTab,
  onSelectSidebarTab,
  onOpenNotebook,
  onOpenProblem,
  onOpenTheory,
  onOpenHistory,
  onSaveHistory,
  onOpenGuide,
  isDarkMode,
  onToggleDarkMode,
  onToggleFullscreen,
  onExportPNG,
  onExportPDF,
  onExportProjectJSON,
  onLoadProject
}) => {
  const [isTransformMenuOpen, setIsTransformMenuOpen] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [exportFileName, setExportFileName] = useState('geotransform');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSidebarOpen) setIsSaveMenuOpen(false);
  }, [isSidebarOpen]);


  const getTransformationIcon = (type: TransformationType) => {
    switch (type) {
      case 'translation':
        return <Move className="h-4 w-4" />;
      case 'reflection':
        return <FlipHorizontal className="h-4 w-4" />;
      case 'central_reflection':
        return <Target className="h-4 w-4" />;
      case 'rotation':
        return <RotateCw className="h-4 w-4" />;
      case 'homothety':
        return <Maximize2 className="h-4 w-4" />;
    }
  };

  const getTransformationLabel = (type: TransformationType) => {
    switch (type) {
      case 'translation':
        return 'Traslación';
      case 'reflection':
        return 'Simetría Axial';
      case 'central_reflection':
        return 'Simetría Central';
      case 'rotation':
        return 'Rotación';
      case 'homothety':
        return 'Homotecia';
    }
  };

  // Botonera de herramientas geométricas y transformaciones (reutilizada en desktop y mobile)
  const renderGeometryTools = () => (
    <>
      {/* Mover (Elige y Mueve) */}
      <button
        onClick={() => onSelectTool('select')}
        title="Elige y Mueve (Arrastra vértices, centros o el plano)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
          activeTool === 'select'
            ? 'bg-surface text-accent shadow-sm border border-border/80'
            : 'text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <MousePointer className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden xl:inline">Mover</span>
      </button>

      {/* Punto */}
      <button
        onClick={() => onSelectTool('point')}
        title="Punto (Haz clic en el plano para crear puntos libres sin unirlos)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
          activeTool === 'point'
            ? 'bg-surface text-accent shadow-sm border border-border/80'
            : 'text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-accent shrink-0" />
        <span className="hidden xl:inline">Punto</span>
      </button>

      {/* Segmento */}
      <button
        onClick={() => onSelectTool('segment')}
        title="Segmento (Haz clic en dos puntos para unirlos con una línea recta sin cerrar la figura)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
          activeTool === 'segment'
            ? 'bg-surface text-accent shadow-sm border border-border/80'
            : 'text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5" cy="19" r="2.5" fill="currentColor"/>
          <circle cx="19" cy="5" r="2.5" fill="currentColor"/>
          <line x1="7" y1="17" x2="17" y2="7"/>
        </svg>
        <span className="hidden xl:inline">Segmento</span>
      </button>

      {/* Polígono */}
      <button
        onClick={() => onSelectTool('polygon')}
        title="Polígono (Selecciona vértices en orden y haz clic en el primero para cerrar la figura)"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
          activeTool === 'polygon'
            ? 'bg-surface text-accent shadow-sm border border-border/80'
            : 'text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        <Hexagon className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden xl:inline">Polígono</span>
      </button>

      <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

      {/* BOTÓN SELECTOR DE TRANSFORMACIÓN */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsTransformMenuOpen(true)}
          title="Transformaciones Geométricas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition whitespace-nowrap cursor-pointer active:scale-95"
        >
          {getTransformationIcon(activeTransformation)}
          <span className="inline">{getTransformationLabel(activeTransformation)}</span>
          <ChevronDown className="h-3 w-3 opacity-70 shrink-0" />
        </button>
      </div>
    </>
  );

  // Botonera de acciones rápidas (Modelos, Limpiar, Guardar, Deshacer/Rehacer)
  const renderActionButtons = () => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onOpenPresets}
        title="Insertar Figura Modelo"
        className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-panel border border-border text-ink hover:border-accent hover:text-accent transition shrink-0"
      >
        <Shapes className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="hidden sm:inline">Modelos</span>
      </button>

      <button
        onClick={onOpenGuide}
        title="Guía Interactiva de Uso"
        className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition shrink-0"
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden md:inline">Guía de Uso</span>
      </button>

      <button
        onClick={onClearCanvas}
        title="Limpiar Pizarra (Lienzo Vacío)"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Limpiar</span>
      </button>

      <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Deshacer (Ctrl+Z)"
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-ink-soft hover:text-ink hover:bg-panel disabled:opacity-30 transition shrink-0"
      >
        <Undo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Deshacer</span>
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Rehacer (Ctrl+Y)"
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-ink-soft hover:text-ink hover:bg-panel disabled:opacity-30 transition shrink-0"
      >
        <Redo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Rehacer</span>
      </button>
    </div>
  );

  return (
    <header className="relative z-40 flex select-none flex-col border-b border-border bg-surface shadow-sm">
      {/* FILA 1: CABECERA SUPERIOR - BRANDING + MODOS DE APRENDIZAJE + ACCIONES DE ARCHIVO Y AJUSTES */}
      <div className="flex items-center justify-between gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 md:py-2 overflow-x-auto no-scrollbar">
        <div className="flex shrink-0 items-center gap-1.5">
          <BrandLogo className="hidden sm:flex" />
          <BrandLogo compact className="flex sm:hidden" />
        </div>

        {/* MODOS DE APRENDIZAJE: Cuaderno, Problemas, Teoría (integrados en Fila 1 tanto en móvil como en desktop para ahorrar espacio vertical) */}
        <div className="flex items-center rounded-xl border border-border bg-panel p-0.5 shadow-xs shrink-0">
          <button
            onClick={onOpenNotebook}
            title="Abrir cuaderno completo"
            className="rounded-lg px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-ink-soft transition hover:text-ink hover:bg-surface/80 active:scale-95"
          >
            Cuaderno
          </button>
          <button
            onClick={onOpenProblem}
            title="Abrir problemas inversos completos"
            className="rounded-lg px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-ink-soft transition hover:text-ink hover:bg-surface/80 active:scale-95"
          >
            Problemas
          </button>
          <button
            onClick={onOpenTheory}
            title="Abrir teoría completa"
            className="rounded-lg px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-ink-soft transition hover:text-ink hover:bg-surface/80 active:scale-95"
          >
            Teoría
          </button>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && onLoadProject) {
                onLoadProject(e.target.files[0]);
              }
              e.target.value = '';
            }}
            accept=".png,.geot,.json,image/png"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Abrir imagen PNG o archivo de proyecto (.geot)"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-panel p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-ink shadow-xs transition hover:border-accent hover:text-accent active:scale-95"
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="hidden sm:inline">Abrir</span>
          </button>

          <button
            onClick={() => {
              if (isSidebarOpen) onToggleSidebar();
              setIsSaveMenuOpen(true);
            }}
            title="Guardar / Exportar proyecto o imagen"
            className="flex shrink-0 items-center gap-1 rounded-xl bg-accent p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-accent/90 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Guardar</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-80" />
          </button>

          <div className="hidden h-4 w-px bg-border mx-0.5 shrink-0 sm:block" />

          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Cerrar panel' : 'Abrir panel'}
            className={`flex shrink-0 items-center gap-1 rounded-xl border p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold transition md:hidden ${
              isSidebarOpen
                ? 'border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                : 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
            }`}
          >
            {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4 text-accent" />}
            <span className="hidden sm:inline">{isSidebarOpen ? 'Cerrar' : 'Ver panel'}</span>
          </button>

          <button
            onClick={onOpenHistory}
            title="Historial de copias de seguridad locales"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-panel p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-ink shadow-xs transition hover:border-accent hover:text-accent active:scale-95"
          >
            <History className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span className="hidden sm:inline">Historial</span>
          </button>

          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Ocultar panel lateral' : 'Ver panel lateral'}
            className={`hidden shrink-0 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition md:flex ${
              isSidebarOpen
                ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
                : 'border-border bg-panel text-ink hover:border-accent hover:text-accent'
            }`}
          >
            {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            <span>{isSidebarOpen ? 'Ocultar' : 'Ver panel'}</span>
          </button>

          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-panel p-1.5 text-ink transition hover:border-accent hover:text-accent sm:p-2"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 hover:text-indigo-600 animate-in spin-in-180 duration-200" />
            )}
          </button>

          <button
            onClick={onToggleFullscreen}
            title="Pantalla completa del plano cartesiano"
            className="hidden shrink-0 rounded-xl border border-border bg-panel p-2 text-ink transition hover:border-border-strong hover:text-accent sm:flex"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FILA 2: BARRA DEDICADA DE HERRAMIENTAS GEOMÉTRICAS Y EDICIÓN */}
      <div className="flex items-center justify-start gap-1.5 sm:gap-2 border-t border-border/80 bg-panel/75 px-2 py-1 sm:px-3 sm:py-1.5 overflow-x-auto no-scrollbar lg:justify-center">
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-xs">
          {renderGeometryTools()}
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-xs">
          {renderActionButtons()}
        </div>
      </div>

      {/* MODAL GLOBAL: SELECTOR DE TRANSFORMACIÓN (100% RESPONSIVE, LIBRE DE OVERFLOW) */}
      {isTransformMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in duration-100"
            onClick={() => setIsTransformMenuOpen(false)}
          />
          <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 w-[92vw] max-w-[340px] z-50 rounded-3xl bg-surface border border-border shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
              <div>
                <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                  Tipo de Transformación
                </span>
                <span className="text-[10px] text-ink-soft">
                  Elige la transformación para la figura
                </span>
              </div>
              <button
                onClick={() => setIsTransformMenuOpen(false)}
                className="p-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {(
                [
                  { id: 'reflection', label: 'Simetría Axial', desc: 'Reflexión respecto a una recta L', icon: FlipHorizontal, badge: 'Isometría' },
                  { id: 'translation', label: 'Traslación', desc: 'Desplazamiento por vector v(dx, dy)', icon: Move, badge: 'Isometría' },
                  { id: 'rotation', label: 'Rotación', desc: 'Giro con centro C(h, k) y ángulo θ', icon: RotateCw, badge: 'Isometría' },
                  { id: 'central_reflection', label: 'Simetría Central', desc: 'Reflexión respecto a punto O(h, k)', icon: Target, badge: 'Isometría' },
                  { id: 'homothety', label: 'Homotecia', desc: 'Dilatación o contracción por factor k', icon: Maximize2, badge: 'Semejanza' }
                ] as const
              ).map(({ id, label, desc, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => {
                    onSelectTransformation(id);
                    setIsTransformMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full p-2.5 rounded-2xl text-left transition cursor-pointer active:scale-98 ${
                    activeTransformation === id
                      ? 'bg-accent text-white font-bold shadow-sm'
                      : 'text-ink hover:bg-panel active:bg-panel-hover'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 ${activeTransformation === id ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate">{label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${
                        activeTransformation === id ? 'bg-white/20 text-white' : 'bg-panel text-ink-faint border border-border'
                      }`}>
                        {badge}
                      </span>
                    </div>
                    <div className={`text-[10px] truncate ${activeTransformation === id ? 'text-white/80' : 'text-ink-soft'}`}>
                      {desc}
                    </div>
                  </div>
                  {activeTransformation === id && (
                    <Check className="h-4 w-4 text-white shrink-0 mr-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL GLOBAL: GUARDAR / EXPORTAR (100% RESPONSIVE, LIBRE DE OVERFLOW) */}
      {isSaveMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 animate-in fade-in duration-100"
            onClick={() => setIsSaveMenuOpen(false)}
          />
          <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-[92vw] max-w-[320px] z-50 rounded-3xl bg-surface border border-border shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-border">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                Guardar o Exportar
              </span>
              <button
                onClick={() => setIsSaveMenuOpen(false)}
                className="p-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block px-2 pb-2 font-sans text-[10px] font-semibold text-ink-soft">
              Nombre del archivo
              <input
                type="text"
                value={exportFileName}
                onChange={(event) => setExportFileName(event.target.value)}
                placeholder="Mi transformación"
                className="mt-1.5 w-full rounded-xl border border-border bg-panel px-2.5 py-2 font-mono text-xs text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  onSaveHistory();
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 shrink-0">
                  <History className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink">Guardar estado actual</div>
                  <div className="text-[10px] text-ink-soft truncate">Crea un punto de restauración en el historial</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (onExportPNG) onExportPNG(exportFileName, 'student');
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    PNG • Alumno <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">Ejercicio</span>
                  </div>
                  <div className="text-[10px] text-ink-soft truncate">Versión de trabajo para el estudiante</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (onExportPNG) onExportPNG(exportFileName, 'teacher');
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-500 shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    PNG • Profesor <span className="text-[9px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded font-mono">Guía</span>
                  </div>
                  <div className="text-[10px] text-ink-soft truncate">Versión con orientación didáctica</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (onExportProjectJSON) onExportProjectJSON();
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 shrink-0">
                  <FileCode className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink">Guardar Archivo (.geot)</div>
                  <div className="text-[10px] text-ink-soft truncate">Respaldo ligero de proyecto en JSON</div>
                </div>
              </button>

              <div className="h-px bg-border my-0.5" />

              <button
                onClick={() => {
                  if (onExportPDF) onExportPDF('student');
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink">PDF • Alumno</div>
                  <div className="text-[10px] text-ink-soft truncate">Hoja de ejercicio para imprimir o entregar</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (onExportPDF) onExportPDF('teacher');
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink">PDF • Profesor</div>
                  <div className="text-[10px] text-ink-soft truncate">Guía docente con orientación de resolución</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
