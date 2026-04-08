import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractList, getErrorMessage, readBoolean, readString } from '../../../core/utils/api-response.utils';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

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

interface SelectOption {
  id: string;
  label: string;
}

@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PageLoaderComponent, FormModalComponent],
  templateUrl: './exams-list.component.html',
  styleUrl: './exams-list.component.css',
})
export class ExamsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  rows: ExamRow[] = [];

  yearOptions: SelectOption[] = [];
  classOptions: SelectOption[] = [];

  showCreateModal = false;
  isSaving = false;
  formData = this.emptyForm();

  showDeleteModal = false;
  isDeleting = false;
  deletingRow: ExamRow | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      exams: this.api.listExams(),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ exams, years, classes }) => {
        const yearList = extractList<unknown>(years);
        const classList = extractList<unknown>(classes);
        const yearMap = new Map(yearList.map((item) => [readString(item, 'id'), readString(item, 'label')]));
        const classMap = new Map(classList.map((item) => [readString(item, 'id'), readString(item, 'name')]));

        this.yearOptions = yearList.map((item) => ({ id: readString(item, 'id'), label: readString(item, 'label') }));
        this.classOptions = classList.map((item) => ({ id: readString(item, 'id'), label: readString(item, 'name') }));

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

  openCreateModal(): void {
    this.formData = this.emptyForm();
    this.showCreateModal = true;
  }

  saveExam(): void {
    if (!this.formData.name || !this.formData.exam_type || !this.formData.academic_year_id || !this.formData.class_id || !this.formData.start_date || !this.formData.end_date) {
      this.notify.warning('Please fill all required fields.');
      return;
    }
    this.isSaving = true;
    const payload: Record<string, unknown> = {
      name: this.formData.name,
      exam_type: this.formData.exam_type,
      academic_year_id: Number(this.formData.academic_year_id),
      class_id: Number(this.formData.class_id),
      start_date: this.formData.start_date,
      end_date: this.formData.end_date,
      remarks: this.formData.remarks || null,
    };
    this.api.createExam(payload).subscribe({
      next: () => {
        this.notify.success('Exam created successfully.');
        this.showCreateModal = false;
        this.isSaving = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to create exam.'));
        this.isSaving = false;
      },
    });
  }

  openDeleteModal(exam: ExamRow): void {
    this.deletingRow = exam;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deletingRow) return;
    this.isDeleting = true;
    this.api.deleteExam(this.deletingRow.id).subscribe({
      next: () => {
        this.notify.success('Exam deleted successfully.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete exam.'));
        this.isDeleting = false;
      },
    });
  }

  private emptyForm() {
    return { name: '', exam_type: '', academic_year_id: 0, class_id: 0, start_date: '', end_date: '', remarks: '' };
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
