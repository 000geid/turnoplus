import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OfficeService } from '../../../core/services/office.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Office, OfficeCreate, OfficeUpdate } from '../../../core/models/office';

@Component({
  selector: 'app-office-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './office-management.component.html',
  styleUrls: ['./office-management.component.scss']
})
export class OfficeManagementComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  offices: Office[] = [];
  loading = false;
  error: string | null = null;

  // Form state
  showCreateForm = false;
  editingOffice: Office | null = null;

  // Form data
  formData: OfficeCreate = {
    code: '',
    name: '',
    address: ''
  };

  constructor(
    private officeService: OfficeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadOffices();
  }

  loadOffices(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.officeService
      .getOffices()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          // Ensure the OnPush parent gets the state update
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (offices) => {
          this.offices = offices;
        },
        error: (err) => {
          this.error = 'Error al cargar consultorios';
          console.error('Error loading offices:', err);
        }
      });
  }

  showCreateOfficeForm(): void {
    this.editingOffice = null;
    this.formData = { code: '', name: '', address: '' };
    this.showCreateForm = true;
  }

  showEditOfficeForm(office: Office): void {
    this.editingOffice = office;
    this.formData = {
      code: office.code,
      name: office.name || '',
      address: office.address || ''
    };
    this.showCreateForm = true;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingOffice = null;
    this.formData = { code: '', name: '', address: '' };
    // Force change detection to update the modal visibility
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (!this.formData.code.trim()) {
      this.toastService.error('El código del consultorio es obligatorio');
      this.error = 'El código del consultorio es obligatorio';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.editingOffice) {
      // Update existing office
      const updateData: OfficeUpdate = {
        code: this.formData.code,
        name: this.formData.name || undefined,
        address: this.formData.address || undefined
      };

      this.officeService.updateOffice(this.editingOffice.id, updateData).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.success('Consultorio actualizado correctamente');
          this.loadOffices();
          this.cancelForm();
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = 'Error al actualizar consultorio. Reintentá más tarde.';
          this.error = errorMessage;
          this.toastService.error(errorMessage);
        }
      });
    } else {
      // Create new office
      this.officeService.createOffice(this.formData).subscribe({
        next: () => {
          this.loading = false;
          this.toastService.success('Oficina creada exitosamente');
          this.loadOffices();
          this.cancelForm();
        },
        error: (err) => {
          this.loading = false;
          const errorMessage = 'Error al crear consultorio. Reintentá más tarde.';
          this.error = errorMessage;
          this.toastService.error(errorMessage);
        }
      });
    }
  }

  deleteOffice(office: Office): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar el consultorio "${office.name || office.code}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.officeService.deleteOffice(office.id).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Consultorio eliminado correctamente');
        // Close the modal and reset form state
        this.cancelForm();
        // Refresh the list after closing the modal
        this.loadOffices();
      },
      error: (err) => {
        this.loading = false;

        // Check if the error contains a specific validation message
        let errorMessage = 'Error al eliminar consultorio. Reintentá más tarde.';

        if (err?.error?.detail) {
          // Backend returned a detailed error message
          errorMessage = err.error.detail;
        } else if (err?.message) {
          // Try to extract message from error object
          errorMessage = err.message;
        }

        this.error = errorMessage;
        this.toastService.error(errorMessage);
        console.error('Error deleting office:', err);
      }
    });
  }
}
