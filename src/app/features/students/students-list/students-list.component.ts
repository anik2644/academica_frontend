import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../../core/utils/api-response.utils';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface StudentRow {
  id: string;
  studentId: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodType: string;
  email: string;
  phone: string;
  religion: string;
  nationality: string;
  presentAddress: string;
  permanentAddress: string;
  nidNumber: string;
  passportNumber: string;
  notes: string;
  status: string;
  createdAt: string;
}

interface StudentFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone: string;
  blood_type: string;
  religion: string;
  nationality: string;
  present_address: string;
  permanent_address: string;
  nid_number: string;
  passport_number: string;
  notes: string;
  status: string;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AcademicResourcePageComponent, FormModalComponent],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.css',
})
export class StudentsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = true;
  errorMessage = '';
  rows: StudentRow[] = [];

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: StudentRow | null = null;
  deletingRow: StudentRow | null = null;
  formData: StudentFormData = this.emptyFormData();

  readonly columns: AcademicResourceColumn<StudentRow>[] = [
    {
      label: 'Student',
      value: (row) => row.fullName,
      secondary: (row) => row.studentId || row.id,
      badge: (row) => this.getAgeLabel(row.dateOfBirth),
    },
    {
      label: 'Profile',
      value: (row) => this.formatGender(row.gender),
      secondary: (row) => row.bloodType || 'Blood type unavailable',
    },
    {
      label: 'Contact',
      value: (row) => row.email || 'Email unavailable',
      secondary: (row) => row.phone || row.presentAddress || 'Contact footprint unavailable',
    },
    {
      label: 'Location & Created',
      value: (row) => row.presentAddress || 'Address unavailable',
      secondary: (row) => this.formatDate(row.createdAt),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const maleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'male').length;
    const femaleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'female').length;
    const withBloodType = this.rows.filter((row) => !!row.bloodType).length;
    const averageAge = this.rows.length
      ? Math.round(
          this.rows.reduce((sum, row) => sum + this.getAge(row.dateOfBirth), 0) /
            this.rows.length
        )
      : 0;

    return [
      {
        label: 'Total Students',
        value: this.rows.length,
        detail: 'All student records returned by the live API.',
        tone: 'primary',
      },
      {
        label: 'Gender Split',
        value: `${maleCount}M / ${femaleCount}F`,
        detail: 'Visible student gender distribution in the current dataset.',
        tone: 'accent',
      },
      {
        label: 'Blood Data',
        value: withBloodType,
        detail: 'Students with blood-group information available.',
        tone: 'amber',
      },
      {
        label: 'Average Age',
        value: `${averageAge} yrs`,
        detail: 'Approximate age based on dates of birth.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: StudentRow): string =>
    [
      row.fullName,
      row.studentId,
      row.gender,
      row.bloodType,
      row.email,
      row.presentAddress,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listStudents().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapStudent(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Students could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  viewStudent(row: StudentRow): void {
    this.router.navigate(['/students', row.id]);
  }

  openEditModal(row: StudentRow): void {
    this.editingRow = row;
    this.formData = {
      first_name: row.firstName,
      middle_name: row.middleName,
      last_name: row.lastName,
      gender: row.gender,
      date_of_birth: row.dateOfBirth,
      email: row.email,
      phone: row.phone,
      blood_type: row.bloodType,
      religion: row.religion,
      nationality: row.nationality,
      present_address: row.presentAddress,
      permanent_address: row.permanentAddress,
      nid_number: row.nidNumber,
      passport_number: row.passportNumber,
      notes: row.notes,
      status: row.status,
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: StudentRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (!this.formData.first_name || !this.formData.last_name) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    if (!this.editingRow) return;

    this.isSaving = true;
    const payload: Record<string, unknown> = { ...this.formData };

    this.api.updateStudent(this.editingRow.id, payload).subscribe({
      next: () => {
        this.notify.success('Student updated.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update student.'));
        this.isSaving = false;
      },
    });
  }

  confirmDeactivate(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deactivateStudent(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Student deactivated.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to deactivate student.'));
        this.isDeleting = false;
      },
    });
  }

  private emptyFormData(): StudentFormData {
    return {
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: '',
      date_of_birth: '',
      email: '',
      phone: '',
      blood_type: '',
      religion: '',
      nationality: '',
      present_address: '',
      permanent_address: '',
      nid_number: '',
      passport_number: '',
      notes: '',
      status: 'active',
    };
  }

  private mapStudent(item: unknown): StudentRow {
    const firstName = readString(item, 'firstName', 'first_name');
    const middleName = readString(item, 'middleName', 'middle_name');
    const lastName = readString(item, 'lastName', 'last_name');
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

    return {
      id: readString(item, 'id'),
      studentId: readString(item, 'studentId'),
      fullName,
      firstName,
      middleName,
      lastName,
      gender: readString(item, 'gender'),
      dateOfBirth: readString(item, 'dateOfBirth', 'date_of_birth'),
      bloodType: readString(item, 'bloodType', 'blood_type'),
      email: readString(item, 'email'),
      phone: readString(item, 'phonePrimary', 'phone_primary', 'phone'),
      religion: readString(item, 'religion'),
      nationality: readString(item, 'nationality'),
      presentAddress: readString(item, 'presentAddress', 'present_address'),
      permanentAddress: readString(item, 'permanentAddress', 'permanent_address'),
      nidNumber: readString(item, 'nidNumber', 'nid_number'),
      passportNumber: readString(item, 'passportNumber', 'passport_number'),
      notes: readString(item, 'notes'),
      status: readString(item, 'status'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatGender(value: string): string {
    if (!value) {
      return 'Gender unavailable';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private getAgeLabel(dateOfBirth: string): string {
    if (!dateOfBirth) {
      return '';
    }

    return `${this.getAge(dateOfBirth)} yrs`;
  }

  private getAge(dateOfBirth: string): number {
    if (!dateOfBirth) {
      return 0;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
