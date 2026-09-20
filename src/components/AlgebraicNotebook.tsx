import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  NotebookPen,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { ProblemEngineResult } from '../types/geometry';
import { MathText } from './MathText';

interface NotebookBoardContext {
  typeLabel: string;
  summary: string;
  formula: string;
  studentExplanation: string;
  parameters: string[];
}

interface AlgebraicNotebookProps {
  engineResult: ProblemEngineResult;
  boardContext?: NotebookBoardContext;
  onClose?: () => void;
}

export const AlgebraicNotebook: React.FC<AlgebraicNotebookProps> = ({
  engineResult,
  boardContext,
  onClose
}) => {
  const [expandedProperties, setExpandedProperties] = useState(false);

  const {
    generalFormula,
    algebraicSteps,
    transformedVertices,
    geometricProperties
  } = engineResult;

  const firstStep = algebraicSteps[0];

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface text-ink text-sm font-sans overflow-hidden">
      {/* CABECERA DEL CUADERNO */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel">
        <div className="flex items-center gap-2.5">
          <NotebookPen className="h-5 w-5 text-accent" />
          <span className="font-bold text-base text-ink">Cuaderno de trabajo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-accent/10 text-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            Análisis
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl border border-border bg-panel px-2.5 py-1.5 text-[11px] font-bold text-ink hover:border-accent hover:text-accent transition"
            >
              Volver a la pizarra
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO DESPLAZABLE */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-5 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:hover:bg-slate-400/80">
        <div className="mx-auto w-full max-w-5xl space-y-5">
        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-bold text-[12px] uppercase tracking-wider text-accent">
              ¿Para qué sirve?
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Este cuaderno analiza la figura actual de la pizarra: identifica la transformación aplicada, muestra qué se conserva y cuál es la regla algebraica que la explica. No es un cuaderno genérico; es un registro del caso concreto que estás trabajando.
          </p>
        </div>

        {/* CONTEXTO DE LA PIZARRA ACTUAL */}
        {boardContext && (
          <div className="p-4 rounded-2xl bg-panel border border-border space-y-3.5">
            <div className="flex items-center gap-2.5">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="font-bold text-[12px] uppercase tracking-wider text-ink-faint">
                Contexto de esta pizarra
              </span>
            </div>

            <div className="rounded-xl bg-accent/5 border border-accent/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] uppercase tracking-[0.14em] text-accent font-bold">
                  {boardContext.typeLabel}
                </span>
                <span className="rounded-full bg-accent/10 text-accent px-2 py-0.5 text-[10px] font-bold">
                  Caso actual
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                <MathText text={boardContext.summary} />
              </p>
            </div>

            <div className="space-y-1.5">
              {boardContext.parameters.map((param, index) => (
                <div key={index} className="flex items-center gap-2 text-[13px] text-ink-soft">
                  <ArrowRight className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span><MathText text={param} /></span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="text-[11px] uppercase tracking-[0.12em] text-ink-faint font-bold mb-1.5">
                Explicación para el estudiante
              </div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <MathText text={boardContext.studentExplanation} />
              </p>
            </div>
          </div>
        )}

        {/* SECUENCIA DIDÁCTICA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="font-bold text-[12px] uppercase tracking-wider text-ink-faint">
              Secuencia de razonamiento
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-4 rounded-2xl border border-border bg-panel">
              <div className="text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-2">1. Observa</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <MathText text={boardContext?.summary || 'La figura cambia de posición o forma según la transformación elegida; se mantiene una relación clara entre cada punto original y su imagen.'} />
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-panel">
              <div className="text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-2">2. Formula</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <MathText text={boardContext?.studentExplanation || 'La regla general permite escribir la imagen de cualquier punto sin depender solo del dibujo.'} />
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-panel">
              <div className="text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-2">3. Verifica</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                {firstStep ? (
                  <MathText text={`Comprobamos con un punto concreto: ${firstStep.vertexName}(${firstStep.originalPoint.x}, ${firstStep.originalPoint.y}) → ${firstStep.resultLine}.`} />
                ) : (
                  'Se sustituye un punto real en la fórmula para comprobar si la transformación es coherente.'
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-panel">
              <div className="text-[11px] uppercase tracking-[0.12em] text-accent font-bold mb-2">4. Concluye</div>
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <MathText text={geometricProperties.pedagogicalNotes || 'La figura conserva o modifica propiedades específicas según la transformación; eso es lo que explica el comportamiento del plano.'} />
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[12px] uppercase tracking-wider text-accent">
              Fórmula de la transformación
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
              Regla
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-accent/20 text-accent font-semibold shadow-inner overflow-x-auto">
            <MathText text={boardContext?.formula || generalFormula} displayMode />
          </div>
        </div>

        {firstStep && (
          <div className="p-4 rounded-2xl bg-panel border border-border space-y-2.5">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-[12px] uppercase tracking-wider text-ink-faint">
                Ejemplo comprobado
              </span>
            </div>
            <div className="rounded-xl bg-surface border border-border p-3 space-y-1.5">
              <div className="text-[13px] text-accent font-semibold">
                <MathText text={`${firstStep.vertexName}(${firstStep.originalPoint.x}, ${firstStep.originalPoint.y}) → ${firstStep.resultLine}`} />
              </div>
              <div className="space-y-1.5">
                {firstStep.substitutionLines.map((line, idx) => (
                  <div key={idx} className="text-[12px] text-ink-soft bg-panel/80 rounded-lg px-2.5 py-1.5 border border-border/60">
                    <MathText text={line} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SUSTITUCIÓN VÉRTICE POR VÉRTICE */}
        <div className="space-y-2.5">
          <span className="font-bold text-[12px] uppercase tracking-wider text-ink-faint">
            2. Sustitución Aritmética Paso a Paso
          </span>

          <div className="space-y-3">
            {algebraicSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-border bg-panel/70 hover:border-border-strong transition space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
                  <span className="font-bold text-emerald-700 text-[13px]">
                    <MathText text={`Vértice ${step.vertexName}(${step.originalPoint.x}, ${step.originalPoint.y})`} />
                  </span>
                  <span className="text-[12px] text-ink-soft">
                    <MathText text={`➜ ${step.resultLine}`} />
                  </span>
                </div>

                <div className="space-y-1.5 pl-1 text-[13px] text-ink">
                  {step.substitutionLines.map((line, lIdx) => (
                    <div key={lIdx} className="leading-relaxed bg-surface/80 px-2.5 py-1.5 rounded-lg border border-border/40">
                      <MathText text={line} />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[12px] border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <MathText text={step.resultLine} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-panel border border-border space-y-2.5">
          <span className="font-bold text-[12px] uppercase tracking-wider text-ink-faint">
            3. Conjunto Solución Imagen F'
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {transformedVertices.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-[13px]"
              >
                <span className="font-bold text-accent">
                  <MathText text={v.label || `P${i + 1}'`} />:
                </span>
                <span className="font-semibold text-ink">
                  <MathText text={`(${v.x}, ${v.y})`} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-panel border border-border space-y-2.5">
          <button
            onClick={() => setExpandedProperties(!expandedProperties)}
            className="flex items-center justify-between w-full text-left font-bold text-[12px] uppercase tracking-wider text-ink-faint hover:text-ink"
          >
            <span>4. Propiedades e Invariantes</span>
            {expandedProperties ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expandedProperties && (
            <div className="space-y-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-surface border border-border text-[13px] text-ink font-medium">
                <MathText text={geometricProperties.isometryType} />
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[13px] text-ink-soft">
                {geometricProperties.invariants.map((inv, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <MathText text={inv} />
                  </li>
                ))}
              </ul>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] leading-relaxed">
                <strong>Nota: </strong><MathText text={geometricProperties.pedagogicalNotes} />
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
