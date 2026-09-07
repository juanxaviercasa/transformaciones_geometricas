import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { ProblemEngineResult } from '../types/geometry';

interface AlgebraicNotebookProps {
  engineResult: ProblemEngineResult;
  onClose?: () => void;
}

export const AlgebraicNotebook: React.FC<AlgebraicNotebookProps> = ({
  engineResult,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedProperties, setExpandedProperties] = useState(false);

  const {
    generalFormula,
    algebraicSteps,
    transformedVertices,
    geometricProperties
  } = engineResult;

  // Generar texto estructurado para que el alumno lo pegue en sus apuntes
  const generateNotebookText = () => {
    let text = `DESARROLLO ALGEBRAICO FORMAL (GEOMETRÍA ANALÍTICA)\n`;
    text += `===================================================\n\n`;
    text += `1. LEY DE CORRESPONDENCIA / FÓRMULA GENERAL:\n`;
    text += `   ${generalFormula}\n\n`;
    text += `2. SUSTITUCIÓN ANALÍTICA VÉRTICE POR VÉRTICE:\n`;

    algebraicSteps.forEach((step) => {
      text += `\n* Vértice ${step.vertexName}(${step.originalPoint.x}, ${step.originalPoint.y}):\n`;
      step.substitutionLines.forEach((line) => {
        text += `    ${line}\n`;
      });
      text += `    ➜ Resultado: ${step.resultLine}\n`;
    });

    text += `\n3. COORDENADAS DE LA FIGURA IMAGEN RESULTANTE:\n`;
    transformedVertices.forEach((v) => {
      text += `   ${v.label || 'P'} = (${v.x}, ${v.y})\n`;
    });

    text += `\n4. PROPIEDADES GEOMÉTRICAS INVARIANTES:\n`;
    text += `   - Clasificación: ${geometricProperties.isometryType}\n`;
    geometricProperties.invariants.forEach((inv) => {
      text += `   - ${inv}\n`;
    });

    return text;
  };

  const handleCopy = () => {
    const text = generateNotebookText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-surface text-ink text-xs font-sans overflow-hidden">
      {/* CABECERA DEL CUADERNO */}
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-panel">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <span className="font-bold text-sm text-ink">Desarrollo para Cuaderno</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white font-semibold text-xs hover:brightness-110 transition shadow-sm"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copiar Apuntes
            </>
          )}
        </button>
      </div>

      {/* CONTENIDO DESPLAZABLE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 1. FÓRMULA GENERAL */}
        <div className="p-3 rounded-2xl bg-accent/5 border border-accent/20 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider text-accent">
              1. Ley Teórica General
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
              Fórmula
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-surface border border-accent/20 font-mono text-xs text-accent font-semibold whitespace-pre-wrap shadow-inner">
            {generalFormula}
          </div>
        </div>

        {/* 2. SUSTITUCIÓN VÉRTICE POR VÉRTICE */}
        <div className="space-y-2.5">
          <span className="font-bold text-[11px] uppercase tracking-wider text-ink-faint">
            2. Sustitución Aritmética Paso a Paso
          </span>

          <div className="space-y-2">
            {algebraicSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-border bg-panel/70 hover:border-border-strong transition space-y-2"
              >
                {/* Encabezado del vértice */}
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="font-bold font-mono text-emerald-700 text-xs">
                    Vértice {step.vertexName}({step.originalPoint.x}, {step.originalPoint.y})
                  </span>
                  <span className="font-mono text-[11px] text-ink-soft">
                    ➜ {step.resultLine}
                  </span>
                </div>

                {/* Líneas de cálculo con sustitución */}
                <div className="space-y-1 pl-1 font-mono text-[11px] text-ink">
                  {step.substitutionLines.map((line, lIdx) => (
                    <div key={lIdx} className="leading-relaxed bg-surface/80 px-2 py-1 rounded-lg border border-border/40">
                      {line}
                    </div>
                  ))}
                </div>

                {/* Resultado destacado */}
                <div className="flex justify-end pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {step.resultLine}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. RESUMEN DE COORDENADAS RESULTANTES */}
        <div className="p-3 rounded-2xl bg-panel border border-border space-y-2">
          <span className="font-bold text-[11px] uppercase tracking-wider text-ink-faint">
            3. Conjunto Solución Imagen F'
          </span>
          <div className="grid grid-cols-2 gap-2">
            {transformedVertices.map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border font-mono text-xs"
              >
                <span className="font-bold text-accent">{v.label || `P${i + 1}'`}:</span>
                <span className="font-semibold text-ink">({v.x}, {v.y})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. PROPIEDADES GEOMÉTRICAS E INVARIANTES */}
        <div className="p-3 rounded-2xl bg-panel border border-border space-y-2">
          <button
            onClick={() => setExpandedProperties(!expandedProperties)}
            className="flex items-center justify-between w-full text-left font-bold text-[11px] uppercase tracking-wider text-ink-faint hover:text-ink"
          >
            <span>4. Propiedades e Invariantes</span>
            {expandedProperties ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {expandedProperties && (
            <div className="space-y-2 pt-1">
              <div className="p-2 rounded-xl bg-surface border border-border text-[11px] text-ink font-medium">
                {geometricProperties.isometryType}
              </div>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-ink-soft">
                {geometricProperties.invariants.map((inv, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {inv}
                  </li>
                ))}
              </ul>
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Nota:</strong> {geometricProperties.pedagogicalNotes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
