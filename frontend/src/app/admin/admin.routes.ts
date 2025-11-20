import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent)
  },
  {
    path: 'users',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent)
  },
  {
    path: 'offices',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./admin-shell.component').then((m) => m.AdminShellComponent)
  }
];
