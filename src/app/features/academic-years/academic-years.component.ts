import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  extractItem,
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

interface AcademicYearRow {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-academic-years',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  template: `
    <app-academic-resource-page
      title="Academic Years"
      tableTitle="Academic Year Registry"
      tableSubtitle="Track the active year, year windows, and timeline history."
      searchPlaceholder="Search by label or year dates"
      emptyTitle="No academic years found"
      emptyMessage="Create an academic year to get started."
      addLabel="Add Academic Year"
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
      [title]="editingRow ? 'Edit Academic Year' : 'Add Academic Year'"
      [confirmText]="editingRow ? 'Update' : 'Create'"
      [loadingText]="editingRow ? 'Updating...' : 'Creating...'"
      [loading]="isSaving"
      (close)="showFormModal = false"
      (confirm)="saveForm()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Label *</span>
          <input [(ngModel)]="formData.label" type="text" placeholder="e.g. 2025-2026" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Start Date *</span>
            <input [(ngModel)]="formData.startDate" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">End Date *</span>
            <input [(ngModel)]="formData.endDate" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input [(ngModel)]="formData.isCurrent" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          Set as current academic year
        </label>
      </div>
    </app-form-modal>

    <!-- Delete Confirmation -->
    <app-form-modal
      [open]="showDeleteModal"
      title="Delete Academic Year"
      [subtitle]="'Are you sure you want to delete \\'' + (deletingRow?.label || '') + '\\'?'"
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
export class AcademicYearsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: AcademicYearRow[] = [];
  currentYearLabel = 'Not set';

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: AcademicYearRow | null = null;
  deletingRow: AcademicYearRow | null = null;
  formData = { label: '', startDate: '', endDate: '', isCurrent: false };

  readonly columns: AcademicResourceColumn<AcademicYearRow>[] = [
    {
      label: 'Academic Year',
      value: (row) => row.label,
      secondary: (row) => `ID ${row.id}`,
      badge: (row) => (row.isCurrent ? 'Current' : ''),
    },
    {
      label: 'Timeline',
      value: (row) => this.formatDateRange(row.startDate, row.endDate),
      secondary: (row) => this.getDurationLabel(row.startDate, row.endDate),
    },
    {
      label: 'Status',
      value: (row) => (row.isCurrent ? 'Active session' : 'Archived session'),
    },
    {
      label: 'Created',
      value: (row) => this.formatDate(row.createdAt),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const archivedCount = this.rows.filter((row) => !row.isCurrent).length;
    return [
      { label: 'Current Year', value: this.currentYearLabel, detail: 'The active academic session.', tone: 'primary' },
      { label: 'Total Years', value: this.rows.length, detail: 'All academic year records.', tone: 'accent' },
      { label: 'Archived', value: archivedCount, detail: 'Past sessions for reference.', tone: 'amber' },
      { label: 'Latest', value: this.rows[0]?.label ?? 'N/A', detail: 'Most recent year in dataset.', tone: 'rose' },
    ];
  }

  readonly searchIndex = (row: AcademicYearRow): string =>
    [row.label, row.startDate, row.endDate, row.id].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      years: this.api.listAcademicYears(),
      current: this.api.getCurrentAcademicYear(),
    }).subscribe({
      next: ({ years, current }) => {
        this.rows = extractList<unknown>(years).map((item) => this.mapRow(item));
        const currentYear = extractItem<unknown>(current);
        this.currentYearLabel = currentYear ? readString(currentYear, 'label') || 'Current year' : 'Not set';
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.currentYearLabel = 'Unavailable';
        this.errorMessage = getErrorMessage(error, 'Academic years could not be loaded.');
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = { label: '', startDate: '', endDate: '', isCurrent: false };
    this.showFormModal = true;
  }

  openEditModal(row: AcademicYearRow): void {
    this.editingRow = row;
    this.formData = { label: row.label, startDate: row.startDate, endDate: row.endDate, isCurrent: row.isCurrent };
    this.showFormModal = true;
  }

  openDeleteModal(row: AcademicYearRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (!this.formData.label || !this.formData.startDate || !this.formData.endDate) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      label: this.formData.label,
      start_date: this.formData.startDate,
      end_date: this.formData.endDate,
      is_current: this.formData.isCurrent,
    };

    const request$ = this.editingRow
      ? this.api.updateAcademicYear(this.editingRow.id, payload)
      : this.api.createAcademicYear(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Academic year updated.' : 'Academic year created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save academic year.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteAcademicYear(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Academic year deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete academic year.'));
        this.isDeleting = false;
      },
    });
  }

  private mapRow(item: unknown): AcademicYearRow {
    return {
      id: readString(item, 'id'),
      label: readString(item, 'label'),
      startDate: readString(item, 'startDate', 'start_date'),
      endDate: readString(item, 'endDate', 'end_date'),
      isCurrent: readBoolean(item, 'isCurrent', 'is_current'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }

  private formatDateRange(start: string, end: string): string {
    if (!start && !end) return 'No dates available';
    return `${this.formatDate(start)} to ${this.formatDate(end)}`;
  }

  private getDurationLabel(start: string, end: string): string {
    if (!start || !end) return '';
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return startYear === endYear ? `${startYear} session` : `${startYear} to ${endYear}`;
  }
}
