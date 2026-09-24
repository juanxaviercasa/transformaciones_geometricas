import {
  Point,
  TransformationConfig,
  RotationStep,
  ConstructionElements,
  RotationArcConstruction,
  AlgebraicStep,
  ProblemEngineResult,
  ProblemScenario,
  ProblemMode,
  ProblemDifficulty
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
  const secondaryTransformedVertices: Point[] = [];
  const translationStages: Point[][] = [];
  const rotationStages: Point[][] = [];
  const constructionElements: ConstructionElements = {};
  const algebraicSteps: AlgebraicStep[] = [];

  let generalFormula = '';
  let isometryType = '';
  let invariants: string[] = [];
  let pedagogicalNotes = '';

  switch (config.type) {
    case 'translation': {
      generalFormula = (config.translationVectors?.length || config.translationVectorCount || 1) > 1
        ? 'F₀ → F₁ → F₂ → ... (cada etapa aplica un vector a la anterior)'
        : `(x', y') = (x + (${formatNum(config.dx)}), y + (${formatNum(config.dy)}))`;
      isometryType = 'Isometría Directa (Conserva longitudes, ángulos y orientación)';
      invariants = [
        'Conserva las distancias entre cualquier par de puntos: d(P, Q) = d(P\', Q\').',
        'Conserva los ángulos interiores y el paralelismo de los lados.',
        'El vector director v = (Δx, Δy) es idéntico para todos los vértices del plano.',
        'No existen puntos dobles (invariantes), salvo que v sea el vector nulo (0,0).'
      ];
      pedagogicalNotes = (config.translationVectors?.length || config.translationVectorCount || 1) > 1
        ? 'Cada vector se aplica a la imagen obtenida en la etapa anterior.'
        : `Cada vértice P(x, y) se desplaza simultáneamente ${formatNum(config.dx)} unidades en el eje X y ${formatNum(config.dy)} unidades en el eje Y.`;

      const vectorGuides = [];
      const translationStageGuides = [];
      const isPointPairMode = config.translationMode === 'points';
      const translationTargets = config.translationTargets?.length
        ? config.translationTargets
        : config.translationTarget
          ? [config.translationTarget]
          : [];
      const hasPointPair = vertices.length > 0 && vertices.length === translationTargets.length && translationTargets.every(Boolean);
      const vectors = config.translationVectors?.length
        ? config.translationVectors
        : [
            { dx: config.dx, dy: config.dy, set: config.translationVectorSet },
            ...(config.translationVectorCount === 2
              ? [{ dx: config.translationSecondDx || 0, dy: config.translationSecondDy || 0, set: config.translationSecondVectorSet }]
              : [])
          ];
      const hasVector = config.translationMode !== 'points' && vectors.every((vector) => vector.set !== false);
      const isFigureReady = config.translationReady !== false;
      const secondaryVectorGuides = [];

      if (!isFigureReady || (isPointPairMode && !hasPointPair) || (!isPointPairMode && !hasVector)) {
        break;
      }

      let currentStage = vertices;
      for (let stageIndex = 0; stageIndex < vectors.length; stageIndex++) {
        const vector = vectors[stageIndex];
        const stageVertices: Point[] = [];
        const stageGuides = [];
        currentStage.forEach((p, i) => {
          const source = vertices[i];
          const vName = source.label || String.fromCharCode(65 + i);
          const nextPoint: Point = {
            x: Number((p.x + vector.dx).toFixed(2)),
            y: Number((p.y + vector.dy).toFixed(2)),
            label: `${vName}'${stageIndex + 1}`
          };
          stageVertices.push(nextPoint);
          stageGuides.push({
            start: p,
            intermediate: p,
            end: nextPoint,
            dx: vector.dx,
            dy: vector.dy
          });
        });
        translationStages.push(stageVertices);
        translationStageGuides.push(stageGuides);
        currentStage = stageVertices;
      }

      const finalStage = translationStages[translationStages.length - 1] || [];
      transformedVertices.push(...finalStage);
      if (translationStages.length > 1) secondaryTransformedVertices.push(...translationStages[0]);
      translationStageGuides.forEach((guides) => vectorGuides.push(...guides));

      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i];
        const target = isPointPairMode ? translationTargets[i] : undefined;
        const finalPoint = finalStage[i];
        const dx = target ? target.x - p.x : finalPoint.x - p.x;
        const dy = target ? target.y - p.y : finalPoint.y - p.y;
        const vName = p.label || String.fromCharCode(65 + i);
        const xPrime = finalPoint.x;
        const yPrime = finalPoint.y;
        const pPrime = finalPoint;

        algebraicSteps.push({
          vertexName: vName,
          originalPoint: p,
          targetPoint: pPrime,
          formula: `P' = (x + v_x, y + v_y)`,
          substitutionLines: [
            `x' = ${formatNum(p.x)} + (${formatNum(dx)}) = ${formatNum(xPrime)}`,
            `y' = ${formatNum(p.y)} + (${formatNum(dy)}) = ${formatNum(yPrime)}`
          ],
          resultLine: `${vName}'(${formatNum(xPrime)}, ${formatNum(yPrime)})`
        });
      }

      constructionElements.vectorGuides = vectorGuides;
      constructionElements.translationStageGuides = translationStageGuides;
      if (secondaryVectorGuides.length > 0) constructionElements.secondaryVectorGuides = secondaryVectorGuides;
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
      const steps: RotationStep[] = config.rotationSteps && config.rotationSteps.length > 0
        ? config.rotationSteps
        : [{ angleDeg: config.angleDeg, direction: config.direction, center: config.center }];

      const isMulti = steps.length > 1;

      generalFormula = isMulti
        ? `F₀ → F₁ → F₂ → ... (Composición de ${steps.length} rotaciones sucesivas)`
        : `P' = C + R_α(P - C), con C(${formatNum(config.center.x)}, ${formatNum(config.center.y)}) y α = ${config.direction === 'clockwise' ? '-' : '+'}${Math.abs(config.angleDeg)}°`;

      isometryType = 'Isometría Directa (Conserva distancias, ángulos y orientación horaria)';
      invariants = [
        'Conserva la forma, tamaño y dimensiones de la figura (figura congruente en cada etapa).',
        isMulti
          ? 'Cada giro sucesivo conserva la distancia de los vértices a su respectivo centro de rotación.'
          : 'Cada vértice mantiene su distancia fija al centro: d(C, P) = d(C, P\').',
        isMulti
          ? 'La composición de rotaciones sucesivas es una isometría directa en el plano.'
          : 'El ángulo formado por el radio inicial CP y el radio final CP\' es exactamente α.',
        'Los vértices describen arcos circulares concéntricos.'
      ];
      pedagogicalNotes = isMulti
        ? `Rotaciones encadenadas: cada etapa toma como punto de partida la posición alcanzada en el giro anterior (A ➔ A' ➔ A'' ...).`
        : `Cada vértice describe una trayectoria en arco circular con centro en C y apertura angular de ${Math.abs(config.angleDeg)}° en sentido ${config.direction === 'clockwise' ? 'horario' : 'antihorario'}.`;

      const rotArcs: RotationArcConstruction[] = [];
      let currentStage = vertices;

      for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
        const step = steps[stepIndex];
        const stepCenter = step.center || config.center;
        const effectiveAngle = step.direction === 'clockwise' ? -Math.abs(step.angleDeg) : Math.abs(step.angleDeg);
        const rad = (effectiveAngle * Math.PI) / 180;
        const cosA = Math.cos(rad);
        const sinA = Math.sin(rad);

        const stageVertices: Point[] = [];
        const primeSuffix = "'".repeat(stepIndex + 1);
        const prevSuffix = stepIndex === 0 ? '' : "'".repeat(stepIndex);

        for (let i = 0; i < currentStage.length; i++) {
          const p = currentStage[i];
          const baseName = (vertices[i]?.label || String.fromCharCode(65 + i)).replace(/'/g, '');
          const sourceName = `${baseName}${prevSuffix}`;
          const targetName = `${baseName}${primeSuffix}`;

          // Algoritmo escolar de 3 pasos:
          // 1. Trasladar al origen relativo
          const dx = p.x - stepCenter.x;
          const dy = p.y - stepCenter.y;
          // 2. Rotar
          const rotX = dx * cosA - dy * sinA;
          const rotY = dx * sinA + dy * cosA;
          // 3. Trasladar de vuelta
          const xPrime = Number((stepCenter.x + rotX).toFixed(2));
          const yPrime = Number((stepCenter.y + rotY).toFixed(2));

          const pPrime: Point = { x: xPrime, y: yPrime, label: targetName };
          stageVertices.push(pPrime);

          const r = distance(stepCenter, p);
          const startAng = Math.atan2(p.y - stepCenter.y, p.x - stepCenter.x);
          const endAng = Math.atan2(yPrime - stepCenter.y, xPrime - stepCenter.x);

          rotArcs.push({
            center: stepCenter,
            p,
            pPrime,
            radius: r,
            startAngle: startAng,
            endAngle: endAng,
            angleDeg: effectiveAngle,
            counterClockwise: effectiveAngle > 0,
            stepIndex
          });

          algebraicSteps.push({
            vertexName: isMulti ? `Giro ${stepIndex + 1}: ${sourceName} → ${targetName}` : sourceName,
            originalPoint: p,
            targetPoint: pPrime,
            formula: `x' = x₀ + (x - x₀)cosα - (y - y₀)sinα\ny' = y₀ + (x - x₀)sinα + (y - y₀)cosα  [α = ${step.direction === 'clockwise' ? '-' : '+'}${Math.abs(step.angleDeg)}°]`,
            substitutionLines: [
              `Paso 1 (Origen relativo a C(${formatNum(stepCenter.x)}, ${formatNum(stepCenter.y)})): Δx = ${formatNum(p.x)} - (${formatNum(stepCenter.x)}) = ${formatNum(dx)},  Δy = ${formatNum(p.y)} - (${formatNum(stepCenter.y)}) = ${formatNum(dy)}`,
              `Paso 2 (Rotar con cos=${formatNum(cosA)}, sin=${formatNum(sinA)}): x_rot = ${formatNum(dx)}·(${formatNum(cosA)}) - ${formatNum(dy)}·(${formatNum(sinA)}) = ${formatNum(rotX)},  y_rot = ${formatNum(dx)}·(${formatNum(sinA)}) + ${formatNum(dy)}·(${formatNum(cosA)}) = ${formatNum(rotY)}`,
              `Paso 3 (Volver a centro): x' = ${formatNum(stepCenter.x)} + (${formatNum(rotX)}) = ${formatNum(xPrime)},  y' = ${formatNum(stepCenter.y)} + (${formatNum(rotY)}) = ${formatNum(yPrime)}`
            ],
            resultLine: `${targetName}(${formatNum(xPrime)}, ${formatNum(yPrime)})`
          });
        }

        rotationStages.push(stageVertices);
        currentStage = stageVertices;
      }

      const finalStage = rotationStages[rotationStages.length - 1] || [];
      transformedVertices.push(...finalStage);
      if (rotationStages.length > 1) {
        secondaryTransformedVertices.push(...rotationStages[0]);
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
    secondaryTransformedVertices,
    translationStages,
    rotationStages,
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
const randomFromArray = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const buildBaseTriangle = (centerX: number, centerY: number, scale: number): Point[] => {
  const cx = centerX;
  const cy = centerY;
  return [
    { x: cx - scale, y: cy + scale * 0.4, label: 'A' },
    { x: cx + scale * 1.4, y: cy + scale * 0.6, label: 'B' },
    { x: cx + scale * 0.6, y: cy - scale * 1.4, label: 'C' }
  ];
};

const problemTypePoolByDifficulty: Record<ProblemDifficulty, Array<ProblemScenario['targetConfig']['type']>> = {
  básico: ['translation', 'reflection', 'rotation'],
  intermedio: ['translation', 'reflection', 'rotation', 'homothety'],
  avanzado: ['translation', 'reflection', 'rotation', 'central_reflection', 'homothety']
};

export function generateRandomProblemScenario(
  difficulty: ProblemDifficulty = 'básico',
  mode: ProblemMode = 'DIRECT',
  preferredType?: ProblemScenario['targetConfig']['type']
): ProblemScenario {
  const levelBias = {
    básico: { scale: [1.5, 2.2], offset: [-1, 2], angle: [90, 180], k: [1.5, 2.5], custom: [-2, 3] },
    intermedio: { scale: [2, 3], offset: [-2, 3], angle: [90, 180, 270], k: [1.8, 3, -1.8], custom: [-3, 4] },
    avanzado: { scale: [2.5, 4], offset: [-3, 4], angle: [90, 180, 270], k: [2, 3, -2, -3], custom: [-4, 5] }
  }[difficulty];

  const randomScale = () => Number((Math.random() * (levelBias.scale[1] - levelBias.scale[0]) + levelBias.scale[0]).toFixed(1));
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const randomOffset = () => Number((Math.random() * (levelBias.offset[1] - levelBias.offset[0]) + levelBias.offset[0]).toFixed(1));
  const randomCustom = () => Number((Math.random() * (levelBias.custom[1] - levelBias.custom[0]) + levelBias.custom[0]).toFixed(1));

  const transformationType = preferredType ?? randomFromArray(problemTypePoolByDifficulty[difficulty]);

  const baseVertices = buildBaseTriangle(randomOffset(), randomOffset(), randomScale());
  const title = {
    translation: `Traslación aleatoria con vector v = (${randomInt(-4, 4)}, ${randomInt(-4, 4)})`,
    reflection: `Reflexión respecto a ${randomFromArray(['el eje x', 'el eje y', 'la recta x = k', 'la recta y = k'])}`,
    rotation: `Rotación de ${randomFromArray([90, 180, 270])}° con centro aleatorio`,
    central_reflection: 'Simetría central respecto a un punto del plano',
    homothety: `Homotecia con razón k = ${randomFromArray([-3, -2, -1.5, 1.5, 2, 3])}`
  }[transformationType];

  const dx = randomInt(-5, 5);
  const dy = randomInt(-4, 4);
  const axis = randomFromArray(['x', 'y', 'custom_x', 'custom_y'] as const);
  const customAxis = randomCustom();
  const angle = randomFromArray(levelBias.angle);
  const center = { x: randomOffset(), y: randomOffset() };
  const k = randomFromArray(levelBias.k as number[]);
  const homothetyCenter = { x: randomOffset(), y: randomOffset() };

  const statementByType: Record<ProblemScenario['targetConfig']['type'], string> = {
    translation: `Traslada la figura ABC según el vector v = (${dx}, ${dy}) y determina la imagen A'B'C'.`,
    reflection: `Aplica la reflexión de la figura ABC respecto a ${axis === 'x' ? 'el eje x' : axis === 'y' ? 'el eje y' : axis === 'custom_x' ? `la recta x = ${formatNum(customAxis)}` : axis === 'custom_y' ? `la recta y = ${formatNum(customAxis)}` : 'la recta y = x'} y muestra su imagen.` ,
    rotation: `Gira la figura ABC alrededor del punto O(${formatNum(center.x)}, ${formatNum(center.y)}) un ángulo de ${angle}° y describe la imagen resultante.` ,
    central_reflection: `Encuentra la imagen de la figura ABC mediante una simetría central con centro en O(${formatNum(center.x)}, ${formatNum(center.y)}).`,
    homothety: `Aplica una homotecia con centro O(${formatNum(homothetyCenter.x)}, ${formatNum(homothetyCenter.y)}) y razón k = ${formatNum(k)} a la figura ABC.`
  };

  const scenario: ProblemScenario = {
    id: `rand-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    mode,
    category: {
      translation: 'Traslación',
      reflection: 'Simetría Axial',
      rotation: 'Rotación',
      central_reflection: 'Simetría Central',
      homothety: 'Homotecia'
    }[transformationType],
    difficulty,
    title,
    statement: statementByType[transformationType],
    presetVertices: baseVertices,
    targetConfig: {
      type: transformationType,
      dx,
      dy,
      reflectionAxis: axis,
      customAxisValue: customAxis,
      generalLine: { a: 1, b: 0, c: -customAxis },
      centralCenter: center,
      angleDeg: angle,
      direction: randomFromArray(['anticlockwise', 'clockwise'] as const),
      center,
      scaleFactor: k,
      homothetyCenter,
      translationMode: 'vector',
      translationTarget: undefined,
      translationTargets: [],
      translationVectorSet: true,
      translationVectors: [{ dx, dy, set: true }],
      translationVectorCount: 1,
      translationSecondDx: 0,
      translationSecondDy: 0,
      translationSecondVectorSet: false,
      translationReady: true
    }
  };

  return scenario;
}

export const CLASSROOM_PROBLEMS: ProblemScenario[] = [
  {
    id: 'prob-1-axial-line',
    mode: 'DIRECT',
    category: 'Simetría Axial',
    difficulty: 'básico',
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
    difficulty: 'básico',
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
    difficulty: 'básico',
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
    difficulty: 'intermedio',
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
    difficulty: 'intermedio',
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
  {
    id: 'prob-6-reflection-custom-y',
    mode: 'DIRECT',
    category: 'Simetría Axial',
    difficulty: 'intermedio',
    title: 'Reflexión respecto a la recta y = -1',
    statement:
      'Obtén la imagen del triángulo A(1, 1), B(3, 1), C(2, 4) al reflejarlo respecto a la recta horizontal y = -1.',
    presetVertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 3, y: 1, label: 'B' },
      { x: 2, y: 4, label: 'C' }
    ],
    targetConfig: {
      type: 'reflection',
      dx: 0,
      dy: 0,
      reflectionAxis: 'custom_y',
      customAxisValue: -1,
      generalLine: { a: 0, b: 1, c: 1 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 0,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-7-rotation-180',
    mode: 'DIRECT',
    category: 'Rotación',
    difficulty: 'avanzado',
    title: 'Rotación de 180° alrededor del punto O(-1, 2)',
    statement:
      'Aplica una rotación de 180° con centro en O(-1, 2) a los puntos A(2, 3), B(4, 1) y C(3, 5). Calcula la imagen final.',
    presetVertices: [
      { x: 2, y: 3, label: 'A' },
      { x: 4, y: 1, label: 'B' },
      { x: 3, y: 5, label: 'C' }
    ],
    targetConfig: {
      type: 'rotation',
      dx: 0,
      dy: 0,
      reflectionAxis: 'x',
      customAxisValue: 0,
      generalLine: { a: 0, b: 1, c: 0 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 180,
      direction: 'anticlockwise',
      center: { x: -1, y: 2 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-8-homothety-scaled',
    mode: 'DIRECT',
    category: 'Homotecia',
    difficulty: 'avanzado',
    title: 'Homotecia con razón k = 2 y centro O(1, -1)',
    statement:
      'Encuentra la imagen del cuadrilátero A(0, 0), B(2, 0), C(2, 2), D(0, 2) al aplicar una homotecia de razón 2 con centro en O(1, -1).',
    presetVertices: [
      { x: 0, y: 0, label: 'A' },
      { x: 2, y: 0, label: 'B' },
      { x: 2, y: 2, label: 'C' },
      { x: 0, y: 2, label: 'D' }
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
      scaleFactor: 2,
      homothetyCenter: { x: 1, y: -1 }
    }
  },
  {
    id: 'prob-9-composed-translation-reflection',
    mode: 'DIRECT',
    category: 'Composición',
    difficulty: 'avanzado',
    title: 'Traslación seguida de reflexión',
    statement:
      'Primero traslada el triángulo A(1, 1), B(3, 2), C(2, 5) con vector v = (2, -1) y después refleja la imagen respecto al eje y = 1. Determina la posición final.',
    presetVertices: [
      { x: 1, y: 1, label: 'A' },
      { x: 3, y: 2, label: 'B' },
      { x: 2, y: 5, label: 'C' }
    ],
    targetConfig: {
      type: 'reflection',
      dx: 2,
      dy: -1,
      reflectionAxis: 'custom_y',
      customAxisValue: 1,
      generalLine: { a: 0, b: 1, c: -1 },
      centralCenter: { x: 0, y: 0 },
      angleDeg: 0,
      direction: 'anticlockwise',
      center: { x: 0, y: 0 },
      scaleFactor: 1,
      homothetyCenter: { x: 0, y: 0 }
    }
  },
  {
    id: 'prob-inv-1-vector',
    mode: 'INVERSE',
    category: 'Problema Inverso: Deducir Traslación',
    difficulty: 'básico',
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
    difficulty: 'intermedio',
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
  },
  {
    id: 'prob-inv-3-homothety',
    mode: 'INVERSE',
    category: 'Problema Inverso: Deducir Homotecia',
    difficulty: 'avanzado',
    title: '¿Cuál es la razón y el centro de homotecia?',
    statement:
      'La figura original F y su imagen F\' son homotéticas. Identifica si el centro está en el origen o fuera de él y determina la razón k comparando las distancias desde el centro a cada vértice.',
    presetVertices: [
      { x: -2, y: 1, label: 'A' },
      { x: 0, y: 1, label: 'B' },
      { x: -2, y: 4, label: 'C' }
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
      scaleFactor: -2,
      homothetyCenter: { x: 0, y: 0 }
    },
    inverseOptions: {
      suggestedType: 'homothety',
      hint: 'Compara la distancia del centro a cada punto con la distancia del centro a su imagen. La razón es el cociente entre ambos segmentos.',
      explanation: 'Si la imagen está al lado opuesto del centro y su distancia es el doble, entonces la razón es negativa y la figura se invierte.'
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
