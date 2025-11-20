import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-quick-actions-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './quick-actions-card.component.html',
  styleUrl: './quick-actions-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsCardComponent {
  @Output() navigateToBooking = new EventEmitter<void>();
  @Output() navigateToAppointments = new EventEmitter<void>();
  @Output() navigateToProfile = new EventEmitter<void>();
  @Output() navigateToMedicalRecords = new EventEmitter<void>();

  readonly quickActions = [
    {
      id: 'booking',
      title: 'Reservar Turno',
      description: 'Solicitar una nueva consulta médica',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.navigateToBooking.emit()
    },
    {
      id: 'appointments',
      title: 'Mis Turnos',
      description: 'Ver todos mis turnos programados',
      icon: 'event',
      color: 'accent',
      action: () => this.navigateToAppointments.emit()
    },
    {
      id: 'profile',
      title: 'Mi Perfil',
      description: 'Actualizar datos personales',
      icon: 'person',
      color: 'primary',
      action: () => this.navigateToProfile.emit()
    },
    {
      id: 'records',
      title: 'Historial Médico',
      description: 'Consultar historial clínico',
      icon: 'medical_services',
      color: 'accent',
      action: () => this.navigateToMedicalRecords.emit()
    }
  ];
}