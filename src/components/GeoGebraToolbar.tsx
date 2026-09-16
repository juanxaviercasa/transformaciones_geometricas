import React, { useState, useRef } from 'react';
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
  onOpenTheory: () => void;
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onExportPNG?: () => void;
  onExportPDF?: () => void;
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
  onOpenTheory,
  onOpenGuide,
  isDarkMode,
  onToggleDarkMode,
  onExportPNG,
  onExportPDF,
  onExportProjectJSON,
  onLoadProject
}) => {
  const [isTransformMenuOpen, setIsTransformMenuOpen] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


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
    <header className="relative z-40 flex flex-col bg-surface border-b border-border shadow-sm select-none">
      {/* FILA 1: CABECERA SUPERIOR - BRANDING + PESTAÑAS DE VISTA + ARCHIVO Y AJUSTES GLOBALES */}
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5">
        {/* LADO IZQUIERDO: LOGO (COMPLETAMENTE AISLADO, SIN SUPERPOSICIÓN) */}
        <div className="flex items-center gap-2 shrink-0 mr-1 sm:mr-2">
          <BrandLogo className="hidden sm:flex" />
          <BrandLogo compact className="flex sm:hidden" />
        </div>

        {/* CENTRO: SELECTOR DE VISTAS (ÁLGEBRA / CUADERNO / PROBLEMAS) EN PANTALLAS MD Y SUPERIORES */}
        <div className="hidden md:flex items-center rounded-xl bg-panel p-0.5 border border-border shrink-0 shadow-xs">
          <button
            onClick={() => {
              if (isSidebarOpen && sidebarTab === 'algebra') {
                onToggleSidebar();
              } else {
                onSelectSidebarTab('algebra');
                if (!isSidebarOpen) onToggleSidebar();
              }
            }}
            title={isSidebarOpen && sidebarTab === 'algebra' ? 'Clic para ocultar panel' : 'Ver Álgebra'}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              isSidebarOpen && sidebarTab === 'algebra'
                ? 'bg-surface text-accent shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Álgebra
          </button>
          <button
            onClick={() => {
              onSelectSidebarTab('notebook');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            title={isSidebarOpen && sidebarTab === 'notebook' ? 'Clic para ocultar panel' : 'Ver Cuaderno'}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              isSidebarOpen && sidebarTab === 'notebook'
                ? 'bg-surface text-accent shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Cuaderno
          </button>
          <button
            onClick={() => {
              onSelectSidebarTab('problem');
              if (!isSidebarOpen) onToggleSidebar();
            }}
            title={isSidebarOpen && sidebarTab === 'problem' ? 'Clic para ocultar panel' : 'Ver Problemas Inversos'}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              isSidebarOpen && sidebarTab === 'problem'
                ? 'bg-surface text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Problemas
          </button>
        </div>

        {/* LADO DERECHO: ACCIONES DE ARCHIVO, TEORÍA, MODO OSCURO Y PANTALLA COMPLETA */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* BOTÓN ABRIR PROYECTO O IMAGEN */}
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-panel border border-border text-ink hover:text-accent hover:border-accent transition shrink-0 shadow-xs cursor-pointer active:scale-95"
          >
            <FolderOpen className="h-3.5 w-3.5 text-accent shrink-0" />
            <span className="hidden sm:inline">Abrir</span>
          </button>

          {/* BOTÓN GUARDAR / EXPORTAR */}
          <button
            onClick={() => setIsSaveMenuOpen(true)}
            title="Guardar / Exportar proyecto o imagen"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition shadow-sm shrink-0 cursor-pointer active:scale-95"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Guardar</span>
            <ChevronDown className="h-3 w-3 opacity-80 shrink-0" />
          </button>

          <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

          {/* BOTÓN CONFIGURAR EN MÓVIL (< 1024px) */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Cerrar panel de configuración' : 'Abrir panel de configuración'}
            className={`lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shrink-0 ${
              isSidebarOpen
                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40'
                : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
            }`}
          >
            {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4 text-accent" />}
            <span>{isSidebarOpen ? 'Cerrar' : 'Configurar'}</span>
          </button>

          {/* BOTÓN ZONA DE TEORÍA */}
          <button
            onClick={onOpenTheory}
            title="Abrir Zona de Teoría completa (Fórmulas, Propiedades y Gráficos)"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-panel border border-border text-ink hover:border-accent hover:text-accent shadow-xs text-xs font-bold transition shrink-0"
          >
            <BookOpen className="h-4 w-4 text-accent shrink-0" />
            <span className="hidden md:inline">Teoría</span>
          </button>

          {/* BOTÓN OCULTAR / MOSTRAR PANEL LATERAL EN ESCRITORIO */}
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Ocultar panel lateral (Área máxima de pizarra)' : 'Mostrar panel lateral'}
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shrink-0 ${
              isSidebarOpen
                ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
                : 'bg-panel border-border text-ink hover:border-accent hover:text-accent'
            }`}
          >
            {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            <span>{isSidebarOpen ? 'Ocultar' : 'Ver Panel'}</span>
          </button>

          {/* MODO OSCURO */}
          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            className="p-1.5 sm:p-2 rounded-xl bg-panel border border-border text-ink hover:text-accent hover:border-accent transition flex items-center justify-center shrink-0"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600 hover:text-indigo-600 animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* PANTALLA COMPLETA */}
          <button
            onClick={() => {
              const docEl = document.documentElement as any;
              const doc = document as any;
              if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
                if (docEl.requestFullscreen) docEl.requestFullscreen().catch(() => {});
                else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
                else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen();
              } else {
                if (doc.exitFullscreen) doc.exitFullscreen().catch(() => {});
                else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
                else if (doc.msExitFullscreen) doc.msExitFullscreen();
              }
            }}
            title="Pantalla Completa"
            className="hidden sm:flex p-2 rounded-xl bg-panel text-ink border border-border hover:border-border-strong hover:text-accent transition shrink-0"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FILA 2: BARRA DEDICADA DE HERRAMIENTAS GEOMÉTRICAS Y EDICIÓN (DESKTOP, TABLET Y MÓVIL) */}
      <div className="flex items-center justify-start lg:justify-center gap-2 px-2.5 sm:px-3 py-1.5 bg-panel/75 border-t border-border/80 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shadow-xs shrink-0">
          {renderGeometryTools()}
        </div>
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shadow-xs shrink-0">
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

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  if (onExportPNG) onExportPNG();
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 shrink-0">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink flex items-center gap-1">
                    Guardar como PNG <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">Reanudable</span>
                  </div>
                  <div className="text-[10px] text-ink-soft truncate">Imagen con proyecto editable integrado</div>
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
                  if (onExportPDF) onExportPDF();
                  setIsSaveMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full p-2.5 rounded-2xl text-left text-ink hover:bg-panel transition cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 shrink-0">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-ink">Exportar como PDF</div>
                  <div className="text-[10px] text-ink-soft truncate">Ficha pedagógica para imprimir</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
