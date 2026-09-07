import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Search,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Check,
  X
} from 'lucide-react';
import { Point, TransformationType, ProblemScenario } from '../types/geometry';
import { analyzeInverseTransformation } from '../utils/GeometryProblemEngine';

interface InverseProblemPanelProps {
  preimage: Point[];
  image: Point[];
  currentScenario: ProblemScenario | null;
  onApplyDetectedTransformation?: (type: TransformationType) => void;
}

export const InverseProblemPanel: React.FC<InverseProblemPanelProps> = ({
  preimage,
  image,
  currentScenario,
  onApplyDetectedTransformation
}) => {
  const [selectedHypothesis, setSelectedHypothesis] = useState<TransformationType>('translation');
  const [userAnswerDetails, setUserAnswerDetails] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'correct' | 'incorrect' | 'idle';
    message: string;
    details: string;
  }>({ status: 'idle', message: '', details: '' });
  const [showHint, setShowHint] = useState(false);

  // Análisis algorítmico real
  const analysis = analyzeInverseTransformation(preimage, image);

  const handleVerify = () => {
    const isTypeCorrect =
      analysis.detectedType === selectedHypothesis ||
      (selectedHypothesis === 'reflection' && analysis.detectedType === 'reflection');

    if (isTypeCorrect) {
      setVerificationResult({
        status: 'correct',
        message: '¡Excelente deducción geométrica!',
        details: `${analysis.details} Has justificado correctamente la correspondencia entre ambas figuras.`
      });
    } else {
      setVerificationResult({
        status: 'incorrect',
        message: 'No coincide exactamente con esta transformación.',
        details: `Pista: Observa si las longitudes se conservan o si la orientación de los vértices (horario/antihorario) se ha invertido.`
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface text-ink text-xs font-sans p-4 space-y-4 overflow-y-auto">
      {/* ENCABEZADO DE MODO INVERSO */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
          <Search className="h-4 w-4 text-emerald-600" />
          <span>Laboratorio de Deducción e Investigación</span>
        </div>
        <p className="text-[11px] text-emerald-700 leading-relaxed">
          En este modo, se te presentan dos figuras en el plano: la figura original <strong className="text-emerald-900">F (verde)</strong> y la figura imagen <strong className="text-indigo-900">F' (azul)</strong>. Tu objetivo es deducir la ley geométrica que las conecta.
        </p>
      </div>

      {/* ENUNCIADO O CONTEXTO */}
      {currentScenario?.statement && (
        <div className="p-3 rounded-xl bg-panel border border-border space-y-1">
          <span className="font-bold text-[10px] uppercase tracking-wider text-ink-faint">
            Reto Planteado:
          </span>
          <p className="text-xs text-ink font-medium leading-relaxed">
            {currentScenario.statement}
          </p>
        </div>
      )}

      {/* FORMULARIO DE HIPÓTESIS DEL ESTUDIANTE */}
      <div className="space-y-3">
        <label className="font-bold text-[11px] uppercase tracking-wider text-ink-faint">
          1. ¿Qué transformación crees que se aplicó?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'translation', label: 'Traslación' },
              { id: 'reflection', label: 'Simetría Axial' },
              { id: 'central_reflection', label: 'Simetría Central' },
              { id: 'rotation', label: 'Rotación' },
              { id: 'homothety', label: 'Homotecia' }
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                setSelectedHypothesis(id);
                setVerificationResult({ status: 'idle', message: '', details: '' });
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-left ${
                selectedHypothesis === id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-panel text-ink border-border hover:border-border-strong'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* EXPLICACIÓN O PARÁMETRO CALCULADO POR EL ALUMNO */}
      <div className="space-y-2">
        <label className="font-bold text-[11px] uppercase tracking-wider text-ink-faint">
          2. Justifica tus parámetros deducidos:
        </label>
        <textarea
          rows={3}
          value={userAnswerDetails}
          onChange={(e) => setUserAnswerDetails(e.target.value)}
          placeholder="Ej: El vector es (6, 2) porque A' - A = (2 - (-4), 3 - 1)..."
          className="w-full rounded-xl border border-border bg-panel p-2.5 font-mono text-xs text-ink focus:outline-none focus:border-emerald-600"
        />
      </div>

      {/* BOTÓN DE VERIFICACIÓN */}
      <div className="space-y-2">
        <button
          onClick={handleVerify}
          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" /> Comprobar mi Deducción
        </button>

        {currentScenario?.inverseOptions?.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="w-full py-1.5 text-[11px] font-semibold text-ink-soft hover:text-emerald-700 flex items-center justify-center gap-1.5 transition"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            {showHint ? 'Ocultar Pista' : 'Necesito una pista analítica'}
          </button>
        )}

        {showHint && currentScenario?.inverseOptions?.hint && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed animate-in fade-in duration-150">
            <strong>Pista del Profesor:</strong> {currentScenario.inverseOptions.hint}
          </div>
        )}
      </div>

      {/* FEEDBACK Y RETROALIMENTACIÓN FORMATIVA */}
      {verificationResult.status !== 'idle' && (
        <div
          className={`p-3.5 rounded-2xl border space-y-2 animate-in fade-in zoom-in-95 duration-150 ${
            verificationResult.status === 'correct'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-xs">
            {verificationResult.status === 'correct' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{verificationResult.message}</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {verificationResult.details}
          </p>
          {verificationResult.status === 'correct' && currentScenario?.inverseOptions?.explanation && (
            <div className="pt-2 border-t border-emerald-200/80 text-[11px] font-mono">
              <strong>Solución Curricular:</strong> {currentScenario.inverseOptions.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
