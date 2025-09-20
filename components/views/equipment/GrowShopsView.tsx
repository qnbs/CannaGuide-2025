import React from 'react';
import { Card } from '../../common/Card';
import { useTranslations } from '../../../hooks/useTranslations';
import { PhosphorIcons } from '../../icons/PhosphorIcons';

const ShopCard: React.FC<{ shopKey: string; t: (key: string, params?: Record<string, any>) => any }> = ({ shopKey, t }) => (
    <Card className="!bg-slate-800/50">
        <a 
            href={t(`equipmentView.growShops.shops.${shopKey}.url`)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group"
        >
            <h3 className="text-xl font-bold font-display text-primary-300 inline-flex items-center gap-2 group-hover:underline">
                {t(`equipmentView.growShops.shops.${shopKey}.name`)}
                <PhosphorIcons.ArrowSquareOut className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </h3>
        </a>
        <p className="text-sm text-slate-400 mb-2"><strong>{t('equipmentView.growShops.location')}:</strong> {t(`equipmentView.growShops.shops.${shopKey}.location`)}</p>
        <div className="prose prose-sm dark:prose-invert max-w-none space-y-2">
            <p>{t(`equipmentView.growShops.shops.${shopKey}.description`)}</p>
            <div>
                <h4 className="!mb-1">{t('equipmentView.growShops.strengths')}</h4>
                <ul className="!mt-0">
                    {(t(`equipmentView.growShops.shops.${shopKey}.strengths`) as string[]).map((item: string, index: number) => <li key={index}>{item}</li>)}
                </ul>
            </div>
            <p><strong>{t('equipmentView.growShops.idealFor')}:</strong> {t(`equipmentView.growShops.shops.${shopKey}.idealFor`)}</p>
        </div>
    </Card>
);

export const GrowShopsView: React.FC = () => {
    const { t } = useTranslations();
    const europeanShops = ['growmart', 'growshop24', 'growland', 'zamnesia'];
    const usShops = ['acInfinity', 'growGen', 'growersHouse', 'htgSupply'];

    return (
        <div className="space-y-8">
            <Card>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{t('equipmentView.growShops.intro')}</p>
                </div>
            </Card>

            <div>
                <h2 className="text-2xl font-bold font-display text-primary-400 mb-2">{t('equipmentView.growShops.european.title')}</h2>
                <p className="text-slate-300 mb-4">{t('equipmentView.growShops.european.description')}</p>
                <div className="space-y-4">
                    {europeanShops.map(key => <ShopCard key={key} shopKey={key} t={t} />)}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold font-display text-primary-400 mb-2">{t('equipmentView.growShops.us.title')}</h2>
                <p className="text-slate-300 mb-4">{t('equipmentView.growShops.us.description')}</p>
                <div className="space-y-4">
                    {usShops.map(key => <ShopCard key={key} shopKey={key} t={t} />)}
                </div>
            </div>

            <Card className="!border-l-4 !border-amber-500/50">
                <h3 className="text-xl font-bold font-display text-amber-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.WarningCircle />
                    {t('equipmentView.growShops.importantNote.title')}
                </h3>
                <p className="text-slate-300">{t('equipmentView.growShops.importantNote.content')}</p>
            </Card>
        </div>
    );
};
