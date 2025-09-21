
import React from 'react';
import { View } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon';
import { Button } from '../common/Button';

interface HeaderProps {
    activeView: View;
    setActiveView: (view: View) => void;
    onCommandPaletteOpen: () => void;
    showInstallPrompt: boolean;
    onInstallClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ setActiveView, onCommandPaletteOpen, showInstallPrompt, onInstallClick }) => {
    const { t } = useTranslations();
    
    return (
        <header className="glass-pane sticky top-0 z-30 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <CannabisLeafIcon className="w-8 h-8" />
                        <h1 className="text-xl font-bold font-display text-slate-100 hidden sm:block">
                            CannaGuide 2025
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {showInstallPrompt && (
                            <Button onClick={onInstallClick} size="sm" className="hidden sm:flex items-center gap-1.5">
                                <PhosphorIcons.DownloadSimple className="w-4 h-4"/>
                                {t('common.installPwa')}
                            </Button>
                        )}
                         <button onClick={onCommandPaletteOpen} aria-label={t('commandPalette.open')} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300 flex items-center gap-2 border border-slate-700">
                             <PhosphorIcons.CommandLine className="w-5 h-5" />
                             <span className="text-xs font-mono hidden md:inline"><kbd>⌘</kbd> <kbd>K</kbd></span>
                        </button>
                        <button onClick={() => setActiveView(View.Settings)} aria-label={t('nav.settings')} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300">
                            <PhosphorIcons.Gear className="w-6 h-6" />
                        </button>
                         <button onClick={() => setActiveView(View.Help)} aria-label={t('nav.help')} className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300">
                            <PhosphorIcons.Question className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};
