import React, { useState, useRef, useEffect, useCallback } from "react";
import { TransformationType } from "../types/geometry";
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Move,
  RotateCw,
  FlipHorizontal,
  Target,
  HelpCircle,
} from "lucide-react";

interface Point2D {
  x: number;
  y: number;
  label: string;
}

interface InteractiveTheoryDiagramProps {
  transformationType: TransformationType;
  colorAccent: string;
}

// Canvas viewport configuration
const W = 760;
const H = 430;
const CX = 380;
const CY = 215;
const STEP = 42; // pixels per unit
const RANGE_X = 8;
const RANGE_Y = 5;

function toScreenX(x: number): number {
  return CX + x * STEP;
}

function toScreenY(y: number): number {
  return CY - y * STEP;
}

function toMathX(sx: number): number {
  const val = (sx - CX) / STEP;
  return Math.round(val * 2) / 2; // snap to 0.5
}

function toMathY(sy: number): number {
  const val = (CY - sy) / STEP;
  return Math.round(val * 2) / 2; // snap to 0.5
}

function roundDec(val: number, dec: number = 1): number {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}

export const InteractiveTheoryDiagram: React.FC<InteractiveTheoryDiagramProps> = ({
  transformationType,
  colorAccent,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // ── 1. STATE FOR POINTS ──────────────────────────────────────────────────
  const getDefaultPoints = useCallback((type: TransformationType): Point2D[] => {
    switch (type) {
      case "reflection":
        return [
          { x: -3, y: 1, label: "A" },
          { x: -1, y: 3, label: "B" },
          { x: -2, y: -2, label: "C" },
        ];
      case "translation":
        return [
          { x: -4, y: -1, label: "A" },
          { x: -2, y: 2, label: "B" },
          { x: -1, y: -2, label: "C" },
        ];
      case "rotation":
        return [
          { x: 3, y: 1, label: "A" },
          { x: 4, y: 3, label: "B" },
          { x: 1, y: 2, label: "C" },
        ];
      case "homothety":
        return [
          { x: 2, y: 1, label: "A" },
          { x: 3, y: 2.5, label: "B" },
          { x: 1, y: 2, label: "C" },
        ];
      case "central_reflection":
        return [
          { x: 3, y: 3, label: "A" },
          { x: 4, y: 5, label: "B" },
          { x: 2, y: 4, label: "C" },
        ];
      default:
        return [
          { x: 1, y: 1, label: "A" },
          { x: 4, y: 1, label: "B" },
          { x: 2, y: 4, label: "C" },
        ];
    }
  }, []);

  const [points, setPoints] = useState<Point2D[]>(() =>
    getDefaultPoints(transformationType)
  );

  // ── 2. TRANSFORMATION SPECIFIC PARAMETERS ────────────────────────────────
  // Reflection: Axis
  const [reflectionAxis, setReflectionAxis] = useState<
    "y-axis" | "x-axis" | "y=x" | "y=-x" | "x=k" | "y=k"
  >("y-axis");
  const [axisK, setAxisK] = useState<number>(1);

  // Translation: vector v = (dx, dy)
  const [dx, setDx] = useState<number>(4);
  const [dy, setDy] = useState<number>(2);

  // Rotation: angle alpha and center C
  const [angleDeg, setAngleDeg] = useState<number>(90);
  const [rotCenter, setRotCenter] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Homothety: factor k and center C
  const [scaleK, setScaleK] = useState<number>(2);
  const [homoCenter, setHomoCenter] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Central reflection: center O
  const [centralCenter, setCentralCenter] = useState<{ x: number; y: number }>({
    x: 1,
    y: 1,
  });

  // Animation state
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(1); // 0 to 1
  const animRef = useRef<number | null>(null);

  // Reset when transformationType changes
  useEffect(() => {
    setPoints(getDefaultPoints(transformationType));
    setIsAnimating(false);
    setAnimProgress(1);
    if (transformationType === "reflection") setReflectionAxis("y-axis");
    if (transformationType === "translation") {
      setDx(4);
      setDy(2);
    }
    if (transformationType === "rotation") {
      setAngleDeg(90);
      setRotCenter({ x: 0, y: 0 });
    }
    if (transformationType === "homothety") {
      setScaleK(2);
      setHomoCenter({ x: 0, y: 0 });
    }
    if (transformationType === "central_reflection") {
      setCentralCenter({ x: 1, y: 1 });
    }
  }, [transformationType, getDefaultPoints]);

  // ── 3. ANIMATION LOOP ───────────────────────────────────────────────────
  const startAnimation = () => {
    setIsAnimating(true);
    setAnimProgress(0);
    const startTime = performance.now();
    const duration = 1200; // 1.2 seconds

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease-in-out cubic
      const eased =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setAnimProgress(eased);

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setIsAnimating(false);
        setAnimProgress(1);
      }
    };

    animRef.current = requestAnimationFrame(frame);
  };

  const stopAnimation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
    setAnimProgress(1);
  };

  // ── 4. TRANSFORM CALCULATOR ──────────────────────────────────────────────
  const transformPoint = useCallback(
    (pt: { x: number; y: number }): { x: number; y: number } => {
      const { x, y } = pt;
      let fullX = x;
      let fullY = y;

      switch (transformationType) {
        case "reflection":
          if (reflectionAxis === "y-axis") {
            fullX = -x;
            fullY = y;
          } else if (reflectionAxis === "x-axis") {
            fullX = x;
            fullY = -y;
          } else if (reflectionAxis === "y=x") {
            fullX = y;
            fullY = x;
          } else if (reflectionAxis === "y=-x") {
            fullX = -y;
            fullY = -x;
          } else if (reflectionAxis === "x=k") {
            fullX = 2 * axisK - x;
            fullY = y;
          } else if (reflectionAxis === "y=k") {
            fullX = x;
            fullY = 2 * axisK - y;
          }
          break;

        case "translation":
          fullX = x + dx;
          fullY = y + dy;
          break;

        case "rotation": {
          const rad = (angleDeg * Math.PI) / 180;
          const rx = x - rotCenter.x;
          const ry = y - rotCenter.y;
          fullX = rotCenter.x + rx * Math.cos(rad) - ry * Math.sin(rad);
          fullY = rotCenter.y + rx * Math.sin(rad) + ry * Math.cos(rad);
          break;
        }

        case "homothety":
          fullX = homoCenter.x + scaleK * (x - homoCenter.x);
          fullY = homoCenter.y + scaleK * (y - homoCenter.y);
          break;

        case "central_reflection":
          fullX = 2 * centralCenter.x - x;
          fullY = 2 * centralCenter.y - y;
          break;
      }

      // Interpolate if animating
      if (animProgress < 1) {
        return {
          x: x + (fullX - x) * animProgress,
          y: y + (fullY - y) * animProgress,
        };
      }

      return { x: fullX, y: fullY };
    },
    [
      transformationType,
      reflectionAxis,
      axisK,
      dx,
      dy,
      angleDeg,
      rotCenter,
      scaleK,
      homoCenter,
      centralCenter,
      animProgress,
    ]
  );

  const transformedPoints: Point2D[] = points.map((p) => {
    const res = transformPoint(p);
    return {
      x: roundDec(res.x, 2),
      y: roundDec(res.y, 2),
      label: `${p.label}'`,
    };
  });

  // ── 5. DRAG ENGINE ───────────────────────────────────────────────────────
  const [activeDragTarget, setActiveDragTarget] = useState<string | null>(null);

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveDragTarget(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDragTarget || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert SVG viewbox scaling
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;

    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    // Convert to math coordinate
    const mx = Math.max(-RANGE_X, Math.min(RANGE_X, toMathX(svgX)));
    const my = Math.max(-RANGE_Y, Math.min(RANGE_Y, toMathY(svgY)));

    if (activeDragTarget.startsWith("point-")) {
      const idx = parseInt(activeDragTarget.replace("point-", ""), 10);
      setPoints((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], x: mx, y: my };
        return next;
      });
    } else if (activeDragTarget === "center-rot") {
      setRotCenter({ x: mx, y: my });
    } else if (activeDragTarget === "center-homo") {
      setHomoCenter({ x: mx, y: my });
    } else if (activeDragTarget === "center-central") {
      setCentralCenter({ x: mx, y: my });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDragTarget) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }
      setActiveDragTarget(null);
    }
  };

  // Reset to default
  const handleReset = () => {
    setPoints(getDefaultPoints(transformationType));
    if (transformationType === "reflection") {
      setReflectionAxis("y-axis");
      setAxisK(1);
    } else if (transformationType === "translation") {
      setDx(4);
      setDy(2);
    } else if (transformationType === "rotation") {
      setAngleDeg(90);
      setRotCenter({ x: 0, y: 0 });
    } else if (transformationType === "homothety") {
      setScaleK(2);
      setHomoCenter({ x: 0, y: 0 });
    } else if (transformationType === "central_reflection") {
      setCentralCenter({ x: 1, y: 1 });
    }
  };

  // Render axis line for reflection
  const renderReflectionAxis = () => {
    if (transformationType !== "reflection") return null;

    let x1 = 0,
      y1 = 0,
      x2 = 0,
      y2 = 0,
      axisName = "";

    if (reflectionAxis === "y-axis") {
      x1 = toScreenX(0);
      y1 = 15;
      x2 = toScreenX(0);
      y2 = H - 15;
      axisName = "Eje Y (x = 0)";
    } else if (reflectionAxis === "x-axis") {
      x1 = 15;
      y1 = toScreenY(0);
      x2 = W - 15;
      y2 = toScreenY(0);
      axisName = "Eje X (y = 0)";
    } else if (reflectionAxis === "y=x") {
      x1 = toScreenX(-RANGE_X);
      y1 = toScreenY(-RANGE_X);
      x2 = toScreenX(RANGE_X);
      y2 = toScreenY(RANGE_X);
      axisName = "Recta y = x";
    } else if (reflectionAxis === "y=-x") {
      x1 = toScreenX(-RANGE_X);
      y1 = toScreenY(RANGE_X);
      x2 = toScreenX(RANGE_X);
      y2 = toScreenY(-RANGE_X);
      axisName = "Recta y = -x";
    } else if (reflectionAxis === "x=k") {
      x1 = toScreenX(axisK);
      y1 = 15;
      x2 = toScreenX(axisK);
      y2 = H - 15;
      axisName = `Recta x = ${axisK}`;
    } else if (reflectionAxis === "y=k") {
      x1 = 15;
      y1 = toScreenY(axisK);
      x2 = W - 15;
      y2 = toScreenY(axisK);
      axisName = `Recta y = ${axisK}`;
    }

    return (
      <g>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#dc2626"
          strokeWidth="2.5"
          strokeDasharray="10,6"
        />
        <rect
          x={Math.min(W - 130, Math.max(20, x1 + 10))}
          y={Math.min(H - 30, Math.max(20, y1 + 10))}
          width={116}
          height={24}
          rx="6"
          fill="#fef2f2"
          stroke="#fca5a5"
          strokeWidth="1.5"
        />
        <text
          x={Math.min(W - 130, Math.max(20, x1 + 10)) + 8}
          y={Math.min(H - 30, Math.max(20, y1 + 10)) + 16}
          fontSize="11"
          fill="#b91c1c"
          fontWeight="bold"
        >
          {axisName}
        </text>
      </g>
    );
  };

  // Polygon points formatted for SVG
  const origPolygonStr = points
    .map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`)
    .join(" ");
  const transPolygonStr = transformedPoints
    .map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`)
    .join(" ");

  return (
    <div className="space-y-4">
      {/* ── DYNAMIC CONTROLS TOOLBAR ────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side Controls according to transformation */}
        <div className="flex flex-wrap items-center gap-2.5">
          {transformationType === "reflection" && (
            <>
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Eje de Simetría:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "y-axis", label: "Eje Y" },
                  { id: "x-axis", label: "Eje X" },
                  { id: "y=x", label: "y = x" },
                  { id: "y=-x", label: "y = -x" },
                  { id: "x=k", label: "x = k" },
                  { id: "y=k", label: "y = k" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setReflectionAxis(item.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      reflectionAxis === item.id
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {(reflectionAxis === "x=k" || reflectionAxis === "y=k") && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    k = {axisK}:
                  </span>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={axisK}
                    onChange={(e) => setAxisK(parseFloat(e.target.value))}
                    className="w-24 accent-rose-600 cursor-pointer"
                  />
                </div>
              )}
            </>
          )}

          {transformationType === "translation" && (
            <>
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Vector Director v:
              </span>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <span className="text-blue-600 font-extrabold">
                  v = ({dx}, {dy})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Δx:</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={dx}
                    onChange={(e) => setDx(parseFloat(e.target.value))}
                    className="w-20 accent-blue-600 cursor-pointer"
                  />
                  <span className="w-5 text-right font-mono">{dx}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Δy:</span>
                  <input
                    type="range"
                    min="-4"
                    max="4"
                    step="0.5"
                    value={dy}
                    onChange={(e) => setDy(parseFloat(e.target.value))}
                    className="w-20 accent-blue-600 cursor-pointer"
                  />
                  <span className="w-5 text-right font-mono">{dy}</span>
                </div>
              </div>
            </>
          )}

          {transformationType === "rotation" && (
            <>
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Ángulo α:
              </span>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-amber-600">
                {angleDeg}°
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="-180"
                  max="360"
                  step="15"
                  value={angleDeg}
                  onChange={(e) => setAngleDeg(parseInt(e.target.value, 10))}
                  className="w-28 accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1">
                {[90, 180, 270, -90].map((deg) => (
                  <button
                    key={deg}
                    onClick={() => setAngleDeg(deg)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      angleDeg === deg
                        ? "bg-amber-500 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {deg > 0 ? `+${deg}°` : `${deg}°`}
                  </button>
                ))}
              </div>
            </>
          )}

          {transformationType === "homothety" && (
            <>
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Factor k:
              </span>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-purple-600">
                k = {scaleK} (Área ×{roundDec(scaleK * scaleK, 2)})
              </div>

              <input
                type="range"
                min="-2"
                max="2.5"
                step="0.25"
                value={scaleK}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setScaleK(val === 0 ? 0.25 : val);
                }}
                className="w-28 accent-purple-600 cursor-pointer"
              />

              <div className="flex items-center gap-1">
                {[0.5, 1.5, 2, -1].map((val) => (
                  <button
                    key={val}
                    onClick={() => setScaleK(val)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      scaleK === val
                        ? "bg-purple-600 text-white"
                        : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {val}×
                  </button>
                ))}
              </div>
            </>
          )}

          {transformationType === "central_reflection" && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 uppercase font-black">Centro O:</span>
              <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 font-mono text-sky-600 font-black">
                O({centralCenter.x}, {centralCenter.y})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                (Arrastra el punto O en el plano)
              </span>
            </div>
          )}
        </div>

        {/* Right Side Actions: Animate & Reset */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Animate button */}
          <button
            onClick={isAnimating ? stopAnimation : startAnimation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer ${
              isAnimating
                ? "bg-amber-500 text-white"
                : "bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white"
            }`}
            title="Animar la transformación paso a paso"
          >
            {isAnimating ? (
              <>
                <Pause className="h-3.5 w-3.5" /> <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> <span>Animar</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 hover:text-slate-900 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
            title="Restablecer posiciones por defecto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* ── INTERACTIVE CANVAS AREA ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden select-none">
        {/* Dynamic Badge & Instructions */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-extrabold backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Laboratorio Interactivo
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
            🖐️ Arrastra cualquier vértice (A, B, C) o el centro en el plano
          </span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto max-h-[460px] mx-auto block cursor-crosshair touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            <marker
              id="ax-int"
              markerWidth="6"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#0f172a" />
            </marker>
            <marker
              id="arr-arrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0,0 L0,7 L7,3.5 z" fill="#6366f1" />
            </marker>
          </defs>

          {/* ── GRID & AXES ──────────────────────────────────────────── */}
          <g>
            {/* Grid lines */}
            {Array.from({ length: 2 * RANGE_X + 1 }).map((_, i) => {
              const xVal = i - RANGE_X;
              const sx = toScreenX(xVal);
              return (
                <line
                  key={`gx-${i}`}
                  x1={sx}
                  y1={0}
                  x2={sx}
                  y2={H}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={xVal === 0 ? undefined : "2,2"}
                />
              );
            })}
            {Array.from({ length: 2 * RANGE_Y + 1 }).map((_, i) => {
              const yVal = i - RANGE_Y;
              const sy = toScreenY(yVal);
              return (
                <line
                  key={`gy-${i}`}
                  x1={0}
                  y1={sy}
                  x2={W}
                  y2={sy}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={yVal === 0 ? undefined : "2,2"}
                />
              );
            })}

            {/* Main Axes */}
            <line
              x1={0}
              y1={CY}
              x2={W}
              y2={CY}
              stroke="#0f172a"
              strokeWidth="2.5"
              markerEnd="url(#ax-int)"
            />
            <line
              x1={CX}
              y1={H}
              x2={CX}
              y2={0}
              stroke="#0f172a"
              strokeWidth="2.5"
              markerEnd="url(#ax-int)"
            />
            <text
              x={W - 14}
              y={CY - 10}
              fontSize="14"
              fill="#0f172a"
              fontWeight="bold"
            >
              X
            </text>
            <text
              x={CX + 10}
              y={16}
              fontSize="14"
              fill="#0f172a"
              fontWeight="bold"
            >
              Y
            </text>
            <text
              x={CX - 12}
              y={CY + 15}
              fontSize="11"
              fill="#475569"
              fontWeight="bold"
            >
              0
            </text>

            {/* Labels */}
            {Array.from({ length: 2 * RANGE_X + 1 }).map((_, i) => {
              const xVal = i - RANGE_X;
              if (xVal === 0) return null;
              return (
                <text
                  key={`lx-${i}`}
                  x={toScreenX(xVal)}
                  y={CY + 15}
                  fontSize="11"
                  fill="#475569"
                  textAnchor="middle"
                  fontWeight="700"
                >
                  {xVal}
                </text>
              );
            })}
            {Array.from({ length: 2 * RANGE_Y + 1 }).map((_, i) => {
              const yVal = i - RANGE_Y;
              if (yVal === 0) return null;
              return (
                <text
                  key={`ly-${i}`}
                  x={CX - 8}
                  y={toScreenY(yVal) + 4}
                  fontSize="11"
                  fill="#475569"
                  textAnchor="end"
                  fontWeight="700"
                >
                  {yVal}
                </text>
              );
            })}
          </g>

          {/* ── REFLECTION AXIS (If Reflection) ───────────────────────── */}
          {renderReflectionAxis()}

          {/* ── ROTATION CENTER & CIRCULAR ARCS ───────────────────────── */}
          {transformationType === "rotation" && (
            <g>
              {/* Rotation Center C */}
              <circle
                cx={toScreenX(rotCenter.x)}
                cy={toScreenY(rotCenter.y)}
                r="7"
                fill="#d97706"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={toScreenX(rotCenter.x)}
                cy={toScreenY(rotCenter.y)}
                r="18"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown("center-rot", e)}
              />
              <text
                x={toScreenX(rotCenter.x) + 12}
                y={toScreenY(rotCenter.y) + 18}
                fontSize="12"
                fill="#b45309"
                fontWeight="extrabold"
              >
                C({rotCenter.x},{rotCenter.y})
              </text>

              {/* Arcs between corresponding points */}
              {points.map((p, i) => {
                const tp = transformedPoints[i];
                const r =
                  Math.sqrt(
                    Math.pow(p.x - rotCenter.x, 2) +
                      Math.pow(p.y - rotCenter.y, 2)
                  ) * STEP;
                return (
                  <line
                    key={`arc-${i}`}
                    x1={toScreenX(p.x)}
                    y1={toScreenY(p.y)}
                    x2={toScreenX(tp.x)}
                    y2={toScreenY(tp.y)}
                    stroke="#d9770650"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                );
              })}
            </g>
          )}

          {/* ── HOMOTHETY PROJECTION RAYS ─────────────────────────────── */}
          {transformationType === "homothety" && (
            <g>
              {/* Center */}
              <circle
                cx={toScreenX(homoCenter.x)}
                cy={toScreenY(homoCenter.y)}
                r="7"
                fill="#9333ea"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={toScreenX(homoCenter.x)}
                cy={toScreenY(homoCenter.y)}
                r="18"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown("center-homo", e)}
              />
              <text
                x={toScreenX(homoCenter.x) + 12}
                y={toScreenY(homoCenter.y) + 18}
                fontSize="12"
                fill="#7e22ce"
                fontWeight="extrabold"
              >
                C({homoCenter.x},{homoCenter.y})
              </text>

              {/* Ray lines */}
              {points.map((p, i) => {
                const tp = transformedPoints[i];
                return (
                  <line
                    key={`ray-${i}`}
                    x1={toScreenX(homoCenter.x)}
                    y1={toScreenY(homoCenter.y)}
                    x2={toScreenX(tp.x)}
                    y2={toScreenY(tp.y)}
                    stroke="#9333ea60"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />
                );
              })}
            </g>
          )}

          {/* ── CENTRAL REFLECTION CENTER ─────────────────────────────── */}
          {transformationType === "central_reflection" && (
            <g>
              <circle
                cx={toScreenX(centralCenter.x)}
                cy={toScreenY(centralCenter.y)}
                r="7"
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={toScreenX(centralCenter.x)}
                cy={toScreenY(centralCenter.y)}
                r="18"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown("center-central", e)}
              />
              <text
                x={toScreenX(centralCenter.x) + 12}
                y={toScreenY(centralCenter.y) - 6}
                fontSize="12"
                fill="#0369a1"
                fontWeight="extrabold"
              >
                O({centralCenter.x},{centralCenter.y})
              </text>

              {/* Connecting lines with midpoint */}
              {points.map((p, i) => {
                const tp = transformedPoints[i];
                return (
                  <line
                    key={`centline-${i}`}
                    x1={toScreenX(p.x)}
                    y1={toScreenY(p.y)}
                    x2={toScreenX(tp.x)}
                    y2={toScreenY(tp.y)}
                    stroke="#0284c770"
                    strokeWidth="1.5"
                    strokeDasharray="5,4"
                  />
                );
              })}
            </g>
          )}

          {/* ── CORRESPONDENCE RAYS FOR REFLECTION / TRANSLATION ──────── */}
          {transformationType === "reflection" &&
            points.map((p, i) => {
              const tp = transformedPoints[i];
              return (
                <line
                  key={`refline-${i}`}
                  x1={toScreenX(p.x)}
                  y1={toScreenY(p.y)}
                  x2={toScreenX(tp.x)}
                  y2={toScreenY(tp.y)}
                  stroke="#4f46e5"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
              );
            })}

          {transformationType === "translation" && (
            <g>
              {/* Main Vector Arrow at bottom left or center */}
              <line
                x1={toScreenX(-4)}
                y1={toScreenY(-3.5)}
                x2={toScreenX(-4 + dx)}
                y2={toScreenY(-3.5 + dy)}
                stroke="#2563eb"
                strokeWidth="3.5"
                markerEnd="url(#arr-arrow)"
              />
              <rect
                x={toScreenX(-4 + dx / 2) - 35}
                y={toScreenY(-3.5 + dy / 2) - 22}
                width={70}
                height={20}
                rx="4"
                fill="#eff6ff"
                stroke="#bfdbfe"
              />
              <text
                x={toScreenX(-4 + dx / 2)}
                y={toScreenY(-3.5 + dy / 2) - 8}
                fontSize="11"
                fill="#1d4ed8"
                fontWeight="extrabold"
                textAnchor="middle"
              >
                v=({dx},{dy})
              </text>

              {/* Displacement rays for each point */}
              {points.map((p, i) => {
                const tp = transformedPoints[i];
                return (
                  <line
                    key={`transray-${i}`}
                    x1={toScreenX(p.x)}
                    y1={toScreenY(p.y)}
                    x2={toScreenX(tp.x)}
                    y2={toScreenY(tp.y)}
                    stroke="#2563eb60"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    markerEnd="url(#arr-arrow)"
                  />
                );
              })}
            </g>
          )}

          {/* ── 1. ORIGINAL FIGURE F (BLUE) ───────────────────────────── */}
          <polygon
            points={origPolygonStr}
            fill="#3b82f635"
            stroke="#1d4ed8"
            strokeWidth="2.5"
          />

          {/* ── 2. TRANSFORMED FIGURE F' (COLOR ACCENT) ───────────────── */}
          <polygon
            points={transPolygonStr}
            fill={`${colorAccent}25`}
            stroke={colorAccent}
            strokeWidth="2.5"
          />

          {/* ── 3. TRANSFORMED POINTS (INDICATOR ONLY) ────────────────── */}
          {transformedPoints.map((tp, i) => (
            <g key={`tp-${i}`}>
              <circle
                cx={toScreenX(tp.x)}
                cy={toScreenY(tp.y)}
                r="5.5"
                fill={colorAccent}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={toScreenX(tp.x) + 8}
                y={toScreenY(tp.y) - 6}
                fontSize="12"
                fill={colorAccent}
                fontWeight="extrabold"
              >
                {tp.label}
              </text>
              <text
                x={toScreenX(tp.x) + 8}
                y={toScreenY(tp.y) + 8}
                fontSize="10"
                fill={colorAccent}
                fontWeight="bold"
              >
                ({tp.x}, {tp.y})
              </text>
            </g>
          ))}

          {/* ── 4. DRAGGABLE ORIGINAL POINTS A, B, C (INTERACTIVE) ───── */}
          {points.map((p, i) => (
            <g key={`orig-pt-${i}`}>
              {/* Outer halo when active or dragging */}
              <circle
                cx={toScreenX(p.x)}
                cy={toScreenY(p.y)}
                r="10"
                fill="#3b82f620"
                stroke="#3b82f6"
                strokeWidth="1"
                className="animate-pulse"
              />
              {/* Visual point dot */}
              <circle
                cx={toScreenX(p.x)}
                cy={toScreenY(p.y)}
                r="6.5"
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Big transparent touch/click area for effortless dragging */}
              <circle
                cx={toScreenX(p.x)}
                cy={toScreenY(p.y)}
                r="20"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(`point-${i}`, e)}
              />
              <text
                x={toScreenX(p.x) - 16}
                y={toScreenY(p.y) - 8}
                fontSize="13"
                fill="#1e3a8a"
                fontWeight="black"
              >
                {p.label}
              </text>
              <text
                x={toScreenX(p.x) - 20}
                y={toScreenY(p.y) + 16}
                fontSize="10"
                fill="#1e40af"
                fontWeight="bold"
              >
                ({p.x}, {p.y})
              </text>
            </g>
          ))}
        </svg>

        {/* Dynamic Legend at Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
              Figura Original F (Arrastrable)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <span
                className="w-3 h-3 rounded-xs inline-block"
                style={{ backgroundColor: colorAccent }}
              />
              Imagen Transformada F'
            </span>
          </div>

          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Puntos adaptados con salto a semi-enteros (0.5) para cálculos exactos
          </div>
        </div>
      </div>

      {/* ── REAL-TIME VALUES & COORDINATES PANEL ────────────────────────────── */}
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-indigo-600" />
            Coordenadas en Tiempo Real
          </h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Cálculo Instantáneo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {points.map((p, i) => {
            const tp = transformedPoints[i];
            return (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-extrabold text-blue-600 uppercase">
                    Vértice {p.label}
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    ({p.x}, {p.y})
                  </div>
                </div>

                <div className="text-slate-400 font-bold text-sm">→</div>

                <div className="text-right">
                  <span
                    className="text-[10px] font-extrabold uppercase"
                    style={{ color: colorAccent }}
                  >
                    Imagen {tp.label}
                  </span>
                  <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                    ({tp.x}, {tp.y})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
