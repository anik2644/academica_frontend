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
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Section Teachers</h1>
        </div>
      </div>

      <div class="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside class="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <div class="space-y-4">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Academic Year</span>
              <select [(ngModel)]="selectedAcademicYearId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option *ngFor="let year of academicYears" [value]="year.id">{{ year.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Section</span>
              <select [(ngModel)]="selectedSectionId" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                <option *ngFor="let section of sections" [value]="section.id">{{ section.label }}</option>
              </select>
            </label>
            <button type="button" (click)="loadAssignments()" class="w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">
              Load Assignments
            </button>
          </div>
        </aside>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-slate-900">Assignments</h2>
              <p class="mt-1 text-sm text-slate-600">Teacher allocations for the selected section and academic year.</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm text-slate-500">{{ assignments.length }} assignments</span>
              <button type="button" (click)="openAssignModal()" class="rounded-2xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700">
                Assign Teacher
              </button>
            </div>
          </div>

          <div *ngIf="errorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ errorMessage }}</div>

          <div *ngIf="isLoading" class="mt-5">
            <app-page-loader
              title="Loading assignments"
              message="Fetching section-teacher allocations for the selected query."
              [blockHeights]="[72, 72, 72]"
            ></app-page-loader>
          </div>

          <div *ngIf="!isLoading && assignments.length" class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Teacher</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class Subject</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr *ngFor="let row of assignments">
                  <td class="px-4 py-3 text-sm text-slate-900">{{ row.teacherName }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.classSubjectLabel || row.classSubjectId }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                      {{ row.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ formatDateValue(row.createdAt) }}</td>
                  <td class="px-4 py-3 text-sm">
                    <button
                      *ngIf="row.isActive"
                      type="button"
                      (click)="openDeactivateModal(row)"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="!isLoading && !assignments.length" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">
            No assignments were returned for the selected query.
          </div>
        </section>
      </div>
    </section>

    <!-- Assign Teacher Modal -->
    <app-form-modal
      [open]="showAssignModal"
      title="Assign Teacher"
      confirmText="Assign"
      loadingText="Assigning..."
      [loading]="isSaving"
      (close)="showAssignModal = false"
      (confirm)="saveAssignment()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Academic Year *</span>
          <select [(ngModel)]="formData.academic_year_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [value]="0" disabled>Select academic year</option>
            <option *ngFor="let year of academicYears" [ngValue]="+year.id">{{ year.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Section *</span>
          <select [(ngModel)]="formData.section_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [value]="0" disabled>Select section</option>
            <option *ngFor="let section of sections" [ngValue]="+section.id">{{ section.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Class Subject *</span>
          <select [(ngModel)]="formData.class_subject_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [value]="0" disabled>Select class subject</option>
            <option *ngFor="let cs of classSubjects" [ngValue]="+cs.id">{{ cs.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Teacher *</span>
          <select [(ngModel)]="formData.teacher_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option [value]="0" disabled>Select teacher</option>
            <option *ngFor="let teacher of teachers" [ngValue]="+teacher.id">{{ teacher.label }}</option>
          </select>
        </label>
      </div>
    </app-form-modal>

    <!-- Deactivate Confirmation -->
    <app-form-modal
      [open]="showDeactivateModal"
      title="Deactivate Assignment"
      [subtitle]="'Are you sure you want to deactivate this assignment for \\'' + (deactivatingRow?.teacherName || '') + '\\'?'"
      confirmText="Deactivate"
      loadingText="Deactivating..."
      [loading]="isDeactivating"
      [danger]="true"
      (close)="showDeactivateModal = false"
      (confirm)="confirmDeactivate()"
    >
      <p class="text-sm text-slate-600">The teacher will be unassigned from this section. This action can be reversed by creating a new assignment.</p>
    </app-form-modal>
  `,
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
