import React, { useState } from 'react';
import {
  BookOpen,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Maximize,
  Minimize,
  HelpCircle,
  Eye,
  ArrowRight,
  ListOrdered
} from 'lucide-react';
import { ProblemScenario, ProblemMode } from '../types/geometry';
import { CLASSROOM_PROBLEMS } from '../utils/GeometryProblemEngine';

interface ClassroomBannerProps {
  currentScenario: ProblemScenario | null;
  onSelectScenario: (scenario: ProblemScenario) => void;
  customStatement: string;
  onUpdateCustomStatement: (text: string) => void;
  problemMode: ProblemMode;
  onToggleProblemMode: (mode: ProblemMode) => void;
  cleanBoardMode: boolean;
  onToggleCleanBoardMode: () => void;
  currentStep: number;
  totalSteps: number;
  onNextStep: () => void;
  onResetStep: () => void;
}

export const ClassroomBanner: React.FC<ClassroomBannerProps> = ({
  currentScenario,
  onSelectScenario,
  customStatement,
  onUpdateCustomStatement,
  problemMode,
  onToggleProblemMode,
  cleanBoardMode,
  onToggleCleanBoardMode,
  currentStep,
  totalSteps,
  onNextStep,
  onResetStep
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(customStatement);
  const [showProblemPicker, setShowProblemPicker] = useState(false);

  const handleSaveText = () => {
    onUpdateCustomStatement(tempText);
    setIsEditing(false);
  };

  return (
    <header className="relative z-30 flex flex-col bg-surface border-b border-border shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between px-4 py-2.5 gap-3">
        {/* LADO IZQUIERDO: MODO DE PROBLEMA Y TITULO */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex rounded-xl bg-panel p-1 border border-border shrink-0">
            <button
              onClick={() => onToggleProblemMode('DIRECT')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                problemMode === 'DIRECT'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Problema Directo
            </button>
            <button
              onClick={() => onToggleProblemMode('INVERSE')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                problemMode === 'INVERSE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              Problema Inverso
            </button>
          </div>

          {/* BANCO DE PROBLEMAS BOTÓN */}
          <button
            onClick={() => setShowProblemPicker(!showProblemPicker)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-panel border border-border hover:border-accent hover:text-accent transition shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5 text-accent" />
            <span>Banco Escolar (Secundaria)</span>
          </button>

          {/* TARJETA DE CONSIGNA DOCENTE */}
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-panel/70 border border-border/80 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent shrink-0 hidden md:inline">
              Consigna:
            </span>
            {isEditing ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  className="flex-1 bg-surface border border-accent rounded-lg px-2 py-0.5 text-xs text-ink focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveText}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full min-w-0">
                <p className="text-xs font-medium text-ink truncate cursor-pointer" onClick={() => setIsEditing(true)}>
                  {customStatement || 'Haz clic para escribir o seleccionar el enunciado del problema...'}
                </p>
                <button
                  onClick={() => {
                    setTempText(customStatement);
                    setIsEditing(true);
                  }}
                  className="text-ink-soft hover:text-accent ml-1 shrink-0 p-0.5"
                  title="Editar enunciado"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* LADO DERECHO: HERRAMIENTAS DE PIZARRA EN VIVO (PASO A PASO) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PASO A PASO CONTROL */}
          <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-xl">
            <ListOrdered className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-bold text-accent font-mono">
              Paso {currentStep}/{totalSteps}
            </span>
            <button
              onClick={onResetStep}
              title="Reiniciar al Paso 0"
              className="p-1 text-ink-soft hover:text-ink transition"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
            <button
              onClick={onNextStep}
              disabled={currentStep >= totalSteps}
              className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-accent text-white rounded-lg hover:brightness-110 disabled:opacity-40 transition shadow-sm"
            >
              <span>{currentStep >= totalSteps ? 'Completado' : 'Siguiente'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* MODO PANTALLA COMPLETA / PIZARRA LIMPIA */}
          <button
            onClick={onToggleCleanBoardMode}
            title={cleanBoardMode ? 'Salir de Pizarra Limpia' : 'Modo Pizarra Limpia para Proyector'}
            className={`p-2 rounded-xl border transition ${
              cleanBoardMode
                ? 'bg-accent text-white border-accent'
                : 'bg-panel text-ink border-border hover:border-border-strong'
            }`}
          >
            {cleanBoardMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* MODAL DESPLEGABLE DE BANCO ESCOLAR */}
      {showProblemPicker && (
        <div className="absolute top-full left-4 mt-2 w-96 max-h-[70vh] overflow-y-auto bg-surface border border-border shadow-2xl rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-accent" /> Banco de Problemas Curriculares
            </span>
            <button
              onClick={() => setShowProblemPicker(false)}
              className="text-xs text-ink-soft hover:text-ink p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-2">
            {CLASSROOM_PROBLEMS.map((prob) => (
              <button
                key={prob.id}
                onClick={() => {
                  onSelectScenario(prob);
                  setShowProblemPicker(false);
                }}
                className="w-full text-left p-2.5 rounded-xl bg-panel hover:bg-accent/5 hover:border-accent border border-border transition group"
              >
                <div className="flex items-center justify-between text-xs font-bold text-ink group-hover:text-accent">
                  <span>{prob.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-accent font-semibold">
                    {prob.category}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-1 line-clamp-2 leading-relaxed">
                  {prob.statement}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
