import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

interface EnrollmentRow {
  id: string;
  studentName: string;
  sectionId: string;
  academicYearLabel: string;
  rollNumber: string;
  enrollmentDate: string;
  activeStatus: string;
  status: string;
}

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Enrollments"
      subtitle="A live enrollment registry showing who is placed where, under which academic year, and with what current running status."
      dataSourceLabel="GET /api/v1/enrollments"
      tableTitle="Enrollment Registry"
      tableSubtitle="Track active and historical enrollments with roll numbers, section placement, and academic year context."
      searchPlaceholder="Search by student, section, roll, or status"
      emptyTitle="No enrollments found"
      emptyMessage="Enrollment records will appear here as soon as the backend returns them."
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
export class EnrollmentsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: EnrollmentRow[] = [];

  readonly columns: AcademicResourceColumn<EnrollmentRow>[] = [
    {
      label: 'Student',
      value: (row) => row.studentName,
      secondary: (row) => row.id,
      badge: (row) => row.activeStatus,
    },
    {
      label: 'Placement',
      value: (row) => row.sectionId,
      secondary: (row) => row.academicYearLabel,
    },
    {
      label: 'Roll & Status',
      value: (row) => `Roll ${row.rollNumber || 'N/A'}`,
      secondary: (row) => this.formatLabel(row.status),
    },
    {
      label: 'Enrollment Date',
      value: (row) => this.formatDate(row.enrollmentDate),
      secondary: () => 'Live backend record',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const activeCount = this.rows.filter((row) => row.activeStatus === 'active').length;
    const runningCount = this.rows.filter((row) => row.status === 'running').length;
    const promotedCount = this.rows.filter((row) => row.status === 'promoted').length;

    return [
      { label: 'Enrollments', value: this.rows.length, detail: 'All enrollment records from the live API.', tone: 'primary' },
      { label: 'Active', value: activeCount, detail: 'Currently active enrollments.', tone: 'accent' },
      { label: 'Running', value: runningCount, detail: 'Students actively running in their current placement.', tone: 'amber' },
      { label: 'Promoted', value: promotedCount, detail: 'Historical enrollments already promoted forward.', tone: 'rose' },
    ];
  }

  readonly searchIndex = (row: EnrollmentRow): string =>
    [row.studentName, row.sectionId, row.academicYearLabel, row.rollNumber, row.status, row.activeStatus].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      enrollmentsResponse: this.api.listEnrollments(),
      studentsResponse: this.api.listStudents(),
      yearsResponse: this.api.listAcademicYears(),
    }).subscribe({
      next: ({ enrollmentsResponse, studentsResponse, yearsResponse }) => {
        const studentMap = new Map(
          extractList<unknown>(studentsResponse).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );
        const yearMap = new Map(
          extractList<unknown>(yearsResponse).map((item) => [readString(item, 'id'), readString(item, 'label')])
        );

        this.rows = extractList<unknown>(enrollmentsResponse).map((item) => ({
          id: readString(item, 'id'),
          studentName: studentMap.get(readString(item, 'studentId')) || 'Student unavailable',
          sectionId: readString(item, 'sectionId'),
          academicYearLabel: yearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
          rollNumber: readString(item, 'rollNumber'),
          enrollmentDate: readString(item, 'enrollmentDate'),
          activeStatus: readString(item, 'activeStatus'),
          status: readString(item, 'status'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Enrollments could not be loaded from the API.');
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
