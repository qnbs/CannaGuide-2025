import React, { useState } from 'react';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { Card } from '../common/Card';
import { geminiService } from '../../services/geminiService';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { SetupConfigurator } from './equipment/SetupConfigurator';
import { Calculators } from './equipment/Calculators';

type ActiveTab = 'configurator' | 'calculators' | 'gear';

interface Shop {
    name: string;
    url: string;
    description: string;
}

interface Gear {
    name:string;
    description: string;
}

const gearIcons: Record<string, React.ReactNode> = {
    "Growbox (Zelt)": <PhosphorIcons.Cube />,
    "LED-Beleuchtung": <PhosphorIcons.Lightbulb />,
    "Abluftsystem mit Aktivkohlefilter": <PhosphorIcons.Fan />,
    "Töpfe mit Untersetzern": <PhosphorIcons.Plant />,
    "PH-Messgerät und pH-Regulatoren": <PhosphorIcons.Flask />,
};


const GearAndShops: React.FC = () => {
    const [shops, setShops] = useState<Shop[]>([]);
    const [gear, setGear] = useState<Gear[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await geminiService.getEquipmentInfo();
            setShops(data.shops);
            setGear(data.gear);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div>
                    <SkeletonLoader className="h-8 w-1/2 mb-4" />
                    <div className="space-y-4">
                        <SkeletonLoader className="h-24 w-full" />
                        <SkeletonLoader className="h-24 w-full" />
                    </div>
                </div>
                 <div>
                    <SkeletonLoader className="h-8 w-1/2 mb-4" />
                    <div className="space-y-4">
                        <SkeletonLoader className="h-20 w-full" />
                        <SkeletonLoader className="h-20 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-primary-500 dark:text-primary-300 flex items-center gap-2">
                    <PhosphorIcons.Storefront className="w-7 h-7" />
                    Empfohlene Online-Shops (EU)
                </h2>
                <div className="space-y-4">
                    {shops.map((shop) => (
                        <Card key={shop.name}>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{shop.name}</h3>
                            <a href={`https://${shop.url}`} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline break-all">{shop.url}</a>
                            <p className="text-slate-600 dark:text-slate-300 mt-2">{shop.description}</p>
                        </Card>
                    ))}
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4 text-primary-500 dark:text-primary-300 flex items-center gap-2">
                     <PhosphorIcons.Wrench className="w-7 h-7" />
                    Essenzielle Ausrüstung
                </h2>
                <div className="space-y-4">
                    {gear.map((item) => (
                        <Card key={item.name} className="flex items-start gap-4">
                            <div className="text-primary-500 dark:text-primary-400 mt-1 w-8 h-8 flex-shrink-0">
                                {gearIcons[item.name] || <PhosphorIcons.Gear />}
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
    const [activeTab, setActiveTab] = useState<ActiveTab>('configurator');
    
    const tabs: {id: ActiveTab, label: string, icon: React.ReactNode}[] = [
        { id: 'configurator', label: 'Konfigurator', icon: <PhosphorIcons.Wrench /> },
        { id: 'calculators', label: 'Rechner', icon: <PhosphorIcons.Calculator /> },
        { id: 'gear', label: 'Ausrüstung & Shops', icon: <PhosphorIcons.Storefront /> },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Ausrüstungs-Planer</h1>
            
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
                {activeTab === 'configurator' && <SetupConfigurator />}
                {activeTab === 'calculators' && <Calculators />}
                {activeTab === 'gear' && <GearAndShops />}
            </div>
        </div>
    );
};