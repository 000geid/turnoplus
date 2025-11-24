import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { OfficeManagementComponent } from './components/office-management/office-management.component';
import { UnifiedUserManagementComponent } from './components/unified-user-management/unified-user-management.component';
import { SystemSettingsComponent } from './components/system-settings/system-settings.component';
import {
  DashboardSidebarComponent,
  DashboardSidebarItem
} from '../shared/components/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardMobileMenuComponent } from '../shared/components/dashboard-mobile-menu/dashboard-mobile-menu.component';
import { AdminService } from '../core/services/admin.service';
import { AdminDashboardSummaryDto } from '../core/models/admin';

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
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly dashboardStatsData = signal<AdminDashboardSummaryDto | null>(null);
  readonly isLoadingStats = signal(false);
  readonly statsError = signal<string | null>(null);

  readonly dashboardStats = computed(() => {
    const stats = this.dashboardStatsData();
    return [
      { label: 'Usuarios Totales', value: this.formatStat(stats?.total_users) },
      { label: 'Doctores Activos', value: this.formatStat(stats?.active_doctors) },
      { label: 'Turnos Hoy', value: this.formatStat(stats?.appointments_today) },
      { label: 'Registros Médicos', value: this.formatStat(stats?.medical_records) }
    ];
  });

  constructor() {
    this.loadDashboardStats();
  }

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

  private loadDashboardStats(): void {
    this.isLoadingStats.set(true);
    this.statsError.set(null);
    this.adminService
      .getDashboardSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.dashboardStatsData.set(stats);
          this.isLoadingStats.set(false);
        },
        error: () => {
          this.statsError.set('No pudimos cargar las métricas del sistema.');
          this.isLoadingStats.set(false);
        }
      });
  }

  private formatStat(value?: number | null): string {
    if (value === undefined || value === null) {
      return this.isLoadingStats() ? '...' : '—';
    }
    return new Intl.NumberFormat('es-AR').format(value);
  }
}
