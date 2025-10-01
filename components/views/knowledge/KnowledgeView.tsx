
/**
 * @deprecated This file is an old, simplified version and should not be used.
 * The correct and current implementation for the Knowledge View is located at `components/views/KnowledgeView.tsx`.
 * This file has been deprecated as part of a project-wide audit and cleanup.
 */
import React from 'react';

export const KnowledgeView: React.FC = () => {
    return (
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-300">
            <p className="font-bold">Deprecated Component</p>
            <p className="text-sm">This file (`components/views/knowledge/KnowledgeView.tsx`) is deprecated. Please use `components/views/KnowledgeView.tsx` instead.</p>
        </div>
    );
};
