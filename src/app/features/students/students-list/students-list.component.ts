import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../../shared/components/academic-resource-page/academic-resource-page.component';

interface StudentRow {
  id: string;
  studentId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  bloodType: string;
  email: string;
  phonePrimary: string;
  presentAddress: string;
  createdAt: string;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Students"
      subtitle="A live student registry for admissions follow-through, profile visibility, and demographic quick-scanning. This page pulls directly from your students endpoint."
      dataSourceLabel="GET /api/v1/students"
      tableTitle="Student Registry"
      tableSubtitle="See student identity, age band, blood type, and contact footprint from the live backend."
      searchPlaceholder="Search by student, ID, blood type, or address"
      emptyTitle="No students found"
      emptyMessage="Student records from the backend will appear here automatically."
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
export class StudentsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: StudentRow[] = [];

  readonly columns: AcademicResourceColumn<StudentRow>[] = [
    {
      label: 'Student',
      value: (row) => row.fullName,
      secondary: (row) => row.studentId || row.id,
      badge: (row) => this.getAgeLabel(row.dateOfBirth),
    },
    {
      label: 'Profile',
      value: (row) => this.formatGender(row.gender),
      secondary: (row) => row.bloodType || 'Blood type unavailable',
    },
    {
      label: 'Contact',
      value: (row) => row.email || 'Email unavailable',
      secondary: (row) => row.phonePrimary || row.presentAddress || 'Contact footprint unavailable',
    },
    {
      label: 'Location & Created',
      value: (row) => row.presentAddress || 'Address unavailable',
      secondary: (row) => this.formatDate(row.createdAt),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const maleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'male').length;
    const femaleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'female').length;
    const withBloodType = this.rows.filter((row) => !!row.bloodType).length;
    const averageAge = this.rows.length
      ? Math.round(
          this.rows.reduce((sum, row) => sum + this.getAge(row.dateOfBirth), 0) /
            this.rows.length
        )
      : 0;

    return [
      {
        label: 'Total Students',
        value: this.rows.length,
        detail: 'All student records returned by the live API.',
        tone: 'primary',
      },
      {
        label: 'Gender Split',
        value: `${maleCount}M / ${femaleCount}F`,
        detail: 'Visible student gender distribution in the current dataset.',
        tone: 'accent',
      },
      {
        label: 'Blood Data',
        value: withBloodType,
        detail: 'Students with blood-group information available.',
        tone: 'amber',
      },
      {
        label: 'Average Age',
        value: `${averageAge} yrs`,
        detail: 'Approximate age based on dates of birth.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: StudentRow): string =>
    [
      row.fullName,
      row.studentId,
      row.gender,
      row.bloodType,
      row.email,
      row.presentAddress,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listStudents().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapStudent(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Students could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  private mapStudent(item: unknown): StudentRow {
    const fullName = [
      readString(item, 'firstName', 'first_name'),
      readString(item, 'middleName', 'middle_name'),
      readString(item, 'lastName', 'last_name'),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: readString(item, 'id'),
      studentId: readString(item, 'studentId'),
      fullName,
      gender: readString(item, 'gender'),
      dateOfBirth: readString(item, 'dateOfBirth', 'date_of_birth'),
      bloodType: readString(item, 'bloodType', 'blood_type'),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary', 'phone_primary', 'phone'),
      presentAddress: readString(item, 'presentAddress', 'present_address'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatGender(value: string): string {
    if (!value) {
      return 'Gender unavailable';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private getAgeLabel(dateOfBirth: string): string {
    if (!dateOfBirth) {
      return '';
    }

    return `${this.getAge(dateOfBirth)} yrs`;
  }

  private getAge(dateOfBirth: string): number {
    if (!dateOfBirth) {
      return 0;
    }

    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
