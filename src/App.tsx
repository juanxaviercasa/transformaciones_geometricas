import React, { useState, useEffect } from 'react';
import { Workspace } from './components/Workspace';
import { Plus, X, Monitor, Settings } from 'lucide-react';
import { SettingsModal } from './components/SettingsModal';
import { AppSettings } from './types/geometry';

export default function App() {
  const [tabs, setTabs] = useState<{ id: string; title: string }[]>([
    { id: '1', title: 'Pizarra 1' }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [tabCounter, setTabCounter] = useState<number>(2);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('geotransform_settings');
    if (saved) return JSON.parse(saved);
    return {
      pointSize: 'medium',
      lineThickness: 'normal',
      defaultColor: '#1e293b', // ink color
      snapToGrid: true,
      showLabels: true,
      isDarkMode: false,
      uiFontSize: 'normal'
    };
  });

  useEffect(() => {
    localStorage.setItem('geotransform_settings', JSON.stringify(settings));
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Ajustar tamaño de fuente UI (rem base)
    const htmlEl = document.documentElement;
    if (settings.uiFontSize === 'large') {
      htmlEl.style.fontSize = '17.5px'; // ~10% más grande
    } else if (settings.uiFontSize === 'extra-large') {
      htmlEl.style.fontSize = '19px'; // ~20% más grande
    } else {
      htmlEl.style.fontSize = '16px'; // normal
    }
  }, [settings]);

  const handleAddTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, title: `Pizarra ${tabCounter}` }]);
    setActiveTabId(newId);
    setTabCounter(tabCounter + 1);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Prevent closing last tab
    
    const newTabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    setTabs(newTabs);
  };

  const handleDoubleClickTab = (id: string, currentTitle: string) => {
    setEditingTabId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveTabTitle = (id: string) => {
    if (editingTitle.trim()) {
      setTabs(tabs.map(t => t.id === id ? { ...t, title: editingTitle.trim() } : t));
    }
    setEditingTabId(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-surface text-ink overflow-hidden">
      {/* Chrome-like Tab Bar: Fila única compacta tanto en móvil como en escritorio */}
      <div className="relative z-50 flex items-center justify-between gap-2 border-b border-border bg-panel px-2 h-8 sm:h-9 shadow-xs">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 h-full">
          <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar h-full pt-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group relative flex h-7 min-w-[90px] max-w-[150px] items-center gap-1.5 rounded-t-xl border border-b-0 px-2 transition-colors sm:h-8 sm:min-w-[120px] sm:max-w-[180px] sm:px-2.5 ${
                  activeTabId === tab.id
                    ? 'z-10 border-border bg-surface font-bold text-accent'
                    : 'z-0 border-transparent bg-panel text-ink-soft hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0">
                  <polygon points="6,30 18,8 24,26" fill={activeTabId === tab.id ? '#3b82f6' : '#94a3b8'} fillOpacity="0.9" />
                  <polygon points="16,34 32,12 36,28" fill={activeTabId === tab.id ? '#a855f7' : '#cbd5e1'} fillOpacity="0.8" />
                  <circle cx="18" cy="8" r="2.5" fill="#60a5fa" />
                  <circle cx="32" cy="12" r="2.5" fill="#c084fc" />
                </svg>

                {editingTabId === tab.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveTabTitle(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTabTitle(tab.id);
                      if (e.key === 'Escape') setEditingTabId(null);
                    }}
                    className="w-20 min-w-0 flex-1 rounded border border-accent bg-surface px-1 text-xs font-normal outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleDoubleClickTab(tab.id, tab.title)}
                    className="flex-1 truncate text-xs select-none"
                  >
                    {tab.title}
                  </span>
                )}

                {tabs.length > 1 && !editingTabId && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="rounded-md p-1 opacity-0 transition hover:bg-rose-100 hover:text-rose-600 group-hover:opacity-100"
                    title="Cerrar pizarra"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {activeTabId === tab.id && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-surface" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleAddTab}
            className="shrink-0 rounded-lg border border-transparent p-1 text-ink-soft transition hover:border-border hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
            title="Nueva pizarra"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0">
          <div className="hidden text-[10px] font-mono tracking-wide text-ink-faint lg:block">
            Desarrollado por <a href="https://juan.cabellosalirrosas.com" target="_blank" rel="noreferrer" className="underline decoration-accent/30 underline-offset-2 transition-colors hover:text-accent">Xavier Cabello</a>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes y Personalización"
            className="rounded-lg p-1 text-ink-soft transition hover:bg-black/5 hover:text-ink dark:hover:bg-white/5"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Render all workspaces but only show active */}
      <div className="flex-1 min-h-0 relative overflow-hidden bg-paper z-0">
        {tabs.map((tab) => (
          <Workspace 
            key={tab.id} 
            tabId={tab.id} 
            isActive={activeTabId === tab.id}
            settings={settings}
            setSettings={setSettings}
          />
        ))}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
}
