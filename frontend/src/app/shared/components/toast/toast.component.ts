import { Component, Inject, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ToastData, TOAST_CONFIG } from '../../types/toast.types';

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
    return TOAST_CONFIG[this.data.type];
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}