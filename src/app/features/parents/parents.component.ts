import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../core/utils/api-response.utils';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

interface ParentRow {
  id: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  phonePrimary: string;
  phoneSecondary: string;
  nationality: string;
  maritalStatus: string;
  religion: string;
  monthlyIncome: number | null;
  nidNumber: string;
  passportNumber: string;
  presentAddress: string;
  permanentAddress: string;
  employerName: string;
  employerContact: string;
  createdAt: string;
}

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AcademicResourcePageComponent, FormModalComponent],
  template: `
    <app-academic-resource-page
      title="Parents"
      subtitle="A live guardian directory for contact readiness, identity coverage, and address visibility. This page reads directly from your parents API."
      dataSourceLabel="GET /api/v1/parents"
      tableTitle="Parent & Guardian Directory"
      tableSubtitle="Review parent identity, phone coverage, address footprint, and verification fields from the live backend."
      searchPlaceholder="Search by parent, phone, email, or address"
      emptyTitle="No parents found"
      emptyMessage="Parent and guardian records from the backend will appear here automatically."
      addLabel="Add Parent"
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
      (add)="openAddModal()"
      (view)="viewParent($event)"
      (edit)="openEditModal($event)"
      (delete)="openDeleteModal($event)"
    ></app-academic-resource-page>

    <!-- Add/Edit Modal -->
    <app-form-modal
      [open]="showFormModal"
      [title]="editingRow ? 'Edit Parent' : 'Add Parent'"
      [confirmText]="editingRow ? 'Update' : 'Create'"
      [loadingText]="editingRow ? 'Updating...' : 'Creating...'"
      [loading]="isSaving"
      [wide]="true"
      (close)="showFormModal = false"
      (confirm)="saveForm()"
    >
      <div class="space-y-4">
        <!-- Name fields -->
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">First Name *</span>
            <input [(ngModel)]="formData.first_name" type="text" placeholder="e.g. Ahmed" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Middle Name</span>
            <input [(ngModel)]="formData.middle_name" type="text" placeholder="e.g. Karim" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Last Name *</span>
            <input [(ngModel)]="formData.last_name" type="text" placeholder="e.g. Rahman" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- Gender, DOB -->
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Gender</span>
            <select [(ngModel)]="formData.gender" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Date of Birth</span>
            <input [(ngModel)]="formData.date_of_birth" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- Contact -->
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input [(ngModel)]="formData.email" type="email" placeholder="e.g. parent@example.com" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Primary Phone *</span>
            <input [(ngModel)]="formData.phone_primary" type="text" placeholder="e.g. +8801XXXXXXXXX" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Secondary Phone</span>
            <input [(ngModel)]="formData.phone_secondary" type="text" placeholder="e.g. +8801XXXXXXXXX" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Nationality</span>
            <input [(ngModel)]="formData.nationality" type="text" placeholder="e.g. Bangladeshi" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- Personal details -->
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Marital Status</span>
            <input [(ngModel)]="formData.marital_status" type="text" placeholder="e.g. Married" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Religion</span>
            <input [(ngModel)]="formData.religion" type="text" placeholder="e.g. Islam" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Monthly Income</span>
            <input [(ngModel)]="formData.monthly_income" type="number" placeholder="e.g. 50000" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- ID fields -->
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">NID Number</span>
            <input [(ngModel)]="formData.nid_number" type="text" placeholder="e.g. 1234567890123" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Passport Number</span>
            <input [(ngModel)]="formData.passport_number" type="text" placeholder="e.g. AB1234567" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- Address fields -->
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Present Address</span>
            <input [(ngModel)]="formData.present_address" type="text" placeholder="e.g. House 12, Road 5, Dhanmondi" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Permanent Address</span>
            <input [(ngModel)]="formData.permanent_address" type="text" placeholder="e.g. Village Kashipur, Rajshahi" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <!-- Employer fields -->
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Employer Name</span>
            <input [(ngModel)]="formData.employer_name" type="text" placeholder="e.g. ABC Corporation" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Employer Contact</span>
            <input [(ngModel)]="formData.employer_contact" type="text" placeholder="e.g. +8802XXXXXXXX" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
      </div>
    </app-form-modal>

    <!-- Delete Confirmation -->
    <app-form-modal
      [open]="showDeleteModal"
      title="Delete Parent"
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
export class ParentsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = true;
  errorMessage = '';
  rows: ParentRow[] = [];

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: ParentRow | null = null;
  deletingRow: ParentRow | null = null;
  formData = this.emptyFormData();

  readonly columns: AcademicResourceColumn<ParentRow>[] = [
    {
      label: 'Parent',
      value: (row) => row.fullName,
      secondary: (row) => row.gender ? this.formatGender(row.gender) : row.id,
      badge: (row) => (row.nidNumber ? 'Verified ID' : ''),
    },
    {
      label: 'Contact',
      value: (row) => row.phonePrimary || 'Phone unavailable',
      secondary: (row) => row.email || 'Email unavailable',
    },
    {
      label: 'Address',
      value: (row) => row.presentAddress || 'Address unavailable',
      secondary: (row) => row.employerName || 'Employer not listed',
    },
    {
      label: 'Created',
      value: (row) => this.formatDate(row.createdAt),
      secondary: () => 'Live backend timestamp',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const withEmail = this.rows.filter((row) => !!row.email).length;
    const withNid = this.rows.filter((row) => !!row.nidNumber).length;
    const femaleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'female').length;
    const maleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'male').length;

    return [
      {
        label: 'Total Guardians',
        value: this.rows.length,
        detail: 'All parent records returned by the live API.',
        tone: 'primary',
      },
      {
        label: 'Email Coverage',
        value: withEmail,
        detail: 'Parents with email addresses available for communication.',
        tone: 'accent',
      },
      {
        label: 'ID Coverage',
        value: withNid,
        detail: 'Parents with a visible NID number in the current dataset.',
        tone: 'amber',
      },
      {
        label: 'Gender Split',
        value: `${maleCount}M / ${femaleCount}F`,
        detail: 'Visible parent gender distribution in the current dataset.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: ParentRow): string =>
    [
      row.fullName,
      row.phonePrimary,
      row.email,
      row.presentAddress,
      row.nidNumber,
      row.employerName,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listParents().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapParent(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Parents could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  viewParent(row: ParentRow): void {
    this.router.navigate(['/parents', row.id]);
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = this.emptyFormData();
    this.showFormModal = true;
  }

  openEditModal(row: ParentRow): void {
    this.editingRow = row;
    this.formData = {
      first_name: row.firstName,
      middle_name: row.middleName,
      last_name: row.lastName,
      gender: row.gender,
      date_of_birth: row.dateOfBirth,
      email: row.email,
      phone_primary: row.phonePrimary,
      phone_secondary: row.phoneSecondary,
      nationality: row.nationality,
      marital_status: row.maritalStatus,
      religion: row.religion,
      monthly_income: row.monthlyIncome,
      nid_number: row.nidNumber,
      passport_number: row.passportNumber,
      present_address: row.presentAddress,
      permanent_address: row.permanentAddress,
      employer_name: row.employerName,
      employer_contact: row.employerContact,
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: ParentRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (!this.formData.first_name || !this.formData.last_name || !this.formData.phone_primary) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      first_name: this.formData.first_name,
      middle_name: this.formData.middle_name,
      last_name: this.formData.last_name,
      gender: this.formData.gender,
      date_of_birth: this.formData.date_of_birth,
      email: this.formData.email,
      phone_primary: this.formData.phone_primary,
      phone_secondary: this.formData.phone_secondary,
      nationality: this.formData.nationality,
      marital_status: this.formData.marital_status,
      religion: this.formData.religion,
      monthly_income: this.formData.monthly_income,
      nid_number: this.formData.nid_number,
      passport_number: this.formData.passport_number,
      present_address: this.formData.present_address,
      permanent_address: this.formData.permanent_address,
      employer_name: this.formData.employer_name,
      employer_contact: this.formData.employer_contact,
    };

    const request$ = this.editingRow
      ? this.api.updateParent(this.editingRow.id, payload)
      : this.api.createParent(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Parent updated.' : 'Parent created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save parent.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteParent(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Parent deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete parent.'));
        this.isDeleting = false;
      },
    });
  }

  private emptyFormData() {
    return {
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: '',
      date_of_birth: '',
      email: '',
      phone_primary: '',
      phone_secondary: '',
      nationality: '',
      marital_status: '',
      religion: '',
      monthly_income: null as number | null,
      nid_number: '',
      passport_number: '',
      present_address: '',
      permanent_address: '',
      employer_name: '',
      employer_contact: '',
    };
  }

  private mapParent(item: unknown): ParentRow {
    const firstName = readString(item, 'firstName', 'first_name');
    const middleName = readString(item, 'middleName', 'middle_name');
    const lastName = readString(item, 'lastName', 'last_name');
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

    return {
      id: readString(item, 'id'),
      fullName,
      firstName,
      middleName,
      lastName,
      gender: readString(item, 'gender'),
      dateOfBirth: readString(item, 'dateOfBirth', 'date_of_birth'),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary', 'phone_primary'),
      phoneSecondary: readString(item, 'phoneSecondary', 'phone_secondary'),
      nationality: readString(item, 'nationality'),
      maritalStatus: readString(item, 'maritalStatus', 'marital_status'),
      religion: readString(item, 'religion'),
      monthlyIncome: (() => {
        const val = readString(item, 'monthlyIncome', 'monthly_income');
        return val ? Number(val) : null;
      })(),
      nidNumber: readString(item, 'nidNumber', 'nid_number'),
      passportNumber: readString(item, 'passportNumber', 'passport_number'),
      presentAddress: readString(item, 'presentAddress', 'present_address'),
      permanentAddress: readString(item, 'permanentAddress', 'permanent_address'),
      employerName: readString(item, 'employerName', 'employer_name'),
      employerContact: readString(item, 'employerContact', 'employer_contact'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatGender(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Gender unavailable';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
