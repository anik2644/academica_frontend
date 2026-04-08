import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  extractList,
  getErrorMessage,
  readBoolean,
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

interface SubjectRow {
  id: string;
  subjectCode: string;
  name: string;
  description: string;
  subjectType: string;
  category: string;
  isElective: boolean;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  template: `
    <app-academic-resource-page
      title="Subjects"
      subtitle="A curriculum-focused interface for live subject inventory, teaching mode, and category coverage. This page is populated directly from your subjects endpoint."
      dataSourceLabel="GET /api/v1/subjects"
      tableTitle="Subject Catalogue"
      tableSubtitle="Review codes, categories, delivery type, and elective mix from the live curriculum dataset."
      searchPlaceholder="Search by subject name, code, or category"
      emptyTitle="No subjects found"
      emptyMessage="Subject records will appear here as soon as the backend returns them."
      addLabel="Add Subject"
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
      (edit)="openEditModal($event)"
      (delete)="openDeleteModal($event)"
    ></app-academic-resource-page>

    <!-- Add/Edit Modal -->
    <app-form-modal
      [open]="showFormModal"
      [title]="editingRow ? 'Edit Subject' : 'Add Subject'"
      [confirmText]="editingRow ? 'Update' : 'Create'"
      [loadingText]="editingRow ? 'Updating...' : 'Creating...'"
      [loading]="isSaving"
      (close)="showFormModal = false"
      (confirm)="saveForm()"
    >
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Subject Code *</span>
            <input [(ngModel)]="formData.subjectCode" type="text" placeholder="e.g. MATH101" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Name *</span>
            <input [(ngModel)]="formData.name" type="text" placeholder="e.g. Mathematics" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Description</span>
          <textarea [(ngModel)]="formData.description" rows="3" placeholder="Brief description of the subject" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Subject Type</span>
            <select [(ngModel)]="formData.subjectType" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="theory">Theory</option>
              <option value="practical">Practical</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Category</span>
            <input [(ngModel)]="formData.category" type="text" placeholder="e.g. Science" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <div class="flex gap-6">
          <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input [(ngModel)]="formData.isElective" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            Elective subject
          </label>
          <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input [(ngModel)]="formData.isActive" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
            Active
          </label>
        </div>
      </div>
    </app-form-modal>

    <!-- Delete Confirmation -->
    <app-form-modal
      [open]="showDeleteModal"
      title="Delete Subject"
      [subtitle]="'Are you sure you want to delete \\'' + (deletingRow?.name || '') + '\\'?'"
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
export class SubjectsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: SubjectRow[] = [];

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: SubjectRow | null = null;
  deletingRow: SubjectRow | null = null;
  formData = { subjectCode: '', name: '', description: '', subjectType: 'theory', category: '', isElective: false, isActive: true };

  readonly columns: AcademicResourceColumn<SubjectRow>[] = [
    {
      label: 'Subject',
      value: (row) => row.name,
      secondary: (row) => row.description || row.subjectCode,
      badge: (row) => (row.isElective ? 'Elective' : 'Core'),
    },
    {
      label: 'Code & Category',
      value: (row) => row.subjectCode || 'No code',
      secondary: (row) => row.category || 'Uncategorised',
    },
    {
      label: 'Delivery Type',
      value: (row) => this.formatSubjectType(row.subjectType),
      secondary: (row) => (row.isActive ? 'Active in subject registry' : 'Inactive'),
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
    const activeCount = this.rows.filter((row) => row.isActive).length;
    const electiveCount = this.rows.filter((row) => row.isElective).length;
    const practicalCount = this.rows.filter((row) =>
      ['practical', 'both'].includes(row.subjectType.toLowerCase())
    ).length;

    return [
      {
        label: 'Total Subjects',
        value: this.rows.length,
        detail: 'All subjects returned from the live API.',
        tone: 'primary',
      },
      {
        label: 'Active Subjects',
        value: activeCount,
        detail: 'Subjects currently marked active in the backend.',
        tone: 'accent',
      },
      {
        label: 'Electives',
        value: electiveCount,
        detail: 'Optional subjects available in the current catalogue.',
        tone: 'amber',
      },
      {
        label: 'Practical Mix',
        value: practicalCount,
        detail: 'Subjects with practical or blended delivery modes.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: SubjectRow): string =>
    [row.name, row.subjectCode, row.category, row.description, row.id].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listSubjects().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapSubject(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Subjects could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = { subjectCode: '', name: '', description: '', subjectType: 'theory', category: '', isElective: false, isActive: true };
    this.showFormModal = true;
  }

  openEditModal(row: SubjectRow): void {
    this.editingRow = row;
    this.formData = {
      subjectCode: row.subjectCode,
      name: row.name,
      description: row.description,
      subjectType: row.subjectType || 'theory',
      category: row.category,
      isElective: row.isElective,
      isActive: row.isActive,
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: SubjectRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (!this.formData.subjectCode || !this.formData.name) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      subject_code: this.formData.subjectCode,
      name: this.formData.name,
      description: this.formData.description,
      subject_type: this.formData.subjectType,
      category: this.formData.category,
      is_elective: this.formData.isElective,
      is_active: this.formData.isActive,
    };

    const request$ = this.editingRow
      ? this.api.updateSubject(this.editingRow.id, payload)
      : this.api.createSubject(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Subject updated.' : 'Subject created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save subject.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteSubject(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Subject deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete subject.'));
        this.isDeleting = false;
      },
    });
  }

  private mapSubject(item: unknown): SubjectRow {
    return {
      id: readString(item, 'id'),
      subjectCode: readString(item, 'subjectCode', 'subject_code'),
      name: readString(item, 'name'),
      description: readString(item, 'description'),
      subjectType: readString(item, 'subjectType', 'subject_type'),
      category: readString(item, 'category'),
      isElective: readBoolean(item, 'isElective', 'is_elective'),
      isActive: readBoolean(item, 'isActive', 'is_active'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatSubjectType(value: string): string {
    if (!value) {
      return 'Not specified';
    }

    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
