import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readNumber,
  readRecord,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';

interface ClassSubjectRow {
  id: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  academicYearLabel: string;
  fullMarks: number | null;
  passMarks: number | null;
  createdAt: string;
}

@Component({
  selector: 'app-class-subjects',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Class Subjects"
      subtitle="A live curriculum-mapping view for subject allocation by class and academic year. This screen reads directly from the backend and surfaces API errors instead of hiding them."
      dataSourceLabel="GET /api/v1/class-subjects"
      tableTitle="Class Subject Mapping"
      tableSubtitle="Inspect which subjects are linked to which classes, under which academic year, with visible marks policy."
      searchPlaceholder="Search by class, subject, code, or year"
      emptyTitle="No class subjects available"
      emptyMessage="Mappings will appear here when the class-subjects endpoint returns valid data."
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
export class ClassSubjectsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: ClassSubjectRow[] = [];
  referenceSummary = '0 classes / 0 subjects / 0 years';

  readonly columns: AcademicResourceColumn<ClassSubjectRow>[] = [
    {
      label: 'Subject',
      value: (row) => row.subjectName || 'Subject unavailable',
      secondary: (row) => row.subjectCode || row.id,
      badge: (row) => row.className || '',
    },
    {
      label: 'Academic Context',
      value: (row) => row.academicYearLabel || 'Academic year unavailable',
      secondary: (row) => row.className || 'Class unavailable',
    },
    {
      label: 'Marks Policy',
      value: (row) => this.formatMarks(row.fullMarks, row.passMarks),
      secondary: () => 'Full marks and pass marks from the live mapping.',
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
    const averageFullMarks = this.rows.length
      ? Math.round(
          this.rows.reduce((sum, row) => sum + (row.fullMarks ?? 0), 0) / this.rows.length
        )
      : 0;
    const passConfigured = this.rows.filter((row) => row.passMarks !== null).length;

    return [
      {
        label: 'Mappings Loaded',
        value: this.rows.length,
        detail: 'Class-subject relationships returned by the API.',
        tone: 'primary',
      },
      {
        label: 'Pass Rules',
        value: passConfigured,
        detail: 'Mappings with explicit pass marks configured.',
        tone: 'accent',
      },
      {
        label: 'Avg Full Marks',
        value: averageFullMarks,
        detail: 'Average full marks across the loaded mappings.',
        tone: 'amber',
      },
      {
        label: 'Reference Data',
        value: this.referenceSummary,
        detail: 'Supporting class, subject, and academic year records loaded for naming.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: ClassSubjectRow): string =>
    [
      row.className,
      row.subjectName,
      row.subjectCode,
      row.academicYearLabel,
      row.id,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      mappings: this.api.listClassSubjects().pipe(
        map((response) => ({
          rows: extractList<unknown>(response),
          error: '',
        })),
        catchError((error) =>
          of({
            rows: [] as unknown[],
            error: getErrorMessage(
              error,
              'Class subjects could not be loaded from the API.'
            ),
          })
        )
      ),
      classes: this.api.listClasses().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
      subjects: this.api.listSubjects().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
      years: this.api.listAcademicYears().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
    }).subscribe(({ mappings, classes, subjects, years }) => {
      const classMap = new Map(
        classes.map((item) => [readString(item, 'id'), readString(item, 'name')])
      );
      const subjectMap = new Map(
        subjects.map((item) => [
          readString(item, 'id'),
          {
            name: readString(item, 'name'),
            code: readString(item, 'subjectCode', 'subject_code'),
          },
        ])
      );
      const yearMap = new Map(
        years.map((item) => [readString(item, 'id'), readString(item, 'label')])
      );

      this.referenceSummary = `${classMap.size} classes / ${subjectMap.size} subjects / ${yearMap.size} years`;
      this.rows = mappings.rows.map((item) =>
        this.mapClassSubject(item, classMap, subjectMap, yearMap)
      );
      this.errorMessage = mappings.error;
      this.isLoading = false;
    });
  }

  private mapClassSubject(
    item: unknown,
    classMap: Map<string, string>,
    subjectMap: Map<string, { name: string; code: string }>,
    yearMap: Map<string, string>
  ): ClassSubjectRow {
    const classRecord = readRecord(item, 'class');
    const subjectRecord = readRecord(item, 'subject');
    const academicYearRecord = readRecord(item, 'academicYear');
    const classId = readString(item, 'classId', 'class_id');
    const subjectId = readString(item, 'subjectId', 'subject_id');
    const academicYearId = readString(item, 'academicYearId', 'academic_year_id');
    const subjectReference = subjectMap.get(subjectId);

    return {
      id: readString(item, 'id'),
      className:
        readString(classRecord, 'name') || classMap.get(classId) || 'Linked class unavailable',
      subjectName:
        readString(subjectRecord, 'name') ||
        subjectReference?.name ||
        'Linked subject unavailable',
      subjectCode:
        readString(subjectRecord, 'subjectCode', 'subject_code') ||
        subjectReference?.code ||
        '',
      academicYearLabel:
        readString(academicYearRecord, 'label') ||
        yearMap.get(academicYearId) ||
        'Academic year unavailable',
      fullMarks: readNumber(item, 'fullMarks', 'full_marks'),
      passMarks: readNumber(item, 'passMarks', 'pass_marks'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatMarks(fullMarks: number | null, passMarks: number | null): string {
    if (fullMarks === null && passMarks === null) {
      return 'Marks not configured';
    }

    return `${fullMarks ?? 0} full / ${passMarks ?? 0} pass`;
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
