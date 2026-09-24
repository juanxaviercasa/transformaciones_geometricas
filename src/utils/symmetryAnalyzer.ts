import { Point, PolygonPreset } from '../types/geometry';

export interface SymmetryAxis {
  id: string;
  name: string;
  type: 'vertical' | 'horizontal' | 'diagonal' | 'oblique';
  p1: Point; // Punto inicial extendido para trazado
  p2: Point; // Punto final extendido para trazado
  angleDeg: number;
  equation: string; // Ecuación cartesiana (ej. x = 0, y = x, etc.)
  description: string;
  color: string;
}

export interface ShapeSymmetryResult {
  shapeId?: string;
  shapeName: string;
  totalAxes: number;
  isInfinite?: boolean;
  axes: SymmetryAxis[];
  centroid: Point;
  educationalNotes: string[];
}

export interface WordAutoformaPreset extends PolygonPreset {
  symmetryCount: number;
  isInfinite?: boolean;
  iconName: string;
  baseDirection?: 'right' | 'up' | 'none';
  axesDetails: {
    name: string;
    type: 'vertical' | 'horizontal' | 'diagonal' | 'oblique';
    angleDeg: number;
    equation: string;
    description: string;
  }[];
}

// Paleta cromática distintiva y pedagógica para los ejes de simetría
export const SYMMETRY_COLORS = [
  '#ef4444', // Rojo vibrante (Eje 1)
  '#0284c7', // Azul cielo (Eje 2)
  '#10b981', // Esmeralda (Eje 3)
  '#f59e0b', // Ámbar (Eje 4)
  '#8b5cf6', // Púrpura (Eje 5)
  '#06b6d4', // Cian (Eje 6)
  '#ec4899', // Rosa brillante (Eje 7)
  '#f97316', // Naranja fuego (Eje 8)
  '#6366f1', // Índigo (Eje 9)
  '#14b8a6', // Turquesa (Eje 10)
];

/**
 * Catálogo completo de Autoformas estilo Word con información analítica de simetría
 */
export const WORD_AUTOFORMAS: WordAutoformaPreset[] = [
  {
    id: 'word_square',
    name: 'Cuadrado',
    category: 'Autoformas (Simetría)',
    symmetryCount: 4,
    iconName: 'Square',
    recommendedFor: 'Simetría Axial (4 Ejes)',
    description: 'Posee 4 ejes de simetría: 2 mediatrices perpendiculares y 2 diagonales.',
    vertices: [
      { x: -3, y: -3, label: 'A' },
      { x: 3, y: -3, label: 'B' },
      { x: 3, y: 3, label: 'C' },
      { x: -3, y: 3, label: 'D' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Mediatriz de los lados horizontales' },
      { name: 'Eje 2 (Horizontal)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Mediatriz de los lados verticales' },
      { name: 'Eje 3 (Diagonal Principal)', type: 'diagonal', angleDeg: 45, equation: 'y = x', description: 'Une los vértices opuestos A(-3,-3) y C(3,3)' },
      { name: 'Eje 4 (Diagonal Secundaria)', type: 'diagonal', angleDeg: 135, equation: 'y = -x', description: 'Une los vértices opuestos D(-3,3) y B(3,-3)' },
    ],
  },
  {
    id: 'word_star_5',
    name: 'Estrella de 5 Puntas',
    category: 'Autoformas (Simetría)',
    symmetryCount: 5,
    iconName: 'Star',
    recommendedFor: 'Simetría Axial (5 Ejes)',
    description: 'Posee exactamente 5 ejes de simetría; cada uno conecta una punta con la muesca opuesta.',
    vertices: (() => {
      const pts: Point[] = [];
      const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const R = 4.2;
      const r = 1.65;
      for (let i = 0; i < 10; i++) {
        const ang = (90 + i * 36) * (Math.PI / 180);
        const rad = i % 2 === 0 ? R : r;
        pts.push({
          x: Number((rad * Math.cos(ang)).toFixed(2)),
          y: Number((rad * Math.sin(ang)).toFixed(2)),
          label: labels[i],
        });
      }
      return pts;
    })(),
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Pasa por la punta superior y biseca la estrella' },
      { name: 'Eje 2 (Punta Sup-Der)', type: 'oblique', angleDeg: 18, equation: 'y = 0.32x', description: 'Conecta la punta superior derecha con la muesca opuesta' },
      { name: 'Eje 3 (Punta Sup-Izq)', type: 'oblique', angleDeg: 162, equation: 'y = -0.32x', description: 'Conecta la punta superior izquierda con la muesca opuesta' },
      { name: 'Eje 4 (Punta Inf-Izq)', type: 'oblique', angleDeg: 54, equation: 'y = 1.38x', description: 'Conecta la punta inferior izquierda con la muesca opuesta' },
      { name: 'Eje 5 (Punta Inf-Der)', type: 'oblique', angleDeg: 126, equation: 'y = -1.38x', description: 'Conecta la punta inferior derecha con la muesca opuesta' },
    ],
  },
  {
    id: 'word_star_4',
    name: 'Estrella de 4 Puntas',
    category: 'Autoformas (Simetría)',
    symmetryCount: 4,
    iconName: 'Sparkles',
    recommendedFor: 'Simetría Axial (4 Ejes)',
    description: 'Posee 4 ejes de simetría: 2 que cruzan las puntas y 2 que cruzan las esquinas interiores.',
    vertices: [
      { x: 0, y: 4.5, label: 'A' },
      { x: 1.2, y: 1.2, label: 'B' },
      { x: 4.5, y: 0, label: 'C' },
      { x: 1.2, y: -1.2, label: 'D' },
      { x: 0, y: -4.5, label: 'E' },
      { x: -1.2, y: -1.2, label: 'F' },
      { x: -4.5, y: 0, label: 'G' },
      { x: -1.2, y: 1.2, label: 'H' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Pasa por las puntas superior A e inferior E' },
      { name: 'Eje 2 (Horizontal)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Pasa por las puntas laterales G y C' },
      { name: 'Eje 3 (Diagonal Principal)', type: 'diagonal', angleDeg: 45, equation: 'y = x', description: 'Pasa por las muescas interiores D y H' },
      { name: 'Eje 4 (Diagonal Secundaria)', type: 'diagonal', angleDeg: 135, equation: 'y = -x', description: 'Pasa por las muescas interiores F y B' },
    ],
  },
  {
    id: 'word_arrow',
    name: 'Flecha de Bloque',
    category: 'Autoformas (Simetría)',
    symmetryCount: 1,
    iconName: 'ArrowRight',
    baseDirection: 'right',
    recommendedFor: 'Simetría Axial (1 Eje)',
    description: 'Posee un único eje de simetría longitudinal que divide la punta y el cuerpo en dos mitades congruentes.',
    vertices: [
      { x: -4, y: 1.3, label: 'A' },
      { x: 0.5, y: 1.3, label: 'B' },
      { x: 0.5, y: 3.0, label: 'C' },
      { x: 4.5, y: 0, label: 'D' },
      { x: 0.5, y: -3.0, label: 'E' },
      { x: 0.5, y: -1.3, label: 'F' },
      { x: -4, y: -1.3, label: 'G' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Longitudinal)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Eje horizontal que biseca la punta y el vástago' },
    ],
  },
  {
    id: 'word_cross',
    name: 'Cruz / Signo Más',
    category: 'Autoformas (Simetría)',
    symmetryCount: 4,
    iconName: 'Plus',
    recommendedFor: 'Simetría Axial (4 Ejes)',
    description: 'Posee 4 ejes de simetría ortogonales y diagonales gracias a la congruencia de sus 4 brazos.',
    vertices: [
      { x: -1.2, y: 3.6, label: 'A' },
      { x: 1.2, y: 3.6, label: 'B' },
      { x: 1.2, y: 1.2, label: 'C' },
      { x: 3.6, y: 1.2, label: 'D' },
      { x: 3.6, y: -1.2, label: 'E' },
      { x: 1.2, y: -1.2, label: 'F' },
      { x: 1.2, y: -3.6, label: 'G' },
      { x: -1.2, y: -3.6, label: 'H' },
      { x: -1.2, y: -1.2, label: 'I' },
      { x: -3.6, y: -1.2, label: 'J' },
      { x: -3.6, y: 1.2, label: 'K' },
      { x: -1.2, y: 1.2, label: 'L' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Biseca los brazos superior e inferior' },
      { name: 'Eje 2 (Horizontal)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Biseca los brazos laterales izquierdo y derecho' },
      { name: 'Eje 3 (Diagonal Principal)', type: 'diagonal', angleDeg: 45, equation: 'y = x', description: 'Corta por los vértices cóncavos internos' },
      { name: 'Eje 4 (Diagonal Secundaria)', type: 'diagonal', angleDeg: 135, equation: 'y = -x', description: 'Corta por los vértices cóncavos internos' },
    ],
  },
  {
    id: 'word_triangle_equilateral',
    name: 'Triángulo Equilátero',
    category: 'Autoformas (Simetría)',
    symmetryCount: 3,
    iconName: 'Triangle',
    baseDirection: 'up',
    recommendedFor: 'Simetría Axial (3 Ejes)',
    description: 'Posee 3 ejes de simetría; cada eje conecta un vértice con el punto medio del lado opuesto.',
    vertices: [
      { x: 0, y: 3.6, label: 'A' },
      { x: 3.12, y: -1.8, label: 'B' },
      { x: -3.12, y: -1.8, label: 'C' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Pasa por A(0, 3.6) y biseca la base horizontal BC' },
      { name: 'Eje 2 (Vértice B)', type: 'oblique', angleDeg: 150, equation: 'y = -0.58x', description: 'Pasa por B y biseca el lado opuesto AC' },
      { name: 'Eje 3 (Vértice C)', type: 'oblique', angleDeg: 30, equation: 'y = 0.58x', description: 'Pasa por C y biseca el lado opuesto AB' },
    ],
  },
  {
    id: 'word_triangle_isosceles',
    name: 'Triángulo Isósceles',
    category: 'Autoformas (Simetría)',
    symmetryCount: 1,
    iconName: 'Triangle',
    baseDirection: 'up',
    recommendedFor: 'Simetría Axial (1 Eje)',
    description: 'Posee un único eje de simetría vertical que biseca el ángulo desigual y la base.',
    vertices: [
      { x: 0, y: 4.0, label: 'A' },
      { x: 2.8, y: -2.0, label: 'B' },
      { x: -2.8, y: -2.0, label: 'C' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Mediatriz de la base)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Bisectriz del vértice A y mediatriz de BC' },
    ],
  },
  {
    id: 'word_rectangle',
    name: 'Rectángulo',
    category: 'Autoformas (Simetría)',
    symmetryCount: 2,
    iconName: 'RectangleHorizontal',
    recommendedFor: 'Simetría Axial (2 Ejes)',
    description: 'Posee 2 ejes de simetría perpendiculares. ¡Las diagonales NO son ejes de simetría!',
    vertices: [
      { x: -4, y: -2.2, label: 'A' },
      { x: 4, y: -2.2, label: 'B' },
      { x: 4, y: 2.2, label: 'C' },
      { x: -4, y: 2.2, label: 'D' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Vertical)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Mediatriz de los lados largos (AB y CD)' },
      { name: 'Eje 2 (Horizontal)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Mediatriz de los lados cortos (BC y DA)' },
    ],
  },
  {
    id: 'word_rhombus',
    name: 'Rombo',
    category: 'Autoformas (Simetría)',
    symmetryCount: 2,
    iconName: 'Diamond',
    recommendedFor: 'Simetría Axial (2 Ejes)',
    description: 'Posee 2 ejes de simetría que coinciden exactamente con sus dos diagonales.',
    vertices: [
      { x: 0, y: 4.0, label: 'A' },
      { x: 2.8, y: 0, label: 'B' },
      { x: 0, y: -4.0, label: 'C' },
      { x: -2.8, y: 0, label: 'D' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Diagonal Mayor)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Diagonal vertical entre vértices A y C' },
      { name: 'Eje 2 (Diagonal Menor)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Diagonal horizontal entre vértices D y B' },
    ],
  },
  {
    id: 'word_pentagon',
    name: 'Pentágono Regular',
    category: 'Autoformas (Simetría)',
    symmetryCount: 5,
    iconName: 'Hexagon',
    recommendedFor: 'Simetría Axial (5 Ejes)',
    description: 'Posee 5 ejes de simetría; cada uno une un vértice con el punto medio del lado opuesto.',
    vertices: (() => {
      const pts: Point[] = [];
      const labels = ['A', 'B', 'C', 'D', 'E'];
      const R = 3.6;
      for (let i = 0; i < 5; i++) {
        const ang = (90 + i * 72) * (Math.PI / 180);
        pts.push({
          x: Number((R * Math.cos(ang)).toFixed(2)),
          y: Number((R * Math.sin(ang)).toFixed(2)),
          label: labels[i],
        });
      }
      return pts;
    })(),
    axesDetails: [
      { name: 'Eje 1 (Vértice A)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Pasa por A y biseca el lado opuesto CD' },
      { name: 'Eje 2 (Vértice B)', type: 'oblique', angleDeg: 18, equation: 'y = 0.32x', description: 'Pasa por B y biseca el lado opuesto DE' },
      { name: 'Eje 3 (Vértice C)', type: 'oblique', angleDeg: 306, equation: 'y = -1.38x', description: 'Pasa por C y biseca el lado opuesto EA' },
      { name: 'Eje 4 (Vértice D)', type: 'oblique', angleDeg: 234, equation: 'y = 1.38x', description: 'Pasa por D y biseca el lado opuesto AB' },
      { name: 'Eje 5 (Vértice E)', type: 'oblique', angleDeg: 162, equation: 'y = -0.32x', description: 'Pasa por E y biseca el lado opuesto BC' },
    ],
  },
  {
    id: 'word_hexagon',
    name: 'Hexágono Regular',
    category: 'Autoformas (Simetría)',
    symmetryCount: 6,
    iconName: 'Hexagon',
    recommendedFor: 'Simetría Axial (6 Ejes)',
    description: 'Posee 6 ejes de simetría: 3 conectan vértices opuestos y 3 son mediatrices de lados opuestos.',
    vertices: (() => {
      const pts: Point[] = [];
      const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
      const R = 3.6;
      for (let i = 0; i < 6; i++) {
        const ang = (90 + i * 60) * (Math.PI / 180);
        pts.push({
          x: Number((R * Math.cos(ang)).toFixed(2)),
          y: Number((R * Math.sin(ang)).toFixed(2)),
          label: labels[i],
        });
      }
      return pts;
    })(),
    axesDetails: [
      { name: 'Eje 1 (Vértices A-D)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Une vértices opuestos A y D' },
      { name: 'Eje 2 (Lados Horizontales)', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Mediatriz de lados opuestos BC y EF' },
      { name: 'Eje 3 (Vértices B-E)', type: 'oblique', angleDeg: 30, equation: 'y = 0.58x', description: 'Une vértices opuestos B y E' },
      { name: 'Eje 4 (Vértices C-F)', type: 'oblique', angleDeg: 150, equation: 'y = -0.58x', description: 'Une vértices opuestos C y F' },
      { name: 'Eje 5 (Mediatriz AB-DE)', type: 'oblique', angleDeg: 60, equation: 'y = 1.73x', description: 'Mediatriz entre lados opuestos AB y DE' },
      { name: 'Eje 6 (Mediatriz CD-FA)', type: 'oblique', angleDeg: 120, equation: 'y = -1.73x', description: 'Mediatriz entre lados opuestos CD y FA' },
    ],
  },
  {
    id: 'word_trapezoid_isosceles',
    name: 'Trapecio Isósceles',
    category: 'Autoformas (Simetría)',
    symmetryCount: 1,
    iconName: 'Shapes',
    baseDirection: 'up',
    recommendedFor: 'Simetría Axial (1 Eje)',
    description: 'Posee un único eje de simetría vertical que biseca simultáneamente sus dos bases paralelas.',
    vertices: [
      { x: -3.5, y: -2.0, label: 'A' },
      { x: 3.5, y: -2.0, label: 'B' },
      { x: 2.0, y: 2.0, label: 'C' },
      { x: -2.0, y: 2.0, label: 'D' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Mediatriz de las bases)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Mediatriz común de la base mayor AB y base menor CD' },
    ],
  },
  {
    id: 'word_heart',
    name: 'Corazón Simétrico',
    category: 'Autoformas (Simetría)',
    symmetryCount: 1,
    iconName: 'Heart',
    baseDirection: 'up',
    recommendedFor: 'Simetría Axial (1 Eje)',
    description: 'Posee 1 eje de simetría vertical que atraviesa la hendidura superior y la punta inferior.',
    vertices: [
      { x: 0, y: 1.5, label: 'A' },
      { x: 1.6, y: 3.5, label: 'B' },
      { x: 3.4, y: 2.8, label: 'C' },
      { x: 3.5, y: 0.8, label: 'D' },
      { x: 2.2, y: -1.2, label: 'E' },
      { x: 0, y: -3.6, label: 'F' },
      { x: -2.2, y: -1.2, label: 'G' },
      { x: -3.5, y: 0.8, label: 'H' },
      { x: -3.4, y: 2.8, label: 'I' },
      { x: -1.6, y: 3.5, label: 'J' },
    ],
    axesDetails: [
      { name: 'Eje 1 (Eje Central)', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Pasa por la cúspide A(0, 1.5) y la punta F(0, -3.6)' },
    ],
  },
  {
    id: 'word_lightning',
    name: 'Rayo Asimétrico',
    category: 'Autoformas (Simetría)',
    symmetryCount: 0,
    iconName: 'Zap',
    recommendedFor: 'Contraste: Sin Simetría (0 Ejes)',
    description: 'Figura asimétrica de Word. Ideal para demostrar que no todas las figuras tienen ejes de simetría.',
    vertices: [
      { x: 0.5, y: 4.0, label: 'A' },
      { x: 2.8, y: 0.2, label: 'B' },
      { x: 0.8, y: 0.2, label: 'C' },
      { x: 2.2, y: -4.0, label: 'D' },
      { x: -1.8, y: -0.6, label: 'E' },
      { x: 0.0, y: -0.6, label: 'F' },
      { x: -1.2, y: 2.2, label: 'G' },
    ],
    axesDetails: [],
  },
  {
    id: 'word_circle',
    name: 'Círculo (Infinitos Ejes)',
    category: 'Autoformas (Simetría)',
    symmetryCount: 999, // Representa infinito en conteo
    isInfinite: true,
    iconName: 'Circle',
    recommendedFor: 'Simetría Axial (Infinitos Ejes)',
    description: 'Cualquier recta que pase por su centro es un eje de simetría. ¡Posee infinitos (∞) ejes!',
    vertices: (() => {
      const pts: Point[] = [];
      const R = 3.6;
      const n = 16;
      for (let i = 0; i < n; i++) {
        const ang = (i * (360 / n)) * (Math.PI / 180);
        pts.push({
          x: Number((R * Math.cos(ang)).toFixed(2)),
          y: Number((R * Math.sin(ang)).toFixed(2)),
          label: `P${i + 1}`,
        });
      }
      return pts;
    })(),
    axesDetails: [
      { name: 'Diámetro Vertical', type: 'vertical', angleDeg: 90, equation: 'x = 0', description: 'Diámetro vertical del círculo' },
      { name: 'Diámetro Horizontal', type: 'horizontal', angleDeg: 0, equation: 'y = 0', description: 'Diámetro horizontal del círculo' },
      { name: 'Diámetro a 45°', type: 'diagonal', angleDeg: 45, equation: 'y = x', description: 'Diámetro diagonal principal' },
      { name: 'Diámetro a 135°', type: 'diagonal', angleDeg: 135, equation: 'y = -x', description: 'Diámetro diagonal secundario' },
    ],
  },
];

/**
 * Extiende una recta a través de la caja delimitadora de la figura con margen generoso
 */
export function extendLineThroughBounds(
  p1: Point,
  p2: Point,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  marginFactor = 0.45
): [Point, Point] {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const width = Math.max(2, bounds.maxX - bounds.minX);
  const height = Math.max(2, bounds.maxY - bounds.minY);
  const maxSpan = Math.max(width, height);
  const reach = maxSpan * (0.6 + marginFactor);

  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;

  // Proyectar el centro sobre la recta para anclarla
  const t = (cx - p1.x) * ux + (cy - p1.y) * uy;
  const anchorX = p1.x + t * ux;
  const anchorY = p1.y + t * uy;

  return [
    { x: Number((anchorX - reach * ux).toFixed(2)), y: Number((anchorY - reach * uy).toFixed(2)) },
    { x: Number((anchorX + reach * ux).toFixed(2)), y: Number((anchorY + reach * uy).toFixed(2)) },
  ];
}

/**
 * Calcula los límites de una lista de puntos
 */
export function getBounds(vertices: Point[]): { minX: number; maxX: number; minY: number; maxY: number } {
  if (vertices.length === 0) {
    return { minX: -5, maxX: 5, minY: -5, maxY: 5 };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, maxX, minY, maxY };
}

/**
 * Algoritmo matemático para analizar y detectar los ejes de simetría de CUALQUIER polígono
 */
export function analyzeSymmetry(
  vertices: Point[],
  knownAutoformaId?: string,
  shapeRotationDeg: number = 0
): ShapeSymmetryResult {
  if (vertices.length < 3) {
    return {
      shapeName: 'Figura Incompleta',
      totalAxes: 0,
      axes: [],
      centroid: vertices[0] || { x: 0, y: 0 },
      educationalNotes: ['Se requieren al menos 3 vértices para evaluar la simetría axial.'],
    };
  }

  // 1. Verificar si coincide con una autoforma conocida
  const matchedAutoforma = WORD_AUTOFORMAS.find(
    (w) => w.id === knownAutoformaId
  );

  const bounds = getBounds(vertices);
  const n = vertices.length;

  // Centroide
  let sumX = 0;
  let sumY = 0;
  for (const v of vertices) {
    sumX += v.x;
    sumY += v.y;
  }
  const centroid: Point = {
    x: Number((sumX / n).toFixed(3)),
    y: Number((sumY / n).toFixed(3)),
  };

  // Si es una autoforma curada
  if (matchedAutoforma) {
    const isCircle = matchedAutoforma.isInfinite;
    const normRotation = ((shapeRotationDeg % 360) + 360) % 360;

    const axes: SymmetryAxis[] = matchedAutoforma.axesDetails.map((detail, idx) => {
      // Rotar el ángulo del eje según la rotación de la figura
      const rotatedAngle = ((detail.angleDeg + normRotation) % 180 + 180) % 180;
      const deg = Math.round(rotatedAngle);
      const rad = (rotatedAngle * Math.PI) / 180;
      const ux = Math.cos(rad);
      const uy = Math.sin(rad);
      const rawP1 = { x: centroid.x - 5 * ux, y: centroid.y - 5 * uy };
      const rawP2 = { x: centroid.x + 5 * ux, y: centroid.y + 5 * uy };
      const [extP1, extP2] = extendLineThroughBounds(rawP1, rawP2, bounds);

      let type: 'vertical' | 'horizontal' | 'diagonal' | 'oblique' = 'oblique';
      let eq = '';
      let typeLabel = '';

      if (deg === 90 || deg === 270) {
        type = 'vertical';
        eq = Math.abs(centroid.x) < 0.05 ? 'x = 0' : `x = ${centroid.x.toFixed(1)}`;
        typeLabel = 'Vertical';
      } else if (deg === 0 || deg === 180) {
        type = 'horizontal';
        eq = Math.abs(centroid.y) < 0.05 ? 'y = 0' : `y = ${centroid.y.toFixed(1)}`;
        typeLabel = 'Horizontal';
      } else if (deg === 45) {
        type = 'diagonal';
        eq = Math.abs(centroid.x - centroid.y) < 0.05 ? 'y = x' : `y - ${centroid.y.toFixed(1)} = x - ${centroid.x.toFixed(1)}`;
        typeLabel = 'Diagonal 45°';
      } else if (deg === 135) {
        type = 'diagonal';
        eq = Math.abs(centroid.x + centroid.y) < 0.05 ? 'y = -x' : `y - ${centroid.y.toFixed(1)} = -(x - ${centroid.x.toFixed(1)})`;
        typeLabel = 'Diagonal 135°';
      } else {
        type = 'oblique';
        const m = Math.tan(rad);
        const b = centroid.y - m * centroid.x;
        const mStr = Math.abs(m) < 0.001 ? '0' : m.toFixed(2);
        const bStr = Math.abs(b) < 0.05 ? '' : b > 0 ? ` + ${b.toFixed(1)}` : ` - ${Math.abs(b).toFixed(1)}`;
        eq = `y = ${mStr}x${bStr}`;
        typeLabel = `${deg}°`;
      }

      const cleanName = detail.name.replace(/\((.*?)\)/g, '').trim();
      const displayName = normRotation === 0 ? detail.name : `${cleanName} (${typeLabel})`;

      return {
        id: `axis-${idx + 1}`,
        name: `Eje ${idx + 1}: ${displayName}`,
        type,
        angleDeg: deg,
        p1: extP1,
        p2: extP2,
        equation: eq,
        description: normRotation === 0 ? detail.description : `Corte de simetría con dirección ${typeLabel.toLowerCase()} (${deg}°) y ecuación ${eq}.`,
        color: SYMMETRY_COLORS[idx % SYMMETRY_COLORS.length],
      };
    });

    const countText = isCircle
      ? 'infinitos (∞) ejes'
      : matchedAutoforma.symmetryCount === 1
      ? '1 eje'
      : `${matchedAutoforma.symmetryCount} ejes`;

    return {
      shapeId: matchedAutoforma.id,
      shapeName: matchedAutoforma.name,
      totalAxes: isCircle ? Infinity : matchedAutoforma.symmetryCount,
      isInfinite: isCircle,
      axes,
      centroid,
      educationalNotes: [
        matchedAutoforma.description || '',
        `Máximo de ejes de simetría trazables: ${countText}.`,
        'Cada corte divide la figura en dos mitades exactamente congruentes y especulares.',
      ],
    };
  }

  // 2. DETECTOR MATEMÁTICO UNIVERSAL DE EJES DE SIMETRÍA
  // Teorema euclidiano: en cualquier polígono plano simétrico, todo eje de simetría
  // debe pasar obligatoriamente por el centroide y por:
  // a) Un vértice, o
  // b) El punto medio de un lado.
  const candidatesRad: number[] = [];

  const addCandidateAngle = (targetX: number, targetY: number) => {
    const dx = targetX - centroid.x;
    const dy = targetY - centroid.y;
    if (Math.hypot(dx, dy) < 0.05) return;
    let ang = Math.atan2(dy, dx);
    if (ang < 0) ang += Math.PI;
    while (ang >= Math.PI) ang -= Math.PI;
    // Deduplicar ángulos cercanos (< 2.5 grados = 0.043 rad)
    const exists = candidatesRad.some((existing) => {
      const diff = Math.abs(existing - ang);
      return diff < 0.043 || Math.abs(diff - Math.PI) < 0.043;
    });
    if (!exists) {
      candidatesRad.push(ang);
    }
  };

  for (let i = 0; i < n; i++) {
    // Candidato a través de vértice
    addCandidateAngle(vertices[i].x, vertices[i].y);
    // Candidato a través de punto medio de lado
    const next = vertices[(i + 1) % n];
    addCandidateAngle((vertices[i].x + next.x) / 2, (vertices[i].y + next.y) / 2);
  }

  // Medida de tolerancia según el tamaño de la figura
  const maxSpan = Math.max(1, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const eps = Math.max(0.12, maxSpan * 0.035);

  const detectedAxes: SymmetryAxis[] = [];

  candidatesRad.forEach((angRad) => {
    const ux = Math.cos(angRad);
    const uy = Math.sin(angRad);
    // Normal a la recta
    const nx = -uy;
    const ny = ux;

    // Probar el reflejo de cada vértice sobre la recta que pasa por centroid
    // P' = P - 2 * ((P - C) . n) * n
    let isSymmetric = true;
    const matchedIndices = new Set<number>();

    for (let i = 0; i < n; i++) {
      const vx = vertices[i].x - centroid.x;
      const vy = vertices[i].y - centroid.y;
      const dot = vx * nx + vy * ny;
      const refX = vertices[i].x - 2 * dot * nx;
      const refY = vertices[i].y - 2 * dot * ny;

      // Buscar si algún vértice original coincide con este reflejo
      let foundMatch = -1;
      for (let j = 0; j < n; j++) {
        if (matchedIndices.has(j)) continue;
        const d = Math.hypot(refX - vertices[j].x, refY - vertices[j].y);
        if (d <= eps) {
          foundMatch = j;
          break;
        }
      }

      if (foundMatch === -1) {
        isSymmetric = false;
        break;
      }
      matchedIndices.add(foundMatch);
    }

    if (isSymmetric) {
      const deg = Math.round((angRad * 180) / Math.PI);
      let type: 'vertical' | 'horizontal' | 'diagonal' | 'oblique' = 'oblique';
      let eq = '';

      if (deg === 90 || deg === 270) {
        type = 'vertical';
        eq = Math.abs(centroid.x) < 0.05 ? 'x = 0' : `x = ${centroid.x.toFixed(1)}`;
      } else if (deg === 0 || deg === 180) {
        type = 'horizontal';
        eq = Math.abs(centroid.y) < 0.05 ? 'y = 0' : `y = ${centroid.y.toFixed(1)}`;
      } else if (deg === 45) {
        type = 'diagonal';
        eq = 'y = x';
      } else if (deg === 135) {
        type = 'diagonal';
        eq = 'y = -x';
      } else {
        const m = Math.tan(angRad);
        const b = centroid.y - m * centroid.x;
        eq = `y = ${m.toFixed(1)}x ${b >= 0 ? '+' : ''}${b.toFixed(1)}`;
      }

      const p1Raw = { x: centroid.x - 5 * ux, y: centroid.y - 5 * uy };
      const p2Raw = { x: centroid.x + 5 * ux, y: centroid.y + 5 * uy };
      const [extP1, extP2] = extendLineThroughBounds(p1Raw, p2Raw, bounds);

      const axisIndex = detectedAxes.length + 1;
      detectedAxes.push({
        id: `detected-${axisIndex}`,
        name: `Eje ${axisIndex} (${type === 'vertical' ? 'Vertical' : type === 'horizontal' ? 'Horizontal' : `${deg}°`})`,
        type,
        angleDeg: deg,
        p1: extP1,
        p2: extP2,
        equation: eq,
        description: `Eje de simetría con dirección a ${deg}° que biseca la figura.`,
        color: SYMMETRY_COLORS[(axisIndex - 1) % SYMMETRY_COLORS.length],
      });
    }
  });

  return {
    shapeName: n === 3 ? 'Triángulo' : n === 4 ? 'Cuadrilátero' : `Polígono de ${n} lados`,
    totalAxes: detectedAxes.length,
    axes: detectedAxes,
    centroid,
    educationalNotes: [
      detectedAxes.length === 1 ? 'Se detectó 1 eje de simetría axial.' : `Se detectaron ${detectedAxes.length} ejes de simetría axial.`,
      detectedAxes.length > 0
        ? 'La figura se superpone exactamente consigo misma al reflejarse respecto a cualquiera de estos ejes.'
        : 'La figura es asimétrica bajo reflexiones axiales.',
    ],
  };
}
