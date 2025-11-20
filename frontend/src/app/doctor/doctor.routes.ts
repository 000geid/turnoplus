import { Routes } from '@angular/router';

export const doctorRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./doctor-shell.component').then((m) => m.DoctorShellComponent)
  },
  {
    path: 'availability',
    loadComponent: () => import('./doctor-shell.component').then((m) => m.DoctorShellComponent)
  },
  {
    path: 'appointments',
    loadComponent: () => import('./doctor-shell.component').then((m) => m.DoctorShellComponent)
  },
  {
    path: 'records',
    loadComponent: () => import('./doctor-shell.component').then((m) => m.DoctorShellComponent)
  }
];
