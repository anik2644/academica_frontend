import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, map, of, forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readBoolean,
  readNumber,
  readRecord,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

interface SectionRow {
  id: string;
  name: string;
  displayName: string;
  className: string;
  academicYearLabel: string;
  capacity: number | null;
  roomNumber: string;
  teacherName: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Sections"
      subtitle="A live operations board for section planning, room allocation, and teacher ownership. This page attempts to read the sections API and shows backend failures transparently when the data source is unhealthy."
      dataSourceLabel="GET /api/v1/sections"
      tableTitle="Section Allocation"
      tableSubtitle="Inspect section identity, linked class, assigned year, capacity, room, and teacher context."
      searchPlaceholder="Search by section, class, room, or teacher"
      emptyTitle="No sections available"
      emptyMessage="If the API returns sections they will appear here. Backend errors are shown inline instead of silently failing."
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
export class SectionsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: SectionRow[] = [];
  relatedClassCount = 0;
  relatedYearCount = 0;

  readonly columns: AcademicResourceColumn<SectionRow>[] = [
    {
      label: 'Section',
      value: (row) => row.displayName || row.name,
      secondary: (row) => row.id,
      badge: (row) => (row.isActive ? 'Active' : 'Inactive'),
    },
    {
      label: 'Class & Year',
      value: (row) => row.className || 'Class unavailable',
      secondary: (row) => row.academicYearLabel || 'Academic year unavailable',
    },
    {
      label: 'Capacity & Room',
      value: (row) => (row.capacity !== null ? `${row.capacity} seats` : 'Capacity not set'),
      secondary: (row) => row.roomNumber || 'Room not assigned',
    },
    {
      label: 'Teacher & Created',
      value: (row) => row.teacherName || 'Teacher not assigned',
      secondary: (row) => this.formatDate(row.createdAt),
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const assignedTeacherCount = this.rows.filter((row) => !!row.teacherName).length;
    const totalCapacity = this.rows.reduce(
      (sum, row) => sum + (row.capacity ?? 0),
      0
    );

    return [
      {
        label: 'Sections Loaded',
        value: this.rows.length,
        detail: 'Sections successfully returned by the sections endpoint.',
        tone: 'primary',
      },
      {
        label: 'Teacher Assigned',
        value: assignedTeacherCount,
        detail: 'Sections with a visible teacher assignment.',
        tone: 'accent',
      },
      {
        label: 'Visible Capacity',
        value: totalCapacity,
        detail: 'Total seats represented by the loaded section records.',
        tone: 'amber',
      },
      {
        label: 'Reference Data',
        value: `${this.relatedClassCount} classes / ${this.relatedYearCount} years`,
        detail: 'Supporting class and year data loaded alongside sections.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: SectionRow): string =>
    [
      row.name,
      row.displayName,
      row.className,
      row.academicYearLabel,
      row.roomNumber,
      row.teacherName,
      row.id,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      sections: this.api.listSections().pipe(
        map((response) => ({
          rows: extractList<unknown>(response),
          error: '',
        })),
        catchError((error) =>
          of({
            rows: [] as unknown[],
            error: getErrorMessage(error, 'Sections could not be loaded from the API.'),
          })
        )
      ),
      classes: this.api.listClasses().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
      years: this.api.listAcademicYears().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
    }).subscribe(({ sections, classes, years }) => {
      const classMap = new Map(
        classes.map((item) => [readString(item, 'id'), readString(item, 'name')])
      );
      const yearMap = new Map(
        years.map((item) => [readString(item, 'id'), readString(item, 'label')])
      );

      this.relatedClassCount = classMap.size;
      this.relatedYearCount = yearMap.size;
      this.rows = sections.rows.map((item) => this.mapSection(item, classMap, yearMap));
      this.errorMessage = sections.error;
      this.isLoading = false;
    });
  }

  private mapSection(
    item: unknown,
    classMap: Map<string, string>,
    yearMap: Map<string, string>
  ): SectionRow {
    const classRecord = readRecord(item, 'class');
    const academicYearRecord = readRecord(item, 'academicYear');
    const teacherRecord = readRecord(item, 'classTeacher');
    const classId = readString(item, 'classId', 'class_id');
    const academicYearId = readString(item, 'academicYearId', 'academic_year_id');

    return {
      id: readString(item, 'id'),
      name: readString(item, 'name'),
      displayName: readString(item, 'displayName', 'display_name'),
      className:
        readString(classRecord, 'name') || classMap.get(classId) || 'Linked class unavailable',
      academicYearLabel:
        readString(academicYearRecord, 'label') ||
        yearMap.get(academicYearId) ||
        'Academic year unavailable',
      capacity: readNumber(item, 'capacity'),
      roomNumber: readString(item, 'roomNumber', 'room_number'),
      teacherName: this.getTeacherName(teacherRecord),
      isActive: readBoolean(item, 'isActive', 'is_active'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private getTeacherName(record: unknown): string {
    const parts = [
      readString(record, 'firstName', 'first_name'),
      readString(record, 'middleName', 'middle_name'),
      readString(record, 'lastName', 'last_name'),
    ].filter(Boolean);

    return parts.join(' ');
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
