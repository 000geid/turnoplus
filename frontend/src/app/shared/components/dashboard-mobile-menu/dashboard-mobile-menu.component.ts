import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { DashboardSidebarItem } from '../dashboard-sidebar/dashboard-sidebar.component';

@Component({
  selector: 'app-dashboard-mobile-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard-mobile-menu.component.html',
  styleUrl: './dashboard-mobile-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardMobileMenuComponent {
  @Input() items: DashboardSidebarItem[] = [];
  @Input() activeRoute: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  isActive(route: string): boolean {
    return this.activeRoute === route || this.activeRoute.startsWith(`${route}/`);
  }

  onNavigate(route: string): void {
    this.navigate.emit(route);
    this.close.emit();
  }

  onOverlayClick(): void {
    this.close.emit();
  }
}
