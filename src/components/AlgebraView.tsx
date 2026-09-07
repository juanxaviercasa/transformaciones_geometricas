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
  Layers
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

  return (
    <div className="flex flex-col h-full bg-surface text-ink text-xs font-sans overflow-y-auto p-3.5 space-y-4">
      {/* 1. SECCIÓN: FIGURA PREIMAGEN (OBJETO ORIGINAL F) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
            Preimagen F ({vertices.length} Vértices)
          </span>
          <button
            onClick={onOpenCoordsModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
          >
            <Plus className="h-3 w-3" /> Agregar (x, y)
          </button>
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
                <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200 font-mono text-[11px] flex justify-between">
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
                <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto pr-1">
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
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
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
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
          <Layers className="h-3 w-3 text-accent" />
          Opciones de Visualización en Pizarra
        </span>

        <div className="p-2.5 rounded-2xl bg-panel border border-border space-y-2">
          {/* Toggle Líneas Guía */}
          <div className="flex items-start justify-between gap-2">
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
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 ${
                  toggles.showConstructionGuides ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Medidas de Lados */}
          <div className="flex items-start justify-between gap-2">
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
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 ${
                  toggles.showSideLengths ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-border/60" />

          {/* Toggle Coordenadas de Vértices */}
          <div className="flex items-start justify-between gap-2">
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
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 left-0.75 ${
                  showLabels ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: ELEMENTO RECTOR / PARÁMETROS DE LA TRANSFORMACIÓN */}
      <div className="space-y-2 pt-2 border-t border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          {config.type === 'rotation' && 'Parámetros de Rotación'}
          {config.type === 'reflection' && 'Parámetros de Simetría Axial'}
          {config.type === 'translation' && 'Parámetros de Traslación'}
          {config.type === 'homothety' && 'Parámetros de Homotecia'}
          {config.type === 'central_reflection' && 'Parámetros de Simetría Central'}
        </span>

        {config.type === 'translation' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="flex justify-between font-semibold text-accent">
              <span>Vector v:</span>
              <span>({config.dx}, {config.dy})</span>
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-soft w-8 font-sans">Δx:</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={config.dx}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, dx: parseInt(e.target.value) }))
                  }
                  className="flex-1 accent-accent"
                />
                <span className="w-5 text-right font-bold">{config.dx}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-soft w-8 font-sans">Δy:</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={config.dy}
                  onChange={(e) =>
                    onUpdateConfig((prev) => ({ ...prev, dy: parseInt(e.target.value) }))
                  }
                  className="flex-1 accent-accent"
                />
                <span className="w-5 text-right font-bold">{config.dy}</span>
              </div>
            </div>
          </div>
        )}

        {config.type === 'reflection' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-sans text-xs">
            <span className="text-ink-soft block font-medium">Eje de Reflexión L:</span>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'x', label: 'Eje X' },
                  { id: 'y', label: 'Eje Y' },
                  { id: 'y=x', label: 'y = x' },
                  { id: 'y=-x', label: 'y = -x' },
                  { id: 'custom_x', label: 'x = k' },
                  { id: 'custom_y', label: 'y = k' }
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() =>
                    onUpdateConfig((prev) => ({ ...prev, reflectionAxis: id as ReflectionAxis }))
                  }
                  className={`py-1 px-2 rounded-lg text-xs font-semibold border transition ${
                    config.reflectionAxis === id
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-surface text-ink border-border hover:border-border-strong'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y') && (
              <div className="pt-2 border-t border-border flex items-center gap-2 font-mono">
                <span className="text-[10px] text-ink-soft">k =</span>
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
                <span className="w-5 text-right font-bold text-rose-600">
                  {config.customAxisValue}
                </span>
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
            <div className="flex justify-between items-center pt-2 border-t border-border/80 font-sans">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-ink-soft text-xs">Centro C:</span>
                <span className="font-mono text-amber-700 font-bold text-xs">
                  ({config.center.x}, {config.center.y})
                </span>
              </div>
              <button
                onClick={() => onSetTool('pivot')}
                title="Hacer clic en la pizarra para fijar un nuevo centro de giro"
                className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border hover:border-amber-500 hover:text-amber-700 font-semibold transition"
              >
                Fijar en Pizarra
              </button>
            </div>
          </div>
        )}

        {config.type === 'homothety' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="flex justify-between font-semibold text-purple-600">
              <span>Razón k:</span>
              <span>{config.scaleFactor}x</span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.25"
              value={config.scaleFactor}
              onChange={(e) =>
                onUpdateConfig((prev) => ({
                  ...prev,
                  scaleFactor: parseFloat(e.target.value)
                }))
              }
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between items-center pt-1 font-sans">
              <span className="text-ink-soft">Centro O:</span>
              <span className="font-mono text-purple-700 font-bold">
                ({config.homothetyCenter.x}, {config.homothetyCenter.y})
              </span>
              <button
                onClick={() => onSetTool('pivot')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface border border-border hover:border-purple-500"
              >
                Mover
              </button>
            </div>
          </div>
        )}

        {config.type === 'central_reflection' && (
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-ink-soft font-sans">Centro O:</span>
              <span className="text-sky-600 font-bold">
                ({config.centralCenter.x}, {config.centralCenter.y})
              </span>
              <button
                onClick={() => onSetTool('pivot')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface border border-border hover:border-sky-500 font-sans"
              >
                Mover
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. SECCIÓN: FIGURA IMAGEN (OBJETO TRANSFORMADO F') */}
      <div className="space-y-2 pt-2 border-t border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-purple-600 inline-block" />
          Imagen Transformada F' ({transformedVertices.length} Vértices)
        </span>

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
