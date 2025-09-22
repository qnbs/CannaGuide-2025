import React from 'react';
import { View } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon';
import { Button } from '../common/Button';
import { useAppStore } from '@/stores/useAppStore';

interface HeaderProps {
    onCommandPaletteOpen: () => void;
    deferredPrompt: any;
    isInstalled: boolean;
    onInstallClick: () => void;
}

// FIX: Component no longer receives activeView/setActiveView as props, uses store instead.
export const Header: React.FC<HeaderProps> = ({ onCommandPaletteOpen, deferredPrompt, isInstalled, onInstallClick }) => {
    const { t } = useTranslations();
    const { activeView, setActiveView } = useAppStore(state => ({
        activeView: state.activeView,
        setActiveView: state.setActiveView,
    }));

    const viewTitles: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    };

    const currentTitle = viewTitles[activeView];
    const showInstallButton = !!deferredPrompt || isInstalled;
    
    return (
        <header className="glass-pane sticky top-0 z-30 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <button onClick={() => setActiveView(View.Plants)} className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md p-1 -m-1">
                        <CannabisLeafIcon className="w-8 h-8 flex-shrink-0" />
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-xl font-bold font-display text-slate-100 hidden sm:block">
                                CannaGuide 2025
                            </h1>
                            <span className="text-slate-400 hidden sm:inline">/</span>
                            <h2 className="text-lg font-semibold text-slate-300">{currentTitle}</h2>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        {showInstallButton && (
                             <Button 
                                onClick={onInstallClick} 
                                size="sm" 
                                className="flex items-center gap-1.5"
                                disabled={isInstalled}
                                variant={isInstalled ? 'secondary' : 'primary'}
                                title={isInstalled ? t('common.installPwaSuccess') : t('common.installPwa')}
                            >
                                {isInstalled ? 
                                    <PhosphorIcons.CheckCircle weight="fill" className="w-4 h-4"/> : 
                                    <PhosphorIcons.DownloadSimple className="w-4 h-4"/>
                                }
                                <span className="hidden sm:inline">{isInstalled ? t('common.installed') : t('common.installPwa')}</span>
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