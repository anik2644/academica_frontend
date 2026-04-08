import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { extractList, getErrorMessage, readNumber, readString } from '../../core/utils/api-response.utils';
import { PageLoaderComponent } from '../../shared/components/page-loader/page-loader.component';

interface SectionOption {
  id: string;
  label: string;
}

interface StudentAttendanceRow {
  enrollmentId: string;
  studentName: string;
  rollNumber: string;
  status: string;
  lateMinutes: number;
  remarks: string;
  existingId: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLoaderComponent],
  template: `
    <section class="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
      <div class="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-slate-950 via-primary-900 to-accent-700"></div>
      <div class="relative p-6 sm:p-8">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Daily Attendance</h1>
        </div>

        <div class="mt-8 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <!-- Sidebar: Section & Date Selection -->
          <aside class="rounded-[24px] border border-slate-200 bg-white/95 p-5">
            <h2 class="text-lg font-semibold text-slate-900">Select Section & Date</h2>
            <p class="mt-2 text-sm text-slate-600">Pick a section and date to view and mark attendance for all students.</p>

            <div class="mt-5 space-y-4">
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Section *</span>
                <select [(ngModel)]="selectedSectionId" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <option value="" disabled>Select a section</option>
                  <option *ngFor="let option of sectionOptions" [value]="option.id">{{ option.label }}</option>
                </select>
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Date *</span>
                <input [(ngModel)]="selectedDate" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              </label>

              <button type="button" (click)="loadAttendance()" [disabled]="!selectedSectionId || !selectedDate" class="w-full rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                Load Students
              </button>
            </div>

            <div class="mt-6 grid gap-3">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-slate-500">Students</div>
                <div class="mt-2 text-2xl font-semibold text-slate-900">{{ studentRows.length }}</div>
              </div>
              <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-emerald-600">Present</div>
                <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ countByStatus('present') }}</div>
              </div>
              <div class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-rose-600">Absent</div>
                <div class="mt-2 text-2xl font-semibold text-rose-700">{{ countByStatus('absent') }}</div>
              </div>
              <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div class="text-xs uppercase tracking-[0.18em] text-amber-600">Late / Leave</div>
                <div class="mt-2 text-2xl font-semibold text-amber-700">{{ countByStatus('late') + countByStatus('leave') }}</div>
              </div>
            </div>
          </aside>

          <!-- Main: Student Attendance Table -->
          <section class="rounded-[24px] border border-slate-200 bg-white/95 p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Attendance Sheet</h2>
                <p class="mt-1 text-sm text-slate-600">
                  <span *ngIf="selectedDate">{{ formatDateValue(selectedDate) }}</span>
                  <span *ngIf="!selectedDate">Select a section and date to begin.</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button *ngIf="studentRows.length && hasUnsavedChanges" type="button" (click)="submitBulkAttendance()" [disabled]="isSaving"
                  class="rounded-2xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50">
                  {{ isSaving ? 'Saving...' : 'Save All Attendance' }}
                </button>
                <button *ngIf="studentRows.length" type="button" (click)="markAllPresent()"
                  class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100">
                  Mark All Present
                </button>
                <button *ngIf="studentRows.length" type="button" (click)="markAllAbsent()"
                  class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100">
                  Mark All Absent
                </button>
              </div>
            </div>

            <div *ngIf="errorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {{ errorMessage }}
            </div>

            <div *ngIf="isLoading" class="mt-5">
              <app-page-loader
                title="Loading students"
                message="Fetching students enrolled in this section."
                [blockHeights]="[72, 72, 72, 72]"
              ></app-page-loader>
            </div>

            <div *ngIf="!isLoading && studentRows.length" class="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Roll</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Late Min</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Remarks</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  <tr *ngFor="let row of studentRows; let i = index" class="transition" [ngClass]="rowBgClass(row.status)">
                    <td class="px-4 py-3 text-sm font-semibold text-slate-900">{{ row.rollNumber }}</td>
                    <td class="px-4 py-3 text-sm text-slate-900">{{ row.studentName }}</td>
                    <td class="px-4 py-3">
                      <select [(ngModel)]="row.status" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium">
                        <option value="">Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="leave">Leave</option>
                        <option value="holiday">Holiday</option>
                      </select>
                    </td>
                    <td class="px-4 py-3">
                      <input *ngIf="row.status === 'late'" [(ngModel)]="row.lateMinutes" type="number" min="0" placeholder="0"
                        class="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                      <span *ngIf="row.status !== 'late'" class="text-sm text-slate-400">—</span>
                    </td>
                    <td class="px-4 py-3">
                      <input [(ngModel)]="row.remarks" type="text" placeholder="Optional"
                        class="w-full min-w-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div *ngIf="!isLoading && !studentRows.length && selectedSectionId" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">
              No students found enrolled in this section. Select a different section or check enrollment records.
            </div>

            <div *ngIf="!isLoading && !selectedSectionId" class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">
              Select a section and date from the sidebar, then click "Load Students" to begin.
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
})
export class AttendanceComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  sectionOptions: SectionOption[] = [];
  selectedSectionId = '';
  selectedDate = '';
  studentRows: StudentAttendanceRow[] = [];
  isLoading = false;
  isSaving = false;
  errorMessage = '';

  private enrollmentList: Array<{ id: string; studentId: string; sectionId: string; rollNumber: string }> = [];
  private studentMap = new Map<string, string>();

  ngOnInit(): void {
    const today = new Date();
    const pad = (v: number) => String(v).padStart(2, '0');
    this.selectedDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    forkJoin({
      sections: this.api.listSections(),
      enrollments: this.api.listEnrollments(),
      students: this.api.listStudents(),
      classes: this.api.listClasses(),
      years: this.api.listAcademicYears(),
    }).subscribe({
      next: ({ sections, enrollments, students, classes, years }) => {
        const classMap = new Map(
          extractList<unknown>(classes).map((item) => [readString(item, 'id'), readString(item, 'name')])
        );
        const yearMap = new Map(
          extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')])
        );

        this.sectionOptions = extractList<unknown>(sections).map((item) => {
          const className = classMap.get(readString(item, 'classId', 'class_id')) || '';
          const yearLabel = yearMap.get(readString(item, 'academicYearId', 'academic_year_id')) || '';
          const name = readString(item, 'displayName', 'display_name') || readString(item, 'name');
          return {
            id: readString(item, 'id'),
            label: [className, name, yearLabel].filter(Boolean).join(' — '),
          };
        });

        this.studentMap = new Map(
          extractList<unknown>(students).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName', 'first_name'), readString(item, 'middleName', 'middle_name'), readString(item, 'lastName', 'last_name')].filter(Boolean).join(' '),
          ])
        );

        this.enrollmentList = extractList<unknown>(enrollments).map((item) => ({
          id: readString(item, 'id'),
          studentId: readString(item, 'studentId', 'student_id'),
          sectionId: readString(item, 'sectionId', 'section_id'),
          rollNumber: readString(item, 'rollNumber', 'roll_number'),
        }));

        this.selectedSectionId = this.sectionOptions[0]?.id ?? '';
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Could not load section and enrollment data.');
      },
    });
  }

  loadAttendance(): void {
    if (!this.selectedSectionId || !this.selectedDate) return;

    this.isLoading = true;
    this.errorMessage = '';

    const sectionEnrollments = this.enrollmentList
      .filter((e) => e.sectionId === this.selectedSectionId)
      .sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber));

    this.api.listAttendanceBySection(this.selectedSectionId, {
      date: this.selectedDate,
      attendance_date: this.selectedDate,
    }).subscribe({
      next: (response) => {
        const existingAttendance = new Map(
          extractList<unknown>(response).map((item) => [
            readString(item, 'enrollmentId', 'enrollment_id'),
            {
              id: readString(item, 'id'),
              status: readString(item, 'status'),
              lateMinutes: readNumber(item, 'lateMinutes', 'late_minutes') ?? 0,
              remarks: readString(item, 'remarks'),
            },
          ])
        );

        this.studentRows = sectionEnrollments.map((enrollment) => {
          const existing = existingAttendance.get(enrollment.id);
          return {
            enrollmentId: enrollment.id,
            studentName: this.studentMap.get(enrollment.studentId) || 'Unknown Student',
            rollNumber: enrollment.rollNumber || '—',
            status: existing?.status || '',
            lateMinutes: existing?.lateMinutes || 0,
            remarks: existing?.remarks || '',
            existingId: existing?.id || '',
          };
        });

        this.isLoading = false;
      },
      error: (error) => {
        const sectionEnrollmentsFallback = this.enrollmentList
          .filter((e) => e.sectionId === this.selectedSectionId)
          .sort((a, b) => Number(a.rollNumber) - Number(b.rollNumber));

        this.studentRows = sectionEnrollmentsFallback.map((enrollment) => ({
          enrollmentId: enrollment.id,
          studentName: this.studentMap.get(enrollment.studentId) || 'Unknown Student',
          rollNumber: enrollment.rollNumber || '—',
          status: '',
          lateMinutes: 0,
          remarks: '',
          existingId: '',
        }));

        this.isLoading = false;
      },
    });
  }

  get hasUnsavedChanges(): boolean {
    return this.studentRows.some((row) => row.status !== '');
  }

  markAllPresent(): void {
    this.studentRows.forEach((row) => {
      row.status = 'present';
      row.lateMinutes = 0;
    });
  }

  markAllAbsent(): void {
    this.studentRows.forEach((row) => {
      row.status = 'absent';
      row.lateMinutes = 0;
    });
  }

  submitBulkAttendance(): void {
    const records = this.studentRows
      .filter((row) => row.status)
      .map((row) => ({
        enrollment_id: row.enrollmentId,
        attendance_date: this.selectedDate,
        status: row.status,
        late_minutes: row.status === 'late' ? row.lateMinutes : 0,
        remarks: row.remarks,
      }));

    if (!records.length) {
      this.notify.warning('No attendance statuses selected.');
      return;
    }

    this.isSaving = true;
    this.api.createAttendanceBulk({ records }).subscribe({
      next: () => {
        this.notify.success(`Attendance saved for ${records.length} student(s).`);
        this.isSaving = false;
        this.loadAttendance();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to save bulk attendance.'));
        this.isSaving = false;
      },
    });
  }

  countByStatus(status: string): number {
    return this.studentRows.filter((row) => row.status === status).length;
  }

  rowBgClass(status: string): string {
    const classes: Record<string, string> = {
      present: 'bg-emerald-50/50',
      absent: 'bg-rose-50/50',
      late: 'bg-amber-50/50',
      leave: 'bg-blue-50/50',
    };
    return classes[status] || '';
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'EEEE, MMMM d, y', 'en-US') : 'N/A';
  }
}
