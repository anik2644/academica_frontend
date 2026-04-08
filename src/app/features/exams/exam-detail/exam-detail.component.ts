import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readNumber, readString } from '../../../core/utils/api-response.utils';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface ScheduleRow {
  id: string;
  examDate: string;
  startTime: string;
  endTime: string;
  room: string;
  classSubjectId: string;
  sectionId: string;
  fullMarks: string;
  passMarks: string;
}

interface ResultRow {
  id: string;
  enrollmentId: string;
  examScheduleId: string;
  studentName: string;
  classSubjectId: string;
  marksObtained: string;
  grade: string;
  gpa: string;
  isAbsent: boolean;
  enteredAt: string;
}

interface SelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FormModalComponent],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/exams" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to exams</a>
          <div class="mt-3 flex items-center gap-3">
            <h1 class="text-3xl font-semibold tracking-tight text-slate-950">{{ examName }}</h1>
            <button (click)="openEditModal()" class="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Edit
            </button>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button *ngIf="!resultPublished" (click)="openPublishModal()" class="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Publish Results
          </button>
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" [ngClass]="resultPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'">
            {{ resultPublished ? 'Results Published' : 'Results Pending' }}
          </span>
        </div>
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
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Schedule</h2>
            <button (click)="openAddScheduleModal()" class="rounded-xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-700">
              Add Schedule
            </button>
          </div>
          <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Room</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Class Subject</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 bg-white">
                <tr *ngFor="let row of schedules">
                  <td class="px-4 py-3 text-sm text-slate-900">{{ formatDateValue(row.examDate) }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.startTime }} - {{ row.endTime }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.room || 'N/A' }}</td>
                  <td class="px-4 py-3 text-sm text-slate-700">{{ row.classSubjectId }}</td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="openDeleteScheduleModal(row)" class="text-sm font-medium text-rose-600 transition hover:text-rose-700">
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="rounded-[24px] border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Results</h2>
            <button (click)="openAddResultModal()" class="rounded-xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-700">
              Add Result
            </button>
          </div>
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

    <!-- Edit Exam Modal -->
    <app-form-modal
      [open]="showEditModal"
      title="Edit Exam"
      confirmText="Update"
      loadingText="Updating..."
      [loading]="isSavingEdit"
      (close)="showEditModal = false"
      (confirm)="saveEdit()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Name *</span>
          <input [(ngModel)]="editForm.name" type="text" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Start Date *</span>
            <input [(ngModel)]="editForm.start_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">End Date *</span>
            <input [(ngModel)]="editForm.end_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <textarea [(ngModel)]="editForm.remarks" rows="2" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>

    <!-- Add Schedule Modal -->
    <app-form-modal
      [open]="showScheduleModal"
      title="Add Schedule"
      confirmText="Create"
      loadingText="Creating..."
      [loading]="isSavingSchedule"
      (close)="showScheduleModal = false"
      (confirm)="saveSchedule()"
    >
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Class Subject *</span>
            <select [(ngModel)]="scheduleForm.class_subject_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="" disabled>Select class subject</option>
              <option *ngFor="let opt of classSubjectOptions" [value]="opt.id">{{ opt.label }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Section *</span>
            <select [(ngModel)]="scheduleForm.section_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="" disabled>Select section</option>
              <option *ngFor="let opt of sectionOptions" [value]="opt.id">{{ opt.label }}</option>
            </select>
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Exam Date *</span>
          <input [(ngModel)]="scheduleForm.exam_date" type="date" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Start Time *</span>
            <input [(ngModel)]="scheduleForm.start_time" type="time" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">End Time *</span>
            <input [(ngModel)]="scheduleForm.end_time" type="time" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Room</span>
          <input [(ngModel)]="scheduleForm.room" type="text" placeholder="e.g. Room 101" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Full Marks *</span>
            <input [(ngModel)]="scheduleForm.full_marks" type="number" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Pass Marks *</span>
            <input [(ngModel)]="scheduleForm.pass_marks" type="number" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
      </div>
    </app-form-modal>

    <!-- Delete Schedule Confirmation -->
    <app-form-modal
      [open]="showDeleteScheduleModal"
      title="Delete Schedule"
      subtitle="Are you sure you want to delete this schedule entry?"
      confirmText="Delete"
      loadingText="Deleting..."
      [loading]="isDeletingSchedule"
      [danger]="true"
      (close)="showDeleteScheduleModal = false"
      (confirm)="confirmDeleteSchedule()"
    >
      <p class="text-sm text-slate-600">This action cannot be undone.</p>
    </app-form-modal>

    <!-- Add Result Modal -->
    <app-form-modal
      [open]="showResultModal"
      title="Add Result"
      confirmText="Create"
      loadingText="Creating..."
      [loading]="isSavingResult"
      (close)="showResultModal = false"
      (confirm)="saveResult()"
    >
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Enrollment *</span>
            <select [(ngModel)]="resultForm.enrollment_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="" disabled>Select enrollment</option>
              <option *ngFor="let opt of enrollmentOptions" [value]="opt.id">{{ opt.label }}</option>
            </select>
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Exam Schedule *</span>
            <select [(ngModel)]="resultForm.exam_schedule_id" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="" disabled>Select schedule</option>
              <option *ngFor="let s of schedules" [value]="s.id">{{ formatDateValue(s.examDate) }} - {{ s.classSubjectId }}</option>
            </select>
          </label>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Marks Obtained</span>
            <input [(ngModel)]="resultForm.marks_obtained" type="number" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Grade</span>
            <input [(ngModel)]="resultForm.grade" type="text" placeholder="e.g. A+" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input [(ngModel)]="resultForm.is_absent" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
          Student was absent
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <textarea [(ngModel)]="resultForm.remarks" rows="2" placeholder="Optional notes" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"></textarea>
        </label>
      </div>
    </app-form-modal>

    <!-- Publish Results Confirmation -->
    <app-form-modal
      [open]="showPublishModal"
      title="Publish Results"
      subtitle="Are you sure you want to publish results for this exam?"
      confirmText="Publish"
      loadingText="Publishing..."
      [loading]="isPublishing"
      (close)="showPublishModal = false"
      (confirm)="confirmPublish()"
    >
      <p class="text-sm text-slate-600">Once published, results will be visible to students and parents. This action cannot be easily undone.</p>
    </app-form-modal>
  `,
})
export class ExamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  examId = '';
  examName = 'Exam Details';
  resultPublished = false;
  errorMessage = '';

  schedules: ScheduleRow[] = [];
  results: ResultRow[] = [];
  stats: Array<{ label: string; value: string | number; detail: string }> = [];

  // Lookup data for dropdowns
  classSubjectOptions: SelectOption[] = [];
  sectionOptions: SelectOption[] = [];
  enrollmentOptions: SelectOption[] = [];

  // Raw maps for resolving names
  private enrollmentMap = new Map<string, string>();
  private studentMap = new Map<string, string>();

  // Edit Exam
  showEditModal = false;
  isSavingEdit = false;
  editForm = { name: '', start_date: '', end_date: '', remarks: '' };

  // Add Schedule
  showScheduleModal = false;
  isSavingSchedule = false;
  scheduleForm = this.emptyScheduleForm();

  // Delete Schedule
  showDeleteScheduleModal = false;
  isDeletingSchedule = false;
  deletingSchedule: ScheduleRow | null = null;

  // Add Result
  showResultModal = false;
  isSavingResult = false;
  resultForm = this.emptyResultForm();

  // Publish Results
  showPublishModal = false;
  isPublishing = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Exam id is missing from the route.';
      return;
    }
    this.examId = id;
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      exam: this.api.getExam(this.examId),
      schedules: this.api.listExamSchedules(this.examId),
      results: this.api.listExamResults(this.examId),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
      classSubjects: this.api.listClassSubjects(),
      sections: this.api.listSections(),
      enrollments: this.api.listEnrollments(),
      students: this.api.listStudents(),
    }).subscribe({
      next: ({ exam, schedules, results, years, classes, classSubjects, sections, enrollments, students }) => {
        const examRecord = extractItem<unknown>(exam);
        const yearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        const classMap = new Map(extractList<unknown>(classes).map((item) => [readString(item, 'id'), readString(item, 'name')]));

        this.enrollmentMap = new Map(extractList<unknown>(enrollments).map((item) => [readString(item, 'id'), readString(item, 'studentId')]));
        this.studentMap = new Map(
          extractList<unknown>(students).map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );

        // Build dropdown options
        this.classSubjectOptions = extractList<unknown>(classSubjects).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'subjectName') || readString(item, 'name') || `CS #${readString(item, 'id')}`,
        }));
        this.sectionOptions = extractList<unknown>(sections).map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'name') || `Section #${readString(item, 'id')}`,
        }));
        this.enrollmentOptions = extractList<unknown>(enrollments).map((item) => {
          const studentId = readString(item, 'studentId');
          const studentName = this.studentMap.get(studentId) || `Student #${studentId}`;
          return { id: readString(item, 'id'), label: studentName };
        });

        this.examName = readString(examRecord, 'name') || 'Exam Details';
        this.resultPublished = readBoolean(examRecord, 'resultPublished');

        // Store raw exam data for edit form
        this.editForm = {
          name: readString(examRecord, 'name'),
          start_date: readString(examRecord, 'startDate'),
          end_date: readString(examRecord, 'endDate'),
          remarks: readString(examRecord, 'remarks'),
        };

        this.schedules = extractList<unknown>(schedules).map((item) => ({
          id: readString(item, 'id'),
          examDate: readString(item, 'examDate'),
          startTime: readString(item, 'startTime'),
          endTime: readString(item, 'endTime'),
          room: readString(item, 'room'),
          classSubjectId: readString(item, 'classSubjectId'),
          sectionId: readString(item, 'sectionId'),
          fullMarks: this.numericLabel(readNumber(item, 'fullMarks')),
          passMarks: this.numericLabel(readNumber(item, 'passMarks')),
        }));

        this.results = extractList<unknown>(results).map((item) => {
          const studentId = this.enrollmentMap.get(readString(item, 'enrollmentId')) || '';
          return {
            id: readString(item, 'id'),
            enrollmentId: readString(item, 'enrollmentId'),
            examScheduleId: readString(item, 'examScheduleId'),
            studentName: this.studentMap.get(studentId) || 'Student unavailable',
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

  // --- Edit Exam ---

  openEditModal(): void {
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.editForm.name || !this.editForm.start_date || !this.editForm.end_date) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSavingEdit = true;
    const payload: Record<string, unknown> = {
      name: this.editForm.name,
      start_date: this.editForm.start_date,
      end_date: this.editForm.end_date,
      remarks: this.editForm.remarks || null,
    };
    this.api.updateExam(this.examId, payload).subscribe({
      next: () => {
        this.notify.success('Exam updated successfully.');
        this.showEditModal = false;
        this.isSavingEdit = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update exam.'));
        this.isSavingEdit = false;
      },
    });
  }

  // --- Schedule CRUD ---

  openAddScheduleModal(): void {
    this.scheduleForm = this.emptyScheduleForm();
    this.showScheduleModal = true;
  }

  saveSchedule(): void {
    if (!this.scheduleForm.class_subject_id || !this.scheduleForm.section_id || !this.scheduleForm.exam_date || !this.scheduleForm.start_time || !this.scheduleForm.end_time || !this.scheduleForm.full_marks || !this.scheduleForm.pass_marks) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSavingSchedule = true;
    const payload: Record<string, unknown> = {
      class_subject_id: Number(this.scheduleForm.class_subject_id),
      section_id: Number(this.scheduleForm.section_id),
      exam_date: this.scheduleForm.exam_date,
      start_time: this.scheduleForm.start_time,
      end_time: this.scheduleForm.end_time,
      room: this.scheduleForm.room || null,
      full_marks: Number(this.scheduleForm.full_marks),
      pass_marks: Number(this.scheduleForm.pass_marks),
    };
    this.api.createExamSchedule(this.examId, payload).subscribe({
      next: () => {
        this.notify.success('Schedule created successfully.');
        this.showScheduleModal = false;
        this.isSavingSchedule = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to create schedule.'));
        this.isSavingSchedule = false;
      },
    });
  }

  openDeleteScheduleModal(row: ScheduleRow): void {
    this.deletingSchedule = row;
    this.showDeleteScheduleModal = true;
  }

  confirmDeleteSchedule(): void {
    if (!this.deletingSchedule) return;
    this.isDeletingSchedule = true;
    this.api.deleteExamSchedule(this.examId, this.deletingSchedule.id).subscribe({
      next: () => {
        this.notify.success('Schedule deleted successfully.');
        this.showDeleteScheduleModal = false;
        this.isDeletingSchedule = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete schedule.'));
        this.isDeletingSchedule = false;
      },
    });
  }

  // --- Result CRUD ---

  openAddResultModal(): void {
    this.resultForm = this.emptyResultForm();
    this.showResultModal = true;
  }

  saveResult(): void {
    if (!this.resultForm.enrollment_id || !this.resultForm.exam_schedule_id) {
      this.notify.warning('Please select enrollment and exam schedule.');
      return;
    }
    this.isSavingResult = true;
    const payload: Record<string, unknown> = {
      enrollment_id: Number(this.resultForm.enrollment_id),
      exam_schedule_id: Number(this.resultForm.exam_schedule_id),
      marks_obtained: this.resultForm.marks_obtained ? Number(this.resultForm.marks_obtained) : null,
      is_absent: this.resultForm.is_absent,
      grade: this.resultForm.grade || null,
      remarks: this.resultForm.remarks || null,
    };
    this.api.createExamResult(this.examId, payload).subscribe({
      next: () => {
        this.notify.success('Result recorded successfully.');
        this.showResultModal = false;
        this.isSavingResult = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to create result.'));
        this.isSavingResult = false;
      },
    });
  }

  // --- Publish Results ---

  openPublishModal(): void {
    this.showPublishModal = true;
  }

  confirmPublish(): void {
    this.isPublishing = true;
    this.api.publishExamResults(this.examId).subscribe({
      next: () => {
        this.notify.success('Results published successfully.');
        this.showPublishModal = false;
        this.isPublishing = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to publish results.'));
        this.isPublishing = false;
      },
    });
  }

  // --- Helpers ---

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }

  formatShortDate(value: string): string {
    return value ? formatDate(value, 'MMM d', 'en-US') : 'N/A';
  }

  private numericLabel(value: number | null): string {
    return value === null ? '' : String(value);
  }

  private emptyScheduleForm() {
    return { class_subject_id: '', section_id: '', exam_date: '', start_time: '', end_time: '', room: '', full_marks: '', pass_marks: '' };
  }

  private emptyResultForm() {
    return { enrollment_id: '', exam_schedule_id: '', marks_obtained: '', is_absent: false, grade: '', remarks: '' };
  }
}
