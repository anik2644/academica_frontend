import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../core/utils/api-response.utils';
import { NotificationService } from '../../core/services/notification.service';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

interface PromotionRow {
  id: string;
  studentName: string;
  promotionType: string;
  fromYear: string;
  toYear: string;
  promotedBy: string;
  remarks: string;
  promotedAt: string;
  status: string;
}

interface DropdownOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  template: `
    <app-academic-resource-page
      title="Promotions"
      subtitle="A live promotion history board for student movement across academic years, including remarks and approving staff."
      dataSourceLabel="GET /api/v1/promotions"
      tableTitle="Promotion History"
      tableSubtitle="Review promoted students, origin and destination year, promotion type, and recorded promotion notes."
      searchPlaceholder="Search by student, teacher, type, or remark"
      emptyTitle="No promotions found"
      emptyMessage="Promotion records will appear here as soon as the backend returns them."
      addLabel="Create Promotion"
      [canEdit]="true"
      [canDelete]="false"
      [metrics]="metrics"
      [columns]="columns"
      [rows]="rows"
      [isLoading]="isLoading"
      [errorMessage]="errorMessage"
      [searchIndex]="searchIndex"
      (refresh)="loadData()"
      (add)="openCreateModal()"
      (edit)="openAssignModal($event)"
    ></app-academic-resource-page>

    <!-- Create Promotion Modal -->
    <app-form-modal
      [open]="showCreateModal"
      title="Create Promotion"
      confirmText="Create"
      loadingText="Creating..."
      [loading]="isSaving"
      (close)="showCreateModal = false"
      (confirm)="saveCreate()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Student *</span>
          <select [(ngModel)]="createForm.student_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [ngValue]="null" disabled>Select a student</option>
            <option *ngFor="let s of studentOptions" [ngValue]="s.id">{{ s.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">From Enrollment *</span>
          <select [(ngModel)]="createForm.from_enrollment_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [ngValue]="null" disabled>Select source enrollment</option>
            <option *ngFor="let e of enrollmentOptions" [ngValue]="e.id">{{ e.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">To Academic Year *</span>
          <select [(ngModel)]="createForm.to_academic_year_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [ngValue]="null" disabled>Select target academic year</option>
            <option *ngFor="let y of yearOptions" [ngValue]="y.id">{{ y.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Promotion Type *</span>
          <select [(ngModel)]="createForm.promotion_type" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option value="" disabled>Select type</option>
            <option value="promoted">Promoted</option>
            <option value="repeated">Repeated</option>
            <option value="transferred">Transferred</option>
            <option value="graduated">Graduated</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <textarea [(ngModel)]="createForm.remarks" rows="3" placeholder="Optional notes about this promotion" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>

    <!-- Assign Promotion Modal -->
    <app-form-modal
      [open]="showAssignModal"
      title="Assign Promotion"
      [subtitle]="'Assign a target enrollment for ' + (assigningRow?.studentName || '')"
      confirmText="Assign"
      loadingText="Assigning..."
      [loading]="isSaving"
      (close)="showAssignModal = false"
      (confirm)="saveAssign()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">To Enrollment *</span>
          <select [(ngModel)]="assignForm.to_enrollment_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [ngValue]="null" disabled>Select target enrollment</option>
            <option *ngFor="let e of enrollmentOptions" [ngValue]="e.id">{{ e.label }}</option>
          </select>
        </label>
      </div>
    </app-form-modal>
  `,
})
export class PromotionsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: PromotionRow[] = [];

  showCreateModal = false;
  showAssignModal = false;
  isSaving = false;
  assigningRow: PromotionRow | null = null;

  studentOptions: DropdownOption[] = [];
  enrollmentOptions: DropdownOption[] = [];
  yearOptions: DropdownOption[] = [];

  createForm = {
    student_id: null as string | null,
    from_enrollment_id: null as string | null,
    to_academic_year_id: null as string | null,
    promotion_type: '',
    remarks: '',
  };

  assignForm = {
    to_enrollment_id: null as string | null,
  };

  readonly columns: AcademicResourceColumn<PromotionRow>[] = [
    {
      label: 'Student',
      value: (row) => row.studentName,
      secondary: (row) => row.id,
      badge: (row) => row.promotionType,
    },
    {
      label: 'Academic Shift',
      value: (row) => row.fromYear,
      secondary: (row) => `to ${row.toYear}`,
    },
    {
      label: 'Processed By',
      value: (row) => row.promotedBy || 'Teacher unavailable',
      secondary: (row) => row.remarks || 'No remarks recorded',
    },
    {
      label: 'Promoted At',
      value: (row) => this.formatDate(row.promotedAt),
      secondary: () => 'Live backend record',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const promotedCount = this.rows.filter((row) => row.promotionType === 'promoted').length;
    const uniqueTeachers = new Set(this.rows.map((row) => row.promotedBy).filter(Boolean)).size;

    return [
      { label: 'Promotion Events', value: this.rows.length, detail: 'All promotion records from the live API.', tone: 'primary' },
      { label: 'Promoted', value: promotedCount, detail: 'Students advanced to the next level.', tone: 'accent' },
      { label: 'Reviewed By', value: uniqueTeachers, detail: 'Distinct staff members recorded as promoters.', tone: 'amber' },
      { label: 'With Remarks', value: this.rows.filter((row) => !!row.remarks).length, detail: 'Promotion records containing operational notes.', tone: 'rose' },
    ];
  }

  readonly searchIndex = (row: PromotionRow): string =>
    [row.studentName, row.promotionType, row.fromYear, row.toYear, row.promotedBy, row.remarks].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      promotions: this.api.listPromotions(),
      students: this.api.listStudents(),
      teachers: this.api.listTeachers(),
      years: this.api.listAcademicYears(),
      enrollments: this.api.listEnrollments(),
    }).subscribe({
      next: ({ promotions, students, teachers, years, enrollments }) => {
        const studentList = extractList<unknown>(students);
        const studentMap = new Map(
          studentList.map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );
        const teacherMap = new Map(
          extractList<unknown>(teachers).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );
        const yearList = extractList<unknown>(years);
        const yearMap = new Map(
          yearList.map((item) => [readString(item, 'id'), readString(item, 'label')])
        );
        const enrollmentList = extractList<unknown>(enrollments);

        // Populate dropdown options
        this.studentOptions = studentList.map((item) => ({
          id: readString(item, 'id'),
          label: [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
        }));
        this.yearOptions = yearList.map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label'),
        }));
        this.enrollmentOptions = enrollmentList.map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label') || `Enrollment #${readString(item, 'id')}`,
        }));

        this.rows = extractList<unknown>(promotions).map((item) => ({
          id: readString(item, 'id'),
          studentName: studentMap.get(readString(item, 'studentId')) || 'Student unavailable',
          promotionType: readString(item, 'promotionType'),
          fromYear: yearMap.get(readString(item, 'fromAcademicYearId')) || readString(item, 'fromAcademicYearId'),
          toYear: yearMap.get(readString(item, 'toAcademicYearId')) || readString(item, 'toAcademicYearId'),
          promotedBy: teacherMap.get(readString(item, 'promotedBy')) || readString(item, 'promotedBy'),
          remarks: readString(item, 'remarks'),
          promotedAt: readString(item, 'promotedAt'),
          status: readString(item, 'status'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Promotions could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openCreateModal(): void {
    this.createForm = {
      student_id: null,
      from_enrollment_id: null,
      to_academic_year_id: null,
      promotion_type: '',
      remarks: '',
    };
    this.showCreateModal = true;
  }

  openAssignModal(row: PromotionRow): void {
    this.assigningRow = row;
    this.assignForm = { to_enrollment_id: null };
    this.showAssignModal = true;
  }

  saveCreate(): void {
    if (!this.createForm.student_id || !this.createForm.from_enrollment_id || !this.createForm.to_academic_year_id || !this.createForm.promotion_type) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      student_id: Number(this.createForm.student_id),
      from_enrollment_id: Number(this.createForm.from_enrollment_id),
      to_academic_year_id: Number(this.createForm.to_academic_year_id),
      promotion_type: this.createForm.promotion_type,
      remarks: this.createForm.remarks || undefined,
    };

    this.api.createPromotion(payload).subscribe({
      next: () => {
        this.notify.success('Promotion created.');
        this.showCreateModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to create promotion.'));
        this.isSaving = false;
      },
    });
  }

  saveAssign(): void {
    if (!this.assigningRow || !this.assignForm.to_enrollment_id) {
      this.notify.warning('Please select a target enrollment.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      to_enrollment_id: Number(this.assignForm.to_enrollment_id),
    };

    this.api.assignPromotion(this.assigningRow.id, payload).subscribe({
      next: () => {
        this.notify.success('Promotion assigned.');
        this.showAssignModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to assign promotion.'));
        this.isSaving = false;
      },
    });
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
