import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { DoctorService, DoctorCreate, DoctorUpdate } from '../../../core/services/doctor.service';
import { PatientsService } from '../../../core/services/patients.service';
import { OfficeService } from '../../../core/services/office.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserDto, DoctorDto, PatientDto } from '../../../core/models/user';
import { Office } from '../../../core/models/office';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { PaginationParams, PaginatedResponse, defaultPaginationParams } from '../../../core/models/pagination';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role: 'patient' | 'doctor' | 'admin';
  // Patient specific fields
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
  // Doctor specific fields
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
  // Admin specific fields
  admin_role?: 'superadmin' | 'manager' | 'support';
  permissions?: string[];
}

export interface UserUpdate {
  password?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  full_name?: string;
  role?: 'patient' | 'doctor' | 'admin';
  // Patient specific fields
  date_of_birth?: string;
  medical_record_number?: string;
  emergency_contact?: string;
  // Doctor specific fields
  specialty?: string;
  license_number?: string;
  years_experience?: number;
  office_id?: number;
  // Admin specific fields
  admin_role?: 'superadmin' | 'manager' | 'support';
  permissions?: string[];
}

type UserRoleFilter = 'all' | 'patient' | 'doctor' | 'admin';

@Component({
  selector: 'app-unified-user-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    PaginationComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './unified-user-management.component.html',
  styleUrls: ['./unified-user-management.component.scss']
})
export class UnifiedUserManagementComponent implements OnInit {
  users: (UserDto | DoctorDto | PatientDto)[] = [];
  filteredUsers: (UserDto | DoctorDto | PatientDto)[] = [];
  offices: Office[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination state
  pagination: PaginationParams = { ...defaultPaginationParams };
  totalUsers = 0;
  totalPages = 1;
  
  // Filter state
  roleFilter: UserRoleFilter = 'all';
  searchQuery = '';
  
  // Form state
  showCreateForm = false;
  editingUser: (UserDto | DoctorDto | PatientDto) | null = null;
  selectedRole: 'patient' | 'doctor' | 'admin' = 'patient';
  
  // Form data
  formData: UserCreate = {
    email: '',
    password: '',
    full_name: '',
    is_active: true,
    is_superuser: false,
    role: 'patient'
  };

  constructor(
    private userService: UserService,
    private doctorService: DoctorService,
    private patientService: PatientsService,
    private officeService: OfficeService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadOffices();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;
    
    // Load all types of users with pagination
    Promise.all([
      this.userService.getUsersPaginated(this.pagination).toPromise(),
      this.doctorService.getDoctorsPaginated(this.pagination).toPromise(),
      this.patientService.getPatientsPaginated(this.pagination).toPromise()
    ]).then(([usersResponse, doctorsResponse, patientsResponse]) => {
      // Combine all users from different types
      const allUsers = [
        ...(usersResponse?.items || []),
        ...(doctorsResponse?.items || []),
        ...(patientsResponse?.items || [])
      ];
      
      // Sort by name for consistent display
      this.users = allUsers.sort((a, b) => 
        a.full_name?.localeCompare(b.full_name || '') || 
        a.email.localeCompare(b.email)
      );
      
      // Calculate combined pagination info (approximate)
      const totalFromResponses = [
        usersResponse?.total || 0,
        doctorsResponse?.total || 0,
        patientsResponse?.total || 0
      ];
      this.totalUsers = totalFromResponses.reduce((a, b) => a + b, 0);
      this.totalPages = Math.ceil(this.totalUsers / this.pagination.size);
      
      // Apply filters after loading
      this.applyFilters();
      this.loading = false;
    }).catch((err) => {
      this.error = 'Error al cargar usuarios';
      this.loading = false;
      console.error('Error loading users:', err);
    });
  }

  loadOffices(): void {
    this.officeService.getOffices().subscribe({
      next: (offices) => {
        this.offices = offices;
      },
      error: (err) => {
        console.error('Error loading offices:', err);
      }
    });
  }

  // Filter methods
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Apply role filter
      if (this.roleFilter !== 'all' && user.role !== this.roleFilter) {
        return false;
      }
      
      // Apply search filter
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchesEmail = user.email.toLowerCase().includes(query);
        const matchesName = user.full_name?.toLowerCase().includes(query);
        const matchesSpecialty = user.role === 'doctor' && 'specialty' in user && 
          user.specialty?.toLowerCase().includes(query);
        const matchesLicense = user.role === 'doctor' && 'license_number' in user && 
          user.license_number?.toLowerCase().includes(query);
        
        return matchesEmail || matchesName || matchesSpecialty || matchesLicense;
      }
      
      return true;
    });
  }

  onRoleFilterChange(): void {
    this.applyFilters();
  }

  setRoleFilter(role: UserRoleFilter): void {
    if (this.roleFilter === role) {
      return;
    }
    this.roleFilter = role;
    this.onRoleFilterChange();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.pagination.page = page;
    this.loadUsers();
  }

  onPageSizeChange(size: number): void {
    this.pagination.size = size;
    this.pagination.page = 1; // Reset to first page
    this.loadUsers();
  }

  showCreateUserForm(): void {
    this.editingUser = null;
    this.selectedRole = 'patient';
    this.resetForm();
    this.showCreateForm = true;
  }

  showEditUserForm(user: UserDto | DoctorDto | PatientDto): void {
    this.editingUser = user;
    this.selectedRole = user.role as 'patient' | 'doctor' | 'admin';
    this.resetForm();
    
    // Populate form with user data
    this.formData = {
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      role: user.role as 'patient' | 'doctor' | 'admin'
    };

    // Add role-specific fields
    if (user.role === 'patient' && 'date_of_birth' in user) {
      this.formData.date_of_birth = user.date_of_birth || '';
      this.formData.medical_record_number = user.medical_record_number || '';
      this.formData.emergency_contact = user.emergency_contact || '';
    } else if (user.role === 'doctor' && 'specialty' in user) {
      this.formData.specialty = user.specialty || '';
      this.formData.license_number = user.license_number || '';
      this.formData.years_experience = user.years_experience || 0;
      this.formData.office_id = user.office_id || undefined;
    } else if (user.role === 'admin' && 'admin_role' in user) {
      this.formData.admin_role = (user as any).admin_role || 'support';
      this.formData.permissions = (user as any).permissions || [];
    }

    this.showCreateForm = true;
  }

  resetForm(): void {
    this.formData = {
      email: '',
      password: '',
      full_name: '',
      is_active: true,
      is_superuser: false,
      role: this.selectedRole
    };
  }

  onRoleChange(): void {
    this.formData.role = this.selectedRole;
    this.resetForm();
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.editingUser = null;
    this.resetForm();
    // Force change detection to update the modal visibility
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (!this.formData.email.trim() || (!this.editingUser && !this.formData.password.trim())) {
      this.toastService.error('Email y contraseña son obligatorios');
      this.error = 'Email y contraseña son obligatorios';
      return;
    }

    this.loading = true;
    this.error = null;

    if (this.editingUser) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private createUser(): void {
    let serviceCall;
    switch (this.formData.role) {
      case 'doctor':
        serviceCall = this.doctorService.createDoctor(this.formData as DoctorCreate);
        break;
      case 'patient':
        serviceCall = this.patientService.createPatient(this.formData as any);
        break;
      case 'admin':
        serviceCall = this.userService.createUser(this.formData as any);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success(`${this.getRoleDisplayName(this.formData.role)} creado exitosamente`);
        this.loadUsers();
        this.cancelForm();
      },
      error: (err: any) => {
        this.loading = false;
        const errorMessage = `Error al crear ${this.getRoleDisplayName(this.formData.role)}. Reintentá más tarde.`;
        this.error = errorMessage;
        this.toastService.error(errorMessage);
        console.error('Error creating user:', err);
      }
    });
  }

  private updateUser(): void {
    if (!this.editingUser) return;

    const updateData: UserUpdate = {
      email: this.formData.email,
      full_name: this.formData.full_name || undefined,
      is_active: this.formData.is_active,
      is_superuser: this.formData.is_superuser,
      role: this.formData.role
    };

    // Only include password if provided
    if (this.formData.password.trim()) {
      updateData.password = this.formData.password;
    }

    // Add role-specific fields
    if (this.formData.role === 'patient') {
      updateData.date_of_birth = this.formData.date_of_birth || undefined;
      updateData.medical_record_number = this.formData.medical_record_number || undefined;
      updateData.emergency_contact = this.formData.emergency_contact || undefined;
    } else if (this.formData.role === 'doctor') {
      updateData.specialty = this.formData.specialty || undefined;
      updateData.license_number = this.formData.license_number || undefined;
      updateData.years_experience = this.formData.years_experience || undefined;
      updateData.office_id = this.formData.office_id || undefined;
    } else if (this.formData.role === 'admin') {
      updateData.admin_role = this.formData.admin_role || undefined;
      updateData.permissions = this.formData.permissions || undefined;
    }

    let serviceCall;
    switch (this.formData.role) {
      case 'doctor':
        serviceCall = this.doctorService.updateDoctor(this.editingUser.id, updateData as DoctorUpdate);
        break;
      case 'patient':
        serviceCall = this.patientService.updatePatient(this.editingUser.id, updateData as any);
        break;
      case 'admin':
        serviceCall = this.userService.updateUser(this.editingUser.id, updateData as any);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success(`${this.getRoleDisplayName(this.formData.role)} actualizado correctamente`);
        this.loadUsers();
        this.cancelForm();
      },
      error: (err: any) => {
        this.loading = false;
        const errorMessage = `Error al actualizar ${this.getRoleDisplayName(this.formData.role)}. Reintentá más tarde.`;
        this.error = errorMessage;
        this.toastService.error(errorMessage);
        console.error('Error updating user:', err);
      }
    });
  }

  deleteUser(user: UserDto | DoctorDto | PatientDto): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${user.full_name || user.email}"?`)) {
      return;
    }

    this.loading = true;
    this.error = null;

    let serviceCall;
    switch (user.role) {
      case 'doctor':
        serviceCall = this.doctorService.deleteDoctor(user.id);
        break;
      case 'patient':
        serviceCall = this.patientService.deletePatient(user.id);
        break;
      case 'admin':
        serviceCall = this.userService.deleteUser(user.id);
        break;
      default:
        this.error = 'Tipo de usuario no válido';
        this.loading = false;
        return;
    }

    serviceCall.subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success(`${this.getRoleDisplayName(user.role)} eliminado correctamente`);
        // Close the modal and reset form state
        this.cancelForm();
        // Refresh the list after closing the modal
        this.loadUsers();
      },
      error: (err: any) => {
        this.loading = false;
        const errorMessage = `Error al eliminar ${this.getRoleDisplayName(user.role)}. Reintentá más tarde.`;
        this.error = errorMessage;
        this.toastService.error(errorMessage);
        console.error('Error deleting user:', err);
      }
    });
  }

  getOfficeName(officeId: number | null | undefined): string {
    if (!officeId) return 'Sin asignar';
    const office = this.offices.find(o => o.id === officeId);
    return office ? (office.name || office.code) : 'Consultorio no encontrado';
  }

  getRoleDisplayName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'patient': 'Paciente',
      'doctor': 'Doctor',
      'admin': 'Administrador'
    };
    return roleNames[role] || role;
  }

  getRoleIcon(role: string): string {
    const roleIcons: { [key: string]: string } = {
      'patient': 'person',
      'doctor': 'medical_services',
      'admin': 'admin_panel_settings'
    };
    return roleIcons[role] || 'person';
  }

  getStats(): { [key: string]: number } {
    const stats = {
      total: this.users.length,
      patients: this.users.filter(u => u.role === 'patient').length,
      doctors: this.users.filter(u => u.role === 'doctor').length,
      admins: this.users.filter(u => u.role === 'admin').length
    };
    return stats;
  }
}
