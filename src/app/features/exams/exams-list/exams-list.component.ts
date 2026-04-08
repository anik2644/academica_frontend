import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractList, getErrorMessage, readBoolean, readString } from '../../../core/utils/api-response.utils';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface ExamRow {
  id: string;
  name: string;
  examType: string;
  className: string;
  academicYearLabel: string;
  dateRange: string;
  resultPublished: boolean;
  isActive: boolean;
}

interface SelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageLoaderComponent, FormModalComponent],
  template: `
    <section class="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
      <div class="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-slate-950 via-primary-900 to-accent-700"></div>
      <div class="relative p-6 sm:p-8">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Exams</h1>
          </div>
          <button (click)="openCreateModal()" class="rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
            Create Exam
          </button>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div *ngFor="let stat of stats" class="rounded-2xl border border-slate-200/70 bg-white/95 p-4">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ stat.label }}</div>
            <div class="mt-3 text-3xl font-semibold text-slate-950">{{ stat.value }}</div>
            <div class="mt-3 text-sm text-slate-600">{{ stat.detail }}</div>
          </div>
        </div>

        <div *ngIf="errorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </div>

        <div *ngIf="isLoading" class="mt-6">
          <app-page-loader
            title="Loading exams"
            message="Fetching exam definitions and resolving class-year context."
            [blockHeights]="[96, 96, 96]"
          ></app-page-loader>
        </div>

        <div *ngIf="!isLoading" class="mt-6 grid gap-4 lg:grid-cols-2">
          <article *ngFor="let exam of rows" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">{{ exam.examType }}</div>
                <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ exam.name }}</h2>
              </div>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="exam.resultPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                {{ exam.resultPublished ? 'Published' : 'Draft' }}
              </span>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Class</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.className }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Academic Year</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.academicYearLabel }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Window</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.dateRange }}</div>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span class="text-sm text-slate-500">{{ exam.isActive ? 'Active exam record' : 'Inactive exam record' }}</span>
              <div class="flex items-center gap-2">
                <button (click)="openDeleteModal(exam)" class="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50">
                  Delete
                </button>
                <a [routerLink]="['/exams', exam.id]" class="rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">
                  Open details
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Create Exam Modal -->
    <app-form-modal
      [open]="showCreateModal"
      title="Create Exam"
      confirmText="Create"
      loadingText="Creating..."
      [loading]="isSaving"
      (close)="showCreateModal = false"
      (confirm)="saveExam()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Name *</span>
          <input [(ngModel)]="formData.name" type="text" placeholder="e.g. First Term Examination" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Exam Type *</span>
          <input [(ngModel)]="formData.exam_type" type="text" placeholder="e.g. midterm, final" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Academic Year *</span>
            <select [(ngModel)]="formData.academic_year_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option [ngValue]="0" disabled>Select academic year</option>
              <option *ngFor="let year of yearOptions" [ngValue]="year.id">{{ year.label }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Class *</span>
            <select [(ngModel)]="formData.class_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option [ngValue]="0" disabled>Select class</option>
              <option *ngFor="let cls of classOptions" [ngValue]="cls.id">{{ cls.label }}</option>
            </select>
          </label>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Start Date *</span>
            <input [(ngModel)]="formData.start_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">End Date *</span>
            <input [(ngModel)]="formData.end_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <textarea [(ngModel)]="formData.remarks" rows="2" placeholder="Optional notes" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>

    <!-- Delete Confirmation Modal -->
    <app-form-modal
      [open]="showDeleteModal"
      title="Delete Exam"
      [subtitle]="'Are you sure you want to delete \\'' + (deletingRow?.name || '') + '\\'?'"
      confirmText="Delete"
      loadingText="Deleting..."
      [loading]="isDeleting"
      [danger]="true"
      (close)="showDeleteModal = false"
      (confirm)="confirmDelete()"
    >
      <p class="text-sm text-slate-600">This action cannot be undone. All schedules and results associated with this exam may be affected.</p>
    </app-form-modal>
  `,
})
export class ExamsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: ExamRow[] = [];

  yearOptions: SelectOption[] = [];
  classOptions: SelectOption[] = [];

  showCreateModal = false;
  isSaving = false;
  formData = this.emptyForm();

  showDeleteModal = false;
  isDeleting = false;
  deletingRow: ExamRow | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      exams: this.api.listExams(),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ exams, years, classes }) => {
        const yearList = extractList<unknown>(years);
        const classList = extractList<unknown>(classes);
        const yearMap = new Map(yearList.map((item) => [readString(item, 'id'), readString(item, 'label')]));
        const classMap = new Map(classList.map((item) => [readString(item, 'id'), readString(item, 'name')]));

        this.yearOptions = yearList.map((item) => ({ id: readString(item, 'id'), label: readString(item, 'label') }));
        this.classOptions = classList.map((item) => ({ id: readString(item, 'id'), label: readString(item, 'name') }));

        this.rows = extractList<unknown>(exams).map((item) => ({
          id: readString(item, 'id'),
          name: readString(item, 'name'),
          examType: this.formatLabel(readString(item, 'examType')),
          className: classMap.get(readString(item, 'classId')) || readString(item, 'classId'),
          academicYearLabel: yearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
          dateRange: this.buildDateRange(readString(item, 'startDate'), readString(item, 'endDate')),
          resultPublished: readBoolean(item, 'resultPublished'),
          isActive: readBoolean(item, 'isActive'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Exams could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  get stats() {
    return [
      { label: 'Exams', value: this.rows.length, detail: 'All exam definitions returned by the live API.' },
      { label: 'Published', value: this.rows.filter((row) => row.resultPublished).length, detail: 'Exams with published result state.' },
      { label: 'Active', value: this.rows.filter((row) => row.isActive).length, detail: 'Exams currently marked active.' },
      { label: 'Classes Covered', value: new Set(this.rows.map((row) => row.className)).size, detail: 'Distinct classes represented in the exam list.' },
    ];
  }

  openCreateModal(): void {
    this.formData = this.emptyForm();
    this.showCreateModal = true;
  }

  saveExam(): void {
    if (!this.formData.name || !this.formData.exam_type || !this.formData.academic_year_id || !this.formData.class_id || !this.formData.start_date || !this.formData.end_date) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      name: this.formData.name,
      exam_type: this.formData.exam_type,
      academic_year_id: Number(this.formData.academic_year_id),
      class_id: Number(this.formData.class_id),
      start_date: this.formData.start_date,
      end_date: this.formData.end_date,
      remarks: this.formData.remarks || null,
    };
    this.api.createExam(payload).subscribe({
      next: () => {
        this.notify.success('Exam created successfully.');
        this.showCreateModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to create exam.'));
        this.isSaving = false;
      },
    });
  }

  openDeleteModal(exam: ExamRow): void {
    this.deletingRow = exam;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteExam(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Exam deleted successfully.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete exam.'));
        this.isDeleting = false;
      },
    });
  }

  private emptyForm() {
    return { name: '', exam_type: '', academic_year_id: 0, class_id: 0, start_date: '', end_date: '', remarks: '' };
  }

  private formatLabel(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not available';
  }

  private buildDateRange(start: string, end: string): string {
    if (!start && !end) {
      return 'Dates unavailable';
    }

    const startLabel = start ? formatDate(start, 'MMM d', 'en-US') : 'N/A';
    const endLabel = end ? formatDate(end, 'MMM d, y', 'en-US') : 'N/A';
    return `${startLabel} to ${endLabel}`;
  }
}
