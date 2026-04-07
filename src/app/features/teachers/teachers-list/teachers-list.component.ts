import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
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

interface TeacherRow {
  id: string;
  teacherId: string;
  fullName: string;
  gender: string;
  email: string;
  phonePrimary: string;
  designation: string;
  department: string;
  employmentType: string;
  joinDate: string;
  isActive: boolean;
  previousExperienceYears: number | null;
}

@Component({
  selector: 'app-teachers-list',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
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
export class TeachersListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: TeacherRow[] = [];

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

  private mapTeacher(item: unknown): TeacherRow {
    const fullName = [
      readString(item, 'firstName', 'first_name'),
      readString(item, 'middleName', 'middle_name'),
      readString(item, 'lastName', 'last_name'),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: readString(item, 'id'),
      teacherId: readString(item, 'teacherId'),
      fullName,
      gender: readString(item, 'gender'),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary', 'phone_primary'),
      designation: readString(item, 'designation'),
      department: readString(item, 'department'),
      employmentType: readString(item, 'employmentType', 'employment_type'),
      joinDate: readString(item, 'joinDate', 'join_date'),
      isActive: readBoolean(item, 'isActive', 'is_active'),
      previousExperienceYears: readNumber(
        item,
        'previousExperienceYears',
        'previous_experience_years'
      ),
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
