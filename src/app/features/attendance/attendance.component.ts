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
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.css',
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
