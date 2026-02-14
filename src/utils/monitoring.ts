// Performance Monitoring System
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'timing' | 'counter' | 'gauge';
}

interface ErrorMetric {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorMetric[] = [];
  private maxMetrics = 1000;
  private maxErrors = 100;

  // Record performance metrics
  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'timing'): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      type
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Record errors
  recordError(error: Error, url: string = window.location.href): void {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      url,
      userAgent: navigator.userAgent
    });

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to monitoring service (in production)
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(error, url);
    }
  }

  // Get performance summary
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    // Group metrics by name
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // Calculate statistics
    for (const [name, values] of Object.entries(grouped)) {
      const numbers = values.map(v => v.value);
      summary[name] = {
        count: values.length,
        min: Math.min(...numbers),
        max: Math.max(...numbers),
        avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
        latest: values[values.length - 1]?.value
      };
    }

    return summary;
  }

  // Get error summary
  getErrorSummary(): Record<string, any> {
    const grouped = this.errors.reduce((acc, error) => {
      const key = error.message.substring(0, 50); // First 50 chars
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(error);
      return acc;
    }, {} as Record<string, ErrorMetric[]>);

    const summary: Record<string, any> = {};
    for (const [message, errors] of Object.entries(grouped)) {
      summary[message] = {
        count: errors.length,
        lastOccurrence: errors[errors.length - 1]?.timestamp,
        urls: [...new Set(errors.map(e => e.url))]
      };
    }

    return summary;
  }

  // Send error to monitoring service
  private async sendErrorToService(error: Error, url: string): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          url,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        })
      });
    } catch (e) {
      console.error('Failed to send error to monitoring service:', e);
    }
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      errors: this.errors,
      summary: {
        performance: this.getMetricsSummary(),
        errors: this.getErrorSummary()
      }
    });
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance decorators
export const measurePerformance = (name: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await method.apply(this, args);
        const end = performance.now();
        performanceMonitor.recordMetric(`${name}_duration`, end - start, 'timing');
        performanceMonitor.recordMetric(`${name}_success`, 1, 'counter');
        return result;
      } catch (error) {
        const end = performance.now();
        performanceMonitor.recordMetric(`${name}_duration`, end - start, 'timing');
        performanceMonitor.recordMetric(`${name}_error`, 1, 'counter');
        performanceMonitor.recordError(error as Error);
        throw error;
      }
    };

    return descriptor;
  };
};

// Resource usage monitoring
export class ResourceMonitor {
  private static checkInterval = 30000; // 30 seconds
  private static maxMemoryUsage = 0.8; // 80%

  static startMonitoring(): void {
    setInterval(() => {
      this.checkMemoryUsage();
      this.checkNetworkStatus();
    }, this.checkInterval);
  }

  private static checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      performanceMonitor.recordMetric('memory_usage', usage, 'gauge');

      if (usage > this.maxMemoryUsage) {
        console.warn('High memory usage detected:', usage);
        performanceMonitor.recordError(
          new Error(`High memory usage: ${(usage * 100).toFixed(2)}%`),
          window.location.href
        );
      }
    }
  }

  private static checkNetworkStatus(): void {
    if (navigator.onLine) {
      performanceMonitor.recordMetric('network_status', 1, 'gauge');
    } else {
      performanceMonitor.recordMetric('network_status', 0, 'gauge');
    }
  }

  static getPageLoadMetrics(): void {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      performanceMonitor.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'timing');
      performanceMonitor.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'timing');
      performanceMonitor.recordMetric('first_paint', navigation.responseStart - navigation.fetchStart, 'timing');
    }
  }
}

// Initialize monitoring
if (typeof window !== 'undefined') {
  // Global error handler
  window.addEventListener('error', (event) => {
    performanceMonitor.recordError(new Error(event.message), event.filename);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    performanceMonitor.recordError(
      new Error(`Unhandled promise rejection: ${event.reason}`),
      window.location.href
    );
  });

  // Start resource monitoring
  ResourceMonitor.startMonitoring();
  
  // Record page load metrics
  ResourceMonitor.getPageLoadMetrics();
}
