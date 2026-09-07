import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MousePointer,
  Hexagon,
  Move,
  FlipHorizontal,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Target,
  Edit3,
  Undo2,
  Trash2,
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
  Minimize,
  Plus,
  Info
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
import { GeoGebraToolbar } from './components/GeoGebraToolbar';
import { AlgebraView } from './components/AlgebraView';
import { AlgebraicNotebook } from './components/AlgebraicNotebook';
import { InverseProblemPanel } from './components/InverseProblemPanel';
import { InteractiveGuideModal } from './components/InteractiveGuideModal';
import { SHAPE_PRESETS } from './utils/transformations';

export default function App() {
  // 1. HERRAMIENTA ACTIVA ESTILO GEOGEBRA
  const [tool, setTool] = useState<ToolMode>('select');

  // 2. ESTADO DE LA PREIMAGEN (INICIA CON PIZARRA LIMPIA POR DEFECTO O FIGURA MINIMA)
  const [vertices, setVertices] = useState<Point[]>([]);

  // 3. ESTADO DE LA TRANSFORMACIÓN GEOMÉTRICA
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

  // 4. ESTADO DE PROBLEMA Y CONSIGNA
  const [problemMode, setProblemMode] = useState<ProblemMode>('DIRECT');
  const [currentScenario, setCurrentScenario] = useState<ProblemScenario | null>(null);
  const [customStatement, setCustomStatement] = useState<string>(
    'Pizarra interactiva: traza tu figura en el plano o carga un modelo escolar.'
  );

  // 5. PESTAÑAS DEL PANEL LATERAL RESPONSIVO
  const [sidebarTab, setSidebarTab] = useState<'algebra' | 'notebook' | 'problem'>('algebra');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [cleanBoardMode, setCleanBoardMode] = useState<boolean>(false);

  // 6. TOGGLES DE INSPECCIÓN
  const [toggles, setToggles] = useState<ClassroomToggles>({
    showSideLengths: false,
    showInteriorAngles: false,
    showConstructionGuides: true,
    showAlgebraicNotebook: true,
    cleanBoardMode: false
  });

  // 7. PLANO CARTESIANO Y VISOR ESTILO GEOGEBRA
  const [gridStyle, setGridStyle] = useState<GridStyle>('lines');
  const [scale, setScale] = useState<number>(38); // px por unidad
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // 8. MODALES
  const [isCoordsModalOpen, setIsCoordsModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [coordsInputText, setCoordsInputText] = useState('1, 1\n4, 2\n2, 5');

  // 9. CURSOR Y ARRASTRE
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

  // Centro pivote activo
  const activePivot = useMemo(() => {
    if (config.type === 'rotation') return config.center;
    if (config.type === 'homothety') return config.homothetyCenter;
    if (config.type === 'central_reflection') return config.centralCenter;
    return null;
  }, [config.type, config.center, config.homothetyCenter, config.centralCenter]);

  // Convertir coordenadas del plano a coordenadas del canvas de pantalla
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

  // Acción Limpiar Pizarra (Canvas Limpio)
  const handleClearCanvas = () => {
    setVertices([]);
    setTool('select');
  };

  // Cargar figura prediseñada
  const handleLoadPreset = (preset: (typeof SHAPE_PRESETS)[0]) => {
    setVertices(preset.vertices);
    setIsPresetsOpen(false);
    setTool('select');
  };

  // Cargar triángulo escolar rápido
  const handleLoadQuickTriangle = () => {
    setVertices([
      { x: 1, y: 1, label: 'A' },
      { x: 4, y: 2, label: 'B' },
      { x: 2, y: 5, label: 'C' }
    ]);
    setTool('select');
  };

  // Deshacer último vértice
  const handleUndo = () => {
    if (vertices.length > 0) {
      setVertices((prev) => prev.slice(0, -1));
    }
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
        setTool('select');
      } else {
        alert('Ingresa al menos 2 pares ordenados (x, y)');
      }
    } catch {
      alert('Formato de coordenadas inválido');
    }
  };

  // RENDERIZADO DEL PLANO AL ESTILO GEOGEBRA
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

    // Fondo blanco nítido estilo GeoGebra
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const originX = width / 2 + pan.x;
    const originY = height / 2 + pan.y;

    const minUnitX = Math.floor(-originX / scale) - 2;
    const maxUnitX = Math.ceil((width - originX) / scale) + 2;
    const minUnitY = Math.floor(-(height - originY) / scale) - 2;
    const maxUnitY = Math.ceil(originY / scale) + 2;

    // 1. CUADRÍCULA GEOGEBRA (Líneas mayores y menores sutiles)
    if (gridStyle === 'lines') {
      // Líneas menores (subcuadrícula)
      if (scale > 30) {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = '#f1f5f9';
        ctx.beginPath();
        for (let u = minUnitX * 5; u <= maxUnitX * 5; u++) {
          if (u % 5 === 0) continue;
          const sx = originX + (u / 5) * scale;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
        for (let u = minUnitY * 5; u <= maxUnitY * 5; u++) {
          if (u % 5 === 0) continue;
          const sy = originY - (u / 5) * scale;
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }
        ctx.stroke();
      }

      // Líneas mayores
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
      ctx.fillStyle = '#cbd5e1';
      for (let ux = minUnitX; ux <= maxUnitX; ux++) {
        for (let uy = minUnitY; uy <= maxUnitY; uy++) {
          const sx = originX + ux * scale;
          const sy = originY - uy * scale;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. EJES COORDENADOS (X e Y) CON FLECHAS GEOGEBRA
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = '#64748b';
    ctx.font = '11px "Inter", -apple-system, sans-serif';

    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Flecha Eje X (+X)
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(width - 2, originY);
    ctx.lineTo(width - 10, originY - 4);
    ctx.lineTo(width - 10, originY + 4);
    ctx.closePath();
    ctx.fill();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(originX, height);
    ctx.lineTo(originX, 0);
    ctx.stroke();

    // Flecha Eje Y (+Y)
    ctx.beginPath();
    ctx.moveTo(originX, 2);
    ctx.lineTo(originX - 4, 10);
    ctx.lineTo(originX + 4, 10);
    ctx.closePath();
    ctx.fill();

    // Números en Eje X
    const step = scale < 22 ? 5 : scale < 35 ? 2 : 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#64748b';
    for (let u = minUnitX; u <= maxUnitX; u++) {
      if (u === 0 || u % step !== 0) continue;
      const sx = originX + u * scale;
      ctx.beginPath();
      ctx.moveTo(sx, originY - 3);
      ctx.lineTo(sx, originY + 3);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      ctx.fillText(u.toString(), sx, originY + 5);
    }

    // Números en Eje Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let u = minUnitY; u <= maxUnitY; u++) {
      if (u === 0 || u % step !== 0) continue;
      const sy = originY - u * scale;
      ctx.beginPath();
      ctx.moveTo(originX - 3, sy);
      ctx.lineTo(originX + 3, sy);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      ctx.fillText(u.toString(), originX - 6, sy);
    }

    // Origen O(0,0)
    ctx.fillStyle = '#475569';
    ctx.font = 'italic bold 11px serif';
    ctx.fillText('O', originX - 7, originY + 7);

    // 3. ELEMENTOS DE TRANSFORMACIÓN (EJE, CENTRO, VECTORES)
    if (config.type === 'reflection') {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#dc2626';
      ctx.setLineDash([7, 5]);
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
          const y1 = (-a * minUnitX - c) / b;
          const y2 = (-a * maxUnitX - c) / b;
          const p1 = toScreen({ x: minUnitX, y: y1 }, width, height);
          const p2 = toScreen({ x: maxUnitX, y: y2 }, width, height);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
        } else if (a !== 0) {
          const sx = originX + (-c / a) * scale;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }
      }
      ctx.stroke();

      // Placa elegante para el eje L
      ctx.setLineDash([]);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 11px "Inter", sans-serif';
      let axisTitle = 'Eje L';
      if (config.reflectionAxis === 'custom_x') axisTitle = `L: x = ${config.customAxisValue}`;
      else if (config.reflectionAxis === 'custom_y') axisTitle = `L: y = ${config.customAxisValue}`;
      else if (config.reflectionAxis === 'x') axisTitle = 'L: y = 0';
      else if (config.reflectionAxis === 'y') axisTitle = 'L: x = 0';
      else if (config.reflectionAxis === 'y=x') axisTitle = 'L: y = x';

      ctx.fillStyle = 'rgba(254, 242, 242, 0.9)';
      ctx.fillRect(20, height - 34, 110, 22);
      ctx.strokeStyle = '#fecaca';
      ctx.strokeRect(20, height - 34, 110, 22);
      ctx.fillStyle = '#b91c1c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(axisTitle, 75, height - 23);
      ctx.restore();
    } else if (activePivot) {
      // Centro Pivote GeoGebra
      const cScr = toScreen(activePivot, width, height);
      const color =
        config.type === 'rotation'
          ? '#d97706'
          : config.type === 'homothety'
          ? '#9333ea'
          : '#0284c7';

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cScr.x, cScr.y, isHoveringPivot ? 14 : 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cScr.x, cScr.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Etiqueta pivote con fondo blanco protector
      ctx.font = 'bold 11px "Inter", sans-serif';
      const pLabel = `C(${activePivot.x}, ${activePivot.y})`;
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText(pLabel, cScr.x + 10, cScr.y - 8);
      ctx.fillText(pLabel, cScr.x + 10, cScr.y - 8);
      ctx.restore();
    }

    // 4. GUÍAS Y CONSTRUCCIONES MATEMÁTICAS ESTRICTAS
    if (toggles.showConstructionGuides && vertices.length > 0) {
      // A) Simetría Axial: Segmentos perpendiculares, 90° y ticks congruentes
      if (config.type === 'reflection' && engineResult.constructionElements.perpendicularGuides) {
        ctx.save();
        engineResult.constructionElements.perpendicularGuides.forEach((g) => {
          const s = toScreen(g.p, width, height);
          const hScr = toScreen(g.footH, width, height);
          const e = toScreen(g.pPrime, width, height);

          // Perpendicular discontinua fina
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Símbolo de ángulo recto (90°)
          const vP = { x: s.x - hScr.x, y: s.y - hScr.y };
          const lenP = Math.hypot(vP.x, vP.y);
          if (lenP > 6) {
            const uP = { x: vP.x / lenP, y: vP.y / lenP };
            const uL = { x: -uP.y, y: uP.x };
            const sq = 7;
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(hScr.x + uP.x * sq, hScr.y + uP.y * sq);
            ctx.lineTo(hScr.x + uP.x * sq + uL.x * sq, hScr.y + uP.y * sq + uL.y * sq);
            ctx.lineTo(hScr.x + uL.x * sq, hScr.y + uL.y * sq);
            ctx.stroke();

            // Ticks de congruencia //
            const drawTicks = (mid: { x: number; y: number }) => {
              const tLen = 3.5;
              ctx.beginPath();
              ctx.moveTo(mid.x - uL.x * tLen, mid.y - uL.y * tLen);
              ctx.lineTo(mid.x + uL.x * tLen, mid.y + uL.y * tLen);
              ctx.stroke();
            };
            drawTicks({ x: (s.x + hScr.x) / 2, y: (s.y + hScr.y) / 2 });
            drawTicks({ x: (hScr.x + e.x) / 2, y: (hScr.y + e.y) / 2 });
          }
        });
        ctx.restore();
      }

      // B) Traslación: Descomposición en catetos Δx, Δy y vector resultante
      if (config.type === 'translation' && engineResult.constructionElements.vectorGuides) {
        ctx.save();
        engineResult.constructionElements.vectorGuides.forEach((g, idx) => {
          const s = toScreen(g.start, width, height);
          const inter = toScreen(g.intermediate, width, height);
          const e = toScreen(g.end, width, height);

          // Pasos horizontales y verticales
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(inter.x, inter.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Vector
          ctx.strokeStyle = '#2563eb';
          ctx.fillStyle = '#2563eb';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Flecha
          const ang = Math.atan2(e.y - s.y, e.x - s.x);
          const arrLen = 7;
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
        });
        ctx.restore();
      }

      // C) Rotación: Radios, arcos de trayectoria exacta, sector angular, símbolo de 90° y badge de ángulo
      if (config.type === 'rotation' && engineResult.constructionElements.rotationArcs && engineResult.constructionElements.rotationArcs.length > 0) {
        ctx.save();
        const arcs = engineResult.constructionElements.rotationArcs;
        const cScr = toScreen(config.center, width, height);
        const isScreenCCW = config.direction === 'anticlockwise';

        // 1. Dibujar trayectorias circulares para cada vértice (P -> P')
        arcs.forEach((g, idx) => {
          const s = toScreen(g.p, width, height);
          const e = toScreen(g.pPrime, width, height);
          const rPx = Math.hypot(s.x - cScr.x, s.y - cScr.y);
          if (rPx < 5) return;

          const sAng = Math.atan2(s.y - cScr.y, s.x - cScr.x);
          const eAng = Math.atan2(e.y - cScr.y, e.x - cScr.x);

          // Radios r desde el centro C hasta P y P'
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(s.x, s.y);
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(e.x, e.y);
          if (idx === 0) {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
          } else {
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
          }
          ctx.stroke();

          // Arco de trayectoria circular exacto (con radio rPx real del vértice)
          ctx.beginPath();
          ctx.arc(cScr.x, cScr.y, rPx, sAng, eAng, isScreenCCW);
          if (idx === 0) {
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([5, 3]);
          } else {
            ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 3]);
          }
          ctx.stroke();

          // Flecha direccional en el punto de llegada e (P')
          const tangAng = isScreenCCW ? eAng - Math.PI / 2 : eAng + Math.PI / 2;
          const arrowLen = idx === 0 ? 8 : 6;
          ctx.fillStyle = idx === 0 ? '#d97706' : 'rgba(217, 119, 6, 0.6)';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(
            e.x - arrowLen * Math.cos(tangAng - Math.PI / 6),
            e.y - arrowLen * Math.sin(tangAng - Math.PI / 6)
          );
          ctx.lineTo(
            e.x - arrowLen * Math.cos(tangAng + Math.PI / 6),
            e.y - arrowLen * Math.sin(tangAng + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        });

        // 2. Indicador Didáctico Central del Ángulo de Giro (En el vértice de referencia A)
        const refArc = arcs[0];
        const sRef = toScreen(refArc.p, width, height);
        const eRef = toScreen(refArc.pPrime, width, height);
        const rRef = Math.hypot(sRef.x - cScr.x, sRef.y - cScr.y);

        if (rRef >= 10 && config.angleDeg > 0) {
          const sAng = Math.atan2(sRef.y - cScr.y, sRef.x - cScr.x);
          const eAng = Math.atan2(eRef.y - cScr.y, eRef.x - cScr.x);
          const sectorR = Math.min(48, Math.max(30, rRef * 0.42));

          // A) Sector sombreado translúcido entre rayo CA y rayo CA'
          ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.arc(cScr.x, cScr.y, sectorR, sAng, eAng, isScreenCCW);
          ctx.closePath();
          ctx.fill();

          // B) Borde del arco del ángulo con línea continua nítida
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(cScr.x, cScr.y, sectorR, sAng, eAng, isScreenCCW);
          ctx.stroke();

          // Flecha en el arco del ángulo
          const arcFrac = 0.85;
          const arcArrowAng = isScreenCCW
            ? sAng - ((config.angleDeg * Math.PI) / 180) * arcFrac
            : sAng + ((config.angleDeg * Math.PI) / 180) * arcFrac;
          const arcEndScr = {
            x: cScr.x + sectorR * Math.cos(arcArrowAng),
            y: cScr.y + sectorR * Math.sin(arcArrowAng)
          };
          const arcTang = isScreenCCW ? arcArrowAng - Math.PI / 2 : arcArrowAng + Math.PI / 2;
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(arcEndScr.x, arcEndScr.y);
          ctx.lineTo(
            arcEndScr.x - 6 * Math.cos(arcTang - Math.PI / 6),
            arcEndScr.y - 6 * Math.sin(arcTang - Math.PI / 6)
          );
          ctx.lineTo(
            arcEndScr.x - 6 * Math.cos(arcTang + Math.PI / 6),
            arcEndScr.y - 6 * Math.sin(arcTang + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // C) Símbolo clásico de 90° (cuadradito perpendicular) si el ángulo es 90° o 270°
          const isRightAngle = Math.abs(config.angleDeg % 180) === 90;
          if (isRightAngle) {
            const sqSize = 14;
            const u1 = { x: Math.cos(sAng), y: Math.sin(sAng) };
            const u2 = { x: Math.cos(eAng), y: Math.sin(eAng) };
            const p1 = { x: cScr.x + sqSize * u1.x, y: cScr.y + sqSize * u1.y };
            const pCorner = {
              x: cScr.x + sqSize * (u1.x + u2.x),
              y: cScr.y + sqSize * (u1.y + u2.y)
            };
            const p2 = { x: cScr.x + sqSize * u2.x, y: cScr.y + sqSize * u2.y };

            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(pCorner.x, pCorner.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Pequeño punto interior del ángulo recto
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(
              cScr.x + sqSize * 0.55 * (u1.x + u2.x),
              cScr.y + sqSize * 0.55 * (u1.y + u2.y),
              1.6,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // D) Placa / Badge Prominente del Ángulo (p. ej. "α = 90° ↺")
          const cartStartAng = Math.atan2(refArc.p.y - config.center.y, refArc.p.x - config.center.x);
          const deltaAng = (config.direction === 'clockwise' ? -1 : 1) * ((config.angleDeg * Math.PI) / 180);
          const cartBisector = cartStartAng + deltaAng / 2;
          const screenBisector = -cartBisector;

          const badgeDist = sectorR + 26;
          const badgeX = cScr.x + badgeDist * Math.cos(screenBisector);
          const badgeY = cScr.y + badgeDist * Math.sin(screenBisector);

          const dirSymbol = config.direction === 'anticlockwise' ? '↺' : '↻';
          const badgeText = `α = ${config.angleDeg}° ${dirSymbol}`;

          ctx.font = 'bold 12px "Inter", sans-serif';
          const tMetrics = ctx.measureText(badgeText);
          const bW = tMetrics.width + 16;
          const bH = 22;

          // Dibujar cápsula con sombra
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = '#fffbeb';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX - bW / 2, badgeY - bH / 2, bW, bH, 11);
          } else {
            ctx.rect(badgeX - bW / 2, badgeY - bH / 2, bW, bH);
          }
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Texto nítido del ángulo
          ctx.fillStyle = '#78350f';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX, badgeY);
        }

        ctx.restore();
      }

      // D) Homotecia: Rayos desde O
      if (config.type === 'homothety' && engineResult.constructionElements.homothetyRays) {
        ctx.save();
        engineResult.constructionElements.homothetyRays.forEach((g) => {
          const cScr = toScreen(g.center, width, height);
          const e = toScreen(g.pPrime, width, height);

          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();
        });
        ctx.restore();
      }
    }

    // 5. DIBUJAR POLÍGONOS CON ALGORITMO ANTI-COLISIÓN DE ETIQUETAS
    const drawGeoGebraPolygon = (
      pts: Point[],
      strokeColor: string,
      fillColor: string,
      isTransformed = false
    ) => {
      if (pts.length === 0) return;

      // Calcular centroide para proyectar etiquetas hacia el exterior
      let centroidX = 0;
      let centroidY = 0;
      pts.forEach((pt) => {
        centroidX += pt.x;
        centroidY += pt.y;
      });
      centroidX /= pts.length;
      centroidY /= pts.length;
      const cScr = toScreen({ x: centroidX, y: centroidY }, width, height);

      // Dibujar relleno y bordes
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
      ctx.lineWidth = 2.2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Medidas de lados si está activado
      if (toggles.showSideLengths && pts.length >= 3) {
        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < pts.length; i++) {
          const pA = pts[i];
          const pB = pts[(i + 1) % pts.length];
          const sA = toScreen(pA, width, height);
          const sB = toScreen(pB, width, height);
          const midX = (sA.x + sB.x) / 2;
          const midY = (sA.y + sB.y) / 2;
          ctx.fillText(`${formatNum(distance(pA, pB))}`, midX, midY - 6);
        }
      }

      // Dibujar vértices con anti-colisión
      pts.forEach((pt, i) => {
        const pScr = toScreen(pt, width, height);
        const isHovered = !isTransformed && hoveredVertexIndex === i;

        // Vértice circular GeoGebra
        ctx.beginPath();
        ctx.arc(pScr.x, pScr.y, isHovered ? 6.5 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#10b981' : strokeColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Vector exterior desde el centroide hacia el vértice
        const dx = pScr.x - cScr.x;
        const dy = pScr.y - cScr.y;
        const distC = Math.hypot(dx, dy) || 1;
        const labelDist = 16;
        const lx = pScr.x + (dx / distC) * labelDist;
        const ly = pScr.y + (dy / distC) * labelDist;

        if (showLabels) {
          const cleanName = (pt.label || String.fromCharCode(65 + i)).replace(/'/g, '');
          const primeSuffix = isTransformed ? "'" : '';
          const labelText = `${cleanName}${primeSuffix} (${formatNum(pt.x)}, ${formatNum(pt.y)})`;

          ctx.font = 'bold 11px "Inter", -apple-system, sans-serif';
          const textWidth = ctx.measureText(labelText).width;

          // Protección contra corte de texto en los márgenes de la pantalla
          let align: CanvasTextAlign = dx >= 0 ? 'left' : 'right';
          let targetLx = lx;
          if (align === 'right' && lx - textWidth < 8) {
            align = 'left';
            targetLx = pScr.x + 10;
          } else if (align === 'left' && lx + textWidth > width - 8) {
            align = 'right';
            targetLx = pScr.x - 10;
          }

          const targetLy = Math.max(16, Math.min(height - 12, ly));
          ctx.textAlign = align;
          ctx.textBaseline = dy >= 0 ? 'top' : 'bottom';

          // Halo blanco anti-obstrucción estilo GeoGebra
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 3.5;
          ctx.strokeText(labelText, targetLx, targetLy);

          ctx.fillStyle = '#0f172a';
          ctx.fillText(labelText, targetLx, targetLy);
        }
      });
    };

    // 6. DIBUJAR FIGURA TRANSFORMADA F' (GeoGebra Violet `#7B1FA2`)
    if (transformedVertices.length >= 2) {
      drawGeoGebraPolygon(
        transformedVertices,
        '#7b1fa2',
        'rgba(123, 31, 162, 0.12)',
        true
      );
    } else if (transformedVertices.length === 1) {
      const p = toScreen(transformedVertices[0], width, height);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#7b1fa2';
      ctx.fill();
    }

    // 7. DIBUJAR FIGURA PREIMAGEN F (GeoGebra Blue `#1565C0`)
    if (vertices.length >= 2) {
      drawGeoGebraPolygon(
        vertices,
        '#1565c0',
        'rgba(21, 101, 192, 0.14)',
        false
      );
    } else if (vertices.length === 1) {
      const p = toScreen(vertices[0], width, height);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1565c0';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`${vertices[0].label || 'A'} (${vertices[0].x}, ${vertices[0].y})`, p.x + 8, p.y - 8);
    }
  }, [
    vertices,
    transformedVertices,
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

  // MANEJO DE EVENTOS DEL RATÓN EN EL LIENZO
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Herramienta Punto o Polígono: colocar vértice en el plano
    if (tool === 'point' || tool === 'polygon') {
      const cart = toCartesian(clientX, clientY, rect.width, rect.height);

      // Si es la herramienta polígono y hace clic cerca del primer vértice para cerrar:
      if (tool === 'polygon' && vertices.length >= 2) {
        const firstScr = toScreen(vertices[0], rect.width, rect.height);
        if (Math.hypot(clientX - firstScr.x, clientY - firstScr.y) <= 15) {
          // Cerrar polígono y pasar a herramienta mover
          setTool('select');
          return;
        }
      }

      const nextLabel = String.fromCharCode(65 + vertices.length);
      setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel }]);
      return;
    }

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

    // Modo Mover (Select): Verificar si arrastra el centro pivote
    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15) {
        isDraggingPivotRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Modo Mover (Select): Verificar si arrastra un vértice original
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        draggingVertexIndexRef.current = i;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Desplazar el plano (Pan)
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

    // Hover sobre pivote o vértices
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

  // Exportar PNG de alta resolución
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
    ctx.fillRect(0, 0, exportCanvas.width, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('GeoGebra Transformaciones • Pizarra Analítica', 20, 30);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `geogebra_${config.type}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-ink font-sans select-none">
      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR ESTILO GEOGEBRA */}
      <GeoGebraToolbar
        activeTool={tool}
        onSelectTool={setTool}
        activeTransformation={config.type}
        onSelectTransformation={(type) => setConfig((prev) => ({ ...prev, type }))}
        onClearCanvas={handleClearCanvas}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onUndo={handleUndo}
        canUndo={vertices.length > 0}
        isCleanBoard={cleanBoardMode}
        onToggleCleanBoard={() => setCleanBoardMode(!cleanBoardMode)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sidebarTab={sidebarTab}
        onSelectSidebarTab={setSidebarTab}
      />

      {/* 2. SUB-BARRA DE INSTRUCCIONES CONTEXTUALES GEOGEBRA */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-panel/80 border-b border-border text-xs">
        <div className="flex items-center gap-2 text-ink-soft">
          <Info className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="font-medium">
            {tool === 'select' && 'Mover: Arrastra vértices, el centro o arrastra el fondo para desplazar el plano.'}
            {tool === 'point' && 'Punto: Haz clic en cualquier lugar del plano para añadir un nuevo punto.'}
            {tool === 'polygon' && 'Polígono: Haz clic en cada vértice y vuelve a hacer clic en el primer punto para cerrar la figura.'}
            {tool === 'pivot' && 'Pivote: Haz clic en el plano para fijar el nuevo centro de giro u homotecia.'}
          </span>
        </div>

        {/* Toggles de inspección rápida */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() =>
              setToggles((prev) => ({ ...prev, showConstructionGuides: !prev.showConstructionGuides }))
            }
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              toggles.showConstructionGuides ? 'bg-rose-100 text-rose-800' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Líneas Guía
          </button>
          <button
            onClick={() =>
              setToggles((prev) => ({ ...prev, showSideLengths: !prev.showSideLengths }))
            }
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
              toggles.showSideLengths ? 'bg-blue-100 text-blue-800' : 'text-ink-soft hover:text-ink'
            }`}
          >
            Medidas
          </button>
        </div>
      </div>

      {/* 3. ÁREA DE TRABAJO PRINCIPAL: LIENZO Y PANEL LATERAL */}
      <div className="relative flex flex-1 h-full w-full overflow-hidden">
        {/* LIENZO DE GEOMETRÍA */}
        <div className="relative flex-1 h-full w-full overflow-hidden bg-white">
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
              tool === 'point' || tool === 'polygon' || tool === 'pivot'
                ? 'cursor-crosshair'
                : isHoveringPivot || isDraggingPivotRef.current
                ? 'cursor-move'
                : hoveredVertexIndex !== null
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
          />

          {/* HUD FLOTANTE DE COORDENADAS */}
          {mouseCoord && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-surface/90 px-3 py-1 shadow-sm backdrop-blur border border-border font-mono text-xs text-ink">
              <Target className="h-3.5 w-3.5 text-accent" />
              <span>({mouseCoord.x}, {mouseCoord.y})</span>
            </div>
          )}

          {/* BOTONERA FLOTANTE INFERIOR DERECHA (ZOOM, CENTRAR, EXPORTAR) */}
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1 bg-surface/90 p-1.5 rounded-2xl shadow-lg border border-border backdrop-blur-md">
            <button
              onClick={() => setScale((prev) => Math.min(prev * 1.2, 140))}
              title="Acercar (Zoom +)"
              className="p-2 rounded-xl hover:bg-black/5 text-ink transition"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScale((prev) => Math.max(prev * 0.833, 12))}
              title="Alejar (Zoom -)"
              className="p-2 rounded-xl hover:bg-black/5 text-ink transition"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPan({ x: 0, y: 0 })}
              title="Restablecer Origen O(0,0)"
              className="p-2 rounded-xl hover:bg-black/5 text-ink transition"
            >
              <Target className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={() =>
                setGridStyle((prev) => (prev === 'lines' ? 'dots' : prev === 'dots' ? 'axes' : 'lines'))
              }
              title={`Estilo de cuadrícula: ${gridStyle}`}
              className="px-2.5 py-1 text-xs font-semibold text-ink hover:bg-black/5 rounded-xl capitalize"
            >
              {gridStyle}
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={handleExportPNG}
              title="Descargar imagen PNG"
              className="p-2 rounded-xl hover:bg-accent/10 hover:text-accent text-ink transition"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PANEL LATERAL RESPONSIVO (VISTA ÁLGEBRA / CUADERNO / PROBLEMAS) */}
        {!cleanBoardMode && isSidebarOpen && (
          <aside className="w-[380px] h-full bg-surface border-l border-border shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-150">
            {sidebarTab === 'algebra' && (
              <AlgebraView
                vertices={vertices}
                onUpdateVertices={setVertices}
                transformedVertices={transformedVertices}
                config={config}
                onUpdateConfig={setConfig}
                onSetTool={setTool}
                onOpenCoordsModal={() => setIsCoordsModalOpen(true)}
              />
            )}

            {sidebarTab === 'notebook' && (
              <AlgebraicNotebook engineResult={engineResult} />
            )}

            {sidebarTab === 'problem' && (
              <InverseProblemPanel
                preimage={vertices}
                image={transformedVertices}
                currentScenario={currentScenario}
              />
            )}
          </aside>
        )}
      </div>

      {/* MODAL DE MODELOS CURRICULARES */}
      {isPresetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-lg rounded-3xl bg-surface p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Shapes className="h-4 w-4 text-accent" /> Figuras Geométricas Escolares
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
                  onClick={() => handleLoadPreset(preset)}
                  className="flex flex-col items-start p-3 rounded-2xl border border-border bg-panel hover:border-accent hover:bg-accent/5 transition text-left group"
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

      {/* MODAL DE COORDENADAS NUMÉRICAS (x, y) */}
      {isCoordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-2xl border border-border space-y-4">
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
              Ingresa un par por línea. Ejemplo: <code>1, 2</code> o <code>(4, 2)</code>.
            </p>
            <textarea
              rows={5}
              value={coordsInputText}
              onChange={(e) => setCoordsInputText(e.target.value)}
              className="w-full rounded-2xl border border-border bg-panel p-3 font-mono text-xs text-ink focus:outline-none focus:border-accent"
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

      {/* MODAL DE GUÍA INTERACTIVA DE USO */}
      <InteractiveGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLoadExample={handleLoadQuickTriangle}
      />
    </div>
  );
}
