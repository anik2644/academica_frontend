import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  extractItem,
  extractList,
  getErrorMessage,
  readBoolean,
  readString,
} from '../../core/utils/api-response.utils';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

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
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Academic Years"
      subtitle="A live planning surface for year timelines, active session tracking, and rollover visibility. This view is bound directly to your academic years endpoints."
      dataSourceLabel="GET /api/v1/academic-years"
      tableTitle="Academic Year Registry"
      tableSubtitle="Track the active year, year windows, and timeline history in one place."
      searchPlaceholder="Search by label or year dates"
      emptyTitle="No academic years found"
      emptyMessage="Create an academic year in the backend and it will appear here."
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
export class AcademicYearsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: AcademicYearRow[] = [];
  currentYearLabel = 'Not set';

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
      secondary: (row) =>
        row.isCurrent ? 'Used by current operations and enrollments.' : 'Available for historical reference.',
    },
    {
      label: 'Created',
      value: (row) => this.formatDate(row.createdAt),
      secondary: () => 'Loaded from live API',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const archivedCount = this.rows.filter((row) => !row.isCurrent).length;
    const latestYear = this.rows[0]?.label ?? 'N/A';

    return [
      {
        label: 'Current Year',
        value: this.currentYearLabel,
        detail: 'The active year returned by `/academic-years/current`.',
        tone: 'primary',
      },
      {
        label: 'Total Years',
        value: this.rows.length,
        detail: 'All academic year records available from the backend.',
        tone: 'accent',
      },
      {
        label: 'Archived',
        value: archivedCount,
        detail: 'Past sessions kept for continuity and reporting.',
        tone: 'amber',
      },
      {
        label: 'Latest Label',
        value: latestYear,
        detail: 'Most recently listed year in the current dataset.',
        tone: 'rose',
      },
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
        this.rows = extractList<unknown>(years).map((item) => this.mapAcademicYear(item));
        const currentYear = extractItem<unknown>(current);
        this.currentYearLabel = currentYear
          ? readString(currentYear, 'label') || 'Current year'
          : 'Not set';
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.currentYearLabel = 'Unavailable';
        this.errorMessage = getErrorMessage(
          error,
          'Academic years could not be loaded from the API.'
        );
        this.isLoading = false;
      },
    });
  }

  private mapAcademicYear(item: unknown): AcademicYearRow {
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
    if (!start && !end) {
      return 'No dates available';
    }

    return `${this.formatDate(start)} to ${this.formatDate(end)}`;
  }

  private getDurationLabel(start: string, end: string): string {
    if (!start || !end) {
      return 'Date window unavailable';
    }

    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return startYear === endYear ? `${startYear} session` : `${startYear} to ${endYear}`;
  }
}
