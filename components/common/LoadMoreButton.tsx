import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface LoadMoreButtonProps {
    onClick: () => void;
    visibleCount: number;
    totalCount: number;
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, visibleCount, totalCount }) => {
    const { t } = useTranslation();

    if (visibleCount >= totalCount) {
        return null;
    }

    return (
        <div className="flex justify-center pt-4 pb-4">
            <Button
                onClick={onClick}
                variant="secondary"
                size="sm"
                className="w-full max-w-sm mx-auto !py-2"
            >
                <PhosphorIcons.ChevronDown className="w-5 h-5 mr-2"/>
                {t('strainsView.loadMore', { count: visibleCount, total: totalCount })}
            </Button>
        </div>
    );
};