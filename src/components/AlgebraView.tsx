import React from 'react';
import {
  Point,
  TransformationConfig,
  ReflectionAxis,
  ClassroomToggles
} from '../types/geometry';
import {
  formatNum,
  distance
} from '../utils/GeometryProblemEngine';
import {
  Target,
  Sliders,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Compass,
  Move,
  FlipHorizontal,
  RotateCw,
  Maximize2,
  Ruler,
  Hexagon,
  Link2,
  Unlink,
  Layers,
  Sparkles
} from 'lucide-react';

interface AlgebraViewProps {
  vertices: Point[];
  onUpdateVertices: (pts: Point[]) => void;
  segments: [number, number][];
  onUpdateSegments: (segs: [number, number][]) => void;
  isPolygon: boolean;
  onTogglePolygon: () => void;
  onAutoConnectSegments: () => void;
  onClearSegments: () => void;
  transformedVertices: Point[];
  config: TransformationConfig;
  onUpdateConfig: React.Dispatch<React.SetStateAction<TransformationConfig>>;
  onSetTool: (tool: any) => void;
  onOpenCoordsModal: () => void;
  toggles: ClassroomToggles;
  onUpdateToggles: React.Dispatch<React.SetStateAction<ClassroomToggles>>;
  showLabels: boolean;
  onToggleLabels: () => void;
}

export const AlgebraView: React.FC<AlgebraViewProps> = ({
  vertices,
  onUpdateVertices,
  segments,
  onUpdateSegments,
  isPolygon,
  onTogglePolygon,
  onAutoConnectSegments,
  onClearSegments,
  transformedVertices,
  config,
  onUpdateConfig,
  onSetTool,
  onOpenCoordsModal,
  toggles,
  onUpdateToggles,
  showLabels,
  onToggleLabels
}) => {
  const generalLineAngle = (Math.atan2(config.generalLine.a, -config.generalLine.b) * 180) / Math.PI;
  const normalizedGeneralLineAngle = ((generalLineAngle % 180) + 180) % 180;
  const generalLineOffset = -config.generalLine.c;

  const updateGeneralLine = (angle: number, offset: number) => {
    const radians = (angle * Math.PI) / 180;
    onUpdateConfig((prev) => ({
      ...prev,
      generalLine: {
        a: Number(Math.sin(radians).toFixed(6)),
        b: Number((-Math.cos(radians)).toFixed(6)),
        c: Number((-offset).toFixed(6))
      }
    }));
  };

  const activeReflectionAxes = config.reflectionAxes?.length
    ? config.reflectionAxes
    : [config.reflectionAxis];

  const [homothetyKInput, setHomothetyKInput] = React.useState(String(config.scaleFactor));

  React.useEffect(() => {
    setHomothetyKInput(String(config.scaleFactor));
  }, [config.scaleFactor]);

  const toggleReflectionAxis = (axis: ReflectionAxis) => {
    const nextAxes = activeReflectionAxes.includes(axis)
      ? activeReflectionAxes.filter((activeAxis) => activeAxis !== axis)
      : [...activeReflectionAxes, axis];
    const safeAxes = nextAxes.length > 0 ? nextAxes : [axis];
    onUpdateConfig((prev) => ({
      ...prev,
      reflectionAxis: safeAxes[0],
      reflectionAxes: safeAxes
    }));
  };

  const updateTranslationOrigin = (axis: 'x' | 'y', value: number) => {
    const origin = vertices[0] || { x: 0, y: 0 };
    const updatedOrigin = { ...origin, [axis]: value };
    const currentOrigin = vertices[0] || { x: 0, y: 0, label: 'A' };
    onUpdateVertices([{ ...currentOrigin, ...updatedOrigin }, ...vertices.slice(1)]);
    const target = config.translationTargets?.[0] || config.translationTarget;
    if (target) {
      onUpdateConfig((previous) => ({
        ...previous,
        dx: target.x - updatedOrigin.x,
        dy: target.y - updatedOrigin.y,
        translationTarget: target,
        translationTargets: previous.translationTargets
      }));
    }
  };

  const updateTranslationTarget = (index: number, axis: 'x' | 'y', value: number) => {
    const currentTarget = config.translationTargets?.[index] || (index === 0 ? config.translationTarget : undefined);
    const target = {
      ...(currentTarget || { x: 0, y: 0 }),
      [axis]: value
    };
    const targets = [...(config.translationTargets || [])];
    targets[index] = { ...target, label: `${vertices[index]?.label || String.fromCharCode(65 + index)}'`, color: '#2563eb' };
    onUpdateConfig((previous) => ({
      ...previous,
      dx: index === 0 && vertices[0] ? target.x - vertices[0].x : previous.dx,
      dy: index === 0 && vertices[0] ? target.y - vertices[0].y : previous.dy,
      translationTarget: targets[0],
      translationTargets: targets
    }));
  };

  const renderTranslationPointInputs = (
    label: string,
    point: Point | undefined,
    onChange: (axis: 'x' | 'y', value: number) => void,
    compact = false
  ) => (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 ${compact ? 'min-w-[230px]' : ''}`}>
      <span className="truncate font-sans text-[10px] font-semibold text-ink-soft">{label}</span>
      {(['x', 'y'] as const).map((axis) => (
        <label key={axis} className="flex min-w-0 items-center gap-1 font-sans text-[10px] text-ink-soft">
          <span>{axis.toUpperCase()}:</span>
          <input
            type="number"
            value={point?.[axis] ?? ''}
            placeholder="-"
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isNaN(value)) onChange(axis, value);
            }}
            className="w-14 min-w-0 rounded-lg border border-border bg-surface px-1.5 py-1 text-center font-mono text-[11px] font-bold text-ink outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      ))}
    </div>
  );

  const translationVectors = config.translationVectors?.length
    ? config.translationVectors
    : [
        { dx: config.dx, dy: config.dy, set: config.translationVectorSet },
        ...(config.translationVectorCount === 2
          ? [{ dx: config.translationSecondDx || 0, dy: config.translationSecondDy || 0, set: config.translationSecondVectorSet }]
          : [])
      ];

  // Cálculo de perímetro y área básica por fórmula de Gauss (Shoelace) para polígonos cerrados
  const polygonMetrics = React.useMemo(() => {
    if (!isPolygon || vertices.length < 3) return { area: 0, perimeter: 0 };
    let perim = 0;
    let shoelace = 0;
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      perim += distance(p1, p2);
      shoelace += p1.x * p2.y - p2.x * p1.y;
    }
    return {
      perimeter: Number(perim.toFixed(2)),
      area: Number((Math.abs(shoelace) / 2).toFixed(2))
    };
  }, [vertices, isPolygon]);

  const handleDeleteVertex = (index: number) => {
    // Eliminar el vértice y filtrar/actualizar segmentos que lo referenciaban
    const updated = vertices.filter((_, i) => i !== index);
    const updatedSegments = segments
      .filter(([a, b]) => a !== index && b !== index)
      .map(([a, b]) => [a > index ? a - 1 : a, b > index ? b - 1 : b] as [number, number]);
    onUpdateVertices(updated);
    onUpdateSegments(updatedSegments);
  };

  const handleDeleteSegment = (segIndex: number) => {
    onUpdateSegments(segments.filter((_, idx) => idx !== segIndex));
  };

  const transformationLabel = config.type === 'reflection' ? 'Simetría axial' :
    config.type === 'translation' ? 'Traslación' :
    config.type === 'rotation' ? 'Rotación' :
    config.type === 'central_reflection' ? 'Simetría central' :
    'Homotecia';

  const figureStateLabel = isPolygon
    ? 'Polígono cerrado'
    : segments.length > 0
      ? `Segmentos (${segments.length})`
      : `Puntos libres (${vertices.length})`;

  return (
    <div className="h-full min-h-0 bg-surface text-ink text-xs font-sans overflow-y-auto overscroll-contain p-3.5 space-y-4">
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/12 via-sky-500/5 to-transparent p-3 shadow-sm ring-1 ring-accent/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Trabajo activo</div>
              <div className="text-sm font-bold text-ink">Espacio de transformación</div>
            </div>
          </div>
          <span className="rounded-full border border-accent/20 bg-white/70 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-accent dark:bg-slate-900/60">
            {transformationLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-panel/80 p-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">Figura</div>
            <div className="mt-1 text-xs font-bold text-ink">{figureStateLabel}</div>
          </div>
          <div className="rounded-xl border border-border bg-panel/80 p-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">Vértices</div>
            <div className="mt-1 text-xs font-bold text-ink">{vertices.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-panel/80 p-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-ink-faint">Objetivo</div>
            <div className="mt-1 text-xs font-bold text-ink">{isPolygon ? 'Área y perímetro' : 'Construcción'}</div>
          </div>
        </div>
      </div>

      {/* 1. SECCIÓN: FIGURA PREIMAGEN (OBJETO ORIGINAL F) */}
      <div className="space-y-2">
        <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-r from-blue-500/8 via-sky-400/5 to-transparent p-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">
                Figura inicial
              </span>
            </div>
            <button
              onClick={onOpenCoordsModal}
              className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white/70 px-2 py-1 text-[10px] font-semibold text-accent shadow-sm transition hover:border-accent hover:bg-blue-50 dark:bg-slate-900/60 dark:hover:bg-slate-800"
            >
              <Plus className="h-3 w-3" /> Agregar (x, y)
            </button>
          </div>
          <div className="mt-2 text-xs font-semibold text-ink">
            Preimagen F ({vertices.length} vértices)
          </div>
        </div>

        {vertices.length === 0 ? (
          <div className="p-3.5 rounded-2xl border border-dashed border-border bg-panel text-center text-ink-soft space-y-1">
            <p className="font-semibold text-ink">Lienzo vacío</p>
            <p className="text-[11px] text-ink-faint leading-relaxed">
              Selecciona <strong>Punto</strong> para marcar coordenadas libres, <strong>Segmento</strong> para unir dos puntos sin cerrar, o <strong>Polígono</strong> para figuras cerradas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* ESTADO DE LA FIGURA: PUNTOS LIBRES, SEGMENTOS O POLÍGONO */}
            <div className="p-2.5 rounded-2xl bg-panel border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] flex items-center gap-1.5">
                  {isPolygon ? (
                    <>
                      <Hexagon className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-blue-700 dark:text-blue-400">Polígono Cerrado</span>
                    </>
                  ) : segments.length > 0 ? (
                    <>
                      <Link2 className="h-3.5 w-3.5 text-indigo-600" />
                      <span className="text-indigo-700 dark:text-indigo-400">Segmentos Abiertos ({segments.length})</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="text-ink-soft">Puntos Libres ({vertices.length})</span>
                    </>
                  )}
                </span>

                {/* Acciones de forma */}
                <div className="flex items-center gap-1">
                  {isPolygon ? (
                    <button
                      onClick={onTogglePolygon}
                      title="Convertir a segmentos abiertos (sin relleno ni cierre forzado)"
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface border border-border text-ink-soft hover:text-ink hover:border-border-strong transition flex items-center gap-1"
                    >
                      <Unlink className="h-3 w-3" /> Abrir
                    </button>
                  ) : vertices.length >= 3 ? (
                    <button
                      onClick={onTogglePolygon}
                      title="Cerrar los puntos en un polígono continuo con área y perímetro"
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1 shadow-sm"
                    >
                      <Hexagon className="h-3 w-3" /> Cerrar Polígono
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Métricas si es polígono cerrado */}
              {isPolygon && vertices.length >= 3 && (
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-mono text-[12px] font-bold flex justify-between shadow-sm">
                  <span>Área = {polygonMetrics.area} u²</span>
                  <span>Perímetro = {polygonMetrics.perimeter} u</span>
                </div>
              )}

              {/* Botones de ayuda para conectar si no es polígono */}
              {!isPolygon && (
                <div className="flex flex-wrap gap-1 pt-1 border-t border-border/60">
                  {segments.length === 0 && vertices.length >= 2 && (
                    <button
                      onClick={onAutoConnectSegments}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition"
                    >
                      <Link2 className="h-3 w-3" /> Unir puntos en serie (A-B-C)
                    </button>
                  )}
                  {segments.length > 0 && (
                    <button
                      onClick={onClearSegments}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    >
                      <Trash2 className="h-3 w-3" /> Quitar líneas
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Segmentos Trazados (si no es polígono cerrado) */}
            {!isPolygon && segments.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-ink-faint">Líneas / Segmentos activos:</span>
                <div className="grid grid-cols-1 gap-1 pr-1">
                  {segments.map(([a, b], sIdx) => {
                    const pA = vertices[a];
                    const pB = vertices[b];
                    if (!pA || !pB) return null;
                    const len = formatNum(distance(pA, pB));
                    const lA = pA.label || String.fromCharCode(65 + a);
                    const lB = pB.label || String.fromCharCode(65 + b);
                    return (
                      <div
                        key={sIdx}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-panel/70 border border-border/70 text-[11px] font-mono group"
                      >
                        <span className="text-ink font-semibold">
                          Segmento {lA}{lB} = <span className="text-accent">{len} u</span>
                        </span>
                        <button
                          onClick={() => handleDeleteSegment(sIdx)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-soft hover:text-rose-600 transition"
                          title="Eliminar este segmento"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista de Vértices Originales */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-ink-faint">Coordenadas de vértices:</span>
              <div className="space-y-1 pr-1">
                {vertices.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-panel border border-border/70 hover:border-blue-300 transition group"
                  >
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      <span className="font-bold text-blue-900 dark:text-blue-300">
                        {v.label || String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-ink font-semibold">
                        = ({formatNum(v.x)}, {formatNum(v.y)})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteVertex(i)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-ink-soft hover:text-rose-600 transition"
                      title="Eliminar vértice"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SECCIÓN: OPCIONES DE VISUALIZACIÓN EN PIZARRA (LÍNEAS GUÍA, MEDIDAS, COORDENADAS) */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/10 via-transparent to-sky-500/5 p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
              Visualización
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            Opciones de la pizarra
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-panel border border-border space-y-2">
          {/* Toggle Líneas Guía */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Compass className="h-3.5 w-3.5 text-rose-500" />
                <span>Líneas Guía de Construcción</span>
              </div>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">
                Muestra rayos, perpendiculares y vectores que conectan la preimagen con la imagen.
                {vertices.length === 0 && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-0.5 italic">
                    (Añade puntos en el lienzo para visualizarlas)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() =>
                onUpdateToggles((prev) => ({
                  ...prev,
                  showConstructionGuides: !prev.showConstructionGuides
                }))
              }
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                toggles.showConstructionGuides ? 'bg-rose-500' : 'bg-border-strong'
              }`}
              aria-label="Mostrar u ocultar líneas guía de construcción"
              aria-pressed={toggles.showConstructionGuides}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] left-[3px] ${
                  toggles.showConstructionGuides ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Distancias a la simetría */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Ruler className="h-3.5 w-3.5 text-rose-500" />
                <span>Distancias a la simetría</span>
              </div>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">
                Muestra u oculta las perpendiculares y sus marcas de distancia en cada eje activo.
              </p>
            </div>
            <button
              onClick={() => onUpdateToggles((prev) => ({ ...prev, showReflectionDistances: !prev.showReflectionDistances }))}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${toggles.showReflectionDistances ? 'bg-rose-500' : 'bg-border-strong'}`}
              aria-label="Mostrar u ocultar distancias a la simetría"
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] left-[3px] ${toggles.showReflectionDistances ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Puntos */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                {toggles.showPoints ? <Eye className="h-3.5 w-3.5 text-accent" /> : <EyeOff className="h-3.5 w-3.5 text-ink-soft" />}
                <span>Puntos de las figuras</span>
              </div>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">
                Muestra u oculta los vértices originales y sus simétricos.
              </p>
            </div>
            <button
              onClick={() => onUpdateToggles((prev) => ({ ...prev, showPoints: !prev.showPoints }))}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${toggles.showPoints ? 'bg-accent' : 'bg-border-strong'}`}
              aria-label="Mostrar u ocultar puntos"
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] left-[3px] ${toggles.showPoints ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Medidas de Lados */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                <Ruler className="h-3.5 w-3.5 text-blue-500" />
                <span>Medidas Numéricas de Lados</span>
              </div>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">
                Muestra la longitud exacta de cada segmento en pantalla.
                {(!isPolygon && segments.length === 0) && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-0.5 italic">
                    (Requiere trazar segmentos o polígono)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() =>
                onUpdateToggles((prev) => ({
                  ...prev,
                  showSideLengths: !prev.showSideLengths
                }))
              }
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                toggles.showSideLengths ? 'bg-blue-600' : 'bg-border-strong'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] left-[3px] ${
                  toggles.showSideLengths ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Coordenadas de Vértices */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                {showLabels ? <Eye className="h-3.5 w-3.5 text-accent" /> : <EyeOff className="h-3.5 w-3.5 text-ink-soft" />}
                <span>Etiquetas y Coordenadas (x, y)</span>
              </div>
              <p className="text-[10px] text-ink-soft leading-tight mt-0.5">
                Muestra los nombres A(x, y) y A'(x', y') en el plano cartesiano.
              </p>
            </div>
            <button
              onClick={onToggleLabels}
              className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${
                showLabels ? 'bg-accent' : 'bg-border-strong'
              }`}
              aria-label="Mostrar u ocultar etiquetas y coordenadas"
              aria-pressed={showLabels}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-[3px] left-[3px] ${
                  showLabels ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: ELEMENTO RECTOR / PARÁMETROS DE LA TRANSFORMACIÓN */}
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
              Transformación
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            Parámetros del movimiento geométrico
          </div>
        </div>

        {/* Selector de Transformación Activa */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Tipo de Transformación
            </span>
            <span className="text-[10px] text-accent font-semibold">
              {config.type === 'reflection' ? 'Simetría Axial' :
               config.type === 'translation' ? 'Traslación' :
               config.type === 'rotation' ? 'Rotación' :
               config.type === 'central_reflection' ? 'Simetría Central' : 'Homotecia'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {[
              { id: 'reflection', label: 'Simetría Axial', icon: FlipHorizontal },
              { id: 'translation', label: 'Traslación', icon: Move },
              { id: 'rotation', label: 'Rotación', icon: RotateCw },
              { id: 'central_reflection', label: 'Simetría Central', icon: Target },
              { id: 'homothety', label: 'Homotecia', icon: Maximize2 }
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = config.type === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onUpdateConfig(prev => ({ ...prev, type: opt.id as any }))}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-semibold border transition text-left ${
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-panel border-border text-ink hover:border-accent/40'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-accent'}`} />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint block pt-1">
          {config.type === 'rotation' && 'Parámetros de Rotación'}
          {config.type === 'reflection' && 'Parámetros de Simetría Axial'}
          {config.type === 'translation' && 'Parámetros de Traslación'}
          {config.type === 'homothety' && 'Parámetros de Homotecia'}
          {config.type === 'central_reflection' && 'Parámetros de Simetría Central'}
        </span>

        {config.type === 'translation' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="grid grid-cols-2 gap-1 font-sans text-[10px]">
              <button
                type="button"
                onClick={() => onUpdateConfig((prev) => ({
                  ...prev,
                  translationMode: 'points',
                }))}
                onMouseDown={() => onSetTool('point')}
                className={`rounded-lg border px-2 py-1.5 font-bold transition ${config.translationMode !== 'vector' ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-ink-soft'}`}
              >
                Puntos
              </button>
              <button
                type="button"
                onClick={() => onUpdateConfig((prev) => ({
                  ...prev,
                  translationMode: 'vector',
                  translationVectorSet: true
                }))}
                onMouseDown={() => onSetTool('point')}
                className={`rounded-lg border px-2 py-1.5 font-bold transition ${config.translationMode === 'vector' ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-ink-soft'}`}
              >
                Vector
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 font-semibold text-accent">
              <span>{translationVectors.length === 1 ? 'Vector' : `${translationVectors.length} vectores`}</span>
              <span className="shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-[10px]">Cadena</span>
            </div>
            <p className="font-sans text-[10px] leading-tight text-ink-soft">
              {config.translationMode === 'vector'
                ? 'Coloca el punto inicial y define el vector para obtener su imagen.'
                : 'Escribe las coordenadas o coloca ambos puntos en el plano.'}
            </p>
            {config.translationMode === 'points' && (
              <div className="space-y-2 rounded-lg border border-border/70 bg-surface/60 p-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-border pb-1 font-sans text-[9px] font-bold uppercase text-ink-faint">
                  <span>Correspondencia</span><span>X</span><span>Y</span>
                </div>
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {vertices.map((point, index) => {
                    const target = config.translationTargets?.[index] || (index === 0 ? config.translationTarget : undefined);
                    const name = point.label || String.fromCharCode(65 + index);
                    return (
                      <div key={`${name}-${index}`} className="space-y-1 rounded-lg border border-border/60 bg-panel/60 p-1.5">
                        {renderTranslationPointInputs(`${name} inicial`, point, (axis, value) => {
                          if (index === 0) updateTranslationOrigin(axis, value);
                          else {
                            const updated = [...vertices];
                            updated[index] = { ...updated[index], [axis]: value };
                            onUpdateVertices(updated);
                          }
                        }, true)}
                        {renderTranslationPointInputs(`${name}' final`, target, (axis, value) => updateTranslationTarget(index, axis, value), true)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="max-h-44 space-y-1.5 overflow-y-auto pt-1 pr-1">
              {translationVectors.map((vector, index) => (
                <div key={index} className="rounded-lg border border-border/70 bg-surface/70 p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="font-sans text-[10px] font-bold text-accent">Vector v̅{index + 1}</span>
                    {translationVectors.length > 1 && <button type="button" title="Quitar vector" onClick={() => onUpdateConfig((previous) => ({ ...previous, translationVectors: translationVectors.filter((_, vectorIndex) => vectorIndex !== index) }))} className="rounded-md px-2 py-0.5 font-bold text-rose-600 hover:bg-rose-50">Quitar</button>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex min-w-0 items-center gap-1.5 font-sans text-[10px] text-ink-soft">
                    <span className="shrink-0">Δx</span>
                    <input type="number" step="1" value={vector.dx} disabled={config.translationMode !== 'vector'} onChange={(event) => {
                      const value = parseInt(event.target.value);
                      if (!Number.isNaN(value)) onUpdateConfig((previous) => {
                        const next = [...translationVectors]; next[index] = { ...next[index], dx: value, set: true };
                        return { ...previous, translationVectors: next, dx: next[0].dx, translationVectorSet: true };
                      });
                    }} className="w-full min-w-0 rounded-md border border-border bg-panel px-2 py-1.5 text-center font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-accent" />
                    </label>
                    <label className="flex min-w-0 items-center gap-1.5 font-sans text-[10px] text-ink-soft">
                    <span className="shrink-0">Δy</span>
                    <input type="number" step="1" value={vector.dy} disabled={config.translationMode !== 'vector'} onChange={(event) => {
                      const value = parseInt(event.target.value);
                      if (!Number.isNaN(value)) onUpdateConfig((previous) => {
                        const next = [...translationVectors]; next[index] = { ...next[index], dy: value, set: true };
                        return { ...previous, translationVectors: next, dy: next[0].dy, translationVectorSet: true };
                      });
                    }} className="w-full min-w-0 rounded-md border border-border bg-panel px-2 py-1.5 text-center font-mono text-xs font-bold outline-none focus:ring-2 focus:ring-accent" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {config.translationMode === 'vector' && translationVectors.length < 6 && (
              <button type="button" onClick={() => onUpdateConfig((previous) => ({ ...previous, translationVectors: [...translationVectors, { dx: 0, dy: 0, set: true }] }))} className="w-full rounded-lg border border-accent/30 bg-accent/5 px-2 py-1.5 font-sans text-[10px] font-bold text-accent transition hover:bg-accent/10">
                + Añadir vector
              </button>
            )}
          </div>
        )}

        {config.type === 'reflection' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-sans text-xs">
            <span className="text-ink-soft block font-medium">
              Ejes de Reflexión L:
              {activeReflectionAxes.length > 1 && (
                <span className="ml-1 text-rose-600 font-bold">({activeReflectionAxes.length} activos)</span>
              )}
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'x', label: 'Eje X' },
                  { id: 'y', label: 'Eje Y' },
                  { id: 'y=x', label: 'y = x' },
                  { id: 'y=-x', label: 'y = -x' },
                  { id: 'custom_x', label: 'x = k' },
                  { id: 'custom_y', label: 'y = k' },
                  { id: 'general', label: 'Oblicua' }
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => toggleReflectionAxis(id as ReflectionAxis)}
                  className={`py-1 px-2 rounded-lg text-xs font-semibold border transition ${
                    activeReflectionAxes.includes(id as ReflectionAxis)
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-surface text-ink border-border hover:border-border-strong'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y') && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-ink-soft shrink-0">
                    {config.reflectionAxis === 'custom_x' ? 'x = ' : 'y = '}
                  </span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    value={config.customAxisValue}
                    onChange={(e) =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        customAxisValue: parseInt(e.target.value)
                      }))
                    }
                    className="flex-1 accent-rose-600"
                  />
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    value={config.customAxisValue}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v >= -20 && v <= 20)
                        onUpdateConfig((prev) => ({ ...prev, customAxisValue: v }));
                    }}
                    className="w-14 text-center font-bold text-rose-600 bg-surface border border-rose-300 rounded-lg px-1 py-0.5 text-xs outline-none focus:ring-2 focus:ring-rose-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            )}

            {config.reflectionAxis === 'general' && (
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-[10px] text-ink-soft leading-relaxed">
                  Define una recta oblicua por su ángulo respecto al eje X y su distancia firmada al origen.
                </p>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-ink-soft shrink-0">Ángulo:</span>
                  <input
                    type="range"
                    min="0"
                    max="179"
                    value={Math.round(normalizedGeneralLineAngle)}
                    onChange={(e) => updateGeneralLine(Number(e.target.value), generalLineOffset)}
                    className="flex-1 accent-rose-600"
                  />
                  <input
                    type="number"
                    min="0"
                    max="179"
                    value={Math.round(normalizedGeneralLineAngle)}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) updateGeneralLine(Math.max(0, Math.min(179, value)), generalLineOffset);
                    }}
                    className="w-16 text-center font-bold text-rose-600 bg-surface border border-rose-300 rounded-lg px-1 py-0.5 text-xs outline-none focus:ring-2 focus:ring-rose-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-rose-600">°</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-ink-soft shrink-0">Desplazamiento:</span>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={generalLineOffset}
                    onChange={(e) => updateGeneralLine(normalizedGeneralLineAngle, Number(e.target.value))}
                    className="flex-1 accent-rose-600"
                  />
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    step="0.5"
                    value={generalLineOffset}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) updateGeneralLine(normalizedGeneralLineAngle, Math.max(-20, Math.min(20, value)));
                    }}
                    className="w-16 text-center font-bold text-rose-600 bg-surface border border-rose-300 rounded-lg px-1 py-0.5 text-xs outline-none focus:ring-2 focus:ring-rose-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="px-2 py-1.5 rounded-lg bg-surface border border-border text-[10px] font-mono text-ink-soft">
                  {formatNum(config.generalLine.a)}x {config.generalLine.b >= 0 ? '+' : '-'} {formatNum(Math.abs(config.generalLine.b))}y {config.generalLine.c >= 0 ? '+' : '-'} {formatNum(Math.abs(config.generalLine.c))} = 0
                </div>
              </div>
            )}
          </div>
        )}

        {config.type === 'rotation' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center font-semibold text-amber-600">
              <span className="flex items-center gap-1.5 font-sans font-bold text-ink">
                <RotateCw className="h-3.5 w-3.5 text-amber-600" /> Ángulo de Giro (α):
              </span>
              <span className="text-sm font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300 text-amber-900 shadow-sm">
                {config.angleDeg}°
              </span>
            </div>

            {/* Selector de Sentido de Giro */}
            <div className="grid grid-cols-2 gap-1.5 font-sans">
              <button
                onClick={() => onUpdateConfig((prev) => ({ ...prev, direction: 'anticlockwise' }))}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                  config.direction === 'anticlockwise'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-surface text-ink border-border hover:bg-black/5'
                }`}
              >
                <span>↺</span> Antihorario (+)
              </button>
              <button
                onClick={() => onUpdateConfig((prev) => ({ ...prev, direction: 'clockwise' }))}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                  config.direction === 'clockwise'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-surface text-ink border-border hover:bg-black/5'
                }`}
              >
                <span>↻</span> Horario (-)
              </button>
            </div>

            {/* Botones de ángulos escolares directos */}
            <div className="space-y-1 font-sans">
              <span className="text-[10px] text-ink-soft">Ángulos frecuentes:</span>
              <div className="grid grid-cols-5 gap-1">
                {[90, 180, 270, 45, 60].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => onUpdateConfig((prev) => ({ ...prev, angleDeg: deg }))}
                    className={`py-1 rounded text-[11px] font-bold border transition ${
                      config.angleDeg === deg
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-surface text-ink-soft hover:text-ink border-border'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Slider de ángulo */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={config.angleDeg}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({ ...prev, angleDeg: parseInt(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-ink-faint font-sans px-0.5">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Centro de rotación C */}
            <div className="pt-2 border-t border-border/80 space-y-2 font-sans">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-ink-soft text-xs">Centro C:</span>
                </div>
                <button
                  onClick={() => onSetTool('pivot')}
                  title="Hacer clic en la pizarra para fijar un nuevo centro de giro"
                  className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border hover:border-amber-500 hover:text-amber-700 font-semibold transition"
                >
                  Fijar en Pizarra
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-[10px] text-ink-soft">
                  <span>X</span>
                  <input
                    type="number"
                    value={config.center.x}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) {
                        onUpdateConfig((prev) => ({ ...prev, center: { ...prev.center, x: value } }));
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </label>
                <label className="space-y-1 text-[10px] text-ink-soft">
                  <span>Y</span>
                  <input
                    type="number"
                    value={config.center.y}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (!Number.isNaN(value)) {
                        onUpdateConfig((prev) => ({ ...prev, center: { ...prev.center, y: value } }));
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </label>
              </div>
              <div className="font-mono text-amber-700 font-bold text-xs text-right">
                ({config.center.x}, {config.center.y})
              </div>
            </div>
          </div>
        )}

        {config.type === 'homothety' && (() => {
          const applyScale = (nextValue: number) => {
            if (!Number.isFinite(nextValue)) return;
            onUpdateConfig((prev) => ({
              ...prev,
              scaleFactor: Number(nextValue.toFixed(2))
            }));
          };
          const presets = [-3, -2, -0.5, 0.5, 2, 3];
          const classicExamples = [
            { value: -3, label: '-3' },
            { value: -2, label: '-2' },
            { value: -0.5, label: '-1/2' },
            { value: 0.5, label: '1/2' },
            { value: 2, label: '2' },
            { value: 3, label: '3' }
          ];

          return (
            <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
              <div className="flex justify-between font-semibold text-purple-600">
                <span>Razón k:</span>
                <span>{config.scaleFactor.toFixed(2)}x</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 font-sans">
                <button
                  onClick={() => applyScale(Math.abs(config.scaleFactor))}
                  className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition ${
                    config.scaleFactor >= 0
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-surface text-ink border-border hover:bg-black/5'
                  }`}
                >
                  Mismo lado (+)
                </button>
                <button
                  onClick={() => applyScale(-Math.abs(config.scaleFactor))}
                  className={`flex items-center justify-center py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition ${
                    config.scaleFactor < 0
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-surface text-ink border-border hover:bg-black/5'
                  }`}
                >
                  Lado opuesto (-)
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-ink-soft font-sans">Ejemplos clásicos</div>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {classicExamples.map((example) => (
                    <button
                      key={example.label}
                      onClick={() => applyScale(example.value)}
                      className={`rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
                        Number(config.scaleFactor.toFixed(2)) === Number(example.value.toFixed(2))
                          ? 'border-purple-600 bg-purple-600 text-white'
                          : 'border-purple-200 bg-purple-100 text-purple-700 hover:border-purple-400'
                      }`}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2 items-center font-sans">
                <input
                  type="number"
                  step="0.1"
                  value={homothetyKInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    setHomothetyKInput(e.target.value);
                  }}
                  onBlur={() => {
                    const raw = homothetyKInput.trim();
                    if (raw === '') {
                      setHomothetyKInput(String(config.scaleFactor));
                      return;
                    }

                    const parsed = Number.parseFloat(raw);
                    if (!Number.isNaN(parsed)) {
                      applyScale(parsed);
                    } else {
                      setHomothetyKInput(String(config.scaleFactor));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const raw = homothetyKInput.trim();
                      if (raw === '') {
                        setHomothetyKInput(String(config.scaleFactor));
                        return;
                      }

                      const parsed = Number.parseFloat(raw);
                      if (!Number.isNaN(parsed)) {
                        applyScale(parsed);
                      } else {
                        setHomothetyKInput(String(config.scaleFactor));
                      }
                    }
                  }}
                  className="w-full text-center font-bold text-purple-700 bg-surface border border-purple-300 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-purple-400"
                />
                <span className="text-[10px] text-ink-soft">k exacto</span>
              </div>

              <div className="space-y-1.5 text-[10px] text-ink-soft font-sans leading-relaxed">
                <div className="font-mono text-purple-700 font-bold tracking-tight">P' = O + k(P - O)</div>
                <div>
                  <span className="font-semibold text-purple-700">k &gt; 0</span> = mismo lado, <span className="font-semibold text-purple-700">k &lt; 0</span> = opuesto. <span className="font-semibold text-purple-700">|k| &lt; 1</span> = reducción, <span className="font-semibold text-purple-700">|k| &gt; 1</span> = ampliación.
                </div>
              </div>

              <div className="space-y-2 pt-1 font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-ink-soft">Centro O:</span>
                  <button
                    onClick={() => onSetTool('pivot')}
                    className="px-2 py-0.5 text-[11px] rounded bg-surface border border-border hover:border-purple-500"
                  >
                    Mover
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1 text-[10px] text-ink-soft">
                    <span>X</span>
                    <input
                      type="number"
                      value={config.homothetyCenter.x}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!Number.isNaN(value)) {
                          onUpdateConfig((prev) => ({ ...prev, homothetyCenter: { ...prev.homothetyCenter, x: value } }));
                        }
                      }}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                  <label className="space-y-1 text-[10px] text-ink-soft">
                    <span>Y</span>
                    <input
                      type="number"
                      value={config.homothetyCenter.y}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!Number.isNaN(value)) {
                          onUpdateConfig((prev) => ({ ...prev, homothetyCenter: { ...prev.homothetyCenter, y: value } }));
                        }
                      }}
                      className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
                <div className="font-mono text-purple-700 font-bold text-xs text-right">
                  ({config.homothetyCenter.x}, {config.homothetyCenter.y})
                </div>
              </div>
            </div>
          );
        })()}

        {config.type === 'central_reflection' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-soft font-sans">Centro O:</span>
              <button
                onClick={() => onSetTool('pivot')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface border border-border hover:border-sky-500 font-sans"
              >
                Mover
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 font-sans">
              <label className="space-y-1 text-[10px] text-ink-soft">
                <span>X</span>
                <input
                  type="number"
                  value={config.centralCenter.x}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!Number.isNaN(value)) {
                      onUpdateConfig((prev) => ({ ...prev, centralCenter: { ...prev.centralCenter, x: value } }));
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-sky-500"
                />
              </label>
              <label className="space-y-1 text-[10px] text-ink-soft">
                <span>Y</span>
                <input
                  type="number"
                  value={config.centralCenter.y}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!Number.isNaN(value)) {
                      onUpdateConfig((prev) => ({ ...prev, centralCenter: { ...prev.centralCenter, y: value } }));
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-2 py-1 text-xs font-mono text-ink outline-none focus:ring-2 focus:ring-sky-500"
                />
              </label>
            </div>
            <div className="text-sky-600 font-bold text-xs text-right">
              ({config.centralCenter.x}, {config.centralCenter.y})
            </div>
          </div>
        )}
      </div>

      {/* 3. SECCIÓN: FIGURA IMAGEN (OBJETO TRANSFORMADO F') */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="rounded-2xl border border-purple-200/70 bg-gradient-to-r from-purple-500/8 via-violet-500/5 to-transparent p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600 inline-block" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">
              Imagen transformada
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            F' ({transformedVertices.length} vértices)
          </div>
        </div>

        {transformedVertices.length > 0 && (
          <div className="space-y-1.5">
            {transformedVertices.map((vPrime, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 border border-purple-200/70 font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-600" />
                  <span className="font-bold text-purple-900">
                    {vPrime.label || `P${i + 1}'`}
                  </span>
                  <span className="text-ink font-semibold">
                    = ({formatNum(vPrime.x)}, {formatNum(vPrime.y)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
