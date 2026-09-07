export interface Point {
  x: number;
  y: number;
  label?: string;
}

export type GridStyle = 'lines' | 'dots' | 'axes';

export type ToolMode = 'select' | 'pan' | 'draw' | 'pivot';

export type TransformationType = 'translation' | 'reflection' | 'rotation' | 'homothety';

export type ReflectionAxis = 'x' | 'y' | 'y=x' | 'y=-x' | 'custom_x' | 'custom_y';

export interface PolygonPreset {
  id: string;
  name: string;
  category: string;
  vertices: Point[];
}

export interface TransformationConfig {
  type: TransformationType;
  // Traslación
  dx: number;
  dy: number;
  // Reflexión axial
  reflectionAxis: ReflectionAxis;
  customAxisValue: number; // Para x = k o y = k
  // Rotación
  angleDeg: number;
  center: Point;
  // Homotecia
  scaleFactor: number;
  homothetyCenter: Point;
}

export interface ViewportState {
  centerX: number;
  centerY: number;
  scale: number;
  gridStyle: GridStyle;
  showCoordinates: boolean;
  showLabels: boolean;
  showVectors: boolean;
  snapToGrid: boolean;
}
