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
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/admissions" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to applications</a>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{{ title }}</h1>
        </div>
        <div *ngIf="detail" class="flex gap-2">
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" [ngClass]="statusClass(readString(detail, 'applicationStatus'))">
            {{ readString(detail, 'applicationStatus') || 'unknown' }}
          </span>
          <span class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" [ngClass]="paymentClass(readString(detail, 'paymentStatus'))">
            {{ readString(detail, 'paymentStatus') || 'unknown' }}
          </span>
        </div>
      </div>

      <!-- Action Buttons -->
      <div *ngIf="detail" class="mt-6 flex flex-wrap gap-3">
        <button type="button" (click)="openStatusModal()" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-700">
          Update Status
        </button>
        <button type="button" (click)="openPaymentModal()" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-700">
          Update Payment
        </button>
        <button type="button" (click)="openApproveModal()" class="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-lg">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Admit Student
        </button>
      </div>

      <div *ngIf="errorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ errorMessage }}</div>

      <div *ngIf="isLoading" class="mt-8 space-y-4">
        <app-shimmer-block [height]="120"></app-shimmer-block>
        <div class="grid gap-4 lg:grid-cols-2">
          <app-shimmer-block *ngFor="let block of [1,2,3,4]" [height]="220"></app-shimmer-block>
        </div>
        <div class="grid gap-4 lg:grid-cols-3">
          <app-shimmer-block *ngFor="let block of [1,2,3]" [height]="180"></app-shimmer-block>
        </div>
      </div>

      <ng-container *ngIf="!isLoading && detail">
        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div *ngFor="let stat of stats" class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{{ stat.label }}</div>
            <div class="mt-3 text-2xl font-semibold text-slate-950">{{ stat.value }}</div>
            <div class="mt-3 text-sm text-slate-600">{{ stat.detail }}</div>
          </div>
        </div>

        <div class="mt-8 grid gap-4 lg:grid-cols-2">
          <article *ngFor="let group of fieldGroups" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{{ group.title }}</h2>
            <div class="mt-4 grid gap-3">
              <div *ngFor="let item of group.items" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ item.label }}</div>
                <div class="mt-1 text-sm text-slate-900">{{ item.value }}</div>
              </div>
            </div>
          </article>
        </div>

        <div class="mt-8 grid gap-4 xl:grid-cols-3">
          <!-- Documents Section -->
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Documents</h2>
              <button type="button" (click)="openAddDocumentModal()" class="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-50">
                Add Document
              </button>
            </div>
            <div class="mt-4 space-y-3">
              <div *ngFor="let doc of documents" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-slate-900">{{ formatLabel(readString(doc, 'documentType')) }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ readString(doc, 'originalFilename') || readString(doc, 'fileUrl') }}</div>
                    <div class="mt-2 text-xs text-slate-600">
                      {{ readBoolean(doc, 'isVerified') ? 'Verified' : 'Pending verification' }}
                    </div>
                  </div>
                  <button type="button" (click)="openDeleteDocumentModal(doc)" class="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
                    Delete
                  </button>
                </div>
              </div>
              <div *ngIf="!documents.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No documents found.</div>
            </div>
          </article>

          <!-- Fees Section -->
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Fees</h2>
              <button type="button" (click)="openAddFeeModal()" class="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-50">
                Add Fee
              </button>
            </div>
            <div class="mt-4 space-y-3">
              <div *ngFor="let fee of fees" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ formatLabel(readString(fee, 'feeType')) }}</div>
                <div class="mt-1 text-xs text-slate-500">BDT {{ readNumber(fee, 'amount') ?? 0 }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ readString(fee, 'paymentMethod') || 'Payment method unavailable' }}</div>
              </div>
              <div *ngIf="!fees.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No fee records found.</div>
            </div>
          </article>

          <!-- Previous Academics Section -->
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Previous Academics</h2>
              <button type="button" (click)="openAddAcademicModal()" class="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:bg-primary-50">
                Add Record
              </button>
            </div>
            <div class="mt-4 space-y-3">
              <div *ngFor="let prev of previousAcademics" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="text-sm font-semibold text-slate-900">{{ readString(prev, 'instituteName') }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ readString(prev, 'examName') || 'Academic record' }}</div>
                    <div class="mt-2 text-xs text-slate-600">{{ readString(prev, 'result') || 'Result unavailable' }}</div>
                  </div>
                  <button type="button" (click)="openDeleteAcademicModal(prev)" class="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50">
                    Delete
                  </button>
                </div>
              </div>
              <div *ngIf="!previousAcademics.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No previous academic records found.</div>
            </div>
          </article>
        </div>
      </ng-container>
    </section>

    <!-- Update Status Modal -->
    <app-form-modal
      [open]="showStatusModal"
      title="Update Application Status"
      subtitle="Change the current workflow status of this application."
      confirmText="Update Status"
      loadingText="Updating..."
      [loading]="isSavingStatus"
      (close)="showStatusModal = false"
      (confirm)="confirmUpdateStatus()"
    >
      <label class="block">
        <span class="mb-2 block text-sm font-medium text-slate-700">Application Status *</span>
        <select [(ngModel)]="statusFormData.application_status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="">Select status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </label>
    </app-form-modal>

    <!-- Update Payment Modal -->
    <app-form-modal
      [open]="showPaymentModal"
      title="Update Payment Status"
      subtitle="Change the payment status of this application."
      confirmText="Update Payment"
      loadingText="Updating..."
      [loading]="isSavingPayment"
      (close)="showPaymentModal = false"
      (confirm)="confirmUpdatePayment()"
    >
      <label class="block">
        <span class="mb-2 block text-sm font-medium text-slate-700">Payment Status *</span>
        <select [(ngModel)]="paymentFormData.payment_status" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="">Select status</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
      </label>
    </app-form-modal>

    <!-- Approve Confirmation Modal -->
    <app-form-modal
      [open]="showApproveModal"
      title="Admit Student"
      subtitle="Are you sure you want to admit this student?"
      confirmText="Confirm Admission"
      loadingText="Approving..."
      [loading]="isApproving"
      (close)="showApproveModal = false"
      (confirm)="confirmApprove()"
    >
      <p class="text-sm text-slate-600">This will admit <strong>{{ title }}</strong> into the institution. The application will be marked as approved and the student record will be created.</p>
    </app-form-modal>

    <!-- Add Document Modal -->
    <app-form-modal
      [open]="showAddDocumentModal"
      title="Add Document"
      subtitle="Attach a new document to this application."
      confirmText="Add Document"
      loadingText="Adding..."
      [loading]="isSavingDocument"
      (close)="showAddDocumentModal = false"
      (confirm)="confirmAddDocument()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Document Type *</span>
          <input [(ngModel)]="documentFormData.document_type" type="text" placeholder="e.g. birth_certificate" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">File URL *</span>
          <input [(ngModel)]="documentFormData.file_url" type="text" placeholder="https://..." class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Original Filename</span>
          <input [(ngModel)]="documentFormData.original_filename" type="text" placeholder="document.pdf" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
      </div>
    </app-form-modal>

    <!-- Delete Document Confirmation -->
    <app-form-modal
      [open]="showDeleteDocumentModal"
      title="Delete Document"
      subtitle="Are you sure you want to delete this document?"
      confirmText="Delete"
      loadingText="Deleting..."
      [loading]="isDeletingDocument"
      [danger]="true"
      (close)="showDeleteDocumentModal = false"
      (confirm)="confirmDeleteDocument()"
    >
      <p class="text-sm text-slate-600">This action cannot be undone. The document record will be permanently removed.</p>
    </app-form-modal>

    <!-- Add Fee Modal -->
    <app-form-modal
      [open]="showAddFeeModal"
      title="Add Fee"
      subtitle="Add a new fee entry for this application."
      confirmText="Add Fee"
      loadingText="Adding..."
      [loading]="isSavingFee"
      (close)="showAddFeeModal = false"
      (confirm)="confirmAddFee()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Fee Type *</span>
          <input [(ngModel)]="feeFormData.fee_type" type="text" placeholder="e.g. admission_fee" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Amount *</span>
          <input [(ngModel)]="feeFormData.amount" type="number" placeholder="0" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Payment Method</span>
          <input [(ngModel)]="feeFormData.payment_method" type="text" placeholder="e.g. cash, bank_transfer" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
      </div>
    </app-form-modal>

    <!-- Add Previous Academic Modal -->
    <app-form-modal
      [open]="showAddAcademicModal"
      title="Add Previous Academic Record"
      subtitle="Add a previous education entry for this applicant."
      confirmText="Add Record"
      loadingText="Adding..."
      [loading]="isSavingAcademic"
      (close)="showAddAcademicModal = false"
      (confirm)="confirmAddAcademic()"
    >
      <div class="space-y-4">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Institute Name *</span>
          <input [(ngModel)]="academicFormData.institute_name" type="text" placeholder="Name of previous institution" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Board</span>
            <input [(ngModel)]="academicFormData.board" type="text" placeholder="e.g. Dhaka Board" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Exam Name</span>
            <input [(ngModel)]="academicFormData.exam_name" type="text" placeholder="e.g. SSC" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Passing Year</span>
            <input [(ngModel)]="academicFormData.passing_year" type="number" placeholder="e.g. 2024" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-slate-700">Result</span>
            <input [(ngModel)]="academicFormData.result" type="text" placeholder="e.g. A+" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </label>
        </div>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-slate-700">Remarks</span>
          <input [(ngModel)]="academicFormData.remarks" type="text" placeholder="Optional notes" class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
      </div>
    </app-form-modal>

    <!-- Delete Previous Academic Confirmation -->
    <app-form-modal
      [open]="showDeleteAcademicModal"
      title="Delete Academic Record"
      subtitle="Are you sure you want to delete this academic record?"
      confirmText="Delete"
      loadingText="Deleting..."
      [loading]="isDeletingAcademic"
      [danger]="true"
      (close)="showDeleteAcademicModal = false"
      (confirm)="confirmDeleteAcademic()"
    >
      <p class="text-sm text-slate-600">This action cannot be undone. The previous academic record will be permanently removed.</p>
    </app-form-modal>
  `,
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
