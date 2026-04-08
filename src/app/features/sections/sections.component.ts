import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, map, of, forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { NotificationService } from '../../core/services/notification.service';
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
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

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

interface DropdownOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  templateUrl: './sections.component.html',
  styleUrl: './sections.component.css',
})
export class SectionsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: SectionRow[] = [];
  relatedClassCount = 0;
  relatedYearCount = 0;

  classOptions: DropdownOption[] = [];
  yearOptions: DropdownOption[] = [];
  teacherOptions: DropdownOption[] = [];

  showFormModal = false;
  showDeleteModal = false;
  showAssignTeacherModal = false;
  isSaving = false;
  isDeleting = false;
  isAssigning = false;
  editingRow: SectionRow | null = null;
  deletingRow: SectionRow | null = null;
  assigningRow: SectionRow | null = null;

  formData = {
    name: '',
    display_name: '',
    class_id: '',
    academic_year_id: '',
    capacity: null as number | null,
    room_number: '',
    class_teacher_id: '',
    is_active: true,
  };

  assignTeacherData = { class_teacher_id: '' };

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
      teachers: this.api.listTeachers().pipe(
        map((response) => extractList<unknown>(response)),
        catchError(() => of([] as unknown[]))
      ),
    }).subscribe(({ sections, classes, years, teachers }) => {
      const classMap = new Map(
        classes.map((item) => [readString(item, 'id'), readString(item, 'name')])
      );
      const yearMap = new Map(
        years.map((item) => [readString(item, 'id'), readString(item, 'label')])
      );

      this.classOptions = classes.map((item) => ({
        id: readString(item, 'id'),
        label: readString(item, 'name'),
      }));
      this.yearOptions = years.map((item) => ({
        id: readString(item, 'id'),
        label: readString(item, 'label'),
      }));
      this.teacherOptions = teachers.map((item) => ({
        id: readString(item, 'id'),
        label: this.buildTeacherLabel(item),
      }));

      this.relatedClassCount = classMap.size;
      this.relatedYearCount = yearMap.size;
      this.rows = sections.rows.map((item) => this.mapSection(item, classMap, yearMap));
      this.errorMessage = sections.error;
      this.isLoading = false;
    });
  }

  openAddModal(): void {
    this.editingRow = null;
    this.formData = {
      name: '',
      display_name: '',
      class_id: '',
      academic_year_id: '',
      capacity: null,
      room_number: '',
      class_teacher_id: '',
      is_active: true,
    };
    this.showFormModal = true;
  }

  openEditModal(row: SectionRow): void {
    this.editingRow = row;
    const classOption = this.classOptions.find((opt) => opt.label === row.className);
    const yearOption = this.yearOptions.find((opt) => opt.label === row.academicYearLabel);
    const teacherOption = this.teacherOptions.find((opt) => opt.label === row.teacherName);

    this.formData = {
      name: row.name,
      display_name: row.displayName,
      class_id: classOption?.id ?? '',
      academic_year_id: yearOption?.id ?? '',
      capacity: row.capacity,
      room_number: row.roomNumber,
      class_teacher_id: teacherOption?.id ?? '',
      is_active: row.isActive,
    };
    this.showFormModal = true;
  }

  openDeleteModal(row: SectionRow): void {
    this.deletingRow = row;
    this.showDeleteModal = true;
  }

  openAssignTeacherModal(row: SectionRow): void {
    this.assigningRow = row;
    const teacherOption = this.teacherOptions.find((opt) => opt.label === row.teacherName);
    this.assignTeacherData = { class_teacher_id: teacherOption?.id ?? '' };
    this.showAssignTeacherModal = true;
  }

  saveForm(): void {
    if (!this.formData.name || !this.formData.class_id || !this.formData.academic_year_id) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      name: this.formData.name,
      display_name: this.formData.display_name,
      class_id: Number(this.formData.class_id),
      academic_year_id: Number(this.formData.academic_year_id),
      capacity: this.formData.capacity,
      room_number: this.formData.room_number,
      class_teacher_id: this.formData.class_teacher_id ? Number(this.formData.class_teacher_id) : null,
      is_active: this.formData.is_active,
    };

    const request$ = this.editingRow
      ? this.api.updateSection(this.editingRow.id, payload)
      : this.api.createSection(payload);

    request$.subscribe({
      next: () => {
        this.notify.success(this.editingRow ? 'Section updated.' : 'Section created.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save section.'));
        this.isSaving = false;
      },
    });
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteSection(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Section deleted.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete section.'));
        this.isDeleting = false;
      },
    });
  }

  confirmAssignTeacher(): void {
    if (!this.assigningRow) return;
    if (!this.assignTeacherData.class_teacher_id) {
      this.notify.warning('Please select a teacher.');
      return;
    }
    this.isAssigning = true;
    const payload: Record<string, unknown> = {
      class_teacher_id: Number(this.assignTeacherData.class_teacher_id),
    };
    this.api.assignSectionTeacher(this.assigningRow.id, payload).subscribe({
      next: () => {
        this.notify.success('Teacher assigned to section.');
        this.showAssignTeacherModal = false;
        this.isAssigning = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to assign teacher.'));
        this.isAssigning = false;
      },
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

  private buildTeacherLabel(item: unknown): string {
    const parts = [
      readString(item, 'firstName', 'first_name'),
      readString(item, 'middleName', 'middle_name'),
      readString(item, 'lastName', 'last_name'),
    ].filter(Boolean);

    return parts.join(' ') || readString(item, 'id');
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
