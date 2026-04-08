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
  templateUrl: './exam-detail.component.html',
  styleUrl: './exam-detail.component.css',
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
