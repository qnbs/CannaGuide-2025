import React from 'react'

interface SkeletonLoaderProps {
    className?: string
    count?: number
    containerClassName?: string
    variant?: 'list' | 'grid' | 'default'
}

const ListSkeleton: React.FC = () => (
    <div className="glass-pane rounded-lg py-2 skeleton-pulse grid items-center gap-x-4 px-4 grid-cols-[auto_minmax(0,1.5fr)_repeat(2,minmax(0,0.8fr))_auto] sm:grid-cols-[auto_minmax(0,3fr)_minmax(0,1fr)_repeat(5,minmax(0,1fr))_auto]">
        {/* Checkbox */}
        <div className="h-5 w-5 bg-slate-700 rounded flex-shrink-0"></div>
        {/* Name */}
        <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex-shrink-0"></div>
            <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
        </div>
        {/* Type (desktop) */}
        <div className="h-4 w-16 bg-slate-700 rounded hidden sm:block"></div>
        {/* THC */}
        <div className="h-4 w-12 bg-slate-700 rounded"></div>
        {/* CBD */}
        <div className="h-4 w-12 bg-slate-700 rounded"></div>
        {/* Flowering (desktop) */}
        <div className="h-4 w-12 bg-slate-700 rounded hidden sm:block"></div>
        {/* Yield (desktop) */}
        <div className="h-4 w-16 bg-slate-700 rounded hidden sm:block"></div>
        {/* Difficulty (desktop) */}
        <div className="h-8 w-12 bg-slate-700 rounded hidden sm:block"></div>
        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
            <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
        </div>
    </div>
)

const GridSkeleton: React.FC = () => (
    <div className="glass-pane rounded-xl p-3 flex flex-col items-center skeleton-pulse">
        <div className="h-12 w-12 bg-slate-700 rounded-full mb-2"></div>
        <div className="h-5 w-3/4 bg-slate-700 rounded mb-1"></div>
        <div className="h-3 w-1/2 bg-slate-700 rounded mb-4"></div>
        <div className="h-4 w-3/4 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
    </div>
)

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    className = 'h-4 bg-slate-700 rounded',
    count = 1,
    containerClassName,
    variant = 'default',
}) => {
    if (variant === 'list') {
        return (
            <div className={containerClassName || 'space-y-2'}>
                {Array.from({ length: count }).map((_, i) => (
                    <ListSkeleton key={i} />
                ))}
            </div>
        )
    }

    if (variant === 'grid') {
        return (
            <div
                className={
                    containerClassName ||
                    'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                }
            >
                {Array.from({ length: count }).map((_, i) => (
                    <GridSkeleton key={i} />
                ))}
            </div>
        )
    }

    const skeletons = Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${className} skeleton-pulse`}></div>
    ))

    if (count === 1) {
        return skeletons[0]
    }

    return <div className={containerClassName || 'space-y-2'}>{skeletons}</div>
}