/**
 * Skeleton Loaders pour éviter le CLS (Cumulative Layout Shift)
 * Best practice 2025 - Core Web Vitals
 */

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

export function Skeleton({
  className = '',
  width,
  height = '1rem',
  circle = false,
  count = 1,
}: SkeletonProps) {
  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`skeleton-loader ${className}`}
          style={{
            width: width || '100%',
            height,
            borderRadius: circle ? '50%' : '0.5rem',
            marginBottom: count > 1 ? '0.5rem' : 0,
          }}
        />
      ))}
    </>
  );
}

/**
 * Skeleton pour une carte météo
 */
export function WeatherCardSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton circle width={48} height={48} />
        <div className="flex-1">
          <Skeleton width="60%" height="1.25rem" />
          <Skeleton width="40%" height="0.875rem" />
        </div>
      </div>
      <Skeleton count={3} height="0.75rem" />
    </div>
  );
}

/**
 * Skeleton pour la carte
 */
export function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <Skeleton circle width={60} height={60} className="mx-auto mb-4" />
        <Skeleton width={200} height="1rem" className="mx-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour la liste de favoris
 */
export function FavoritesListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <Skeleton circle width={40} height={40} />
            <div className="flex-1">
              <Skeleton width="70%" height="1rem" />
              <Skeleton width="50%" height="0.75rem" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour le timeline
 */
export function TimelineSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl">
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
      <Skeleton circle width={40} height={40} />
      <div className="flex-1">
        <Skeleton height="1rem" />
        <Skeleton width="60%" height="0.75rem" />
      </div>
    </div>
  );
}
