import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { OfficeManagementComponent } from './components/office-management/office-management.component';
import { UnifiedUserManagementComponent } from './components/unified-user-management/unified-user-management.component';
import { SystemSettingsComponent } from './components/system-settings/system-settings.component';
import {
  DashboardSidebarComponent,
  DashboardSidebarItem
} from '../shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardMobileMenuComponent } from '../shared/components/dashboard-mobile-menu/dashboard-mobile-menu.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    DashboardSidebarComponent,
    DashboardMobileMenuComponent,
    UnifiedUserManagementComponent,
    OfficeManagementComponent,
    SystemSettingsComponent
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  private readonly router = inject(Router);

  readonly mobileSidebarOpen = signal(false);
  readonly navigationItems: DashboardSidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'people',
      route: '/admin/users'
    },
    {
      id: 'offices',
      label: 'Consultorios',
      icon: 'business',
      route: '/admin/offices'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'settings',
      route: '/admin/settings'
    }
  ];

  readonly currentRoute = computed(() => this.router.url.split('?')[0]);

  readonly dashboardStats = [
    { label: 'Usuarios Totales', value: '0' },
    { label: 'Doctores Activos', value: '0' },
    { label: 'Turnos Hoy', value: '0' },
    { label: 'Registros Médicos', value: '0' }
  ];

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((open) => !open);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  onNavigation(route: string): void {
    this.router.navigate([route]);
    this.closeMobileSidebar();
  }
}
