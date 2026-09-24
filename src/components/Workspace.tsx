import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  History,
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
  AppSettings,
  GeoProjectData
} from '../types/geometry';
import {
  solveGeometryProblem,
  distance,
  midpoint,
  formatNum,
  CLASSROOM_PROBLEMS,
  generateRandomProblemScenario
} from '../utils/GeometryProblemEngine';
import { GeoGebraToolbar } from './GeoGebraToolbar';
import { AlgebraView } from './AlgebraView';
import { AlgebraicNotebook } from './AlgebraicNotebook';
import { InverseProblemPanel } from './InverseProblemPanel';
import { TheoryPage } from './TheoryPage';
import { StudyProblemsPage } from './StudyProblemsPage';
import { InteractiveGuideModal } from './InteractiveGuideModal';
import { PolygonPreview } from './PolygonPreview';
import { SHAPE_PRESETS } from '../utils/transformations';
import { embedProjectInPNG, extractProjectFromPNG } from '../utils/pngMetadata';
import {
  analyzeSymmetry,
  ShapeSymmetryResult,
  WordAutoformaPreset,
  SymmetryAxis,
  WORD_AUTOFORMAS
} from '../utils/symmetryAnalyzer';

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
    translationMode: 'points',
    translationVectorSet: false,
    translationVectorCount: 1,
    translationSecondDx: 0,
    translationSecondDy: 0,
    translationSecondVectorSet: false,
    translationReady: true,
    reflectionAxis: 'custom_x',
    reflectionAxes: ['custom_x'],
    customAxisValue: 2,
    generalLine: { a: 1, b: 0, c: -2 },
    centralCenter: { x: 0, y: 0 },
    angleDeg: 90,
    direction: 'anticlockwise',
    center: { x: 0, y: 0 },
    scaleFactor: 3,
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
  const [selectedProblemTab, setSelectedProblemTab] = useState<'selector' | 'ejercicio'>('selector');
  const [studyMode, setStudyMode] = useState<'ruta' | 'libre'>(() => {
    if (typeof window === 'undefined') return 'ruta';
    try {
      const raw = window.localStorage.getItem('geotransform_problem_progress_v1');
      if (!raw) return 'ruta';
      const parsed = JSON.parse(raw);
      return parsed?.studyMode === 'libre' ? 'libre' : 'ruta';
    } catch {
      return 'ruta';
    }
  });
  const [selectedProblemDifficulty, setSelectedProblemDifficulty] = useState<'básico' | 'intermedio' | 'avanzado'>(() => {
    if (typeof window === 'undefined') return 'básico';
    try {
      const raw = window.localStorage.getItem('geotransform_problem_progress_v1');
      if (!raw) return 'básico';
      const parsed = JSON.parse(raw);
      return parsed?.selectedProblemDifficulty === 'intermedio' || parsed?.selectedProblemDifficulty === 'avanzado'
        ? parsed.selectedProblemDifficulty
        : 'básico';
    } catch {
      return 'básico';
    }
  });
  const [selectedProblemType, setSelectedProblemType] = useState<ProblemScenario['targetConfig']['type'] | 'todos'>(() => {
    if (typeof window === 'undefined') return 'todos';
    try {
      const raw = window.localStorage.getItem('geotransform_problem_progress_v1');
      if (!raw) return 'todos';
      const parsed = JSON.parse(raw);
      const validTypes = ['todos', 'translation', 'reflection', 'rotation', 'central_reflection', 'homothety'];
      return validTypes.includes(parsed?.selectedProblemType) ? parsed.selectedProblemType : 'todos';
    } catch {
      return 'todos';
    }
  });
  const [studySessionCount, setStudySessionCount] = useState(0);
  const [completedProblemIds, setCompletedProblemIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('geotransform_problem_progress_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      const ids = Array.isArray(parsed?.completedProblemIds) ? parsed.completedProblemIds : [];
      return ids.filter((id): id is string => typeof id === 'string');
    } catch {
      return [];
    }
  });
  const [customStatement, setCustomStatement] = useState<string>(
    'Pizarra interactiva: traza tu figura en el plano o carga un modelo escolar.'
  );

  const levelOrder = ['básico', 'intermedio', 'avanzado'] as const;
  const levelTargets = { básico: 0, intermedio: 3, avanzado: 3 } as const;

  const completedCountByDifficulty = useMemo(() => {
    return levelOrder.reduce((acc, level) => {
      acc[level] = CLASSROOM_PROBLEMS.filter((problem) => problem.difficulty === level && completedProblemIds.includes(problem.id)).length;
      return acc;
    }, {} as Record<typeof levelOrder[number], number>);
  }, [completedProblemIds]);

  const unlockedLevels = useMemo(() => ({
    básico: true,
    intermedio: completedCountByDifficulty.básico >= levelTargets.intermedio,
    avanzado: completedCountByDifficulty.intermedio >= levelTargets.avanzado
  }), [completedCountByDifficulty]);

  const nextStudySuggestion = useMemo(() => {
    if (studyMode === 'libre') {
      return 'Modo repaso libre: practica distintos tipos de transformación sin afectar la ruta de progreso.';
    }
    if (selectedProblemType === 'translation') return 'Siguiente actividad sugerida: practica la traslación con vector en el plano y compara Δx y Δy.';
    if (selectedProblemType === 'reflection') return 'Siguiente actividad sugerida: identifica el eje de simetría y comprueba que la distancia a la recta se conserve.';
    if (selectedProblemType === 'rotation') return 'Siguiente actividad sugerida: calcula el centro y el ángulo de giro; compara orientación y distancia.';
    if (selectedProblemType === 'central_reflection') return 'Siguiente actividad sugerida: busca el punto medio entre cada vértice y su imagen.';
    if (selectedProblemType === 'homothety') return 'Siguiente actividad sugerida: comprueba la razón k y cómo cambia la distancia respecto al centro.';
    if (selectedProblemDifficulty === 'avanzado') return 'Siguiente actividad sugerida: intenta un reto avanzado con varias transformaciones o un enunciado más completo.';
    if (selectedProblemDifficulty === 'intermedio') return 'Siguiente actividad sugerida: combina un ejercicio de nivel intermedio con un tipo diferente de transformación.';
    return 'Siguiente actividad sugerida: empieza con un problema básico y consolida la idea principal antes de avanzar.';
  }, [selectedProblemDifficulty, selectedProblemType, studyMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      studyMode,
      selectedProblemDifficulty,
      selectedProblemType,
      completedProblemIds
    };
    window.localStorage.setItem('geotransform_problem_progress_v1', JSON.stringify(payload));
  }, [studyMode, selectedProblemDifficulty, selectedProblemType, completedProblemIds]);

  const markCurrentProblemAsCompleted = useCallback(() => {
    if (!currentScenario) return;

    setCompletedProblemIds((prev) =>
      prev.includes(currentScenario.id) ? prev : [...prev, currentScenario.id]
    );
  }, [currentScenario]);

  const handleGenerateRandomProblem = useCallback((difficulty: 'básico' | 'intermedio' | 'avanzado' | 'todos' = 'todos') => {
    const targetDifficulty = studyMode === 'ruta'
      ? selectedProblemDifficulty
      : difficulty === 'todos'
        ? (['básico', 'intermedio', 'avanzado'] as const)[Math.floor(Math.random() * 3)]
        : difficulty;
    const generated = generateRandomProblemScenario(
      targetDifficulty,
      problemMode,
      selectedProblemType === 'todos' ? undefined : selectedProblemType
    );
    setCurrentScenario(generated);
    setSelectedProblemTab('ejercicio');
    setStudySessionCount((prev) => prev + 1);
  }, [problemMode, selectedProblemDifficulty, selectedProblemType, studyMode]);

  const openScenario = useCallback((problem: ProblemScenario) => {
    setCurrentScenario(problem);
    setSelectedProblemTab('ejercicio');
    setStudySessionCount((prev) => prev + 1);
  }, []);

  const handleLoadScenarioToBoard = useCallback((problem: ProblemScenario) => {
    commitAction();
    setCurrentScenario(problem);
    if (problem.presetVertices && problem.presetVertices.length > 0) {
      setVertices(problem.presetVertices);
      const n = problem.presetVertices.length;
      if (n >= 3) {
        setIsPolygon(true);
        const segs: [number, number][] = [];
        for (let i = 0; i < n; i++) {
          segs.push([i, (i + 1) % n]);
        }
        setSegments(segs);
      } else if (n === 2) {
        setIsPolygon(false);
        setSegments([[0, 1]]);
      } else {
        setIsPolygon(false);
        setSegments([]);
      }
    }
    if (problem.targetConfig) {
      setConfig(problem.targetConfig);
    }
    if (problem.mode) {
      setProblemMode(problem.mode);
    }
    setIsProblemOpen(false);
    setProjectToast({
      message: `¡Problema cargado en la pizarra! Practica: ${problem.title}`,
      type: 'success'
    });
  }, [commitAction]);

  const filteredProblemsByDifficulty = useMemo(() => {
    return (['básico', 'intermedio', 'avanzado'] as const).reduce((acc, difficulty) => {
      acc[difficulty] = CLASSROOM_PROBLEMS.filter((problem) => {
        const matchesType = selectedProblemType === 'todos' || problem.targetConfig.type === selectedProblemType;
        return problem.difficulty === difficulty && matchesType;
      });
      return acc;
    }, {} as Record<'básico' | 'intermedio' | 'avanzado', typeof CLASSROOM_PROBLEMS>);
  }, [selectedProblemType]);

  // 5. PESTAÑAS DEL PANEL LATERAL RESPONSIVO
  const [sidebarTab, setSidebarTab] = useState<'algebra' | 'notebook' | 'problem'>('algebra');
  // Por defecto SIEMPRE oculto en móvil y tableta para mostrar el plano cartesiano completo inmediatamente
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280; // Solo en monitores anchos de escritorio
    }
    return false;
  });
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState<boolean>(false);
  const [isProblemOpen, setIsProblemOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  const closeContentViews = useCallback(() => {
    setIsTheoryOpen(false);
    setIsNotebookOpen(false);
    setIsProblemOpen(false);
  }, []);

  // 6. TOGGLES DE INSPECCIÓN
  const [toggles, setToggles] = useState<ClassroomToggles>({
    showSideLengths: false,
    showInteriorAngles: false,
    showConstructionGuides: true,
    showReflectionDistances: true,
    showPoints: true,
    showAxes: true,
    showTransformedImage: true,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const isDraggingCanvasRef = useRef(false);
  const draggingVertexIndexRef = useRef<number | null>(null);
  const isDraggingPivotRef = useRef(false);
  const isDraggingReflectionLineRef = useRef(false);
  const [isHoveringReflectionLine, setIsHoveringReflectionLine] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // 9.b ESTADO DE EJES DE SIMETRÍA Y AUTOFORMAS (WORD)
  const [showSymmetryAxes, setShowSymmetryAxes] = useState<boolean>(false);
  const [selectedSymmetryAxisId, setSelectedSymmetryAxisId] = useState<string | 'all'>('all');
  const [activeAutoformaId, setActiveAutoformaId] = useState<string | null>(null);
  const [shapeRotationAngle, setShapeRotationAngle] = useState<number>(0);

  const symmetryResult = useMemo(() => {
    return analyzeSymmetry(vertices, activeAutoformaId || undefined, shapeRotationAngle);
  }, [vertices, activeAutoformaId, shapeRotationAngle]);

  const toggleCanvasFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      setIsCanvasFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsCanvasFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const isOverlayOpen = isTheoryOpen || isNotebookOpen || isProblemOpen;
    if (!isOverlayOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsTheoryOpen(false);
        setIsNotebookOpen(false);
        setIsProblemOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isTheoryOpen, isNotebookOpen, isProblemOpen]);

  // OBSERVADOR DE REDIMENSIONAMIENTO PARA MÁXIMA NITIDEZ (Cero desenfoque al ocultar/mostrar panel o rotar pantalla)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    ro.observe(container);

    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setCanvasDimensions({ width: Math.round(rect.width), height: Math.round(rect.height) });
    }

    const handleWindowResize = () => {
      if (container) {
        const r = container.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setCanvasDimensions({ width: Math.round(r.width), height: Math.round(r.height) });
        }
      }
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('orientationchange', handleWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('orientationchange', handleWindowResize);
    };
  }, [isActive, isSidebarOpen]);

  // Mantener el panel cerrado solo en viewports móviles (< 768px)
  useEffect(() => {
    const handleCheckMobile = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    handleCheckMobile();
    window.addEventListener('resize', handleCheckMobile);
    return () => window.removeEventListener('resize', handleCheckMobile);
  }, []);

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
  const secondaryTransformedVertices = engineResult.secondaryTransformedVertices || [];
  const translationStages = engineResult.translationStages || [];
  const rotationStages = engineResult.rotationStages || [];

  const notebookContext = useMemo(() => {
    switch (config.type) {
      case 'translation':
        return {
          typeLabel: 'Traslación',
          summary: `El plano se desplaza según el vector v = (${formatNum(config.dx)}, ${formatNum(config.dy)}).`,
          formula: `(x', y') = (x + ${formatNum(config.dx)}, y + ${formatNum(config.dy)})`,
          studentExplanation: 'Cada punto se mueve exactamente la misma cantidad en la misma dirección. La figura conserva su forma, sus lados y sus medidas; lo único que cambia es la posición en el plano.',
          parameters: [
            `Vector de desplazamiento: (${formatNum(config.dx)}, ${formatNum(config.dy)})`,
            `Dirección: ${config.dx >= 0 ? 'hacia la derecha' : 'hacia la izquierda'} y ${config.dy >= 0 ? 'hacia arriba' : 'hacia abajo'}`,
            'La orientación de la figura no se invierte.'
          ]
        };
      case 'reflection':
        return {
          typeLabel: 'Simetría axial',
          summary: `La figura se refleja respecto a ${config.reflectionAxis === 'x' ? 'el eje X' : config.reflectionAxis === 'y' ? 'el eje Y' : config.reflectionAxis === 'y=x' ? 'la recta y = x' : config.reflectionAxis === 'y=-x' ? 'la recta y = -x' : config.reflectionAxis === 'custom_x' ? `la recta x = ${formatNum(config.customAxisValue)}` : config.reflectionAxis === 'custom_y' ? `la recta y = ${formatNum(config.customAxisValue)}` : `la recta ${formatNum(config.generalLine.a)}x + ${formatNum(config.generalLine.b)}y + ${formatNum(config.generalLine.c)} = 0`}.`,
          formula: config.reflectionAxis === 'x'
            ? '(x\', y\') = (x, -y)'
            : config.reflectionAxis === 'y'
            ? '(x\', y\') = (-x, y)'
            : config.reflectionAxis === 'y=x'
            ? '(x\', y\') = (y, x)'
            : config.reflectionAxis === 'y=-x'
            ? '(x\', y\') = (-y, -x)'
            : config.reflectionAxis === 'custom_x'
            ? `x' = 2(${formatNum(config.customAxisValue)}) - x,  y' = y`
            : config.reflectionAxis === 'custom_y'
            ? `x' = x,  y' = 2(${formatNum(config.customAxisValue)}) - y`
            : `P' = P - 2·n·[(Ax + By + C)/(A² + B²)]`,
          studentExplanation: 'La imagen queda en el lado opuesto del eje, a la misma distancia perpendicular. Por eso la figura conserva sus medidas, pero la orientación del giro cambia.',
          parameters: [
            `Eje de reflexión: ${config.reflectionAxis === 'x' ? 'y = 0' : config.reflectionAxis === 'y' ? 'x = 0' : config.reflectionAxis === 'y=x' ? 'y = x' : config.reflectionAxis === 'y=-x' ? 'y = -x' : config.reflectionAxis === 'custom_x' ? `x = ${formatNum(config.customAxisValue)}` : config.reflectionAxis === 'custom_y' ? `y = ${formatNum(config.customAxisValue)}` : `Ax + By + C = 0`}`,
            'La recta de reflexión es la mediatriz del segmento entre cada punto y su imagen.',
            'Se conservan ángulos, longitudes y área.'
          ]
        };
      case 'rotation': {
        const steps = config.rotationSteps?.length ? config.rotationSteps : [{ angleDeg: config.angleDeg, direction: config.direction, center: config.center }];
        const isMulti = steps.length > 1;
        return {
          typeLabel: isMulti ? `Rotaciones Sucesivas (${steps.length} Giros)` : 'Rotación',
          summary: isMulti
            ? `Secuencia de ${steps.length} rotaciones encadenadas a partir de la figura original: ` +
              steps.map((s, idx) => `Giro ${idx + 1} (${"'".repeat(idx + 1)}): ${s.direction === 'clockwise' ? '-' : '+'}${Math.abs(s.angleDeg)}°`).join(' ➔ ')
            : `La figura gira ${Math.abs(config.angleDeg)}° alrededor del centro C(${formatNum(config.center.x)}, ${formatNum(config.center.y)}) en sentido ${config.direction === 'clockwise' ? 'horario' : 'antihorario'}.`,
          formula: isMulti
            ? `F₀ → F₁ → F₂ → ... (cada etapa rota la imagen previa)`
            : `P' = C + R_α(P - C), con α = ${config.direction === 'clockwise' ? '-' : '+'}${Math.abs(config.angleDeg)}°`,
          studentExplanation: isMulti
            ? 'Cada punto rota primero a su primera posición (A\'); desde esa nueva posición se vuelve a aplicar el siguiente giro (A\'\'), continuando así de forma sucesiva sin perder congruencia ni deformarse.'
            : 'Cada punto describe un arco alrededor del centro. La distancia a ese centro se conserva, pero la posición angular cambia; por eso la figura gira sin deformarse.',
          parameters: isMulti
            ? steps.map((s, idx) => `Giro ${idx + 1} (${"'".repeat(idx + 1)}): ${Math.abs(s.angleDeg)}° ${s.direction === 'clockwise' ? 'horario (-)' : 'antihorario (+)'} con centro C(${formatNum((s.center || config.center).x)}, ${formatNum((s.center || config.center).y)})`)
            : [
                `Centro: C(${formatNum(config.center.x)}, ${formatNum(config.center.y)})`,
                `Ángulo: ${Math.abs(config.angleDeg)}°`,
                `Sentido: ${config.direction === 'clockwise' ? 'horario' : 'antihorario'}`
              ]
        };
      }
      case 'central_reflection':
        return {
          typeLabel: 'Simetría central',
          summary: `Cada punto se refleja respecto al centro O(${formatNum(config.centralCenter.x)}, ${formatNum(config.centralCenter.y)}) como si fuera un giro de 180° alrededor de ese punto.`,
          formula: `(x', y') = (2h - x, 2k - y) con O(${formatNum(config.centralCenter.x)}, ${formatNum(config.centralCenter.y)})`,
          studentExplanation: 'El centro es el punto medio entre el punto original y su imagen. La figura conserva tamaño y forma, pero cambia de lado respecto al centro.',
          parameters: [
            `Centro: O(${formatNum(config.centralCenter.x)}, ${formatNum(config.centralCenter.y)})`,
            'Cada segmento queda dividido por el centro en dos partes iguales.',
            'La orientación de la figura se invierte.'
          ]
        };
      case 'homothety':
        return {
          typeLabel: 'Homotecia',
          summary: `La figura se amplía o reduce desde el centro O(${formatNum(config.homothetyCenter.x)}, ${formatNum(config.homothetyCenter.y)}) con razón k = ${formatNum(config.scaleFactor)}.`,
          formula: `(x', y') = (${formatNum(config.homothetyCenter.x)} + k(x - ${formatNum(config.homothetyCenter.x)}), ${formatNum(config.homothetyCenter.y)} + k(y - ${formatNum(config.homothetyCenter.y)}))`,
          studentExplanation: 'Los puntos no solo cambian de lugar, sino que se alejan o acercan al centro según la factor k. Esto cambia las longitudes y el área, pero conserva la forma y los ángulos.',
          parameters: [
            `Centro: O(${formatNum(config.homothetyCenter.x)}, ${formatNum(config.homothetyCenter.y)})`,
            `Razón: k = ${formatNum(config.scaleFactor)}`,
            config.scaleFactor > 0 ? 'La figura queda del mismo lado del centro.' : 'La figura queda al lado opuesto del centro.'
          ]
        };
      default:
        return undefined;
    }
  }, [config]);

  const activeReflectionAxes = config.reflectionAxes?.length
    ? config.reflectionAxes
    : [config.reflectionAxis];
  const additionalReflectionVertices = useMemo(() => {
    if (config.type !== 'reflection' || activeReflectionAxes.length < 2) return [];
    return activeReflectionAxes.slice(1).map((axis) => solveGeometryProblem(vertices, {
      ...config,
      reflectionAxis: axis,
      reflectionAxes: [axis]
    }).transformedVertices);
  }, [activeReflectionAxes, config, vertices]);
  const additionalReflectionGuides = useMemo(() => {
    if (config.type !== 'reflection' || activeReflectionAxes.length < 2) return [];
    return activeReflectionAxes.slice(1).map((axis) => solveGeometryProblem(vertices, {
      ...config,
      reflectionAxis: axis,
      reflectionAxes: [axis]
    }).constructionElements.perpendicularGuides || []);
  }, [activeReflectionAxes, config, vertices]);

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
    setSegments([]);
    setIsPolygon(false);
    setSegmentStartVertex(null);
    setTool('select');
    setPan({ x: 0, y: 0 });
    setScale(38);
    setGridStyle('lines');
    setConfig({
      type: 'reflection',
      dx: 4,
      dy: 2,
      translationMode: 'points',
      translationTarget: undefined,
      translationTargets: [],
      translationVectorSet: false,
      translationVectors: undefined,
      translationVectorCount: 1,
      translationSecondDx: 0,
      translationSecondDy: 0,
      translationSecondVectorSet: false,
      translationReady: true,
      reflectionAxis: 'custom_x',
      reflectionAxes: ['custom_x'],
      customAxisValue: 2,
      generalLine: { a: 1, b: 0, c: -2 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 90,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 3,
      homothetyCenter: { x: 0, y: 0 }
    });
    setUndoStack([]);
    setRedoStack([]);
    setProblemMode('DIRECT');
    setCurrentScenario(null);
    setCustomStatement('Pizarra interactiva: traza tu figura en el plano o carga un modelo escolar.');
  };

  // Cargar figura prediseñada
  const handleLoadPreset = (preset: (typeof SHAPE_PRESETS)[0]) => {
    commitAction();
    setVertices(preset.vertices);
    setConfig((prev) => ({ ...prev, translationTarget: undefined, translationTargets: [], translationReady: true }));
    setIsPolygon(true);
    const segs: [number, number][] = [];
    for (let i = 0; i < preset.vertices.length; i++) {
      segs.push([i, (i + 1) % preset.vertices.length]);
    }
    setSegments(segs);
    setSegmentStartVertex(null);
    setIsPresetsOpen(false);
    setTool('select');
    if (preset.category === 'Autoformas (Simetría)' || (preset as any).symmetryCount !== undefined) {
      setActiveAutoformaId(preset.id);
      setShowSymmetryAxes(true);
      setSelectedSymmetryAxisId('all');
      setToggles((prev) => ({ ...prev, showTransformedImage: false }));
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: 'y',
        customAxisValue: 0,
        reflectionAxes: ['y'],
        translationTarget: undefined,
        translationTargets: [],
        translationReady: true
      }));
      setTimeout(() => {
        handleAutoFitView();
      }, 50);
      showToast(`Autoforma "${preset.name}" cargada: figura única con ${(preset as any).isInfinite ? 'infinitos' : (preset as any).symmetryCount} ejes de simetría máximos.`, 'info');
    } else {
      setActiveAutoformaId(null);
      setShowSymmetryAxes(false);
      setToggles((prev) => ({ ...prev, showTransformedImage: true }));
    }
  };

  // Cargar triángulo escolar rápido
  const handleLoadQuickTriangle = () => {
    const pts: Point[] = [
      { x: 1, y: 1, label: 'A' },
      { x: 4, y: 2, label: 'B' },
      { x: 2, y: 5, label: 'C' }
    ];
    setVertices(pts);
    setConfig((prev) => ({ ...prev, translationTarget: undefined, translationTargets: [], translationReady: true }));
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
        setConfig((prev) => ({ ...prev, translationReady: true }));
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
      setConfig((prev) => ({ ...prev, translationReady: true }));
    }
  };

  // Quitar segmentos
  const handleClearSegments = () => {
    setSegments([]);
    setIsPolygon(false);
    setConfig((prev) => ({ ...prev, translationReady: false }));
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

  // RENDERIZADO DEL PLANO AL ESTILO GEOGEBRA (FUNCIÓN UNIFICADA PARA LIENZO Y EXPORTACIÓN)
  const drawGeometryPlane = useCallback((
    targetCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    activeScale: number,
    activePan: { x: number; y: number },
    dpr: number = 1,
    options: {
      isExport?: boolean;
      headerInfo?: {
        title?: string;
        type: string;
        variant: 'student' | 'teacher';
      };
    } = {}
  ) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    if (width <= 0 || height <= 0) return;

    const isExport = !!options.isExport;
    const headerHeight = (isExport && options.headerInfo) ? 56 : 0;

    // Configuración física interna en píxeles del dispositivo (Retina/High-DPI)
    targetCanvas.width = Math.round(width * dpr);
    targetCanvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Ajustes por defecto
    const baseLW = lineThickness === 'thin' ? 1 : lineThickness === 'thick' ? 3.5 : 2;
    const pRad = pointSize === 'small' ? 3.5 : pointSize === 'large' ? 7.5 : 5;

    // Fondo del lienzo dependiente del modo oscuro/claro
    ctx.fillStyle = isDarkMode ? '#0b0f19' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const planeCenterY = isExport ? headerHeight + (height - headerHeight) / 2 : height / 2;
    const originX = width / 2 + activePan.x;
    const originY = planeCenterY + activePan.y;
    const scale = activeScale;
    const pan = activePan;

    const toScreen = (pt: { x: number; y: number }, _w?: number, _h?: number) => ({
      x: originX + pt.x * scale,
      y: originY - pt.y * scale
    });

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
    const showAxes = toggles.showAxes !== false;
    if (showAxes) {
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
    }

    // 3. ELEMENTOS DE TRANSFORMACIÓN (EJE, CENTRO, VECTORES)
    const showTransformed = toggles.showTransformedImage !== false;
    if (showTransformed) {
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

        // Dibujar los ejes adicionales seleccionados con colores distinguibles.
        const additionalAxisColors = ['#db2777', '#ea580c', '#0891b2', '#65a30d', '#be123c', '#0f766e'];
        activeReflectionAxes.slice(1).forEach((axis, axisIndex) => {
          ctx.save();
          ctx.strokeStyle = additionalAxisColors[axisIndex % additionalAxisColors.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          if (axis === 'x') {
            ctx.moveTo(0, originY);
            ctx.lineTo(width, originY);
          } else if (axis === 'y') {
            ctx.moveTo(originX, 0);
            ctx.lineTo(originX, height);
          } else if (axis === 'y=x') {
            ctx.moveTo(originX - 3000, originY + 3000);
            ctx.lineTo(originX + 3000, originY - 3000);
          } else if (axis === 'y=-x') {
            ctx.moveTo(originX - 3000, originY - 3000);
            ctx.lineTo(originX + 3000, originY + 3000);
          } else if (axis === 'custom_x') {
            const sx = originX + config.customAxisValue * scale;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
          } else if (axis === 'custom_y') {
            const sy = originY - config.customAxisValue * scale;
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
          } else if (axis === 'general') {
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
          ctx.restore();
        });

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
        ctx.arc(cScr.x, cScr.y, (!isExport && isHoveringPivot) ? 14 : 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cScr.x, cScr.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Etiqueta pivote con fondo blanco protector
        ctx.font = 'bold 13px "Inter", sans-serif';
        const pLabel = showAxes ? `C(${activePivot.x}, ${activePivot.y})` : 'C';
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(pLabel, cScr.x + 10, cScr.y - 8);
        ctx.fillText(pLabel, cScr.x + 10, cScr.y - 8);
        ctx.restore();
      }
    }

    // 4. GUÍAS Y CONSTRUCCIONES MATEMÁTICAS ESTRICTAS
    if (showTransformed && (toggles.showConstructionGuides || (config.type === 'reflection' && toggles.showReflectionDistances)) && vertices.length > 0) {
      const reflectionGuideColors = [
        '#dc2626', '#2563eb', '#16a34a', '#9333ea',
        '#ea580c', '#0891b2', '#be123c', '#65a30d'
      ];

      // A) Simetría Axial: Segmentos perpendiculares, 90° y ticks congruentes
      if (config.type === 'reflection' && toggles.showConstructionGuides && engineResult.constructionElements.perpendicularGuides) {
        ctx.save();
        engineResult.constructionElements.perpendicularGuides.forEach((g, guideIndex) => {
          const s = toScreen(g.p, width, height);
          const hScr = toScreen(g.footH, width, height);
          const e = toScreen(g.pPrime, width, height);
          const guideColor = reflectionGuideColors[guideIndex % reflectionGuideColors.length];
          const dx = e.x - s.x;
          const dy = e.y - s.y;
          const length = Math.hypot(dx, dy) || 1;
          const laneOffset = ((guideIndex % 5) - 2) * 3;
          const normalX = -dy / length;
          const normalY = dx / length;
          const laneStart = { x: s.x + normalX * laneOffset, y: s.y + normalY * laneOffset };
          const laneEnd = { x: e.x + normalX * laneOffset, y: e.y + normalY * laneOffset };
          const laneFoot = { x: hScr.x + normalX * laneOffset, y: hScr.y + normalY * laneOffset };

          // Conector fino: conserva visible la relación exacta con P y P'.
          ctx.strokeStyle = `${guideColor}66`;
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(laneStart.x, laneStart.y);
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(laneEnd.x, laneEnd.y);
          ctx.stroke();

          // Carril perpendicular coloreado y con patrón alterno.
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(laneStart.x, laneStart.y);
          ctx.lineTo(laneEnd.x, laneEnd.y);
          ctx.stroke();
          ctx.strokeStyle = guideColor;
          ctx.lineWidth = 2;
          ctx.setLineDash(guideIndex % 2 === 0 ? [4, 4] : [7, 3]);
          ctx.beginPath();
          ctx.moveTo(laneStart.x, laneStart.y);
          ctx.lineTo(laneEnd.x, laneEnd.y);
          ctx.stroke();

          // Símbolo de ángulo recto (90°)
            const vP = { x: laneStart.x - laneFoot.x, y: laneStart.y - laneFoot.y };
          const lenP = Math.hypot(vP.x, vP.y);
          if (lenP > 6) {
            const uP = { x: vP.x / lenP, y: vP.y / lenP };
            const uL = { x: -uP.y, y: uP.x };
            const sq = 7;
            ctx.strokeStyle = guideColor;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(laneFoot.x + uP.x * sq, laneFoot.y + uP.y * sq);
            ctx.lineTo(laneFoot.x + uP.x * sq + uL.x * sq, laneFoot.y + uP.y * sq + uL.y * sq);
            ctx.lineTo(laneFoot.x + uL.x * sq, laneFoot.y + uL.y * sq);
            ctx.stroke();

            // Ticks de congruencia //
            const drawTicks = (mid: { x: number; y: number }) => {
              const tLen = 3.5;
              ctx.beginPath();
              ctx.moveTo(mid.x - uL.x * tLen, mid.y - uL.y * tLen);
              ctx.lineTo(mid.x + uL.x * tLen, mid.y + uL.y * tLen);
              ctx.stroke();
            };
            drawTicks({ x: (laneStart.x + laneFoot.x) / 2, y: (laneStart.y + laneFoot.y) / 2 });
            drawTicks({ x: (laneFoot.x + laneEnd.x) / 2, y: (laneFoot.y + laneEnd.y) / 2 });
          }
        });
        ctx.restore();
      }

      if (config.type === 'reflection' && toggles.showConstructionGuides && additionalReflectionGuides.length > 0) {
        additionalReflectionGuides.forEach((guides, guideIndex) => {
          ctx.save();
          ctx.setLineDash([4, 4]);
          guides.forEach((guide, pointIndex) => {
            const guideColor = reflectionGuideColors[(guideIndex * 3 + pointIndex + 1) % reflectionGuideColors.length];
            ctx.strokeStyle = guideColor;
            ctx.lineWidth = 1.6;
            const start = toScreen(guide.p, width, height);
            const end = toScreen(guide.pPrime, width, height);
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const length = Math.hypot(dx, dy) || 1;
            const laneOffset = ((pointIndex % 5) - 2) * 3;
            const normalX = -dy / length;
            const normalY = dx / length;
            const laneStart = { x: start.x + normalX * laneOffset, y: start.y + normalY * laneOffset };
            const laneEnd = { x: end.x + normalX * laneOffset, y: end.y + normalY * laneOffset };
            ctx.setLineDash([]);
            ctx.strokeStyle = `${guideColor}66`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(laneStart.x, laneStart.y);
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(laneEnd.x, laneEnd.y);
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(laneStart.x, laneStart.y);
            ctx.lineTo(laneEnd.x, laneEnd.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = guideColor;
            ctx.lineWidth = 2;
            ctx.setLineDash(pointIndex % 2 === 0 ? [4, 4] : [7, 3]);
            ctx.moveTo(laneStart.x, laneStart.y);
            ctx.lineTo(laneEnd.x, laneEnd.y);
            ctx.stroke();

            if (length > 6) {
              const midpointX = (laneStart.x + laneEnd.x) / 2;
              const midpointY = (laneStart.y + laneEnd.y) / 2;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(midpointX - normalX * 3.5, midpointY - normalY * 3.5);
              ctx.lineTo(midpointX + normalX * 3.5, midpointY + normalY * 3.5);
              ctx.strokeStyle = guideColor;
              ctx.stroke();
            }
          });
          ctx.restore();
        });
      }

      // Las distancias numéricas son independientes de las líneas de construcción.
      if (false && config.type === 'reflection' && toggles.showReflectionDistances) {
        const drawReflectionDistance = (guide: { p: Point; pPrime: Point; footH: Point }, color: string, guideIndex: number) => {
          const start = toScreen(guide.p, width, height);
          const foot = toScreen(guide.footH, width, height);
          const end = toScreen(guide.pPrime, width, height);
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.hypot(dx, dy) || 1;
          const normalX = -dy / length;
          const normalY = dx / length;
          const laneOffset = ((guideIndex % 5) - 2) * 3;
          const labelOffset = 10 + (guideIndex % 3) * 8;
          const drawHalfLabel = (a: { x: number; y: number }, b: { x: number; y: number }) => {
            const midX = (a.x + b.x) / 2 + normalX * (laneOffset + labelOffset);
            const midY = (a.y + b.y) / 2 + normalY * (laneOffset + labelOffset);
            const value = formatNum(distance(guide.p, guide.footH));
            ctx.save();
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(value).width;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.2;
            ctx.fillRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16);
            ctx.strokeRect(midX - textWidth / 2 - 3, midY - 8, textWidth + 6, 16);
            ctx.fillStyle = color;
            ctx.fillText(value, midX, midY);
            ctx.restore();
          };

          // El mismo valor en PH y HP': hace visible la igualdad propia de la simetría axial.
          drawHalfLabel(start, foot);
          drawHalfLabel(foot, end);
        };

        engineResult.constructionElements.perpendicularGuides?.forEach((guide, guideIndex) => {
          drawReflectionDistance(guide, reflectionGuideColors[guideIndex % reflectionGuideColors.length], guideIndex);
        });
        additionalReflectionGuides.forEach((guides, guideIndex) => {
          guides.forEach((guide, pointIndex) => {
            const color = reflectionGuideColors[(guideIndex * 3 + pointIndex + 1) % reflectionGuideColors.length];
            drawReflectionDistance(guide, color, pointIndex);
          });
        });
      }

      // B) Traslación: Descomposición en catetos Δx, Δy y vector resultante
      if (config.type === 'translation' && engineResult.constructionElements.vectorGuides) {
        ctx.save();
        const vectorColor = isDarkMode ? '#fbbf24' : '#ea580c';
        const vectorGuides = engineResult.constructionElements.vectorGuides;
        const secondaryVectorGuides = engineResult.constructionElements.secondaryVectorGuides || [];
        const allVectorGuides = [...vectorGuides, ...secondaryVectorGuides];
        const stageCount = engineResult.constructionElements.translationStageGuides?.length || 1;
        const verticesPerStage = Math.max(vertices.length, 1);
        const showVectorLabels = config.translationMode === 'vector'
          ? stageCount
          : vectorGuides.length <= 3 ? vectorGuides.length : 0;
        const vectorLabelObstacles = [
          ...vertices.map((point) => toScreen(point, width, height)),
          ...transformedVertices.map((point) => toScreen(point, width, height))
        ];
        const distanceToSegment = (
          point: { x: number; y: number },
          start: { x: number; y: number },
          end: { x: number; y: number }
        ) => {
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const lengthSquared = dx * dx + dy * dy || 1;
          const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
          const closestX = start.x + projection * dx;
          const closestY = start.y + projection * dy;
          return Math.hypot(point.x - closestX, point.y - closestY);
        };

        const getVectorLabelPosition = (
          start: { x: number; y: number },
          end: { x: number; y: number },
          labelWidth: number,
          labelHeight: number,
          guideIndex: number
        ) => {
          const lineDx = end.x - start.x;
          const lineDy = end.y - start.y;
          const lineLength = Math.hypot(lineDx, lineDy) || 1;
          const normal = { x: -lineDy / lineLength, y: lineDx / lineLength };
          const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
          const candidates = [
            { along: 0, offset: 30 },
            { along: 0, offset: -30 },
            { along: -lineLength * 0.18, offset: 30 },
            { along: lineLength * 0.18, offset: 30 },
            { along: -lineLength * 0.18, offset: -30 },
            { along: lineLength * 0.18, offset: -30 },
            { along: (guideIndex % 3 - 1) * 26, offset: 44 }
          ];
          const halfWidth = labelWidth / 2 + 7;
          const halfHeight = labelHeight / 2 + 7;
          const padding = 6;

          for (const candidate of candidates) {
            const center = {
              x: midpoint.x + (lineDx / lineLength) * candidate.along + normal.x * candidate.offset,
              y: midpoint.y + (lineDy / lineLength) * candidate.along + normal.y * candidate.offset
            };
            const box = {
              left: center.x - halfWidth,
              right: center.x + halfWidth,
              top: center.y - halfHeight,
              bottom: center.y + halfHeight
            };
            const touchesPoint = vectorLabelObstacles.some((point) =>
              point.x >= box.left - 5 && point.x <= box.right + 5 && point.y >= box.top - 5 && point.y <= box.bottom + 5
            );
            const touchesLine = allVectorGuides.some((guide) => {
              const guideStart = toScreen(guide.start, width, height);
              const guideEnd = toScreen(guide.end, width, height);
              return distanceToSegment(center, guideStart, guideEnd) < halfHeight + 5;
            });
            const insideCanvas = box.left >= padding && box.right <= width - padding && box.top >= padding && box.bottom <= height - padding;
            if (!touchesPoint && !touchesLine && insideCanvas) return center;
          }

          return {
            x: Math.max(halfWidth + padding, Math.min(width - halfWidth - padding, midpoint.x + normal.x * 30)),
            y: Math.max(halfHeight + padding, Math.min(height - halfHeight - padding, midpoint.y + normal.y * 30))
          };
        };

        allVectorGuides.forEach((g, idx) => {
          const s = toScreen(g.start, width, height);
          const e = toScreen(g.end, width, height);
          const stageIndex = Math.floor(idx / verticesPerStage);
          const stageColors = isDarkMode ? ['#fbbf24', '#67e8f9', '#c4b5fd', '#86efac', '#fda4af', '#fdba74'] : ['#ea580c', '#0f766e', '#7c3aed', '#15803d', '#be123c', '#c2410c'];
          const currentVectorColor = stageColors[stageIndex % stageColors.length];

          // Vector
          ctx.strokeStyle = currentVectorColor;
          ctx.fillStyle = currentVectorColor;
          ctx.lineWidth = Math.max(2.5, baseLW + 0.5);
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(e.x, e.y);
          ctx.stroke();

          // Flecha
          const ang = Math.atan2(e.y - s.y, e.x - s.x);
          const arrLen = 13;
          ctx.beginPath();
          ctx.moveTo(e.x, e.y);
          ctx.lineTo(
            e.x - arrLen * Math.cos(ang - Math.PI / 5),
            e.y - arrLen * Math.sin(ang - Math.PI / 5)
          );
          ctx.lineTo(
            e.x - arrLen * Math.cos(ang + Math.PI / 5),
            e.y - arrLen * Math.sin(ang + Math.PI / 5)
          );
          ctx.closePath();
          ctx.fill();

          const shouldShowVectorLabel = config.translationMode === 'vector'
            ? idx % verticesPerStage === 0
            : idx < showVectorLabels;
          if (shouldShowVectorLabel) {
            const vectorLabel = `v̅${stageIndex + 1} = (${formatNum(g.dx)}, ${formatNum(g.dy)})`;
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelWidth = ctx.measureText(vectorLabel).width;
            const labelHeight = 18;
            const labelPosition = getVectorLabelPosition(s, e, labelWidth, labelHeight, idx);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.strokeStyle = currentVectorColor;
            ctx.lineWidth = 1.2;
            ctx.fillRect(labelPosition.x - labelWidth / 2 - 5, labelPosition.y - 9, labelWidth + 10, 18);
            ctx.strokeRect(labelPosition.x - labelWidth / 2 - 5, labelPosition.y - 9, labelWidth + 10, 18);
            ctx.fillStyle = isDarkMode ? '#fff7ed' : '#431407';
            ctx.fillText(vectorLabel, labelPosition.x, labelPosition.y);
          }
        });
        ctx.restore();
      }

      // C) Rotación: Radios, arcos de trayectoria exacta, sectores angulares concéntricos, símbolos de 90° y badges didácticos de ángulo
      if (config.type === 'rotation' && engineResult.constructionElements.rotationArcs && engineResult.constructionElements.rotationArcs.length > 0) {
        ctx.save();
        const arcs = engineResult.constructionElements.rotationArcs;
        const stageColors = isDarkMode
          ? ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f472b6']
          : ['#d97706', '#0284c7', '#7c3aed', '#059669', '#db2777'];

        // 1. Dibujar trayectorias circulares para cada vértice en cada etapa (P -> P')
        arcs.forEach((g, idx) => {
          const arcCenter = g.center || config.center;
          const arcScr = toScreen(arcCenter, width, height);
          const stepIdx = g.stepIndex ?? 0;
          const stageColor = stageColors[stepIdx % stageColors.length];

          const s = toScreen(g.p, width, height);
          const e = toScreen(g.pPrime, width, height);
          const rPx = Math.hypot(s.x - arcScr.x, s.y - arcScr.y);
          if (rPx < 5) return;

          // En pantalla (Canvas Y hacia abajo):
          // - Giro Horario (g.angleDeg < 0): el ángulo en pantalla AUMENTA (isCCW = false).
          // - Giro Antihorario (g.angleDeg > 0): el ángulo en pantalla DISMINUYE (isCCW = true).
          const isCCW = g.counterClockwise;
          const sweepRad = (Math.abs(g.angleDeg) * Math.PI) / 180;
          const sAng = Math.atan2(s.y - arcScr.y, s.x - arcScr.x);
          const eAng = isCCW ? sAng - sweepRad : sAng + sweepRad;

          // Radios r desde el centro C hasta P y P'
          ctx.beginPath();
          ctx.moveTo(arcScr.x, arcScr.y);
          ctx.lineTo(s.x, s.y);
          ctx.moveTo(arcScr.x, arcScr.y);
          ctx.lineTo(e.x, e.y);
          const isPrimary = idx % Math.max(vertices.length, 1) === 0;
          if (isPrimary) {
            ctx.strokeStyle = stageColor;
            ctx.lineWidth = 1.6;
            ctx.setLineDash([4, 3]);
          } else {
            ctx.strokeStyle = `${stageColor}55`;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 4]);
          }
          ctx.stroke();

          // Arco de trayectoria circular exacto (con radio rPx real del vértice)
          ctx.beginPath();
          ctx.arc(arcScr.x, arcScr.y, rPx, sAng, eAng, isCCW);
          if (isPrimary) {
            ctx.strokeStyle = stageColor;
            ctx.lineWidth = baseLW;
            ctx.setLineDash([5, 3]);
          } else {
            ctx.strokeStyle = `${stageColor}88`;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([3, 3]);
          }
          ctx.stroke();

          // Flecha direccional en el punto de llegada e (P')
          const tangAng = isCCW ? eAng - Math.PI / 2 : eAng + Math.PI / 2;
          const arrowLen = isPrimary ? 9 : 7;
          ctx.fillStyle = stageColor;
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

        // 2. Indicadores Didácticos Centrales del Ángulo de Giro (Uno por cada giro sucesivo)
        const stepIndices = Array.from(new Set(arcs.map((a) => a.stepIndex ?? 0))).sort((a, b) => a - b);
        const totalSteps = stepIndices.length;

        stepIndices.forEach((stepIdx) => {
          const stepArc = arcs.find((a) => (a.stepIndex ?? 0) === stepIdx);
          if (!stepArc || Math.abs(stepArc.angleDeg) < 0.1) return;

          const arcCenter = stepArc.center || config.center;
          const cScr = toScreen(arcCenter, width, height);
          const sRef = toScreen(stepArc.p, width, height);
          const rRef = Math.hypot(sRef.x - cScr.x, sRef.y - cScr.y);
          if (rRef < 8) return;

          const stageColor = stageColors[stepIdx % stageColors.length];
          const isCCW = stepArc.counterClockwise;
          const sweepRad = (Math.abs(stepArc.angleDeg) * Math.PI) / 180;
          const sAng = Math.atan2(sRef.y - cScr.y, sRef.x - cScr.x);
          const eAng = isCCW ? sAng - sweepRad : sAng + sweepRad;

          // Radio concéntrico diferenciado para cada giro (evita superposición visual si comparten centro)
          const baseSectorR = Math.min(32, Math.max(22, rRef * 0.28));
          const sectorStep = Math.min(18, Math.max(12, (rRef * 0.65 - baseSectorR) / Math.max(totalSteps, 1)));
          const sectorR = baseSectorR + stepIdx * sectorStep;

          // A) Sector sombreado translúcido entre los dos rayos
          ctx.fillStyle = isDarkMode ? `${stageColor}2e` : `${stageColor}22`;
          ctx.beginPath();
          ctx.moveTo(cScr.x, cScr.y);
          ctx.arc(cScr.x, cScr.y, sectorR, sAng, eAng, isCCW);
          ctx.closePath();
          ctx.fill();

          // B) Borde del arco del ángulo con línea continua nítida
          ctx.strokeStyle = stageColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(cScr.x, cScr.y, sectorR, sAng, eAng, isCCW);
          ctx.stroke();

          // Flecha en el arco del sector angular indicando la dirección de rotación
          if (sweepRad > 0.25) {
            const arcFrac = 0.85;
            const arcArrowAng = isCCW ? sAng - sweepRad * arcFrac : sAng + sweepRad * arcFrac;
            const arcEndScr = {
              x: cScr.x + sectorR * Math.cos(arcArrowAng),
              y: cScr.y + sectorR * Math.sin(arcArrowAng)
            };
            const arcTang = isCCW ? arcArrowAng - Math.PI / 2 : arcArrowAng + Math.PI / 2;
            ctx.fillStyle = stageColor;
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
          }

          // C) Símbolo clásico de 90° (cuadradito perpendicular) si el ángulo es 90° o 270°
          const isRightAngle = Math.abs(stepArc.angleDeg % 180) === 90;
          if (isRightAngle) {
            const sqSize = Math.min(13, sectorR * 0.5);
            const u1 = { x: Math.cos(sAng), y: Math.sin(sAng) };
            const u2 = { x: Math.cos(eAng), y: Math.sin(eAng) };
            const p1 = { x: cScr.x + sqSize * u1.x, y: cScr.y + sqSize * u1.y };
            const pCorner = {
              x: cScr.x + sqSize * (u1.x + u2.x),
              y: cScr.y + sqSize * (u1.y + u2.y)
            };
            const p2 = { x: cScr.x + sqSize * u2.x, y: cScr.y + sqSize * u2.y };

            ctx.strokeStyle = stageColor;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(pCorner.x, pCorner.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            ctx.fillStyle = stageColor;
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

          // D) Placa / Badge Prominente del Ángulo (p. ej. "α₁ = -90° ↻")
          const bisectorAng = isCCW ? sAng - sweepRad / 2 : sAng + sweepRad / 2;
          const badgeDist = sectorR + 24;
          const badgeX = cScr.x + badgeDist * Math.cos(bisectorAng);
          const badgeY = cScr.y + badgeDist * Math.sin(bisectorAng);

          const dirSymbol = isCCW ? '↺' : '↻';
          const signStr = isCCW ? '+' : '-';
          const subIndices = ['₁', '₂', '₃', '₄', '₅', '₆'];
          const subChar = subIndices[stepIdx] || `${stepIdx + 1}`;
          const badgeText = totalSteps > 1
            ? `α${subChar} = ${signStr}${Math.abs(stepArc.angleDeg)}° ${dirSymbol}`
            : `α = ${signStr}${Math.abs(stepArc.angleDeg)}° ${dirSymbol}`;

          ctx.font = 'bold 13px "Inter", sans-serif';
          const tMetrics = ctx.measureText(badgeText);
          const bW = tMetrics.width + 16;
          const bH = 22;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
          ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
          ctx.strokeStyle = stageColor;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(badgeX - bW / 2, badgeY - bH / 2, bW, bH, 11);
          } else {
            ctx.rect(badgeX - bW / 2, badgeY - bH / 2, bW, bH);
          }
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = stageColor;
          ctx.font = 'bold 13px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, badgeX, badgeY);
        });

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
    const additionalReflectionColors = [
      { stroke: '#db2777', fill: 'rgba(219, 39, 119, 0.12)' },
      { stroke: '#ea580c', fill: 'rgba(234, 88, 12, 0.12)' },
      { stroke: '#0891b2', fill: 'rgba(8, 145, 178, 0.12)' },
      { stroke: '#65a30d', fill: 'rgba(101, 163, 13, 0.12)' },
      { stroke: '#be123c', fill: 'rgba(190, 18, 60, 0.12)' },
      { stroke: '#0f766e', fill: 'rgba(15, 118, 110, 0.12)' }
    ];
    const labelBoxes: Array<{ left: number; top: number; right: number; bottom: number }> = [];
    const pointObstacles = [
      ...vertices,
      ...transformedVertices,
      ...additionalReflectionVertices.flat()
    ].map((point) => toScreen(point, width, height));
    const getLabelPosition = (point: { x: number; y: number }, textWidth: number) => {
      const candidates = [
        { x: point.x + 8, y: point.y - 8, align: 'left' as CanvasTextAlign },
        { x: point.x + 8, y: point.y + 16, align: 'left' as CanvasTextAlign },
        { x: point.x - 8, y: point.y - 8, align: 'right' as CanvasTextAlign },
        { x: point.x - 8, y: point.y + 16, align: 'right' as CanvasTextAlign },
        { x: point.x, y: point.y - 16, align: 'center' as CanvasTextAlign }
      ];
      const margin = 3;
      for (const candidate of candidates) {
        const left = candidate.align === 'right' ? candidate.x - textWidth : candidate.align === 'center' ? candidate.x - textWidth / 2 : candidate.x;
        const box = { left, top: candidate.y - 8, right: left + textWidth, bottom: candidate.y + 8 };
        const overlapsPoint = pointObstacles.some((obstacle) =>
          obstacle !== point && obstacle.x + pRad + margin > box.left && obstacle.x - pRad - margin < box.right && obstacle.y + pRad + margin > box.top && obstacle.y - pRad - margin < box.bottom
        );
        const overlapsLabel = labelBoxes.some((other) => other.left < box.right && other.right > box.left && other.top < box.bottom && other.bottom > box.top);
        if (!overlapsPoint && !overlapsLabel && box.left >= 4 && box.right <= width - 4 && box.top >= 4 && box.bottom <= height - 4) {
          labelBoxes.push(box);
          return candidate;
        }
      }
      const fallback = candidates[0];
      labelBoxes.push({ left: fallback.x, top: fallback.y - 8, right: fallback.x + textWidth, bottom: fallback.y + 8 });
      return fallback;
    };
    const drawSideMeasurement = (pA: Point, pB: Point, color: string) => {
      const start = toScreen(pA, width, height);
      const end = toScreen(pB, width, height);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.hypot(dx, dy);
      if (length < 1) return;

      const normalX = -dy / length;
      const normalY = dx / length;
      const text = formatNum(distance(pA, pB));
      ctx.save();
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(text).width;
      const labelX = midX + normalX * 12;
      const labelY = midY + normalY * 12;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = 1;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(labelX - textWidth / 2 - 4, labelY - 8, textWidth + 8, 16, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(labelX - textWidth / 2 - 4, labelY - 8, textWidth + 8, 16);
      }
      ctx.fillStyle = color;
      ctx.fillText(text, labelX, labelY);
      ctx.restore();
    };

    // Las reflexiones adicionales se dibujan antes de la imagen principal para conservar su lectura visual.
    if (showTransformed && additionalReflectionVertices.length > 0) {
      additionalReflectionVertices.forEach((image, imageIndex) => {
        const colors = additionalReflectionColors[imageIndex % additionalReflectionColors.length];
        ctx.save();
        ctx.strokeStyle = colors.stroke;
        ctx.fillStyle = colors.fill;
        ctx.lineWidth = baseLW + 0.2;
        ctx.setLineDash([]);

        if (isPolygon && image.length >= 3) {
          ctx.beginPath();
          const first = toScreen(image[0], width, height);
          ctx.moveTo(first.x, first.y);
          image.slice(1).forEach((point) => {
            const screenPoint = toScreen(point, width, height);
            ctx.lineTo(screenPoint.x, screenPoint.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          if (toggles.showSideLengths) {
            for (let i = 0; i < image.length; i++) {
              drawSideMeasurement(image[i], image[(i + 1) % image.length], colors.stroke);
            }
          }
        } else {
          segments.forEach(([a, b]) => {
            if (!image[a] || !image[b]) return;
            const start = toScreen(image[a], width, height);
            const end = toScreen(image[b], width, height);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
            if (toggles.showSideLengths) drawSideMeasurement(image[a], image[b], colors.stroke);
          });
        }

        if (toggles.showPoints) image.forEach((point, pointIndex) => {
          const screenPoint = toScreen(point, width, height);
          ctx.beginPath();
          ctx.arc(screenPoint.x, screenPoint.y, pRad - 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = baseLW - 0.2;
          ctx.stroke();
          if (showLabels) {
            const cleanName = (point.label || String.fromCharCode(65 + pointIndex)).replace(/'/g, '');
            const labelText = `${cleanName}' (${formatNum(point.x)}, ${formatNum(point.y)})`;
            ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
            const labelPosition = getLabelPosition(screenPoint, ctx.measureText(labelText).width);
            ctx.textAlign = labelPosition.align;
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.strokeText(labelText, labelPosition.x, labelPosition.y);
            ctx.fillStyle = colors.stroke;
            ctx.fillText(labelText, labelPosition.x, labelPosition.y);
          }
        });
        ctx.restore();
      });
    }

    // A) CASO 1: POLÍGONO CERRADO (isPolygon && vertices.length >= 3)
    if (isPolygon && vertices.length >= 3) {
      // Dibujar polígono F' transformado (relleno + borde)
      if (showTransformed && transformedVertices.length >= 3) {
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
            drawSideMeasurement(pA, pB, transStroke);
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
          drawSideMeasurement(pA, pB, preStroke);
        }
      }
    } else {
      // B) CASO 2: SEGMENTOS ABIERTOS O PUNTOS LIBRES
      // Dibujar cada segmento declarado en `segments` (sin rellenar, sin cerrar a triángulo)
      segments.forEach(([a, b]) => {
        // Segmento en figura transformada F'
        if (showTransformed && transformedVertices[a] && transformedVertices[b]) {
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
            drawSideMeasurement(transformedVertices[a], transformedVertices[b], transStroke);
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
            drawSideMeasurement(vertices[a], vertices[b], preStroke);
          }
        }
      });

      // Línea elástica (rubber-band) si se está usando la herramienta Segmento
      if (
        !isExport &&
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

    // C) ETAPAS INTERMEDIAS DE LA CADENA DE TRASLACIONES.
    if (config.type === 'translation' && translationStages.length > 1) {
      const stageColors = isDarkMode ? ['#67e8f9', '#c4b5fd', '#86efac', '#fda4af', '#fdba74'] : ['#0f766e', '#7c3aed', '#15803d', '#be123c', '#c2410c'];
      translationStages.slice(0, -1).forEach((stage, stageIndex) => {
        const stageColor = stageColors[stageIndex % stageColors.length];
        ctx.save();
        ctx.globalAlpha = 0.72;
        ctx.strokeStyle = stageColor;
        ctx.fillStyle = `${stageColor}18`;
        ctx.lineWidth = baseLW + 0.1;
        if (isPolygon && stage.length >= 3) {
          ctx.beginPath();
          const first = toScreen(stage[0], width, height);
          ctx.moveTo(first.x, first.y);
          stage.slice(1).forEach((point) => {
            const screenPoint = toScreen(point, width, height);
            ctx.lineTo(screenPoint.x, screenPoint.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          segments.forEach(([from, to]) => {
            if (!stage[from] || !stage[to]) return;
            const start = toScreen(stage[from], width, height);
            const end = toScreen(stage[to], width, height);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          });
        }
        if (toggles.showPoints) {
          stage.forEach((point) => {
            const screenPoint = toScreen(point, width, height);
            ctx.beginPath();
            ctx.arc(screenPoint.x, screenPoint.y, pRad - 0.8, 0, Math.PI * 2);
            ctx.fillStyle = stageColor;
            ctx.fill();
          });
        }
        ctx.restore();
      });
    }

    // D) ETAPAS INTERMEDIAS DE LA CADENA DE ROTACIONES SUCESIVAS.
    if (config.type === 'rotation' && rotationStages.length > 1) {
      const stageColors = isDarkMode
        ? ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f472b6']
        : ['#d97706', '#0284c7', '#7c3aed', '#059669', '#db2777'];
      rotationStages.slice(0, -1).forEach((stage, stageIndex) => {
        const stageColor = stageColors[stageIndex % stageColors.length];
        ctx.save();
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = stageColor;
        ctx.fillStyle = `${stageColor}18`;
        ctx.lineWidth = baseLW + 0.1;
        if (isPolygon && stage.length >= 3) {
          ctx.beginPath();
          const first = toScreen(stage[0], width, height);
          ctx.moveTo(first.x, first.y);
          stage.slice(1).forEach((point) => {
            const screenPoint = toScreen(point, width, height);
            ctx.lineTo(screenPoint.x, screenPoint.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          segments.forEach(([from, to]) => {
            if (!stage[from] || !stage[to]) return;
            const start = toScreen(stage[from], width, height);
            const end = toScreen(stage[to], width, height);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          });
        }
        if (toggles.showPoints) {
          stage.forEach((point) => {
            const screenPoint = toScreen(point, width, height);
            ctx.beginPath();
            ctx.arc(screenPoint.x, screenPoint.y, pRad - 0.8, 0, Math.PI * 2);
            ctx.fillStyle = stageColor;
            ctx.fill();
          });
        }
        ctx.restore();
      });
    }

    // C) COMPATIBILIDAD CON LA SEGUNDA IMAGEN LEGACY.
    if (config.type === 'translation' && secondaryTransformedVertices.length > 0 && translationStages.length === 0) {
      const secondaryStroke = isDarkMode ? '#67e8f9' : '#0f766e';
      const secondaryFill = isDarkMode ? 'rgba(103, 232, 249, 0.16)' : 'rgba(15, 118, 110, 0.12)';
      ctx.save();
      if (isPolygon && secondaryTransformedVertices.length >= 3) {
        ctx.beginPath();
        const first = toScreen(secondaryTransformedVertices[0], width, height);
        ctx.moveTo(first.x, first.y);
        secondaryTransformedVertices.slice(1).forEach((point) => {
          const screenPoint = toScreen(point, width, height);
          ctx.lineTo(screenPoint.x, screenPoint.y);
        });
        ctx.closePath();
        ctx.fillStyle = secondaryFill;
        ctx.fill();
        ctx.strokeStyle = secondaryStroke;
        ctx.lineWidth = baseLW + 0.2;
        ctx.stroke();
      } else {
        segments.forEach(([from, to]) => {
          const start = secondaryTransformedVertices[from];
          const end = secondaryTransformedVertices[to];
          if (!start || !end) return;
          const startScreen = toScreen(start, width, height);
          const endScreen = toScreen(end, width, height);
          ctx.strokeStyle = secondaryStroke;
          ctx.lineWidth = baseLW + 0.2;
          ctx.beginPath();
          ctx.moveTo(startScreen.x, startScreen.y);
          ctx.lineTo(endScreen.x, endScreen.y);
          ctx.stroke();
        });
      }
      ctx.restore();
    }

    // C) DIBUJAR VÉRTICES (Puntos y sus etiquetas anti-colisión)
    const renderedPointKeys = new Set<string>();
    const drawVertexMarker = (
      point: Point,
      radius: number,
      fillStyle: string,
      strokeStyle = '#ffffff',
      lineWidth = baseLW - 0.2
    ) => {
      const pScr = toScreen(point, width, height);
      const key = `${Math.round(pScr.x * 10)}:${Math.round(pScr.y * 10)}`;
      if (renderedPointKeys.has(key)) return;
      renderedPointKeys.add(key);

      ctx.beginPath();
      ctx.arc(pScr.x, pScr.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillStyle;
      ctx.fill();
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    };

    // 1. Vértices de F' (Transformada final)
    if (showTransformed && toggles.showPoints) transformedVertices.forEach((pt, i) => {
      const pScr = toScreen(pt, width, height);
      const stageColors = isDarkMode
        ? ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f472b6']
        : ['#d97706', '#0284c7', '#7c3aed', '#059669', '#db2777'];
      const finalVertexColor = config.type === 'rotation' && rotationStages.length > 0
        ? stageColors[(rotationStages.length - 1) % stageColors.length]
        : transStroke;

      drawVertexMarker(pt, pRad - 0.5, finalVertexColor);

      if (showLabels && !(config.type === 'reflection' && toggles.showReflectionDistances)) {
        const cleanName = (vertices[i]?.label || pt.label || String.fromCharCode(65 + i)).replace(/'/g, '');
        const primeSuffix = config.type === 'rotation' && rotationStages.length > 1
          ? "'".repeat(rotationStages.length)
          : "'";
        const labelText = showAxes
          ? `${cleanName}${primeSuffix} (${formatNum(pt.x)}, ${formatNum(pt.y)})`
          : `${cleanName}${primeSuffix}`;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const labelPosition = getLabelPosition(pScr, textWidth);
        ctx.textAlign = labelPosition.align;
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(labelText, labelPosition.x, labelPosition.y);
        ctx.fillStyle = finalVertexColor;
        ctx.fillText(labelText, labelPosition.x, labelPosition.y);
      }
    });

    // 1.b Vértices de etapas intermedias de rotación
    if (showTransformed && config.type === 'rotation' && rotationStages.length > 1 && toggles.showPoints) {
      const stageColors = isDarkMode
        ? ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f472b6']
        : ['#d97706', '#0284c7', '#7c3aed', '#059669', '#db2777'];
      rotationStages.slice(0, -1).forEach((stage, stageIndex) => {
        const stageColor = stageColors[stageIndex % stageColors.length];
        const primeSuffix = "'".repeat(stageIndex + 1);
        stage.forEach((pt, i) => {
          const pScr = toScreen(pt, width, height);
          drawVertexMarker(pt, pRad - 0.8, stageColor);
          if (showLabels) {
            const baseName = (vertices[i]?.label || String.fromCharCode(65 + i)).replace(/'/g, '');
            const labelText = showAxes
              ? `${baseName}${primeSuffix} (${formatNum(pt.x)}, ${formatNum(pt.y)})`
              : `${baseName}${primeSuffix}`;
            ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
            const textWidth = ctx.measureText(labelText).width;
            const labelPosition = getLabelPosition(pScr, textWidth);
            ctx.textAlign = labelPosition.align;
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.strokeText(labelText, labelPosition.x, labelPosition.y);
            ctx.fillStyle = stageColor;
            ctx.fillText(labelText, labelPosition.x, labelPosition.y);
          }
        });
      });
    }

    if (showTransformed && config.type !== 'rotation' && toggles.showPoints) secondaryTransformedVertices.forEach((pt, i) => {
      const pScr = toScreen(pt, width, height);
      drawVertexMarker(pt, pRad - 0.5, isDarkMode ? '#67e8f9' : '#0f766e');
      if (showLabels && !(config.type === 'reflection' && toggles.showReflectionDistances)) {
        const baseName = vertices[i]?.label || String.fromCharCode(65 + i);
        const labelText = showAxes
          ? `${baseName}'' (${formatNum(pt.x)}, ${formatNum(pt.y)})`
          : `${baseName}''`;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const labelPosition = getLabelPosition(pScr, textWidth);
        ctx.textAlign = labelPosition.align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDarkMode ? '#cffafe' : '#115e59';
        ctx.fillText(labelText, labelPosition.x, labelPosition.y);
      }
    });

    // 2. Vértices de F (Original)
    if (toggles.showPoints) vertices.forEach((pt, i) => {
      const pScr = toScreen(pt, width, height);
      const isHovered = !isExport && hoveredVertexIndex === i;
      const isSegmentSelected = !isExport && tool === 'segment' && segmentStartVertex === i;

      // Resaltado visual si está seleccionado como inicio de segmento
      if (isSegmentSelected) {
        ctx.beginPath();
        ctx.arc(pScr.x, pScr.y, pRad * 2, 0, Math.PI * 2);
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      drawVertexMarker(pt, isHovered || isSegmentSelected ? pRad + 1.5 : pRad, isHovered ? '#10b981' : isSegmentSelected ? '#2563eb' : (pt.color || preStroke));

      if (showLabels && !(config.type === 'reflection' && toggles.showReflectionDistances)) {
        const cleanName = (pt.label || String.fromCharCode(65 + i)).replace(/'/g, '');
        const labelText = showAxes
          ? `${cleanName} (${formatNum(pt.x)}, ${formatNum(pt.y)})`
          : cleanName;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const labelPosition = getLabelPosition(pScr, textWidth);
        ctx.textAlign = labelPosition.align;
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = isDarkMode ? '#0b0f19' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        ctx.strokeText(labelText, labelPosition.x, labelPosition.y);
        ctx.fillStyle = isDarkMode ? '#bae6fd' : '#0c4a6e';
        ctx.fillText(labelText, labelPosition.x, labelPosition.y);
      }
    });

    // Capa final de distancias: queda por encima de las figuras para mantener trazos continuos y uniformes.
    if (config.type === 'reflection' && toggles.showReflectionDistances) {
      const reflectionGuideColors = [
        '#dc2626', '#2563eb', '#16a34a', '#9333ea',
        '#ea580c', '#0891b2', '#be123c', '#65a30d'
      ];
      const distanceLabelBoxes: Array<{ left: number; top: number; right: number; bottom: number }> = [];
      const distancePointObstacles = [
        ...vertices,
        ...transformedVertices,
        ...additionalReflectionVertices.flat()
      ].map((point) => toScreen(point, width, height));
      const allDistanceGuides = [
        ...(engineResult.constructionElements.perpendicularGuides || []),
        ...additionalReflectionGuides.flat()
      ];
      const pointLabelLines: Array<{ start: { x: number; y: number }; end: { x: number; y: number } }> = [];
      const addPointLabelLines = (points: Point[], closed: boolean) => {
        if (points.length < 2) return;
        for (let index = 0; index < points.length - 1; index++) {
          pointLabelLines.push({
            start: toScreen(points[index], width, height),
            end: toScreen(points[index + 1], width, height)
          });
        }
        if (closed) {
          pointLabelLines.push({
            start: toScreen(points[points.length - 1], width, height),
            end: toScreen(points[0], width, height)
          });
        }
      };
      addPointLabelLines(vertices, isPolygon);
      addPointLabelLines(transformedVertices, isPolygon);
      additionalReflectionVertices.forEach((points) => addPointLabelLines(points, isPolygon));
      if (!isPolygon) {
        segments.forEach(([from, to]) => {
          if (vertices[from] && vertices[to]) pointLabelLines.push({ start: toScreen(vertices[from], width, height), end: toScreen(vertices[to], width, height) });
          if (transformedVertices[from] && transformedVertices[to]) pointLabelLines.push({ start: toScreen(transformedVertices[from], width, height), end: toScreen(transformedVertices[to], width, height) });
        });
      }
      const pointToSegmentDistance = (
        point: { x: number; y: number },
        start: { x: number; y: number },
        end: { x: number; y: number }
      ) => {
        const segmentX = end.x - start.x;
        const segmentY = end.y - start.y;
        const segmentLength = segmentX * segmentX + segmentY * segmentY || 1;
        const projection = Math.max(0, Math.min(1, ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / segmentLength));
        return Math.hypot(point.x - (start.x + projection * segmentX), point.y - (start.y + projection * segmentY));
      };
      const drawDistanceRail = (
        guide: { p: Point; pPrime: Point; footH: Point },
        color: string,
        guideIndex: number
      ) => {
        const start = toScreen(guide.p, width, height);
        const end = toScreen(guide.pPrime, width, height);
        const foot = toScreen(guide.footH, width, height);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy) || 1;
        const normalX = -dy / length;
        const normalY = dx / length;
        const baseSide = guideIndex % 2 === 0 ? 1 : -1;
        const laneOffset = ((guideIndex % 5) - 2) * 3.5;
        const laneStart = { x: start.x + normalX * laneOffset, y: start.y + normalY * laneOffset };
        const laneEnd = { x: end.x + normalX * laneOffset, y: end.y + normalY * laneOffset };
        const laneFoot = { x: foot.x + normalX * laneOffset, y: foot.y + normalY * laneOffset };
        const dash = guideIndex % 2 === 0 ? [5, 4] : [8, 4];

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.strokeStyle = `${color}66`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(laneStart.x, laneStart.y);
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(laneEnd.x, laneEnd.y);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5.5;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(laneStart.x, laneStart.y);
        ctx.lineTo(laneEnd.x, laneEnd.y);
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.25;
        ctx.stroke();

        const value = formatNum(distance(guide.p, guide.footH));
        const drawHalfLabel = (a: { x: number; y: number }, b: { x: number; y: number }, side: 1 | -1) => {
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const textWidth = ctx.measureText(value).width;
          const segmentMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const halfWidth = textWidth / 2 + 5;
          const halfHeight = 15;
          const segmentDx = b.x - a.x;
          const segmentDy = b.y - a.y;
          const segmentLength = Math.hypot(segmentDx, segmentDy) || 1;
          const tangentX = segmentDx / segmentLength;
          const tangentY = segmentDy / segmentLength;
          const candidates = [
            { offset: 20 * side, along: 0 },
            { offset: 20 * side, along: -18 },
            { offset: 20 * side, along: 18 },
            { offset: 26 * side, along: -28 },
            { offset: 26 * side, along: 28 },
            { offset: 20 * -side, along: 0 },
            { offset: 20 * -side, along: -18 },
            { offset: 20 * -side, along: 18 }
          ];
          let position: { x: number; y: number } | null = null;

          for (const offset of candidates) {
            const candidate = {
              x: segmentMid.x + tangentX * offset.along + normalX * offset.offset,
              y: segmentMid.y + tangentY * offset.along + normalY * offset.offset
            };
            const box = {
              left: candidate.x - halfWidth,
              right: candidate.x + halfWidth,
              top: candidate.y - halfHeight,
              bottom: candidate.y + halfHeight
            };
            const intersectsPoint = distancePointObstacles.some((point) =>
              point.x >= box.left - 4 && point.x <= box.right + 4 && point.y >= box.top - 4 && point.y <= box.bottom + 4
            );
            const intersectsLabel = distanceLabelBoxes.some((other) =>
              other.left < box.right && other.right > box.left && other.top < box.bottom && other.bottom > box.top
            );
            const intersectsRail = allDistanceGuides.some((otherGuide) => {
              const otherStart = toScreen(otherGuide.p, width, height);
              const otherEnd = toScreen(otherGuide.pPrime, width, height);
              return pointToSegmentDistance(candidate, otherStart, otherEnd) < halfHeight + 3;
            });
            if (!intersectsPoint && !intersectsLabel && !intersectsRail && box.left >= 5 && box.right <= width - 5 && box.top >= 5 && box.bottom <= height - 5) {
              position = candidate;
              distanceLabelBoxes.push(box);
              break;
            }
          }

          if (!position) {
            position = {
              x: Math.max(halfWidth + 5, Math.min(width - halfWidth - 5, segmentMid.x + normalX * 28 * side)),
              y: Math.max(halfHeight + 5, Math.min(height - halfHeight - 5, segmentMid.y + normalY * 28 * side))
            };
            distanceLabelBoxes.push({
              left: position.x - halfWidth,
              right: position.x + halfWidth,
              top: position.y - halfHeight,
              bottom: position.y + halfHeight
            });
          }
          ctx.setLineDash([]);
          ctx.strokeStyle = `${color}99`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(segmentMid.x, segmentMid.y);
          ctx.lineTo(position.x, position.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = isDarkMode ? 'rgba(15, 23, 42, 0.98)' : '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.fillRect(position.x - textWidth / 2 - 4, position.y - 8, textWidth + 8, 16);
          ctx.strokeRect(position.x - textWidth / 2 - 4, position.y - 8, textWidth + 8, 16);
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, position.x, position.y);
          ctx.shadowBlur = 0;
        };

        drawHalfLabel(laneStart, laneFoot, -baseSide as 1 | -1);
        drawHalfLabel(laneFoot, laneEnd, baseSide as 1 | -1);
        ctx.restore();
      };

      engineResult.constructionElements.perpendicularGuides?.forEach((guide, guideIndex) => {
        drawDistanceRail(guide, reflectionGuideColors[guideIndex % reflectionGuideColors.length], guideIndex);
      });
      additionalReflectionGuides.forEach((guides, axisIndex) => {
        guides.forEach((guide, pointIndex) => {
          const color = reflectionGuideColors[(axisIndex * 3 + pointIndex + 1) % reflectionGuideColors.length];
          drawDistanceRail(guide, color, pointIndex);
        });
      });

      // Las coordenadas se dibujan al final para que ningún riel pueda atravesarlas.
      const drawTopPointLabel = (point: Point, index: number, color: string, suffix = '') => {
        if (!showLabels) return;

        const screenPoint = toScreen(point, width, height);
        const baseName = (point.label || String.fromCharCode(65 + index)).replace(/'/g, '');
        const labelText = `${baseName}${suffix} (${formatNum(point.x)}, ${formatNum(point.y)})`;
        ctx.font = 'bold 13px "Inter", -apple-system, sans-serif';
        const textWidth = ctx.measureText(labelText).width;
        const labelCandidates = [
          { x: screenPoint.x + 9, y: screenPoint.y - 10, align: 'left' as CanvasTextAlign },
          { x: screenPoint.x + 9, y: screenPoint.y + 18, align: 'left' as CanvasTextAlign },
          { x: screenPoint.x - 9, y: screenPoint.y - 10, align: 'right' as CanvasTextAlign },
          { x: screenPoint.x - 9, y: screenPoint.y + 18, align: 'right' as CanvasTextAlign },
          { x: screenPoint.x, y: screenPoint.y - 22, align: 'center' as CanvasTextAlign }
        ];
        const labelPosition = labelCandidates.find((candidate) => {
          const left = candidate.align === 'right' ? candidate.x - textWidth : candidate.align === 'center' ? candidate.x - textWidth / 2 : candidate.x;
          const right = left + textWidth;
          const center = { x: (left + right) / 2, y: candidate.y };
          return pointLabelLines.every((line) => pointToSegmentDistance(center, line.start, line.end) > 14) && left >= 4 && right <= width - 4 && candidate.y - 9 >= 4 && candidate.y + 9 <= height - 4;
        }) || labelCandidates[0];
        const pointLabelColor = isDarkMode ? '#f8fafc' : '#111827';
        ctx.textAlign = labelPosition.align;
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = isDarkMode ? '#0b0f19' : '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(labelText, labelPosition.x, labelPosition.y);
        ctx.fillStyle = pointLabelColor;
        ctx.fillText(labelText, labelPosition.x, labelPosition.y);
      };

      transformedVertices.forEach((point, index) => drawTopPointLabel(
        { ...point, label: vertices[index]?.label || String.fromCharCode(65 + index) },
        index,
        transStroke,
        "'"
      ));
      secondaryTransformedVertices.forEach((point, index) => drawTopPointLabel(
        { ...point, label: vertices[index]?.label || String.fromCharCode(65 + index) },
        index,
        isDarkMode ? '#67e8f9' : '#0f766e',
        "''"
      ));
      vertices.forEach((point, index) => drawTopPointLabel(point, index, point.color || preStroke));
    }

    // 5.b TRAZADO DE EJES DE SIMETRÍA (CORTES DE LA FIGURA)
    if (showSymmetryAxes && symmetryResult.axes.length > 0) {
      ctx.save();
      symmetryResult.axes.forEach((axis, idx) => {
        const isHighlighted = selectedSymmetryAxisId === 'all' || selectedSymmetryAxisId === axis.id;
        if (!isHighlighted) return;

        const s1 = toScreen(axis.p1, width, height);
        const s2 = toScreen(axis.p2, width, height);

        // 1. Línea discontinua de corte de simetría (estilo raya-punto)
        ctx.save();
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = selectedSymmetryAxisId === axis.id ? 3.2 : 2.2;
        ctx.setLineDash([10, 5, 2, 5]);
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();

        // 2. Badges en los extremos E_i
        const labelText = `E${idx + 1}`;
        [s1, s2].forEach((endPt) => {
          const badgeR = 12;
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = axis.color;
          ctx.beginPath();
          ctx.arc(endPt.x, endPt.y, badgeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = isDarkMode ? '#0f172a' : '#ffffff';
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px "Inter", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, endPt.x, endPt.y);
        });

        // 3. Etiqueta con la ecuación cerca de s2 si está seleccionado o son pocos cortes
        if (selectedSymmetryAxisId === axis.id || symmetryResult.axes.length <= 4) {
          const eqText = `${labelText}: ${axis.equation}`;
          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          const textW = ctx.measureText(eqText).width;
          const pillW = textW + 14;
          const pillH = 22;

          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.hypot(dx, dy) || 1;
          const badgeR = 12;
          const offsetDist = Math.max(54, pillW / 2 + badgeR + 10);
          const pillX = s2.x + (dx / dist) * offsetDist;
          const pillY = s2.y + (dy / dist) * offsetDist;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = isDarkMode ? '#1e293b' : '#ffffff';
          ctx.strokeStyle = axis.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(pillX - pillW / 2, pillY - pillH / 2, pillW, pillH, 6);
          } else {
            ctx.rect(pillX - pillW / 2, pillY - pillH / 2, pillW, pillH);
          }
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = axis.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(eqText, pillX, pillY);
        }
        ctx.restore();
      });
      ctx.restore();
    }

    // 6. CABECERA DIDÁCTICA SUPERIOR ELEGANTE (SÓLO PARA EXPORTACIÓN)
    if (isExport && options.headerInfo) {
      const hInfo = options.headerInfo;
      ctx.save();
      const hGrad = ctx.createLinearGradient(0, 0, width, 0);
      hGrad.addColorStop(0, '#0f172a');
      hGrad.addColorStop(0.5, '#1e293b');
      hGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = hGrad;
      ctx.fillRect(0, 0, width, headerHeight);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, headerHeight);
      ctx.lineTo(width, headerHeight);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('GeoTransform Pro', 24, headerHeight / 2 - 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillText('Laboratorio de Geometría Dinámica', 24, headerHeight / 2 + 10);

      const centerTitle = hInfo.title?.trim()
        ? (hInfo.title.length > 70 ? hInfo.title.slice(0, 68) + '...' : hInfo.title)
        : (hInfo.type === 'rotation'
          ? 'Rotación en el Plano Cartesiano'
          : hInfo.type === 'translation'
          ? 'Traslación Vectorial en el Plano'
          : hInfo.type === 'reflection'
          ? 'Simetría Axial en el Plano'
          : hInfo.type === 'homothety'
          ? 'Homotecia y Proporcionalidad'
          : 'Simetría Central en el Plano');

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(centerTitle, width / 2, headerHeight / 2);

      const isTeacher = hInfo.variant === 'teacher';
      const badgeText = isTeacher ? 'Guía Docente • Solución' : 'Hoja de Trabajo • Alumno';
      const badgeBorder = isTeacher ? '#a855f7' : '#3b82f6';
      const badgeBg = isTeacher ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)';
      const badgeTextColor = isTeacher ? '#d8b4fe' : '#93c5fd';

      ctx.font = 'bold 11px "Inter", sans-serif';
      const bW = ctx.measureText(badgeText).width + 20;
      const bH = 26;
      const bX = width - bW - 24;
      const bY = (headerHeight - bH) / 2;

      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(bX, bY, bW, bH, 8);
      } else {
        ctx.rect(bX, bY, bW, bH);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = badgeTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bX + bW / 2, bY + bH / 2);
      ctx.restore();
    }
  }, [
    lineThickness,
    pointSize,
    isDarkMode,
    gridStyle,
    config,
    engineResult,
    vertices,
    transformedVertices,
    secondaryTransformedVertices,
    ...translationStages.flat(),
    translationStages,
    ...rotationStages.flat(),
    rotationStages,
    additionalReflectionVertices,
    additionalReflectionGuides,
    activeReflectionAxes,
    segments,
    isPolygon,
    segmentStartVertex,
    mouseCoord,
    tool,
    hoveredVertexIndex,
    isHoveringPivot,
    isHoveringReflectionLine,
    activePivot,
    showLabels,
    toggles,
    showSymmetryAxes,
    selectedSymmetryAxisId,
    symmetryResult
  ]);

  // RENDERIZADO DEL LIENZO INTERACTIVO
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = canvasDimensions.width || rect.width;
    const height = canvasDimensions.height || rect.height;

    if (width <= 0 || height <= 0) return;

    drawGeometryPlane(canvas, width, height, scale, pan, dpr, { isExport: false });
  }, [isActive, canvasDimensions, drawGeometryPlane, scale, pan]);

  // LÓGICA DE INTERACCIÓN UNIFICADA (MOUSE Y TOUCH TÁCTIL)
  const handleInteractionStart = (
    clientX: number,
    clientY: number,
    screenX: number,
    screenY: number,
    width: number,
    height: number
  ) => {
    // Herramienta Punto: colocar vértice libre independiente en el plano
    if (tool === 'point') {
      commitAction();
      const cart = toCartesian(clientX, clientY, width, height);

      if (config.type === 'translation') {
        if (config.translationMode === 'points' && vertices.length === 1) {
          setConfig((prev) => ({
            ...prev,
            dx: cart.x - vertices[0].x,
            dy: cart.y - vertices[0].y,
            translationTarget: { ...cart, label: "A'", color: '#2563eb' },
            translationTargets: [{ ...cart, label: "A'", color: '#2563eb' }],
            translationReady: true
          }));
          return;
        }

        if (config.translationMode === 'points' && vertices.length > 1) {
          const targets = [...(config.translationTargets || [])];
          const targetIndex = vertices.findIndex((_, index) => !targets[index]);
          if (targetIndex !== -1) {
            targets[targetIndex] = {
              ...cart,
              label: `${vertices[targetIndex].label || String.fromCharCode(65 + targetIndex)}'`,
              color: '#2563eb'
            };
            setConfig((prev) => ({
              ...prev,
              translationTargets: targets,
              translationTarget: targets[0],
              translationReady: targets.every(Boolean)
            }));
            return;
          }
        }

        setConfig((prev) => ({ ...prev, translationTarget: undefined, translationTargets: [], translationReady: false }));
      }

      const nextLabel = String.fromCharCode(65 + vertices.length);
      setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel, color: defaultColor }]);
      return;
    }

    // Herramienta Segmento: conectar dos puntos o crear puntos y unirlos
    if (tool === 'segment') {
      const cart = toCartesian(clientX, clientY, width, height);
      let targetIndex: number | null = null;
      for (let i = 0; i < vertices.length; i++) {
        const vScr = toScreen(vertices[i], width, height);
        if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 18) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex === null) {
        commitAction();
        targetIndex = vertices.length;
        const nextLabel = String.fromCharCode(65 + vertices.length);
        setVertices((prev) => [...prev, { x: cart.x, y: cart.y, label: nextLabel, color: defaultColor }]);
        if (config.type === 'translation') {
          setConfig((prev) => ({ ...prev, translationReady: false }));
        }
      }

      if (segmentStartVertex === null) {
        setSegmentStartVertex(targetIndex);
        if (config.type === 'translation') {
          setConfig((prev) => ({ ...prev, translationReady: false }));
        }
      } else {
        if (targetIndex !== segmentStartVertex) {
          const from = segmentStartVertex;
          const to = targetIndex;
          const alreadyExists = segments.some(
            ([a, b]) => (a === from && b === to) || (a === to && b === from)
          );
          if (!alreadyExists) {
            setSegments((prev) => [...prev, [from, to]]);
            if (config.type === 'translation') {
              setConfig((prev) => ({ ...prev, translationReady: true }));
            }
          }
        }
        setSegmentStartVertex(null);
      }
      return;
    }

    // Herramienta Polígono: crear figura cerrada
    if (tool === 'polygon') {
      const cart = toCartesian(clientX, clientY, width, height);
      if (vertices.length >= 3) {
        const firstScr = toScreen(vertices[0], width, height);
        if (Math.hypot(clientX - firstScr.x, clientY - firstScr.y) <= 20) {
          setIsPolygon(true);
          if (config.type === 'translation') {
            setConfig((prev) => ({ ...prev, translationReady: true }));
          }
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
      if (config.type === 'translation') {
        setConfig((prev) => ({ ...prev, translationReady: false }));
      }
      if (newIdx > 0) {
        setSegments((prev) => [...prev, [newIdx - 1, newIdx]]);
      }
      return;
    }

    // Modo Colocar Pivote
    if (tool === 'pivot') {
      commitAction();
      const cart = toCartesian(clientX, clientY, width, height);
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
      const pScr = toScreen(activePivot, width, height);
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 20) {
        commitAction();
        isDraggingPivotRef.current = true;
        dragStartRef.current = { x: screenX, y: screenY };
        return;
      }
    }

    // Modo Mover (Select): Verificar si arrastra un vértice original
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], width, height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 18) {
        commitAction();
        draggingVertexIndexRef.current = i;
        dragStartRef.current = { x: screenX, y: screenY };
        return;
      }
    }

    // Modo Mover (Select): Verificar si arrastra el eje de reflexión
    if (tool === 'select' && config.type === 'reflection' && (config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y')) {
      const cartRaw = toCartesian(clientX, clientY, width, height, false);
      let isNearLine = false;
      if (config.reflectionAxis === 'custom_x') {
        isNearLine = Math.abs(cartRaw.x - config.customAxisValue) * (scale / 20) < 1;
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
    dragStartRef.current = { x: screenX - pan.x, y: screenY - pan.y };
  };

  const handleInteractionMove = (
    clientX: number,
    clientY: number,
    screenX: number,
    screenY: number,
    width: number,
    height: number
  ) => {
    const cart = toCartesian(clientX, clientY, width, height);
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
      setActiveAutoformaId(null);
      setVertices((prev) =>
        prev.map((v, i) => (i === idx ? { ...v, x: cart.x, y: cart.y } : v))
      );
      return;
    }

    if (isDraggingCanvasRef.current) {
      setPan({
        x: screenX - dragStartRef.current.x,
        y: screenY - dragStartRef.current.y
      });
      return;
    }

    // Hover sobre pivote o vértices o línea de reflexión
    if (activePivot) {
      const pScr = toScreen(activePivot, width, height);
      setIsHoveringPivot(Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 18);
    } else {
      setIsHoveringPivot(false);
    }

    let foundLineHover = false;
    if (tool === 'select' && config.type === 'reflection' && (config.reflectionAxis === 'custom_x' || config.reflectionAxis === 'custom_y')) {
      const cartRaw = toCartesian(clientX, clientY, width, height, false);
      if (config.reflectionAxis === 'custom_x') {
        foundLineHover = Math.abs(cartRaw.x - config.customAxisValue) * (scale / 20) < 1;
      } else {
        foundLineHover = Math.abs(cartRaw.y - config.customAxisValue) * (scale / 20) < 1;
      }
    }
    setIsHoveringReflectionLine(foundLineHover);

    let foundIdx: number | null = null;
    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], width, height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 16) {
        foundIdx = i;
        break;
      }
    }
    setHoveredVertexIndex(foundIdx);
  };

  // MANEJO DE EVENTOS DEL RATÓN
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    handleInteractionStart(clientX, clientY, e.clientX, e.clientY, rect.width, rect.height);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    handleInteractionMove(clientX, clientY, e.clientX, e.clientY, rect.width, rect.height);
  };

  // MANEJO DE EVENTOS TÁCTILES PARA MÓVIL Y TABLET (TOUCH)
  const touchStartRef = useRef<{ x: number; y: number; dist: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      touchStartRef.current = { x: clientX, y: clientY, dist: 0 };
      handleInteractionStart(clientX, clientY, touch.clientX, touch.clientY, rect.width, rect.height);
    } else if (e.touches.length === 2) {
      // Gesto de 2 dedos (Pinch-to-zoom / Pan con 2 dedos)
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchStartRef.current = { x: midX, y: midY, dist };
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: midX - pan.x, y: midY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const clientX = touch.clientX - rect.left;
      const clientY = touch.clientY - rect.top;
      handleInteractionMove(clientX, clientY, touch.clientX, touch.clientY, rect.width, rect.height);
    } else if (e.touches.length === 2 && touchStartRef.current && touchStartRef.current.dist > 0) {
      // Zoom por pellizco (Pinch-to-zoom)
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const factor = newDist / touchStartRef.current.dist;
      setScale((prev) => Math.min(Math.max(prev * factor, 12), 140));
      touchStartRef.current.dist = newDist;

      // Desplazamiento panorámico con 2 dedos
      setPan({
        x: midX - dragStartRef.current.x,
        y: midY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
    touchStartRef.current = null;
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
      if (Math.hypot(clientX - pScr.x, clientY - pScr.y) <= 18) {
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetType: 'pivot' });
        return;
      }
    }

    for (let i = 0; i < vertices.length; i++) {
      const vScr = toScreen(vertices[i], rect.width, rect.height);
      if (Math.hypot(clientX - vScr.x, clientY - vScr.y) <= 16) {
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

  // Estado para alertas o notificaciones de proyecto (toast flotante)
  const [projectToast, setProjectToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const HISTORY_LIMIT = 10;
  const [backups, setBackups] = useState<GeoProjectData[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem('geotransform_backups_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);

  useEffect(() => {
    if (backups.length === 0) {
      setSelectedHistoryIndex(0);
      return;
    }
    setSelectedHistoryIndex((prev) => Math.min(prev, backups.length - 1));
  }, [backups.length]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setProjectToast({ message, type });
    setTimeout(() => {
      setProjectToast(null);
    }, 4500);
  };

  const resetProblemProgress = useCallback(() => {
    setCompletedProblemIds([]);
    setSelectedProblemDifficulty('básico');
    setSelectedProblemType('todos');
    setStudyMode('ruta');
    setCurrentScenario(null);
    setSelectedProblemTab('selector');
    showToast('Progreso de ejercicios reiniciado.', 'success');
  }, []);

  const buildSnapshot = useCallback((title?: string): GeoProjectData => ({
    appName: 'GeoTransform Pro',
    version: '1.0',
    timestamp: Date.now(),
    title: title || `Copia ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    vertices,
    segments,
    isPolygon,
    config,
    gridStyle,
    showAxes: toggles.showAxes !== false,
    showTransformedImage: toggles.showTransformedImage !== false,
    scale,
    pan,
    customStatement,
    problemMode
  }), [vertices, segments, isPolygon, config, gridStyle, toggles.showAxes, scale, pan, customStatement, problemMode]);

  const saveCurrentProjectToHistory = useCallback((title?: string, notify = true) => {
    const snapshot = buildSnapshot(title || `Copia ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    setBackups((prev) => {
      const merged = [snapshot, ...prev.filter((item) => item.timestamp !== snapshot.timestamp)].slice(0, HISTORY_LIMIT);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('geotransform_backups_v1', JSON.stringify(merged));
      }
      return merged;
    });
    if (notify) {
      showToast('Copia de seguridad guardada localmente.', 'success');
    }
  }, [buildSnapshot]);

  const clearProjectHistory = useCallback(() => {
    setBackups([]);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('geotransform_backups_v1');
    }
    showToast('Historial borrado.', 'success');
  }, [showToast]);

  const removeProjectSnapshot = useCallback((timestamp: number) => {
    setBackups((prev) => {
      const next = prev.filter((item) => item.timestamp !== timestamp);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('geotransform_backups_v1', JSON.stringify(next));
      }
      return next;
    });
    showToast('Copia eliminada del historial.', 'success');
  }, [showToast]);

  const restoreProjectSnapshot = useCallback((snapshot: GeoProjectData) => {
    if (Array.isArray(snapshot.vertices)) setVertices(snapshot.vertices);
    if (Array.isArray(snapshot.segments)) setSegments(snapshot.segments);
    if (typeof snapshot.isPolygon === 'boolean') setIsPolygon(snapshot.isPolygon);
    if (snapshot.config) setConfig(snapshot.config);
    if (snapshot.gridStyle) setGridStyle(snapshot.gridStyle);
    if (typeof snapshot.showAxes === 'boolean') {
      setToggles((prev) => ({ ...prev, showAxes: snapshot.showAxes }));
    }
    if (typeof snapshot.showTransformedImage === 'boolean') {
      setToggles((prev) => ({ ...prev, showTransformedImage: snapshot.showTransformedImage }));
    }
    if (typeof snapshot.scale === 'number') setScale(snapshot.scale);
    if (snapshot.pan) setPan(snapshot.pan);
    if (snapshot.customStatement) setCustomStatement(snapshot.customStatement);
    if (snapshot.problemMode) setProblemMode(snapshot.problemMode);
    setIsHistoryOpen(false);
    showToast(`Se restauró la copia "${snapshot.title || 'Sin título'}".`, 'success');
  }, []);

  // CALCULAR LÍMITES GEOMÉTRICOS EXACTOS DE TODAS LAS FIGURAS Y ELEMENTOS EN EL PLANO
  const computeGeometryBounds = useCallback(() => {
    const rawPoints: Point[] = [
      ...vertices,
      ...transformedVertices,
      ...secondaryTransformedVertices,
      ...rotationStages.flat(),
      ...additionalReflectionVertices.flat(),
      ...(activePivot ? [activePivot] : [])
    ];

    const construction = engineResult.constructionElements;
    construction.vectorGuides?.forEach((guide) => rawPoints.push(guide.start, guide.intermediate, guide.end));
    construction.perpendicularGuides?.forEach((guide) => rawPoints.push(guide.p, guide.footH, guide.pPrime));
    construction.rotationArcs?.forEach((arc) => {
      rawPoints.push(arc.center, arc.p, arc.pPrime);
      const r = arc.radius || Math.hypot(arc.p.x - arc.center.x, arc.p.y - arc.center.y);
      if (r > 0 && r < 50) {
        rawPoints.push(
          { x: arc.center.x - r * 0.8, y: arc.center.y - r * 0.8 },
          { x: arc.center.x + r * 0.8, y: arc.center.y + r * 0.8 }
        );
      }
    });
    construction.homothetyRays?.forEach((ray) => rawPoints.push(ray.center, ray.p, ray.pPrime));
    construction.centralSymmetrySegments?.forEach((seg) => rawPoints.push(seg.center, seg.p, seg.pPrime));

    if (showSymmetryAxes && symmetryResult.axes.length > 0) {
      symmetryResult.axes.forEach((axis) => {
        rawPoints.push(axis.p1, axis.p2);
      });
    }

    // Si no hay puntos, devolver vista estándar simétrica alrededor del origen
    if (rawPoints.length === 0) {
      return {
        centerX: 0,
        centerY: 0,
        spanX: 16,
        spanY: 12,
        minX: -8,
        maxX: 8,
        minY: -6,
        maxY: 6
      };
    }

    const xs = rawPoints.map((p) => p.x).filter(Number.isFinite);
    const ys = rawPoints.map((p) => p.y).filter(Number.isFinite);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    return {
      centerX,
      centerY,
      spanX,
      spanY,
      minX,
      maxX,
      minY,
      maxY
    };
  }, [
    vertices,
    transformedVertices,
    secondaryTransformedVertices,
    rotationStages,
    additionalReflectionVertices,
    activePivot,
    engineResult.constructionElements,
    showSymmetryAxes,
    symmetryResult.axes
  ]);

  // CÁLCULO DE AUTO-ENCUADRE AUTOMÁTICO PARA EXPORTACIÓN PERFECTAMENTE CENTRADA
  const getAutoFramingForExport = useCallback((
    targetWidth: number = 1600,
    targetHeight: number = 1000,
    headerHeight: number = 56
  ) => {
    const bounds = computeGeometryBounds();
    const availW = targetWidth - 120; // 60px margen horizontal a cada lado
    const availH = targetHeight - headerHeight - 120; // 60px margen vertical

    // Generoso padding en unidades cartesianas para que las etiquetas, coordenadas y arcos nunca toquen el borde
    const padX = Math.max(2.8, bounds.spanX * 0.22);
    const padY = Math.max(2.8, bounds.spanY * 0.22);
    const totalSpanX = Math.max(12, bounds.spanX + padX * 2);
    const totalSpanY = Math.max(8.5, bounds.spanY + padY * 2);

    const scaleX = availW / totalSpanX;
    const scaleY = availH / totalSpanY;
    let autoScale = Math.min(scaleX, scaleY);
    autoScale = Math.max(18, Math.min(54, Math.round(autoScale * 10) / 10));

    const panX = -bounds.centerX * autoScale;
    const panY = bounds.centerY * autoScale;

    return {
      scale: autoScale,
      pan: { x: panX, y: panY }
    };
  }, [computeGeometryBounds]);

  // ENCUADRE AUTOMÁTICO EN LA PIZARRA INTERACTIVA
  const handleAutoFitView = useCallback(() => {
    const width = canvasDimensions.width || 1200;
    const height = canvasDimensions.height || 700;
    const bounds = computeGeometryBounds();
    const availW = width - 120;
    const availH = height - 120;
    const padX = Math.max(2.5, bounds.spanX * 0.22);
    const padY = Math.max(2.5, bounds.spanY * 0.22);
    const totalSpanX = Math.max(12, bounds.spanX + padX * 2);
    const totalSpanY = Math.max(8.5, bounds.spanY + padY * 2);
    let fitScale = Math.min(availW / totalSpanX, availH / totalSpanY);
    fitScale = Math.max(20, Math.min(55, Math.round(fitScale)));
    const panX = -bounds.centerX * fitScale;
    const panY = bounds.centerY * fitScale;
    setScale(fitScale);
    setPan({ x: panX, y: panY });
    showToast('Plano centrado y encuadrado automáticamente en las figuras', 'info');
  }, [canvasDimensions.width, canvasDimensions.height, computeGeometryBounds, showToast]);

  // Cargar Autoforma desde el explorador de simetría
  const handleLoadAutoforma = useCallback((preset: WordAutoformaPreset) => {
    commitAction();
    setVertices(preset.vertices);
    setIsPolygon(true);
    const segs: [number, number][] = [];
    for (let i = 0; i < preset.vertices.length; i++) {
      segs.push([i, (i + 1) % preset.vertices.length]);
    }
    setSegments(segs);
    setSegmentStartVertex(null);
    setActiveAutoformaId(preset.id);
    setShapeRotationAngle(0);
    setShowSymmetryAxes(true);
    setSelectedSymmetryAxisId('all');
    setToggles((prev) => ({ ...prev, showTransformedImage: false }));
    setConfig((prev) => ({
      ...prev,
      type: 'reflection',
      reflectionAxis: 'y',
      customAxisValue: 0,
      reflectionAxes: ['y'],
      translationTarget: undefined,
      translationTargets: [],
      translationReady: true
    }));
    setTool('select');
    setTimeout(() => {
      handleAutoFitView();
    }, 60);
    showToast(`Autoforma "${preset.name}" cargada: figura única con ${preset.isInfinite ? 'infinitos ejes (∞)' : `${preset.symmetryCount} ${preset.symmetryCount === 1 ? 'eje' : 'ejes'} de simetría máximos`}.`, 'info');
  }, [commitAction, handleAutoFitView, showToast]);

  // Rotar la figura en su lugar alrededor del centroide / origen (sin duplicar ni sobremontar)
  const handleRotateFigureInPlace = useCallback((deltaAngleDeg: number) => {
    if (vertices.length === 0) return;
    commitAction();

    let sumX = 0, sumY = 0;
    for (const v of vertices) {
      sumX += v.x;
      sumY += v.y;
    }
    const rawCx = sumX / vertices.length;
    const rawCy = sumY / vertices.length;
    // Si la figura está centrada en torno al origen, anclar a (0,0) para mantener simetría cartesiana exacta
    const cx = Math.abs(rawCx) < 0.35 ? 0 : rawCx;
    const cy = Math.abs(rawCy) < 0.35 ? 0 : rawCy;

    const rad = (deltaAngleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const newVertices = vertices.map((v) => {
      const dx = v.x - cx;
      const dy = v.y - cy;
      const rx = cx + dx * cos - dy * sin;
      const ry = cy + dx * sin + dy * cos;
      return {
        ...v,
        x: Number(rx.toFixed(2)),
        y: Number(ry.toFixed(2)),
      };
    });

    setVertices(newVertices);
    const newAngle = ((shapeRotationAngle + deltaAngleDeg) % 360 + 360) % 360;
    setShapeRotationAngle(newAngle);
    showToast(`Figura rotada ${deltaAngleDeg > 0 ? `+${deltaAngleDeg}°` : `${deltaAngleDeg}°`} en su lugar`, 'info');
  }, [vertices, shapeRotationAngle, commitAction, showToast]);

  // Orientar la figura hacia una dirección cardinal específica (Arriba, Abajo, Izquierda, Derecha)
  const handleOrientFigure = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (vertices.length === 0) return;
    const directionAngles: Record<'right' | 'up' | 'left' | 'down', number> = {
      right: 0,
      up: 90,
      left: 180,
      down: 270,
    };
    const targetAngle = directionAngles[direction];
    let deltaAngle = ((targetAngle - shapeRotationAngle) % 360 + 360) % 360;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle === 0) {
      showToast(`La figura ya está orientada hacia ${direction === 'up' ? 'arriba' : direction === 'down' ? 'abajo' : direction === 'left' ? 'la izquierda' : 'la derecha'}.`, 'info');
      return;
    }
    handleRotateFigureInPlace(deltaAngle);
  }, [vertices.length, shapeRotationAngle, handleRotateFigureInPlace, showToast]);

  // Aplicar un corte de simetría como eje de reflexión activo L
  const handleApplyAsReflectionAxis = useCallback((axis: SymmetryAxis) => {
    commitAction();
    setToggles((prev) => ({ ...prev, showTransformedImage: true }));
    if (axis.type === 'vertical') {
      const val = Math.abs(axis.p1.x) < 0.05 ? 0 : Math.round(axis.p1.x);
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: val === 0 ? 'y' : 'custom_x',
        customAxisValue: val,
        reflectionAxes: [val === 0 ? 'y' : 'custom_x']
      }));
    } else if (axis.type === 'horizontal') {
      const val = Math.abs(axis.p1.y) < 0.05 ? 0 : Math.round(axis.p1.y);
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: val === 0 ? 'x' : 'custom_y',
        customAxisValue: val,
        reflectionAxes: [val === 0 ? 'x' : 'custom_y']
      }));
    } else if (axis.equation === 'y = x') {
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: 'y=x',
        reflectionAxes: ['y=x']
      }));
    } else if (axis.equation === 'y = -x') {
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: 'y=-x',
        reflectionAxes: ['y=-x']
      }));
    } else {
      const rad = (axis.angleDeg * Math.PI) / 180;
      const a = Math.sin(rad);
      const b = -Math.cos(rad);
      const c = -(a * symmetryResult.centroid.x + b * symmetryResult.centroid.y);
      setConfig((prev) => ({
        ...prev,
        type: 'reflection',
        reflectionAxis: 'general',
        generalLine: { a: Number(a.toFixed(4)), b: Number(b.toFixed(4)), c: Number(c.toFixed(4)) },
        reflectionAxes: ['general']
      }));
    }
    showToast(`Eje de reflexión L fijado en ${axis.name} (${axis.equation}). ¡La figura coincide consigo misma!`, 'success');
  }, [commitAction, symmetryResult.centroid, showToast]);

  // CREAR LIENZO DE ALTA RESOLUCIÓN AUTO-ENCUADRADO PARA EXPORTACIÓN
  const createExportCanvas = useCallback((variant: 'student' | 'teacher' = 'student') => {
    const exportWidth = 1600;
    const exportHeight = 1000;
    const headerHeight = 56;
    const framing = getAutoFramingForExport(exportWidth, exportHeight, headerHeight);
    const dpr = 2; // Resolución Retina ultra-nítida
    const exportCanvas = document.createElement('canvas');

    drawGeometryPlane(
      exportCanvas,
      exportWidth,
      exportHeight,
      framing.scale,
      framing.pan,
      dpr,
      {
        isExport: true,
        headerInfo: {
          title: customStatement,
          type: config.type,
          variant
        }
      }
    );

    return exportCanvas;
  }, [customStatement, config.type, drawGeometryPlane, getAutoFramingForExport]);

  // Exportar PNG de alta resolución con metadatos de proyecto integrados (Smart PNG)
  const handleExportPNG = async (requestedFileName?: string, variant: 'student' | 'teacher' = 'student') => {
    const safeFileName = (requestedFileName || 'geotransform')
      .trim()
      .replace(/\.png$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 100) || 'geotransform';

    const exportCanvas = createExportCanvas(variant);

    const projectData: GeoProjectData = {
      appName: 'GeoTransform Pro',
      version: '1.0',
      timestamp: Date.now(),
      vertices,
      segments,
      isPolygon,
      config,
      gridStyle,
      showAxes: toggles.showAxes !== false,
      showTransformedImage: toggles.showTransformedImage !== false,
      scale,
      pan,
      customStatement,
      problemMode
    };

    exportCanvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const smartBlob = await embedProjectInPNG(blob, projectData);
        const url = URL.createObjectURL(smartBlob);
        const link = document.createElement('a');
        link.download = `${safeFileName}_${variant}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast(`¡Imagen PNG guardada (${variant === 'teacher' ? 'Profesor' : 'Alumno'})!`, 'success');
      } catch (err) {
        console.error(err);
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${safeFileName}_${variant}.png`;
        link.href = dataUrl;
        link.click();
      }
    }, 'image/png');
  };

  // Exportar archivo de proyecto (.geot / JSON)
  const handleExportProjectJSON = () => {
    const projectData: GeoProjectData = {
      appName: 'GeoTransform Pro',
      version: '1.0',
      timestamp: Date.now(),
      vertices,
      segments,
      isPolygon,
      config,
      gridStyle,
      showAxes: toggles.showAxes !== false,
      showTransformedImage: toggles.showTransformedImage !== false,
      scale,
      pan,
      customStatement,
      problemMode
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `geotransform_proyecto_${Date.now()}.geot`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('¡Archivo de proyecto (.geot) descargado exitosamente!', 'success');
  };

  // Cargar proyecto desde archivo (PNG con metadatos o archivo .geot / .json)
  const handleLoadProjectFile = async (file: File) => {
    try {
      const project = await extractProjectFromPNG(file);
      if (!project) {
        showToast(
          'La imagen o archivo no contiene un proyecto válido de GeoTransform. Asegúrate de usar una imagen PNG descargada desde esta aplicación.',
          'error'
        );
        return;
      }

      commitAction();

      if (Array.isArray(project.vertices)) {
        setVertices(project.vertices);
      }
      if (Array.isArray(project.segments)) {
        setSegments(project.segments);
      }
      if (typeof project.isPolygon === 'boolean') {
        setIsPolygon(project.isPolygon);
      }
      if (project.config) {
        setConfig(project.config);
      }
      if (project.gridStyle) {
        setGridStyle(project.gridStyle);
      }
      if (typeof project.showAxes === 'boolean') {
        setToggles((prev) => ({ ...prev, showAxes: project.showAxes }));
      }
      if (typeof project.showTransformedImage === 'boolean') {
        setToggles((prev) => ({ ...prev, showTransformedImage: project.showTransformedImage }));
      }
      if (typeof project.scale === 'number') {
        setScale(project.scale);
      }
      if (project.pan) {
        setPan(project.pan);
      }
      if (project.customStatement) {
        setCustomStatement(project.customStatement);
      }
      if (project.problemMode) {
        setProblemMode(project.problemMode);
      }

      showToast(`¡Proyecto "${file.name}" cargado exitosamente!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Hubo un error al procesar el archivo seleccionado.', 'error');
    }
  };

  // Exportar PDF de alta resolución con auto-encuadre perfecto
  const handleExportPDF = (variant: 'student' | 'teacher' = 'student') => {
    const exportCanvas = createExportCanvas(variant);
    const dataUrl = exportCanvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [exportCanvas.width, exportCanvas.height]
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, exportCanvas.width, exportCanvas.height);
    const safeType = config.type || 'transform';
    pdf.save(`geotransform_${variant}_${safeType}_${Date.now()}.pdf`);
    showToast(`¡PDF guardado en versión ${variant === 'teacher' ? 'profesor' : 'alumno'}!`, 'success');
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col w-full h-full overflow-hidden bg-surface text-ink font-sans select-none"
      style={{ display: isActive ? 'flex' : 'none' }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingFile(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleLoadProjectFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* OVERLAY DE ARRASTRE DE ARCHIVOS (DRAG & DROP) */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-accent/20 backdrop-blur-sm border-4 border-dashed border-accent m-4 rounded-3xl pointer-events-none animate-in fade-in duration-150">
          <div className="p-6 rounded-2xl bg-surface/95 shadow-2xl border border-border flex flex-col items-center gap-3 text-center max-w-sm">
            <Download className="h-10 w-10 text-accent animate-bounce" />
            <h4 className="text-base font-bold text-ink">Suelta tu imagen o archivo aquí</h4>
            <p className="text-xs text-ink-soft">
              Reconoceremos automáticamente las figuras, coordenadas y transformaciones guardadas.
            </p>
          </div>
        </div>
      )}

      {/* 1. BARRA DE HERRAMIENTAS SUPERIOR ESTILO GEOGEBRA */}
      <GeoGebraToolbar
        activeTool={tool}
        onSelectTool={setTool}
        activeTransformation={config.type}
        onSelectTransformation={(type) => {
          setToggles((prev) => ({ ...prev, showTransformedImage: true }));
          setConfig((prev) => ({
            ...prev,
            type,
            translationMode: type === 'translation' ? 'points' : prev.translationMode,
            translationTarget: type === 'translation' ? undefined : prev.translationTarget,
            translationTargets: type === 'translation' ? [] : prev.translationTargets,
            translationVectorSet: type === 'translation' ? false : prev.translationVectorSet,
            rotationSteps: type === 'rotation'
              ? (prev.rotationSteps?.length ? prev.rotationSteps : [{ angleDeg: prev.angleDeg || 90, direction: prev.direction || 'anticlockwise', center: prev.center || { x: 0, y: 0 } }])
              : prev.rotationSteps
          }));
        }}
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
        onOpenNotebook={() => {
          setIsNotebookOpen(true);
          setIsSidebarOpen(false);
        }}
        onOpenProblem={() => {
          setSelectedProblemTab(currentScenario ? 'ejercicio' : 'selector');
          setIsProblemOpen(true);
          setIsSidebarOpen(false);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSaveHistory={() => saveCurrentProjectToHistory(`Guardado manual ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, true)}
        onOpenTheory={() => setIsTheoryOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setSettings(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
        onToggleFullscreen={toggleCanvasFullscreen}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onExportProjectJSON={handleExportProjectJSON}
        onLoadProject={handleLoadProjectFile}
      />

      {/* 2. SUB-BARRA DE INSTRUCCIONES CONTEXTUALES GEOGEBRA (ULTRA COMPACTA) */}
      <div className="flex items-center justify-between px-2 sm:px-4 py-0.5 sm:py-1 bg-panel/80 border-b border-border text-[11px] sm:text-xs min-h-[24px] sm:min-h-[28px] shrink-0">
        <div className="flex items-center gap-1.5 text-ink-soft overflow-hidden mr-2">
          <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent shrink-0" />
          <span className="font-medium truncate text-[10px] sm:text-xs">
            {tool === 'select' && 'Mover: Arrastra vértices, centros o el fondo para desplazar el plano.'}
            {tool === 'point' && 'Punto: Haz clic o toca en el plano para marcar puntos libres sin unirlos.'}
            {tool === 'segment' &&
              (segmentStartVertex === null
                ? 'Segmento: Toca el primer punto para iniciar la línea recta.'
                : `Segmento: Toca el segundo punto para unirlo con ${vertices[segmentStartVertex]?.label || 'el punto inicial'}.`)}
            {tool === 'polygon' && 'Polígono: Toca cada vértice y vuelve a tocar el primero para cerrar la figura.'}
            {tool === 'pivot' && 'Pivote: Toca en el plano para fijar el nuevo centro de giro u homotecia.'}
          </span>
        </div>

        {/* Indicador de estado de la figura en la pizarra */}
        <div className="flex items-center gap-1 text-[10px] sm:text-xs shrink-0">
          <span className="font-mono text-ink-soft hidden sm:inline">
            {vertices.length} {vertices.length === 1 ? 'punto' : 'puntos'}
          </span>
          {isPolygon ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Polígono Cerrado
            </span>
          ) : segments.length > 0 ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {segments.length} seg.
            </span>
          ) : vertices.length > 0 ? (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-ink-soft">
              {vertices.length} pts
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. ÁREA DE TRABAJO PRINCIPAL: LIENZO Y PANEL LATERAL */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        {/* LIENZO DE GEOMETRÍA */}
        <div 
          ref={containerRef}
          className={`relative flex-1 min-h-0 w-full h-full overflow-hidden bg-white dark:bg-[#0b0f19] ${
            isCanvasFullscreen ? 'z-[99999]' : ''
          }`}
        >
          <canvas
            ref={canvasRef}
            style={{ touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={(e) => {
              e.preventDefault();
              const zoomFactor = e.deltaY < 0 ? 1.1 : 0.909;
              setScale((prev) => Math.min(Math.max(prev * zoomFactor, 12), 140));
            }}
            onContextMenu={handleContextMenu}
            onMouseLeave={() => {
              isDraggingCanvasRef.current = false;
              draggingVertexIndexRef.current = null;
              isDraggingPivotRef.current = false;
              setMouseCoord(null);
            }}
            className={`h-full w-full block touch-none ${
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
          {mouseCoord && toggles.showAxes !== false && (
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 rounded-xl bg-surface/90 px-2.5 py-1 shadow-sm backdrop-blur border border-border font-mono text-[11px] sm:text-xs text-ink pointer-events-none">
              <Target className="h-3.5 w-3.5 text-accent" />
              <span>({mouseCoord.x}, {mouseCoord.y})</span>
            </div>
          )}

          {/* BOTONERA FLOTANTE INFERIOR DERECHA (ZOOM, CENTRAR, EXPORTAR) */}
          <div className={`absolute bottom-4 sm:bottom-5 z-20 flex items-center gap-1 bg-surface/90 p-1 sm:p-1.5 rounded-2xl shadow-lg border border-border backdrop-blur-md ${
            isSidebarOpen ? 'right-4 lg:right-[400px]' : 'right-4 sm:right-5'
          }`}>
            <button
              onClick={() => setScale((prev) => Math.min(prev * 1.2, 140))}
              title="Acercar (Zoom +)"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink transition"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScale((prev) => Math.max(prev * 0.833, 12))}
              title="Alejar (Zoom -)"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink transition"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleAutoFitView}
              title="Centrar y encuadrar figuras automáticamente en la pizarra"
              className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
            >
              <Target className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-0.5" />
            <button
              onClick={() => {
                const nextShowAxes = toggles.showAxes === false;
                setToggles((prev) => ({ ...prev, showAxes: nextShowAxes }));
                showToast(
                  nextShowAxes ? 'Ejes cartesianos visibles (X e Y)' : 'Ejes cartesianos ocultos',
                  'info'
                );
              }}
              title={toggles.showAxes === false ? 'Mostrar ejes cartesianos (X e Y)' : 'Ocultar ejes cartesianos (X e Y)'}
              className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                toggles.showAxes !== false
                  ? 'bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25'
                  : 'text-ink-soft hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>{toggles.showAxes !== false ? 'Ejes ON' : 'Ejes OFF'}</span>
            </button>
            <button
              onClick={() =>
                setGridStyle((prev) => (prev === 'lines' ? 'dots' : prev === 'dots' ? 'none' : 'lines'))
              }
              title={`Estilo de cuadrícula: ${gridStyle === 'lines' ? 'Líneas' : gridStyle === 'dots' ? 'Puntos' : 'Sin red'} (Clic para cambiar)`}
              className="px-2.5 py-1 text-xs font-semibold text-ink hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition cursor-pointer"
            >
              {gridStyle === 'lines' ? 'Líneas' : gridStyle === 'dots' ? 'Puntos' : 'Sin red'}
            </button>
            {vertices.length >= 3 && (
              <>
                <div className="h-4 w-px bg-border mx-0.5" />
                <button
                  onClick={() => handleRotateFigureInPlace(90)}
                  title="Girar figura 90° antihorario en su lugar (↺)"
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 text-rose-500" />
                </button>
                <button
                  onClick={() => handleRotateFigureInPlace(-90)}
                  title="Girar figura 90° horario en su lugar (↻)"
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-ink transition cursor-pointer"
                >
                  <RotateCw className="h-4 w-4 text-rose-500" />
                </button>
              </>
            )}
          </div>

        </div>

        {/* BACKDROP PARA MÓVIL Y TABLETA */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* PANEL LATERAL RESPONSIVO (DRAWER EN MÓVIL/TABLETA, ASIDE LATERAL EN DESKTOP) */}
        {isSidebarOpen && (
          <aside className="fixed inset-y-2 right-2 z-50 flex h-[calc(100vh-1rem)] w-[88vw] max-w-[360px] min-h-0 flex-col overflow-hidden border-l border-border bg-gradient-to-b from-surface via-surface to-panel shadow-2xl animate-in slide-in-from-right duration-200 sm:right-3 sm:w-[380px] md:relative md:inset-y-auto md:right-auto md:h-auto md:max-h-full md:w-[380px] md:shrink-0 md:shadow-none md:rounded-l-3xl md:border-r md:border-border">
            {/* Cabecera del panel con identidad didáctica y visual clara */}
            <div className="relative shrink-0 border-b border-border bg-gradient-to-r from-accent/12 via-panel to-surface/95 px-2.5 py-2.5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Panel</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-soft">de trabajo</span>
                    </div>
                    <div className="truncate text-sm font-bold text-ink">Configuración didáctica</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      showToast('Configuración guardada y aplicada al plano', 'success');
                    }}
                    title="Guardar y volver al plano cartesiano"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent/90 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Guardar</span>
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    title="Cerrar panel"
                    className="p-1.5 rounded-xl text-ink-soft hover:text-ink hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-3 pt-3 pb-2 border-b border-border bg-surface/80">
              <div className="flex items-center rounded-xl border border-border bg-panel p-1 gap-1 shadow-sm">
                <button
                  className="flex-1 rounded-lg bg-accent/10 text-accent px-2 py-1.5 text-[11px] font-bold shadow-sm ring-1 ring-accent/15"
                  type="button"
                >
                  Álgebra
                </button>
                <button
                  className="flex-1 rounded-lg text-ink-soft hover:text-ink px-2 py-1.5 text-[11px] font-semibold transition"
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Pizarra
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
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
                onToggleLabels={() => setSettings(prev => ({ ...prev, showLabels: !prev.showLabels }))}
                isDarkMode={isDarkMode}
                symmetryResult={symmetryResult}
                showSymmetryAxes={showSymmetryAxes}
                onToggleShowSymmetryAxes={setShowSymmetryAxes}
                selectedSymmetryAxisId={selectedSymmetryAxisId}
                onSelectSymmetryAxisId={setSelectedSymmetryAxisId}
                onLoadAutoforma={handleLoadAutoforma}
                activeAutoformaId={activeAutoformaId}
                onApplyAsReflectionAxis={handleApplyAsReflectionAxis}
                shapeRotationAngle={shapeRotationAngle}
                onRotateFigureInPlace={handleRotateFigureInPlace}
                onOrientFigure={handleOrientFigure}
              />
            </div>

            {/* BARRA INFERIOR DE ACCIÓN (STICKY): GUARDAR Y VER PLANO */}
            <div className="p-3 border-t border-border bg-surface/95 backdrop-blur-sm shrink-0 flex items-center gap-2 shadow-lg">
              <button
                onClick={() => {
                  saveCurrentProjectToHistory(`Guardado y ver plano ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, true);
                  setIsSidebarOpen(false);
                  showToast('Configuración guardada y aplicada al plano', 'success');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-accent text-white font-bold text-xs shadow-md hover:bg-accent/90 active:scale-[0.99] transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Guardar y Ver Plano</span>
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="px-3 py-2.5 rounded-2xl border border-border text-ink-soft hover:text-ink hover:bg-panel font-semibold text-xs transition"
              >
                Cerrar
              </button>
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

                          {(preset as any).symmetryCount !== undefined && (
                            <span className="inline-block text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded w-full sm:w-fit break-words">
                              {(preset as any).isInfinite ? '∞ Ejes de Simetría' : `${(preset as any).symmetryCount} ${(preset as any).symmetryCount === 1 ? 'Eje' : 'Ejes'} de Simetría`}
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

      {/* MODAL DE HISTORIAL / COPIAS DE SEGURIDAD */}
      {isHistoryOpen && (() => {
        const selectedBackup = backups[selectedHistoryIndex] ?? null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-100">
            <div className="w-full max-w-lg rounded-3xl bg-surface p-5 shadow-2xl border border-border">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <History className="h-4 w-4 text-accent" /> Historial de copias
                  </h3>
                  <p className="text-xs text-ink-soft mt-1">Navega por los momentos guardados y restaura el que necesites.</p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {backups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-panel p-4 text-sm text-ink-soft text-center">
                  Todavía no hay copias locales. El sistema guarda automáticamente cada cambio importante.
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-border bg-panel p-2">
                    <button
                      onClick={() => setSelectedHistoryIndex((prev) => Math.max(0, prev - 1))}
                      className="flex-1 rounded-xl border border-border bg-surface px-2 py-2 text-[11px] font-bold text-ink hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={selectedHistoryIndex === 0}
                    >
                      Anterior
                    </button>
                    <div className="px-3 text-[11px] font-bold text-ink-soft">
                      {selectedHistoryIndex + 1} / {backups.length}
                    </div>
                    <button
                      onClick={() => setSelectedHistoryIndex((prev) => Math.min(backups.length - 1, prev + 1))}
                      className="flex-1 rounded-xl border border-border bg-surface px-2 py-2 text-[11px] font-bold text-ink hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={selectedHistoryIndex >= backups.length - 1}
                    >
                      Siguiente
                    </button>
                  </div>

                  <div className="rounded-2xl border border-border bg-panel p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="rounded-full bg-accent/10 text-accent px-2 py-1 text-[10px] font-bold">
                        {selectedHistoryIndex === 0 ? 'Última' : `Copia ${selectedHistoryIndex + 1}`}
                      </span>
                      <button
                        onClick={() => removeProjectSnapshot(selectedBackup.timestamp)}
                        className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition"
                        aria-label={`Eliminar copia ${selectedBackup.title || 'sin título'}`}
                        title="Eliminar esta copia del historial"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-ink-soft uppercase tracking-wider">Nombre</div>
                        <div className="text-sm font-bold text-ink">{selectedBackup.title || 'Copia sin título'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-ink-soft uppercase tracking-wider">Fecha</div>
                        <div className="text-xs text-ink-soft">
                          {new Date(selectedBackup.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-ink-soft">
                        <div className="rounded-xl bg-surface px-2 py-1.5">
                          <span className="block text-[10px] uppercase tracking-wide">Vértices</span>
                          <span className="font-bold text-ink">{selectedBackup.vertices?.length ?? 0}</span>
                        </div>
                        <div className="rounded-xl bg-surface px-2 py-1.5">
                          <span className="block text-[10px] uppercase tracking-wide">Segmentos</span>
                          <span className="font-bold text-ink">{selectedBackup.segments?.length ?? 0}</span>
                        </div>
                        <div className="rounded-xl bg-surface px-2 py-1.5">
                          <span className="block text-[10px] uppercase tracking-wide">Tipo</span>
                          <span className="font-bold text-ink capitalize">{selectedBackup.config?.type || '—'}</span>
                        </div>
                        <div className="rounded-xl bg-surface px-2 py-1.5">
                          <span className="block text-[10px] uppercase tracking-wide">Escala</span>
                          <span className="font-bold text-ink">{selectedBackup.scale ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => {
                      if (selectedBackup) {
                        restoreProjectSnapshot(selectedBackup);
                        setIsHistoryOpen(false);
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-2xl bg-accent text-white text-xs font-bold hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!selectedBackup}
                  >
                    Restaurar este momento
                  </button>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="px-4 py-2 rounded-2xl border border-border text-xs font-medium hover:bg-black/5"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => {
                      saveCurrentProjectToHistory('Copia manual', true);
                      setSelectedHistoryIndex(0);
                      setIsHistoryOpen(false);
                    }}
                    className="flex-1 px-4 py-2 rounded-2xl bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20"
                  >
                    Guardar ahora
                  </button>
                  {backups.length > 0 && (
                    <button
                      onClick={() => {
                        clearProjectHistory();
                        setSelectedHistoryIndex(0);
                        setIsHistoryOpen(false);
                      }}
                      className="flex-1 px-4 py-2 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                    >
                      Borrar historial ({backups.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PÁGINA COMPLETA DE TEORÍA */}
      {isTheoryOpen && (
        <TheoryPage
          initialTransformation={config.type}
          onClose={() => setIsTheoryOpen(false)}
        />
      )}

      {/* PÁGINA COMPLETA DE CUADERNO */}
      {isNotebookOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-surface flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div
              className="h-full w-full flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Cuaderno de trabajo"
            >
              <AlgebraicNotebook
                engineResult={engineResult}
                boardContext={notebookContext}
                onClose={() => setIsNotebookOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}

      {/* PÁGINA COMPLETA DE PROBLEMAS Y RUTA DE ESTUDIO */}
      {isProblemOpen && (
        <StudyProblemsPage
          isOpen={isProblemOpen}
          onClose={() => setIsProblemOpen(false)}
          studyMode={studyMode}
          onSetStudyMode={setStudyMode}
          selectedProblemDifficulty={selectedProblemDifficulty}
          onSetSelectedProblemDifficulty={setSelectedProblemDifficulty}
          selectedProblemType={selectedProblemType}
          onSetSelectedProblemType={setSelectedProblemType}
          completedProblemIds={completedProblemIds}
          onResetProgress={resetProblemProgress}
          unlockedLevels={unlockedLevels}
          nextStudySuggestion={nextStudySuggestion}
          onGenerateRandomProblem={handleGenerateRandomProblem}
          onOpenScenario={openScenario}
          onLoadScenarioToBoard={handleLoadScenarioToBoard}
          selectedProblemTab={selectedProblemTab}
          onSetSelectedProblemTab={setSelectedProblemTab}
          currentScenario={currentScenario}
          onMarkCurrentProblemAsCompleted={markCurrentProblemAsCompleted}
          problemMode={problemMode}
          preimage={vertices}
          image={transformedVertices}
        />
      )}

      {/* NOTIFICACIÓN TOAST FLOTANTE AL CARGAR O GUARDAR PROYECTO */}
      {projectToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            projectToast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
              : projectToast.type === 'info'
                ? 'bg-blue-600 text-white border-blue-500 shadow-blue-900/25 backdrop-blur-md'
                : 'bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 border-border/40 backdrop-blur-md'
          }`}
        >
          {projectToast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-white" />
          )}
          <span className="max-w-xs sm:max-w-md">{projectToast.message}</span>
          <button
            onClick={() => setProjectToast(null)}
            className="ml-2 hover:opacity-75 p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

