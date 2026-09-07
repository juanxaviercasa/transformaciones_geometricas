export interface Point {
  x: number;
  y: number;
  label?: string;
}

export type GridStyle = 'lines' | 'dots' | 'axes';

export type ToolMode = 'select' | 'pan' | 'draw' | 'pivot';

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
  // Reflexión axial
  reflectionAxis: ReflectionAxis;
  customAxisValue: number; // Para x = k o y = k
  generalLine: GeneralLineCoefficients; // Para Ax + By + C = 0
  // Simetría Central
  centralCenter: Point; // O(h, k)
  // Rotación
  angleDeg: number;
  direction: 'anticlockwise' | 'clockwise';
  center: Point; // C(x0, y0)
  // Homotecia
  scaleFactor: number; // k
  homothetyCenter: Point; // O(x0, y0)
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
  constructionElements: ConstructionElements;
  algebraicSteps: AlgebraicStep[];
  generalFormula: string;
  geometricProperties: {
    isometryType: string;
    invariants: string[];
    pedagogicalNotes: string;
  };
}

export interface ProblemScenario {
  id: string;
  mode: ProblemMode;
  category: string;
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
  showAlgebraicNotebook: boolean;
  cleanBoardMode: boolean;
}
