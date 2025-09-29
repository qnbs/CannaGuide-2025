/**
 * @deprecated This file is obsolete and should not be used.
 * The correct and current implementation for the Plants View is located at `components/views/PlantsView.tsx`.
 * This file has been deprecated as part of the migration from Zustand to Redux and to resolve architectural inconsistencies.
 */
import React from 'react';

export const PlantsView: React.FC = () => {
    return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            <p className="font-bold">Deprecated Component</p>
            <p className="text-sm">This file (`components/views/plants/PlantsView.tsx`) is deprecated. Please use `components/views/PlantsView.tsx` instead.</p>
        </div>
    );
};

export default PlantsView;
