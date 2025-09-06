import React, { useState } from 'react';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Card } from '../common/Card';
import { SetupConfigurator } from './equipment/SetupConfigurator';
import { Calculators } from './equipment/Calculators';
import { useTranslations } from '../../hooks/useTranslations';
import { useSetupManager } from '../../hooks/useSetupManager';
import { SavedSetupsView } from './equipment/SavedSetupsView';
import { geminiService } from '../../services/geminiService';
import { Recommendation } from '../../types';


type ActiveTab = 'configurator' | 'calculators' | 'gear' | 'setups';

type Step = 1 | 2 | 3 | 4;
type Area = '60x60' | '80x80' | '100x100' | '120x120';
type Budget = 'low' | 'medium' | 'high';
type GrowStyle = 'beginner' | 'yield' | 'stealth';

const GearAndShops: React.FC = () => {
    const { t } = useTranslations();
    
    const shops = [
        { name: "Zamnesia", url: "https://www.zamnesia.com", description: t('equipmentView.gearAndShops.shops.zamnesia') },
        { name: "Royal Queen Seeds", url: "https://www.royalqueenseeds.com", description: t('equipmentView.gearAndShops.shops.rqs') },
        { name: "Growmart", url: "https://www.growmart.de", description: t('equipmentView.gearAndShops.shops.growmart') },
    ];
    
    const gear = [
        { name: t('equipmentView.gearAndShops.gearItems.tent.name'), description: t('equipmentView.gearAndShops.gearItems.tent.desc'), icon: <PhosphorIcons.Cube /> },
        { name: t('equipmentView.gearAndShops.gearItems.led.name'), description: t('equipmentView.gearAndShops.gearItems.led.desc'), icon: <PhosphorIcons.Lightbulb /> },
        { name: t('equipmentView.gearAndShops.gearItems.ventilation.name'), description: t('equipmentView.gearAndShops.gearItems.ventilation.desc'), icon: <PhosphorIcons.Fan /> },
        { name: t('equipmentView.gearAndShops.gearItems.circulation.name'), description: t('equipmentView.gearAndShops.gearItems.circulation.desc'), icon: <PhosphorIcons.ArrowClockwise /> },
        { name: t('equipmentView.gearAndShops.gearItems.pots.name'), description: t('equipmentView.gearAndShops.gearItems.pots.desc'), icon: <PhosphorIcons.Plant /> },
        { name: t('equipmentView.gearAndShops.gearItems.timers.name'), description: t('equipmentView.gearAndShops.gearItems.timers.desc'), icon: <PhosphorIcons.Gear /> },
        { name: t('equipmentView.gearAndShops.gearItems.meters.name'), description: t('equipmentView.gearAndShops.gearItems.meters.desc'), icon: <PhosphorIcons.Flask /> },
        { name: t('equipmentView.gearAndShops.gearItems.harvest.name'), description: t('equipmentView.gearAndShops.gearItems.harvest.desc'), icon: <PhosphorIcons.Scissors /> },
    ];

    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-primary-500 dark:text-primary-300 flex items-center gap-2">
                    <PhosphorIcons.Storefront className="w-7 h-7" />
                    {t('equipmentView.gearAndShops.shopsTitle')}
                </h2>
                <div className="space-y-4">
                    {shops.map((shop) => (
                        <Card key={shop.name}>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{shop.name}</h3>
                            <a href={shop.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">{shop.url.replace('https://www.','')}</a>
                            <p className="text-slate-600 dark:text-slate-300 mt-2">{shop.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-primary-500 dark:text-primary-300 flex items-center gap-2">
                     <PhosphorIcons.Wrench className="w-7 h-7" />
                     {t('equipmentView.gearAndShops.gearTitle')}
                </h2>
                <div className="space-y-4">
                    {gear.map((item) => (
                        <Card key={item.name} className="flex items-start gap-4">
                            <div className="text-primary-500 dark:text-primary-400 mt-1 w-8 h-8 flex-shrink-0">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{item.name}</h3>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{item.description}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

export const EquipmentView: React.FC = () => {
    const { t, locale } = useTranslations();
    const [activeTab, setActiveTab] = useState<ActiveTab>('configurator');
    const { savedSetups, addSetup, updateSetup, deleteSetup } = useSetupManager();
    
    // State lifted from SetupConfigurator for persistence
    const [step, setStep] = useState<Step>(1);
    const [area, setArea] = useState<Area>('80x80');
    const [budget, setBudget] = useState<Budget>('medium');
    const [growStyle, setGrowStyle] = useState<GrowStyle>('beginner');
    const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendation(null);
        setStep(4);
        
        try {
            const result = await geminiService.getSetupRecommendation(area, t(`equipmentView.configurator.styles.${growStyle}`), t(`equipmentView.configurator.budgets.${budget}`), locale);
            if (result) {
                setRecommendation(result as Recommendation);
            } else {
                setError(t('equipmentView.configurator.error'));
            }
        } catch (e) {
            console.error(e);
            setError(t('equipmentView.configurator.errorNetwork'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const startOver = () => {
        setStep(1);
        setRecommendation(null);
        setError(null);
        setArea('80x80');
        setBudget('medium');
        setGrowStyle('beginner');
    };

    const tabs: {id: ActiveTab, label: string, icon: React.ReactNode}[] = [
        { id: 'configurator', label: t('equipmentView.tabs.configurator'), icon: <PhosphorIcons.Wrench /> },
        { id: 'setups', label: t('equipmentView.tabs.setups'), icon: <PhosphorIcons.Archive /> },
        { id: 'calculators', label: t('equipmentView.tabs.calculators'), icon: <PhosphorIcons.Calculator /> },
        { id: 'gear', label: t('equipmentView.tabs.gear'), icon: <PhosphorIcons.Storefront /> },
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'configurator':
                return <SetupConfigurator
                    onSaveSetup={addSetup}
                    step={step}
                    setStep={setStep}
                    area={area}
                    setArea={setArea}
                    budget={budget}
                    setBudget={setBudget}
                    growStyle={growStyle}
                    setGrowStyle={setGrowStyle}
                    recommendation={recommendation}
                    isLoading={isLoading}
                    error={error}
                    handleGenerate={handleGenerate}
                    startOver={startOver}
                />;
            case 'setups':
                return <SavedSetupsView savedSetups={savedSetups} updateSetup={updateSetup} deleteSetup={deleteSetup} />;
            case 'calculators':
                return <Calculators />;
            case 'gear':
                return <GearAndShops />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 flex items-center gap-2 px-1 pb-4 text-sm md:text-base font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <div className="w-5 h-5">{tab.icon}</div> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>
                {renderTabContent()}
            </div>
        </div>
    );
};