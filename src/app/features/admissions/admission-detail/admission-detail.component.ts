import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readNumber, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

interface FieldGroup {
  title: string;
  items: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
  templateUrl: './admission-detail.component.html',
  styleUrl: './admission-detail.component.css',
})
export class AdmissionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  documents: unknown[] = [];
  fees: unknown[] = [];
  previousAcademics: unknown[] = [];
  title = 'Admission Details';
  private admissionId = '';
  private academicYearMap = new Map<string, string>();
  private classMap = new Map<string, string>();

  readonly readString = readString;
  readonly readBoolean = readBoolean;
  readonly readNumber = readNumber;

  // Update Status
  showStatusModal = false;
  isSavingStatus = false;
  statusFormData = { application_status: '' };

  // Update Payment
  showPaymentModal = false;
  isSavingPayment = false;
  paymentFormData = { payment_status: '' };

  // Approve
  showApproveModal = false;
  isApproving = false;

  // Add Document
  showAddDocumentModal = false;
  isSavingDocument = false;
  documentFormData = { document_type: '', file_url: '', original_filename: '' };

  // Delete Document
  showDeleteDocumentModal = false;
  isDeletingDocument = false;
  deletingDocument: unknown = null;

  // Add Fee
  showAddFeeModal = false;
  isSavingFee = false;
  feeFormData = { fee_type: '', amount: 0, payment_method: '' };

  // Add Previous Academic
  showAddAcademicModal = false;
  isSavingAcademic = false;
  academicFormData = { institute_name: '', board: '', exam_name: '', passing_year: 0, result: '', remarks: '' };

  // Delete Previous Academic
  showDeleteAcademicModal = false;
  isDeletingAcademic = false;
  deletingAcademic: unknown = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Admission id is missing from the route.';
      this.isLoading = false;
      return;
    }

    this.admissionId = id;
    this.loadAll();
  }

  private loadAll(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      detail: this.api.getAdmission(this.admissionId),
      documents: this.api.listAdmissionDocuments(this.admissionId),
      fees: this.api.listAdmissionFees(this.admissionId),
      previousAcademics: this.api.listPreviousAcademics(this.admissionId),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ detail, documents, fees, previousAcademics, years, classes }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.documents = extractList(documents);
        this.fees = extractList(fees);
        this.previousAcademics = extractList(previousAcademics);
        this.academicYearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        this.classMap = new Map(extractList<unknown>(classes).map((item) => [readString(item, 'id'), readString(item, 'name')]));
        this.title = this.fullName(this.detail);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Admission detail could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  private reloadDetail(): void {
    this.api.getAdmission(this.admissionId).subscribe({
      next: (response) => {
        this.detail = extractItem<Record<string, unknown>>(response);
        this.title = this.fullName(this.detail);
      },
    });
  }

  private reloadDocuments(): void {
    this.api.listAdmissionDocuments(this.admissionId).subscribe({
      next: (response) => {
        this.documents = extractList(response);
      },
    });
  }

  private reloadFees(): void {
    this.api.listAdmissionFees(this.admissionId).subscribe({
      next: (response) => {
        this.fees = extractList(response);
      },
    });
  }

  private reloadAcademics(): void {
    this.api.listPreviousAcademics(this.admissionId).subscribe({
      next: (response) => {
        this.previousAcademics = extractList(response);
      },
    });
  }

  // --- Update Status ---
  openStatusModal(): void {
    this.statusFormData = {
      application_status: readString(this.detail, 'applicationStatus') || '',
    };
    this.showStatusModal = true;
  }

  confirmUpdateStatus(): void {
    if (!this.statusFormData.application_status) {
      this.notify.warning('Please select a status.');
      return;
    }
    this.isSavingStatus = true;
    this.api.updateAdmissionStatus(this.admissionId, { application_status: this.statusFormData.application_status }).subscribe({
      next: () => {
        this.notify.success('Application status updated.');
        this.showStatusModal = false;
        this.isSavingStatus = false;
        this.reloadDetail();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update application status.'));
        this.isSavingStatus = false;
      },
    });
  }

  // --- Update Payment ---
  openPaymentModal(): void {
    this.paymentFormData = {
      payment_status: readString(this.detail, 'paymentStatus') || '',
    };
    this.showPaymentModal = true;
  }

  confirmUpdatePayment(): void {
    if (!this.paymentFormData.payment_status) {
      this.notify.warning('Please select a payment status.');
      return;
    }
    this.isSavingPayment = true;
    this.api.updateAdmissionPayment(this.admissionId, { payment_status: this.paymentFormData.payment_status }).subscribe({
      next: () => {
        this.notify.success('Payment status updated.');
        this.showPaymentModal = false;
        this.isSavingPayment = false;
        this.reloadDetail();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update payment status.'));
        this.isSavingPayment = false;
      },
    });
  }

  // --- Approve ---
  openApproveModal(): void {
    this.showApproveModal = true;
  }

  confirmApprove(): void {
    this.isApproving = true;
    this.api.approveAdmission(this.admissionId).subscribe({
      next: () => {
        this.notify.success('Application approved successfully.');
        this.showApproveModal = false;
        this.isApproving = false;
        this.reloadDetail();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to approve application.'));
        this.isApproving = false;
      },
    });
  }

  // --- Add Document ---
  openAddDocumentModal(): void {
    this.documentFormData = { document_type: '', file_url: '', original_filename: '' };
    this.showAddDocumentModal = true;
  }

  confirmAddDocument(): void {
    if (!this.documentFormData.document_type || !this.documentFormData.file_url) {
      this.notify.warning('Please fill document type and file URL.');
      return;
    }
    this.isSavingDocument = true;
    const payload: Record<string, unknown> = {
      document_type: this.documentFormData.document_type,
      file_url: this.documentFormData.file_url,
    };
    if (this.documentFormData.original_filename) {
      payload['original_filename'] = this.documentFormData.original_filename;
    }
    this.api.createAdmissionDocument(this.admissionId, payload).subscribe({
      next: () => {
        this.notify.success('Document added successfully.');
        this.showAddDocumentModal = false;
        this.isSavingDocument = false;
        this.reloadDocuments();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to add document.'));
        this.isSavingDocument = false;
      },
    });
  }

  // --- Delete Document ---
  openDeleteDocumentModal(doc: unknown): void {
    this.deletingDocument = doc;
    this.showDeleteDocumentModal = true;
  }

  confirmDeleteDocument(): void {
    const docId = readString(this.deletingDocument, 'id');
    if (!docId) return;
    this.isDeletingDocument = true;
    this.api.deleteAdmissionDocument(this.admissionId, docId).subscribe({
      next: () => {
        this.notify.success('Document deleted.');
        this.showDeleteDocumentModal = false;
        this.isDeletingDocument = false;
        this.deletingDocument = null;
        this.reloadDocuments();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete document.'));
        this.isDeletingDocument = false;
      },
    });
  }

  // --- Add Fee ---
  openAddFeeModal(): void {
    this.feeFormData = { fee_type: '', amount: 0, payment_method: '' };
    this.showAddFeeModal = true;
  }

  confirmAddFee(): void {
    if (!this.feeFormData.fee_type || !this.feeFormData.amount) {
      this.notify.warning('Please fill fee type and amount.');
      return;
    }
    this.isSavingFee = true;
    const payload: Record<string, unknown> = {
      fee_type: this.feeFormData.fee_type,
      amount: this.feeFormData.amount,
    };
    if (this.feeFormData.payment_method) {
      payload['payment_method'] = this.feeFormData.payment_method;
    }
    this.api.createAdmissionFee(this.admissionId, payload).subscribe({
      next: () => {
        this.notify.success('Fee added successfully.');
        this.showAddFeeModal = false;
        this.isSavingFee = false;
        this.reloadFees();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to add fee.'));
        this.isSavingFee = false;
      },
    });
  }

  // --- Add Previous Academic ---
  openAddAcademicModal(): void {
    this.academicFormData = { institute_name: '', board: '', exam_name: '', passing_year: 0, result: '', remarks: '' };
    this.showAddAcademicModal = true;
  }

  confirmAddAcademic(): void {
    if (!this.academicFormData.institute_name) {
      this.notify.warning('Institute name is required.');
      return;
    }
    this.isSavingAcademic = true;
    const payload: Record<string, unknown> = {
      institute_name: this.academicFormData.institute_name,
    };
    if (this.academicFormData.board) payload['board'] = this.academicFormData.board;
    if (this.academicFormData.exam_name) payload['exam_name'] = this.academicFormData.exam_name;
    if (this.academicFormData.passing_year) payload['passing_year'] = this.academicFormData.passing_year;
    if (this.academicFormData.result) payload['result'] = this.academicFormData.result;
    if (this.academicFormData.remarks) payload['remarks'] = this.academicFormData.remarks;

    this.api.createPreviousAcademic(this.admissionId, payload).subscribe({
      next: () => {
        this.notify.success('Previous academic record added.');
        this.showAddAcademicModal = false;
        this.isSavingAcademic = false;
        this.reloadAcademics();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to add academic record.'));
        this.isSavingAcademic = false;
      },
    });
  }

  // --- Delete Previous Academic ---
  openDeleteAcademicModal(prev: unknown): void {
    this.deletingAcademic = prev;
    this.showDeleteAcademicModal = true;
  }

  confirmDeleteAcademic(): void {
    const prevId = readString(this.deletingAcademic, 'id');
    if (!prevId) return;
    this.isDeletingAcademic = true;
    this.api.deletePreviousAcademic(this.admissionId, prevId).subscribe({
      next: () => {
        this.notify.success('Academic record deleted.');
        this.showDeleteAcademicModal = false;
        this.isDeletingAcademic = false;
        this.deletingAcademic = null;
        this.reloadAcademics();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete academic record.'));
        this.isDeletingAcademic = false;
      },
    });
  }

  get stats(): Array<{ label: string; value: string; detail: string }> {
    if (!this.detail) {
      return [];
    }
    return [
      { label: 'Application', value: readString(this.detail, 'applicationNumber') || 'N/A', detail: 'Unique application reference.' },
      { label: 'Academic Year', value: this.academicYearMap.get(readString(this.detail, 'academicYearId')) || 'N/A', detail: 'Target academic session.' },
      { label: 'Applied Class', value: this.classMap.get(readString(this.detail, 'appliedClassId')) || 'N/A', detail: 'Requested class placement.' },
      { label: 'Exam Status', value: this.formatLabel(readString(this.detail, 'examStatus')), detail: 'Exam workflow state returned by backend.' },
    ];
  }

  get fieldGroups(): FieldGroup[] {
    if (!this.detail) {
      return [];
    }
    return [
      {
        title: 'Student Profile',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Date of Birth', value: this.formatDateValue(readString(this.detail, 'dateOfBirth')) },
          { label: 'Gender', value: this.formatLabel(readString(this.detail, 'gender')) },
          { label: 'Email', value: this.value('email') },
          { label: 'Phone Primary', value: this.value('phonePrimary') },
          { label: 'Blood Type', value: this.value('bloodType') },
          { label: 'Nationality', value: this.value('nationality') },
          { label: 'Religion', value: this.value('religion') },
        ],
      },
      {
        title: 'Addresses & IDs',
        items: [
          { label: 'Present Address', value: this.value('presentAddress') },
          { label: 'Permanent Address', value: this.value('permanentAddress') },
          { label: 'National ID', value: this.value('nationalId') },
          { label: 'Birth Certificate', value: this.value('birthCertificateId') },
          { label: 'Passport Number', value: this.value('passportNumber') },
          { label: 'Transfer Certificate', value: this.value('lastTransferCertificateNumber') },
        ],
      },
      {
        title: 'Father & Mother',
        items: [
          { label: 'Father Name', value: this.joinFields(['fatherFirstName', 'fatherMiddleName', 'fatherLastName']) },
          { label: 'Father Phone', value: this.value('fatherPhonePrimary') },
          { label: 'Father Email', value: this.value('fatherEmail') },
          { label: 'Mother Name', value: this.joinFields(['motherFirstName', 'motherMiddleName', 'motherLastName']) },
          { label: 'Mother Phone', value: this.value('motherPhonePrimary') },
          { label: 'Mother Email', value: this.value('motherEmail') },
        ],
      },
      {
        title: 'Guardian & Workflow',
        items: [
          { label: 'Separate Guardian', value: readBoolean(this.detail, 'hasSeparateGuardian') ? 'Yes' : 'No' },
          { label: 'Guardian Name', value: this.joinFields(['guardianFirstName', 'guardianLastName']) },
          { label: 'Guardian Relation', value: this.value('guardianRelation') },
          { label: 'Guardian Phone', value: this.value('guardianPhonePrimary') },
          { label: 'Emergency Contact', value: this.value('emergencyContactName') },
          { label: 'Emergency Phone', value: this.value('emergencyContactPhone') },
          { label: 'Created', value: this.formatDateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.formatDateTime(readString(this.detail, 'updatedAt')) },
        ],
      },
    ];
  }

  statusClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'pending' || normalized === 'under_review') return 'bg-amber-100 text-amber-700';
    if (normalized === 'rejected') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  paymentClass(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === 'paid') return 'bg-emerald-100 text-emerald-700';
    if (normalized === 'partial') return 'bg-amber-100 text-amber-700';
    if (normalized === 'unpaid') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  formatLabel(value: string): string {
    if (!value) return 'Not provided';
    return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Unnamed applicant';
  }

  private value(key: string): string {
    return readString(this.detail, key) || 'Not provided';
  }

  private joinFields(keys: string[]): string {
    return keys.map((key) => readString(this.detail, key)).filter(Boolean).join(' ') || 'Not provided';
  }

  private formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Not provided';
  }

  private formatDateTime(value: string): string {
    return value ? formatDate(value, 'MMM d, y, h:mm a', 'en-US') : 'Not provided';
  }
}
