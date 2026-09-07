import { Point, TransformationConfig, PolygonPreset } from '../types/geometry';

/**
 * Aplica una transformación geométrica completa a un punto (x, y)
 */
export function transformPoint(p: Point, config: TransformationConfig): Point {
  const { x, y } = p;
  const label = p.label ? `${p.label}'` : undefined;

  switch (config.type) {
    case 'translation':
      return {
        x: Number((x + config.dx).toFixed(3)),
        y: Number((y + config.dy).toFixed(3)),
        label,
      };

    case 'reflection': {
      let rx = x;
      let ry = y;
      if (config.reflectionAxis === 'x') {
        ry = -y;
      } else if (config.reflectionAxis === 'y') {
        rx = -x;
      } else if (config.reflectionAxis === 'y=x') {
        rx = y;
        ry = x;
      } else if (config.reflectionAxis === 'y=-x') {
        rx = -y;
        ry = -x;
      } else if (config.reflectionAxis === 'custom_x') {
        // Reflexión respecto a recta vertical x = k: x' = 2k - x, y' = y
        const k = config.customAxisValue ?? 0;
        rx = 2 * k - x;
        ry = y;
      } else if (config.reflectionAxis === 'custom_y') {
        // Reflexión respecto a recta horizontal y = k: x' = x, y' = 2k - y
        const k = config.customAxisValue ?? 0;
        rx = x;
        ry = 2 * k - y;
      }
      return {
        x: Number(rx.toFixed(3)),
        y: Number(ry.toFixed(3)),
        label,
      };
    }

    case 'rotation': {
      const rad = (config.angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const cx = config.center.x;
      const cy = config.center.y;

      // Trasladar al origen relativo, rotar, re-trasladar
      const dx = x - cx;
      const dy = y - cy;
      const rx = cx + (dx * cos - dy * sin);
      const ry = cy + (dx * sin + dy * cos);

      return {
        x: Number(rx.toFixed(3)),
        y: Number(ry.toFixed(3)),
        label,
      };
    }

    case 'homothety': {
      const k = config.scaleFactor;
      const cx = config.homothetyCenter.x;
      const cy = config.homothetyCenter.y;

      const rx = cx + k * (x - cx);
      const ry = cy + k * (y - cy);

      return {
        x: Number(rx.toFixed(3)),
        y: Number(ry.toFixed(3)),
        label,
      };
    }

    default:
      return { x, y, label };
  }
}

/**
 * Transforma un conjunto de vértices de un polígono
 */
export function transformVertices(vertices: Point[], config: TransformationConfig): Point[] {
  return vertices.map((v) => transformPoint(v, config));
}

/**
 * Interpola continuamente la posición de un punto entre t = 0 (original) y t = 1 (final)
 * para animaciones dinámicas fluidas
 */
export function interpolatePoint(p: Point, config: TransformationConfig, t: number): Point {
  const clampedT = Math.max(0, Math.min(1, t));
  const { x, y } = p;
  const label = p.label ? `${p.label}'` : undefined;

  switch (config.type) {
    case 'translation':
      return {
        x: Number((x + clampedT * config.dx).toFixed(3)),
        y: Number((y + clampedT * config.dy).toFixed(3)),
        label,
      };

    case 'rotation': {
      // Rotación angular progresiva desde 0 hasta config.angleDeg
      const rad = (config.angleDeg * clampedT * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const cx = config.center.x;
      const cy = config.center.y;

      const dx = x - cx;
      const dy = y - cy;
      const rx = cx + (dx * cos - dy * sin);
      const ry = cy + (dx * sin + dy * cos);

      return {
        x: Number(rx.toFixed(3)),
        y: Number(ry.toFixed(3)),
        label,
      };
    }

    case 'reflection': {
      // Movimiento lineal directo perpendicular hacia el reflejo
      const target = transformPoint(p, config);
      return {
        x: Number(((1 - clampedT) * x + clampedT * target.x).toFixed(3)),
        y: Number(((1 - clampedT) * y + clampedT * target.y).toFixed(3)),
        label,
      };
    }

    case 'homothety': {
      // Homotecia progresiva con factor kt que va de 1 hasta k
      const kt = 1 + clampedT * (config.scaleFactor - 1);
      const cx = config.homothetyCenter.x;
      const cy = config.homothetyCenter.y;
      const rx = cx + kt * (x - cx);
      const ry = cy + kt * (y - cy);

      return {
        x: Number(rx.toFixed(3)),
        y: Number(ry.toFixed(3)),
        label,
      };
    }

    default:
      return { x, y, label };
  }
}

/**
 * Interpola todos los vértices según el progreso t
 */
export function interpolateVertices(vertices: Point[], config: TransformationConfig, t: number): Point[] {
  return vertices.map((v) => interpolatePoint(v, config, t));
}

/**
 * Figuras geométricas prediseñadas para uso pedagógico inmediato
 */
export const SHAPE_PRESETS: PolygonPreset[] = [
  {
    id: 'triangle_scalene',
    name: 'Triángulo Escaleno',
    category: 'Triángulos',
    vertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 7, y: 2, label: 'B' },
      { x: 4, y: 8, label: 'C' },
    ],
  },
  {
    id: 'triangle_right',
    name: 'Triángulo Rectángulo',
    category: 'Triángulos',
    vertices: [
      { x: 2, y: 1, label: 'A' },
      { x: 8, y: 1, label: 'B' },
      { x: 2, y: 7, label: 'C' },
    ],
  },
  {
    id: 'trapezoid',
    name: 'Trapecio Isósceles',
    category: 'Cuadriláteros',
    vertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 7, y: 1, label: 'B' },
      { x: 5, y: 6, label: 'C' },
      { x: 3, y: 6, label: 'D' },
    ],
  },
  {
    id: 'arrow',
    name: 'Flecha Direccional',
    category: 'Polígonos',
    vertices: [
      { x: 2, y: 1, label: 'A' },
      { x: 5, y: 1, label: 'B' },
      { x: 5, y: 4, label: 'C' },
      { x: 7, y: 4, label: 'D' },
      { x: 3.5, y: 8, label: 'E' },
      { x: 0, y: 4, label: 'F' },
      { x: 2, y: 4, label: 'G' },
    ],
  },
  {
    id: 'house',
    name: 'Casa Geométrica',
    category: 'Polígonos',
    vertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 7, y: 1, label: 'B' },
      { x: 7, y: 5, label: 'C' },
      { x: 4, y: 8, label: 'D' },
      { x: 1, y: 5, label: 'E' },
    ],
  },
  {
    id: 'quad_centered',
    name: 'Cuadrado Simétrico',
    category: 'Cuadriláteros',
    vertices: [
      { x: -3, y: -3, label: 'A' },
      { x: 3, y: -3, label: 'B' },
      { x: 3, y: 3, label: 'C' },
      { x: -3, y: 3, label: 'D' },
    ],
  },
];

/**
 * Información teórica y fórmulas matemáticas para el panel educativo
 */
export function getTransformationTheory(config: TransformationConfig): {
  title: string;
  isometryType: string;
  formula: string;
  invariants: string[];
  notes: string;
} {
  switch (config.type) {
    case 'translation':
      return {
        title: 'Traslación por Vector T(dx, dy)',
        isometryType: 'Isometría Directa (Mantiene distancias, ángulos y orientación horaria)',
        formula: `(x', y') = (x + ${config.dx}, y + ${config.dy})`,
        invariants: [
          'Conserva todas las distancias (las longitudes de los lados son iguales).',
          'Conserva todos los ángulos interiores.',
          'Conserva el paralelismo entre lados correspondientes.',
          'Mantiene la misma orientación (no se invierte como un espejo).',
        ],
        notes:
          'Todos los puntos de la figura se desplazan en la misma dirección y sentido, a una distancia fija dada por la magnitud del vector.',
      };

    case 'reflection': {
      let axisDesc = '';
      let formulaStr = '';
      if (config.reflectionAxis === 'x') {
        axisDesc = 'Eje de las Abscisas (Eje X: y = 0)';
        formulaStr = "(x', y') = (x, -y)";
      } else if (config.reflectionAxis === 'y') {
        axisDesc = 'Eje de las Ordenadas (Eje Y: x = 0)';
        formulaStr = "(x', y') = (-x, y)";
      } else if (config.reflectionAxis === 'y=x') {
        axisDesc = 'Primera Bisectriz (Diagonal y = x)';
        formulaStr = "(x', y') = (y, x)";
      } else if (config.reflectionAxis === 'y=-x') {
        axisDesc = 'Segunda Bisectriz (Diagonal y = -x)';
        formulaStr = "(x', y') = (-y, -x)";
      } else if (config.reflectionAxis === 'custom_x') {
        axisDesc = `Recta Vertical x = ${config.customAxisValue}`;
        formulaStr = `(x', y') = (2(${config.customAxisValue}) - x, y) = (${2 * config.customAxisValue} - x, y)`;
      } else if (config.reflectionAxis === 'custom_y') {
        axisDesc = `Recta Horizontal y = ${config.customAxisValue}`;
        formulaStr = `(x', y') = (x, 2(${config.customAxisValue}) - y) = (x, ${2 * config.customAxisValue} - y)`;
      }

      return {
        title: `Reflexión Axial respecto a ${axisDesc}`,
        isometryType: 'Isometría Inversa (Mantiene distancias y ángulos, invierte orientación)',
        formula: formulaStr,
        invariants: [
          'Conserva las longitudes de los segmentos y el área de la figura.',
          'Conserva las medidas de los ángulos interiores.',
          'Invierte el orden de giro de los vértices (sentido horario se vuelve antihorario).',
          'El eje de reflexión es la mediatriz del segmento que une cada punto P con su imagen P\'.',
        ],
        notes:
          'Funciona como un espejo plano perfecto. Cada punto y su simétrico se encuentran a la misma distancia perpendicular del eje.',
      };
    }

    case 'rotation':
      return {
        title: `Rotación de ${config.angleDeg}° respecto al Centro C(${config.center.x}, ${config.center.y})`,
        isometryType: 'Isometría Directa (Mantiene distancias, ángulos y orientación)',
        formula: `(x', y') = C + R_θ · (P - C)\n[x'] = [cx] + [cos θ  -sin θ] · [x - cx]\n[y'] = [cy] + [sin θ   cos θ] · [y - cy]`,
        invariants: [
          'Conserva las distancias y dimensiones de la figura (figura congruente).',
          'Conserva los ángulos internos y el área.',
          'La distancia de cada vértice al centro de giro permanece invariable: d(P, C) = d(P\', C).',
          'Un ángulo positivo indica giro antihorario (+); negativo indica giro horario (-).',
        ],
        notes:
          'Cada punto describe un arco circular con centro en C y apertura angular θ. Si C = (0,0) y θ = 90°, (x, y) ➔ (-y, x). Si θ = 180°, (x, y) ➔ (-x, -y).',
      };

    case 'homothety':
      return {
        title: `Homotecia de Razón k = ${config.scaleFactor} centrada en C(${config.homothetyCenter.x}, ${config.homothetyCenter.y})`,
        isometryType:
          config.scaleFactor === 1
            ? 'Identidad (k = 1)'
            : config.scaleFactor === -1
            ? 'Isometría (Simetría Central k = -1)'
            : 'Transformación de Semejanza (No es isometría, modifica longitudes)',
        formula: `(x', y') = (${config.homothetyCenter.x} + ${config.scaleFactor}·(x - ${config.homothetyCenter.x}), ${config.homothetyCenter.y} + ${config.scaleFactor}·(y - ${config.homothetyCenter.y}))`,
        invariants: [
          'Conserva los ángulos interiores y la forma de la figura (figuras semejantes).',
          'Multiplica todas las longitudes lineales por |k|: Lado\' = |k| · Lado.',
          `Multiplica el área por k² = ${(config.scaleFactor * config.scaleFactor).toFixed(2)}: Área' = k² · Área.`,
          config.scaleFactor < 0
            ? 'Razón negativa (k < 0): Homotecia inversa (la figura se invierte respecto al centro).'
            : 'Razón positiva (k > 0): Homotecia directa (la figura queda del mismo lado del centro).',
        ],
        notes:
          'Los puntos correspondientes están alineados con el centro de homotecia C: los rayos que parten de C pasan simultáneamente por P y P\'.',
      };
  }
}

