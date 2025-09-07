import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';

interface QuickActionsProps {
    onAdvanceDay: () => void;
    activePlantsCount: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAdvanceDay, activePlantsCount }) => {
    const { t } = useTranslations();

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4 text-slate-100">{t('plantsView.quickActions.title')}</h3>
            <Button onClick={onAdvanceDay} disabled={activePlantsCount === 0} className="w-full button-enhanced-primary">
                <PhosphorIcons.ArrowClockwise className="inline w-5 h-5 mr-1.5"/>
                {t('plantsView.quickActions.simulateNextDay')}
            </Button>
        </Card>
    )
}