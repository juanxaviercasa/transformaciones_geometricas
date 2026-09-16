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
  FileCode
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

      {/* MENÚ DE TRANSFORMACIONES GEOGEBRA */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsTransformMenuOpen(!isTransformMenuOpen)}
          title="Transformaciones Geométricas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition whitespace-nowrap"
        >
          {getTransformationIcon(activeTransformation)}
          <span className="inline">{getTransformationLabel(activeTransformation)}</span>
          <ChevronDown className="h-3 w-3 opacity-70 shrink-0" />
        </button>

        {isTransformMenuOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-56 rounded-2xl bg-surface border border-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint px-2.5 py-1">
              Transformaciones Isométricas & Semejanza
            </div>
            {(
              [
                { id: 'reflection', label: 'Simetría Axial', desc: 'Refleja respecto a recta L', icon: FlipHorizontal },
                { id: 'translation', label: 'Traslación', desc: 'Desplaza según vector v', icon: Move },
                { id: 'rotation', label: 'Rotación', desc: 'Gira alrededor de centro C', icon: RotateCw },
                { id: 'central_reflection', label: 'Simetría Central', desc: 'Refleja respecto a punto O', icon: Target },
                { id: 'homothety', label: 'Homotecia', desc: 'Dilata/contrae por factor k', icon: Maximize2 }
              ] as const
            ).map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  onSelectTransformation(id);
                  setIsTransformMenuOpen(false);
                }}
                className={`flex items-start gap-2.5 w-full p-2 rounded-xl text-left transition ${
                  activeTransformation === id
                    ? 'bg-accent/10 text-accent font-bold'
                    : 'text-ink hover:bg-panel'
                }`}
              >
                <Icon className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-xs">{label}</div>
                  <div className="text-[10px] text-ink-soft">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
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
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition border border-transparent hover:border-rose-200 shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Limpiar</span>
      </button>
      
      {/* BOTÓN ABRIR (CARGAR IMAGEN O ARCHIVO DE PROYECTO) */}
      <div className="relative shrink-0">
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
          title="Abrir imagen PNG o archivo de proyecto (.geot) para reanudar el trabajo"
          className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-panel border border-border text-ink hover:text-accent hover:border-accent transition shrink-0 shadow-xs"
        >
          <FolderOpen className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="hidden sm:inline">Abrir</span>
        </button>
      </div>

      {/* BOTÓN GUARDAR (EXPORTAR) */}
      <div className="relative shrink-0">
        <button
          onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
          title="Guardar / Exportar proyecto o imagen"
          className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent/90 transition shadow-sm"
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Guardar</span>
          <ChevronDown className="h-3 w-3 opacity-80 shrink-0" />
        </button>
        {isSaveMenuOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-60 rounded-2xl bg-surface border border-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                if (onExportPNG) onExportPNG();
                setIsSaveMenuOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left text-ink hover:bg-panel transition text-xs font-medium"
            >
              <Download className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-ink flex items-center gap-1">
                  Guardar como PNG <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-1 py-0.5 rounded font-mono">Reanudable</span>
                </div>
                <div className="text-[10px] text-ink-soft truncate">Imagen con proyecto editable integrado</div>
              </div>
            </button>
            <button
              onClick={() => {
                if (onExportProjectJSON) onExportProjectJSON();
                setIsSaveMenuOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left text-ink hover:bg-panel transition text-xs font-medium mt-1"
            >
              <FileCode className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-ink">Guardar Archivo (.geot)</div>
                <div className="text-[10px] text-ink-soft truncate">Respaldo ligero de proyecto</div>
              </div>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => {
                if (onExportPDF) onExportPDF();
                setIsSaveMenuOpen(false);
              }}
              className="flex items-center gap-2.5 w-full p-2.5 rounded-xl text-left text-ink hover:bg-panel transition text-xs font-medium"
            >
              <FileText className="h-4 w-4 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-ink">Exportar como PDF</div>
                <div className="text-[10px] text-ink-soft truncate">Ficha pedagógica para imprimir</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border mx-0.5 shrink-0" />

      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Deshacer (Ctrl+Z)"
        className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs font-semibold text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition shrink-0"
      >
        <Undo2 className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Deshacer</span>
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Rehacer (Ctrl+Y)"
        className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs font-semibold text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 transition shrink-0"
      >
        <Redo2 className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">Rehacer</span>
      </button>
    </div>
  );

  return (
    <header className="relative z-40 flex flex-col bg-surface border-b border-border shadow-sm select-none">
      {/* FILA 1: BRANDING + NAVEGACIÓN Y CONTROLES GLOBALES */}
      <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5">
        {/* LOGO (COMPACTO EN PANTALLAS PEQUEÑAS, COMPLETO EN ESCRITORIO) */}
        <div className="flex items-center gap-2 shrink-0">
          <BrandLogo className="hidden sm:flex" />
          <BrandLogo compact className="flex sm:hidden" />
        </div>

        {/* HERRAMIENTAS EN ESCRITORIO (>= 1024px / lg:) */}
        <div className="hidden lg:flex items-center gap-2 flex-1 justify-center max-w-2xl">
          <div className="flex items-center gap-1 bg-panel p-1 rounded-xl border border-border shrink-0">
            {renderGeometryTools()}
          </div>
          {renderActionButtons()}
        </div>

        {/* LADO DERECHO: PESTAÑAS DE VISTA, TEORÍA Y ACCIONES RÁPIDAS */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Selector de Pestañas GeoTransform (Álgebra / Cuaderno / Problemas) en Escritorio */}
          <div className="hidden lg:flex rounded-xl bg-panel p-0.5 sm:p-1 border border-border">
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
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                isSidebarOpen && sidebarTab === 'algebra'
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Álgebra
            </button>
            <button
              onClick={() => {
                if (isSidebarOpen && sidebarTab === 'notebook') {
                  onToggleSidebar();
                } else {
                  onSelectSidebarTab('notebook');
                  if (!isSidebarOpen) onToggleSidebar();
                }
              }}
              title={isSidebarOpen && sidebarTab === 'notebook' ? 'Clic para ocultar panel' : 'Ver Cuaderno'}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                isSidebarOpen && sidebarTab === 'notebook'
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Cuaderno
            </button>
            <button
              onClick={() => {
                if (isSidebarOpen && sidebarTab === 'problem') {
                  onToggleSidebar();
                } else {
                  onSelectSidebarTab('problem');
                  if (!isSidebarOpen) onToggleSidebar();
                }
              }}
              title={isSidebarOpen && sidebarTab === 'problem' ? 'Clic para ocultar panel' : 'Ver Problemas Inversos'}
              className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                isSidebarOpen && sidebarTab === 'problem'
                  ? 'bg-surface text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Problemas
            </button>
          </div>

          {/* Botón Configurar en Móvil y Tablet (< 1024px) */}
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

          {/* Botón Zona de Teoría */}
          <button
            onClick={onOpenTheory}
            title="Abrir Zona de Teoría completa (Fórmulas, Propiedades y Gráficos)"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-panel border border-border text-ink hover:border-accent hover:text-accent shadow-sm text-xs font-bold transition shrink-0"
          >
            <BookOpen className="h-4 w-4 text-accent shrink-0" />
            <span className="hidden md:inline">Teoría</span>
          </button>

          {/* Botón Ocultar / Mostrar Panel Lateral en Escritorio */}
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

          {/* Botón Modo Oscuro / Modo Claro */}
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

          {/* Botón Pantalla Completa (F11) - Oculto en móviles para ahorrar espacio */}
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

      {/* FILA 2: SUB-BARRA DE HERRAMIENTAS HORIZONTAL FLUIDA PARA MÓVIL Y TABLET (< 1024px) */}
      <div className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-panel/70 border-t border-border/70 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border shrink-0 shadow-xs">
          {renderGeometryTools()}
        </div>
        {renderActionButtons()}
      </div>
    </header>
  );
};
