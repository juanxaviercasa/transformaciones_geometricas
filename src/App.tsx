import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Maximize2,
  RotateCw,
  Move,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Target,
  Edit3,
  Undo2,
  Layers,
  CheckCircle2,
  Hash,
  Sparkles,
  Menu,
  X,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  Download,
  Shapes,
  Eye,
  Sliders,
  ChevronRight,
  BookOpen,
  FileText,
  Search,
  Compass,
  Ruler,
  Maximize,
  Minimize
} from 'lucide-react';
import {
  Point,
  TransformationConfig,
  GridStyle,
  ToolMode,
  ReflectionAxis,
  ProblemMode,
  ProblemScenario,
  ClassroomToggles
} from './types/geometry';
import {
  solveGeometryProblem,
  distance,
  midpoint,
  formatNum,
  CLASSROOM_PROBLEMS
} from './utils/GeometryProblemEngine';
import { ClassroomBanner } from './components/ClassroomBanner';
import { AlgebraicNotebook } from './components/AlgebraicNotebook';
import { InverseProblemPanel } from './components/InverseProblemPanel';
import { SHAPE_PRESETS } from './utils/transformations';

export default function App() {
  // 1. ESTADO DE PROBLEMA Y CONSIGNA ESCOLAR
  const [problemMode, setProblemMode] = useState<ProblemMode>('DIRECT');
  const [currentScenario, setCurrentScenario] = useState<ProblemScenario | null>(
    CLASSROOM_PROBLEMS[0]
  );
  const [customStatement, setCustomStatement] = useState<string>(
    CLASSROOM_PROBLEMS[0].statement
  );

  // 2. ESTADO DE LA FIGURA ORIGINAL (PREIMAGEN)
  const [vertices, setVertices] = useState<Point[]>([
    { x: 1, y: 1, label: 'A' },
    { x: 4, y: 2, label: 'B' },
    { x: 2, y: 5, label: 'C' }
  ]);

  // 3. ESTADO DE CONFIGURACIÓN DE LA TRANSFORMACIÓN
  const [config, setConfig] = useState<TransformationConfig>({
    type: 'reflection',
    dx: 4,
    dy: 2,
    reflectionAxis: 'custom_x',
    customAxisValue: 2,
    generalLine: { a: 1, b: 0, c: -2 },
    centralCenter: { x: 0, y: 0 },
    angleDeg: 90,
    direction: 'anticlockwise',
    center: { x: 0, y: 0 },
    scaleFactor: 1.5,
    homothetyCenter: { x: 0, y: 0 }
  });

  // 4. ESTADO DE LA PIZARRA PASO A PASO (NEXT STEP)
  // Paso 0: Preimagen F.
  // Paso 1: Elementos rectores (ejes, vectores, centro).
  // Paso 2 a N+1: Construcción vértice por vértice.
  // Paso N+2: Imagen F' completa.
  const totalSteps = useMemo(() => vertices.length + 2, [vertices.length]);
  const [currentStep, setCurrentStep] = useState<number>(totalSteps);

  // 5. TOGGLES DE INSPECCIÓN RÁPIDA DE PIZARRA
  const [toggles, setToggles] = useState<ClassroomToggles>({
    showSideLengths: false,
    showInteriorAngles: false,
    showConstructionGuides: true,
    showAlgebraicNotebook: true,
    cleanBoardMode: false
  });

  // 6. ESTADO DE ANIMACIÓN CONTINUA
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const animStartTimeRef = useRef<number | null>(null);

  // 7. PLANO CARTESIANO Y VISOR
  const [gridStyle, setGridStyle] = useState<GridStyle>('lines');
  const [scale, setScale] = useState<number>(36);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [tool, setTool] = useState<ToolMode>('select');

  // 8. MODALES Y PANELES
  const [isCoordsModalOpen, setIsCoordsModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [coordsInputText, setCoordsInputText] = useState('1, 1\n4, 2\n2, 5');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'config' | 'notebook' | 'inverse'>('config');

  // 9. COORDENADAS BAJO EL CURSOR Y ARRASTRE
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);
  const [isHoveringPivot, setIsHoveringPivot] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingCanvasRef = useRef(false);
  const draggingVertexIndexRef = useRef<number | null>(null);
  const isDraggingPivotRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // RESULTADO DEL MOTOR DE RESOLUCIÓN DIDÁCTICO
  const engineResult = useMemo(() => {
    return solveGeometryProblem(vertices, config);
  }, [vertices, config]);

  const transformedVertices = engineResult.transformedVertices;

  // Selección de escenario escolar preconfigurado
  const handleSelectScenario = (scenario: ProblemScenario) => {
    setCurrentScenario(scenario);
    setCustomStatement(scenario.statement);
    setVertices(scenario.presetVertices);
    setConfig(scenario.targetConfig);
    setProblemMode(scenario.mode);
    if (scenario.mode === 'INVERSE') {
      setActiveSidebarTab('inverse');
    } else {
      setActiveSidebarTab('config');
    }
    setCurrentStep(scenario.presetVertices.length + 2);
    setAnimProgress(1);
    setIsAnimating(false);
  };

  // Manejo de animación progresiva
  useEffect(() => {
    if (!isAnimating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const DURATION = 2200;
    const step = (timestamp: number) => {
      if (!animStartTimeRef.current) animStartTimeRef.current = timestamp;
      const elapsed = timestamp - animStartTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          if (isAnimating) {
            animStartTimeRef.current = null;
            setAnimProgress(0);
            animFrameRef.current = requestAnimationFrame(step);
          }
        }, 500);
      }
    };

    animStartTimeRef.current = null;
    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimating]);

  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false);
    } else {
      if (animProgress >= 0.99) setAnimProgress(0);
      setIsAnimating(true);
    }
  };

  // Convertir coordenadas del plano a coordenadas de pantalla (canvas px)
  const toScreen = useCallback(
    (pt: { x: number; y: number }, width: number, height: number) => {
      const originX = width / 2 + pan.x;
      const originY = height / 2 + pan.y;
      return {
        x: originX + pt.x * scale,
        y: originY - pt.y * scale
      };
    },
    [pan, scale]
  );

  // Convertir coordenadas de pantalla a coordenadas del plano cartesiano
  const toCartesian = useCallback(
    (screenX: number, screenY: number, width: number, height: number, snap = snapToGrid) => {
      const originX = width / 2 + pan.x;
      const originY = height / 2 + pan.y;
      const cartX = (screenX - originX) / scale;
      const cartY = (originY - screenY) / scale;
      if (snap) {
        return {
          x: Math.round(cartX),
          y: Math.round(cartY)
        };
      }
      return {
        x: Number(cartX.toFixed(2)),
        y: Number(cartY.toFixed(2))
      };
    },
    [pan, scale, snapToGrid]
  );

  // Identificar el centro pivote activo
  const activePivot = useMemo(() => {
    if (config.type === 'rotation') return config.center;
    if (config.type === 'homothety') return config.homothetyCenter;
    if (config.type === 'central_reflection') return config.centralCenter;
    return null;
  }, [config.type, config.center, config.homothetyCenter, config.centralCenter]);

  // DIBUJAR EN EL CANVAS DE PIZARRA
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Fondo del lienzo
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, width, height);

    const originX = width / 2 + pan.x;
    const originY = height / 2 + pan.y;

    // 1. CUADRÍCULA
    const minUnitX = Math.floor(-originX / scale) - 2;
    const maxUnitX = Math.ceil((width - originX) / scale) + 2;
    const minUnitY = Math.floor(-(height - originY) / scale) - 2;
    const maxUnitY = Math.ceil(originY / scale) + 2;

    if (gridStyle === 'lines') {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      for (let u = minUnitX; u <= maxUnitX; u++) {
        const sx = originX + u * scale;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
      }
      for (let u = minUnitY; u <= maxUnitY; u++) {
        const sy = originY - u * scale;
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
      }
      ctx.stroke();
    } else if (gridStyle === 'dots') {
      ctx.fillStyle = '#94a3b8';
      for (let ux = minUnitX; ux <= maxUnitX; ux++) {
        for (let uy = minUnitY; uy <= maxUnitY; uy++) {
          const sx = originX + ux * scale;
          const sy = originY - uy * scale;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. EJES COORDENADOS (X e Y)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Marcas numéricas
    const step = scale < 22 ? 5 : scale < 35 ? 2 : 1;
    for (let u = minUnitX; u <= maxUnitX; u++) {
      if (u === 0 || u % step !== 0) continue;
      const sx = originX + u * scale;
      ctx.beginPath();
      ctx.moveTo(sx, originY - 4);
      ctx.lineTo(sx, originY + 4);
      ctx.strokeStyle = '#475569';
      ctx.stroke();
      ctx.fillText(u.toString(), sx, originY + 6);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let u = minUnitY; u <= maxUnitY; u++) {
      if (u === 0 || u % step !== 0) continue;
      const sy = originY - u * scale;
      ctx.beginPath();
      ctx.moveTo(originX - 4, sy);
      ctx.lineTo(originX + 4, sy);
      ctx.strokeStyle = '#475569';
      ctx.stroke();
      ctx.fillText(u.toString(), originX - 6, sy);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('O', originX - 8, originY + 8);

    // Si el paso actual es 0, no dibujamos elementos de transformación todavía
    const allowStepElements = currentStep >= 1;

    // 3. ELEMENTOS DIRECTORES RECTORES (Ejes, Centros, Vectores)
    if (allowStepElements) {
      if (config.type === 'reflection') {
        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#f43f5e';
        ctx.setLineDash([8, 6]);
        ctx.beginPath();

        if (config.reflectionAxis === 'x') {
          ctx.moveTo(0, originY);
          ctx.lineTo(width, originY);
        } else if (config.reflectionAxis === 'y') {
          ctx.moveTo(originX, 0);
          ctx.lineTo(originX, height);
        } else if (config.reflectionAxis === 'y=x') {
          ctx.moveTo(originX - 3000, originY + 3000);
          ctx.lineTo(originX + 3000, originY - 3000);
        } else if (config.reflectionAxis === 'y=-x') {
          ctx.moveTo(originX - 3000, originY - 3000);
          ctx.lineTo(originX + 3000, originY + 3000);
        } else if (config.reflectionAxis === 'custom_x') {
          const sx = originX + config.customAxisValue * scale;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        } else if (config.reflectionAxis === 'custom_y') {
          const sy = originY - config.customAxisValue * scale;
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        } else if (config.reflectionAxis === 'general') {
          const { a, b, c } = config.generalLine;
          if (b !== 0) {
            const yAtMinX = (-a * minUnitX - c) / b;
            const yAtMaxX = (-a * maxUnitX - c) / b;
            const p1 = toScreen({ x: minUnitX, y: yAtMinX }, width, height);
            const p2 = toScreen({ x: maxUnitX, y: yAtMaxX }, width, height);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
          } else if (a !== 0) {
            const xFixed = -c / a;
            const sx = originX + xFixed * scale;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
          }
        }
        ctx.stroke();

        ctx.fillStyle = '#e11d48';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Eje de simetría (L)', 16, height - 20);
        ctx.restore();
      } else if (activePivot) {
        // Centro Pivote
        const cScr = toScreen(activePivot, width, height);
        const color =
          config.type === 'rotation'
            ? '#f59e0b'
            : config.type === 'homothety'
            ? '#8b5cf6'
            : '#0284c7';

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cScr.x, cScr.y, isHoveringPivot ? 16 : 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cScr.x, cScr.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(cScr.x - 9, cScr.y);
        ctx.lineTo(cScr.x + 9, cScr.y);
        ctx.moveTo(cScr.x, cScr.y - 9);
        ctx.lineTo(cScr.x, cScr.y + 9);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`C(${activePivot.x}, ${activePivot.y})`, cScr.x + 10, cScr.y - 10);
        ctx.restore();
      }
    }

    // 4. LÍNEAS DE CONSTRUCCIÓN Y JUSTIFICACIÓN RIGUROSA
    if (toggles.showConstructionGuides && allowStepElements) {
      const maxVertexStepIndex = currentStep - 2; // Vértices a revelar

      // A) Traslación: Descomposición en catetos Δx y Δy + vector director
      if (config.type === 'translation' && engineResult.constructionElements.vectorGuides) {
        ctx.save();
        engineResult.constructionElements.vectorGuides.forEach((g, idx) => {
          if (idx > maxVertexStepIndex && currentStep < totalSteps) return;
          const s = toScreen(g.start, width, height);
          const inter = toScreen(g.intermediate, width, height);
          const e = toScreen(g.end, width, height);

          // Cateto horizontal Δx
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(inter.x, inter.y);
          ctx.stroke();

          // Cateto vertical Δy
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();
          ctx.moveTo(inter.x, inter.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Hipotenusa Vector T
          ctx.strokeStyle = '#6366f1';
          ctx.fillStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Punta de flecha en e
          const ang = Math.atan2(e.y - s.y, e.x - s.x);
          const arrLen = 8;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(
            e.x - arrLen * Math.cos(ang - Math.PI / 6),
            e.y - arrLen * Math.sin(ang - Math.PI / 6)
          );
          ctx.lineTo(
            e.x - arrLen * Math.cos(ang + Math.PI / 6),
            e.y - arrLen * Math.sin(ang + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // Etiqueta de vector
          if (idx === 0) {
            ctx.fillStyle = '#4338ca';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText(`v(${g.dx}, ${g.dy})`, (s.x + e.x) / 2 + 8, (s.y + e.y) / 2 - 6);
          }
        });
        ctx.restore();
      }

      // B) Simetría Axial: Segmento perpendicular, símbolo de 90° y marcas de congruencia ≅
      if (config.type === 'reflection' && engineResult.constructionElements.perpendicularGuides) {
        ctx.save();
        engineResult.constructionElements.perpendicularGuides.forEach((g, idx) => {
          if (idx > maxVertexStepIndex && currentStep < totalSteps) return;
          const s = toScreen(g.p, width, height);
          const hScr = toScreen(g.footH, width, height);
          const e = toScreen(g.pPrime, width, height);

          // Segmento perpendicular continuo punteado PP'
          ctx.strokeStyle = '#fda4af';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Símbolo de ángulo recto (90°) en el pie H
          const vPerp = { x: s.x - hScr.x, y: s.y - hScr.y };
          const lenP = Math.hypot(vPerp.x, vPerp.y);
          if (lenP > 6) {
            const uP = { x: vPerp.x / lenP, y: vPerp.y / lenP };
            // Vector ortogonal a lo largo de la recta
            const uL = { x: -uP.y, y: uP.x };
            const sqSize = 8;
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(hScr.x + uP.x * sqSize, hScr.y + uP.y * sqSize);
            ctx.lineTo(
              hScr.x + uP.x * sqSize + uL.x * sqSize,
              hScr.y + uP.y * sqSize + uL.y * sqSize
            );
            ctx.lineTo(hScr.x + uL.x * sqSize, hScr.y + uL.y * sqSize);
            ctx.stroke();
          }

          // Marcas de congruencia de distancia (//) demostrando d(P, H) = d(H, P')
          const mid1 = { x: (s.x + hScr.x) / 2, y: (s.y + hScr.y) / 2 };
          const mid2 = { x: (hScr.x + e.x) / 2, y: (hScr.y + e.y) / 2 };
          const drawTick = (mid: { x: number; y: number }) => {
            if (lenP <= 4) return;
            const uP = { x: vPerp.x / lenP, y: vPerp.y / lenP };
            const uL = { x: -uP.y, y: uP.x };
            const tickLen = 4;
            ctx.strokeStyle = '#e11d48';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(mid.x - uL.x * tickLen, mid.y - uL.y * tickLen);
            ctx.lineTo(mid.x + uL.x * tickLen, mid.y + uL.y * tickLen);
            ctx.stroke();
          };
          drawTick(mid1);
          drawTick(mid2);
        });
        ctx.restore();
      }

      // C) Simetría Central: Segmentos pasando por O con marca de punto medio
      if (config.type === 'central_reflection' && engineResult.constructionElements.centralSymmetrySegments) {
        ctx.save();
        engineResult.constructionElements.centralSymmetrySegments.forEach((g, idx) => {
          if (idx > maxVertexStepIndex && currentStep < totalSteps) return;
          const s = toScreen(g.p, width, height);
          const cScr = toScreen(g.center, width, height);
          const e = toScreen(g.pPrime, width, height);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Punto central O verificado
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(cScr.x, cScr.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // D) Rotación: Radios CP y CP', arco circular con ángulo
      if (config.type === 'rotation' && engineResult.constructionElements.rotationArcs) {
        ctx.save();
        engineResult.constructionElements.rotationArcs.forEach((g, idx) => {
          if (idx > maxVertexStepIndex && currentStep < totalSteps) return;
          const cScr = toScreen(g.center, width, height);
          const s = toScreen(g.p, width, height);
          const e = toScreen(g.pPrime, width, height);

          // Radios CP y CP'
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(s.x, s.y);
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Arco de circunferencia
          const rPx = g.radius * scale;
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#d97706';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(
            cScr.x,
            cScr.y,
            Math.min(rPx, 35 + idx * 10),
            -g.startAngle,
            -g.endAngle,
            config.direction === 'clockwise'
          );
          ctx.stroke();
        });
        ctx.restore();
      }

      // E) Homotecia: Rayos continuos desde O extendiéndose
      if (config.type === 'homothety' && engineResult.constructionElements.homothetyRays) {
        ctx.save();
        engineResult.constructionElements.homothetyRays.forEach((g, idx) => {
          if (idx > maxVertexStepIndex && currentStep < totalSteps) return;
          const cScr = toScreen(g.center, width, height);
          const s = toScreen(g.p, width, height);
          const e = toScreen(g.pPrime, width, height);

          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    // FUNCIÓN AUXILIAR PARA DIBUJAR POLÍGONO Y MEDIDAS
    const drawPolygon = (
      pts: Point[],
      strokeColor: string,
      fillColor: string,
      isTransformed = false,
      isGhost = false
    ) => {
      if (pts.length === 0) return;
      ctx.beginPath();
      const first = toScreen(pts[0], width, height);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < pts.length; i++) {
        const p = toScreen(pts[i], width, height);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      if (isGhost) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Medidas de lados si está activado
      if (toggles.showSideLengths && pts.length >= 3 && !isGhost) {
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < pts.length; i++) {
          const pA = pts[i];
          const pB = pts[(i + 1) % pts.length];
          const sA = toScreen(pA, width, height);
          const sB = toScreen(pB, width, height);
          const distVal = distance(pA, pB);
          const midX = (sA.x + sB.x) / 2;
          const midY = (sA.y + sB.y) / 2;
          ctx.fillText(`d=${formatNum(distVal)}`, midX, midY - 6);
        }
      }

      // Vértices y etiquetas
      pts.forEach((pt, i) => {
        const p = toScreen(pt, width, height);
        const isHovered = !isTransformed && !isGhost && hoveredVertexIndex === i;

        ctx.beginPath();
        ctx.arc(p.x, p.y, isHovered ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#10b981' : strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (showLabels && (!isGhost || isTransformed)) {
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 12px "Inter", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          const baseLabel = pt.label || String.fromCharCode(65 + i);
          const suffix = isTransformed ? "'" : '';
          ctx.fillText(`${baseLabel}${suffix} (${pt.x}, ${pt.y})`, p.x + 8, p.y - 4);
        }
      });
    };

    // 5. DIBUJAR FIGURA IMAGEN TRANSFORMADA (F')
    if (allowStepElements && transformedVertices.length >= 2) {
      // Si estamos en modo paso a paso, revelar los vértices correspondientes
      const visibleCount =
        currentStep >= totalSteps
          ? transformedVertices.length
          : Math.min(Math.max(0, currentStep - 1), transformedVertices.length);

      if (visibleCount >= 2) {
        const visibleSlice = transformedVertices.slice(0, visibleCount);
        drawPolygon(
          visibleSlice,
          '#4f46e5',
          'rgba(79, 70, 229, 0.18)',
          true,
          visibleCount < transformedVertices.length
        );
      } else if (visibleCount === 1) {
        const p = toScreen(transformedVertices[0], width, height);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4f46e5';
        ctx.fill();
        ctx.fillText(`${transformedVertices[0].label || "A'"} (${transformedVertices[0].x}, ${transformedVertices[0].y})`, p.x + 8, p.y - 4);
      }
    }

    // 6. DIBUJAR FIGURA ORIGINAL PREIMAGEN (F)
    if (vertices.length >= 2) {
      drawPolygon(vertices, '#059669', 'rgba(5, 150, 105, 0.22)', false, false);
    } else if (vertices.length === 1) {
      const p = toScreen(vertices[0], width, height);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#059669';
      ctx.fill();
    }
  }, [
    vertices,
    transformedVertices,
    currentStep,
    totalSteps,
    gridStyle,
    scale,
    pan,
    showLabels,
    toggles,
    config,
    engineResult,
    toScreen,
    activePivot,
    hoveredVertexIndex,
    isHoveringPivot
  ]);

  // MANEJO DE EVENTOS DE RATÓN E INTERACCIÓN
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Modo Colocar Pivote
    if (tool === 'pivot') {
      const cart = toCartesian(clientX, clientY, rect.width, rect.height);
      if (config.type === 'rotation') {
        setConfig((prev) => ({ ...prev, center: cart }));
      } else if (config.type === 'homothety') {
        setConfig((prev) => ({ ...prev, homothetyCenter: cart }));
      } else if (config.type === 'central_reflection') {
        setConfig((prev) => ({ ...prev, centralCenter: cart }));
      }
      setTool('select');
      return;
    }

    // Modo Lápiz / Trazar
    if (tool === 'draw') {
      const pt = toCartesian(clientX, clientY, rect.width, rect.height);
      const nextLabel = String.fromCharCode(65 + vertices.length);
      setVertices((prev) => [...prev, { x: pt.x, y: pt.y, label: nextLabel }]);
      return;
    }

    // Modo Selección: Verificar clic sobre pivote
    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15) {
        isDraggingPivotRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Modo Selección: Verificar clic sobre vértice preimagen
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        draggingVertexIndexRef.current = i;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Si no, iniciar arrastre de todo el plano (Pan)
    isDraggingCanvasRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const cart = toCartesian(clientX, clientY, rect.width, rect.height);
    setMouseCoord(cart);

    if (isDraggingPivotRef.current && activePivot) {
      if (config.type === 'rotation') {
        setConfig((prev) => ({ ...prev, center: cart }));
      } else if (config.type === 'homothety') {
        setConfig((prev) => ({ ...prev, homothetyCenter: cart }));
      } else if (config.type === 'central_reflection') {
        setConfig((prev) => ({ ...prev, centralCenter: cart }));
      }
      return;
    }

    if (draggingVertexIndexRef.current !== null) {
      const idx = draggingVertexIndexRef.current;
      setVertices((prev) =>
        prev.map((v, i) => (i === idx ? { ...v, x: cart.x, y: cart.y } : v))
      );
      return;
    }

    if (isDraggingCanvasRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
      return;
    }

    // Detección de Hover
    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      setIsHoveringPivot(Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15);
    } else {
      setIsHoveringPivot(false);
    }

    let foundIdx: number | null = null;
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        foundIdx = i;
        break;
      }
    }
    setHoveredVertexIndex(foundIdx);
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    draggingVertexIndexRef.current = null;
    isDraggingPivotRef.current = false;
  };

  // Controles de Paso a Paso
  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handleResetStep = () => {
    setCurrentStep(0);
  };

  // Cargar coordenadas manuales
  const handleApplyCoordinates = () => {
    try {
      const lines = coordsInputText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const newPts: Point[] = [];
      lines.forEach((line, idx) => {
        const parts = line.replace(/[()]/g, '').split(/[\s,]+/);
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          if (!isNaN(x) && !isNaN(y)) {
            newPts.push({ x, y, label: String.fromCharCode(65 + idx) });
          }
        }
      });
      if (newPts.length >= 2) {
        setVertices(newPts);
        setIsCoordsModalOpen(false);
        setCurrentStep(newPts.length + 2);
      } else {
        alert('Ingresa al menos 2 pares ordenados (x, y)');
      }
    } catch {
      alert('Formato de coordenadas inválido');
    }
  };

  // Descarga de Imagen PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, exportCanvas.width, 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Transformaciones Geométricas Pro • Pizarra de Aula', 20, 24);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText(`Problema: ${customStatement.substring(0, 80)}...`, 20, 42);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pizarra_geometria_${config.type}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-paper text-ink font-sans select-none">
      {/* 1. BANNER SUPERIOR DE CLASE Y CONSIGNA ESCOLAR */}
      <ClassroomBanner
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        customStatement={customStatement}
        onUpdateCustomStatement={setCustomStatement}
        problemMode={problemMode}
        onToggleProblemMode={(mode) => {
          setProblemMode(mode);
          setActiveSidebarTab(mode === 'INVERSE' ? 'inverse' : 'config');
        }}
        cleanBoardMode={toggles.cleanBoardMode}
        onToggleCleanBoardMode={() =>
          setToggles((prev) => ({ ...prev, cleanBoardMode: !prev.cleanBoardMode }))
        }
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNextStep={handleNextStep}
        onResetStep={handleResetStep}
      />

      <div className="relative flex flex-1 h-full w-full overflow-hidden">
        {/* 2. LIENZO PRINCIPAL DEL PLANO CARTESIANO */}
        <div className="relative flex-1 h-full w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              isDraggingCanvasRef.current = false;
              draggingVertexIndexRef.current = null;
              isDraggingPivotRef.current = false;
              setMouseCoord(null);
            }}
            className={`h-full w-full block ${
              tool === 'draw' || tool === 'pivot'
                ? 'cursor-crosshair'
                : isHoveringPivot || isDraggingPivotRef.current
                ? 'cursor-move'
                : hoveredVertexIndex !== null
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
          />

          {/* HUD DE COORDENADAS DEL CURSOR */}
          {mouseCoord && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-surface/90 px-3.5 py-1.5 shadow-md backdrop-blur border border-border">
              <Target className="h-4 w-4 text-accent" />
              <span className="font-mono text-xs font-semibold text-ink">
                Pos: ({mouseCoord.x}, {mouseCoord.y})
              </span>
            </div>
          )}

          {/* MODO DIBUJO O PIVOTE EN CURSO */}
          {tool === 'draw' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-2 shadow-lg backdrop-blur border border-accent">
              <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
                <Edit3 className="h-4 w-4" /> Coloca vértices haciendo clic en el plano ({vertices.length})
              </span>
              <button
                onClick={() => setVertices((prev) => prev.slice(0, -1))}
                disabled={vertices.length === 0}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-panel hover:bg-border transition disabled:opacity-40"
              >
                <Undo2 className="h-3.5 w-3.5" /> Deshacer
              </button>
              <button
                onClick={() => setTool('select')}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-accent text-white hover:brightness-110 transition shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar Figura
              </button>
            </div>
          )}

          {tool === 'pivot' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-2 shadow-lg backdrop-blur border border-amber-500">
              <Compass className="h-4 w-4 text-amber-500 animate-spin" />
              <span className="text-xs font-semibold text-ink">
                Haz clic en cualquier punto del plano para fijar el Centro
              </span>
              <button
                onClick={() => setTool('select')}
                className="text-xs font-medium px-2 py-1 rounded-lg bg-panel hover:bg-border transition"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* BARRA FLOTANTE DE INSPECCIÓN RÁPIDA DE PIZARRA (INFERIOR IZQUIERDA) */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 rounded-2xl bg-surface/95 p-1.5 shadow-xl backdrop-blur border border-border">
            <button
              onClick={() =>
                setToggles((prev) => ({
                  ...prev,
                  showConstructionGuides: !prev.showConstructionGuides
                }))
              }
              title="Líneas de Justificación (perpendiculares, mediatrices, rayos)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                toggles.showConstructionGuides
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-black/5'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Justificación</span>
            </button>

            <button
              onClick={() =>
                setToggles((prev) => ({
                  ...prev,
                  showSideLengths: !prev.showSideLengths
                }))
              }
              title="Medidas de Lados (Distancia euclidiana)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                toggles.showSideLengths
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-black/5'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lados</span>
            </button>

            <div className="h-4 w-px bg-border mx-0.5" />

            <button
              onClick={() =>
                setActiveSidebarTab(activeSidebarTab === 'notebook' ? 'config' : 'notebook')
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeSidebarTab === 'notebook'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-accent bg-accent/10 hover:bg-accent/20'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Desarrollo Cuaderno</span>
            </button>
          </div>

          {/* CONTROLES DEL PLANO (INFERIOR DERECHA) */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 rounded-2xl bg-surface/90 p-1.5 shadow-lg backdrop-blur border border-border">
            <button
              onClick={() => setShowLabels(!showLabels)}
              title="Mostrar/Ocultar Coordenadas en Vértices"
              className={`p-2 rounded-xl transition ${
                showLabels ? 'text-accent bg-accent/10' : 'text-ink-soft hover:bg-black/5'
              }`}
            >
              <Eye className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={() => setScale((prev) => Math.min(prev * 1.2, 140))}
              title="Aumentar zoom"
              className="p-2 rounded-xl text-ink hover:bg-black/5 transition"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScale((prev) => Math.max(prev * 0.833, 12))}
              title="Disminuir zoom"
              className="p-2 rounded-xl text-ink hover:bg-black/5 transition"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPan({ x: 0, y: 0 })}
              title="Centrar en Origen O(0,0)"
              className="p-2 rounded-xl text-ink hover:bg-black/5 transition"
            >
              <Target className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={() =>
                setGridStyle((prev) => (prev === 'lines' ? 'dots' : prev === 'dots' ? 'axes' : 'lines'))
              }
              title={`Cuadrícula: ${gridStyle}`}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold text-ink hover:bg-black/5 transition capitalize"
            >
              {gridStyle}
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={handleExportPNG}
              title="Exportar imagen PNG para tareas"
              className="p-2 rounded-xl text-ink hover:text-accent transition"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3. PANEL LATERAL DERECHO (CONFIGURACIÓN, CUADERNO O PROBLEMA INVERSO) */}
        {!toggles.cleanBoardMode && (
          <aside className="h-full w-[380px] shrink-0 flex flex-col bg-surface border-l border-border shadow-xl z-30">
            {/* PESTAÑAS DE CONTROL SUPERIOR */}
            <div className="flex border-b border-border bg-panel p-1.5 gap-1">
              <button
                onClick={() => setActiveSidebarTab('config')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeSidebarTab === 'config'
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Transformación
              </button>
              <button
                onClick={() => setActiveSidebarTab('notebook')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeSidebarTab === 'notebook'
                    ? 'bg-surface text-accent shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                Cuaderno Paso a Paso
              </button>
              {problemMode === 'INVERSE' && (
                <button
                  onClick={() => setActiveSidebarTab('inverse')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeSidebarTab === 'inverse'
                      ? 'bg-surface text-emerald-700 shadow-sm'
                      : 'text-ink-soft hover:text-ink'
                  }`}
                >
                  Deducción
                </button>
              )}
            </div>

            {/* CONTENIDO SEGÚN LA PESTAÑA */}
            <div className="flex-1 overflow-hidden">
              {activeSidebarTab === 'notebook' && (
                <AlgebraicNotebook engineResult={engineResult} />
              )}

              {activeSidebarTab === 'inverse' && (
                <InverseProblemPanel
                  preimage={vertices}
                  image={transformedVertices}
                  currentScenario={currentScenario}
                />
              )}

              {activeSidebarTab === 'config' && (
                <div className="flex flex-col h-full overflow-y-auto p-4 space-y-5 text-xs">
                  {/* PASO 1: HERRAMIENTAS DE PREIMAGEN */}
                  <div className="space-y-2">
                    <label className="font-bold text-[11px] uppercase tracking-wider text-ink-faint flex justify-between">
                      <span>Paso 1: Preimagen F</span>
                      <span className="text-emerald-700 font-bold font-mono">
                        {vertices.length} Vértices
                      </span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setTool(tool === 'draw' ? 'select' : 'draw')}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold border transition flex flex-col items-center gap-1 ${
                          tool === 'draw'
                            ? 'bg-accent text-white border-accent'
                            : 'bg-panel text-ink border-border hover:border-border-strong'
                        }`}
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>{tool === 'draw' ? 'Trazando...' : 'Lápiz Plano'}</span>
                      </button>
                      <button
                        onClick={() => setIsPresetsOpen(true)}
                        className="py-2 px-1 rounded-xl text-xs font-semibold bg-panel text-ink border border-border hover:border-border-strong transition flex flex-col items-center gap-1"
                      >
                        <Shapes className="h-4 w-4 text-accent" />
                        <span>Modelos</span>
                      </button>
                      <button
                        onClick={() => setIsCoordsModalOpen(true)}
                        className="py-2 px-1 rounded-xl text-xs font-semibold bg-panel text-ink border border-border hover:border-border-strong transition flex flex-col items-center gap-1"
                      >
                        <Hash className="h-4 w-4 text-accent" />
                        <span>Coords (x,y)</span>
                      </button>
                    </div>
                  </div>

                  {/* PASO 2: SELECCIÓN RIGUROSA DE TRANSFORMACIÓN */}
                  <div className="space-y-2">
                    <label className="font-bold text-[11px] uppercase tracking-wider text-ink-faint">
                      Paso 2: Selección de Transformación
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { id: 'translation', label: 'Traslación', icon: Move },
                          { id: 'reflection', label: 'Simetría Axial', icon: FlipHorizontal },
                          { id: 'central_reflection', label: 'Simetría Central', icon: Target },
                          { id: 'rotation', label: 'Rotación', icon: RotateCw },
                          { id: 'homothety', label: 'Homotecia', icon: Maximize2 }
                        ] as const
                      ).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => {
                            setConfig((prev) => ({ ...prev, type: id }));
                            setCurrentStep(vertices.length + 2);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition ${
                            config.type === id
                              ? 'bg-accent text-white border-accent shadow-sm'
                              : 'bg-panel text-ink border-border hover:border-border-strong'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PARÁMETROS ESPECÍFICOS SEGÚN LA TRANSFORMACIÓN */}
                  <div className="p-4 rounded-2xl bg-panel border border-border space-y-3.5">
                    {/* TRASLACIÓN */}
                    {config.type === 'translation' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Vector director v(Δx, Δy):</span>
                          <span className="font-mono text-accent font-bold">
                            ({config.dx}, {config.dy})
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1 text-ink-soft">
                            <span>Desplazamiento horizontal Δx:</span>
                            <span className="font-mono font-bold text-ink">{config.dx}</span>
                          </div>
                          <input
                            type="range"
                            min="-15"
                            max="15"
                            value={config.dx}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, dx: parseInt(e.target.value) }))
                            }
                            className="w-full accent-accent"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1 text-ink-soft">
                            <span>Desplazamiento vertical Δy:</span>
                            <span className="font-mono font-bold text-ink">{config.dy}</span>
                          </div>
                          <input
                            type="range"
                            min="-15"
                            max="15"
                            value={config.dy}
                            onChange={(e) =>
                              setConfig((prev) => ({ ...prev, dy: parseInt(e.target.value) }))
                            }
                            className="w-full accent-accent"
                          />
                        </div>
                      </div>
                    )}

                    {/* SIMETRÍA AXIAL */}
                    {config.type === 'reflection' && (
                      <div className="space-y-3">
                        <div className="font-semibold text-ink">Eje de simetría L:</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(
                            [
                              { id: 'x', label: 'Eje X (y=0)' },
                              { id: 'y', label: 'Eje Y (x=0)' },
                              { id: 'y=x', label: 'Recta y = x' },
                              { id: 'y=-x', label: 'Recta y = -x' },
                              { id: 'custom_x', label: 'Vertical x = k' },
                              { id: 'custom_y', label: 'Horizontal y = k' },
                              { id: 'general', label: 'General Ax+By+C' }
                            ] as const
                          ).map(({ id, label }) => (
                            <button
                              key={id}
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  reflectionAxis: id as ReflectionAxis
                                }))
                              }
                              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                                config.reflectionAxis === id
                                  ? 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-surface text-ink border-border hover:border-border-strong'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {(config.reflectionAxis === 'custom_x' ||
                          config.reflectionAxis === 'custom_y') && (
                          <div className="pt-2 border-t border-border space-y-1.5">
                            <div className="flex justify-between font-semibold">
                              <span>Valor de k:</span>
                              <span className="font-mono text-rose-600 font-bold">
                                {config.reflectionAxis === 'custom_x' ? 'x' : 'y'} ={' '}
                                {config.customAxisValue}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-12"
                              max="12"
                              value={config.customAxisValue}
                              onChange={(e) =>
                                setConfig((prev) => ({
                                  ...prev,
                                  customAxisValue: parseInt(e.target.value)
                                }))
                              }
                              className="w-full accent-rose-600"
                            />
                          </div>
                        )}

                        {config.reflectionAxis === 'general' && (
                          <div className="pt-2 border-t border-border space-y-2">
                            <div className="font-mono text-center text-xs font-bold text-rose-600">
                              {config.generalLine.a}x + {config.generalLine.b}y + {config.generalLine.c} = 0
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-[10px] text-ink-soft">A:</span>
                                <input
                                  type="number"
                                  value={config.generalLine.a}
                                  onChange={(e) =>
                                    setConfig((prev) => ({
                                      ...prev,
                                      generalLine: {
                                        ...prev.generalLine,
                                        a: parseFloat(e.target.value) || 0
                                      }
                                    }))
                                  }
                                  className="w-full p-1 rounded bg-surface border border-border text-center font-mono"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-ink-soft">B:</span>
                                <input
                                  type="number"
                                  value={config.generalLine.b}
                                  onChange={(e) =>
                                    setConfig((prev) => ({
                                      ...prev,
                                      generalLine: {
                                        ...prev.generalLine,
                                        b: parseFloat(e.target.value) || 0
                                      }
                                    }))
                                  }
                                  className="w-full p-1 rounded bg-surface border border-border text-center font-mono"
                                />
                              </div>
                              <div>
                                <span className="text-[10px] text-ink-soft">C:</span>
                                <input
                                  type="number"
                                  value={config.generalLine.c}
                                  onChange={(e) =>
                                    setConfig((prev) => ({
                                      ...prev,
                                      generalLine: {
                                        ...prev.generalLine,
                                        c: parseFloat(e.target.value) || 0
                                      }
                                    }))
                                  }
                                  className="w-full p-1 rounded bg-surface border border-border text-center font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SIMETRÍA CENTRAL */}
                    {config.type === 'central_reflection' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Centro de simetría O(h, k):</span>
                          <span className="font-mono text-sky-600 font-bold">
                            ({config.centralCenter.x}, {config.centralCenter.y})
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTool(tool === 'pivot' ? 'select' : 'pivot')}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                              tool === 'pivot'
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-surface text-ink border-border hover:border-border-strong'
                            }`}
                          >
                            <Target className="h-3.5 w-3.5" /> Ubicar con Clic
                          </button>
                          <button
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                centralCenter: { x: 0, y: 0 }
                              }))
                            }
                            className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-surface text-ink-soft hover:text-ink border border-border transition"
                          >
                            Origen (0,0)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ROTACIÓN */}
                    {config.type === 'rotation' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Ángulo de giro (α):</span>
                          <span className="font-mono text-amber-600 font-bold">
                            {config.angleDeg}° ({config.direction === 'anticlockwise' ? 'Antihorario' : 'Horario'})
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={config.angleDeg}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              angleDeg: parseInt(e.target.value)
                            }))
                          }
                          className="w-full accent-amber-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                direction:
                                  prev.direction === 'anticlockwise'
                                    ? 'clockwise'
                                    : 'anticlockwise'
                              }))
                            }
                            className="flex-1 py-1.5 px-2 rounded-lg bg-surface border border-border font-semibold text-[11px] text-ink hover:bg-black/5"
                          >
                            Sentido: {config.direction === 'anticlockwise' ? 'Antihorario (+)' : 'Horario (-)'}
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[90, 180, 270, 360].map((deg) => (
                            <button
                              key={deg}
                              onClick={() =>
                                setConfig((prev) => ({ ...prev, angleDeg: deg }))
                              }
                              className="py-1 text-[11px] font-mono bg-surface border border-border rounded hover:bg-border font-semibold"
                            >
                              {deg}°
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border flex justify-between items-center">
                          <span className="font-semibold text-ink-soft">Centro C:</span>
                          <span className="font-mono text-amber-600 font-bold">
                            ({config.center.x}, {config.center.y})
                          </span>
                          <button
                            onClick={() => setTool(tool === 'pivot' ? 'select' : 'pivot')}
                            className="px-2 py-1 text-[11px] rounded bg-surface border border-border hover:border-accent"
                          >
                            Mover
                          </button>
                        </div>
                      </div>
                    )}

                    {/* HOMOTECIA */}
                    {config.type === 'homothety' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Razón de escala (k):</span>
                          <span className="font-mono text-purple-600 font-bold">
                            {config.scaleFactor}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-3"
                          max="3"
                          step="0.25"
                          value={config.scaleFactor}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              scaleFactor: parseFloat(e.target.value)
                            }))
                          }
                          className="w-full accent-purple-600"
                        />
                        <div className="grid grid-cols-4 gap-1">
                          {[0.5, 2, -1, -1.5].map((k) => (
                            <button
                              key={k}
                              onClick={() =>
                                setConfig((prev) => ({ ...prev, scaleFactor: k }))
                              }
                              className="py-1 text-[11px] font-mono bg-surface border border-border rounded hover:bg-border font-semibold"
                            >
                              {k}x
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border flex justify-between items-center">
                          <span className="font-semibold text-ink-soft">Centro O:</span>
                          <span className="font-mono text-purple-600 font-bold">
                            ({config.homothetyCenter.x}, {config.homothetyCenter.y})
                          </span>
                          <button
                            onClick={() => setTool(tool === 'pivot' ? 'select' : 'pivot')}
                            className="px-2 py-1 text-[11px] rounded bg-surface border border-border hover:border-accent"
                          >
                            Mover
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* MODAL DE PRESETS DE FIGURAS */}
      {isPresetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Shapes className="h-4 w-4 text-accent" /> Modelos Geométricos Curriculares
              </h3>
              <button
                onClick={() => setIsPresetsOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {SHAPE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setVertices(preset.vertices);
                    setIsPresetsOpen(false);
                    setCurrentStep(preset.vertices.length + 2);
                  }}
                  className="flex flex-col items-start p-3 rounded-xl border border-border bg-panel hover:border-accent hover:bg-accent/5 transition text-left group"
                >
                  <span className="text-xs font-bold text-ink group-hover:text-accent flex items-center justify-between w-full">
                    {preset.name}
                    <ChevronRight className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  </span>
                  <span className="text-[11px] text-ink-soft mt-1">
                    {preset.category} • {preset.vertices.length} vértices
                  </span>
                  <div className="text-[10px] font-mono text-ink-faint mt-1.5 truncate w-full">
                    {preset.vertices.map((v) => `${v.label}(${v.x},${v.y})`).join(' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INGRESO MANUAL DE COORDENADAS */}
      {isCoordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Hash className="h-4 w-4 text-accent" /> Ingresar Vértices (x, y)
              </h3>
              <button
                onClick={() => setIsCoordsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              Ingresa un par por línea: <code>1, 2</code> o <code>(4, 2)</code>.
            </p>
            <textarea
              rows={5}
              value={coordsInputText}
              onChange={(e) => setCoordsInputText(e.target.value)}
              className="w-full rounded-xl border border-border bg-panel p-3 font-mono text-xs text-ink focus:outline-none focus:border-accent"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsCoordsModalOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-medium hover:bg-black/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyCoordinates}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:brightness-110 shadow-sm"
              >
                Cargar en Pizarra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
