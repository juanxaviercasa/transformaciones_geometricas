import React from 'react';
import {
  SymmetryAxis,
  ShapeSymmetryResult,
  WORD_AUTOFORMAS,
  WordAutoformaPreset
} from '../utils/symmetryAnalyzer';
import { TransformationConfig, ReflectionAxis, Point } from '../types/geometry';
import {
  Square,
  Star,
  Sparkles,
  ArrowRight,
  Triangle,
  Diamond,
  Hexagon,
  Heart,
  Zap,
  Circle,
  Shapes,
  Eye,
  EyeOff,
  Check,
  Split,
  ChevronRight,
  Info,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Compass
} from 'lucide-react';
import { MathText } from './MathText';

interface SymmetryExplorerProps {
  symmetryResult: ShapeSymmetryResult;
  showSymmetryAxes: boolean;
  onToggleShowSymmetryAxes: (val: boolean) => void;
  selectedAxisId: string | 'all';
  onSelectAxisId: (id: string | 'all') => void;
  onLoadAutoforma: (preset: WordAutoformaPreset) => void;
  activeAutoformaId?: string | null;
  onApplyAsReflectionAxis?: (axis: SymmetryAxis) => void;
  showTransformedImage?: boolean;
  onToggleShowTransformedImage?: (val: boolean) => void;
  isDarkMode?: boolean;
  shapeRotationAngle?: number;
  onRotateFigureInPlace?: (deltaDeg: number) => void;
  onOrientFigure?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const SymmetryExplorer: React.FC<SymmetryExplorerProps> = ({
  symmetryResult,
  showSymmetryAxes,
  onToggleShowSymmetryAxes,
  selectedAxisId,
  onSelectAxisId,
  onLoadAutoforma,
  activeAutoformaId,
  onApplyAsReflectionAxis,
  showTransformedImage = false,
  onToggleShowTransformedImage,
  isDarkMode = false,
  shapeRotationAngle = 0,
  onRotateFigureInPlace,
  onOrientFigure
}) => {
  // Obtener icono dinámico según nombre de autoforma
  const getAutoformaIcon = (id: string) => {
    switch (id) {
      case 'word_square': return Square;
      case 'word_star_5': return Star;
      case 'word_star_4': return Sparkles;
      case 'word_arrow': return ArrowRight;
      case 'word_triangle_equilateral':
      case 'word_triangle_isosceles': return Triangle;
      case 'word_rhombus': return Diamond;
      case 'word_pentagon':
      case 'word_hexagon': return Hexagon;
      case 'word_heart': return Heart;
      case 'word_lightning': return Zap;
      case 'word_circle': return Circle;
      default: return Shapes;
    }
  };

  const isInfinite = symmetryResult.isInfinite;
  const count = symmetryResult.totalAxes;

  const currentOrientationLabel = React.useMemo(() => {
    const norm = (((shapeRotationAngle || 0) % 360) + 360) % 360;
    if (norm === 0) return '(→ Derecha)';
    if (norm === 90) return '(↑ Arriba)';
    if (norm === 180) return '(← Izquierda)';
    if (norm === 270) return '(↓ Abajo)';
    return `(${norm}°)`;
  }, [shapeRotationAngle]);

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/80 bg-surface/70 p-3.5 shadow-sm text-ink">
      {/* 1. CABECERA: TÍTULO Y AUTOFORMAS DE WORD */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Split className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
                Autoformas y Ejes de Simetría
              </h4>
              <p className="text-[10px] text-ink-soft">
                Conteo analítico de cortes y modelos de Word
              </p>
            </div>
          </div>

          {/* Switch de visualización en el plano */}
          <button
            onClick={() => onToggleShowSymmetryAxes(!showSymmetryAxes)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs ${
              showSymmetryAxes
                ? 'bg-rose-600 text-white shadow-rose-600/20'
                : 'bg-panel border border-border text-ink-soft hover:text-ink'
            }`}
            title="Activar o desactivar el trazado de los cortes de simetría en el lienzo"
          >
            {showSymmetryAxes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>{showSymmetryAxes ? 'Trazando Cortes' : 'Ver Cortes'}</span>
          </button>
        </div>

        {/* 2. SELECTOR RÁPIDO DE AUTOFORMAS (WORD) */}
        <div className="pt-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-ink-faint block mb-1.5">
            Cargar Autoforma Prediseñada:
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
            {WORD_AUTOFORMAS.map((shape) => {
              const Icon = getAutoformaIcon(shape.id);
              const isSelected = activeAutoformaId === shape.id;
              const countBadge = shape.isInfinite ? '∞' : `${shape.symmetryCount}`;
              return (
                <button
                  key={shape.id}
                  onClick={() => onLoadAutoforma(shape)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all shrink-0 min-w-[70px] ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm scale-[1.02]'
                      : 'bg-panel border-border text-ink hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  }`}
                  title={`${shape.name} (${shape.isInfinite ? 'Infinitos ejes' : `${shape.symmetryCount} ${shape.symmetryCount === 1 ? 'eje' : 'ejes'} de simetría`})`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-rose-500'}`} />
                  <span className="text-[10px] font-bold leading-tight truncate max-w-[62px]">
                    {shape.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {countBadge} {shape.isInfinite ? 'ejes' : (shape.symmetryCount === 1 ? 'eje' : 'ejes')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2.b CONTROL DE ORIENTACIÓN Y GIRO DE LA AUTOFORMA (EN SU LUGAR) */}
      <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-panel/70 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink">
              Orientar / Rotar Figura:
            </span>
          </div>
          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {shapeRotationAngle}° {currentOrientationLabel}
          </span>
        </div>

        {/* 4 Direcciones Cardinales Rápidas (Arriba, Abajo, Izquierda, Derecha) */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { dir: 'up', label: 'Arriba', icon: ArrowUp, angle: 90 },
            { dir: 'down', label: 'Abajo', icon: ArrowDown, angle: 270 },
            { dir: 'left', label: 'Izquierda', icon: ArrowLeft, angle: 180 },
            { dir: 'right', label: 'Derecha', icon: ArrowRight, angle: 0 },
          ].map(({ dir, label, icon: DirIcon, angle }) => {
            const isActive = (((shapeRotationAngle || 0) % 360) + 360) % 360 === angle;
            return (
              <button
                key={dir}
                type="button"
                onClick={() => onOrientFigure?.(dir as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold scale-[1.02]'
                    : 'bg-surface border-border text-ink hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                }`}
                title={`Orientar figura hacia ${label.toLowerCase()} (${angle}°)`}
              >
                <DirIcon className="h-4 w-4 mb-0.5" />
                <span className="text-[9px] leading-tight font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Giro por pasos de 90° horario / antihorario */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
          <button
            type="button"
            onClick={() => onRotateFigureInPlace?.(90)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-border bg-surface text-ink hover:border-rose-400 hover:bg-rose-50/40 text-[10px] font-bold transition-all cursor-pointer active:scale-[0.98]"
            title="Girar figura 90° en sentido antihorario en su lugar (↺)"
          >
            <RotateCcw className="h-3.5 w-3.5 text-rose-500" />
            <span>↺ 90° Antihorario</span>
          </button>
          <button
            type="button"
            onClick={() => onRotateFigureInPlace?.(-90)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border border-border bg-surface text-ink hover:border-rose-400 hover:bg-rose-50/40 text-[10px] font-bold transition-all cursor-pointer active:scale-[0.98]"
            title="Girar figura 90° en sentido horario en su lugar (↻)"
          >
            <RotateCw className="h-3.5 w-3.5 text-rose-500" />
            <span>↻ 90° Horario</span>
          </button>
        </div>
      </div>

      {/* 3. CONTADOR DESTACADO: MÁXIMO DE EJES DE SIMETRÍA */}
      <div className="rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-rose-700 dark:text-rose-300">
              Conteo de Simetría Máxima
            </span>
            <div className="text-sm font-extrabold text-ink flex items-center gap-2">
              <span>{symmetryResult.shapeName}</span>
              {symmetryResult.axes.length > 0 && (
                <span className="text-[10px] font-normal text-ink-soft">
                  • Centroide ({symmetryResult.centroid.x}, {symmetryResult.centroid.y})
                </span>
              )}
            </div>
          </div>

          {/* Gran número contador */}
          <div className="flex items-baseline gap-1.5 bg-panel border border-rose-300/60 dark:border-rose-800/60 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {isInfinite ? '∞' : count}
            </span>
            <div className="flex flex-col text-[8px] font-bold uppercase tracking-tight text-ink-soft leading-none">
              <span>{count === 1 ? 'Eje' : 'Ejes'}</span>
              <span>Máx.</span>
            </div>
          </div>
        </div>

        {/* Resumen pedagógico */}
        <p className="text-[10px] text-ink-soft leading-relaxed mt-2 border-t border-rose-200/40 dark:border-rose-900/30 pt-1.5">
          {count > 0 ? (
            <>
              Se pueden trazar como máximo <strong className="text-ink">{isInfinite ? 'infinitos (∞)' : count}</strong> {count === 1 ? 'eje' : 'ejes'} de simetría en esta figura. Al doblar o reflejar por cualquiera de estos cortes, ambas mitades coinciden con exactitud.
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Esta figura es asimétrica: no existe ningún eje que la divida en dos mitades especulares coincidentes.
            </span>
          )}
        </p>

        {/* Indicador de visualización didáctica (Figura única vs Reflejo) */}
        {onToggleShowTransformedImage && (
          <div className="mt-2 pt-2 border-t border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between gap-2">
            <span className="text-[10px] text-ink-soft font-semibold">
              Modo de vista:
            </span>
            <button
              type="button"
              onClick={() => onToggleShowTransformedImage(!showTransformedImage)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                showTransformedImage
                  ? 'bg-purple-600 text-white shadow-purple-600/20'
                  : 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/20'
              }`}
              title={showTransformedImage ? 'Hacer clic para ocultar la figura transformada y ver solo la figura original' : 'Hacer clic para mostrar la figura transformada'}
            >
              {showTransformedImage ? <Sparkles className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showTransformedImage ? 'Con Reflejo F\'' : 'Figura Única (1 gráfico)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MODOS DE TRAZADO Y SELECTOR DE CORTES (SI TIENE EJES) */}
      {count > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/70">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Visualización de Cortes en el Plano:
            </span>
            <button
              onClick={() => onSelectAxisId('all')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                selectedAxisId === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              Ver Todos los Cortes ({count})
            </button>
          </div>

          {/* Botones de ejes individuales */}
          <div className={`grid gap-1.5 ${symmetryResult.axes.length === 1 ? 'grid-cols-1' : symmetryResult.axes.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {symmetryResult.axes.map((axis, idx) => {
              const isSelected = selectedAxisId === axis.id;
              return (
                <button
                  key={axis.id}
                  onClick={() => {
                    onSelectAxisId(axis.id);
                    if (!showSymmetryAxes) onToggleShowSymmetryAxes(true);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'border-current font-bold shadow-xs scale-[1.02]'
                      : 'bg-panel border-border text-ink hover:border-current/40'
                  }`}
                  style={{
                    color: isSelected ? axis.color : undefined,
                    borderColor: isSelected ? axis.color : undefined,
                    backgroundColor: isSelected ? `${axis.color}15` : undefined
                  }}
                  title={axis.description}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: axis.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono font-bold text-[11px] block whitespace-nowrap">
                      E{idx + 1}: {axis.equation}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalle del eje seleccionado y botón para aplicarlo como eje de reflexión */}
          {selectedAxisId !== 'all' && (
            <div className="mt-2 p-2.5 rounded-xl border border-border bg-panel space-y-2 animate-in fade-in duration-200">
              {(() => {
                const activeAxis = symmetryResult.axes.find((a) => a.id === selectedAxisId);
                if (!activeAxis) return null;
                return (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: activeAxis.color }}
                        />
                        <span className="font-bold text-xs text-ink">
                          {activeAxis.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-surface border border-border text-ink">
                        {activeAxis.equation}
                      </span>
                    </div>

                    <p className="text-[10px] text-ink-soft leading-tight">
                      {activeAxis.description}
                    </p>

                    {onApplyAsReflectionAxis && (
                      <button
                        type="button"
                        onClick={() => onApplyAsReflectionAxis(activeAxis)}
                        className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Comprobar Reflejo en este Eje (L)</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
