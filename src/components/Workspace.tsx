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
  Info,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import {
  Point,
  TransformationConfig,
  GridStyle,
  ToolMode,
  ReflectionAxis,
  ProblemMode,
  ProblemScenario,
  ClassroomToggles,
  AppSettings
} from '../types/geometry';
import {
  solveGeometryProblem,
  distance,
  midpoint,
  formatNum,
  CLASSROOM_PROBLEMS
} from '../utils/GeometryProblemEngine';
import { GeoGebraToolbar } from './GeoGebraToolbar';
import { AlgebraView } from './AlgebraView';
import { AlgebraicNotebook } from './AlgebraicNotebook';
import { InverseProblemPanel } from './InverseProblemPanel';
import { InteractiveGuideModal } from './InteractiveGuideModal';
import { PolygonPreview } from './PolygonPreview';
import { SHAPE_PRESETS } from '../utils/transformations';

import jsPDF from 'jspdf';

export function Workspace({ 
  tabId, 
  isActive, 
  settings, 
  setSettings 
}: { 
  tabId: string; 
  isActive: boolean;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}) {
  // 1. HERRAMIENTA ACTIVA ESTILO GEOGEBRA
  const [tool, setTool] = useState<ToolMode>('select');

  // 2. ESTADO DE LA PREIMAGEN (VÉRTICES, SEGMENTOS ABIERTOS O POLÍGONO CERRADO)
  const [vertices, setVertices] = useState<Point[]>([]);
  const [segments, setSegments] = useState<[number, number][]>([]);
  const [isPolygon, setIsPolygon] = useState<boolean>(false);
  const [segmentStartVertex, setSegmentStartVertex] = useState<number | null>(null);

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

  // 3.1 HISTORIAL (Deshacer/Rehacer)
  const [undoStack, setUndoStack] = useState<{ vertices: Point[]; segments: [number, number][]; isPolygon: boolean; config: TransformationConfig }[]>([]);
  const [redoStack, setRedoStack] = useState<{ vertices: Point[]; segments: [number, number][]; isPolygon: boolean; config: TransformationConfig }[]>([]);
  
  const commitAction = useCallback(() => {
    setUndoStack((prev) => [...prev, { vertices, segments, isPolygon, config }]);
    setRedoStack([]);
  }, [vertices, segments, isPolygon, config]);

  // 4. ESTADO DE PROBLEMA Y CONSIGNA
  const [problemMode, setProblemMode] = useState<ProblemMode>('DIRECT');
  const [currentScenario, setCurrentScenario] = useState<ProblemScenario | null>(null);
  const [customStatement, setCustomStatement] = useState<string>(
    'Pizarra interactiva: traza tu figura en el plano o carga un modelo escolar.'
  );

  // 5. PESTAÑAS DEL PANEL LATERAL RESPONSIVO
  const [sidebarTab, setSidebarTab] = useState<'algebra' | 'notebook' | 'problem'>('algebra');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

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

  const { snapToGrid, showLabels, isDarkMode, pointSize, lineThickness, defaultColor } = settings;

  // 8. MODALES
  const [isCoordsModalOpen, setIsCoordsModalOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<string>(SHAPE_PRESETS[0].category);
  const [coordsInputText, setCoordsInputText] = useState('1, 1\n4, 2\n2, 5');

  // 9. CURSOR Y ARRASTRE
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);
  const [isHoveringPivot, setIsHoveringPivot] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingCanvasRef = useRef(false);
  const draggingVertexIndexRef = useRef<number | null>(null);
  const isDraggingPivotRef = useRef(false);
  const isDraggingReflectionLineRef = useRef(false);
  const [isHoveringReflectionLine, setIsHoveringReflectionLine] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 10. MENÚ CONTEXTUAL (CLIC DERECHO)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetType: 'vertex' | 'pivot';
    targetIndex?: number;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
    commitAction();
    setVertices([]);
    setSegments([]);
    setIsPolygon(false);
    setSegmentStartVertex(null);
    setTool('select');
    setConfig((prev) => ({
      ...prev,
      center: { x: 0, y: 0 },
      homothetyCenter: { x: 0, y: 0 },
      centralCenter: { x: 0, y: 0 }
    }));
  };

  // Cargar figura prediseñada
  const handleLoadPreset = (preset: (typeof SHAPE_PRESETS)[0]) => {
    setVertices(preset.vertices);
    setIsPolygon(true);
    const segs: [number, number][] = [];
    for (let i = 0; i < preset.vertices.length; i++) {
      segs.push([i, (i + 1) % preset.vertices.length]);
    }
    setSegments(segs);
    setSegmentStartVertex(null);
    setIsPresetsOpen(false);
    setTool('select');
  };

  // Cargar triángulo escolar rápido
  const handleLoadQuickTriangle = () => {
    const pts: Point[] = [
      { x: 1, y: 1, label: 'A' },
      { x: 4, y: 2, label: 'B' },
      { x: 2, y: 5, label: 'C' }
    ];
    setVertices(pts);
    setIsPolygon(true);
    setSegments([[0, 1], [1, 2], [2, 0]]);
    setSegmentStartVertex(null);
    setTool('select');
  };

  // Alternar Polígono Cerrado / Segmentos Abiertos
  const handleTogglePolygon = () => {
    if (isPolygon) {
      setIsPolygon(false);
    } else {
      if (vertices.length >= 3) {
        setIsPolygon(true);
        const segs: [number, number][] = [];
        for (let i = 0; i < vertices.length; i++) {
          segs.push([i, (i + 1) % vertices.length]);
        }
        setSegments(segs);
      }
    }
  };

  // Unir puntos consecutivamente en serie (A-B-C...)
  const handleAutoConnectSegments = () => {
    if (vertices.length >= 2) {
      const segs: [number, number][] = [];
      for (let i = 0; i < vertices.length - 1; i++) {
        segs.push([i, i + 1]);
      }
      setSegments(segs);
    }
  };

  // Quitar segmentos
  const handleClearSegments = () => {
    setSegments([]);
    setIsPolygon(false);
  };

  // Deshacer última acción en el historial
  const handleUndo = useCallback(() => {
    if (segmentStartVertex !== null) {
      setSegmentStartVertex(null);
      return;
    }
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, { vertices, segments, isPolygon, config }]);
    setVertices(previous.vertices);
    setSegments(previous.segments);
    setIsPolygon(previous.isPolygon);
    setConfig(previous.config);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack, vertices, segments, isPolygon, config, segmentStartVertex]);

  // Rehacer
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, { vertices, segments, isPolygon, config }]);
    setVertices(next.vertices);
    setSegments(next.segments);
    setIsPolygon(next.isPolygon);
    setConfig(next.config);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, vertices, segments, isPolygon, config]);

  // Atajos de teclado (Ctrl+Z y Suprimir/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hoveredVertexIndex !== null) {
          const idx = hoveredVertexIndex;
          setVertices((prev) => prev.filter((_, i) => i !== idx));
          setSegments((prev) => 
            prev.filter(([a, b]) => a !== idx && b !== idx)
                .map(([a, b]) => [a > idx ? a - 1 : a, b > idx ? b - 1 : b] as [number, number])
          );
          setHoveredVertexIndex(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, hoveredVertexIndex, commitAction, vertices, segments]);

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
        setIsPolygon(newPts.length >= 3);
        const segs: [number, number][] = [];
        for (let i = 0; i < newPts.length; i++) {
          if (newPts.length >= 3) {
            segs.push([i, (i + 1) % newPts.length]);
          } else if (i < newPts.length - 1) {
            segs.push([i, i + 1]);
          }
        }
        setSegments(segs);
        setSegmentStartVertex(null);
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
    if (!isActive) return;

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

    // Ajustes por defecto
    const baseLW = lineThickness === 'thin' ? 1 : lineThickness === 'thick' ? 3.5 : 2;
    const pRad = pointSize === 'small' ? 3.5 : pointSize === 'large' ? 7.5 : 5;

    // Fondo del lienzo dependiente del modo oscuro/claro
    ctx.fillStyle = isDarkMode ? '#0b0f19' : '#ffffff';
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
        ctx.strokeStyle = isDarkMode ? '#141d2e' : '#f1f5f9';
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
      ctx.strokeStyle = isDarkMode ? '#1e293b' : '#e2e8f0';
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
      ctx.fillStyle = isDarkMode ? '#334155' : '#cbd5e1';
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

    // 2. EJES COORDENADOS (X e Y) CON FLECHAS
    const axisLineColor = isDarkMode ? '#475569' : '#334155';
    const axisLabelColor = isDarkMode ? '#94a3b8' : '#64748b';
    ctx.lineWidth = baseLW - 0.2;
    ctx.strokeStyle = axisLineColor;
    ctx.fillStyle = axisLabelColor;
    ctx.font = '13px "Inter", -apple-system, sans-serif';

    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Flecha Eje X (+X)
    ctx.fillStyle = axisLineColor;
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
    ctx.fillStyle = axisLabelColor;
    for (let u = minUnitX; u <= maxUnitX; u++) {
      if (u === 0 || u % step !== 0) continue;
      const sx = originX + u * scale;
      ctx.beginPath();
      ctx.moveTo(sx, originY - 3);
      ctx.lineTo(sx, originY + 3);
      ctx.strokeStyle = axisLabelColor;
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
      ctx.strokeStyle = axisLabelColor;
      ctx.stroke();
      ctx.fillText(u.toString(), originX - 6, sy);
    }

    // Origen O(0,0)
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#475569';
    ctx.font = 'italic bold 13px serif';
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
      ctx.font = 'bold 13px "Inter", sans-serif';
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
      ctx.font = 'bold 13px "Inter", sans-serif';
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
          ctx.lineWidth = baseLW - 0.2;
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
            ctx.lineWidth = baseLW - 0.2;
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
            ctx.lineWidth = baseLW - 0.2;
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

          ctx.font = 'bold 15px "Inter", sans-serif';
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

    // 5. DIBUJAR PUNTOS Y LADOS/SEGMENTOS (FIGURA PREIMAGEN F Y TRANSFORMADA F')
    const preStroke = isDarkMode ? '#38bdf8' : '#1565c0';
    const preFill = isDarkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(21, 101, 192, 0.14)';
    const transStroke = isDarkMode ? '#c084fc' : '#7b1fa2';
    const transFill = isDarkMode ? 'rgba(192, 132, 252, 0.2)' : 'rgba(123, 31, 162, 0.12)';

    // A) CASO 1: POLÍGONO CERRADO (isPolygon && vertices.length >= 3)
    if (isPolygon && vertices.length >= 3) {
      // Dibujar polígono F' transformado (relleno + borde)
      if (transformedVertices.length >= 3) {
        ctx.beginPath();
        const fPrime = toScreen(transformedVertices[0], width, height);
        ctx.moveTo(fPrime.x, fPrime.y);
        for (let i = 1; i < transformedVertices.length; i++) {
          const p = toScreen(transformedVertices[i], width, height);
          ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = transFill;
        ctx.fill();
        ctx.strokeStyle = transStroke;
        ctx.lineWidth = baseLW + 0.2;
        ctx.setLineDash([]);
        ctx.stroke();

        // Medidas de lados F'
        if (toggles.showSideLengths) {
          ctx.fillStyle = transStroke;
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          for (let i = 0; i < transformedVertices.length; i++) {
            const pA = transformedVertices[i];
            const pB = transformedVertices[(i + 1) % transformedVertices.length];
            const sA = toScreen(pA, width, height);
            const sB = toScreen(pB, width, height);
            ctx.fillText(
              `${formatNum(distance(pA, pB))}`,
              (sA.x + sB.x) / 2,
              (sA.y + sB.y) / 2 - 6
            );
          }
        }
      }

      // Dibujar polígono F original (relleno + borde)
      ctx.beginPath();
      const fOrig = toScreen(vertices[0], width, height);
      ctx.moveTo(fOrig.x, fOrig.y);
      for (let i = 1; i < vertices.length; i++) {
        const p = toScreen(vertices[i], width, height);
        ctx.lineTo(p.x, p.y);
      }
      ctx.closePath();
      ctx.fillStyle = preFill;
      ctx.fill();
      ctx.strokeStyle = preStroke;
      ctx.lineWidth = baseLW + 0.2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Medidas de lados F
      if (toggles.showSideLengths) {
        ctx.fillStyle = preStroke;
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < vertices.length; i++) {
          const pA = vertices[i];
          const pB = vertices[(i + 1) % vertices.length];
          const sA = toScreen(pA, width, height);
          const sB = toScreen(pB, width, height);
          ctx.fillText(
            `${formatNum(distance(pA, pB))}`,
            (sA.x + sB.x) / 2,
            (sA.y + sB.y) / 2 - 6
          );
        }
      }
    } else {
      // B) CASO 2: SEGMENTOS ABIERTOS O PUNTOS LIBRES
      // Dibujar cada segmento declarado en `segments` (sin rellenar, sin cerrar a triángulo)
      segments.forEach(([a, b]) => {
        // Segmento en figura transformada F'
        if (transformedVertices[a] && transformedVertices[b]) {
          const sA = toScreen(transformedVertices[a], width, height);
          const sB = toScreen(transformedVertices[b], width, height);
          ctx.strokeStyle = transStroke;
          ctx.lineWidth = baseLW + 0.2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(sA.x, sA.y);
          ctx.lineTo(sB.x, sB.y);
          ctx.stroke();

          if (toggles.showSideLengths) {
            ctx.fillStyle = transStroke;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              `${formatNum(distance(transformedVertices[a], transformedVertices[b]))}`,
              (sA.x + sB.x) / 2,
              (sA.y + sB.y) / 2 - 6
            );
          }
        }

        // Segmento en figura original F
        if (vertices[a] && vertices[b]) {
          const sA = toScreen(vertices[a], width, height);
          const sB = toScreen(vertices[b], width, height);
          ctx.strokeStyle = preStroke;
          ctx.lineWidth = baseLW + 0.2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(sA.x, sA.y);
          ctx.lineTo(sB.x, sB.y);
          ctx.stroke();

          if (toggles.showSideLengths) {
            ctx.fillStyle = preStroke;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              `${formatNum(distance(vertices[a], vertices[b]))}`,
              (sA.x + sB.x) / 2,
              (sA.y + sB.y) / 2 - 6
            );
          }
        }
      });

      // Línea elástica (rubber-band) si se está usando la herramienta Segmento
      if (
        tool === 'segment' &&
        segmentStartVertex !== null &&
        vertices[segmentStartVertex] &&
        mouseCoord
      ) {
        const startScr = toScreen(vertices[segmentStartVertex], width, height);
        const curScr = toScreen(mouseCoord, width, height);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = baseLW - 0.2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(startScr.x, startScr.y);
        ctx.lineTo(curScr.x, curScr.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // C) DIBUJAR VÉRTICES (Puntos y sus etiquetas anti-colisión)
    // 1. Vértices de F' (Transformada)
    transformedVertices.forEach((pt, i) => {
      const pScr = toScreen(pt, width, height);
      ctx.beginPath();
      ctx.arc(pScr.x, pScr.y, pRad - 0.5, 0, Math.PI * 2);
      ctx.fillStyle = transStroke;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = baseLW - 0.2;
      ctx.stroke();

      if (showLabels) {
        const cleanName = (pt.label || String.fromCharCode(65 + i)).replace(/'/g, '');
        const labelText = `${cleanName}' (${formatNum(pt.x)}, ${formatNum(pt.y)})`;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        let align: CanvasTextAlign = 'left';
        let lx = pScr.x + 8;
        if (lx + textWidth > width - 10) {
          align = 'right';
          lx = pScr.x - 8;
        }
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(labelText, lx, pScr.y - 8);
        ctx.fillStyle = isDarkMode ? '#e9d5ff' : '#581c87';
        ctx.fillText(labelText, lx, pScr.y - 8);
      }
    });

    // 2. Vértices de F (Original)
    vertices.forEach((pt, i) => {
      const pScr = toScreen(pt, width, height);
      const isHovered = hoveredVertexIndex === i;
      const isSegmentSelected = tool === 'segment' && segmentStartVertex === i;

      // Resaltado visual si está seleccionado como inicio de segmento
      if (isSegmentSelected) {
        ctx.beginPath();
        ctx.arc(pScr.x, pScr.y, pRad * 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(pScr.x, pScr.y, isHovered || isSegmentSelected ? pRad + 1.5 : pRad, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#10b981' : isSegmentSelected ? '#2563eb' : (pt.color || preStroke);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showLabels) {
        const cleanName = (pt.label || String.fromCharCode(65 + i)).replace(/'/g, '');
        const labelText = `${cleanName} (${formatNum(pt.x)}, ${formatNum(pt.y)})`;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        let align: CanvasTextAlign = 'left';
        let lx = pScr.x + 8;
        if (lx + textWidth > width - 10) {
          align = 'right';
          lx = pScr.x - 8;
        }
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(labelText, lx, pScr.y - 8);
        ctx.fillStyle = isDarkMode ? '#bae6fd' : '#0c4a6e';
        ctx.fillText(labelText, lx, pScr.y - 8);
      }
    });
  }, [
    isActive,
    vertices,
    segments,
    isPolygon,
    segmentStartVertex,
    mouseCoord,
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
    isHoveringPivot,
    isDarkMode
  ]);

  // MANEJO DE EVENTOS DEL RATÓN EN EL LIENZO
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Herramienta Punto: colocar vértice libre independiente en el plano
    if (tool === 'point') {
      commitAction();
      const cart = toCartesian(clientX, clientY, rect.width, rect.height);
      const nextLabel = String.fromCharCode(65 + vertices.length);
      setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel, color: defaultColor }]);
      // No conecta segmentos, no cierra polígono. Puntos 100% libres.
      return;
    }

    // Herramienta Segmento: conectar dos puntos o crear puntos y unirlos
    if (tool === 'segment') {
      const cart = toCartesian(clientX, clientY, rect.width, rect.height);

      // Buscar si hizo clic cerca de un vértice existente
      let targetIndex: number | null = null;
      for (let i = 0; i < vertices.length; i++) {
        const vScr = toScreen(vertices[i], rect.width, rect.height);
        if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 15) {
          targetIndex = i;
          break;
        }
      }

      // Si no hay vértice donde hizo clic, creamos uno nuevo en esa posición
      if (targetIndex === null) {
        commitAction();
        targetIndex = vertices.length;
        const nextLabel = String.fromCharCode(65 + vertices.length);
        setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel, color: defaultColor }]);
      }

      if (segmentStartVertex === null) {
        // Primer clic: seleccionar vértice de inicio
        setSegmentStartVertex(targetIndex);
      } else {
        // Segundo clic: unir vértice de inicio con este vértice destino
        if (targetIndex !== segmentStartVertex) {
          const from = segmentStartVertex;
          const to = targetIndex;
          const alreadyExists = segments.some(
            ([a, b]) => (a === from && b === to) || (a === to && b === from)
          );
          if (!alreadyExists) {
            setSegments((prev) => [...prev, [from, to]]);
          }
        }
        setSegmentStartVertex(null);
      }
      return;
    }

    // Herramienta Polígono: crear figura cerrada
    if (tool === 'polygon') {
      const cart = toCartesian(clientX, clientY, rect.width, rect.height);

      // Si hace clic cerca del primer vértice para cerrar:
      if (vertices.length >= 3) {
        const firstScr = toScreen(vertices[0], rect.width, rect.height);
        if (Math.hypot(clientX - firstScr.x, clientY - firstScr.y) <= 16) {
          setIsPolygon(true);
          // Asegurar segmentos de cierre
          const segs: [number, number][] = [];
          for (let i = 0; i < vertices.length; i++) {
            segs.push([i, (i + 1) % vertices.length]);
          }
          setSegments(segs);
          setTool('select');
          return;
        }
      }

      commitAction();
      const nextLabel = String.fromCharCode(65 + vertices.length);
      const newIdx = vertices.length;
      setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel, color: defaultColor }]);
      if (newIdx > 0) {
        setSegments((prev) => [...prev, [newIdx - 1, newIdx]]);
      }
      return;
    }

    // Modo Colocar Pivote
    if (tool === 'pivot') {
      commitAction();
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
        commitAction();
        isDraggingPivotRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Modo Mover (Select): Verificar si arrastra un vértice original
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        commitAction();
        draggingVertexIndexRef.current = i;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Modo Mover (Select): Verificar si arrastra el eje de reflexión
    if (tool === 'select' && config.type === 'reflection' && (config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y')) {
      const cartRaw = toCartesian(clientX, clientY, rect.width, rect.height, false);
      let isNearLine = false;
      if (config.reflectionAxis === 'custom_x') {
         isNearLine = Math.abs(cartRaw.x - config.customAxisValue) * (scale / 20) < 1; // roughly 20px threshold
      } else {
         isNearLine = Math.abs(cartRaw.y - config.customAxisValue) * (scale / 20) < 1;
      }
      if (isNearLine) {
        commitAction();
        isDraggingReflectionLineRef.current = true;
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

    if (isDraggingReflectionLineRef.current && config.type === 'reflection') {
      if (config.reflectionAxis === 'custom_x') {
        setConfig((prev) => ({ ...prev, customAxisValue: Math.round(cart.x) }));
      } else if (config.reflectionAxis === 'custom_y') {
        setConfig((prev) => ({ ...prev, customAxisValue: Math.round(cart.y) }));
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

    // Hover sobre pivote o vértices o línea de reflexión
    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      setIsHoveringPivot(Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15);
    } else {
      setIsHoveringPivot(false);
    }

    let foundLineHover = false;
    if (tool === 'select' && config.type === 'reflection' && (config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y')) {
      const cartRaw = toCartesian(clientX, clientY, rect.width, rect.height, false);
      if (config.reflectionAxis === 'custom_x') {
         foundLineHover = Math.abs(cartRaw.x - config.customAxisValue) * (scale / 20) < 1;
      } else {
         foundLineHover = Math.abs(cartRaw.y - config.customAxisValue) * (scale / 20) < 1;
      }
    }
    setIsHoveringReflectionLine(foundLineHover);

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

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15) {
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetType: 'pivot' });
        return;
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetType: 'vertex', targetIndex: i });
        return;
      }
    }

    setContextMenu(null);
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
    draggingVertexIndexRef.current = null;
    isDraggingPivotRef.current = false;
    isDraggingReflectionLineRef.current = false;
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
    ctx.fillText('GeoTransform Pro • Laboratorio de Geometría Dinámica', 20, 30);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `geotransform_${config.type}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Exportar PDF
  const handleExportPDF = () => {
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
    ctx.fillText('GeoTransform Pro • Laboratorio de Geometría Dinámica', 20, 30);

    const dataUrl = exportCanvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`geotransform_${config.type}_${Date.now()}.pdf`);
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col w-full h-full overflow-hidden bg-surface text-ink font-sans select-none"
      style={{ display: isActive ? 'flex' : 'none' }}
    >
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
        canUndo={undoStack.length > 0 || segmentStartVertex !== null}
        onRedo={handleRedo}
        canRedo={redoStack.length > 0}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        sidebarTab={sidebarTab}
        onSelectSidebarTab={setSidebarTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
      />

      {/* 2. SUB-BARRA DE INSTRUCCIONES CONTEXTUALES GEOGEBRA */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-panel/80 border-b border-border text-xs">
        <div className="flex items-center gap-2 text-ink-soft">
          <Info className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="font-medium">
            {tool === 'select' && 'Mover: Arrastra vértices, el centro o arrastra el fondo para desplazar el plano.'}
            {tool === 'point' && 'Punto: Haz clic en el plano cartesiano para marcar puntos libres sin unirlos.'}
            {tool === 'segment' &&
              (segmentStartVertex === null
                ? 'Segmento: Haz clic en el primer punto para iniciar la línea recta.'
                : `Segmento: Haz clic en el segundo punto para unirlo con ${vertices[segmentStartVertex]?.label || 'el punto inicial'} (no cerrará a triángulo).`)}
            {tool === 'polygon' && 'Polígono: Haz clic en cada vértice y vuelve a hacer clic en el primer punto para cerrar la figura.'}
            {tool === 'pivot' && 'Pivote: Haz clic en el plano para fijar el nuevo centro de giro u homotecia.'}
          </span>
        </div>

        {/* Indicador de estado de la figura en la pizarra */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-ink-soft hidden sm:inline">
            {vertices.length} {vertices.length === 1 ? 'punto' : 'puntos'}
          </span>
          {isPolygon ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Polígono Cerrado
            </span>
          ) : segments.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {segments.length} {segments.length === 1 ? 'segmento' : 'segmentos abiertos'}
            </span>
          ) : vertices.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-ink-soft">
              Puntos libres
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. ÁREA DE TRABAJO PRINCIPAL: LIENZO Y PANEL LATERAL */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        {/* LIENZO DE GEOMETRÍA */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={handleContextMenu}
            onMouseLeave={() => {
              isDraggingCanvasRef.current = false;
              draggingVertexIndexRef.current = null;
              isDraggingPivotRef.current = false;
              setMouseCoord(null);
            }}
            className={`h-full w-full block ${
              tool === 'point' || tool === 'polygon' || tool === 'pivot'
                ? 'cursor-crosshair'
                : isHoveringPivot || isDraggingPivotRef.current || isHoveringReflectionLine || isDraggingReflectionLineRef.current
                ? 'cursor-move'
                : hoveredVertexIndex !== null
                ? 'cursor-grab'
                : 'cursor-default'
            }`}
          />

          {/* MENÚ CONTEXTUAL FLOTANTE (CLIC DERECHO) */}
          {contextMenu && contextMenu.visible && (
            <div 
              className="absolute z-50 bg-panel border border-border shadow-xl rounded-xl p-1.5 text-xs font-semibold w-48 animate-in fade-in zoom-in-95 duration-100 origin-top-left"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {contextMenu.targetType === 'vertex' && (
                <>
                  <div className="px-2 py-1.5 text-ink-faint text-[10px] uppercase tracking-wider mb-1">Punto Original</div>
                  <button
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition flex items-center gap-2"
                    onClick={() => {
                      commitAction();
                      const idx = contextMenu.targetIndex!;
                      setVertices((prev) => prev.filter((_, i) => i !== idx));
                      setSegments((prev) =>
                        prev
                          .filter(([a, b]) => a !== idx && b !== idx)
                          .map(([a, b]) => [a > idx ? a - 1 : a, b > idx ? b - 1 : b] as [number, number])
                      );
                      setContextMenu(null);
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar vértice
                  </button>
                  <div className="h-px bg-border my-1" />
                  <div className="px-2 py-1 flex items-center justify-between gap-1 flex-wrap">
                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'].map(c => (
                      <button
                        key={c}
                        className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                        onClick={() => {
                          commitAction();
                          setVertices(prev => prev.map((v, i) => i === contextMenu.targetIndex ? { ...v, color: c } : v));
                          setContextMenu(null);
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              {contextMenu.targetType === 'pivot' && (
                <>
                  <div className="px-2 py-1.5 text-ink-faint text-[10px] uppercase tracking-wider mb-1">Centro Pivote</div>
                  <button
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-panel-hover text-ink transition flex items-center gap-2"
                    onClick={() => {
                      commitAction();
                      setConfig(prev => ({
                        ...prev,
                        center: { x: 0, y: 0 },
                        homothetyCenter: { x: 0, y: 0 },
                        centralCenter: { x: 0, y: 0 }
                      }));
                      setContextMenu(null);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" /> Mover al origen (0,0)
                  </button>
                </>
              )}
            </div>
          )}

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
              onClick={() => { setPan({ x: 0, y: 0 }); setScale(38); }}
              title="Restablecer vista: centra el origen y restablece el zoom"
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
          </div>
        </div>

        {/* BOTÓN FLOTANTE PARA REABRIR PANEL CUANDO ESTÁ OCULTO */}
        {/* BOTÓN FLOTANTE PARA REABRIR PANEL CUANDO ESTÁ OCULTO */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            title="Mostrar panel lateral"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface/90 border border-border shadow-xl backdrop-blur-md text-xs font-bold text-ink hover:text-accent hover:border-accent transition group animate-in fade-in"
          >
            <PanelRightOpen className="h-4 w-4 text-accent group-hover:scale-110 transition" />
            <span>
              Abrir Panel ({sidebarTab === 'algebra' ? 'Álgebra' : sidebarTab === 'notebook' ? 'Cuaderno' : 'Problemas'})
            </span>
          </button>
        )}

        {/* PANEL LATERAL RESPONSIVO (VISTA ÁLGEBRA / CUADERNO / PROBLEMAS) */}
        {isSidebarOpen && (
          <aside className="w-[380px] min-h-0 flex flex-col bg-surface border-l border-border shadow-2xl z-30 animate-in slide-in-from-right duration-150">
            {/* Cabecera del panel con botón para ocultar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border bg-panel/70">
              <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                {sidebarTab === 'algebra' && 'Vista Álgebra'}
                {sidebarTab === 'notebook' && 'Cuaderno Analítico'}
                {sidebarTab === 'problem' && 'Problemas Inversos'}
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Ocultar barra lateral"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <span>Ocultar</span>
                <PanelRightClose className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {sidebarTab === 'algebra' && (
                <AlgebraView
                  vertices={vertices}
                  onUpdateVertices={setVertices}
                  segments={segments}
                  onUpdateSegments={setSegments}
                  isPolygon={isPolygon}
                  onTogglePolygon={handleTogglePolygon}
                  onAutoConnectSegments={handleAutoConnectSegments}
                  onClearSegments={handleClearSegments}
                  transformedVertices={transformedVertices}
                  config={config}
                  onUpdateConfig={setConfig}
                  onSetTool={setTool}
                  onOpenCoordsModal={() => setIsCoordsModalOpen(true)}
                  toggles={toggles}
                  onUpdateToggles={setToggles}
                  showLabels={showLabels}
                  onToggleLabels={() => setSettings(prev => ({ ...prev, showLabels: !prev }))}
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
            </div>
          </aside>
        )}
      </div>

      {/* MODAL DE MODELOS CURRICULARES */}
      {isPresetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-4xl rounded-3xl bg-surface p-6 shadow-2xl border border-border flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <Shapes className="h-5 w-5 text-accent" /> Galería de Modelos
                </h3>
                <p className="text-sm text-ink-soft mt-1">
                  Selecciona una figura base para experimentar con las transformaciones geométricas.
                </p>
              </div>
              <button
                onClick={() => setIsPresetsOpen(false)}
                className="p-2 rounded-xl hover:bg-black/5 self-start"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* TABS DE CATEGORÍAS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-border no-scrollbar shrink-0">
              {Array.from(new Set(SHAPE_PRESETS.map(p => p.category))).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedPresetCategory(cat)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    selectedPresetCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-panel text-ink-soft hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="overflow-y-auto pr-2 flex flex-col gap-6 pb-2">
              {Object.entries(
                SHAPE_PRESETS.reduce((acc, preset) => {
                  if (preset.category !== selectedPresetCategory) return acc;
                  if (!acc[preset.category]) acc[preset.category] = [];
                  acc[preset.category].push(preset);
                  return acc;
                }, {} as Record<string, typeof SHAPE_PRESETS>)
              ).map(([category, presets]) => (
                <div key={category}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {presets.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleLoadPreset(preset);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="flex flex-col items-stretch rounded-2xl border border-border bg-panel hover:border-accent hover:shadow-md transition-all text-left group overflow-hidden cursor-pointer"
                      >
                        {/* Vista Previa Gráfica */}
                        <div className="h-32 w-full bg-slate-50 dark:bg-black/20 flex items-center justify-center p-4 border-b border-border group-hover:bg-accent/5 transition-colors">
                          <PolygonPreview 
                            vertices={preset.vertices} 
                            className="w-full h-full max-w-[120px]" 
                            strokeColor="var(--color-accent, #3b82f6)"
                            fillColor="var(--color-accent, #3b82f6)"
                          />
                        </div>
                        
                        {/* Información */}
                        <div className="p-4 space-y-1.5 flex-1 flex flex-col">
                          <div className="flex items-start justify-between w-full">
                            <span className="text-sm font-bold text-ink group-hover:text-accent transition-colors leading-tight">
                              {preset.name}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-accent transition-opacity shrink-0" />
                          </div>
                          
                          {preset.recommendedFor && (
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-1 rounded w-full sm:w-fit break-words">
                              Sugerido para {preset.recommendedFor}
                            </span>
                          )}
                          
                          {preset.description && (
                            <p className="text-xs text-ink-soft leading-relaxed mt-1 flex-1">
                              {preset.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
