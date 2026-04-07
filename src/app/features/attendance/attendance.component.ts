import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { extractList, getErrorMessage, readNumber, readString } from '../../core/utils/api-response.utils';

interface EnrollmentOption {
  id: string;
  label: string;
}

interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  remarks: string;
  lateMinutes: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
      <div class="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-slate-950 via-primary-900 to-accent-700"></div>
      <div class="relative p-6 sm:p-8">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
            <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
            Live Attendance Query
          </div>
          <h1 class="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Daily Attendance</h1>
          <p class="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
            This page uses the attendance API exactly as implemented by your backend, including its required query parameters: enrollment, from date, and to date.
          </p>
        </div>

        <div class="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside class="rounded-[24px] border border-slate-200 bg-white/95 p-5">
            <h2 class="text-lg font-semibold text-slate-900">Attendance Filters</h2>
            <p class="mt-2 text-sm text-slate-600">Choose an enrollment and date range to query real attendance records.</p>

            <div class="mt-5 space-y-4">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Enrollment</span>
                <select [(ngModel)]="selectedEnrollmentId" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option *ngFor="let option of enrollmentOptions" [value]="option.id">{{ option.label }}</option>
                </select>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">From</span>
                <input [(ngModel)]="fromDate" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">To</span>
                <input [(ngModel)]="toDate" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </label>

              <button type="button" (click)="loadAttendance()" class="w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700">
                Load Attendance
              </button>
            </div>

            <div class="mt-6 grid gap-3">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Records</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ attendanceRows.length }}</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Present</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ countByStatus('present') }}</div>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Absent / Leave</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ countByStatus('absent') + countByStatus('leave') }}</div>
              </div>
            </div>
          </aside>

          <section class="rounded-[24px] border border-slate-200 bg-white/95 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Attendance Records</h2>
                <p class="mt-1 text-sm text-slate-600">Results for the current enrollment and date range query.</p>
              </div>
              <div class="text-sm text-slate-500">{{ fromDate }} to {{ toDate }}</div>
            </div>

            <div *ngIf="errorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {{ errorMessage }}
            </div>

            <div *ngIf="isLoading" class="mt-5 space-y-3">
              <div *ngFor="let row of [1,2,3,4]" class="h-16 animate-pulse rounded-2xl bg-slate-100"></div>
            </div>

            <div *ngIf="!isLoading && attendanceRows.length" class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Late Minutes</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  <tr *ngFor="let row of attendanceRows">
                    <td class="px-4 py-3 text-sm text-slate-900">{{ formatDateValue(row.date) }}</td>
                    <td class="px-4 py-3 text-sm">
                      <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="statusClass(row.status)">
                        {{ row.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-700">{{ row.lateMinutes || '0' }}</td>
                    <td class="px-4 py-3 text-sm text-slate-700">{{ row.remarks || 'No remarks' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="!isLoading && !attendanceRows.length" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">
              No attendance rows were returned for the selected enrollment and date range.
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  enrollmentOptions: EnrollmentOption[] = [];
  selectedEnrollmentId = '';
  fromDate = '2025-03-01';
  toDate = '2025-03-31';
  attendanceRows: AttendanceRow[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    forkJoin({
      enrollments: this.api.listEnrollments(),
      students: this.api.listStudents(),
    }).subscribe({
      next: ({ enrollments, students }) => {
        const studentMap = new Map(
          extractList<unknown>(students).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );
        this.enrollmentOptions = extractList<unknown>(enrollments).map((item) => {
          const enrollmentId = readString(item, 'id');
          return {
            id: enrollmentId,
            label: `${studentMap.get(readString(item, 'studentId')) || 'Student'} • Roll ${readString(item, 'rollNumber')} • ${readString(item, 'sectionId')}`,
          };
        });
        this.selectedEnrollmentId = this.enrollmentOptions[0]?.id ?? '';
        if (this.selectedEnrollmentId) {
          this.loadAttendance();
        }
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Enrollment options could not be loaded for attendance queries.');
      },
    });
  }

  loadAttendance(): void {
    if (!this.selectedEnrollmentId) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.api
      .listAttendance({
        enrollmentId: this.selectedEnrollmentId,
        from: this.fromDate,
        to: this.toDate,
      })
      .subscribe({
        next: (response) => {
          this.attendanceRows = extractList<unknown>(response).map((item) => ({
            id: readString(item, 'id'),
            date: readString(item, 'attendanceDate', 'attendance_date'),
            status: readString(item, 'status'),
            remarks: readString(item, 'remarks'),
            lateMinutes: String(readNumber(item, 'lateMinutes', 'late_minutes') ?? ''),
          }));
          this.isLoading = false;
        },
        error: (error) => {
          this.attendanceRows = [];
          this.errorMessage = getErrorMessage(error, 'Attendance could not be loaded from the API.');
          this.isLoading = false;
        },
      });
  }

  countByStatus(status: string): number {
    return this.attendanceRows.filter((row) => row.status === status).length;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      present: 'bg-emerald-100 text-emerald-700',
      absent: 'bg-rose-100 text-rose-700',
      leave: 'bg-blue-100 text-blue-700',
      late: 'bg-amber-100 text-amber-700',
    };
    return classes[status] || 'bg-slate-100 text-slate-700';
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
