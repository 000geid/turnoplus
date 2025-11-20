import { Routes } from '@angular/router';

export const patientRoutes: Routes = [
  {
    path: '',
    redirectTo: 'appointments',
    pathMatch: 'full'
  },
  {
    path: 'appointments',
    loadComponent: () => import('./patient-layout.component').then((m) => m.PatientLayoutComponent)
  },
  {
    path: 'booking',
    loadComponent: () => import('./patient-layout.component').then((m) => m.PatientLayoutComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./patient-layout.component').then((m) => m.PatientLayoutComponent)
  },
  {
    path: 'records',
    loadComponent: () => import('./patient-layout.component').then((m) => m.PatientLayoutComponent)
  }
];