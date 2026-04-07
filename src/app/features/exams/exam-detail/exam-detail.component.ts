import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readNumber, readString } from '../../../core/utils/api-response.utils';

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/exams" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to exams</a>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{{ examName }}</h1>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" [ngClass]="resultPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
          {{ resultPublished ? 'Results Published' : 'Results Pending' }}
        </span>
      </div>

      <div *ngIf="errorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ errorMessage }}</div>

      <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div *ngFor="let stat of stats" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ stat.label }}</div>
          <div class="mt-3 text-3xl font-semibold text-slate-950">{{ stat.value }}</div>
          <div class="mt-3 text-sm text-slate-600">{{ stat.detail }}</div>
        </div>
      </div>

      <div class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 class="text-lg font-semibold text-slate-900">Schedule</h2>
          <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Room</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class Subject</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr *ngFor="let row of schedules">
                  <td class="px-4 py-3 text-sm text-slate-900">{{ formatDateValue(row.examDate) }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.startTime }} - {{ row.endTime }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.room || 'N/A' }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.classSubjectId }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <h2 class="text-lg font-semibold text-slate-900">Results</h2>
          <div class="mt-4 space-y-3">
            <article *ngFor="let row of results" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900">{{ row.studentName }}</div>
                  <div class="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{{ row.classSubjectId }}</div>
                </div>
                <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="row.isAbsent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ row.isAbsent ? 'Absent' : (row.grade || 'Recorded') }}
                </span>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Marks</div>
                  <div class="mt-1 text-slate-900">{{ row.marksObtained || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-xs uppercase tracking-[0.16em] text-slate-500">GPA</div>
                  <div class="mt-1 text-slate-900">{{ row.gpa || 'N/A' }}</div>
                </div>
                <div>
                  <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Entered</div>
                  <div class="mt-1 text-slate-900">{{ formatShortDate(row.enteredAt) }}</div>
                </div>
              </div>
            </article>
            <div *ngIf="!results.length" class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center text-sm text-slate-600">
              No result rows were returned for this exam.
            </div>
          </div>
        </section>
      </div>
    </section>
  `,
})
export class ExamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  examName = 'Exam Details';
  resultPublished = false;
  errorMessage = '';
  schedules: Array<{ examDate: string; startTime: string; endTime: string; room: string; classSubjectId: string }> = [];
  results: Array<{ studentName: string; classSubjectId: string; marksObtained: string; grade: string; gpa: string; isAbsent: boolean; enteredAt: string }> = [];
  stats: Array<{ label: string; value: string | number; detail: string }> = [];

  ngOnInit(): void {
    const examId = this.route.snapshot.paramMap.get('id');
    if (!examId) {
      this.errorMessage = 'Exam id is missing from the route.';
      return;
    }

    forkJoin({
      exam: this.api.getExam(examId),
      schedules: this.api.listExamSchedules(examId),
      results: this.api.listExamResults(examId),
      exams: this.api.listExams(),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
      enrollments: this.api.listEnrollments(),
      students: this.api.listStudents(),
    }).subscribe({
      next: ({ exam, schedules, results, years, classes, enrollments, students }) => {
        const examRecord = extractItem<unknown>(exam);
        const yearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        const classMap = new Map(extractList<unknown>(classes).map((item) => [readString(item, 'id'), readString(item, 'name')]));
        const enrollmentMap = new Map(extractList<unknown>(enrollments).map((item) => [readString(item, 'id'), readString(item, 'studentId')]));
        const studentMap = new Map(
          extractList<unknown>(students).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );

        this.examName = readString(examRecord, 'name') || 'Exam Details';
        this.resultPublished = readBoolean(examRecord, 'resultPublished');
        this.schedules = extractList<unknown>(schedules).map((item) => ({
          examDate: readString(item, 'examDate'),
          startTime: readString(item, 'startTime'),
          endTime: readString(item, 'endTime'),
          room: readString(item, 'room'),
          classSubjectId: readString(item, 'classSubjectId'),
        }));
        this.results = extractList<unknown>(results).map((item) => {
          const studentId = enrollmentMap.get(readString(item, 'enrollmentId')) || '';
          return {
            studentName: studentMap.get(studentId) || 'Student unavailable',
            classSubjectId: readString(item, 'classSubjectId'),
            marksObtained: this.numericLabel(readNumber(item, 'marksObtained')),
            grade: readString(item, 'grade'),
            gpa: this.numericLabel(readNumber(item, 'gpa')),
            isAbsent: readBoolean(item, 'isAbsent'),
            enteredAt: readString(item, 'enteredAt'),
          };
        });

        this.stats = [
          { label: 'Class', value: classMap.get(readString(examRecord, 'classId')) || readString(examRecord, 'classId'), detail: 'Class attached to this exam.' },
          { label: 'Academic Year', value: yearMap.get(readString(examRecord, 'academicYearId')) || readString(examRecord, 'academicYearId'), detail: 'Academic year attached to this exam.' },
          { label: 'Schedules', value: this.schedules.length, detail: 'Schedule lines loaded for the selected exam.' },
          { label: 'Results', value: this.results.length, detail: 'Recorded result rows returned by the results endpoint.' },
        ];
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Exam details could not be loaded from the API.');
      },
    });
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }

  formatShortDate(value: string): string {
    return value ? formatDate(value, 'MMM d', 'en-US') : 'N/A';
  }

  private numericLabel(value: number | null): string {
    return value === null ? '' : String(value);
  }
}
