import { Routes } from '@angular/router';

import { authCanActivateGuard, authCanMatchGuard } from './core/guards/auth.guard';
import { roleCanActivateGuard, roleCanMatchGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes)
  },
  {
    path: 'patient',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['patient', 'user'] },
    loadChildren: () => import('./patient/patient.routes').then((m) => m.patientRoutes)
  },
  {
    path: 'doctor',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['doctor'] },
    loadChildren: () => import('./doctor/doctor.routes').then((m) => m.doctorRoutes)
  },
  {
    path: 'admin',
    canMatch: [authCanMatchGuard, roleCanMatchGuard],
    canActivate: [authCanActivateGuard, roleCanActivateGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
