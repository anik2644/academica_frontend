import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractList, getErrorMessage, readBoolean, readString } from '../../../core/utils/api-response.utils';

interface ExamRow {
  id: string;
  name: string;
  examType: string;
  className: string;
  academicYearLabel: string;
  dateRange: string;
  resultPublished: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
      <div class="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-slate-950 via-primary-900 to-accent-700"></div>
      <div class="relative p-6 sm:p-8">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
              Live Exam Registry
            </div>
            <h1 class="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Exams</h1>
            <p class="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
              A live exam board with class and academic year context, publication state, and direct access to the full exam dossier.
            </p>
          </div>
          <div class="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-100 backdrop-blur">
            <div class="text-xs uppercase tracking-[0.2em] text-white/60">Data Source</div>
            <div class="mt-1 font-medium">GET /api/v1/exams</div>
          </div>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div *ngFor="let stat of stats" class="rounded-2xl border border-slate-200/70 bg-white/95 p-4">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ stat.label }}</div>
            <div class="mt-3 text-3xl font-semibold text-slate-950">{{ stat.value }}</div>
            <div class="mt-3 text-sm text-slate-600">{{ stat.detail }}</div>
          </div>
        </div>

        <div *ngIf="errorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </div>

        <div *ngIf="isLoading" class="mt-6 space-y-3">
          <div *ngFor="let row of [1,2,3]" class="h-24 animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div *ngIf="!isLoading" class="mt-6 grid gap-4 lg:grid-cols-2">
          <article *ngFor="let exam of rows" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">{{ exam.examType }}</div>
                <h2 class="mt-2 text-xl font-semibold text-slate-950">{{ exam.name }}</h2>
              </div>
              <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="exam.resultPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
                {{ exam.resultPublished ? 'Published' : 'Draft' }}
              </span>
            </div>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Class</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.className }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Academic Year</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.academicYearLabel }}</div>
              </div>
              <div class="rounded-2xl bg-slate-50 px-4 py-3 sm:col-span-2">
                <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Window</div>
                <div class="mt-1 text-sm font-medium text-slate-900">{{ exam.dateRange }}</div>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span class="text-sm text-slate-500">{{ exam.isActive ? 'Active exam record' : 'Inactive exam record' }}</span>
              <a [routerLink]="['/exams', exam.id]" class="rounded-2xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700">
                Open details
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
})
export class ExamsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  isLoading = true;
  errorMessage = '';
  rows: ExamRow[] = [];

  ngOnInit(): void {
    forkJoin({
      exams: this.api.listExams(),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ exams, years, classes }) => {
        const yearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        const classMap = new Map(extractList<unknown>(classes).map((item) => [readString(item, 'id'), readString(item, 'name')]));
        this.rows = extractList<unknown>(exams).map((item) => ({
          id: readString(item, 'id'),
          name: readString(item, 'name'),
          examType: this.formatLabel(readString(item, 'examType')),
          className: classMap.get(readString(item, 'classId')) || readString(item, 'classId'),
          academicYearLabel: yearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
          dateRange: this.buildDateRange(readString(item, 'startDate'), readString(item, 'endDate')),
          resultPublished: readBoolean(item, 'resultPublished'),
          isActive: readBoolean(item, 'isActive'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Exams could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  get stats() {
    return [
      { label: 'Exams', value: this.rows.length, detail: 'All exam definitions returned by the live API.' },
      { label: 'Published', value: this.rows.filter((row) => row.resultPublished).length, detail: 'Exams with published result state.' },
      { label: 'Active', value: this.rows.filter((row) => row.isActive).length, detail: 'Exams currently marked active.' },
      { label: 'Classes Covered', value: new Set(this.rows.map((row) => row.className)).size, detail: 'Distinct classes represented in the exam list.' },
    ];
  }

  private formatLabel(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not available';
  }

  private buildDateRange(start: string, end: string): string {
    if (!start && !end) {
      return 'Dates unavailable';
    }

    const startLabel = start ? formatDate(start, 'MMM d', 'en-US') : 'N/A';
    const endLabel = end ? formatDate(end, 'MMM d, y', 'en-US') : 'N/A';
    return `${startLabel} to ${endLabel}`;
  }
}
