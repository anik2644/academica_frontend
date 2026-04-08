import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import {
  extractList,
  getErrorMessage,
  readBoolean,
  readString,
} from '../../core/utils/api-response.utils';
import { NotificationService } from '../../core/services/notification.service';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

interface DropdownOption {
  id: string;
  label: string;
}

interface SectionTeacherRow {
  id: string;
  teacherName: string;
  classSubjectId: string;
  classSubjectLabel: string;
  sectionId: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-section-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLoaderComponent, FormModalComponent],
  templateUrl: './section-teachers.component.html',
  styleUrl: './section-teachers.component.css',
})
export class SectionTeachersComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  academicYears: DropdownOption[] = [];
  sections: DropdownOption[] = [];
  classSubjects: DropdownOption[] = [];
  teachers: DropdownOption[] = [];

  selectedAcademicYearId = '';
  selectedSectionId = '';
  assignments: SectionTeacherRow[] = [];
  isLoading = false;
  errorMessage = '';

  // Assign modal state
  showAssignModal = false;
  isSaving = false;
  formData = { academic_year_id: 0, section_id: 0, class_subject_id: 0, teacher_id: 0 };

  // Deactivate modal state
  showDeactivateModal = false;
  isDeactivating = false;
  deactivatingRow: SectionTeacherRow | null = null;

  // Lookup maps for resolving IDs to labels
  private teacherMap = new Map<string, string>();
  private classSubjectMap = new Map<string, string>();

  ngOnInit(): void {
    forkJoin({
      years: this.api.listAcademicYears(),
      sections: this.api.listSections(),
      classSubjects: this.api.listClassSubjects(),
      teachers: this.api.listTeachers(),
    }).subscribe({
      next: ({ years, sections, classSubjects, teachers }) => {
        this.academicYears = extractList<unknown>(years).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label'),
        }));

        this.sections = extractList<unknown>(sections).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'displayName', 'display_name') || readString(item, 'name') || readString(item, 'id'),
        }));

        const classSubjectItems = extractList<unknown>(classSubjects);
        this.classSubjectMap = new Map(
          classSubjectItems.map((item) => [
            readString(item, 'id'),
            this.buildClassSubjectLabel(item),
          ])
        );
        this.classSubjects = classSubjectItems.map((item) => ({
          id: readString(item, 'id'),
          label: this.buildClassSubjectLabel(item),
        }));

        const teacherItems = extractList<unknown>(teachers);
        this.teacherMap = new Map(
          teacherItems.map((item) => [
            readString(item, 'id'),
            this.buildTeacherLabel(item),
          ])
        );
        this.teachers = teacherItems.map((item) => ({
          id: readString(item, 'id'),
          label: this.buildTeacherLabel(item),
        }));

        this.selectedAcademicYearId = this.academicYears[0]?.id ?? '';
        this.selectedSectionId = this.sections[0]?.id ?? '';
        if (this.selectedAcademicYearId && this.selectedSectionId) {
          this.loadAssignments();
        }
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Filter data could not be loaded for section teachers.');
      },
    });
  }

  loadAssignments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.listSectionTeachers({
      sectionId: this.selectedSectionId,
      academicYearId: this.selectedAcademicYearId,
    }).subscribe({
      next: (response) => {
        this.assignments = extractList<unknown>(response).map((item) => this.mapRow(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.assignments = [];
        this.errorMessage = getErrorMessage(error, 'Section teacher assignments could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openAssignModal(): void {
    this.formData = {
      academic_year_id: this.selectedAcademicYearId ? +this.selectedAcademicYearId : 0,
      section_id: this.selectedSectionId ? +this.selectedSectionId : 0,
      class_subject_id: 0,
      teacher_id: 0,
    };
    this.showAssignModal = true;
  }

  saveAssignment(): void {
    if (!this.formData.academic_year_id || !this.formData.section_id || !this.formData.class_subject_id || !this.formData.teacher_id) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    this.api.createSectionTeacher(this.formData as Record<string, unknown>).subscribe({
      next: () => {
        this.notify.success('Teacher assigned successfully.');
        this.showAssignModal = false;
        this.isSaving = false;
        this.loadAssignments();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to assign teacher.'));
        this.isSaving = false;
      },
    });
  }

  openDeactivateModal(row: SectionTeacherRow): void {
    this.deactivatingRow = row;
    this.showDeactivateModal = true;
  }

  confirmDeactivate(): void {
    if (!this.deactivatingRow) return;
    this.isDeactivating = true;
    this.api.deactivateSectionTeacher(this.deactivatingRow.id).subscribe({
      next: () => {
        this.notify.success('Assignment deactivated.');
        this.showDeactivateModal = false;
        this.isDeactivating = false;
        this.loadAssignments();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to deactivate assignment.'));
        this.isDeactivating = false;
      },
    });
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }

  private mapRow(item: unknown): SectionTeacherRow {
    const teacherId = readString(item, 'teacherId', 'teacher_id');
    const classSubjectId = readString(item, 'classSubjectId', 'class_subject_id');

    return {
      id: readString(item, 'id'),
      teacherName: readString(item, 'teacherName', 'teacherId') || this.teacherMap.get(teacherId) || teacherId,
      classSubjectId,
      classSubjectLabel: this.classSubjectMap.get(classSubjectId) || classSubjectId,
      sectionId: readString(item, 'sectionId', 'section_id'),
      academicYearId: readString(item, 'academicYearId', 'academic_year_id'),
      isActive: readBoolean(item, 'isActive', 'is_active'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private buildTeacherLabel(item: unknown): string {
    const parts = [
      readString(item, 'firstName', 'first_name'),
      readString(item, 'middleName', 'middle_name'),
      readString(item, 'lastName', 'last_name'),
    ].filter(Boolean);
    return parts.join(' ') || readString(item, 'id');
  }

  private buildClassSubjectLabel(item: unknown): string {
    const className = readString(item, 'className', 'class_name');
    const subjectName = readString(item, 'subjectName', 'subject_name');
    if (className && subjectName) return `${className} - ${subjectName}`;
    if (className) return className;
    if (subjectName) return subjectName;
    return `Class Subject #${readString(item, 'id')}`;
  }
}
