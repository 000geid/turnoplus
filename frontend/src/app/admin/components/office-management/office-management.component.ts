import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ) {}

  ngOnInit(): void {
    this.loadOffices();
  }

  loadOffices(): void {
    this.loading = true;
    this.error = null;
    
    this.officeService.getOffices().subscribe({
      next: (offices) => {
        this.offices = offices;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar consultorios';
        this.loading = false;
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
        this.loadOffices();
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = 'Error al eliminar consultorio. Reintentá más tarde.';
        this.error = errorMessage;
        this.toastService.error(errorMessage);
        console.error('Error deleting office:', err);
      }
    });
  }
}
