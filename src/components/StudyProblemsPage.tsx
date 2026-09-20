import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FlipHorizontal,
  Lightbulb,
  Lock,
  Maximize2,
  Move,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Target,
  Unlock,
  X,
  Compass,
  Check,
  Filter,
  Eye,
  GraduationCap
} from 'lucide-react';
import { Point, TransformationType, ProblemScenario, ProblemMode, ProblemDifficulty } from '../types/geometry';
import { CLASSROOM_PROBLEMS } from '../utils/GeometryProblemEngine';
import { InverseProblemPanel } from './InverseProblemPanel';
import { MathText } from './MathText';

interface StudyProblemsPageProps {
  isOpen: boolean;
  onClose: () => void;
  studyMode: 'ruta' | 'libre';
  onSetStudyMode: (mode: 'ruta' | 'libre') => void;
  selectedProblemDifficulty: ProblemDifficulty;
  onSetSelectedProblemDifficulty: (diff: ProblemDifficulty) => void;
  selectedProblemType: 'todos' | TransformationType;
  onSetSelectedProblemType: (type: 'todos' | TransformationType) => void;
  completedProblemIds: string[];
  onResetProgress: () => void;
  unlockedLevels: Record<ProblemDifficulty, boolean>;
  nextStudySuggestion: string;
  onGenerateRandomProblem: (difficulty?: ProblemDifficulty | 'todos') => void;
  onOpenScenario: (problem: ProblemScenario) => void;
  onLoadScenarioToBoard: (problem: ProblemScenario) => void;
  selectedProblemTab: 'selector' | 'ejercicio';
  onSetSelectedProblemTab: (tab: 'selector' | 'ejercicio') => void;
  currentScenario: ProblemScenario | null;
  onMarkCurrentProblemAsCompleted: () => void;
  problemMode: ProblemMode;
  preimage: Point[];
  image: Point[];
}

const TRANSFORMATION_META: Record<TransformationType, { label: string; icon: React.ComponentType<{ className?: string }>; colorClasses: string }> = {
  translation: {
    label: 'Traslación',
    icon: Move,
    colorClasses: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/50 dark:border-sky-800'
  },
  reflection: {
    label: 'Simetría Axial',
    icon: FlipHorizontal,
    colorClasses: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/50 dark:border-rose-800'
  },
  rotation: {
    label: 'Rotación',
    icon: RotateCw,
    colorClasses: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/50 dark:border-amber-800'
  },
  central_reflection: {
    label: 'Simetría Central',
    icon: Target,
    colorClasses: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300/50 dark:border-teal-800'
  },
  homothety: {
    label: 'Homotecia',
    icon: Maximize2,
    colorClasses: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300/50 dark:border-purple-800'
  }
};

export const StudyProblemsPage: React.FC<StudyProblemsPageProps> = ({
  isOpen,
  onClose,
  studyMode,
  onSetStudyMode,
  selectedProblemDifficulty,
  onSetSelectedProblemDifficulty,
  selectedProblemType,
  onSetSelectedProblemType,
  completedProblemIds,
  onResetProgress,
  unlockedLevels,
  nextStudySuggestion,
  onGenerateRandomProblem,
  onOpenScenario,
  onLoadScenarioToBoard,
  selectedProblemTab,
  onSetSelectedProblemTab,
  currentScenario,
  onMarkCurrentProblemAsCompleted,
  problemMode,
  preimage,
  image
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'todos' | ProblemDifficulty>('todos');

  // Cerrar con teclado Esc y bloquear scroll de fondo
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Lista de problemas filtrada
  const filteredProblems = useMemo(() => {
    return CLASSROOM_PROBLEMS.filter((problem) => {
      const matchesType =
        selectedProblemType === 'todos' || problem.targetConfig.type === selectedProblemType;
      const activeDiff = studyMode === 'ruta' ? selectedProblemDifficulty : filterDifficulty;
      const matchesDiff = activeDiff === 'todos' || problem.difficulty === activeDiff;
      const matchesSearch =
        !searchQuery.trim() ||
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.category.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesDiff && matchesSearch;
    });
  }, [selectedProblemType, studyMode, selectedProblemDifficulty, filterDifficulty, searchQuery]);

  const totalCompleted = completedProblemIds.length;
  const totalProblems = CLASSROOM_PROBLEMS.length;
  const progressPercent = Math.round((totalCompleted / Math.max(totalProblems, 1)) * 100);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden animate-in fade-in duration-150">
      {/* ── TOP APP BAR ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
            title="Regresar a la pizarra de trabajo"
          >
            <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Volver a la Pizarra</span>
            <span className="sm:hidden">Pizarra</span>
          </button>

          {selectedProblemTab === 'ejercicio' && (
            <button
              onClick={() => onSetSelectedProblemTab('selector')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              <span>Lista de Retos</span>
            </button>
          )}
        </div>

        {/* Título Central */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white leading-tight">
              Ruta de Estudio y Banco de Problemas
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Desafíos Curriculares · {totalCompleted}/{totalProblems} resueltos ({progressPercent}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onGenerateRandomProblem(studyMode === 'ruta' ? selectedProblemDifficulty : 'todos')}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Genera un problema aleatorio en el nivel actual"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Reto Aleatorio</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Cerrar ventana (Esc)"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL SCROLLEABLE ──────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {selectedProblemTab === 'selector' ? (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-7">
            
            {/* 1. HERO DASHBOARD: PROGRESO Y SUGERENCIA PEDAGÓGICA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
              {/* Tarjeta Izquierda: Modo y Progreso */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => onSetStudyMode('ruta')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          studyMode === 'ruta'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Ruta Guiada
                      </button>
                      <button
                        onClick={() => onSetStudyMode('libre')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          studyMode === 'libre'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Repaso Libre
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Total Resuelto:
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {totalCompleted}/{totalProblems} ({progressPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progreso Visual */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 mb-4">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(5, progressPercent)}%` }}
                    />
                  </div>

                  {/* Niveles de la Ruta */}
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {(['básico', 'intermedio', 'avanzado'] as const).map((level) => {
                      const isUnlocked = unlockedLevels[level];
                      const isCurrent = studyMode === 'ruta' && selectedProblemDifficulty === level;
                      return (
                        <button
                          key={level}
                          disabled={!isUnlocked && studyMode === 'ruta'}
                          onClick={() => {
                            if (isUnlocked || studyMode === 'libre') {
                              onSetSelectedProblemDifficulty(level);
                              setFilterDifficulty(level);
                            }
                          }}
                          className={`flex flex-col items-start p-3 sm:p-3.5 rounded-2xl border text-left transition-all ${
                            isCurrent
                              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                              : isUnlocked
                              ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer'
                              : 'border-slate-200/60 dark:border-slate-800/60 bg-slate-100/40 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              {level}
                            </span>
                            {isUnlocked ? (
                              <Unlock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {isUnlocked ? 'Disponible' : 'Bloqueado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {studyMode === 'ruta'
                      ? 'Desbloquea niveles completando retos de dificultad previa.'
                      : 'Modo libre: explora cualquier nivel y transformación sin restricciones.'}
                  </span>
                  {totalCompleted > 0 && (
                    <button
                      onClick={onResetProgress}
                      className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition cursor-pointer"
                      title="Reiniciar progreso"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reiniciar avance</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tarjeta Derecha: Sugerencia del Tutor y Reto Rápido */}
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="p-1.5 bg-white/15 rounded-xl backdrop-blur-xs">
                      <Lightbulb className="h-4 w-4 text-amber-300" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                      Sugerencia Pedagógica
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-emerald-50 mb-3">
                    <MathText text={nextStudySuggestion} />
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onGenerateRandomProblem(studyMode === 'ruta' ? selectedProblemDifficulty : 'todos')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-emerald-800 font-black text-xs sm:text-sm hover:bg-emerald-50 active:scale-98 transition shadow-xs cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Generar Reto Aleatorio ({studyMode === 'ruta' ? selectedProblemDifficulty : 'mixto'})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. BARRA DE FILTROS Y BÚSQUEDA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
                
                {/* Filtros por Dificultad (solo en Repaso Libre) */}
                {studyMode === 'libre' && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="h-3.5 w-3.5" /> Dificultad:
                    </span>
                    {(['todos', 'básico', 'intermedio', 'avanzado'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setFilterDifficulty(diff)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                          filterDifficulty === diff
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                )}

                {/* Filtros por Dificultad en Ruta Guiada */}
                {studyMode === 'ruta' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Nivel Activo:
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedProblemDifficulty}
                    </span>
                  </div>
                )}

                {/* Buscador de Problemas */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por enunciado, figura o coordenadas..."
                    className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por Tipo de Transformación */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1.5">
                  Tipo:
                </span>
                <button
                  onClick={() => onSetSelectedProblemType('todos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedProblemType === 'todos'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todas las Transformaciones
                </button>
                {(['translation', 'reflection', 'rotation', 'central_reflection', 'homothety'] as const).map(
                  (type) => {
                    const meta = TRANSFORMATION_META[type];
                    const Icon = meta.icon;
                    const isSelected = selectedProblemType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => onSetSelectedProblemType(type)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{meta.label}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* 3. GRID RESPONSIVO DE RETOS CON ESPACIADO CUIDADOSO */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Retos Disponibles
                  </h2>
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredProblems.length}
                  </span>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>

              {filteredProblems.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No se encontraron problemas con estos filtros
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Prueba cambiando el tipo de transformación o generando un nuevo reto aleatorio para tu nivel.
                  </p>
                  <button
                    onClick={() => {
                      onSetSelectedProblemType('todos');
                      setSearchQuery('');
                      setFilterDifficulty('todos');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                /* GRID CON GAP AMPLIO Y CONFORTABLE (28px - 32px) */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 items-stretch">
                  {filteredProblems.map((prob) => {
                    const isCompleted = completedProblemIds.includes(prob.id);
                    const meta = TRANSFORMATION_META[prob.targetConfig.type] || {
                      label: prob.category,
                      icon: Compass,
                      colorClasses: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40'
                    };
                    const Icon = meta.icon;

                    return (
                      <div
                        key={prob.id}
                        className={`group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 p-6 sm:p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                          isCompleted
                            ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 ring-1 ring-emerald-500/20'
                            : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/60'
                        }`}
                      >
                        <div>
                          {/* Encabezado de la Tarjeta */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${meta.colorClasses}`}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span>{meta.label}</span>
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {prob.difficulty || 'reto'}
                              </span>
                            </div>

                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" /> Resuelto
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400">
                                Pendiente
                              </span>
                            )}
                          </div>

                          {/* Título con KaTeX */}
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug tracking-tight">
                            <MathText text={prob.title} />
                          </h3>

                          {/* Enunciado con KaTeX */}
                          <div className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed min-h-[4rem]">
                            <MathText text={prob.statement} />
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                          <button
                            onClick={() => onLoadScenarioToBoard(prob)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                            title="Carga la figura en el lienzo y cierra la ventana para interactuar"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Resolver en Pizarra</span>
                          </button>
                          <button
                            onClick={() => onOpenScenario(prob)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                            title="Ver detalles, pistas y deducción"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver Reto</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ── VISTA DE EJERCICIO INDIVIDUAL (TAB 'ejercicio') ──────────── */
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-7">
            
            {/* Spotlight Card del Problema */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {currentScenario?.difficulty || 'Nivel General'}
                  </span>
                  <span className="px-3.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {currentScenario?.category || 'Geometría'}
                  </span>
                </div>

                {currentScenario && completedProblemIds.includes(currentScenario.id) ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4" /> Ejercicio Resuelto
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Reto en progreso
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  <MathText text={currentScenario?.title || 'Ejercicio Geométrico'} />
                </h2>
                <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <p className="text-sm sm:text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    <MathText text={currentScenario?.statement || ''} />
                  </p>
                </div>
              </div>

              {/* Barra de Acciones del Ejercicio */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {currentScenario && (
                  <button
                    onClick={() => onLoadScenarioToBoard(currentScenario)}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>Resolver en la Pizarra</span>
                  </button>
                )}

                <button
                  onClick={onMarkCurrentProblemAsCompleted}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Marcar como Resuelto</span>
                </button>

                <button
                  onClick={() => onGenerateRandomProblem(studyMode === 'ruta' ? selectedProblemDifficulty : 'todos')}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Otro Reto Similar</span>
                </button>

                <button
                  onClick={() => onSetSelectedProblemTab('selector')}
                  className="ml-auto flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  <span>Volver a la Lista</span>
                </button>
              </div>
            </div>

            {/* Panel de Deducción e Hipótesis */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
              <InverseProblemPanel
                preimage={preimage}
                image={image}
                currentScenario={currentScenario}
              />
            </div>

          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
