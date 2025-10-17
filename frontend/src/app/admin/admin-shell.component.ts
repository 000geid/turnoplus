import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabbedShellComponent, TabConfig } from '../shared/components/tabbed-shell/tabbed-shell.component';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [TabbedShellComponent],
  template: `
    <app-tabbed-shell
      title="Panel del administrador"
      subtitle="Gestioná usuarios, doctores y configuración del sistema."
      [tabs]="tabs"
    >
      <div slot="actions">
        <button class="btn btn-primary" type="button">
          Configuración
        </button>
      </div>

      <div slot="dashboard">
        <div class="admin-dashboard">
          <div class="admin-dashboard__stats">
            <div class="stat-card">
              <h3>Usuarios Totales</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Doctores Activos</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Turnos Hoy</h3>
              <p class="stat-number">0</p>
            </div>
            <div class="stat-card">
              <h3>Registros Médicos</h3>
              <p class="stat-number">0</p>
            </div>
          </div>
          
          <div class="admin-dashboard__recent">
            <h3>Actividad Reciente</h3>
            <p class="placeholder">No hay actividad reciente para mostrar.</p>
          </div>
        </div>
      </div>

      <div slot="users">
        <div class="admin-section">
          <h3>Gestión de Usuarios</h3>
          <p class="placeholder">Funcionalidad de gestión de usuarios en desarrollo.</p>
        </div>
      </div>

      <div slot="doctors">
        <div class="admin-section">
          <h3>Gestión de Doctores</h3>
          <p class="placeholder">Funcionalidad de gestión de doctores en desarrollo.</p>
        </div>
      </div>

      <div slot="settings">
        <div class="admin-section">
          <h3>Configuración del Sistema</h3>
          <p class="placeholder">Configuraciones del sistema en desarrollo.</p>
        </div>
      </div>
    </app-tabbed-shell>
  `,
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  readonly tabs: TabConfig[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard'
    },
    {
      id: 'users',
      label: 'Usuarios',
      icon: 'people'
    },
    {
      id: 'doctors',
      label: 'Doctores',
      icon: 'medical_services'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'settings'
    }
  ];
}
