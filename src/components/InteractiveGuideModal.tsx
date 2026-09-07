import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  MousePointer,
  Hexagon,
  FlipHorizontal,
  Move,
  RotateCw,
  Target,
  Maximize2,
  FileText,
  Compass,
  CheckCircle2,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExample?: () => void;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadExample
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Cómo Trazar Puntos y Figuras en la Pizarra',
      badge: 'Herramientas de Dibujo',
      icon: <Hexagon className="h-6 w-6 text-blue-600" />,
      content: (
        <div className="space-y-3 text-xs text-ink leading-relaxed">
          <p>
            Inicias con una <strong>pizarra completamente limpia</strong>. Para crear tus figuras tienes 3 formas sencillas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-accent">
                <div className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span>Herramienta Punto</span>
              </div>
              <p className="text-ink-soft text-[11px]">
                Selecciona <strong>Punto</strong> en la barra superior y haz clic en cualquier intersección del plano. Cada clic genera automáticamente un punto: <code className="bg-surface px-1 py-0.5 rounded">A</code>, <code className="bg-surface px-1 py-0.5 rounded">B</code>, <code className="bg-surface px-1 py-0.5 rounded">C</code>...
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-blue-600">
                <Hexagon className="h-3.5 w-3.5" />
                <span>Herramienta Polígono</span>
              </div>
              <p className="text-ink-soft text-[11px]">
                Selecciona <strong>Polígono</strong>, haz clic en cada vértice sucesivamente y <strong>vuelve a hacer clic en el primer punto A</strong> para cerrar la figura.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-950 text-[11px] flex items-start gap-2">
            <MousePointer className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Herramienta Mover:</strong> Puedes hacer clic en <strong>Mover</strong> para arrastrar cualquier vértice libremente por la pizarra. La figura y su transformación se recalcularán en tiempo real.
            </div>
          </div>
        </div>
      )
    },
    {
      title: '2. Cómo Seleccionar y Configurar la Transformación',
      badge: 'Transformaciones Geométricas',
      icon: <FlipHorizontal className="h-6 w-6 text-purple-600" />,
      content: (
        <div className="space-y-3 text-xs text-ink leading-relaxed">
          <p>
            En la barra superior, haz clic en el menú desplegable <strong>Transformaciones</strong> para elegir la operación matemática:
          </p>
          <div className="space-y-2 pt-1">
            <div className="p-2.5 rounded-xl bg-panel border border-border flex items-start gap-2.5">
              <FlipHorizontal className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Simetría Axial (Reflexión):</strong> Refleja respecto a los ejes coordenados (Eje X, Eje Y), diagonales ($y = x$, $y = -x$) o cualquier recta vertical ($x = k$) u horizontal ($y = k$).
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-panel border border-border flex items-start gap-2.5">
              <Move className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Traslación:</strong> Ajusta los deslizadores del vector director <code>v = (Δx, Δy)</code> en el panel lateral.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-panel border border-border flex items-start gap-2.5">
              <RotateCw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Rotación:</strong> Elige el ángulo $\alpha$ (90°, 180°, etc.), el sentido (horario o antihorario) y arrastra el centro de giro $C$ sobre la pizarra.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-panel border border-border flex items-start gap-2.5">
              <Target className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Simetría Central:</strong> Refleja respecto a un punto $O(h, k)$. Cada punto y su imagen tienen a $O$ como punto medio exacto.
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-panel border border-border flex items-start gap-2.5">
              <Maximize2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink">Homotecia:</strong> Escala la figura por un factor k. Si k &gt; 0 es directa; si k &lt; 0 se invierte respecto al centro O.
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '3. Demostración Visual y Justificación en Pizarra',
      badge: 'Demostración Gráfica',
      icon: <Compass className="h-6 w-6 text-rose-600" />,
      content: (
        <div className="space-y-3 text-xs text-ink leading-relaxed">
          <p>
            La pizarra no solo dibuja la figura final, sino que <strong>explica el por qué geométrico</strong> con rigor analítico:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <div className="font-bold text-rose-700">Ángulos Rectos y Congruencia (≅)</div>
              <p className="text-ink-soft text-[11px]">
                En la simetría axial se trazan los segmentos perpendiculares con el símbolo de 90° en el pie de la perpendicular y marcas de congruencia de distancia demostrando que la recta es la mediatriz.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <div className="font-bold text-blue-700">Descomposición Vectorial</div>
              <p className="text-ink-soft text-[11px]">
                En la traslación se dibujan triángulos rectángulos que descomponen el movimiento en su cateto horizontal $\Delta x$ y su cateto vertical $\Delta y$.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <div className="font-bold text-amber-700">Arcos y Radios de Giro</div>
              <p className="text-ink-soft text-[11px]">
                En rotaciones se trazan los radios y el arco con la medida del ángulo y flecha indicando el sentido de giro.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <div className="font-bold text-purple-700">Rayos Proyectivos</div>
              <p className="text-ink-soft text-[11px]">
                En homotecias se proyectan los rayos continuos desde el centro atravesando los vértices originales hacia los ampliados/reducidos.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '4. Resolución Algebraica Formal para el Cuaderno',
      badge: 'Desarrollo Escolar',
      icon: <FileText className="h-6 w-6 text-emerald-600" />,
      content: (
        <div className="space-y-3 text-xs text-ink leading-relaxed">
          <p>
            En la barra superior, haz clic en la pestaña <strong>Cuaderno</strong> para abrir el panel de desarrollo analítico que los alumnos deben registrar en sus cuadernos:
          </p>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-2">
            <div className="font-bold text-xs">Estructura del Cuaderno:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-emerald-900">
              <li>
                <strong>Fórmula General:</strong> Expresión algebraica teórica correspondiente al tipo de transformación.
              </li>
              <li>
                <strong>Sustitución Vértice por Vértice:</strong> Reemplazo aritmético paso a paso con paréntesis y signos negativos para $A, B, C...$.
              </li>
              <li>
                <strong>Conjunto Solución:</strong> Lista ordenada de los nuevos pares ordenados calculados $A', B', C'...$.
              </li>
              <li>
                <strong>Propiedades Invariantes:</strong> Clasificación isométrica, distancias, ángulos y orientación.
              </li>
            </ol>
          </div>
          <p className="text-[11px] text-ink-soft">
            Incluye un botón <strong>"Copiar Apuntes"</strong> para exportar todo el desarrollo en texto formateado con un solo clic.
          </p>
        </div>
      )
    },
    {
      title: '5. Modo Problemas Inversos y Pizarra Limpia',
      badge: 'Evaluación y Práctica',
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      content: (
        <div className="space-y-3 text-xs text-ink leading-relaxed">
          <p>
            La plataforma incluye herramientas avanzadas para la clase en vivo:
          </p>
          <div className="space-y-2 pt-1">
            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <strong className="text-ink">Pizarra Limpia (Botón Limpiar):</strong>
              <p className="text-ink-soft text-[11px]">
                Usa el botón <strong>Limpiar</strong> en la barra de herramientas para vaciar el lienzo instantáneamente y empezar un nuevo ejercicio desde cero.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <strong className="text-ink">Pestaña Problemas (Deducción Inversa):</strong>
              <p className="text-ink-soft text-[11px]">
                Muestra dos figuras $F$ y $F'$ para que los alumnos deduzcan qué transformación se aplicó (calcular vector, mediatriz, centro o razón $k$) y presionen <em>"Comprobar Deducción"</em> con retroalimentación inmediata.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-panel border border-border space-y-1">
              <strong className="text-ink">Modo Pantalla Completa Limpia:</strong>
              <p className="text-ink-soft text-[11px]">
                Presiona el icono de maximizar en la esquina superior derecha para proyectar solo el plano en el proyector o pantalla interactiva del aula.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const activeStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-surface p-6 shadow-2xl border border-border flex flex-col space-y-4 max-h-[90vh]">
        {/* ENCABEZADO DE LA GUÍA */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-accent/10 text-accent">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">Guía Interactiva de Uso</h2>
              <p className="text-[11px] text-ink-soft">
                Paso {currentStep + 1} de {steps.length}: {activeStepData.badge}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-black/5 text-ink-soft hover:text-ink transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* INDICADOR DE PASOS SUPERIOR */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === currentStep
                  ? 'bg-accent'
                  : i < currentStep
                  ? 'bg-accent/40'
                  : 'bg-panel border border-border'
              }`}
            />
          ))}
        </div>

        {/* CONTENIDO DEL PASO */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-panel border border-border">
              {activeStepData.icon}
            </div>
            <h3 className="text-sm font-bold text-ink">{activeStepData.title}</h3>
          </div>

          <div className="pt-1">{activeStepData.content}</div>
        </div>

        {/* BOTONES DE NAVEGACIÓN INFERIORES */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-panel disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Anterior
          </button>

          <div className="flex items-center gap-2">
            {onLoadExample && (
              <button
                onClick={() => {
                  onLoadExample();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-panel border border-border text-ink hover:border-accent hover:text-accent font-semibold text-xs transition"
              >
                Cargar Ejercicio Demostrativo
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-accent text-white text-xs font-bold hover:brightness-110 shadow-sm transition"
              >
                Siguiente <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> ¡Entendido, ir a la Pizarra!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
