import {
  Point,
  TransformationConfig,
  ConstructionElements,
  AlgebraicStep,
  ProblemEngineResult,
  ProblemScenario
} from '../types/geometry';

/**
 * Utilidades matemáticas fundamentales de geometría analítica
 */
export function formatNum(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  if (Object.is(rounded, -0)) return '0';
  return rounded.toString();
}

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: Number(((p1.x + p2.x) / 2).toFixed(2)),
    y: Number(((p1.y + p2.y) / 2).toFixed(2))
  };
}

/**
 * Motor central de resolución geométrica y generación didáctica
 */
export function solveGeometryProblem(
  vertices: Point[],
  config: TransformationConfig
): ProblemEngineResult {
  const transformedVertices: Point[] = [];
  const constructionElements: ConstructionElements = {};
  const algebraicSteps: AlgebraicStep[] = [];

  let generalFormula = '';
  let isometryType = '';
  let invariants: string[] = [];
  let pedagogicalNotes = '';

  switch (config.type) {
    case 'translation': {
      generalFormula = `(x', y') = (x + (${formatNum(config.dx)}), y + (${formatNum(config.dy)}))`;
      isometryType = 'Isometría Directa (Conserva longitudes, ángulos y orientación)';
      invariants = [
        'Conserva las distancias entre cualquier par de puntos: d(P, Q) = d(P\', Q\').',
        'Conserva los ángulos interiores y el paralelismo de los lados.',
        'El vector director v = (Δx, Δy) es idéntico para todos los vértices del plano.',
        'No existen puntos dobles (invariantes), salvo que v sea el vector nulo (0,0).'
      ];
      pedagogicalNotes = `Cada vértice P(x, y) se desplaza simultáneamente ${formatNum(config.dx)} unidades en el eje X y ${formatNum(config.dy)} unidades en el eje Y.`;

      const vectorGuides = [];

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const vName = p.label || String.fromCharCode(65 + i);
        const xPrime = Number((p.x + config.dx).toFixed(2));
        const yPrime = Number((p.y + config.dy).toFixed(2));
        const pPrime: Point = { x: xPrime, y: yPrime, label: `${vName}'` };
        transformedVertices.push(pPrime);

        // Descomposición vectorial: cateto horizontal + cateto vertical
        const intermediatePoint: Point = { x: xPrime, y: p.y };
        vectorGuides.push({
          start: p,
          intermediate: intermediatePoint,
          end: pPrime,
          dx: config.dx,
          dy: config.dy
        });

        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: `P' = (x + v_x, y + v_y)`,
          substitutionLines: [
            `x' = ${formatNum(p.x)} + (${formatNum(config.dx)}) = ${formatNum(xPrime)}`,
            `y' = ${formatNum(p.y)} + (${formatNum(config.dy)}) = ${formatNum(yPrime)}`
          ],
          resultLine: `${vName}'(${formatNum(xPrime)}, ${formatNum(yPrime)})`
        });
      }

      constructionElements.vectorGuides = vectorGuides;
      break;
    }

    case 'reflection': {
      const { reflectionAxis, customAxisValue, generalLine } = config;
      const perpGuides = [];

      let axisDescription = '';
      if (reflectionAxis === 'x') axisDescription = 'Eje X (y = 0)';
      else if (reflectionAxis === 'y') axisDescription = 'Eje Y (x = 0)';
      else if (reflectionAxis === 'y=x') axisDescription = 'Primera Bisectriz (y = x)';
      else if (reflectionAxis === 'y=-x') axisDescription = 'Segunda Bisectriz (y = -x)';
      else if (reflectionAxis === 'custom_x') axisDescription = `Recta vertical x = ${formatNum(customAxisValue)}`;
      else if (reflectionAxis === 'custom_y') axisDescription = `Recta horizontal y = ${formatNum(customAxisValue)}`;
      else if (reflectionAxis === 'general') {
        const { a, b, c } = generalLine;
        axisDescription = `Recta general ${formatNum(a)}x + ${formatNum(b)}y + ${formatNum(c)} = 0`;
      }

      isometryType = 'Isometría Inversa (Conserva longitudes y ángulos, pero invierte el sentido de giro)';
      invariants = [
        'Conserva la congruencia de los segmentos y la medida de todos los ángulos.',
        'Invierte la orientación espacial de la figura (sentido horario ➔ antihorario).',
        'La recta de reflexión L es la MEDIATRIZ exacta del segmento PP\'.',
        'Todo punto situado sobre el eje de simetría permanece invariante (P = P\').'
      ];
      pedagogicalNotes = `La distancia perpendicular desde cada punto P a la recta L es exactamente igual a la distancia desde L a su imagen P' (d(P, H) = d(H, P')).`;

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const vName = p.label || String.fromCharCode(65 + i);
        let rx = p.x;
        let ry = p.y;
        let footX = p.x;
        let footY = p.y;
        let stepFormula = '';
        let subs: string[] = [];

        if (reflectionAxis === 'x') {
          rx = p.x;
          ry = -p.y;
          footX = p.x;
          footY = 0;
          stepFormula = `(x', y') = (x, -y)`;
          subs = [
            `x' = ${formatNum(p.x)}`,
            `y' = -(${formatNum(p.y)}) = ${formatNum(ry)}`
          ];
        } else if (reflectionAxis === 'y') {
          rx = -p.x;
          ry = p.y;
          footX = 0;
          footY = p.y;
          stepFormula = `(x', y') = (-x, y)`;
          subs = [
            `x' = -(${formatNum(p.x)}) = ${formatNum(rx)}`,
            `y' = ${formatNum(p.y)}`
          ];
        } else if (reflectionAxis === 'y=x') {
          rx = p.y;
          ry = p.x;
          footX = (p.x + p.y) / 2;
          footY = (p.x + p.y) / 2;
          stepFormula = `(x', y') = (y, x)`;
          subs = [
            `x' = y = ${formatNum(rx)}`,
            `y' = x = ${formatNum(ry)}`
          ];
        } else if (reflectionAxis === 'y=-x') {
          rx = -p.y;
          ry = -p.x;
          footX = (p.x - p.y) / 2;
          footY = (p.y - p.x) / 2;
          stepFormula = `(x', y') = (-y, -x)`;
          subs = [
            `x' = -(${formatNum(p.y)}) = ${formatNum(rx)}`,
            `y' = -(${formatNum(p.x)}) = ${formatNum(ry)}`
          ];
        } else if (reflectionAxis === 'custom_x') {
          const k = customAxisValue;
          rx = 2 * k - p.x;
          ry = p.y;
          footX = k;
          footY = p.y;
          stepFormula = `x' = 2k - x,  y' = y`;
          subs = [
            `x' = 2(${formatNum(k)}) - (${formatNum(p.x)}) = ${formatNum(2 * k)} - ${formatNum(p.x)} = ${formatNum(rx)}`,
            `y' = ${formatNum(p.y)}`
          ];
        } else if (reflectionAxis === 'custom_y') {
          const k = customAxisValue;
          rx = p.x;
          ry = 2 * k - p.y;
          footX = p.x;
          footY = k;
          stepFormula = `x' = x,  y' = 2k - y`;
          subs = [
            `x' = ${formatNum(p.x)}`,
            `y' = 2(${formatNum(k)}) - (${formatNum(p.y)}) = ${formatNum(2 * k)} - ${formatNum(p.y)} = ${formatNum(ry)}`
          ];
        } else if (reflectionAxis === 'general') {
          const { a, b, c } = generalLine;
          const denom = a * a + b * b || 1;
          const factor = (2 * (a * p.x + b * p.y + c)) / denom;
          rx = p.x - a * factor;
          ry = p.y - b * factor;
          // Pie de perpendicular
          footX = p.x - a * (factor / 2);
          footY = p.y - b * (factor / 2);
          stepFormula = `P' = P - 2·n·[(Ax + By + C) / (A² + B²)]`;
          subs = [
            `Distancia con signo factor = 2·(${formatNum(a)}·${formatNum(p.x)} + ${formatNum(b)}·${formatNum(p.y)} + ${formatNum(c)}) / (${formatNum(a)}² + ${formatNum(b)}²) = ${formatNum(factor)}`,
            `x' = ${formatNum(p.x)} - ${formatNum(a)}·(${formatNum(factor)}) = ${formatNum(rx)}`,
            `y' = ${formatNum(p.y)} - ${formatNum(b)}·(${formatNum(factor)}) = ${formatNum(ry)}`
          ];
        }

        const pPrime: Point = {
          x: Number(rx.toFixed(2)),
          y: Number(ry.toFixed(2)),
          label: `${vName}'`
        };
        const footPoint: Point = {
          x: Number(footX.toFixed(2)),
          y: Number(footY.toFixed(2))
        };

        transformedVertices.push(pPrime);
        perpGuides.push({
          p,
          pPrime,
          footH: footPoint,
          isRightAngle: true
        });

        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: stepFormula,
          substitutionLines: subs,
          resultLine: `${vName}'(${formatNum(pPrime.x)}, ${formatNum(pPrime.y)})`
        });
      }

      generalFormula = `Simetría axial respecto a: ${axisDescription}`;
      constructionElements.perpendicularGuides = perpGuides;
      break;
    }

    case 'central_reflection': {
      const { centralCenter } = config;
      const { x: h, y: k } = centralCenter;
      generalFormula = `(x', y') = (2h - x, 2k - y)  con O(${formatNum(h)}, ${formatNum(k)})`;
      isometryType = 'Isometría Inversa / Simetría Central (Equivalente a rotación de 180°)';
      invariants = [
        'Conserva distancias y áreas (las figuras son congruentes).',
        'El centro O es el PUNTO MEDIO exacto entre cada punto P y su imagen P\': M = (P + P\') / 2.',
        'Los lados correspondientes son paralelos entre sí (paralelismo simétrico).',
        'El único punto invariante es el centro de simetría O(h, k).'
      ];
      pedagogicalNotes = `Cada segmento PP' queda dividido en dos partes congruentes por el centro O: d(P, O) = d(O, P').`;

      const centralSegments = [];

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const vName = p.label || String.fromCharCode(65 + i);
        const xPrime = Number((2 * h - p.x).toFixed(2));
        const yPrime = Number((2 * k - p.y).toFixed(2));
        const pPrime: Point = { x: xPrime, y: yPrime, label: `${vName}'` };
        transformedVertices.push(pPrime);

        centralSegments.push({
          center: centralCenter,
          p,
          pPrime
        });

        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: `x' = 2h - x,  y' = 2k - y`,
          substitutionLines: [
            `x' = 2(${formatNum(h)}) - (${formatNum(p.x)}) = ${formatNum(2 * h)} - (${formatNum(p.x)}) = ${formatNum(xPrime)}`,
            `y' = 2(${formatNum(k)}) - (${formatNum(p.y)}) = ${formatNum(2 * k)} - (${formatNum(p.y)}) = ${formatNum(yPrime)}`
          ],
          resultLine: `${vName}'(${formatNum(xPrime)}, ${formatNum(yPrime)})`
        });
      }

      constructionElements.centralSymmetrySegments = centralSegments;
      break;
    }

    case 'rotation': {
      const { angleDeg, direction, center } = config;
      // Sentido antihorario es positivo (+), horario es negativo (-)
      const effectiveAngle = direction === 'clockwise' ? -Math.abs(angleDeg) : Math.abs(angleDeg);
      const rad = (effectiveAngle * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);

      generalFormula = `P' = C + R_α(P - C), con C(${formatNum(center.x)}, ${formatNum(center.y)}) y α = ${direction === 'clockwise' ? '-' : '+'}${Math.abs(angleDeg)}°`;
      isometryType = 'Isometría Directa (Conserva distancias, ángulos y orientación horaria)';
      invariants = [
        'Conserva la forma, tamaño y dimensiones de la figura (figura congruente).',
        'Cada vértice mantiene su distancia fija al centro: d(C, P) = d(C, P\').',
        'El ángulo formado por el radio inicial CP y el radio final CP\' es exactamente α.',
        'El único punto que no se mueve durante el giro es el centro C(x₀, y₀).'
      ];
      pedagogicalNotes = `Cada vértice describe una trayectoria en arco circular con centro en C y apertura angular de ${Math.abs(angleDeg)}° en sentido ${direction === 'clockwise' ? 'horario' : 'antihorario'}.`;

      const rotArcs = [];

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const vName = p.label || String.fromCharCode(65 + i);

        // Algoritmo escolar de 3 pasos:
        // 1. Trasladar al origen relativo
        const dx = p.x - center.x;
        const dy = p.y - center.y;
        // 2. Rotar
        const rotX = dx * cosA - dy * sinA;
        const rotY = dx * sinA + dy * cosA;
        // 3. Trasladar de vuelta
        const xPrime = Number((center.x + rotX).toFixed(2));
        const yPrime = Number((center.y + rotY).toFixed(2));

        const pPrime: Point = { x: xPrime, y: yPrime, label: `${vName}'` };
        transformedVertices.push(pPrime);

        const r = distance(center, p);
        const startAng = Math.atan2(p.y - center.y, p.x - center.x);
        const endAng = Math.atan2(yPrime - center.y, xPrime - center.x);

        rotArcs.push({
          center,
          p,
          pPrime,
          radius: r,
          startAngle: startAng,
          endAngle: endAng,
          angleDeg: effectiveAngle,
          counterClockwise: effectiveAngle < 0
        });

        // Explicación de tres pasos para cuaderno
        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: `x' = x₀ + (x - x₀)cosα - (y - y₀)sinα\ny' = y₀ + (x - x₀)sinα + (y - y₀)cosα`,
          substitutionLines: [
            `Paso 1 (Origen relativo): Δx = ${formatNum(p.x)} - (${formatNum(center.x)}) = ${formatNum(dx)},  Δy = ${formatNum(p.y)} - (${formatNum(center.y)}) = ${formatNum(dy)}`,
            `Paso 2 (Rotar con cos=${formatNum(cosA)}, sin=${formatNum(sinA)}): x_rot = ${formatNum(dx)}·(${formatNum(cosA)}) - ${formatNum(dy)}·(${formatNum(sinA)}) = ${formatNum(rotX)},  y_rot = ${formatNum(dx)}·(${formatNum(sinA)}) + ${formatNum(dy)}·(${formatNum(cosA)}) = ${formatNum(rotY)}`,
            `Paso 3 (Volver a centro): x' = ${formatNum(center.x)} + (${formatNum(rotX)}) = ${formatNum(xPrime)},  y' = ${formatNum(center.y)} + (${formatNum(rotY)}) = ${formatNum(yPrime)}`
          ],
          resultLine: `${vName}'(${formatNum(xPrime)}, ${formatNum(yPrime)})`
        });
      }

      constructionElements.rotationArcs = rotArcs;
      break;
    }

    case 'homothety': {
      const { scaleFactor: k, homothetyCenter: center } = config;
      generalFormula = `(x', y') = (${formatNum(center.x)} + ${formatNum(k)}(x - ${formatNum(center.x)}), ${formatNum(center.y)} + ${formatNum(k)}(y - ${formatNum(center.y)}))`;
      isometryType =
        k === 1
          ? 'Identidad (k = 1)'
          : k === -1
          ? 'Isometría (Simetría Central k = -1)'
          : 'Transformación de Semejanza (No isométrica: modifica distancias y áreas)';
      invariants = [
        'Conserva los ángulos interiores y el paralelismo de los lados de la figura.',
        `Multiplica todas las longitudes lineales por |k| = ${formatNum(Math.abs(k))}: Lado' = |k| · Lado.`,
        `Multiplica el área total por k² = ${formatNum(k * k)}: Área' = k² · Área.`,
        k > 0
          ? 'Homotecia Directa (k > 0): Las figuras se encuentran del mismo lado del centro O.'
          : 'Homotecia Inversa (k < 0): La figura se invierte respecto al centro O (del lado opuesto).'
      ];
      pedagogicalNotes = `Los puntos correspondientes P y P' están siempre alineados con el centro O: vector(OP') = k · vector(OP).`;

      const rays = [];

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const vName = p.label || String.fromCharCode(65 + i);

        const dx = p.x - center.x;
        const dy = p.y - center.y;
        const xPrime = Number((center.x + k * dx).toFixed(2));
        const yPrime = Number((center.y + k * dy).toFixed(2));
        const pPrime: Point = { x: xPrime, y: yPrime, label: `${vName}'` };
        transformedVertices.push(pPrime);

        rays.push({
          center,
          p,
          pPrime,
          k
        });

        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: `x' = x₀ + k(x - x₀),  y' = y₀ + k(y - y₀)`,
          substitutionLines: [
            `x' = ${formatNum(center.x)} + ${formatNum(k)}·(${formatNum(p.x)} - (${formatNum(center.x)})) = ${formatNum(center.x)} + ${formatNum(k)}·(${formatNum(dx)}) = ${formatNum(xPrime)}`,
            `y' = ${formatNum(center.y)} + ${formatNum(k)}·(${formatNum(p.y)} - (${formatNum(center.y)})) = ${formatNum(center.y)} + ${formatNum(k)}·(${formatNum(dy)}) = ${formatNum(yPrime)}`
          ],
          resultLine: `${vName}'(${formatNum(xPrime)}, ${formatNum(yPrime)})`
        });
      }

      constructionElements.homothetyRays = rays;
      break;
    }
  }

  return {
    transformedVertices,
    constructionElements,
    algebraicSteps,
    generalFormula,
    geometricProperties: {
      isometryType,
      invariants,
      pedagogicalNotes
    }
  };
}

/**
 * Banco curricular de problemas escolares de secundaria (3° a 5°)
 */
export const CLASSROOM_PROBLEMS: ProblemScenario[] = [
  {
    id: 'prob-1-axial-line',
    mode: 'DIRECT',
    category: 'Simetría Axial',
    title: 'Reflexión respecto a la recta vertical x = 2',
    statement:
      'Halla las coordenadas del triángulo A\'B\'C\' que resulta de aplicar una simetría axial al triángulo ABC con vértices A(1, 1), B(4, 2) y C(2, 5) respecto a la recta x = 2.',
    presetVertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 4, y: 2, label: 'B' },
      { x: 2, y: 5, label: 'C' }
    ],
    targetConfig: {
      type: 'reflection',
      dx: 0,
      dy: 0,
      reflectionAxis: 'custom_x',
      customAxisValue: 2,
      generalLine: { a: 1, b: 0, c: -2 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 90,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-2-translation',
    mode: 'DIRECT',
    category: 'Traslación',
    title: 'Traslación con vector v = (5, -3)',
    statement:
      'Dado el triángulo con vértices A(-3, 2), B(1, 4) y C(-1, 6), determina las coordenadas de la figura trasladada según el vector v = (5, -3).',
    presetVertices: [
      { x: -3, y: 2, label: 'A' },
      { x: 1, y: 4, label: 'B' },
      { x: -1, y: 6, label: 'C' }
    ],
    targetConfig: {
      type: 'translation',
      dx: 5,
      dy: -3,
      reflectionAxis: 'y',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 90,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-3-rotation-pivot',
    mode: 'DIRECT',
    category: 'Rotación',
    title: 'Giro de 90° antihorario con centro C(1, 2)',
    statement:
      'Aplica una rotación de 90° en sentido antihorario con centro en el punto C(1, 2) al polígono de vértices A(2, 2), B(5, 2), C(4, 5).',
    presetVertices: [
      { x: 2, y: 2, label: 'A' },
      { x: 5, y: 2, label: 'B' },
      { x: 4, y: 5, label: 'C' }
    ],
    targetConfig: {
      type: 'rotation',
      dx: 0,
      dy: 0,
      reflectionAxis: 'x',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 90,
      direction: 'anticlockwise',
      center: { x: 1, y: 2 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-4-central-symmetry',
    mode: 'DIRECT',
    category: 'Simetría Central',
    title: 'Simetría central respecto al punto O(2, 1)',
    statement:
      'Calcula analíticamente los vértices del cuadrilátero simétrico a ABCD respecto al punto O(2, 1), siendo A(1, 2), B(3, 4), C(5, 3) y D(3, 1).',
    presetVertices: [
      { x: 1, y: 2, label: 'A' },
      { x: 3, y: 4, label: 'B' },
      { x: 5, y: 3, label: 'C' },
      { x: 3, y: 1, label: 'D' }
    ],
    targetConfig: {
      type: 'central_reflection',
      dx: 0,
      dy: 0,
      reflectionAxis: 'x',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 2, y: 1 },
      angleDeg: 180,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-5-homothety-inverse',
    mode: 'DIRECT',
    category: 'Homotecia',
    title: 'Homotecia inversa k = -1.5 centrada en O(0, 0)',
    statement:
      'Dibuja y calcula las coordenadas de la figura homotética obtenida al aplicar una razón k = -1.5 con centro en el origen al triángulo A(2, 1), B(4, 1), C(2, 4). Explica por qué la figura queda invertida.',
    presetVertices: [
      { x: 2, y: 1, label: 'A' },
      { x: 4, y: 1, label: 'B' },
      { x: 2, y: 4, label: 'C' }
    ],
    targetConfig: {
      type: 'homothety',
      dx: 0,
      dy: 0,
      reflectionAxis: 'x',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 0,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: -1.5,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  // PROBLEMAS INVERSOS (DEDUCCIÓN)
  {
    id: 'prob-inv-1-vector',
    mode: 'INVERSE',
    category: 'Problema Inverso: Deducir Traslación',
    title: '¿Qué traslación transforma F en F\'?',
    statement:
      'Observa las dos figuras en el plano: la figura original F (verde) y la figura imagen F\' (azul). Determina el vector director de traslación v = (Δx, Δy) comparando sus vértices correspondientes.',
    presetVertices: [
      { x: -4, y: 1, label: 'A' },
      { x: -1, y: 1, label: 'B' },
      { x: -2, y: 4, label: 'C' }
    ],
    targetConfig: {
      type: 'translation',
      dx: 6,
      dy: 2,
      reflectionAxis: 'x',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 0,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    },
    inverseOptions: {
      suggestedType: 'translation',
      hint: 'Resta las coordenadas del punto imagen menos la preimagen: v = A\' - A = (x\' - x, y\' - y).',
      explanation:
        'Dado A(-4, 1) y A\'(2, 3), el vector es v = (2 - (-4), 3 - 1) = (6, 2). Todos los demás vértices coinciden con este mismo vector.'
    }
  },
  {
    id: 'prob-inv-2-axis',
    mode: 'INVERSE',
    category: 'Problema Inverso: Deducir Eje de Reflexión',
    title: 'Identifica la recta de simetría axial',
    statement:
      'Las figuras F y F\' son simétricas. Encuentra la ecuación del eje de simetría calculando el punto medio de los segmentos AA\', BB\' y CC\'.',
    presetVertices: [
      { x: -2, y: 2, label: 'A' },
      { x: 0, y: 2, label: 'B' },
      { x: -1, y: 6, label: 'C' }
    ],
    targetConfig: {
      type: 'reflection',
      dx: 0,
      dy: 0,
      reflectionAxis: 'custom_x',
      customAxisValue: 1,
      generalLine: { a: 1, b: 0, c: -1 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 0,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    },
    inverseOptions: {
      suggestedType: 'reflection',
      hint: 'El punto medio entre A(-2, 2) y A\'(4, 2) es M = ((-2+4)/2, 2) = (1, 2). Observa si todos los puntos medios tienen la misma abscisa.',
      explanation:
        'Todos los segmentos que unen cada punto con su imagen tienen punto medio con coordenada x = 1 y son horizontales. Por tanto, el eje mediatriz es la recta vertical x = 1.'
    }
  }
];

/**
 * Deduce analíticamente qué transformación relaciona F y F' para el modo problema inverso
 */
export function analyzeInverseTransformation(
  preimage: Point[],
  image: Point[]
): {
  detectedType: 'translation' | 'reflection' | 'central_reflection' | 'rotation' | 'homothety' | 'unknown';
  confidence: number;
  details: string;
} {
  if (preimage.length < 2 || image.length !== preimage.length) {
    return {
      detectedType: 'unknown',
      confidence: 0,
      details: 'Se requieren al menos 2 vértices correspondientes en ambas figuras.'
    };
  }

  // 1. Probar Traslación: ¿v_i = P'_i - P_i es constante?
  const v0 = { x: image[0].x - preimage[0].x, y: image[0].y - preimage[0].y };
  const isTranslation = preimage.every((p, i) => {
    const vx = image[i].x - p.x;
    const vy = image[i].y - p.y;
    return Math.abs(vx - v0.x) < 0.05 && Math.abs(vy - v0.y) < 0.05;
  });

  if (isTranslation) {
    return {
      detectedType: 'translation',
      confidence: 1,
      details: `Es una Traslación exacta con vector director v = (${formatNum(v0.x)}, ${formatNum(v0.y)}).`
    };
  }

  // 2. Probar Simetría Central: ¿el punto medio M_i = (P_i + P'_i)/2 es constante?
  const m0 = midpoint(preimage[0], image[0]);
  const isCentral = preimage.every((p, i) => {
    const mi = midpoint(p, image[i]);
    return Math.abs(mi.x - m0.x) < 0.05 && Math.abs(mi.y - m0.y) < 0.05;
  });

  if (isCentral) {
    return {
      detectedType: 'central_reflection',
      confidence: 1,
      details: `Es una Simetría Central respecto al punto O(${formatNum(m0.x)}, ${formatNum(m0.y)}).`
    };
  }

  // 3. Probar Simetría Axial Vertical (x = k)
  const isAxisVertical = preimage.every((p, i) => {
    return Math.abs(p.y - image[i].y) < 0.05;
  });
  if (isAxisVertical) {
    const k0 = (preimage[0].x + image[0].x) / 2;
    const allSameK = preimage.every((p, i) => {
      const ki = (p.x + image[i].x) / 2;
      return Math.abs(ki - k0) < 0.05;
    });
    if (allSameK) {
      return {
        detectedType: 'reflection',
        confidence: 1,
        details: `Es una Simetría Axial respecto a la recta vertical x = ${formatNum(k0)}.`
      };
    }
  }

  // 4. Probar Simetría Axial Horizontal (y = k)
  const isAxisHorizontal = preimage.every((p, i) => {
    return Math.abs(p.x - image[i].x) < 0.05;
  });
  if (isAxisHorizontal) {
    const k0 = (preimage[0].y + image[0].y) / 2;
    const allSameK = preimage.every((p, i) => {
      const ki = (p.y + image[i].y) / 2;
      return Math.abs(ki - k0) < 0.05;
    });
    if (allSameK) {
      return {
        detectedType: 'reflection',
        confidence: 1,
        details: `Es una Simetría Axial respecto a la recta horizontal y = ${formatNum(k0)}.`
      };
    }
  }

  // 5. Probar Homotecia respecto al origen (0,0)
  if (preimage[0].x !== 0 || preimage[0].y !== 0) {
    const kX = preimage[0].x !== 0 ? image[0].x / preimage[0].x : image[0].y / preimage[0].y;
    const isHomothetyOrigin = preimage.every((p, i) => {
      const pxPrime = p.x * kX;
      const pyPrime = p.y * kX;
      return Math.abs(pxPrime - image[i].x) < 0.05 && Math.abs(pyPrime - image[i].y) < 0.05;
    });
    if (isHomothetyOrigin) {
      return {
        detectedType: 'homothety',
        confidence: 1,
        details: `Es una Homotecia centrada en el origen O(0,0) con razón k = ${formatNum(kX)}.`
      };
    }
  }

  return {
    detectedType: 'unknown',
    confidence: 0.5,
    details: 'Transformación combinada o compuesta (por ejemplo, rotación con ángulo libre o eje oblicuo).'
  };
}
