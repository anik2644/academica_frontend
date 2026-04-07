import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readNumber, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';

interface FieldGroup {
  title: string;
  items: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-admission-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ShimmerBlockComponent],
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
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Documents</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let doc of documents" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ formatLabel(readString(doc, 'documentType')) }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ readString(doc, 'originalFilename') || readString(doc, 'fileUrl') }}</div>
                <div class="mt-2 text-xs text-slate-600">
                  {{ readBoolean(doc, 'isVerified') ? 'Verified' : 'Pending verification' }}
                </div>
              </div>
              <div *ngIf="!documents.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No documents found.</div>
            </div>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Fees</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let fee of fees" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ formatLabel(readString(fee, 'feeType')) }}</div>
                <div class="mt-1 text-xs text-slate-500">BDT {{ readNumber(fee, 'amount') ?? 0 }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ readString(fee, 'paymentMethod') || 'Payment method unavailable' }}</div>
              </div>
              <div *ngIf="!fees.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No fee records found.</div>
            </div>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Previous Academics</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let prev of previousAcademics" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ readString(prev, 'instituteName') }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ readString(prev, 'examName') || 'Academic record' }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ readString(prev, 'result') || 'Result unavailable' }}</div>
              </div>
              <div *ngIf="!previousAcademics.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No previous academic records found.</div>
            </div>
          </article>
        </div>
      </ng-container>
    </section>
  `,
})
export class AdmissionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  documents: unknown[] = [];
  fees: unknown[] = [];
  previousAcademics: unknown[] = [];
  title = 'Admission Details';
  private academicYearMap = new Map<string, string>();
  private classMap = new Map<string, string>();

  readonly readString = readString;
  readonly readBoolean = readBoolean;
  readonly readNumber = readNumber;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Admission id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getAdmission(id),
      documents: this.api.listAdmissionDocuments(id),
      fees: this.api.listAdmissionFees(id),
      previousAcademics: this.api.listPreviousAcademics(id),
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
