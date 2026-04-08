import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  extractList,
  getErrorMessage,
  readBoolean,
  readNumber,
  readString,
} from '../../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface TeacherRow {
  id: string;
  teacherId: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phonePrimary: string;
  designation: string;
  department: string;
  employmentType: string;
  joinDate: string;
  specialization: string;
  previousExperienceYears: number | null;
  presentAddress: string;
  permanentAddress: string;
  bloodType: string;
  religion: string;
  nationality: string;
  nidNumber: string;
  passportNumber: string;
  additionalNotes: string;
  status: string;
  isActive: boolean;
}

interface TeacherFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  email: string;
  phone_primary: string;
  designation: string;
  department: string;
  employment_type: string;
  join_date: string;
  specialization: string;
  previous_experience_years: number | null;
  present_address: string;
  permanent_address: string;
  blood_type: string;
  religion: string;
  nationality: string;
  nid_number: string;
  passport_number: string;
  additional_notes: string;
  status: string;
}

function emptyFormData(): TeacherFormData {
  return {
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'male',
    date_of_birth: '',
    email: '',
    phone_primary: '',
    designation: '',
    department: '',
    employment_type: '',
    join_date: '',
    specialization: '',
    previous_experience_years: null,
    present_address: '',
    permanent_address: '',
    blood_type: '',
    religion: '',
    nationality: '',
    nid_number: '',
    passport_number: '',
    additional_notes: '',
    status: 'active',
  };
}

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AcademicResourcePageComponent, FormModalComponent],
  templateUrl: './teachers-list.component.html',
  styleUrl: './teachers-list.component.css',
})
export class TeachersListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = true;
  errorMessage = '';
  rows: TeacherRow[] = [];

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: TeacherRow | null = null;
  deletingRow: TeacherRow | null = null;
  formData: TeacherFormData = emptyFormData();

  readonly columns: AcademicResourceColumn<TeacherRow>[] = [
    {
      label: 'Teacher',
      value: (row) => row.fullName,
      secondary: (row) => row.teacherId || row.id,
      badge: (row) => (row.isActive ? 'Active' : 'Inactive'),
    },
    {
      label: 'Role & Department',
      value: (row) => row.designation || 'Designation unavailable',
      secondary: (row) => row.department || 'Department unavailable',
    },
    {
      label: 'Contact',
      value: (row) => row.email || 'Email unavailable',
      secondary: (row) => row.phonePrimary || 'Phone unavailable',
    },
    {
      label: 'Employment',
      value: (row) => this.formatEmployment(row.employmentType),
      secondary: (row) =>
        `${this.formatDate(row.joinDate)} • ${this.formatExperience(row.previousExperienceYears)}`,
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const activeCount = this.rows.filter((row) => row.isActive).length;
    const permanentCount = this.rows.filter(
      (row) => row.employmentType.toLowerCase() === 'permanent'
    ).length;
    const departments = new Set(this.rows.map((row) => row.department).filter(Boolean)).size;
    const avgExperience = this.rows.length
      ? Math.round(
          this.rows.reduce((sum, row) => sum + (row.previousExperienceYears ?? 0), 0) /
            this.rows.length
        )
      : 0;

    return [
      {
        label: 'Total Faculty',
        value: this.rows.length,
        detail: 'All teacher records returned by the live API.',
        tone: 'primary',
      },
      {
        label: 'Active Teachers',
        value: activeCount,
        detail: 'Teachers currently marked active in the backend.',
        tone: 'accent',
      },
      {
        label: 'Departments',
        value: departments,
        detail: 'Distinct departments represented in the dataset.',
        tone: 'amber',
      },
      {
        label: 'Avg Experience',
        value: `${avgExperience} yrs`,
        detail: 'Average prior experience from available faculty records.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: TeacherRow): string =>
    [
      row.fullName,
      row.teacherId,
      row.designation,
      row.department,
      row.email,
      row.phonePrimary,
      row.gender,
    ].join(' ');

  viewTeacher(row: TeacherRow): void {
    this.router.navigate(['/teachers', row.id]);
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listTeachers().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapTeacher(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Teachers could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = emptyFormData();
    this.showFormModal = true;
  }

  openEditModal(row: TeacherRow): void {
    this.editingRow = row;
    this.formData = {
      first_name: row.firstName,
      middle_name: row.middleName,
      last_name: row.lastName,
      gender: row.gender || 'male',
      date_of_birth: row.dateOfBirth,
      email: row.email,
      phone_primary: row.phonePrimary,
      designation: row.designation,
      department: row.department,
      employment_type: row.employmentType,
      join_date: row.joinDate,
      specialization: row.specialization,
      previous_experience_years: row.previousExperienceYears,
      present_address: row.presentAddress,
      permanent_address: row.permanentAddress,
      blood_type: row.bloodType,
      religion: row.religion,
      nationality: row.nationality,
      nid_number: row.nidNumber,
      passport_number: row.passportNumber,
      additional_notes: row.additionalNotes,
      status: row.status || 'active',
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: TeacherRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (
      !this.formData.first_name ||
      !this.formData.last_name ||
      !this.formData.email ||
      !this.formData.phone_primary ||
      !this.formData.designation ||
      !this.formData.department ||
      !this.formData.employment_type ||
      !this.formData.join_date
    ) {
      this.notify.warning('Please fill all required fields.');
      return;
    }

    this.isSaving = true;
    const payload: Record<string, unknown> = { ...this.formData };

    const request$ = this.editingRow
      ? this.api.updateTeacher(this.editingRow.id, payload)
      : this.api.createTeacher(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Teacher updated.' : 'Teacher created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save teacher.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteTeacher(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Teacher deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete teacher.'));
        this.isDeleting = false;
      },
    });
  }

  private mapTeacher(item: unknown): TeacherRow {
    const firstName = readString(item, 'firstName', 'first_name');
    const middleName = readString(item, 'middleName', 'middle_name');
    const lastName = readString(item, 'lastName', 'last_name');
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    const status = readString(item, 'status');

    return {
      id: readString(item, 'id'),
      teacherId: readString(item, 'teacherId'),
      fullName,
      firstName,
      middleName,
      lastName,
      gender: readString(item, 'gender'),
      dateOfBirth: readString(item, 'dateOfBirth', 'date_of_birth'),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary', 'phone_primary'),
      designation: readString(item, 'designation'),
      department: readString(item, 'department'),
      employmentType: readString(item, 'employmentType', 'employment_type'),
      joinDate: readString(item, 'joinDate', 'join_date'),
      specialization: readString(item, 'specialization'),
      previousExperienceYears: readNumber(item, 'previousExperienceYears', 'previous_experience_years'),
      presentAddress: readString(item, 'presentAddress', 'present_address'),
      permanentAddress: readString(item, 'permanentAddress', 'permanent_address'),
      bloodType: readString(item, 'bloodType', 'blood_type'),
      religion: readString(item, 'religion'),
      nationality: readString(item, 'nationality'),
      nidNumber: readString(item, 'nidNumber', 'nid_number'),
      passportNumber: readString(item, 'passportNumber', 'passport_number'),
      additionalNotes: readString(item, 'additionalNotes', 'additional_notes'),
      status,
      isActive: status ? status === 'active' : readBoolean(item, 'isActive', 'is_active'),
    };
  }

  private formatEmployment(value: string): string {
    if (!value) {
      return 'Not specified';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatExperience(value: number | null): string {
    return value === null ? 'Experience not listed' : `${value} years experience`;
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Join date unavailable';
  }
}
