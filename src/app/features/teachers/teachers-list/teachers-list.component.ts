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
  template: `
    <app-academic-resource-page
      title="Teachers"
      subtitle="A live faculty operations view for staffing, department spread, contract mix, and contact visibility. This page is bound directly to your teachers API."
      dataSourceLabel="GET /api/v1/teachers"
      tableTitle="Faculty Directory"
      tableSubtitle="Review teacher identity, role, department, employment type, and onboarding timeline from the live backend."
      searchPlaceholder="Search by teacher, department, designation, or email"
      emptyTitle="No teachers found"
      emptyMessage="Teacher records from the backend will appear here automatically."
      addLabel="Add Teacher"
      [canView]="true"
      [canEdit]="true"
      [canDelete]="true"
      [metrics]="metrics"
      [columns]="columns"
      [rows]="rows"
      [isLoading]="isLoading"
      [errorMessage]="errorMessage"
      [searchIndex]="searchIndex"
      (refresh)="loadData()"
      (view)="viewTeacher($event)"
      (add)="openAddModal()"
      (edit)="openEditModal($event)"
      (delete)="openDeleteModal($event)"
    ></app-academic-resource-page>

    <!-- Add/Edit Modal -->
    <app-form-modal
      [open]="showFormModal"
      [title]="editingRow ? 'Edit Teacher' : 'Add Teacher'"
      [confirmText]="editingRow ? 'Update' : 'Create'"
      [loadingText]="editingRow ? 'Updating...' : 'Creating...'"
      [loading]="isSaving"
      [wide]="true"
      (close)="showFormModal = false"
      (confirm)="saveForm()"
    >
      <div class="space-y-6">
        <!-- Personal Information -->
        <div>
          <h4 class="mb-3 text-sm font-semibold text-slate-800">Personal Information</h4>
          <div class="grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">First Name *</span>
              <input [(ngModel)]="formData.first_name" type="text" placeholder="e.g. John"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Middle Name</span>
              <input [(ngModel)]="formData.middle_name" type="text" placeholder="e.g. Michael"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Last Name *</span>
              <input [(ngModel)]="formData.last_name" type="text" placeholder="e.g. Doe"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Gender</span>
              <select [(ngModel)]="formData.gender"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Date of Birth</span>
              <input [(ngModel)]="formData.date_of_birth" type="date"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Blood Type</span>
              <input [(ngModel)]="formData.blood_type" type="text" placeholder="e.g. A+"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Religion</span>
              <input [(ngModel)]="formData.religion" type="text" placeholder="e.g. Islam"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Nationality</span>
              <input [(ngModel)]="formData.nationality" type="text" placeholder="e.g. Bangladeshi"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Status</span>
              <select [(ngModel)]="formData.status"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </label>
          </div>
        </div>

        <!-- Contact Information -->
        <div>
          <h4 class="mb-3 text-sm font-semibold text-slate-800">Contact Information</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Email *</span>
              <input [(ngModel)]="formData.email" type="email" placeholder="e.g. john.doe@school.edu"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Phone (Primary) *</span>
              <input [(ngModel)]="formData.phone_primary" type="text" placeholder="e.g. +880 1700 000000"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Present Address</span>
              <input [(ngModel)]="formData.present_address" type="text" placeholder="Current residential address"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Permanent Address</span>
              <input [(ngModel)]="formData.permanent_address" type="text" placeholder="Permanent residential address"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
        </div>

        <!-- Employment Details -->
        <div>
          <h4 class="mb-3 text-sm font-semibold text-slate-800">Employment Details</h4>
          <div class="grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Designation *</span>
              <input [(ngModel)]="formData.designation" type="text" placeholder="e.g. Senior Lecturer"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Department *</span>
              <input [(ngModel)]="formData.department" type="text" placeholder="e.g. Mathematics"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Employment Type *</span>
              <input [(ngModel)]="formData.employment_type" type="text" placeholder="e.g. Permanent"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Join Date *</span>
              <input [(ngModel)]="formData.join_date" type="date"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Specialization</span>
              <input [(ngModel)]="formData.specialization" type="text" placeholder="e.g. Algebra"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Previous Experience (Years)</span>
              <input [(ngModel)]="formData.previous_experience_years" type="number" placeholder="e.g. 5" min="0"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
        </div>

        <!-- Additional Information -->
        <div>
          <h4 class="mb-3 text-sm font-semibold text-slate-800">Additional Information</h4>
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">NID Number</span>
              <input [(ngModel)]="formData.nid_number" type="text" placeholder="National ID number"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Passport Number</span>
              <input [(ngModel)]="formData.passport_number" type="text" placeholder="Passport number"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </label>
          </div>
          <label class="mt-4 block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Additional Notes</span>
            <textarea [(ngModel)]="formData.additional_notes" rows="3" placeholder="Any additional notes about the teacher"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
          </label>
        </div>
      </div>
    </app-form-modal>

    <!-- Delete Confirmation -->
    <app-form-modal
      [open]="showDeleteModal"
      title="Delete Teacher"
      [subtitle]="'Are you sure you want to delete \\'' + (deletingRow?.fullName || '') + '\\'?'"
      confirmText="Delete"
      loadingText="Deleting..."
      [loading]="isDeleting"
      [danger]="true"
      (close)="showDeleteModal = false"
      (confirm)="confirmDelete()"
    >
      <p class="text-sm text-slate-600">This action cannot be undone. All related data may be affected.</p>
    </app-form-modal>
  `,
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
