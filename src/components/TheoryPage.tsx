import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TransformationType } from "../types/geometry";
import { InteractiveTheoryDiagram } from "./InteractiveTheoryDiagram";
import {
  FlipHorizontal,
  Move,
  RotateCw,
  Maximize2,
  Target,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Layers,
  Sparkles,
  X,
} from "lucide-react";

interface TheoryPageProps {
  initialTransformation?: TransformationType;
  onClose: () => void;
}

// ─── THEORY DATA ──────────────────────────────────────────────────────────────
type Theory = {
  id: TransformationType;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  colorAccent: string;
  tagline: string;
  definition: string;
  invariants: string[];
  formulas: { title: string; formula: string; note: string }[];
  properties: string[];
  examples: { title: string; steps: string[] }[];
  commonErrors: string[];
  mnemonic: string;
};

const THEORIES: Theory[] = [
  {
    id: "reflection",
    label: "Simetría Axial",
    icon: FlipHorizontal,
    colorAccent: "#e11d48",
    tagline: "Reflejo especular respecto a una recta L",
    definition:
      "La simetría axial es una transformación isométrica que asigna a cada punto P su imagen P' de modo que la recta L (eje de simetría) es la mediatriz del segmento PP'. Esto significa que L es perpendicular a PP' y su punto medio pertenece a L.",
    invariants: [
      "Distancias entre puntos (isometría)",
      "Ángulos internos de la figura",
      "Áreas y perímetros",
      "La recta L y todos sus puntos quedan fijos",
    ],
    formulas: [
      {
        title: "Eje X",
        formula: "P(x, y) → P'(x, -y)",
        note: "Se invierte el signo de y",
      },
      {
        title: "Eje Y",
        formula: "P(x, y) → P'(-x, y)",
        note: "Se invierte el signo de x",
      },
      {
        title: "y = x",
        formula: "P(x, y) → P'(y, x)",
        note: "Se intercambian las coordenadas",
      },
      {
        title: "y = -x",
        formula: "P(x, y) → P'(-y, -x)",
        note: "Se intercambian y se niegan",
      },
      {
        title: "x = k (recta vertical)",
        formula: "P(x, y) → P'(2k - x, y)",
        note: "La imagen queda al otro lado a igual distancia",
      },
      {
        title: "y = k (recta horizontal)",
        formula: "P(x, y) → P'(x, 2k - y)",
        note: "Análogo para ejes horizontales",
      },
    ],
    properties: [
      "Isometría: conserva distancias y ángulos",
      "Invierte la orientación de la figura (antidirecta)",
      "Aplicada dos veces consecutivas = identidad",
      "El eje L es el único conjunto de puntos invariantes",
      "Dos reflexiones con ejes paralelos = traslación",
      "Dos reflexiones con ejes secantes = rotación",
    ],
    examples: [
      {
        title: "A(3, 2) respecto al Eje X",
        steps: [
          "Eje X: P(x, y) → P'(x, -y)",
          "A(3, 2) → A'(3, -2)",
          "Verificación: punto medio de A y A' = (3, 0), que pertenece al Eje X ✓",
        ],
      },
      {
        title: "B(-1, 4) respecto a x = 2",
        steps: [
          "Fórmula: P'(2k - x, y) con k = 2",
          "x' = 2(2) - (-1) = 5,  y' = 4",
          "B'(5, 4)",
          "Punto medio: ((-1 + 5)/2, 4) = (2, 4) → x = 2 ✓",
        ],
      },
    ],
    commonErrors: [
      "Confundir simetría axial (recta) con simetría central (punto)",
      "Para x = k: aplicar -x en vez de 2k - x",
      "Olvidar que la orientación de la figura se invierte",
    ],
    mnemonic:
      "El eje L es un espejo perfecto: la imagen queda al otro lado a la misma distancia perpendicular, como un reflejo en agua calma.",
  },
  {
    id: "translation",
    label: "Traslación",
    icon: Move,
    colorAccent: "#2563eb",
    tagline: "Desplazamiento uniforme según vector v = (dx, dy)",
    definition:
      "Una traslación desplaza todos los puntos del plano la misma distancia y en la misma dirección, definida por el vector v = (dx, dy). Es una isometría directa sin puntos fijos (salvo vector nulo).",
    invariants: [
      "Distancias entre puntos",
      "Ángulos internos",
      "Orientación de la figura",
      "Dirección y paralelismo de cada segmento",
    ],
    formulas: [
      {
        title: "Traslación general",
        formula: "P(x, y) → P'(x + dx, y + dy)",
        note: "Se suman las componentes del vector a cada coordenada",
      },
      {
        title: "Magnitud del desplazamiento",
        formula: "|v| = √(dx² + dy²)",
        note: "Distancia euclidiana recorrida por cada punto",
      },
    ],
    properties: [
      "Isometría directa: conserva distancias, ángulos y orientación",
      "No tiene puntos fijos (salvo traslación nula)",
      "Las rectas imagen son paralelas a las rectas originales",
      "Es conmutativa: T(v1) ∘ T(v2) = T(v2) ∘ T(v1)",
      "Composición de dos traslaciones = traslación con vector suma (v1 + v2)",
    ],
    examples: [
      {
        title: "A(2, -1) con vector v = (3, 4)",
        steps: [
          "Fórmula: A'(x + dx, y + dy)",
          "A'(2 + 3, -1 + 4) = A'(5, 3)",
          "Distancia recorrida: |v| = √(3² + 4²) = 5 unidades ✓",
        ],
      },
      {
        title: "Triángulo A(0,0), B(4,0), C(2,3) con v = (-1, 2)",
        steps: [
          "A'(-1, 2),  B'(3, 2),  C'(1, 5)",
          "Todos los lados conservan exactamente su longitud original ✓",
        ],
      },
    ],
    commonErrors: [
      "Aplicar el vector solo a algunos vértices de la figura",
      "Sumar dx a y, o dy a x (intercambiar componentes)",
      "Creer que la figura rota: en la traslación pura solo hay desplazamiento lineal",
    ],
    mnemonic:
      "Todos los puntos se mueven en la misma dirección y distancia, como deslizar una moneda sobre una mesa plana.",
  },
  {
    id: "rotation",
    label: "Rotación",
    icon: RotateCw,
    colorAccent: "#d97706",
    tagline: "Giro de ángulo α alrededor de un centro fijo C",
    definition:
      "Una rotación hace girar todos los puntos un ángulo α (positivo = antihorario, negativo = horario) alrededor del centro C. Es la única isometría directa con exactamente un punto fijo: el centro de rotación.",
    invariants: [
      "Distancias entre puntos",
      "Ángulos internos",
      "Orientación de la figura (directa)",
      "El centro C queda fijo: C' = C",
    ],
    formulas: [
      {
        title: "90° Antihorario (Centro en origen)",
        formula: "P(x, y) → P'(-y, x)",
        note: "Giro de 90° positivo",
      },
      {
        title: "180° (Centro en origen)",
        formula: "P(x, y) → P'(-x, -y)",
        note: "Equivale a simetría central en el origen",
      },
      {
        title: "270° Antihorario / 90° Horario",
        formula: "P(x, y) → P'(y, -x)",
        note: "Giro de 270° o -90°",
      },
      {
        title: "Ángulo general α (Centro en origen)",
        formula: "x' = x·cos(α) - y·sen(α)\ny' = x·sen(α) + y·cos(α)",
        note: "Fórmulas trigonométricas generales",
      },
    ],
    properties: [
      "Isometría directa: conserva distancias, ángulos y sentido",
      "El centro C es el único punto invariante (si α ≠ k·360°)",
      "Rotación de 360° (o 0°) = transformación identidad",
      "Rotación de 180° = simetría central respecto al centro C",
    ],
    examples: [
      {
        title: "A(3, 1) rotado 90° antihorario en O(0,0)",
        steps: [
          "Fórmula 90°: P'( -y, x )",
          "x = 3, y = 1 → A'(-1, 3)",
          "Distancia al origen: |OA| = √(9+1) = √10 = |OA'| ✓",
        ],
      },
    ],
    commonErrors: [
      "Confundir sentido horario con antihorario (en matemáticas positivo = antihorario)",
      "Rotar respecto al origen cuando el problema pide otro centro (h, k)",
    ],
    mnemonic:
      "Girar como las manecillas de un reloj... ¡pero en reversa! (positivo = contra reloj).",
  },
  {
    id: "homothety",
    label: "Homotecia",
    icon: Maximize2,
    colorAccent: "#9333ea",
    tagline: "Ampliación o contracción con factor k desde centro C",
    definition:
      "Una homotecia multiplica las distancias desde un punto fijo (centro de homotecia C) por un factor k ≠ 0. Si |k| > 1 es ampliación; si 0 < |k| < 1 es contracción. No es isometría (salvo |k|=1), sino semejanza.",
    invariants: [
      "Ángulos internos de la figura (se conservan exactamente)",
      "Forma general (figuras semejantes)",
      "El centro C queda fijo",
      "Paralelismo: cada lado es paralelo a su imagen",
    ],
    formulas: [
      {
        title: "Centro en el origen (0,0)",
        formula: "P(x, y) → P'(k·x, k·y)",
        note: "Se multiplican ambas coordenadas por el factor k",
      },
      {
        title: "Centro C(xc, yc) genérico",
        formula: "x' = xc + k·(x - xc)\ny' = yc + k·(y - yc)",
        note: "Desplazar al centro, escalar y regresar",
      },
      {
        title: "Razón de Áreas",
        formula: "Área(F') = k² · Área(F)",
        note: "El área crece o decrece al cuadrado del factor k",
      },
    ],
    properties: [
      "Transformación de semejanza: conserva ángulos y proporciones",
      "Distancias: d(A', B') = |k| · d(A, B)",
      "Si k > 0: homotecia directa (al mismo lado del centro)",
      "Si k < 0: homotecia inversa (al lado opuesto del centro)",
    ],
    examples: [
      {
        title: "A(2, 3) con centro O(0,0) y k = 2.5",
        steps: [
          "A'(2.5 · 2, 2.5 · 3)",
          "A'(5, 7.5)",
          "El triángulo resultante tiene 2.5× el tamaño y 6.25× el área ✓",
        ],
      },
    ],
    commonErrors: [
      "Creer que el área se multiplica por k (se multiplica por k²)",
      "Olvidar que k negativo invierte la figura al lado opuesto del centro",
    ],
    mnemonic:
      "Como un proyector de cine: alejas la pantalla y la imagen se agranda manteniendo sus proporciones.",
  },
  {
    id: "central_reflection",
    label: "Simetría Central",
    icon: Target,
    colorAccent: "#0284c7",
    tagline: "Reflejo respecto a un punto O (giro de 180°)",
    definition:
      "La simetría central respecto a un punto O asigna a cada punto P su imagen P' tal que O es el punto medio del segmento PP'. Es equivalente a una rotación de 180° alrededor de O y a una homotecia con k = -1.",
    invariants: [
      "Distancias entre puntos (isometría)",
      "Ángulos internos y áreas",
      "Orientación de la figura (directa en el plano)",
      "El centro O es el único punto invariante",
    ],
    formulas: [
      {
        title: "Centro en el origen (0,0)",
        formula: "P(x, y) → P'(-x, -y)",
        note: "Se invierten los signos de ambas coordenadas",
      },
      {
        title: "Centro C(xc, yc) genérico",
        formula: "x' = 2·xc - x\ny' = 2·yc - y",
        note: "O es el punto medio de PP'",
      },
    ],
    properties: [
      "Isometría directa (conserva distancias, ángulos y orientación)",
      "El punto O es el único punto doble o invariante",
      "Las rectas que pasan por O son invariantes globales",
      "Equivale exactamente a Rotación de 180° con centro O",
    ],
    examples: [
      {
        title: "A(4, -2) con centro en C(1, 1)",
        steps: [
          "x' = 2(1) - 4 = -2",
          "y' = 2(1) - (-2) = 4",
          "A'(-2, 4)",
          "Verificación: punto medio ((4-2)/2, (-2+4)/2) = (1, 1) ✓",
        ],
      },
    ],
    commonErrors: [
      "Confundir simetría central con axial (la central es respecto a un PUNTO)",
      "Olvidar que equivale a un giro de 180°",
    ],
    mnemonic:
      "Trazar una línea recta desde cada punto que pase por el centro y continuar la misma distancia al otro lado.",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const TheoryPage: React.FC<TheoryPageProps> = ({
  initialTransformation,
  onClose,
}) => {
  const [activeId, setActiveId] = useState<TransformationType>(
    initialTransformation ?? "reflection"
  );
  const theory = THEORIES.find((t) => t.id === activeId) ?? THEORIES[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    // Bloquear scroll del fondo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const currentIdx = THEORIES.findIndex((t) => t.id === activeId);

  // Render via portal to body to guarantee full-screen overlay without stacking issues
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden animate-in fade-in duration-150">
      {/* ── TOP APP BAR ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-xs z-30">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
          title="Regresar a la pizarra de trabajo"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Volver al Laboratorio</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 border border-indigo-500/20 flex items-center justify-center">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-none">
              Zona de Teoría Geométrica
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 hidden xs:block">
              Fundamentos, Fórmulas e Invariantes
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          title="Cerrar ventana (Esc)"
        >
          <X className="h-4 w-4" />
          <span className="hidden sm:inline">Cerrar</span>
        </button>
      </header>

      {/* ── MOBILE / TABLET HORIZONTAL SELECTOR (Scrollable Chips) ── */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0 shadow-inner">
        {THEORIES.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === activeId;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-sm scale-[1.02]"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
              }`}
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: isActive ? undefined : t.colorAccent }}
              />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── MAIN WORK AREA: SIDEBAR + CONTENT ──────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* DESKTOP SIDEBAR NAV */}
        <nav className="hidden md:flex w-64 lg:w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col overflow-y-auto">
          <div className="px-5 pt-4 pb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Transformaciones
            </span>
          </div>
          <div className="flex-1 px-3 space-y-1.5 py-1">
            {THEORIES.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black shadow-xs ring-1 ring-slate-300 dark:ring-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-semibold"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform"
                    style={{
                      backgroundColor: isActive
                        ? `${t.colorAccent}20`
                        : "transparent",
                      borderColor: isActive
                        ? t.colorAccent
                        : "var(--color-border)",
                      color: t.colorAccent,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm leading-tight truncate font-bold">
                      {t.label}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate mt-0.5 font-medium">
                      {t.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la Pizarra</span>
            </button>
          </div>
        </nav>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* HERO BANNER CARD */}
            <div className="rounded-3xl p-5 sm:p-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2"
                  style={{
                    backgroundColor: `${theory.colorAccent}18`,
                    borderColor: `${theory.colorAccent}40`,
                  }}
                >
                  <theory.icon
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    style={{ color: theory.colorAccent }}
                  />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {theory.label}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold mt-0.5">
                    {theory.tagline}
                  </p>
                </div>
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs sm:text-sm mt-4 font-normal">
                {theory.definition}
              </p>
            </div>

            {/* INTERACTIVE DEMONSTRATION GRAPH (100% DYNAMIC & MANIPULABLE) */}
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Demostración Gráfica Interactiva en el Plano Cartesiano
                </h3>
                <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Laboratorio Dinámico e Interactivo (100% Manipulable)
                </span>
              </div>

              {/* Dynamic Interactive Diagram with dragging, animations and controls */}
              <InteractiveTheoryDiagram
                key={theory.id}
                transformationType={theory.id}
                colorAccent={theory.colorAccent}
              />
            </section>

            {/* FORMULAS & RULES (HIGH-CONTRAST EYE-COMFORTABLE GUARANTEED) */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Fórmulas y Reglas de Transformación
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {theory.formulas.map((f, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 sm:p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between"
                    style={{
                      borderLeftWidth: 5,
                      borderLeftColor: theory.colorAccent,
                    }}
                  >
                    <div>
                      <div className="text-xs sm:text-sm font-black uppercase tracking-wider mb-2 text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{f.title}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          Regla
                        </span>
                      </div>

                      {/* HIGH-CONTRAST FORMULA DISPLAY: Dark Slate Terminal with Luminous Emerald Text */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 my-2.5 shadow-inner flex items-center justify-between">
                        <code className="block font-mono text-[14px] sm:text-[15px] font-black text-emerald-300 tracking-wide select-all">
                          {f.formula}
                        </code>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden xs:inline">
                          Fórmula
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-semibold pt-1 flex items-start gap-1.5">
                      <span className="text-slate-400">↳</span>
                      <span>{f.note}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* INVARIANTS & KEY PROPERTIES */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Invariantes */}
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Invariantes (se conserva)
                </h3>
                <ul className="space-y-2.5">
                  {theory.invariants.map((inv, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-2xs"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{inv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Propiedades clave */}
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-2 text-slate-900 dark:text-white">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Propiedades clave
                </h3>
                <ul className="space-y-2.5">
                  {theory.properties.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 shadow-2xs"
                    >
                      <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* RESOLVED STEP-BY-STEP EXAMPLES */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Ejemplos Resueltos Paso a Paso
              </h3>
              <div className="space-y-4">
                {theory.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                  >
                    <div className="px-4 sm:px-5 py-3 font-black text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white flex items-center justify-between">
                      <span>
                        Ejemplo {i + 1}: {ex.title}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Paso a Paso
                      </span>
                    </div>
                    <ol className="p-4 sm:p-5 space-y-3">
                      {ex.steps.map((step, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black mt-0.5 shadow-xs">
                            {j + 1}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-semibold">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>

            {/* COMMON ERRORS TO AVOID */}
            <section>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Errores Frecuentes a Evitar
              </h3>
              <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-5 space-y-3">
                {theory.commonErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-amber-950 dark:text-amber-100 text-xs sm:text-sm font-bold leading-relaxed">
                      {err}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* MNEMONIC TAKEAWAY */}
            <section className="rounded-3xl p-5 sm:p-6 bg-slate-900 text-white border-2 border-slate-800 shadow-md relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300 block mb-1">
                    Consejo Nemotécnico Para Recordar
                  </span>
                  <p className="text-slate-100 text-xs sm:text-sm leading-relaxed font-semibold">
                    {theory.mnemonic}
                  </p>
                </div>
              </div>
            </section>

            {/* BOTTOM CONTROLS & DUAL RETURN BUTTON */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="w-full sm:w-auto flex justify-between sm:justify-start gap-2">
                {currentIdx > 0 ? (
                  <button
                    onClick={() => setActiveId(THEORIES[currentIdx - 1].id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>{THEORIES[currentIdx - 1].label}</span>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
                <span>Volver a la Pizarra de Trabajo</span>
              </button>

              <div className="w-full sm:w-auto flex justify-between sm:justify-end gap-2">
                {currentIdx < THEORIES.length - 1 && (
                  <button
                    onClick={() => setActiveId(THEORIES[currentIdx + 1].id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                    style={{
                      backgroundColor: THEORIES[currentIdx + 1].colorAccent,
                    }}
                  >
                    <span>{THEORIES[currentIdx + 1].label}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="pb-10" />
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
};
