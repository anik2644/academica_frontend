import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractList, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface EnrollmentOption {
  id: string;
  label: string;
}

interface LeaveRequestRow {
  id: string;
  studentName: string;
  leaveType: string;
  status: string;
  period: string;
  reason: string;
  requestedBy: string;
  reviewedBy: string;
  enrollmentId: string;
  fromDate: string;
  toDate: string;
}

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  template: `
    <app-academic-resource-page
      title="Leave Requests"
      subtitle="A live review board for student leave requests, request origins, approval state, and review ownership."
      dataSourceLabel="GET /api/v1/attendance/leave-requests"
      tableTitle="Leave Review Queue"
      tableSubtitle="Track pending and approved leave applications with the related student, request dates, and review staff."
      searchPlaceholder="Search by student, type, status, or requester"
      emptyTitle="No leave requests found"
      emptyMessage="Leave requests will appear here as soon as the backend returns them."
      addLabel="Submit Leave Request"
      [canEdit]="true"
      [canDelete]="false"
      [metrics]="metrics"
      [columns]="columns"
      [rows]="rows"
      [isLoading]="isLoading"
      [errorMessage]="errorMessage"
      [searchIndex]="searchIndex"
      (refresh)="loadData()"
      (add)="openAddModal()"
      (edit)="openReviewModal($event)"
    ></app-academic-resource-page>

    <!-- Submit Leave Request Modal -->
    <app-form-modal
      [open]="showFormModal"
      title="Submit Leave Request"
      confirmText="Submit"
      loadingText="Submitting..."
      [loading]="isSaving"
      (close)="showFormModal = false"
      (confirm)="saveForm()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Enrollment *</span>
          <select [(ngModel)]="formData.enrollment_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option value="" disabled>Select enrollment</option>
            <option *ngFor="let option of enrollmentOptions" [value]="option.id">{{ option.label }}</option>
          </select>
        </label>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">From Date *</span>
            <input [(ngModel)]="formData.from_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">To Date *</span>
            <input [(ngModel)]="formData.to_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Leave Type *</span>
          <input [(ngModel)]="formData.leave_type" type="text" placeholder="e.g. Sick, Personal, Family" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Reason *</span>
          <textarea [(ngModel)]="formData.reason" rows="3" placeholder="Provide a reason for the leave request" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>

    <!-- Review Leave Request Modal -->
    <app-form-modal
      [open]="showReviewModal"
      title="Review Leave Request"
      [subtitle]="'Review leave request from ' + (reviewingRow?.studentName || 'student') + ' (' + (reviewingRow?.period || '') + ')'"
      confirmText="Submit Review"
      loadingText="Submitting..."
      [loading]="isReviewing"
      (close)="showReviewModal = false"
      (confirm)="submitReview()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Decision *</span>
          <select [(ngModel)]="reviewData.status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option value="" disabled>Select decision</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <textarea [(ngModel)]="reviewData.remarks" rows="3" placeholder="Optional review remarks" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>
  `,
})
export class LeaveRequestsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: LeaveRequestRow[] = [];
  enrollmentOptions: EnrollmentOption[] = [];

  showFormModal = false;
  isSaving = false;
  formData = { enrollment_id: '', from_date: '', to_date: '', leave_type: '', reason: '' };

  showReviewModal = false;
  isReviewing = false;
  reviewingRow: LeaveRequestRow | null = null;
  reviewData = { status: '', remarks: '' };

  readonly columns: AcademicResourceColumn<LeaveRequestRow>[] = [
    { label: 'Student', value: (row) => row.studentName, secondary: (row) => row.reason || 'No reason recorded', badge: (row) => row.status },
    { label: 'Leave Window', value: (row) => row.period, secondary: (row) => this.formatLabel(row.leaveType) },
    { label: 'Requested By', value: (row) => row.requestedBy || 'Requester unavailable', secondary: (row) => row.reviewedBy || 'Not yet reviewed' },
    { label: 'Request ID', value: (row) => row.id, secondary: () => 'Live workflow record' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    return [
      { label: 'Requests', value: this.rows.length, detail: 'All leave requests from the live API.', tone: 'primary' },
      { label: 'Pending', value: this.rows.filter((row) => row.status === 'pending').length, detail: 'Requests waiting for review.', tone: 'amber' },
      { label: 'Approved', value: this.rows.filter((row) => row.status === 'approved').length, detail: 'Requests already approved.', tone: 'accent' },
      { label: 'Reviewed', value: this.rows.filter((row) => !!row.reviewedBy).length, detail: 'Requests with a recorded reviewer.', tone: 'rose' },
    ];
  }

  readonly searchIndex = (row: LeaveRequestRow): string =>
    [row.studentName, row.leaveType, row.status, row.reason, row.requestedBy, row.reviewedBy].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      leaves: this.api.listLeaveRequests(),
      enrollments: this.api.listEnrollments(),
      students: this.api.listStudents(),
      parents: this.api.listParents(),
      teachers: this.api.listTeachers(),
    }).subscribe({
      next: ({ leaves, enrollments, students, parents, teachers }) => {
        const enrollmentList = extractList<unknown>(enrollments);
        const studentList = extractList<unknown>(students);

        const enrollmentStudentMap = new Map(
          enrollmentList.map((item) => [readString(item, 'id'), readString(item, 'studentId')])
        );
        const studentMap = new Map(
          studentList.map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );
        const parentMap = new Map(
          extractList<unknown>(parents).map((item) => [
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

        // Build enrollment options for the create modal
        this.enrollmentOptions = enrollmentList.map((item) => {
          const enrollmentId = readString(item, 'id');
          const studentId = readString(item, 'studentId');
          return {
            id: enrollmentId,
            label: `${studentMap.get(studentId) || 'Student'} • Roll ${readString(item, 'rollNumber')} • ${readString(item, 'sectionId')}`,
          };
        });

        this.rows = extractList<unknown>(leaves).map((item) => {
          const studentId = enrollmentStudentMap.get(readString(item, 'enrollmentId')) || '';
          const fromDateVal = readString(item, 'fromDate');
          const toDateVal = readString(item, 'toDate');
          return {
            id: readString(item, 'id'),
            studentName: studentMap.get(studentId) || 'Student unavailable',
            leaveType: readString(item, 'leaveType'),
            status: readString(item, 'status'),
            period: `${this.formatDate(fromDateVal)} to ${this.formatDate(toDateVal)}`,
            reason: readString(item, 'reason'),
            requestedBy: parentMap.get(readString(item, 'requestedBy')) || readString(item, 'requestedBy'),
            reviewedBy: teacherMap.get(readString(item, 'reviewedBy')) || '',
            enrollmentId: readString(item, 'enrollmentId'),
            fromDate: fromDateVal,
            toDate: toDateVal,
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Leave requests could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.formData = { enrollment_id: '', from_date: '', to_date: '', leave_type: '', reason: '' };
    this.showFormModal = true;
  }

  openReviewModal(row: LeaveRequestRow): void {
    this.reviewingRow = row;
    this.reviewData = { status: '', remarks: '' };
    this.showReviewModal = true;
  }

  saveForm(): void {
    if (!this.formData.enrollment_id || !this.formData.from_date || !this.formData.to_date || !this.formData.leave_type || !this.formData.reason) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      enrollment_id: this.formData.enrollment_id,
      from_date: this.formData.from_date,
      to_date: this.formData.to_date,
      leave_type: this.formData.leave_type,
      reason: this.formData.reason,
    };

    this.api.createLeaveRequest(payload).subscribe({
      next: () => {
        this.notify.success('Leave request submitted.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to submit leave request.'));
        this.isSaving = false;
      },
    });
  }

  submitReview(): void {
    if (!this.reviewingRow || !this.reviewData.status) {
      this.notify.warning('Please select a decision.');
      return;
    }
    this.isReviewing = true;
    const payload: Record<string, unknown> = {
      status: this.reviewData.status,
      remarks: this.reviewData.remarks,
    };

    this.api.reviewLeaveRequest(this.reviewingRow.id, payload).subscribe({
      next: () => {
        this.notify.success('Leave request reviewed.');
        this.showReviewModal = false;
        this.isReviewing = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to review leave request.'));
        this.isReviewing = false;
      },
    });
  }

  private formatLabel(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not available';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
