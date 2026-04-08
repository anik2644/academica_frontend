import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { NotificationService } from '../../core/services/notification.service';
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
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

interface ClassSubjectRow {
  id: string;
  classId: string;
  subjectId: string;
  academicYearId: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  academicYearLabel: string;
  fullMarks: number | null;
  passMarks: number | null;
  createdAt: string;
}

interface DropdownOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-class-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  templateUrl: './class-subjects.component.html',
  styleUrl: './class-subjects.component.css',
})
export class ClassSubjectsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: ClassSubjectRow[] = [];
  referenceSummary = '0 classes / 0 subjects / 0 years';

  classOptions: DropdownOption[] = [];
  subjectOptions: DropdownOption[] = [];
  yearOptions: DropdownOption[] = [];

  showFormModal = false;
  showDeleteModal = false;
  isSaving = false;
  isDeleting = false;
  editingRow: ClassSubjectRow | null = null;
  deletingRow: ClassSubjectRow | null = null;
  formData = { class_id: 0, subject_id: 0, academic_year_id: 0, full_marks: 0, pass_marks: 0 };

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

      this.classOptions = classes.map((item) => ({
        id: readString(item, 'id'),
        label: readString(item, 'name'),
      }));
      this.subjectOptions = subjects.map((item) => ({
        id: readString(item, 'id'),
        label: readString(item, 'name'),
      }));
      this.yearOptions = years.map((item) => ({
        id: readString(item, 'id'),
        label: readString(item, 'label'),
      }));

      this.referenceSummary = `${classMap.size} classes / ${subjectMap.size} subjects / ${yearMap.size} years`;
      this.rows = mappings.rows.map((item) =>
        this.mapClassSubject(item, classMap, subjectMap, yearMap)
      );
      this.errorMessage = mappings.error;
      this.isLoading = false;
    });
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = { class_id: 0, subject_id: 0, academic_year_id: 0, full_marks: 0, pass_marks: 0 };
    this.showFormModal = true;
  }

  openEditModal(row: ClassSubjectRow): void {
    this.editingRow = row;
    this.formData = {
      class_id: row.classId as unknown as number,
      subject_id: row.subjectId as unknown as number,
      academic_year_id: row.academicYearId as unknown as number,
      full_marks: row.fullMarks ?? 0,
      pass_marks: row.passMarks ?? 0,
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: ClassSubjectRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  saveForm(): void {
    if (!this.formData.class_id || !this.formData.subject_id || !this.formData.academic_year_id) {
      this.notify.warning('Please select class, subject, and academic year.');
      return;
    }
    if (this.formData.full_marks == null || this.formData.pass_marks == null) {
      this.notify.warning('Please fill full marks and pass marks.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      class_id: this.formData.class_id,
      subject_id: this.formData.subject_id,
      academic_year_id: this.formData.academic_year_id,
      full_marks: this.formData.full_marks,
      pass_marks: this.formData.pass_marks,
    };

    const request$ = this.editingRow
      ? this.api.updateClassSubject(this.editingRow.id, payload)
      : this.api.createClassSubject(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Class subject updated.' : 'Class subject created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save class subject.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteClassSubject(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Class subject deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete class subject.'));
        this.isDeleting = false;
      },
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
      classId,
      subjectId,
      academicYearId,
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
