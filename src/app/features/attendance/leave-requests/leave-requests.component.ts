import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractList, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../../shared/components/academic-resource-page/academic-resource-page.component';

interface LeaveRequestRow {
  id: string;
  studentName: string;
  leaveType: string;
  status: string;
  period: string;
  reason: string;
  requestedBy: string;
  reviewedBy: string;
}

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
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
      [metrics]="metrics"
      [columns]="columns"
      [rows]="rows"
      [isLoading]="isLoading"
      [errorMessage]="errorMessage"
      [searchIndex]="searchIndex"
      (refresh)="loadData()"
    ></app-academic-resource-page>
  `,
})
export class LeaveRequestsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  isLoading = true;
  errorMessage = '';
  rows: LeaveRequestRow[] = [];

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
        const enrollmentStudentMap = new Map(
          extractList<unknown>(enrollments).map((item) => [readString(item, 'id'), readString(item, 'studentId')])
        );
        const studentMap = new Map(
          extractList<unknown>(students).map((item) => [
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

        this.rows = extractList<unknown>(leaves).map((item) => {
          const studentId = enrollmentStudentMap.get(readString(item, 'enrollmentId')) || '';
          return {
            id: readString(item, 'id'),
            studentName: studentMap.get(studentId) || 'Student unavailable',
            leaveType: readString(item, 'leaveType'),
            status: readString(item, 'status'),
            period: `${this.formatDate(readString(item, 'fromDate'))} to ${this.formatDate(readString(item, 'toDate'))}`,
            reason: readString(item, 'reason'),
            requestedBy: parentMap.get(readString(item, 'requestedBy')) || readString(item, 'requestedBy'),
            reviewedBy: teacherMap.get(readString(item, 'reviewedBy')) || '',
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

  private formatLabel(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not available';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
