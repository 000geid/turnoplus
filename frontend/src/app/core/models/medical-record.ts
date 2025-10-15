export interface MedicalRecordDto {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordCreateRequest {
  patient_id: number;
  doctor_id?: number | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
}
