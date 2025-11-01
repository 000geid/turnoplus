import { Component, Inject, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ToastData } from '../../types/toast.types';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  public data: ToastData;

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public injectedData: ToastData,
    private snackBarRef: MatSnackBarRef<ToastComponent>
  ) {
    this.data = injectedData;
  }

  get toastConfig() {
    return this.data.config;
  }

  get typeConfig() {
    return this.getTypeConfig(this.data.type);
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }

  private getTypeConfig(type: string) {
    const configs = {
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
    
    return configs[type as keyof typeof configs] || configs.info;
  }
}