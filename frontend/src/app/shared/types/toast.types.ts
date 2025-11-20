export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  duration?: number;
  dismissible?: boolean;
  position?: 'top' | 'bottom';
  maxWidth?: string;
  className?: string;
}

export interface ToastData {
  type: ToastType;
  message: string;
  title?: string;
  config?: ToastConfig;
}

export interface ToastOptions {
  title?: string;
  config?: ToastConfig;
}

export const DEFAULT_TOAST_CONFIG: Required<ToastConfig> = {
  duration: 5000,
  dismissible: true,
  position: 'top',
  maxWidth: '400px',
  className: ''
};

export const TOAST_CONFIG: Record<ToastType, { 
  icon: string; 
  color: string; 
  bgColor: string;
  borderColor: string; 
}> = {
  success: {
    icon: '✓',
    color: '#065f46',
    bgColor: '#ecfdf5',
    borderColor: '#10b981'
  },
  error: {
    icon: '✗',
    color: '#991b1b',
    bgColor: '#fef2f2',
    borderColor: '#ef4444'
  },
  warning: {
    icon: '⚠',
    color: '#92400e',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b'
  },
  info: {
    icon: 'ℹ',
    color: '#1e40af',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6'
  }
};