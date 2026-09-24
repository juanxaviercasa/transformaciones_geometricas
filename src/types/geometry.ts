export interface Point {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

export type GridStyle = 'lines' | 'dots' | 'axes' | 'none';

export type ToolMode = 'select' | 'pan' | 'point' | 'segment' | 'polygon' | 'draw' | 'pivot';

export interface SegmentConnection {
  fromIndex: number;
  toIndex: number;
}

export interface AppSettings {
  pointSize: 'small' | 'medium' | 'large';
  lineThickness: 'thin' | 'normal' | 'thick';
  defaultColor: string;
  snapToGrid: boolean;
  showLabels: boolean;
  isDarkMode: boolean;
  uiFontSize?: 'normal' | 'large' | 'extra-large';
}

export type ProblemMode = 'DIRECT' | 'INVERSE';

export type TransformationType =
  | 'translation'
  | 'reflection'
  | 'central_reflection'
  | 'rotation'
  | 'homothety';

export type ReflectionAxis =
  | 'x'
  | 'y'
  | 'y=x'
  | 'y=-x'
  | 'custom_x'
  | 'custom_y'
  | 'general';

export interface PolygonPreset {
  id: string;
  name: string;
  category: string;
  vertices: Point[];
  recommendedFor?: string;
  description?: string;
}

export interface GeneralLineCoefficients {
  a: number; // A en Ax + By + C = 0
  b: number; // B en Ax + By + C = 0
  c: number; // C en Ax + By + C = 0
}

export interface TransformationConfig {
  type: TransformationType;
  // Traslación
  dx: number;
  dy: number;
  translationMode?: 'points' | 'vector';
  translationTarget?: Point;
  translationTargets?: Array<Point | undefined>;
  translationVectorSet?: boolean;
  translationVectors?: Array<{ dx: number; dy: number; set?: boolean }>;
  translationVectorCount?: 1 | 2;
  translationSecondDx?: number;
  translationSecondDy?: number;
  translationSecondVectorSet?: boolean;
  translationReady?: boolean;
  // Reflexión axial
  reflectionAxis: ReflectionAxis;
  reflectionAxes?: ReflectionAxis[]; // Ejes activos simultáneamente en el plano
  customAxisValue: number; // Para x = k o y = k
  generalLine: GeneralLineCoefficients; // Para Ax + By + C = 0
  // Simetría Central
  centralCenter: Point; // O(h, k)
  // Rotación
  angleDeg: number;
  direction: 'anticlockwise' | 'clockwise';
  center: Point; // C(x0, y0)
  rotationSteps?: RotationStep[];
  // Homotecia
  scaleFactor: number; // k
  homothetyCenter: Point; // O(x0, y0)
}

export interface RotationStep {
  angleDeg: number;
  direction: 'anticlockwise' | 'clockwise';
  center?: Point;
}

export interface VectorDecomposition {
  start: Point;
  intermediate: Point;
  end: Point;
  dx: number;
  dy: number;
}

export interface PerpendicularConstruction {
  p: Point;
  pPrime: Point;
  footH: Point;
  isRightAngle: boolean;
}

export interface RotationArcConstruction {
  center: Point;
  p: Point;
  pPrime: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  angleDeg: number;
  counterClockwise: boolean;
  stepIndex?: number;
}

export interface HomothetyRayConstruction {
  center: Point;
  p: Point;
  pPrime: Point;
  k: number;
}

export interface CentralSymmetryConstruction {
  center: Point;
  p: Point;
  pPrime: Point;
}

export interface ConstructionElements {
  vectorGuides?: VectorDecomposition[];
  translationStageGuides?: VectorDecomposition[][];
  secondaryVectorGuides?: VectorDecomposition[];
  perpendicularGuides?: PerpendicularConstruction[];
  rotationArcs?: RotationArcConstruction[];
  homothetyRays?: HomothetyRayConstruction[];
  centralSymmetrySegments?: CentralSymmetryConstruction[];
}

export interface AlgebraicStep {
  vertexName: string;
  originalPoint: Point;
  targetPoint: Point;
  formula: string;
  substitutionLines: string[];
  resultLine: string;
}

export interface ProblemEngineResult {
  transformedVertices: Point[];
  secondaryTransformedVertices?: Point[];
  translationStages?: Point[][];
  rotationStages?: Point[][];
  constructionElements: ConstructionElements;
  algebraicSteps: AlgebraicStep[];
  generalFormula: string;
  geometricProperties: {
    isometryType: string;
    invariants: string[];
    pedagogicalNotes: string;
  };
}

export type ProblemDifficulty = 'básico' | 'intermedio' | 'avanzado';

export interface ProblemScenario {
  id: string;
  mode: ProblemMode;
  category: string;
  difficulty?: ProblemDifficulty;
  title: string;
  statement: string;
  presetVertices: Point[];
  targetConfig: TransformationConfig;
  inverseOptions?: {
    suggestedType: TransformationType;
    hint: string;
    explanation: string;
  };
}

export interface ClassroomToggles {
  showSideLengths: boolean;
  showInteriorAngles: boolean;
  showConstructionGuides: boolean;
  showReflectionDistances: boolean;
  showPoints: boolean;
  showAxes?: boolean;
  showTransformedImage?: boolean;
  showAlgebraicNotebook: boolean;
  cleanBoardMode: boolean;
}

export interface GeoProjectData {
  appName: string;
  version: string;
  timestamp: number;
  title?: string;
  vertices: Point[];
  segments: [number, number][];
  isPolygon: boolean;
  config: TransformationConfig;
  gridStyle?: GridStyle;
  showAxes?: boolean;
  showTransformedImage?: boolean;
  scale?: number;
  pan?: { x: number; y: number };
  customStatement?: string;
  problemMode?: ProblemMode;
}

