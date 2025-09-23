import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Command } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const { t } = useTranslations();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const modalRef = useFocusTrap(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLUListElement>(null);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerCaseQuery = query.toLowerCase();
    return commands.filter(
      (command) =>
        command.title.toLowerCase().includes(lowerCaseQuery) ||
        command.subtitle?.toLowerCase().includes(lowerCaseQuery) ||
        command.keywords?.toLowerCase().includes(lowerCaseQuery)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      // Delay focus to allow for transitions and ref attachment
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);
  
   useEffect(() => {
    const activeItem = resultsRef.current?.children[activeIndex] as HTMLLIElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[activeIndex]) {
        filteredCommands[activeIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };
  
  const handleCommandClick = (command: Command) => {
    command.action();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-slate-800 rounded-lg shadow-2xl border border-slate-700 modal-content-animate"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('commandPalette.placeholder')}
            className="w-full bg-transparent p-4 text-lg text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
        <hr className="border-slate-700" />
        {filteredCommands.length > 0 ? (
          <ul ref={resultsRef} className="max-h-[50vh] overflow-y-auto p-2">
            {filteredCommands.map((command, index) => (
              <li
                key={command.id}
                onClick={() => handleCommandClick(command)}
                onMouseMove={() => setActiveIndex(index)}
                className={`flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer ${
                  activeIndex === index ? 'bg-primary-500/20 text-primary-300' : 'text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex-shrink-0">{command.icon}</div>
                  <div>
                    <p className="font-semibold">{command.title}</p>
                    {command.subtitle && <p className="text-xs text-slate-400">{command.subtitle}</p>}
                  </div>
                </div>
                {command.shortcut && (
                  <div className="flex gap-1">
                    {command.shortcut.map(key => <kbd key={key} className="text-xs bg-slate-700 px-1.5 py-0.5 rounded">{key}</kbd>)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-slate-400">{t('commandPalette.noResults')}</div>
        )}
      </div>
    </div>,
    document.body
  );
};
