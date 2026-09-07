import React from 'react';
import {
  Point,
  TransformationConfig,
  ReflectionAxis
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
  Maximize2
} from 'lucide-react';

interface AlgebraViewProps {
  vertices: Point[];
  onUpdateVertices: (pts: Point[]) => void;
  transformedVertices: Point[];
  config: TransformationConfig;
  onUpdateConfig: React.Dispatch<React.SetStateAction<TransformationConfig>>;
  onSetTool: (tool: any) => void;
  onOpenCoordsModal: () => void;
}

export const AlgebraView: React.FC<AlgebraViewProps> = ({
  vertices,
  onUpdateVertices,
  transformedVertices,
  config,
  onUpdateConfig,
  onSetTool,
  onOpenCoordsModal
}) => {
  // Cálculo de perímetro y área básica por fórmula de Gauss (Shoelace)
  const polygonMetrics = React.useMemo(() => {
    if (vertices.length < 3) return { area: 0, perimeter: 0 };
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
  }, [vertices]);

  const handleDeleteVertex = (index: number) => {
    onUpdateVertices(vertices.filter((_, i) => i !== index));
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
          <div className="p-4 rounded-xl border border-dashed border-border bg-panel text-center text-ink-soft">
            Lienzo vacío. Haz clic en el plano con la herramienta <strong>Punto</strong> o <strong>Polígono</strong> para comenzar.
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Lista de Vértices Originales */}
            {vertices.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-panel border border-border/70 hover:border-blue-300 transition group"
              >
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <span className="font-bold text-blue-900">
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

            {/* Métrica del Polígono */}
            {vertices.length >= 3 && (
              <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950 font-mono text-[11px] flex justify-between">
                <span>polígono1</span>
                <span>Área = {polygonMetrics.area} | Perím = {polygonMetrics.perimeter}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. SECCIÓN: ELEMENTO RECTOR / PARÁMETROS DE LA TRANSFORMACIÓN */}
      <div className="space-y-2 pt-2 border-t border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
          Parámetros de {config.type.toUpperCase()}
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
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2">
            <div className="flex justify-between font-mono text-xs text-rose-600 font-bold">
              <span>Recta L:</span>
              <span>
                {config.reflectionAxis === 'x'
                  ? 'y = 0'
                  : config.reflectionAxis === 'y'
                  ? 'x = 0'
                  : config.reflectionAxis === 'y=x'
                  ? 'y = x'
                  : config.reflectionAxis === 'y=-x'
                  ? 'y = -x'
                  : config.reflectionAxis === 'custom_x'
                  ? `x = ${config.customAxisValue}`
                  : `y = ${config.customAxisValue}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 pt-1 font-sans">
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
          <div className="p-3 rounded-xl bg-panel border border-border space-y-2 font-mono text-xs">
            <div className="flex justify-between font-semibold text-amber-600">
              <span>Ángulo α:</span>
              <span>{config.angleDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={config.angleDeg}
              onChange={(e) =>
                onUpdateConfig((prev) => ({ ...prev, angleDeg: parseInt(e.target.value) }))
              }
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between items-center pt-1 font-sans">
              <span className="text-ink-soft">Centro C:</span>
              <span className="font-mono text-amber-700 font-bold">
                ({config.center.x}, {config.center.y})
              </span>
              <button
                onClick={() => onSetTool('pivot')}
                className="px-2 py-0.5 text-[11px] rounded bg-surface border border-border hover:border-amber-500"
              >
                Mover
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
