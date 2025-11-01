import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MedicalRecordDto } from '../../../core/models/medical-record';
import { DateFormatService } from '../../../core/services/date-format.service';

@Component({
  selector: 'app-patient-medical-records',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-medical-records.component.html',
  styleUrl: './patient-medical-records.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PatientMedicalRecordsComponent {
  @Input() records: ReadonlyArray<MedicalRecordDto> = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Output() refresh = new EventEmitter<void>();

  constructor(private dateFormatService: DateFormatService) {}

  trackRecordById(_: number, item: MedicalRecordDto): number {
    return item.id;
  }

  formatDateSpanish(dateString: string): string {
    return this.dateFormatService.formatLongDate(dateString);
  }

  formatDateTimeSpanish(dateString: string): string {
    return this.dateFormatService.formatDateTime(dateString);
  }
}
