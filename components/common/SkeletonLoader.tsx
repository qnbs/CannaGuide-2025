import React from 'react';
import { LIST_GRID_CLASS } from '@/components/views/strains/constants';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  containerClassName?: string;
  variant?: 'list' | 'grid' | 'default';
  columns?: Record<string, boolean>; // For list variant
}

const ListSkeleton: React.FC<{columns?: Record<string, boolean>}> = ({ columns }) => (
    <div className={`${LIST_GRID_CLASS} glass-pane rounded-lg p-3 skeleton-pulse`}>
        <div className="flex items-center justify-center">
            <div className="h-4 w-4 bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-1.5">
            <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
            <div className="h-3 w-1/2 bg-slate-700 rounded sm:hidden"></div>
        </div>
        {columns?.type && <div className="hidden sm:flex items-center justify-center"><div className="h-6 w-6 bg-slate-700 rounded-full"></div></div>}
        {columns?.thc && <div className="hidden sm:block h-4 w-10 bg-slate-700 rounded"></div>}
        {columns?.cbd && <div className="hidden sm:block h-4 w-10 bg-slate-700 rounded"></div>}
        {columns?.floweringTime && <div className="hidden sm:block h-4 w-16 bg-slate-700 rounded"></div>}
        {columns?.yield && <div className="hidden md:block h-4 w-20 bg-slate-700 rounded"></div>}
        <div className="flex items-center"><div className="h-4 w-12 bg-slate-700 rounded"></div></div>
        <div className="flex gap-1 justify-end">
            <div className="h-6 w-6 bg-slate-700 rounded"></div>
        </div>
    </div>
);

const GridSkeleton: React.FC = () => (
    <div className="glass-pane rounded-xl p-3 flex flex-col items-center skeleton-pulse">
        <div className="h-12 w-12 bg-slate-700 rounded-full mb-2"></div>
        <div className="h-5 w-3/4 bg-slate-700 rounded mb-1"></div>
        <div className="h-3 w-1/2 bg-slate-700 rounded mb-4"></div>
        <div className="h-4 w-3/4 bg-slate-700 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
    </div>
);

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = 'h-4 bg-slate-700 rounded',
  count = 1,
  containerClassName,
  variant = 'default',
  columns,
}) => {
  if (variant === 'list') {
      return (
          <div className={containerClassName || "space-y-2"}>
              {Array.from({ length: count }).map((_, i) => <ListSkeleton key={i} columns={columns}/>)}
          </div>
      );
  }

  if (variant === 'grid') {
      return (
          <div className={containerClassName || "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"}>
              {Array.from({ length: count }).map((_, i) => <GridSkeleton key={i} />)}
          </div>
      );
  }

  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div key={i} className={`${className} skeleton-pulse`}></div>
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return <div className={containerClassName || 'space-y-2'}>{skeletons}</div>;
};