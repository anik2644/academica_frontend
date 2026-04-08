import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
import { NotificationService } from '../../core/services/notification.service';
import {
  extractList,
  getErrorMessage,
  readString,
} from '../../core/utils/api-response.utils';
import {
  AcademicResourceColumn,
  AcademicResourceMetric,
  AcademicResourcePageComponent,
} from '../../shared/components/academic-resource-page/academic-resource-page.component';
import { FormModalComponent } from '../../shared/components/form-modal/form-modal.component';

interface EnrollmentRow {
  id: string;
  studentName: string;
  sectionId: string;
  sectionLabel: string;
  academicYearLabel: string;
  rollNumber: string;
  enrollmentDate: string;
  activeStatus: string;
  status: string;
}

interface DropdownOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, AcademicResourcePageComponent, FormModalComponent],
  templateUrl: './enrollments.component.html',
  styleUrl: './enrollments.component.css',
})
export class EnrollmentsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: EnrollmentRow[] = [];

  studentOptions: DropdownOption[] = [];
  sectionOptions: DropdownOption[] = [];
  yearOptions: DropdownOption[] = [];

  showFormModal = false;
  isSaving = false;
  formData = { student_id: '', section_id: '', academic_year_id: '', roll_number: '', enrollment_date: '' };

  showTransferModal = false;
  isTransferring = false;
  transferringRow: EnrollmentRow | null = null;
  transferData = { section_id: '' };

  readonly columns: AcademicResourceColumn<EnrollmentRow>[] = [
    {
      label: 'Student',
      value: (row) => row.studentName,
      secondary: (row) => row.id,
      badge: (row) => row.activeStatus,
    },
    {
      label: 'Placement',
      value: (row) => row.sectionLabel || row.sectionId,
      secondary: (row) => row.academicYearLabel,
    },
    {
      label: 'Roll & Status',
      value: (row) => `Roll ${row.rollNumber || 'N/A'}`,
      secondary: (row) => this.formatLabel(row.status),
    },
    {
      label: 'Enrollment Date',
      value: (row) => this.formatDate(row.enrollmentDate),
      secondary: () => 'Live backend record',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const activeCount = this.rows.filter((row) => row.activeStatus === 'active').length;
    const runningCount = this.rows.filter((row) => row.status === 'running').length;
    const promotedCount = this.rows.filter((row) => row.status === 'promoted').length;

    return [
      { label: 'Enrollments', value: this.rows.length, detail: 'All enrollment records from the live API.', tone: 'primary' },
      { label: 'Active', value: activeCount, detail: 'Currently active enrollments.', tone: 'accent' },
      { label: 'Running', value: runningCount, detail: 'Students actively running in their current placement.', tone: 'amber' },
      { label: 'Promoted', value: promotedCount, detail: 'Historical enrollments already promoted forward.', tone: 'rose' },
    ];
  }

  readonly searchIndex = (row: EnrollmentRow): string =>
    [row.studentName, row.sectionId, row.sectionLabel, row.academicYearLabel, row.rollNumber, row.status, row.activeStatus].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      enrollmentsResponse: this.api.listEnrollments(),
      studentsResponse: this.api.listStudents(),
      yearsResponse: this.api.listAcademicYears(),
      sectionsResponse: this.api.listSections(),
    }).subscribe({
      next: ({ enrollmentsResponse, studentsResponse, yearsResponse, sectionsResponse }) => {
        const studentList = extractList<unknown>(studentsResponse);
        const studentMap = new Map(
          studentList.map((item) => [
            readString(item, 'id'),
            [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
          ])
        );

        const yearList = extractList<unknown>(yearsResponse);
        const yearMap = new Map(
          yearList.map((item) => [readString(item, 'id'), readString(item, 'label')])
        );

        const sectionList = extractList<unknown>(sectionsResponse);
        const sectionMap = new Map(
          sectionList.map((item) => [readString(item, 'id'), readString(item, 'name', 'label')])
        );

        this.studentOptions = studentList.map((item) => ({
          id: readString(item, 'id'),
          label: [readString(item, 'firstName'), readString(item, 'middleName'), readString(item, 'lastName')].filter(Boolean).join(' '),
        }));

        this.sectionOptions = sectionList.map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'name', 'label') || readString(item, 'id'),
        }));

        this.yearOptions = yearList.map((item) => ({
          id: readString(item, 'id'),
          label: readString(item, 'label'),
        }));

        this.rows = extractList<unknown>(enrollmentsResponse).map((item) => ({
          id: readString(item, 'id'),
          studentName: studentMap.get(readString(item, 'studentId')) || 'Student unavailable',
          sectionId: readString(item, 'sectionId'),
          sectionLabel: sectionMap.get(readString(item, 'sectionId')) || readString(item, 'sectionId'),
          academicYearLabel: yearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
          rollNumber: readString(item, 'rollNumber'),
          enrollmentDate: readString(item, 'enrollmentDate'),
          activeStatus: readString(item, 'activeStatus'),
          status: readString(item, 'status'),
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Enrollments could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.formData = { student_id: '', section_id: '', academic_year_id: '', roll_number: '', enrollment_date: '' };
    this.showFormModal = true;
  }

  openTransferModal(row: EnrollmentRow): void {
    this.transferringRow = row;
    this.transferData = { section_id: '' };
    this.showTransferModal = true;
  }

  saveForm(): void {
    if (!this.formData.student_id || !this.formData.section_id || !this.formData.academic_year_id || !this.formData.roll_number || !this.formData.enrollment_date) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      student_id: Number(this.formData.student_id),
      section_id: Number(this.formData.section_id),
      academic_year_id: Number(this.formData.academic_year_id),
      roll_number: Number(this.formData.roll_number),
      enrollment_date: this.formData.enrollment_date,
    };

    this.api.createEnrollment(payload).subscribe({
      next: () => {
        this.notify.success('Student enrolled successfully.');
        this.showFormModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to enroll student.'));
        this.isSaving = false;
      },
    });
  }

  confirmTransfer(): void {
    if (!this.transferringRow || !this.transferData.section_id) {
      this.notify.warning('Please select a new section.');
      return;
    }
    this.isTransferring = true;
    const payload: Record<string, unknown> = {
      section_id: Number(this.transferData.section_id),
    };

    this.api.transferEnrollment(this.transferringRow.id, payload).subscribe({
      next: () => {
        this.notify.success('Enrollment transferred successfully.');
        this.showTransferModal = false;
        this.isTransferring = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to transfer enrollment.'));
        this.isTransferring = false;
      },
    });
  }

  private formatLabel(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Not available';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'N/A';
  }
}
