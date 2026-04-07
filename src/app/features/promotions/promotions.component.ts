import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { extractList, getErrorMessage, readString } from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

interface PromotionRow {
  id: string;
  studentName: string;
  promotionType: string;
  fromYear: string;
  toYear: string;
  promotedBy: string;
  remarks: string;
  promotedAt: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
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
export class PromotionsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: PromotionRow[] = [];

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
    }).subscribe({
      next: ({ promotions, students, teachers, years }) => {
        const studentMap = new Map(
          extractList<unknown>(students).map((item) => [
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
        const yearMap = new Map(
          extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')])
        );

        this.rows = extractList<unknown>(promotions).map((item) => ({
          id: readString(item, 'id'),
          studentName: studentMap.get(readString(item, 'studentId')) || 'Student unavailable',
          promotionType: readString(item, 'promotionType'),
          fromYear: yearMap.get(readString(item, 'fromAcademicYearId')) || readString(item, 'fromAcademicYearId'),
          toYear: yearMap.get(readString(item, 'toAcademicYearId')) || readString(item, 'toAcademicYearId'),
          promotedBy: teacherMap.get(readString(item, 'promotedBy')) || readString(item, 'promotedBy'),
          remarks: readString(item, 'remarks'),
          promotedAt: readString(item, 'promotedAt'),
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

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
