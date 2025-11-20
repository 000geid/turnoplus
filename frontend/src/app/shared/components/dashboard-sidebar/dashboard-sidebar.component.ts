import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface DashboardSidebarItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number | null;
}

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, MatListModule, MatIconModule, MatTooltipModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardSidebarComponent {
  @Input() items: DashboardSidebarItem[] = [];
  @Input() activeRoute: string = '';
  @Input() mobileOpen = false;
  @Output() navigate = new EventEmitter<string>();

  onNavigation(route: string): void {
    this.navigate.emit(route);
  }

  isActive(item: DashboardSidebarItem): boolean {
    const normalizedRoute = (this.activeRoute || '').split('?')[0];
    return (
      normalizedRoute === item.route ||
      normalizedRoute.startsWith(`${item.route}/`)
    );
  }
}
