import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-doctor-shell',
  standalone: true,
  template: `
    <section class="placeholder card">
      <h2>Panel del profesional</h2>
      <p>Configura tu disponibilidad y fichas clínicas (pendiente de implementación).</p>
    </section>
  `,
  styleUrl: './doctor-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorShellComponent {}
