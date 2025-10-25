'use client';

import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'text-green-600',
          text: 'text-green-900',
          IconComponent: CheckCircleIcon,
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-900',
          IconComponent: ExclamationCircleIcon,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-900',
          IconComponent: ExclamationCircleIcon,
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-900',
          IconComponent: InformationCircleIcon,
        };
    }
  };

  const styles = getStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${styles.bg} shadow-lg backdrop-blur-sm animate-slide-in-right`}>
      <IconComponent className={`w-6 h-6 ${styles.icon} shrink-0`} />
      <p className={`text-sm font-medium ${styles.text} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        className={`${styles.icon} hover:opacity-70 transition-opacity shrink-0`}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
