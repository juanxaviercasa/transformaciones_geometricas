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
      {/* Chrome-like Tab Bar */}
      <div className="flex items-center justify-between px-2 pt-2 pb-0 bg-panel border-b border-border shadow-sm z-50 relative">
        <div className="flex items-center flex-1 overflow-hidden">
          <div className="flex items-end gap-1 overflow-x-auto overflow-y-hidden no-scrollbar">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3 h-10 min-w-[140px] max-w-[200px] border border-b-0 rounded-t-xl cursor-pointer transition-colors relative ${
                  activeTabId === tab.id
                    ? 'bg-surface border-border text-accent font-bold z-10'
                    : 'bg-panel border-transparent text-ink-soft hover:bg-black/5 dark:hover:bg-white/5 z-0'
                }`}
              >
                <Monitor className={`h-4 w-4 shrink-0 ${activeTabId === tab.id ? 'text-accent' : 'text-ink-faint'}`} />
                
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
                    className="text-xs bg-surface border border-accent rounded px-1 flex-1 min-w-0 outline-none w-20 font-normal"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    onDoubleClick={() => handleDoubleClickTab(tab.id, tab.title)}
                    className="text-xs truncate flex-1 select-none"
                  >
                    {tab.title}
                  </span>
                )}
                
                {tabs.length > 1 && !editingTabId && (
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600 transition"
                    title="Cerrar pizarra"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {/* Active Tab Overlay to hide border-b */}
                {activeTabId === tab.id && (
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-surface" />
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleAddTab}
            className="ml-2 mb-1 p-1.5 shrink-0 rounded-lg text-ink-soft hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink transition border border-transparent hover:border-border"
            title="Nueva pizarra"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Global Controls & Footer */}
        <div className="flex items-center gap-4 pl-4 shrink-0 pb-1">
          <div className="text-[10px] text-ink-faint font-mono tracking-wide hidden md:block">
            Desarrollado por <a href="https://juan.cabellosalirrosas.com" target="_blank" rel="noreferrer" className="hover:text-accent underline decoration-accent/30 underline-offset-2 transition-colors">Xavier Cabello</a>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes y Personalización"
            className="p-1.5 rounded-lg text-ink-soft hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink transition"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Render all workspaces but only show active */}
      <div className="flex-1 relative bg-paper z-0">
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
