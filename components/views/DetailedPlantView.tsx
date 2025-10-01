
/**
 * @deprecated This file is obsolete and should not be used.
 * The correct and current implementation for the Detailed Plant View is located at `components/views/plants/DetailedPlantView.tsx`.
 * This file has been deprecated as part of a project-wide audit and cleanup.
 */
import React from 'react';

export const DetailedPlantView: React.FC = () => {
    return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            <p className="font-bold">Deprecated Component</p>
            <p className="text-sm">This file (`components/views/DetailedPlantView.tsx`) is deprecated. Please use `components/views/plants/DetailedPlantView.tsx` instead.</p>
        </div>
    );
};
