import React, { useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Command } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { groupAndSortCommands } from '@/services/commandService';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const { t } = useTranslations();
  const modalRef = useFocusTrap(isOpen);

  const groupedCommands = useMemo(() => groupAndSortCommands(commands), [commands]);

  const handleCommandClick = (command: Command) => {
    if (!command.isHeader) {
      command.action();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('commandPalette.title')}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-slate-800/90 backdrop-blur-lg rounded-lg shadow-2xl border border-slate-700 modal-content-animate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-700 p-4 text-slate-100 font-semibold">{t('commandPalette.title')}</div>
        {groupedCommands.length > 0 ? (
          <ul id="command-results-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {groupedCommands.map((command) => (
              command.isHeader ? (
                <li key={command.id} role="presentation" className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                    {command.title}
                </li>
              ) : (
                <li
                  key={command.id}
                  role="option"
                  onClick={() => handleCommandClick(command)}
                  className="flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer transition-colors duration-100 text-slate-300 hover:bg-slate-700/50 hover:text-primary-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 flex-shrink-0">{command.icon}</div>
                    <div className="truncate">
                      <p className="font-semibold truncate">{command.title}</p>
                    </div>
                  </div>
                  {command.shortcut && (
                    <div className="flex gap-1 flex-shrink-0">
                      {command.shortcut.map(key => <kbd key={key}>{key}</kbd>)}
                    </div>
                  )}
                </li>
              )
            ))}
          </ul>
        ) : (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-3">
            <PhosphorIcons.CommandLine className="w-8 h-8 text-slate-500"/>
            <p>{t('commandPalette.noResults')}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
