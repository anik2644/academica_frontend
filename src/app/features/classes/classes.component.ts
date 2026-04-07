import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readBoolean,
  readNumber,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

interface ClassRow {
  id: string;
  name: string;
  numericLevel: number | null;
  description: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Classes"
      subtitle="A polished live catalogue of class levels, progression bands, and active teaching structure. This page reads directly from the classes API."
      dataSourceLabel="GET /api/v1/classes"
      tableTitle="Class Structure"
      tableSubtitle="See class progression, level ordering, and active availability in one operational view."
      searchPlaceholder="Search by class name, level, or description"
      emptyTitle="No classes found"
      emptyMessage="Create class records in the backend and they will be listed here."
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
export class ClassesComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: ClassRow[] = [];

  readonly columns: AcademicResourceColumn<ClassRow>[] = [
    {
      label: 'Class',
      value: (row) => row.name,
      secondary: (row) => row.description || `Record ${row.id}`,
      badge: (row) => (row.isActive ? 'Active' : 'Inactive'),
    },
    {
      label: 'Level',
      value: (row) => this.formatLevel(row.numericLevel),
      secondary: (row) => this.getStageLabel(row.numericLevel),
    },
    {
      label: 'Curriculum Band',
      value: (row) => this.getBandLabel(row.numericLevel),
      secondary: () => 'Derived from numeric level ordering.',
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
    const foundationCount = this.rows.filter(
      (row) => row.numericLevel !== null && row.numericLevel <= 1
    ).length;
    const highestLevel = Math.max(...this.rows.map((row) => row.numericLevel ?? 0), 0);

    return [
      {
        label: 'Total Classes',
        value: this.rows.length,
        detail: 'All class entities returned from the live API.',
        tone: 'primary',
      },
      {
        label: 'Active Classes',
        value: activeCount,
        detail: 'Currently marked active and ready for scheduling.',
        tone: 'accent',
      },
      {
        label: 'Foundation Levels',
        value: foundationCount,
        detail: 'Entry-stage classes such as play and nursery.',
        tone: 'amber',
      },
      {
        label: 'Top Numeric Level',
        value: highestLevel,
        detail: 'Highest progression level in the current dataset.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: ClassRow): string =>
    [row.name, row.description, row.id, row.numericLevel ?? ''].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listClasses().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapClass(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Classes could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  private mapClass(item: unknown): ClassRow {
    return {
      id: readString(item, 'id'),
      name: readString(item, 'name'),
      numericLevel: readNumber(item, 'numericLevel', 'numeric_level'),
      description: readString(item, 'description'),
      isActive: readBoolean(item, 'isActive', 'is_active'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatLevel(level: number | null): string {
    return level === null ? 'Unranked' : `Level ${level}`;
  }

  private getStageLabel(level: number | null): string {
    if (level === null) {
      return 'Level is not set';
    }

    if (level <= 1) {
      return 'Early learning stage';
    }

    if (level <= 5) {
      return 'Primary track';
    }

    return 'Upper progression track';
  }

  private getBandLabel(level: number | null): string {
    if (level === null) {
      return 'Unassigned';
    }

    if (level === 0) {
      return 'Playgroup';
    }

    if (level === 1) {
      return 'Pre-primary';
    }

    return 'Formal class ladder';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
