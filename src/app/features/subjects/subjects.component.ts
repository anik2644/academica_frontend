import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readBoolean,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

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
  imports: [CommonModule, AcademicResourcePageComponent],
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
export class SubjectsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: SubjectRow[] = [];

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
