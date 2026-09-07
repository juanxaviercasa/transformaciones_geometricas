import React, { useState } from 'react';
import {
  MousePointer,
  Dot,
  Hexagon,
  FlipHorizontal,
  Move,
  RotateCw,
  Maximize2,
  Trash2,
  Undo2,
  Shapes,
  Maximize,
  Minimize,
  BookOpen,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Target,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen
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
  isCleanBoard: boolean;
  onToggleCleanBoard: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  sidebarTab: 'algebra' | 'notebook' | 'problem';
  onSelectSidebarTab: (tab: 'algebra' | 'notebook' | 'problem') => void;
  onOpenGuide: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
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
  isCleanBoard,
  onToggleCleanBoard,
  isSidebarOpen,
  onToggleSidebar,
  sidebarTab,
  onSelectSidebarTab,
  onOpenGuide,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [isTransformMenuOpen, setIsTransformMenuOpen] = useState(false);

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

  return (
    <header className="relative z-40 flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border shadow-sm select-none">
      {/* 1. BRANDING PROPIO: GEOTRANSFORM PRO */}
      <div className="flex items-center gap-2.5">
        <BrandLogo />
        <div className="h-5 w-px bg-border mx-1 hidden sm:block" />

        {/* 2. BARRA DE HERRAMIENTAS GEOMÉTRICAS (TOOLBAR) */}
        <div className="flex items-center gap-1 bg-panel p-1 rounded-xl border border-border">
          {/* Mover (Elige y Mueve) */}
          <button
            onClick={() => onSelectTool('select')}
            title="Elige y Mueve (Arrastra vértices, centros o el plano)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'select'
                ? 'bg-surface text-accent shadow-sm border border-border/80'
                : 'text-ink-soft hover:text-ink hover:bg-black/5'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Mover</span>
          </button>

          {/* Punto */}
          <button
            onClick={() => onSelectTool('point')}
            title="Punto (Haz clic en el plano cartesiano para crear puntos)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'point'
                ? 'bg-surface text-accent shadow-sm border border-border/80'
                : 'text-ink-soft hover:text-ink hover:bg-black/5'
            }`}
          >
            <div className="h-3 w-3 rounded-full bg-accent border-2 border-surface" />
            <span className="hidden md:inline">Punto</span>
          </button>

          {/* Polígono */}
          <button
            onClick={() => onSelectTool('polygon')}
            title="Polígono (Selecciona los vértices en orden y cierra en el primero)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTool === 'polygon'
                ? 'bg-surface text-accent shadow-sm border border-border/80'
                : 'text-ink-soft hover:text-ink hover:bg-black/5'
            }`}
          >
            <Hexagon className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Polígono</span>
          </button>

          <div className="h-4 w-px bg-border mx-0.5" />

          {/* MENÚ DE TRANSFORMACIONES GEOGEBRA */}
          <div className="relative">
            <button
              onClick={() => setIsTransformMenuOpen(!isTransformMenuOpen)}
              title="Transformaciones Geométricas"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition"
            >
              {getTransformationIcon(activeTransformation)}
              <span className="hidden md:inline">{getTransformationLabel(activeTransformation)}</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
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
        </div>

        {/* ACCIONES RÁPIDAS: MODELOS, LIMPIAR Y GUÍA */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPresets}
            title="Insertar Figura Modelo"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-panel border border-border text-ink hover:border-accent hover:text-accent transition"
          >
            <Shapes className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">Modelos</span>
          </button>

          <button
            onClick={onOpenGuide}
            title="Guía Interactiva de Uso"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guía de Uso</span>
          </button>

          <button
            onClick={onClearCanvas}
            title="Limpiar Pizarra (Lienzo Vacío)"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>

          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer último vértice"
            className="p-1.5 rounded-xl text-ink-soft hover:text-ink disabled:opacity-30 transition"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. LADO DERECHO: PESTAÑAS, MODO OSCURO Y CONTROL DE VISTA */}
      <div className="flex items-center gap-1.5">
        {/* Selector de Pestañas GeoTransform */}
        <div className="flex rounded-xl bg-panel p-1 border border-border">
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
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
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
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
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
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              isSidebarOpen && sidebarTab === 'problem'
                ? 'bg-surface text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-ink-soft hover:text-ink'
            }`}
          >
            Problemas
          </button>
        </div>

        {/* Botón Ocultar / Mostrar Panel Lateral */}
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Ocultar panel lateral (Área máxima de lienzo)' : 'Mostrar panel lateral'}
          className={`p-2 rounded-xl border transition ${
            isSidebarOpen
              ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
              : 'bg-panel border-border text-ink-soft hover:text-ink'
          }`}
        >
          {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </button>

        {/* Botón Modo Oscuro / Modo Claro */}
        <button
          onClick={onToggleDarkMode}
          title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="p-2 rounded-xl bg-panel border border-border text-ink hover:text-accent hover:border-accent transition flex items-center justify-center"
        >
          {isDarkMode ? (
            <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600 hover:text-indigo-600 animate-in spin-in-180 duration-200" />
          )}
        </button>

        {/* Alternar Pantalla Completa Limpia */}
        <button
          onClick={onToggleCleanBoard}
          title={isCleanBoard ? 'Restaurar controles' : 'Pizarra Limpia / Pantalla Completa'}
          className={`p-2 rounded-xl border transition ${
            isCleanBoard
              ? 'bg-accent text-white border-accent'
              : 'bg-panel text-ink border-border hover:border-border-strong'
          }`}
        >
          {isCleanBoard ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
};
