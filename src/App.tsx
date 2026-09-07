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
  ChevronRight
} from 'lucide-react';
import {
  Point,
  TransformationConfig,
  GridStyle,
  ToolMode,
  ReflectionAxis
} from './types/geometry';
import {
  transformPoint,
  transformVertices,
  interpolateVertices,
  SHAPE_PRESETS,
  getTransformationTheory
} from './utils/transformations';

export default function App() {
  // Estado de los vértices de la figura original
  const [vertices, setVertices] = useState<Point[]>([
    { x: 1, y: 1, label: 'A' },
    { x: 7, y: 2, label: 'B' },
    { x: 4, y: 8, label: 'C' }
  ]);

  // Estado de la configuración de la transformación
  const [config, setConfig] = useState<TransformationConfig>({
    type: 'translation',
    dx: 4,
    dy: 2,
    reflectionAxis: 'y',
    customAxisValue: 0,
    angleDeg: 90,
    center: { x: 0, y: 0 },
    scaleFactor: 1.5,
    homothetyCenter: { x: 0, y: 0 }
  });

  // Estado de animación y reproducción fluida
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(1); // 0 a 1
  const animFrameRef = useRef<number | null>(null);
  const animStartTimeRef = useRef<number | null>(null);

  // Estado del visor y cuadrícula del plano cartesiano
  const [gridStyle, setGridStyle] = useState<GridStyle>('lines');
  const [scale, setScale] = useState<number>(36); // px por unidad
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [tool, setTool] = useState<ToolMode>('select');

  // Modales y paneles UI
  const [isCoordsModalOpen, setIsCoordsModalOpen] = useState(false);
  const [isCheckerOpen, setIsCheckerOpen] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [coordsInputText, setCoordsInputText] = useState('1, 1\n7, 2\n4, 8');

  // Coordenadas bajo el cursor y estado de arrastre
  const [mouseCoord, setMouseCoord] = useState<{ x: number; y: number } | null>(null);
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);
  const [isHoveringPivot, setIsHoveringPivot] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingCanvasRef = useRef(false);
  const draggingVertexIndexRef = useRef<number | null>(null);
  const isDraggingPivotRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Vértices transformados teóricos finales (t = 1)
  const transformedVertices = useMemo(() => {
    return transformVertices(vertices, config);
  }, [vertices, config]);

  // Vértices interpolados según el progreso de animación t (0 a 1)
  const currentVertices = useMemo(() => {
    if (animProgress >= 0.999) return transformedVertices;
    if (animProgress <= 0.001) return vertices;
    return interpolateVertices(vertices, config, animProgress);
  }, [vertices, config, animProgress, transformedVertices]);

  // Información teórica calculada
  const theory = useMemo(() => getTransformationTheory(config), [config]);

  // Manejo de la animación por requestAnimationFrame
  useEffect(() => {
    if (!isAnimating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const DURATION = 2200; // Duración de ciclo en ms
    const step = (timestamp: number) => {
      if (!animStartTimeRef.current) animStartTimeRef.current = timestamp;
      const elapsed = timestamp - animStartTimeRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      setAnimProgress(progress);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        // Pausa breve al finalizar y reiniciar para ciclo didáctico
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

  const handleResetAnimation = () => {
    setIsAnimating(false);
    setAnimProgress(0);
  };

  // Centrar en el origen O(0,0)
  const handleCenterOrigin = useCallback(() => {
    setPan({ x: 0, y: 0 });
  }, []);

  // Alternar estilo de cuadrícula
  const handleCycleGrid = useCallback(() => {
    setGridStyle((prev) => {
      if (prev === 'lines') return 'dots';
      if (prev === 'dots') return 'axes';
      return 'lines';
    });
  }, []);

  // Zoom
  const handleZoom = (factor: number) => {
    setScale((prev) => Math.min(Math.max(prev * factor, 12), 140));
  };

  // Convertir coordenadas cartesianas a coordenadas de pantalla (canvas px)
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

  // Obtener el centro actual de la transformación activa
  const activePivot = useMemo(() => {
    if (config.type === 'rotation') return config.center;
    if (config.type === 'homothety') return config.homothetyCenter;
    return null;
  }, [config.type, config.center, config.homothetyCenter]);

  // DIBUJAR EN EL CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Soporte para pantallas Retina / High DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Fondo del plano escolar
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

    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Marcas numéricas en Eje X
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

    // Marcas numéricas en Eje Y
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

    // Origen O(0,0)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('O', originX - 8, originY + 8);

    // 3. ELEMENTOS GUÍA Y EJES DE TRANSFORMACIÓN
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
      }
      ctx.stroke();

      // Etiqueta del eje de reflexión
      ctx.fillStyle = '#e11d48';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      let labelText = 'Eje de simetría';
      if (config.reflectionAxis === 'x') labelText = 'Eje de simetría: y = 0';
      else if (config.reflectionAxis === 'y') labelText = 'Eje de simetría: x = 0';
      else if (config.reflectionAxis === 'y=x') labelText = 'Eje de simetría: y = x';
      else if (config.reflectionAxis === 'y=-x') labelText = 'Eje de simetría: y = -x';
      else if (config.reflectionAxis === 'custom_x')
        labelText = `Eje de simetría: x = ${config.customAxisValue}`;
      else if (config.reflectionAxis === 'custom_y')
        labelText = `Eje de simetría: y = ${config.customAxisValue}`;
      ctx.fillText(labelText, 16, height - 20);
      ctx.restore();
    } else if (config.type === 'rotation' || config.type === 'homothety') {
      // Dibujar Centro Pivote
      const pivot = activePivot || { x: 0, y: 0 };
      const cScr = toScreen(pivot, width, height);
      const isRot = config.type === 'rotation';
      const color = isRot ? '#f59e0b' : '#8b5cf6';

      ctx.save();
      // Ondas concéntricas de pivote
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cScr.x, cScr.y, isHoveringPivot ? 16 : 12, 0, Math.PI * 2);
      ctx.stroke();

      // Punto central
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cScr.x, cScr.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Cruz de mira
      ctx.beginPath();
      ctx.moveTo(cScr.x - 9, cScr.y);
      ctx.lineTo(cScr.x + 9, cScr.y);
      ctx.moveTo(cScr.x, cScr.y - 9);
      ctx.lineTo(cScr.x, cScr.y + 9);
      ctx.stroke();

      // Etiqueta del pivote
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`C(${pivot.x}, ${pivot.y})`, cScr.x + 10, cScr.y - 10);
      ctx.restore();
    }

    // 4. RAYOS Y GUÍAS DIDÁCTICAS ENTRE FIGURAS
    if (showVectors && vertices.length > 0) {
      ctx.save();
      if (config.type === 'translation') {
        // Vectores de traslación con puntas de flecha
        ctx.strokeStyle = '#6366f1';
        ctx.fillStyle = '#6366f1';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        vertices.forEach((v, idx) => {
          const vPrime = transformedVertices[idx];
          if (!vPrime) return;
          const s1 = toScreen(v, width, height);
          const s2 = toScreen(vPrime, width, height);

          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();

          // Flecha en s2
          const angle = Math.atan2(s2.y - s1.y, s2.x - s1.x);
          const arrowLen = 7;
          ctx.beginPath();
          ctx.moveTo(s2.x, s2.y);
          ctx.lineTo(
            s2.x - arrowLen * Math.cos(angle - Math.PI / 6),
            s2.y - arrowLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            s2.x - arrowLen * Math.cos(angle + Math.PI / 6),
            s2.y - arrowLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        });
      } else if (config.type === 'rotation' && activePivot) {
        // Arcos de giro y rayos hacia el centro
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 4]);
        const cScr = toScreen(activePivot, width, height);

        vertices.forEach((v, idx) => {
          const vPrime = transformedVertices[idx];
          if (!vPrime) return;
          const s1 = toScreen(v, width, height);
          const s2 = toScreen(vPrime, width, height);

          // Radio desde centro a V
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(s1.x, s1.y);
          ctx.stroke();

          // Radio desde centro a V'
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();

          // Arco circular trazado
          const radius = Math.hypot(s1.x - cScr.x, s1.y - cScr.y);
          const startAngle = Math.atan2(s1.y - cScr.y, s1.x - cScr.x);
          const endAngle = Math.atan2(s2.y - cScr.y, s2.x - cScr.x);
          ctx.beginPath();
          ctx.arc(cScr.x, cScr.y, radius, startAngle, endAngle, config.angleDeg < 0);
          ctx.stroke();
        });
      } else if (config.type === 'homothety' && activePivot) {
        // Rayos de proyección desde el centro de homotecia pasando por los vértices
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        const cScr = toScreen(activePivot, width, height);

        vertices.forEach((v, idx) => {
          const vPrime = transformedVertices[idx];
          if (!vPrime) return;
          const s1 = toScreen(v, width, height);
          const s2 = toScreen(vPrime, width, height);

          // Línea extendida que une centro C, V y V'
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        });
      } else if (config.type === 'reflection') {
        // Segmentos perpendiculares entre cada punto y su imagen reflejada
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);

        vertices.forEach((v, idx) => {
          const vPrime = transformedVertices[idx];
          if (!vPrime) return;
          const s1 = toScreen(v, width, height);
          const s2 = toScreen(vPrime, width, height);

          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    // FUNCIÓN AUXILIAR PARA DIBUJAR POLÍGONO
    const drawPolygon = (
      pts: Point[],
      strokeColor: string,
      fillColor: string,
      isTransformed = false,
      isGhost = false,
      isAnimatedCurrent = false
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
      ctx.lineWidth = isAnimatedCurrent ? 3 : 2;
      if (isGhost) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Dibujar vértices y etiquetas
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

    // 5. FIGURA IMAGEN FINAL (F') - Destino
    if (transformedVertices.length >= 2) {
      // Si estamos a mitad de animación, mostrar F' como silueta guía sutil
      const isMidAnim = animProgress > 0.001 && animProgress < 0.999;
      drawPolygon(
        transformedVertices,
        isMidAnim ? 'rgba(79, 70, 229, 0.45)' : '#4f46e5',
        isMidAnim ? 'rgba(79, 70, 229, 0.06)' : 'rgba(79, 70, 229, 0.18)',
        true,
        isMidAnim
      );
    }

    // 6. FIGURA INTERMEDIA ANIMADA (F_t)
    if (animProgress > 0.001 && animProgress < 0.999 && currentVertices.length >= 2) {
      drawPolygon(
        currentVertices,
        '#7c3aed',
        'rgba(124, 58, 237, 0.28)',
        false,
        false,
        true
      );
    }

    // 7. FIGURA ORIGINAL (F)
    if (vertices.length >= 2) {
      const isMidAnim = animProgress > 0.001;
      drawPolygon(
        vertices,
        isMidAnim ? 'rgba(5, 150, 105, 0.5)' : '#059669',
        isMidAnim ? 'rgba(5, 150, 105, 0.08)' : 'rgba(5, 150, 105, 0.22)',
        false,
        isMidAnim
      );
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
    currentVertices,
    animProgress,
    gridStyle,
    scale,
    pan,
    showVectors,
    showLabels,
    config,
    toScreen,
    activePivot,
    hoveredVertexIndex,
    isHoveringPivot
  ]);

  // MANEJO DE RATÓN / INTERACTIVIDAD
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
      }
      setTool('select');
      return;
    }

    // Modo Lápiz / Dibujar Vértice
    if (tool === 'draw') {
      const pt = toCartesian(clientX, clientY, rect.width, rect.height);
      const nextLabel = String.fromCharCode(65 + vertices.length);
      setVertices((prev) => [...prev, { x: pt.x, y: pt.y, label: nextLabel }]);
      return;
    }

    // Modo Selección: Verificar si hace clic sobre el pivote
    if (activePivot) {
      const pScr = toScreen(activePivot, rect.width, rect.height);
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 15) {
        isDraggingPivotRef.current = true;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Modo Selección: Verificar si hace clic sobre algún vértice de la figura original
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 14) {
        draggingVertexIndexRef.current = i;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
    }

    // Si no hizo clic en ningún elemento interactivo, inicia arrastre de todo el plano (Pan)
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

    // Arrastrando el punto pivote
    if (isDraggingPivotRef.current && activePivot) {
      if (config.type === 'rotation') {
        setConfig((prev) => ({ ...prev, center: cart }));
      } else if (config.type === 'homothety') {
        setConfig((prev) => ({ ...prev, homothetyCenter: cart }));
      }
      return;
    }

    // Arrastrando un vértice de la figura
    if (draggingVertexIndexRef.current !== null) {
      const idx = draggingVertexIndexRef.current;
      setVertices((prev) =>
        prev.map((v, i) => (i === idx ? { ...v, x: cart.x, y: cart.y } : v))
      );
      return;
    }

    // Arrastrando el lienzo (Pan)
    if (isDraggingCanvasRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      });
      return;
    }

    // Detección de Hover sobre elementos interactivos
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

  // Cargar figura prediseñada
  const handleSelectPreset = (preset: (typeof SHAPE_PRESETS)[0]) => {
    setVertices(preset.vertices);
    setIsPresetsOpen(false);
    setAnimProgress(1);
    setIsAnimating(false);
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
        setAnimProgress(1);
      } else {
        alert('Ingresa al menos 2 pares ordenados (x, y)');
      }
    } catch {
      alert('Formato de coordenadas inválido');
    }
  };

  // Descarga de Imagen PNG en Alta Resolución para tareas y reportes
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crear un canvas de exportación con ficha técnica y estética limpia
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Copiar el contenido dibujado del canvas principal
    ctx.drawImage(canvas, 0, 0);

    // Agregar franja de encabezado elegante
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, exportCanvas.width, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Transformaciones Geométricas Pro • Plano Didáctico', 20, 30);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Transformación: ${config.type.toUpperCase()}`, exportCanvas.width - 20, 30);

    // Generar enlace y descargar
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `geometria_${config.type}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Determinar el cursor dinámico según la herramienta y estado
  const cursorClass = useMemo(() => {
    if (tool === 'draw') return 'cursor-crosshair';
    if (tool === 'pivot') return 'cursor-crosshair';
    if (isHoveringPivot || isDraggingPivotRef.current) return 'cursor-move';
    if (hoveredVertexIndex !== null || draggingVertexIndexRef.current !== null)
      return 'cursor-grab active:cursor-grabbing';
    return isDraggingCanvasRef.current ? 'cursor-grabbing' : 'cursor-grab';
  }, [tool, isHoveringPivot, hoveredVertexIndex]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper text-ink font-sans">
      {/* 1. LIENZO PRINCIPAL DEL PLANO CARTESIANO */}
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
            setHoveredVertexIndex(null);
            setIsHoveringPivot(false);
          }}
          className={`h-full w-full block ${cursorClass}`}
        />

        {/* HUD DE COORDENADAS FLOTANTE */}
        {mouseCoord && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-surface/90 px-3.5 py-1.5 shadow-md backdrop-blur border border-border">
            <Target className="h-4 w-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-ink">
              Pos: ({mouseCoord.x}, {mouseCoord.y})
            </span>
          </div>
        )}

        {/* BARRA SUPERIOR DINÁMICA: MODO DIBUJO O COLOCAR PIVOTE */}
        {tool === 'draw' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-2 shadow-lg backdrop-blur border border-accent">
            <span className="text-xs font-semibold text-accent flex items-center gap-1.5">
              <Edit3 className="h-4 w-4" /> Vértices colocados: {vertices.length}
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
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar Trazado
            </button>
          </div>
        )}

        {tool === 'pivot' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-2 shadow-lg backdrop-blur border border-amber-500">
            <Target className="h-4 w-4 text-amber-500 animate-pulse" />
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

        {/* BARRA DE CONTROL DE ANIMACIÓN INTERACTIVA (PARTE INFERIOR IZQUIERDA) */}
        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 rounded-2xl bg-surface/95 p-2 px-3 shadow-xl backdrop-blur border border-border">
          <button
            onClick={toggleAnimation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
              isAnimating
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-accent text-white hover:brightness-110'
            }`}
          >
            {isAnimating ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> Animar
              </>
            )}
          </button>

          <button
            onClick={handleResetAnimation}
            title="Reiniciar a figura original"
            className="p-1.5 rounded-xl hover:bg-black/5 text-ink-soft transition"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Scrubber / Control de progreso continuo */}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={animProgress}
              onChange={(e) => {
                setIsAnimating(false);
                setAnimProgress(parseFloat(e.target.value));
              }}
              className="w-24 sm:w-36 accent-accent cursor-pointer"
            />
            <span className="font-mono text-xs font-semibold text-ink w-9 text-right">
              {Math.round(animProgress * 100)}%
            </span>
          </div>
        </div>

        {/* BARRA DE ZOOM Y CONTROLES DEL PLANO (INFERIOR DERECHA) */}
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 rounded-2xl bg-surface/90 p-1.5 shadow-lg backdrop-blur border border-border">
          <button
            onClick={() => setShowVectors(!showVectors)}
            title={showVectors ? 'Ocultar guías/vectores' : 'Mostrar guías/vectores'}
            className={`p-2 rounded-xl transition ${
              showVectors ? 'text-accent bg-accent/10' : 'text-ink-soft hover:bg-black/5'
            }`}
          >
            <Sliders className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Ocultar etiquetas de vértices' : 'Mostrar etiquetas'}
            className={`p-2 rounded-xl transition ${
              showLabels ? 'text-accent bg-accent/10' : 'text-ink-soft hover:bg-black/5'
            }`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            onClick={() => handleZoom(1.2)}
            title="Aumentar zoom"
            className="p-2 rounded-xl text-ink hover:bg-black/5 active:scale-95 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleZoom(0.833)}
            title="Disminuir zoom"
            className="p-2 rounded-xl text-ink hover:bg-black/5 active:scale-95 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleCenterOrigin}
            title="Centrar en el origen O(0,0)"
            className="p-2 rounded-xl text-ink hover:bg-black/5 active:scale-95 transition"
          >
            <Target className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            onClick={handleCycleGrid}
            title={`Cuadrícula: ${gridStyle}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold text-ink hover:bg-black/5 transition"
          >
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span className="capitalize">{gridStyle}</span>
          </button>
          <div className="h-4 w-px bg-border mx-0.5" />
          <button
            onClick={handleExportPNG}
            title="Descargar imagen PNG de alta calidad"
            className="p-2 rounded-xl text-ink hover:bg-accent/10 hover:text-accent transition"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* BOTÓN MÓVIL PARA ABRIR EL PANEL LATERAL */}
        <button
          onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          className="md:hidden absolute top-4 right-4 z-20 flex items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-white font-semibold text-xs shadow-xl"
        >
          <Menu className="h-4 w-4" /> Panel
        </button>
      </div>

      {/* 2. PANEL LATERAL DERECHO DE CONTROL Y CONFIGURACIÓN */}
      <aside
        className={`fixed md:relative top-0 right-0 z-40 h-full w-[350px] shrink-0 flex-col bg-surface border-l border-border shadow-2xl md:shadow-none transition-transform duration-200 ${
          isMobilePanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } flex`}
      >
        {/* ENCABEZADO */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-panel">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" /> Transformaciones Pro
            </h1>
            <p className="text-[11px] text-ink-soft">Laboratorio de Geometría Dinámica</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTheoryOpen(true)}
              title="Ver fórmulas matemáticas y teoría"
              className="p-2 rounded-xl text-ink-soft hover:text-accent hover:bg-accent/10 transition"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMobilePanelOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-black/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CONTENIDO SCROLLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* HERRAMIENTAS Y FIGURAS */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-ink-faint flex justify-between items-center">
              <span>Figura Original (F)</span>
              <span className="text-emerald-600 font-mono font-bold">
                {vertices.length} Vértices
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTool(tool === 'draw' ? 'select' : 'draw')}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold border transition ${
                  tool === 'draw'
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : 'bg-panel text-ink border-border hover:border-border-strong'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                <span>{tool === 'draw' ? 'Trazando...' : 'Lápiz'}</span>
              </button>
              <button
                onClick={() => setIsPresetsOpen(true)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold bg-panel text-ink border border-border hover:border-border-strong transition"
              >
                <Shapes className="h-4 w-4 text-accent" />
                <span>Modelos</span>
              </button>
              <button
                onClick={() => setIsCoordsModalOpen(true)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs font-semibold bg-panel text-ink border border-border hover:border-border-strong transition"
              >
                <Hash className="h-4 w-4 text-accent" />
                <span>Coords</span>
              </button>
            </div>
          </div>

          {/* SELECTOR DE TRANSFORMACIÓN */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Transformación Geométrica
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'translation', label: 'Traslación', icon: Move },
                  { id: 'reflection', label: 'Reflexión', icon: FlipHorizontal },
                  { id: 'rotation', label: 'Rotación', icon: RotateCw },
                  { id: 'homothety', label: 'Homotecia', icon: Maximize2 }
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setConfig((prev) => ({ ...prev, type: id }));
                    setAnimProgress(1);
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

          {/* PARÁMETROS ESPECÍFICOS SEGÚN LA TRANSFORMACIÓN ACTIVA */}
          <div className="p-4 rounded-2xl bg-panel border border-border space-y-3.5">
            {config.type === 'translation' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-ink">Vector de Traslación:</span>
                  <span className="font-mono text-accent font-bold">
                    T({config.dx}, {config.dy})
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-soft">Desplazamiento horizontal (ΔX):</span>
                      <span className="font-mono font-bold">{config.dx}</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      value={config.dx}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, dx: parseInt(e.target.value) }))
                      }
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-soft">Desplazamiento vertical (ΔY):</span>
                      <span className="font-mono font-bold">{config.dy}</span>
                    </div>
                    <input
                      type="range"
                      min="-15"
                      max="15"
                      value={config.dy}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, dy: parseInt(e.target.value) }))
                      }
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}

            {config.type === 'reflection' && (
              <>
                <div className="text-xs font-semibold text-ink">Eje de Reflexión Axial:</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'x', label: 'Eje X (y = 0)' },
                      { id: 'y', label: 'Eje Y (x = 0)' },
                      { id: 'y=x', label: 'Diagonal (y = x)' },
                      { id: 'y=-x', label: 'Diagonal (y = -x)' },
                      { id: 'custom_x', label: 'Vertical x = k' },
                      { id: 'custom_y', label: 'Horizontal y = k' }
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
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Valor de la recta k:</span>
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
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>
                )}
              </>
            )}

            {config.type === 'rotation' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Ángulo de Giro (θ):</span>
                  <span className="font-mono text-amber-600 font-bold">
                    {config.angleDeg > 0 ? `+${config.angleDeg}°` : `${config.angleDeg}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-360"
                  max="360"
                  step="15"
                  value={config.angleDeg}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, angleDeg: parseInt(e.target.value) }))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[90, 180, 270, -90].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setConfig((prev) => ({ ...prev, angleDeg: deg }))}
                      className="py-1 text-[11px] font-mono bg-surface border border-border rounded hover:bg-border transition font-semibold"
                    >
                      {deg > 0 ? `+${deg}°` : `${deg}°`}
                    </button>
                  ))}
                </div>

                {/* CENTRO DE ROTACIÓN */}
                <div className="pt-2.5 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Centro de Giro C:</span>
                    <span className="font-mono text-amber-600">
                      ({config.center.x}, {config.center.y})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTool(tool === 'pivot' ? 'select' : 'pivot')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                        tool === 'pivot'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-surface text-ink border-border hover:border-border-strong'
                      }`}
                    >
                      <Target className="h-3.5 w-3.5" />
                      {tool === 'pivot' ? 'Selecciona en Plano' : 'Ubicar en Plano'}
                    </button>
                    <button
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, center: { x: 0, y: 0 } }))
                      }
                      className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-surface text-ink-soft hover:text-ink border border-border transition"
                    >
                      O(0,0)
                    </button>
                  </div>
                </div>
              </>
            )}

            {config.type === 'homothety' && (
              <>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span>Razón de Escala (k):</span>
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
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[0.5, 2, -1, -2].map((k) => (
                    <button
                      key={k}
                      onClick={() => setConfig((prev) => ({ ...prev, scaleFactor: k }))}
                      className="py-1 text-[11px] font-mono bg-surface border border-border rounded hover:bg-border transition font-semibold"
                    >
                      {k}x
                    </button>
                  ))}
                </div>

                {/* CENTRO DE HOMOTECIA */}
                <div className="pt-2.5 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>Centro de Homotecia C:</span>
                    <span className="font-mono text-purple-600">
                      ({config.homothetyCenter.x}, {config.homothetyCenter.y})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTool(tool === 'pivot' ? 'select' : 'pivot')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                        tool === 'pivot'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-surface text-ink border-border hover:border-border-strong'
                      }`}
                    >
                      <Target className="h-3.5 w-3.5" />
                      {tool === 'pivot' ? 'Selecciona en Plano' : 'Ubicar en Plano'}
                    </button>
                    <button
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          homothetyCenter: { x: 0, y: 0 }
                        }))
                      }
                      className="py-1.5 px-2.5 rounded-lg text-xs font-medium bg-surface text-ink-soft hover:text-ink border border-border transition"
                    >
                      O(0,0)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* BOTONES DE ACCIÓN: COMPROBADOR Y TEORÍA */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => setIsCheckerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-ok/10 text-ok border border-ok/30 font-semibold text-xs hover:bg-ok/20 transition shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" /> Comprobar Ejercicio en Aula
            </button>
            <button
              onClick={() => setIsTheoryOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent/10 text-accent border border-accent/20 font-semibold text-xs hover:bg-accent/20 transition"
            >
              <HelpCircle className="h-4 w-4" /> Ver Ecuaciones y Propiedades
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MODAL DE MODELOS / PRESETS DE FIGURAS GEOMÉTRICAS */}
      {isPresetsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-5 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
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
                  onClick={() => handleSelectPreset(preset)}
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

      {/* 4. MODAL DE INGRESO NUMÉRICO DE COORDENADAS (x, y) */}
      {isCoordsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-2xl border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Hash className="h-4 w-4 text-accent" /> Coordenadas Numéricas (x, y)
              </h3>
              <button
                onClick={() => setIsCoordsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-ink-soft">
              Ingresa un par ordenado por línea. Ejemplo: <code>2, 1</code> o <code>(8, 7)</code>.
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
                Trazar Figura en Pizarra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE TEORÍA Y ECUACIONES MATEMÁTICAS FORMALES */}
      {isTheoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-accent" /> {theory.title}
              </h3>
              <button
                onClick={() => setIsTheoryOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
              <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
                <div className="font-bold text-accent mb-1">Clasificación Geométrica:</div>
                <p className="text-ink font-medium">{theory.isometryType}</p>
              </div>

              <div>
                <div className="font-bold text-ink mb-1 uppercase tracking-wider text-[11px]">
                  Fórmula de Transformación:
                </div>
                <pre className="p-3 rounded-xl bg-panel border border-border font-mono text-xs text-accent font-semibold whitespace-pre-wrap">
                  {theory.formula}
                </pre>
              </div>

              <div>
                <div className="font-bold text-ink mb-1.5 uppercase tracking-wider text-[11px]">
                  Propiedades e Invariantes:
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-ink-soft">
                  {theory.invariants.map((inv, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-ink font-medium">{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-ink">
                <div className="font-bold text-amber-700 mb-1">Nota Didáctica:</div>
                <p className="leading-relaxed text-ink-soft">{theory.notes}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setIsTheoryOpen(false)}
                className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:brightness-110 shadow-sm"
              >
                Comprendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. COMPROBADOR DE EJERCICIOS LATERAL (AULA) */}
      {isCheckerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-surface shadow-2xl border-l border-border p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-ok" /> Verificación Analítica
              </h2>
              <button
                onClick={() => setIsCheckerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-panel border border-border text-xs space-y-1.5">
                <div className="font-bold text-ink">Transformación:</div>
                <div className="capitalize text-accent font-semibold">{theory.title}</div>
                <div className="font-mono text-[11px] text-ink-soft pt-1">
                  Regla: {theory.formula.split('\n')[0]}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-ink uppercase tracking-wider flex justify-between">
                  <span>Correspondencia de Vértices:</span>
                  <span className="text-ink-soft font-normal">P(x,y) ➔ P'(x',y')</span>
                </div>
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                  {vertices.map((v, i) => {
                    const vPrime = transformedVertices[i];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-panel border border-border text-xs font-mono"
                      >
                        <span className="font-bold text-emerald-700">
                          {v.label || String.fromCharCode(65 + i)}({v.x}, {v.y})
                        </span>
                        <span className="text-ink-faint">➔</span>
                        <span className="font-bold text-accent">
                          {v.label || String.fromCharCode(65 + i)}'({vPrime?.x}, {vPrime?.y})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCheckerOpen(false)}
            className="w-full py-2.5 rounded-xl bg-accent text-white font-semibold text-xs shadow-md hover:brightness-110 transition"
          >
            Entendido, volver a la pizarra
          </button>
        </div>
      )}
    </div>
  );
}
