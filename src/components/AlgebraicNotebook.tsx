import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  NotebookPen,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Eye,
  Layers,
  Award,
  BookOpen
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
  const [expandedProperties, setExpandedProperties] = useState(true);

  const {
    generalFormula,
    algebraicSteps,
    transformedVertices,
    geometricProperties
  } = engineResult;

  const firstStep = algebraicSteps[0];

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden">
      {/* ── CABECERA SUPERIOR MODERNA (ALTO IMPACTO VISUAL) ───────────────── */}
      <header className="flex items-center justify-between px-5 sm:px-8 py-4 border-b-2 border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/15 dark:bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <NotebookPen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-black text-lg sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                Cuaderno de Trabajo Matemático
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Análisis en Tiempo Real
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Deducción algebraica formal, sustitución paso a paso y registro de propiedades de tu figura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 transition shadow-xs cursor-pointer active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a la Pizarra</span>
            </button>
          )}
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL DESPLAZABLE CON TIPOGRAFÍA GENEROSA ──────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 [&::-webkit-scrollbar-thumb]:hover:bg-slate-400/80">
        <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8">
          
          {/* 1. HERO CARD: OBJETIVO DIDÁCTICO */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/40 border-2 border-indigo-200/90 dark:border-indigo-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Bitácora de Deducción y Demostración Geométrica
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                  ¿Cómo demuestra el álgebra lo que vemos en la pizarra?
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                  Este cuaderno analiza la figura actual de tu pantalla en tiempo real: identifica la transformación aplicada, muestra las magnitudes que se conservan y calcula la regla algebraica exacta que la explica. No es un manual genérico; es el registro riguroso del ejercicio que estás manipulando.
                </p>
              </div>
            </div>
          </div>

          {/* 2. CONTEXTO DE LA PIZARRA ACTUAL */}
          {boardContext && (
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                      Contexto y Diagnóstico del Caso Actual
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      Parámetros geométricos activos en el plano cartesiano
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {boardContext.typeLabel}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Caso Activo
                  </span>
                </div>
              </div>

              {/* Enunciado Síntesis */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-200/70 dark:border-indigo-800/60">
                <div className="text-xs sm:text-sm font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1.5">
                  Descripción Geométrica
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  <MathText text={boardContext.summary} />
                </div>
              </div>

              {/* Parámetros Específicos */}
              <div className="space-y-2.5">
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Parámetros y Condiciones del Movimiento
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {boardContext.parameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                    >
                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
                        <MathText text={param} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicación Pedagógica para el Estudiante */}
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Lightbulb className="h-4 w-4" />
                  <span>Explicación Conceptual para el Estudiante</span>
                </div>
                <p className="text-sm sm:text-base font-medium leading-relaxed text-amber-950 dark:text-amber-100">
                  <MathText text={boardContext.studentExplanation} />
                </p>
              </div>
            </section>
          )}

          {/* 3. SECUENCIA DIDÁCTICA DE RAZONAMIENTO */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Secuencia Didáctica de Razonamiento
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Guía de 4 pasos para deducir cualquier transformación sin memorizar fórmulas
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              {/* PASO 1: OBSERVA */}
              <div className="p-5 sm:p-6 rounded-3xl border-2 border-sky-200 dark:border-sky-800/80 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    <Eye className="h-4 w-4" />
                    1. Observa
                  </span>
                  <span className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Identifica el cambio en el plano
                </h4>
                <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                  <MathText text={boardContext?.summary || 'La figura cambia de posición o forma según la transformación elegida; se mantiene una relación clara entre cada punto original y su imagen.'} />
                </p>
              </div>

              {/* PASO 2: FORMULA */}
              <div className="p-5 sm:p-6 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    <Calculator className="h-4 w-4" />
                    2. Formula
                  </span>
                  <span className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Escribe la regla algebraica
                </h4>
                <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                  <MathText text={boardContext?.studentExplanation || 'La regla general permite escribir la imagen de cualquier punto sin depender solo del dibujo.'} />
                </p>
              </div>

              {/* PASO 3: VERIFICA */}
              <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    3. Verifica
                  </span>
                  <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-black">
                    3
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Comprueba con un punto real
                </h4>
                <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                  {firstStep ? (
                    <MathText text={`Comprobamos con un punto concreto: ${firstStep.vertexName}(${firstStep.originalPoint.x}, ${firstStep.originalPoint.y}) → ${firstStep.resultLine}.`} />
                  ) : (
                    'Se sustituye un punto real en la fórmula para comprobar si la transformación es coherente.'
                  )}
                </div>
              </div>

              {/* PASO 4: CONCLUYE */}
              <div className="p-5 sm:p-6 rounded-3xl border-2 border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <Award className="h-4 w-4" />
                    4. Concluye
                  </span>
                  <span className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-black">
                    4
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Extrae las propiedades conservadas
                </h4>
                <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-normal">
                  <MathText text={geometricProperties.pedagogicalNotes || 'La figura conserva o modifica propiedades específicas según la transformación; eso es lo que explica el comportamiento del plano.'} />
                </div>
              </div>
            </div>
          </section>

          {/* 4. FÓRMULA MAESTRA DE LA TRANSFORMACIÓN (ALTO CONTRASTE) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Fórmula General Maestra</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Regla Algebraica
              </span>
            </div>

            {/* Terminal de visualización matemática con alto contraste */}
            <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col items-center justify-center text-center overflow-x-auto">
              <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 block mb-2">
                MODELO MATEMÁTICO EN EL PLANO CARTESIANO
              </span>
              <div className="text-emerald-300 font-bold text-lg sm:text-2xl lg:text-3xl select-all py-1">
                <MathText text={boardContext?.formula || generalFormula} displayMode />
              </div>
              <span className="text-xs text-slate-400 mt-2 font-medium">
                Aplica directamente a cualquier par ordenado $(x, y)$ de la figura
              </span>
            </div>
          </section>

          {/* 5. SUSTITUCIÓN VÉRTICE POR VÉRTICE */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Sustitución Aritmética Paso a Paso (Vértice por Vértice)</span>
              </div>
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                {algebraicSteps.length} Vértices Calculados
              </span>
            </div>

            <div className="space-y-4">
              {algebraicSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-indigo-500/50 transition-all"
                >
                  {/* Encabezado del vértice */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-xs">
                        {idx + 1}
                      </span>
                      <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        <MathText text={`Vértice Original ${step.vertexName}(${step.originalPoint.x}, ${step.originalPoint.y})`} />
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="font-black text-sm sm:text-base text-indigo-600 dark:text-indigo-400">
                        <MathText text={`Imagen ${step.resultLine}`} />
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de sustitución matemática */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="space-y-2">
                      {step.substitutionLines.map((line, lIdx) => (
                        <div
                          key={lIdx}
                          className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 font-mono text-sm sm:text-base text-slate-800 dark:text-slate-200"
                        >
                          <span className="text-slate-400 text-xs select-none">↳</span>
                          <MathText text={line} />
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-sm sm:text-base border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <MathText text={step.resultLine} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. CONJUNTO SOLUCIÓN IMAGEN F' */}
          <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Conjunto Solución: Coordenadas de la Figura Imagen $F'$</span>
              </div>
              <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                Puntos Transformados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {transformedVertices.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all shadow-xs"
                >
                  <span className="font-black text-base sm:text-lg text-indigo-600 dark:text-indigo-400">
                    <MathText text={v.label || `P${i + 1}'`} />
                  </span>
                  <span className="font-black text-base sm:text-lg font-mono text-slate-900 dark:text-white">
                    <MathText text={`(${v.x}, ${v.y})`} />
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 7. PROPIEDADES E INVARIANTES GEOMÉTRICOS (ACORDEÓN) */}
          <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <button
              onClick={() => setExpandedProperties(!expandedProperties)}
              className="flex items-center justify-between w-full p-5 sm:p-6 text-left font-black text-sm sm:text-base text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span>Propiedades Geométricas e Invariantes Conservados</span>
              </div>
              {expandedProperties ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </button>

            {expandedProperties && (
              <div className="p-5 sm:p-6 pt-0 space-y-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-sm sm:text-base font-bold text-indigo-950 dark:text-indigo-200">
                  <MathText text={geometricProperties.isometryType} />
                </div>

                <div className="space-y-2">
                  <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Magnitudes que se mantienen constantes (Invariantes):
                  </div>
                  <ul className="space-y-2">
                    {geometricProperties.invariants.map((inv, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <MathText text={inv} />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-100 text-sm sm:text-base leading-relaxed">
                  <strong className="font-black text-amber-900 dark:text-amber-300 block mb-1">
                    Nota del Docente:
                  </strong>
                  <MathText text={geometricProperties.pedagogicalNotes} />
                </div>
              </div>
            )}
          </section>

          {/* 8. BOTÓN INFERIOR DE REGRESO RÁPIDO */}
          {onClose && (
            <div className="flex justify-center pt-2 pb-8">
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-sm sm:text-base transition shadow-md cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
                <span>Volver a la Pizarra de Trabajo</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
