import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  containerClassName?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = 'h-4 bg-forest-200 dark:bg-forest-700 rounded',
  count = 1,
  containerClassName = 'space-y-2'
}) => {
  const skeletons = Array.from({ length: count }).map((_, i) => (
    <div key={i} className={`${className} skeleton-pulse`}></div>
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return <div className={containerClassName}>{skeletons}</div>;
};