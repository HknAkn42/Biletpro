import React, { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="animate-spin text-blue-500" size={32} />
  </div>
);

// Lazy Loaded Components
export const LazyDashboard = lazy(() => import('../pages/Dashboard').then(module => ({ default: module.Dashboard })));
export const LazyEvents = lazy(() => import('../pages/Events').then(module => ({ default: module.Events })));
export const LazySales = lazy(() => import('../pages/Sales').then(module => ({ default: module.Sales })));
export const LazyTableLayout = lazy(() => import('../pages/TableLayout').then(module => ({ default: module.TableLayout })));
export const LazyEntrance = lazy(() => import('../pages/Entrance').then(module => ({ default: module.Entrance })));
export const LazyStaff = lazy(() => import('../pages/Staff').then(module => ({ default: module.Staff })));
export const LazyCustomers = lazy(() => import('../pages/Customers').then(module => ({ default: module.Customers })));
export const LazyReports = lazy(() => import('../pages/Reports').then(module => ({ default: module.Reports })));
export const LazyOrganizations = lazy(() => import('../pages/Organizations').then(module => ({ default: module.Organizations })));
export const LazySaaSFinance = lazy(() => import('../pages/SaaSFinance').then(module => ({ default: module.SaaSFinance })));

// Lazy Loading Wrapper
export const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Image Optimization
export const optimizeImage = (src: string, width: number, quality: number = 80): string => {
  // For external images, add optimization parameters
  if (src.includes('http')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    return url.toString();
  }
  return src;
};

// Debounce for Performance
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle for Performance
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
