import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { extractList, getErrorMessage, readBoolean, readString } from '../../core/utils/api-response.utils';

interface SectionOption {
  id: string;
  label: string;
}

interface SectionTeacherRow {
  id: string;
  teacherName: string;
  classSubjectId: string;
  sectionId: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-section-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            <span class="h-2 w-2 rounded-full bg-primary-500"></span>
            Query-based Assignment View
          </div>
          <h1 class="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Section Teachers</h1>
          <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            This page uses the exact query pattern required by your backend: sectionId plus academicYearId.
          </p>
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
            <div class="text-sm text-slate-500">{{ assignments.length }} assignments</div>
          </div>

          <div *ngIf="errorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ errorMessage }}</div>

          <div *ngIf="isLoading" class="mt-5 space-y-3">
            <div *ngFor="let row of [1,2,3]" class="h-16 animate-pulse rounded-2xl bg-slate-100"></div>
          </div>

          <div *ngIf="!isLoading && assignments.length" class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Teacher</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class Subject</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Created</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr *ngFor="let row of assignments">
                  <td class="px-4 py-3 text-sm text-slate-900">{{ row.teacherName }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.classSubjectId }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
                      {{ row.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ formatDateValue(row.createdAt) }}</td>
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
  `,
})
export class SectionTeachersComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  academicYears: Array<{ id: string; label: string }> = [];
  sections: SectionOption[] = [];
  selectedAcademicYearId = '';
  selectedSectionId = '';
  assignments: SectionTeacherRow[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    forkJoin({
      years: this.api.listAcademicYears(),
      enrollments: this.api.listEnrollments(),
    }).subscribe({
      next: ({ years, enrollments }) => {
        this.academicYears = extractList<unknown>(years).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label'),
        }));
        this.sections = Array.from(
          new Map(
            extractList<unknown>(enrollments).map((item) => [
              readString(item, 'sectionId'),
              {
                id: readString(item, 'sectionId'),
                label: readString(item, 'sectionId'),
              },
            ])
          ).values()
        );
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
        this.assignments = extractList<unknown>(response).map((item) => ({
          id: readString(item, 'id'),
          teacherName: readString(item, 'teacherName', 'teacherId'),
          classSubjectId: readString(item, 'classSubjectId'),
          sectionId: readString(item, 'sectionId'),
          academicYearId: readString(item, 'academicYearId'),
          isActive: readBoolean(item, 'isActive'),
          createdAt: readString(item, 'createdAt'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.assignments = [];
        this.errorMessage = getErrorMessage(error, 'Section teacher assignments could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
