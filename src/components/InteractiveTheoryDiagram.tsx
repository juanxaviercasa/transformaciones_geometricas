import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { TransformationType } from "../types/geometry";
import {
  RotateCcw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Move,
  RotateCw,
  FlipHorizontal,
  Target,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Sliders,
  Compass,
  ArrowRight,
  Info,
} from "lucide-react";

export interface Point2D {
  x: number;
  y: number;
  label: string;
}

export interface InteractiveTheoryDiagramProps {
  transformationType: TransformationType;
  colorAccent: string;
  onChangeTransformationType?: (type: TransformationType) => void;
}

// ─── SHAPE PRESETS FOR TEACHING ──────────────────────────────────────────────
export interface ShapePreset {
  id: string;
  name: string;
  description: string;
  points: Point2D[];
}

const PRESET_SHAPES: Record<string, ShapePreset> = {
  triangle_scalene: {
    id: "triangle_scalene",
    name: "Triángulo Escaleno",
    description: "Ideal para observar inversión de orientación y distancias diferentes.",
    points: [
      { x: -4, y: 1, label: "A" },
      { x: -1, y: 3.5, label: "B" },
      { x: -2, y: -2, label: "C" },
    ],
  },
  triangle_right: {
    id: "triangle_right",
    name: "Triángulo Rectángulo",
    description: "El ángulo recto de 90° sirve de referencia clara al rotar y reflejar.",
    points: [
      { x: -4, y: -1, label: "A" },
      { x: -1, y: -1, label: "B" },
      { x: -4, y: 3, label: "C" },
    ],
  },
  arrow: {
    id: "arrow",
    name: "Flecha Direccional",
    description: "Muestra con total claridad la dirección y el sentido del movimiento.",
    points: [
      { x: -4, y: 0.5, label: "A" },
      { x: -2, y: 0.5, label: "B" },
      { x: -2, y: 1.5, label: "C" },
      { x: 0, y: 0, label: "D" },
      { x: -2, y: -1.5, label: "E" },
      { x: -2, y: -0.5, label: "F" },
      { x: -4, y: -0.5, label: "G" },
    ],
  },
  l_shape: {
    id: "l_shape",
    name: "L Asimétrica",
    description: "Figura asimétrica perfecta para verificar que la figura giró o se reflejó.",
    points: [
      { x: -4, y: -2, label: "A" },
      { x: -2, y: -2, label: "B" },
      { x: -2, y: -0.5, label: "C" },
      { x: -3, y: -0.5, label: "D" },
      { x: -3, y: 2.5, label: "E" },
      { x: -4, y: 2.5, label: "F" },
    ],
  },
  house: {
    id: "house",
    name: "Casa Geométrica",
    description: "Polígono compuesto fácil de reconocer en ampliaciones y giros.",
    points: [
      { x: -4, y: -2, label: "A" },
      { x: -1, y: -2, label: "B" },
      { x: -1, y: 1, label: "C" },
      { x: -2.5, y: 3, label: "D" },
      { x: -4, y: 1, label: "E" },
    ],
  },
  quad_centered: {
    id: "quad_centered",
    name: "Cuadrilátero",
    description: "Permite estudiar el paralelismo y conservación de diagonales.",
    points: [
      { x: -4, y: -1.5, label: "A" },
      { x: -1, y: -2, label: "B" },
      { x: -1.5, y: 2, label: "C" },
      { x: -3.5, y: 1.5, label: "D" },
    ],
  },
};

// Canvas default metrics
const BASE_W = 860;
const BASE_H = 500;
const BASE_CX = 430;
const BASE_CY = 250;
const BASE_STEP = 42; // pixels per unit
const RANGE_X = 9;
const RANGE_Y = 5.5;

function roundDec(val: number, dec: number = 1): number {
  const factor = Math.pow(10, dec);
  return Math.round(val * factor) / factor;
}

// Shoelace formula for polygon area
function computePolygonArea(pts: Point2D[]): number {
  if (pts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

// Signed area to detect clockwise vs counter-clockwise orientation
function computeOrientation(pts: Point2D[]): "directa" | "antidirecta" {
  if (pts.length < 3) return "directa";
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    sum += (pts[j].x - pts[i].x) * (pts[j].y + pts[i].y);
  }
  // If sum < 0: Counter-clockwise (directa), if sum > 0: Clockwise (antidirecta)
  return sum <= 0 ? "directa" : "antidirecta";
}

// Side lengths
function computePerimeter(pts: Point2D[]): number {
  if (pts.length < 2) return 0;
  let perim = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const dx = pts[j].x - pts[i].x;
    const dy = pts[j].y - pts[i].y;
    perim += Math.sqrt(dx * dx + dy * dy);
  }
  return perim;
}

export const InteractiveTheoryDiagram: React.FC<InteractiveTheoryDiagramProps> = ({
  transformationType,
  colorAccent,
  onChangeTransformationType,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // ── 1. ACTIVE FIGURE & POINTS ─────────────────────────────────────────────
  const [selectedPreset, setSelectedPreset] = useState<string>("triangle_scalene");

  const getInitialPointsForType = useCallback(
    (type: TransformationType, presetKey: string): Point2D[] => {
      const basePreset = PRESET_SHAPES[presetKey] ?? PRESET_SHAPES.triangle_scalene;
      const pts = basePreset.points.map((p) => ({ ...p }));

      // Adjust default position depending on transformation to fit view comfortably
      if (type === "reflection") {
        return pts.map((p) => ({ x: p.x < 0 ? p.x : -Math.abs(p.x) - 1, y: p.y, label: p.label }));
      }
      if (type === "translation") {
        return pts.map((p) => ({ x: p.x < 0 ? p.x - 0.5 : p.x - 3, y: p.y - 0.5, label: p.label }));
      }
      if (type === "rotation") {
        return [
          { x: 1.5, y: 1, label: "A" },
          { x: 4, y: 1, label: "B" },
          { x: 2, y: 3.5, label: "C" },
        ];
      }
      if (type === "homothety") {
        return [
          { x: 1.5, y: 1, label: "A" },
          { x: 3.5, y: 1, label: "B" },
          { x: 2, y: 3, label: "C" },
        ];
      }
      if (type === "central_reflection") {
        return [
          { x: -3.5, y: 1, label: "A" },
          { x: -1.5, y: 3, label: "B" },
          { x: -1, y: 1, label: "C" },
        ];
      }
      return pts;
    },
    []
  );

  const [points, setPoints] = useState<Point2D[]>(() =>
    getInitialPointsForType(transformationType, "triangle_scalene")
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
  const [rotCenter, setRotCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Homothety: factor k and center C
  const [scaleK, setScaleK] = useState<number>(1.75);
  const [homoCenter, setHomoCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Central reflection: center O
  const [centralCenter, setCentralCenter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── 3. PLAYBACK, TIMELINE & STEP-BY-STEP ────────────────────────────────
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(1); // 0.0 to 1.0
  const [animSpeed, setAnimSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const [didacticStep, setDidacticStep] = useState<number>(5); // 1 to 5
  const animRef = useRef<number | null>(null);

  // ── 4. UI SETTINGS & TOGGLES ─────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isForcedLandscape, setIsForcedLandscape] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showDistances, setShowDistances] = useState<boolean>(true);
  const [activeDeckTab, setActiveDeckTab] = useState<
    "controls" | "steps" | "formulas" | "invariants"
  >("controls");

  const toggleLandscapeMode = () => {
    setIsForcedLandscape((prev) => !prev);
  };

  const handleToggleExpand = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        if (screen.orientation && "lock" in screen.orientation) {
          await (screen.orientation as any).lock("landscape").catch(() => {});
        }
      } catch (err) {
        // Fallback
      }

      // Si es pantalla móvil vertical (ancho < 768 y alto > ancho), activar automáticamente giro a 16:9 como YouTube
      if (typeof window !== "undefined" && window.innerWidth < 768 && window.innerHeight > window.innerWidth) {
        setIsForcedLandscape(true);
      }
    } else {
      setIsExpanded(false);
      setIsForcedLandscape(false);
      try {
        if (screen.orientation && "unlock" in screen.orientation) {
          (screen.orientation as any).unlock();
        }
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        // Fallback
      }
    }
  };

  // Reset when transformationType changes
  useEffect(() => {
    setPoints(getInitialPointsForType(transformationType, selectedPreset));
    setIsAnimating(false);
    setAnimProgress(1);
    setDidacticStep(5);
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
      setScaleK(1.75);
      setHomoCenter({ x: 0, y: 0 });
    }
    if (transformationType === "central_reflection") {
      setCentralCenter({ x: 0, y: 0 });
    }
  }, [transformationType, getInitialPointsForType, selectedPreset]);

  // Coordinate transforms with zoom
  const STEP = BASE_STEP * zoomLevel;
  const W = BASE_W;
  const H = BASE_H;
  const CX = BASE_CX;
  const CY = BASE_CY;

  const toScreenX = useCallback((x: number): number => CX + x * STEP, [CX, STEP]);
  const toScreenY = useCallback((y: number): number => CY - y * STEP, [CY, STEP]);

  const toMathX = useCallback(
    (sx: number): number => {
      const val = (sx - CX) / STEP;
      return Math.round(val * 2) / 2; // snap to 0.5
    },
    [CX, STEP]
  );

  const toMathY = useCallback(
    (sy: number): number => {
      const val = (CY - sy) / STEP;
      return Math.round(val * 2) / 2; // snap to 0.5
    },
    [CY, STEP]
  );

  // ── 5. TRANSFORMATION ENGINE ─────────────────────────────────────────────
  const transformPointTarget = useCallback(
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
    ]
  );

  // Interpolated point for animation / scrubber
  const getInterpolatedPoint = useCallback(
    (pt: { x: number; y: number }, t: number): { x: number; y: number } => {
      const target = transformPointTarget(pt);

      if (transformationType === "rotation") {
        // Curved rotation path
        const currentAngle = angleDeg * t;
        const rad = (currentAngle * Math.PI) / 180;
        const rx = pt.x - rotCenter.x;
        const ry = pt.y - rotCenter.y;
        return {
          x: rotCenter.x + rx * Math.cos(rad) - ry * Math.sin(rad),
          y: rotCenter.y + rx * Math.sin(rad) + ry * Math.cos(rad),
        };
      }

      // Linear interpolation for reflection, translation, homothety, central symmetry
      return {
        x: pt.x + (target.x - pt.x) * t,
        y: pt.y + (target.y - pt.y) * t,
      };
    },
    [transformPointTarget, transformationType, angleDeg, rotCenter]
  );

  // Target points (100% completed)
  const targetPoints: Point2D[] = useMemo(() => {
    return points.map((p) => {
      const res = transformPointTarget(p);
      return {
        x: roundDec(res.x, 2),
        y: roundDec(res.y, 2),
        label: `${p.label}'`,
      };
    });
  }, [points, transformPointTarget]);

  // Current displayed transformed points based on animProgress
  const currentTransformedPoints: Point2D[] = useMemo(() => {
    return points.map((p) => {
      const res = getInterpolatedPoint(p, animProgress);
      return {
        x: roundDec(res.x, 2),
        y: roundDec(res.y, 2),
        label: `${p.label}'`,
      };
    });
  }, [points, getInterpolatedPoint, animProgress]);

  // Metric computations
  const origArea = useMemo(() => roundDec(computePolygonArea(points), 2), [points]);
  const targetArea = useMemo(() => roundDec(computePolygonArea(targetPoints), 2), [targetPoints]);
  const origPerimeter = useMemo(() => roundDec(computePerimeter(points), 2), [points]);
  const targetPerimeter = useMemo(() => roundDec(computePerimeter(targetPoints), 2), [targetPoints]);
  const origOrientation = useMemo(() => computeOrientation(points), [points]);
  const targetOrientation = useMemo(() => computeOrientation(targetPoints), [targetPoints]);

  // ── 6. ANIMATION CONTROLS ────────────────────────────────────────────────
  const startAnimation = () => {
    setIsAnimating(true);
    let startProgress = animProgress >= 1 ? 0 : animProgress;
    setAnimProgress(startProgress);
    const startTime = performance.now();
    const duration = (1500 / animSpeed) * (1 - startProgress);

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, startProgress + (elapsed / duration) * (1 - startProgress));
      setAnimProgress(t);

      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setIsAnimating(false);
        setAnimProgress(1);
        setDidacticStep(5);
      }
    };

    animRef.current = requestAnimationFrame(frame);
  };

  const stopAnimation = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setIsAnimating(false);
  };

  const handleReset = () => {
    stopAnimation();
    setPoints(getInitialPointsForType(transformationType, selectedPreset));
    setAnimProgress(1);
    setDidacticStep(5);
    setZoomLevel(1);
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
      setScaleK(1.75);
      setHomoCenter({ x: 0, y: 0 });
    } else if (transformationType === "central_reflection") {
      setCentralCenter({ x: 0, y: 0 });
    }
  };

  // Change preset shape
  const handleSelectShape = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setPoints(getInitialPointsForType(transformationType, presetKey));
    setAnimProgress(1);
    setDidacticStep(5);
  };

  // Handle didactic step navigation
  const handleStepChange = (step: number) => {
    setDidacticStep(step);
    if (step === 1) setAnimProgress(0);
    else if (step === 2) setAnimProgress(0);
    else if (step === 3) setAnimProgress(0.25);
    else if (step === 4) setAnimProgress(0.75);
    else if (step === 5) setAnimProgress(1);
  };

  // ── 7. DRAG ENGINE ───────────────────────────────────────────────────────
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
    
    let clientX = e.clientX - rect.left;
    let clientY = e.clientY - rect.top;
    let scaleX = W / rect.width;
    let scaleY = H / rect.height;

    if (isExpanded && isForcedLandscape) {
      // En modo girado 16:9 por CSS (90deg):
      // El eje X local corre hacia abajo (e.clientY - rect.top)
      // El eje Y local corre hacia la izquierda (rect.right - e.clientX)
      clientX = e.clientY - rect.top;
      clientY = rect.right - e.clientX;
      scaleX = W / rect.height;
      scaleY = H / rect.width;
    }

    const svgX = clientX * scaleX;
    const svgY = clientY * scaleY;

    const mx = Math.max(-RANGE_X - 2, Math.min(RANGE_X + 2, toMathX(svgX)));
    const my = Math.max(-RANGE_Y - 2, Math.min(RANGE_Y + 2, toMathY(svgY)));

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
    } else if (activeDragTarget === "vector-head") {
      // Dragging the translation vector arrow head
      setDx(mx - -4);
      setDy(my - -3.5);
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

  // ── 8. RENDER GEOMETRIC GUIDES ───────────────────────────────────────────
  const renderGeometricGuides = () => {
    if (!showGuides && didacticStep < 3) return null;

    if (transformationType === "reflection") {
      return (
        <g opacity={didacticStep >= 3 ? 1 : 0.4}>
          {points.map((p, i) => {
            const tp = targetPoints[i];
            const midX = (p.x + tp.x) / 2;
            const midY = (p.y + tp.y) / 2;

            return (
              <g key={`refl-guide-${i}`}>
                {/* Perpendicular segment connecting P and P' */}
                <line
                  x1={toScreenX(p.x)}
                  y1={toScreenY(p.y)}
                  x2={toScreenX(tp.x)}
                  y2={toScreenY(tp.y)}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Foot of the perpendicular H */}
                <circle cx={toScreenX(midX)} cy={toScreenY(midY)} r="3" fill="#6366f1" />

                {/* Right-angle square indicator at H */}
                {showDistances && (
                  <rect
                    x={toScreenX(midX) - 5}
                    y={toScreenY(midY) - 5}
                    width="10"
                    height="10"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    opacity="0.7"
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    }

    if (transformationType === "translation") {
      return (
        <g opacity={didacticStep >= 3 ? 1 : 0.4}>
          {/* Main translation vector demo at bottom left */}
          <g>
            {/* Horizontal dx decomposition */}
            <line
              x1={toScreenX(-4)}
              y1={toScreenY(-3.5)}
              x2={toScreenX(-4 + dx)}
              y2={toScreenY(-3.5)}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <text
              x={toScreenX(-4 + dx / 2)}
              y={toScreenY(-3.5) + 14}
              fontSize="10"
              fill="#2563eb"
              fontWeight="bold"
              textAnchor="middle"
            >
              Δx = {dx}
            </text>

            {/* Vertical dy decomposition */}
            <line
              x1={toScreenX(-4 + dx)}
              y1={toScreenY(-3.5)}
              x2={toScreenX(-4 + dx)}
              y2={toScreenY(-3.5 + dy)}
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <text
              x={toScreenX(-4 + dx) + 8}
              y={toScreenY(-3.5 + dy / 2) + 3}
              fontSize="10"
              fill="#2563eb"
              fontWeight="bold"
            >
              Δy = {dy}
            </text>

            {/* Vector arrow */}
            <line
              x1={toScreenX(-4)}
              y1={toScreenY(-3.5)}
              x2={toScreenX(-4 + dx)}
              y2={toScreenY(-3.5 + dy)}
              stroke="#1d4ed8"
              strokeWidth="3.5"
              markerEnd="url(#arr-arrow-blue)"
            />
            <circle
              cx={toScreenX(-4 + dx)}
              cy={toScreenY(-3.5 + dy)}
              r="7"
              fill="#2563eb"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => handlePointerDown("vector-head", e)}
            />
            <rect
              x={toScreenX(-4 + dx / 2) - 40}
              y={toScreenY(-3.5 + dy / 2) - 24}
              width="80"
              height="20"
              rx="5"
              fill="#eff6ff"
              stroke="#93c5fd"
            />
            <text
              x={toScreenX(-4 + dx / 2)}
              y={toScreenY(-3.5 + dy / 2) - 10}
              fontSize="11"
              fill="#1e40af"
              fontWeight="extrabold"
              textAnchor="middle"
            >
              v = ({dx}, {dy})
            </text>
          </g>

          {/* Vectors from each vertex */}
          {points.map((p, i) => (
            <line
              key={`trans-ray-${i}`}
              x1={toScreenX(p.x)}
              y1={toScreenY(p.y)}
              x2={toScreenX(p.x + dx)}
              y2={toScreenY(p.y + dy)}
              stroke="#2563eb55"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              markerEnd="url(#arr-arrow-blue)"
            />
          ))}
        </g>
      );
    }

    if (transformationType === "rotation") {
      return (
        <g opacity={didacticStep >= 3 ? 1 : 0.4}>
          {/* Center of rotation C */}
          <circle
            cx={toScreenX(rotCenter.x)}
            cy={toScreenY(rotCenter.y)}
            r="8"
            fill="#d97706"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx={toScreenX(rotCenter.x)}
            cy={toScreenY(rotCenter.y)}
            r="20"
            fill="transparent"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown("center-rot", e)}
          />
          <text
            x={toScreenX(rotCenter.x) + 14}
            y={toScreenY(rotCenter.y) + 18}
            fontSize="12"
            fill="#b45309"
            fontWeight="black"
          >
            C({rotCenter.x}, {rotCenter.y})
          </text>

          {points.map((p, i) => {
            const tp = targetPoints[i];
            const dist = Math.sqrt(
              Math.pow(p.x - rotCenter.x, 2) + Math.pow(p.y - rotCenter.y, 2)
            );
            const radiusPx = dist * STEP;

            return (
              <g key={`rot-arc-${i}`}>
                {/* Ray from Center to Original Point */}
                <line
                  x1={toScreenX(rotCenter.x)}
                  y1={toScreenY(rotCenter.y)}
                  x2={toScreenX(p.x)}
                  y2={toScreenY(p.y)}
                  stroke="#d9770660"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Ray from Center to Target Point */}
                <line
                  x1={toScreenX(rotCenter.x)}
                  y1={toScreenY(rotCenter.y)}
                  x2={toScreenX(tp.x)}
                  y2={toScreenY(tp.y)}
                  stroke="#d9770660"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                {/* Circular arc connecting them */}
                <path
                  d={`M ${toScreenX(p.x)} ${toScreenY(p.y)} A ${radiusPx} ${radiusPx} 0 0 ${
                    angleDeg > 0 ? 0 : 1
                  } ${toScreenX(tp.x)} ${toScreenY(tp.y)}`}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                />
              </g>
            );
          })}
        </g>
      );
    }

    if (transformationType === "homothety") {
      return (
        <g opacity={didacticStep >= 3 ? 1 : 0.4}>
          {/* Center of homothety C */}
          <circle
            cx={toScreenX(homoCenter.x)}
            cy={toScreenY(homoCenter.y)}
            r="8"
            fill="#9333ea"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx={toScreenX(homoCenter.x)}
            cy={toScreenY(homoCenter.y)}
            r="20"
            fill="transparent"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown("center-homo", e)}
          />
          <text
            x={toScreenX(homoCenter.x) + 14}
            y={toScreenY(homoCenter.y) + 18}
            fontSize="12"
            fill="#7e22ce"
            fontWeight="black"
          >
            C({homoCenter.x}, {homoCenter.y})
          </text>

          {points.map((p, i) => {
            const tp = targetPoints[i];
            return (
              <line
                key={`homo-ray-${i}`}
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
      );
    }

    if (transformationType === "central_reflection") {
      return (
        <g opacity={didacticStep >= 3 ? 1 : 0.4}>
          {/* Center O */}
          <circle
            cx={toScreenX(centralCenter.x)}
            cy={toScreenY(centralCenter.y)}
            r="8"
            fill="#0284c7"
            stroke="#ffffff"
            strokeWidth="2.5"
          />
          <circle
            cx={toScreenX(centralCenter.x)}
            cy={toScreenY(centralCenter.y)}
            r="20"
            fill="transparent"
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => handlePointerDown("center-central", e)}
          />
          <text
            x={toScreenX(centralCenter.x) + 14}
            y={toScreenY(centralCenter.y) - 8}
            fontSize="12"
            fill="#0369a1"
            fontWeight="black"
          >
            O({centralCenter.x}, {centralCenter.y})
          </text>

          {points.map((p, i) => {
            const tp = targetPoints[i];
            return (
              <g key={`cent-ray-${i}`}>
                <line
                  x1={toScreenX(p.x)}
                  y1={toScreenY(p.y)}
                  x2={toScreenX(tp.x)}
                  y2={toScreenY(tp.y)}
                  stroke="#0284c770"
                  strokeWidth="1.5"
                  strokeDasharray="5,4"
                />
              </g>
            );
          })}
        </g>
      );
    }

    return null;
  };

  // Render reflection axis line
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
      x1 = toScreenX(-RANGE_X - 1);
      y1 = toScreenY(-RANGE_X - 1);
      x2 = toScreenX(RANGE_X + 1);
      y2 = toScreenY(RANGE_X + 1);
      axisName = "Recta y = x";
    } else if (reflectionAxis === "y=-x") {
      x1 = toScreenX(-RANGE_X - 1);
      y1 = toScreenY(RANGE_X + 1);
      x2 = toScreenX(RANGE_X + 1);
      y2 = toScreenY(-RANGE_X - 1);
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
          stroke="#e11d48"
          strokeWidth="3"
          strokeDasharray="10,6"
        />
        <rect
          x={Math.min(W - 140, Math.max(20, x1 + 10))}
          y={Math.min(H - 35, Math.max(20, y1 + 10))}
          width={124}
          height={26}
          rx="6"
          fill="#fef2f2"
          stroke="#f87171"
          strokeWidth="1.5"
          className="shadow-sm"
        />
        <text
          x={Math.min(W - 140, Math.max(20, x1 + 10)) + 10}
          y={Math.min(H - 35, Math.max(20, y1 + 10)) + 18}
          fontSize="11"
          fill="#991b1b"
          fontWeight="black"
        >
          {axisName}
        </text>
      </g>
    );
  };

  // Polygon SVG point strings
  const origPolygonStr = points.map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`).join(" ");
  const currentPolygonStr = currentTransformedPoints
    .map((p) => `${toScreenX(p.x)},${toScreenY(p.y)}`)
    .join(" ");

  // ── 9. DIDACTIC STEP METADATA ────────────────────────────────────────────
  const didacticStepsInfo = [
    {
      step: 1,
      title: "1. Vértices Originales",
      desc: "Se identifican los vértices de la figura F en el plano cartesiano y sus coordenadas iniciales.",
    },
    {
      step: 2,
      title: "2. Elemento de Transformación",
      desc:
        transformationType === "reflection"
          ? `Se ubica el eje de reflexión (${reflectionAxis}).`
          : transformationType === "translation"
          ? `Se define el vector de traslación v = (${dx}, ${dy}).`
          : transformationType === "rotation"
          ? `Se fija el centro de giro C(${rotCenter.x}, ${rotCenter.y}) y el ángulo ${angleDeg}°.`
          : transformationType === "homothety"
          ? `Se establece el centro C(${homoCenter.x}, ${homoCenter.y}) y el factor k = ${scaleK}.`
          : `Se ubica el centro de simetría O(${centralCenter.x}, ${centralCenter.y}).`,
    },
    {
      step: 3,
      title: "3. Trazos Guía de Construcción",
      desc: "Se trazan las líneas geométricas auxiliares (perpendiculares, arcos, rayos o vectores).",
    },
    {
      step: 4,
      title: "4. Sustitución en la Fórmula",
      desc: "Se evalúa la fórmula matemática con los valores de cada vértice para hallar P'.",
    },
    {
      step: 5,
      title: "5. Figura Imagen e Invariantes",
      desc: "Se unen los vértices calculados para formar la figura imagen F' y se verifican invariantes.",
    },
  ];

  // ── 10. MAIN RENDER ───────────────────────────────────────────────────────
  return (
    <div
      style={
        isExpanded && isForcedLandscape
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vh",
              height: "100vw",
              transformOrigin: "top left",
              transform: "rotate(90deg) translateY(-100%)",
              zIndex: 100000,
            }
          : undefined
      }
      className={`transition-all duration-300 ${
        isExpanded
          ? isForcedLandscape
            ? "fixed z-[100000] flex flex-col bg-slate-900 text-slate-100 p-1 sm:p-2 overflow-hidden"
            : "fixed inset-0 z-[100000] flex flex-col bg-slate-900 text-slate-100 p-2 sm:p-4 overflow-hidden animate-in fade-in"
          : "space-y-4"
      }`}
    >
      <div
        className={`flex flex-col bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-md ${
          isExpanded ? "flex-1 rounded-2xl sm:rounded-3xl overflow-hidden border-indigo-500/30" : "rounded-3xl overflow-hidden"
        }`}
      >
        {/* ── TOP CONTROL BAR ───────────────────────────────────────────── */}
        <header className="flex flex-wrap items-center justify-between gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-black">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Laboratorio Didáctico</span>
            </span>

            {/* In Expanded mode: Quick Switcher for Transformation Types */}
            {isExpanded && onChangeTransformationType && (
              <div className="hidden lg:flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                {(
                  [
                    { id: "reflection", label: "Simetría Axial", icon: FlipHorizontal },
                    { id: "translation", label: "Traslación", icon: Move },
                    { id: "rotation", label: "Rotación", icon: RotateCw },
                    { id: "homothety", label: "Homotecia", icon: Maximize2 },
                    { id: "central_reflection", label: "Simetría Central", icon: Target },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const isActive = transformationType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChangeTransformationType(item.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Alejar plano (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 text-slate-600 dark:text-slate-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
                className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                title="Acercar plano (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-2xs"
              title="Restablecer posiciones por defecto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restablecer</span>
            </button>

            {/* Orientación 16:9 / 9:16 (formato horizontal tipo YouTube para móviles) */}
            {isExpanded && (
              <button
                onClick={toggleLandscapeMode}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer ${
                  isForcedLandscape
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                title={
                  isForcedLandscape
                    ? "Regresar a vista vertical (9:16)"
                    : "Girar al formato 16:9 horizontal (formato YouTube para pantalla completa)"
                }
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{isForcedLandscape ? "9:16 Vertical" : "16:9 Horizontal"}</span>
                <span className="xs:hidden">{isForcedLandscape ? "9:16" : "16:9"}</span>
              </button>
            )}

            {/* Expand / Minimize Fullscreen Button */}
            <button
              onClick={handleToggleExpand}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition shadow-sm cursor-pointer active:scale-95"
              title={isExpanded ? "Salir del laboratorio" : "Ampliar a pantalla completa (Modo Laboratorio 16:9)"}
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Salir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Ampliar Laboratorio</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── WORKSPACE BODY (CANVAS + DIDACTIC PANEL) ───────────────────── */}
        <div
          className={`flex flex-col ${
            isExpanded
              ? isForcedLandscape
                ? "flex-row flex-1 min-h-0 overflow-hidden"
                : "lg:flex-row flex-1 min-h-0 overflow-hidden"
              : "gap-4 p-3 sm:p-4"
          }`}
        >
          {/* ── LEFT: CARTESIAN INTERACTIVE CANVAS ─────────────────────── */}
          <div
            className={`relative flex flex-col bg-white dark:bg-slate-900 select-none overflow-hidden ${
              isExpanded
                ? isForcedLandscape
                  ? "flex-1 min-h-0 border-r border-slate-200 dark:border-slate-800"
                  : "flex-1 min-h-[350px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800"
                : "rounded-2xl border-2 border-slate-200 dark:border-slate-800"
            }`}
          >
            {/* Live Canvas Banner */}
            <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-extrabold backdrop-blur-sm shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Interactivo (Arrastra los puntos azules)
              </span>

              {/* Toggle Guides button */}
              <button
                onClick={() => setShowGuides((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  showGuides
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "bg-white/80 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
                title="Mostrar/Ocultar líneas de construcción geométrica"
              >
                {showGuides ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span className="hidden sm:inline">Guías</span>
              </button>
            </div>

            {/* SVG CARTESIAN PLANE */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-full min-h-[320px] max-h-[70vh] lg:max-h-none block cursor-crosshair touch-none select-none"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <defs>
                <marker id="ax-arrow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#0f172a" />
                </marker>
                <marker id="arr-arrow-blue" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                  <path d="M0,0 L0,7 L7,3.5 z" fill="#2563eb" />
                </marker>
              </defs>

              {/* Cartesian Grid */}
              {showGrid && (
                <g>
                  {Array.from({ length: 2 * RANGE_X + 3 }).map((_, i) => {
                    const xVal = i - RANGE_X - 1;
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
                  {Array.from({ length: 2 * RANGE_Y + 3 }).map((_, i) => {
                    const yVal = i - RANGE_Y - 1;
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
                  <line x1={0} y1={CY} x2={W} y2={CY} stroke="#0f172a" strokeWidth="2.5" markerEnd="url(#ax-arrow)" />
                  <line x1={CX} y1={H} x2={CX} y2={0} stroke="#0f172a" strokeWidth="2.5" markerEnd="url(#ax-arrow)" />
                  <text x={W - 16} y={CY - 10} fontSize="14" fill="#0f172a" fontWeight="bold">X</text>
                  <text x={CX + 10} y={18} fontSize="14" fill="#0f172a" fontWeight="bold">Y</text>
                  <text x={CX - 14} y={CY + 16} fontSize="11" fill="#475569" fontWeight="bold">0</text>

                  {/* Axis Tick Labels */}
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
              )}

              {/* Reflection Axis if active */}
              {renderReflectionAxis()}

              {/* Geometric auxiliary construction guides */}
              {renderGeometricGuides()}

              {/* Original Polygon (F) */}
              <polygon points={origPolygonStr} fill="#3b82f625" stroke="#2563eb" strokeWidth="2.5" />

              {/* Transformed Polygon (F') - interpolated with animProgress */}
              <polygon
                points={currentPolygonStr}
                fill={`${colorAccent}25`}
                stroke={colorAccent}
                strokeWidth="2.5"
                strokeDasharray={animProgress < 1 ? "4,4" : undefined}
              />

              {/* Transformed Vertices P' */}
              {currentTransformedPoints.map((tp, i) => (
                <g key={`tp-${i}`}>
                  <circle cx={toScreenX(tp.x)} cy={toScreenY(tp.y)} r="5" fill={colorAccent} stroke="#ffffff" strokeWidth="1.5" />
                  {showLabels && (
                    <text
                      x={toScreenX(tp.x) + 7}
                      y={toScreenY(tp.y) - 5}
                      fontSize="11"
                      fill={colorAccent}
                      fontWeight="bold"
                    >
                      {tp.label}
                    </text>
                  )}
                </g>
              ))}

              {/* Original Vertices P (Draggable) */}
              {points.map((p, i) => {
                const isDraggingThis = activeDragTarget === `point-${i}`;
                return (
                  <g key={`orig-pt-${i}`}>
                    {/* Compact clean vertex circle */}
                    <circle
                      cx={toScreenX(p.x)}
                      cy={toScreenY(p.y)}
                      r={isDraggingThis ? "7" : "5.5"}
                      fill="#2563eb"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* Generous touch target */}
                    <circle
                      cx={toScreenX(p.x)}
                      cy={toScreenY(p.y)}
                      r="18"
                      fill="transparent"
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handlePointerDown(`point-${i}`, e)}
                    />
                    {/* Clean vertex letter */}
                    {showLabels && (
                      <text
                        x={toScreenX(p.x) - 13}
                        y={toScreenY(p.y) - 6}
                        fontSize="11"
                        fill="#1e40af"
                        fontWeight="bold"
                      >
                        {p.label}
                      </text>
                    )}
                    {/* Dynamic coordinate tooltip ONLY when dragging */}
                    {isDraggingThis && (
                      <g>
                        <rect
                          x={toScreenX(p.x) - 26}
                          y={toScreenY(p.y) - 28}
                          width="52"
                          height="18"
                          rx="4"
                          fill="#1e293b"
                          opacity="0.9"
                        />
                        <text
                          x={toScreenX(p.x)}
                          y={toScreenY(p.y) - 16}
                          fontSize="9"
                          fill="#ffffff"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          ({p.x}, {p.y})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* ── BOTTOM TIMELINE SCRUBBER & ANIMATION PLAYER ────────────── */}
            <div className="p-3 bg-slate-100/90 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Play / Pause & Step Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={isAnimating ? stopAnimation : startAnimation}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                    isAnimating
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                  title="Reproducir o pausar animación"
                >
                  {isAnimating ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>{animProgress >= 1 ? "Reproducir" : "Continuar"}</span>
                    </>
                  )}
                </button>

                {/* Speed selector */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-1 text-[11px] font-bold">
                  {[0.5, 1, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setAnimSpeed(spd)}
                      className={`px-2 py-0.5 rounded-lg transition ${
                        animSpeed === spd
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {spd}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Scrubber Slider */}
              <div className="flex-1 flex items-center gap-3 w-full sm:w-auto px-2">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  Progreso:
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={animProgress}
                  onChange={(e) => {
                    stopAnimation();
                    const val = parseFloat(e.target.value);
                    setAnimProgress(val);
                    if (val === 0) setDidacticStep(1);
                    else if (val < 0.3) setDidacticStep(2);
                    else if (val < 0.6) setDidacticStep(3);
                    else if (val < 0.95) setDidacticStep(4);
                    else setDidacticStep(5);
                  }}
                  className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-300 dark:bg-slate-700 rounded-lg"
                />
                <span className="text-xs font-mono font-bold w-12 text-right text-indigo-600 dark:text-indigo-400">
                  {Math.round(animProgress * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: PEDAGOGICAL CONTROL & ANALYSIS DECK ──────────────── */}
          <div
            className={`flex flex-col bg-slate-50 dark:bg-slate-950 ${
              isExpanded
                ? isForcedLandscape
                  ? "w-72 sm:w-80 shrink-0 overflow-y-auto border-l border-slate-200 dark:border-slate-800 p-3 space-y-3"
                  : "w-full lg:w-96 shrink-0 overflow-y-auto border-t lg:border-t-0 border-slate-200 dark:border-slate-800 p-4 space-y-4"
                : "rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-4 space-y-4"
            }`}
          >
            {/* Deck Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 shrink-0">
              {[
                { id: "controls", label: "Controles", icon: Sliders },
                { id: "steps", label: "Paso a Paso", icon: Compass },
                { id: "formulas", label: "Fórmulas", icon: Layers },
                { id: "invariants", label: "Invariantes", icon: CheckCircle2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeDeckTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDeckTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-black transition-all ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 mb-0.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ── TAB 1: CONTROLS & PARAMETERS ─────────────────────────── */}
            {activeDeckTab === "controls" && (
              <div className="space-y-4">
                {/* Shape Selector */}
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                    1. Figura Didáctica de Prueba
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {Object.values(PRESET_SHAPES).map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => handleSelectShape(shape.id)}
                        className={`px-2.5 py-2 rounded-xl text-left border transition-all text-xs font-bold ${
                          selectedPreset === shape.id
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                        }`}
                      >
                        <div className="truncate">{shape.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transformation Specific Controls */}
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    2. Parámetros de la Transformación
                  </span>

                  {/* REFLECTION CONTROLS */}
                  {transformationType === "reflection" && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Eje de Simetría L:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "y-axis", label: "Eje Y (x=0)" },
                          { id: "x-axis", label: "Eje X (y=0)" },
                          { id: "y=x", label: "y = x" },
                          { id: "y=-x", label: "y = -x" },
                          { id: "x=k", label: "x = k" },
                          { id: "y=k", label: "y = k" },
                        ].map((ax) => (
                          <button
                            key={ax.id}
                            onClick={() => setReflectionAxis(ax.id as any)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                              reflectionAxis === ax.id
                                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                            }`}
                          >
                            {ax.label}
                          </button>
                        ))}
                      </div>

                      {(reflectionAxis === "x=k" || reflectionAxis === "y=k") && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                          <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                            Valor de k = {axisK}:
                          </span>
                          <input
                            type="range"
                            min="-4"
                            max="4"
                            step="0.5"
                            value={axisK}
                            onChange={(e) => setAxisK(parseFloat(e.target.value))}
                            className="w-28 accent-rose-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRANSLATION CONTROLS */}
                  {transformationType === "translation" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Vector v = ({dx}, {dy})
                        </span>
                        <span className="text-[11px] font-mono text-blue-600 font-bold">
                          |v| = {roundDec(Math.sqrt(dx * dx + dy * dy), 2)} u
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Desplazamiento horizontal (Δx):</span>
                          <span className="font-mono text-blue-600">{dx}</span>
                        </div>
                        <input
                          type="range"
                          min="-6"
                          max="6"
                          step="0.5"
                          value={dx}
                          onChange={(e) => setDx(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>Desplazamiento vertical (Δy):</span>
                          <span className="font-mono text-blue-600">{dy}</span>
                        </div>
                        <input
                          type="range"
                          min="-5"
                          max="5"
                          step="0.5"
                          value={dy}
                          onChange={(e) => setDy(parseFloat(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* ROTATION CONTROLS */}
                  {transformationType === "rotation" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Ángulo α: {angleDeg}°
                        </span>
                        <span className="text-[11px] font-bold text-amber-600">
                          {angleDeg > 0 ? "Antihorario (+)" : "Horario (-)"}
                        </span>
                      </div>

                      <input
                        type="range"
                        min="-180"
                        max="360"
                        step="15"
                        value={angleDeg}
                        onChange={(e) => setAngleDeg(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-1.5">
                        {[45, 90, 180, 270].map((deg) => (
                          <button
                            key={deg}
                            onClick={() => setAngleDeg(deg)}
                            className={`py-1 rounded-lg text-xs font-bold transition border ${
                              angleDeg === deg
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            +{deg}°
                          </button>
                        ))}
                      </div>

                      <div className="text-xs font-semibold text-slate-500 pt-1">
                        Centro C: ({rotCenter.x}, {rotCenter.y}) — Arrastra el punto naranja en el plano.
                      </div>
                    </div>
                  )}

                  {/* HOMOTHETY CONTROLS */}
                  {transformationType === "homothety" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Factor k: {scaleK}
                        </span>
                        <span className="text-[11px] font-bold text-purple-600">
                          {scaleK > 1 ? "Ampliación" : scaleK > 0 ? "Contracción" : "Inversa"}
                        </span>
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
                        className="w-full accent-purple-600 cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.5, 1.5, 2, -1].map((fac) => (
                          <button
                            key={fac}
                            onClick={() => setScaleK(fac)}
                            className={`py-1 rounded-lg text-xs font-bold transition border ${
                              scaleK === fac
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {fac}×
                          </button>
                        ))}
                      </div>

                      <div className="text-xs font-semibold text-slate-500 pt-1">
                        Centro C: ({homoCenter.x}, {homoCenter.y}) — Arrastra el punto morado en el plano.
                      </div>
                    </div>
                  )}

                  {/* CENTRAL SYMMETRY CONTROLS */}
                  {transformationType === "central_reflection" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60">
                        <span className="text-xs font-bold text-sky-900 dark:text-sky-200 block mb-1">
                          Centro de Simetría O({centralCenter.x}, {centralCenter.y})
                        </span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          Arrastra el punto azul claro O en cualquier lugar del plano cartesiano.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: STEP-BY-STEP GUIDED MODE ──────────────────────── */}
            {activeDeckTab === "steps" && (
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Guía Didáctica Paso a Paso
                </span>

                <div className="space-y-2">
                  {didacticStepsInfo.map((st) => (
                    <button
                      key={st.step}
                      onClick={() => handleStepChange(st.step)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        didacticStep === st.step
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-black ${
                            didacticStep === st.step
                              ? "text-indigo-700 dark:text-indigo-300"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {st.title}
                        </span>
                        {didacticStep === st.step && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                        {st.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleStepChange(Math.max(1, didacticStep - 1))}
                    disabled={didacticStep <= 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </button>
                  <span className="text-xs font-bold text-slate-500">
                    Paso {didacticStep} de 5
                  </span>
                  <button
                    onClick={() => handleStepChange(Math.min(5, didacticStep + 1))}
                    disabled={didacticStep >= 5}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-40"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB 3: LIVE FORMULAS & NUMERICAL SUBSTITUTION ──────────── */}
            {activeDeckTab === "formulas" && (
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Cálculo Matemático en Vivo
                </span>

                <div className="space-y-2">
                  {points.map((p, i) => {
                    const tp = targetPoints[i];
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-blue-600">Vértice {p.label}({p.x}, {p.y})</span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          <span style={{ color: colorAccent }}>Imagen {tp.label}({tp.x}, {tp.y})</span>
                        </div>

                        {/* Exact formula substitution display */}
                        <div className="bg-slate-950 p-2 rounded-xl text-[11px] font-mono text-emerald-300 leading-tight">
                          {transformationType === "reflection" && (
                            <>
                              {reflectionAxis === "y-axis" && `P'(-(${p.x}), ${p.y}) = (${tp.x}, ${tp.y})`}
                              {reflectionAxis === "x-axis" && `P'(${p.x}, -(${p.y})) = (${tp.x}, ${tp.y})`}
                              {reflectionAxis === "y=x" && `P'(${p.y}, ${p.x}) = (${tp.x}, ${tp.y})`}
                              {reflectionAxis === "y=-x" && `P'(-(${p.y}), -(${p.x})) = (${tp.x}, ${tp.y})`}
                              {reflectionAxis === "x=k" && `P'(2·(${axisK}) - (${p.x}), ${p.y}) = (${tp.x}, ${tp.y})`}
                              {reflectionAxis === "y=k" && `P'(${p.x}, 2·(${axisK}) - (${p.y})) = (${tp.x}, ${tp.y})`}
                            </>
                          )}
                          {transformationType === "translation" &&
                            `P'(${p.x} + (${dx}), ${p.y} + (${dy})) = (${tp.x}, ${tp.y})`}
                          {transformationType === "rotation" &&
                            `Rot(${angleDeg}°): P' = (${tp.x}, ${tp.y})`}
                          {transformationType === "homothety" &&
                            `P'(${scaleK} · ${p.x}, ${scaleK} · ${p.y}) = (${tp.x}, ${tp.y})`}
                          {transformationType === "central_reflection" &&
                            `P'(2·(${centralCenter.x}) - (${p.x}), 2·(${centralCenter.y}) - (${p.y})) = (${tp.x}, ${tp.y})`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 4: INVARIANTS CHECKER ─────────────────────────────── */}
            {activeDeckTab === "invariants" && (
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Propiedades e Invariantes Comprobados
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Area Comparison */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Área Figura
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Orig: <span className="text-blue-600 font-mono">{origArea} u²</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      Imag: <span className="font-mono" style={{ color: colorAccent }}>{targetArea} u²</span>
                    </div>
                  </div>

                  {/* Perimeter Comparison */}
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                      Perímetro
                    </span>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Orig: <span className="text-blue-600 font-mono">{origPerimeter} u</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      Imag: <span className="font-mono" style={{ color: colorAccent }}>{targetPerimeter} u</span>
                    </div>
                  </div>
                </div>

                {/* Orientation & Type Verification */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                      {transformationType === "homothety" && Math.abs(scaleK) !== 1
                        ? "Transformación de Semejanza (Conserva ángulos y forma)"
                        : "Transformación Isométrica (Conserva distancias y forma)"}
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-900 dark:text-emerald-300 font-semibold leading-relaxed">
                    {transformationType === "reflection" && (
                      <p>
                        <strong>Orientación invertida:</strong> La figura original tiene sentido{" "}
                        <em>{origOrientation}</em> y la imagen tiene sentido <em>{targetOrientation}</em>. Es una isometría antidirecta.
                      </p>
                    )}
                    {transformationType === "translation" && (
                      <p>
                        <strong>Orientación conservada:</strong> Todos los segmentos son paralelos a los originales y conservan sentido (isometría directa).
                      </p>
                    )}
                    {transformationType === "rotation" && (
                      <p>
                        <strong>Isometría directa:</strong> Conserva distancias, ángulos y la orientación de la figura alrededor de C.
                      </p>
                    )}
                    {transformationType === "homothety" && (
                      <p>
                        <strong>Razón de áreas:</strong> El área se multiplica por k² ={" "}
                        {roundDec(scaleK * scaleK, 2)}. Si k &lt; 0 se invierte al lado opuesto.
                      </p>
                    )}
                    {transformationType === "central_reflection" && (
                      <p>
                        <strong>Simetría Central:</strong> Equivale a rotar 180° alrededor de O. Es una isometría directa.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
