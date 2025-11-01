import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorDto } from '../../../core/models/user';

@Component({
  selector: 'app-doctor-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-autocomplete.component.html',
  styleUrl: './doctor-autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoctorAutocompleteComponent {
  @Input() doctors: DoctorDto[] = [];
  @Input() selectedDoctor: DoctorDto | null = null;
  @Input() loading = false;
  @Input() placeholder = 'Buscar profesional...';
  @Input() label = 'Profesional';
  @Input() showSpecialties = true;
  @Input() doctorAvailabilities: Map<number, number> = new Map();

  @Output() doctorSelected = new EventEmitter<DoctorDto>();
  @Output() searchChanged = new EventEmitter<string>();

  readonly searchTerm = signal('');
  readonly isDropdownOpen = signal(false);

  readonly filteredDoctors = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    let filtered = [...this.doctors];

    // Filter by search term
    if (term) {
      filtered = filtered.filter(doctor => {
        const name = doctor.full_name?.toLowerCase() || doctor.email?.toLowerCase() || '';
        const specialty = doctor.specialty?.toLowerCase() || '';
        return name.includes(term) || specialty.includes(term);
      });
    }

    // Sort by name
    return filtered.sort((a, b) => {
      const aName = a.full_name || a.email || '';
      const bName = b.full_name || b.email || '';
      return aName.localeCompare(bName);
    });
  });

  readonly hasSearchResults = computed(() => 
    this.filteredDoctors().length > 0 && this.searchTerm().trim().length > 0
  );

  onSearchChange(): void {
    this.isDropdownOpen.set(true);
    this.searchChanged.emit(this.searchTerm());
  }

  selectDoctor(doctor: DoctorDto): void {
    this.searchTerm.set(this.getDoctorDisplayName(doctor));
    this.selectedDoctor = doctor;
    this.isDropdownOpen.set(false);
    this.doctorSelected.emit(doctor);
  }

  clearSelection(): void {
    this.selectedDoctor = null;
    this.searchTerm.set('');
    this.isDropdownOpen.set(false);
    this.doctorSelected.emit(null as any);
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(open => !open);
  }

  closeDropdown(): void {
    // Close dropdown after a short delay to allow for click events
    setTimeout(() => {
      this.isDropdownOpen.set(false);
    }, 200);
  }

  getDoctorDisplayName(doctor: DoctorDto): string {
    return doctor.full_name || doctor.email || 'Sin nombre';
  }

  getDoctorSpecialty(doctor: DoctorDto): string {
    return doctor.specialty || 'Sin especialidad';
  }

  getDoctorInitials(doctor: DoctorDto): string {
    if (doctor.full_name) {
      return doctor.full_name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    
    if (doctor.email) {
      return doctor.email.charAt(0).toUpperCase();
    }
    
    return 'DR';
  }

  isSelectedDoctor(doctor: DoctorDto): boolean {
    return this.selectedDoctor?.id === doctor.id;
  }

  getDoctorAvailabilityCount(doctor: DoctorDto): number {
    return this.doctorAvailabilities.get(doctor.id) || 0;
  }

  hasDoctorAvailability(doctor: DoctorDto): boolean {
    return this.getDoctorAvailabilityCount(doctor) > 0;
  }

  getAvailabilityIndicator(doctor: DoctorDto): string {
    const count = this.getDoctorAvailabilityCount(doctor);
    if (count === 0) return '';
    if (count <= 2) return '•';
    if (count <= 5) return '••';
    return '•••';
  }

  getAvailabilityClass(doctor: DoctorDto): string {
    const count = this.getDoctorAvailabilityCount(doctor);
    if (count === 0) return 'no-availability';
    if (count <= 2) return 'low-availability';
    if (count <= 5) return 'medium-availability';
    return 'high-availability';
  }
}