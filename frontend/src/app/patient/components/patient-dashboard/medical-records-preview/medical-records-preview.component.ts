import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';

import { MedicalRecordDto } from '../../../../core/models/medical-record';

@Component({
  selector: 'app-medical-records-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule
  ],
  templateUrl: './medical-records-preview.component.html',
  styleUrl: './medical-records-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalRecordsPreviewComponent {
  readonly records = input.required<MedicalRecordDto[]>();
  readonly isLoading = input.required<boolean>();
  @Output() viewAll = new EventEmitter<void>();

  constructor(private datePipe: DatePipe) {}

  getFormattedDate(dateString: string): string {
    return this.datePipe.transform(dateString, 'd \'de\' MMMM, y', 'es-ES') || '';
  }

  getDoctorFullName(record: MedicalRecordDto): string {
    return record.doctor_name || 'Médico';
  }

  getPreviewText(notes: string): string {
    if (!notes) return 'Sin notas disponibles';

    const maxLength = 120;
    if (notes.length <= maxLength) {
      return notes;
    }

    return notes.substring(0, maxLength).trim() + '...';
  }

  getDiagnosisSummary(diagnosis: string): string {
    if (!diagnosis) return 'Sin diagnóstico';

    const maxLength = 80;
    if (diagnosis.length <= maxLength) {
      return diagnosis;
    }

    return diagnosis.substring(0, maxLength).trim() + '...';
  }

  hasAnyContent(): boolean {
    return this.records().length > 0;
  }
}