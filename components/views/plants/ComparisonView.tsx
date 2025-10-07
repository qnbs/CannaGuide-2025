import React from 'react';
import { SavedExperiment } from '@/types';

interface ComparisonViewProps {
    experiment: SavedExperiment;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ experiment }) => {
    return (
        <div>
            <h2>Comparison View</h2>
            <p>Showing results for experiment: {experiment.id}</p>
        </div>
    );
};
