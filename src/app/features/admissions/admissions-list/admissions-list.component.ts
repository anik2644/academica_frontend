import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import {
  extractItem,
  extractList,
  getErrorMessage,
  readBoolean,
  readString,
} from '../../../core/utils/api-response.utils';

interface AdmissionListRow {
  id: string;
  applicationNumber: string;
  applicationDate: string;
  academicYearId: string;
  appliedClassId: string;
  studentName: string;
  email: string;
  phonePrimary: string;
  applicationStatus: string;
  paymentStatus: string;
  createdAt: string;
}

interface AdmissionDetailRecord {
  [key: string]: unknown;
}

interface FieldGroup {
  title: string;
  description: string;
  items: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-admissions-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
      <div class="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(21,101,192,0.22),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(0,137,123,0.18),_transparent_34%),linear-gradient(120deg,_#0f172a,_#1e3a8a_55%,_#0f766e)]"></div>
      <div class="relative p-6 sm:p-8">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <span class="h-2 w-2 rounded-full bg-emerald-300"></span>
              Live Admissions Workspace
            </div>
            <h1 class="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Applications
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              A full admissions operations surface with live application data, instant filtering, and grouped field visibility for student, guardian, status, and payment information.
            </p>
          </div>

          <div class="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-100 backdrop-blur">
            <div class="text-xs uppercase tracking-[0.2em] text-white/60">Data Source</div>
            <div class="mt-1 font-medium">GET /api/v1/admissions</div>
          </div>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div *ngFor="let stat of stats" class="rounded-2xl border border-slate-200/70 bg-white/95 p-4 backdrop-blur">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {{ stat.label }}
                </div>
                <div class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {{ stat.value }}
                </div>
              </div>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl" [ngClass]="stat.tone">
                <span class="h-2.5 w-2.5 rounded-full bg-current"></span>
              </span>
            </div>
            <p class="mt-3 text-sm text-slate-600">{{ stat.detail }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside class="rounded-[26px] border border-slate-200 bg-slate-50/80 p-3 shadow-inner shadow-white">
            <div class="rounded-[22px] border border-slate-200 bg-white p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-sm font-semibold text-slate-900">Application Queue</div>
                  <div class="mt-1 text-sm text-slate-600">
                    {{ filteredAdmissions.length }} visible application{{ filteredAdmissions.length === 1 ? '' : 's' }}
                  </div>
                </div>
                <button
                  type="button"
                  (click)="loadData()"
                  class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-700"
                >
                  Refresh
                </button>
              </div>

              <label class="relative mt-4 block">
                <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  [(ngModel)]="searchQuery"
                  type="text"
                  placeholder="Search by application, student, email, or status"
                  class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                />
              </label>

              <div *ngIf="listErrorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {{ listErrorMessage }}
              </div>

              <div *ngIf="isListLoading" class="mt-4 space-y-3">
                <div *ngFor="let item of [1,2,3,4]" class="h-28 animate-pulse rounded-2xl bg-slate-100"></div>
              </div>

              <div *ngIf="!isListLoading" class="mt-4 space-y-3">
                <button
                  *ngFor="let admission of filteredAdmissions"
                  type="button"
                  (click)="selectAdmission(admission.id)"
                  class="w-full rounded-2xl border px-4 py-4 text-left transition"
                  [ngClass]="selectedAdmissionId === admission.id
                    ? 'border-primary-300 bg-primary-50 shadow-[0_18px_40px_-28px_rgba(21,101,192,0.55)]'
                    : 'border-slate-200 bg-white hover:border-primary-200 hover:bg-slate-50'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold text-slate-900">
                        {{ admission.studentName }}
                      </div>
                      <div class="mt-1 truncate text-xs uppercase tracking-[0.18em] text-slate-500">
                        {{ admission.applicationNumber }}
                      </div>
                    </div>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="statusClass(admission.applicationStatus)">
                      {{ admission.applicationStatus || 'unknown' }}
                    </span>
                  </div>

                  <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Applied On</div>
                      <div class="mt-1 text-slate-800">{{ formatDateValue(admission.applicationDate) }}</div>
                    </div>
                    <div>
                      <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Payment</div>
                      <div class="mt-1 text-slate-800">{{ formatLabel(admission.paymentStatus) }}</div>
                    </div>
                  </div>

                  <div class="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    {{ admission.email || 'Email unavailable' }}
                  </div>
                </button>

                <div
                  *ngIf="!filteredAdmissions.length"
                  class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600"
                >
                  No applications matched the current search.
                </div>
              </div>
            </div>
          </aside>

          <section class="rounded-[26px] border border-slate-200 bg-slate-50/80 p-3 shadow-inner shadow-white">
            <div class="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
              <div class="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Application Dossier
                  </div>
                  <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {{ selectedAdmission?.studentName || 'Select an application' }}
                  </h2>
                  <p class="mt-2 text-sm text-slate-600">
                    Review the full admission record grouped by student identity, family data, payment, exam, and processing metadata.
                  </p>
                </div>

                <div *ngIf="selectedAdmission" class="grid gap-2 sm:grid-cols-2">
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Application</div>
                    <div class="mt-1 text-sm font-semibold text-slate-900">
                      {{ selectedAdmission.applicationNumber }}
                    </div>
                  </div>
                  <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Status</div>
                    <div class="mt-1 flex items-center gap-2">
                      <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="statusClass(selectedAdmission.applicationStatus)">
                        {{ selectedAdmission.applicationStatus }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]" [ngClass]="paymentClass(selectedAdmission.paymentStatus)">
                        {{ selectedAdmission.paymentStatus }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="detailErrorMessage" class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {{ detailErrorMessage }}
              </div>

              <div *ngIf="isDetailLoading" class="mt-5 space-y-4">
                <div *ngFor="let block of [1,2,3]" class="h-44 animate-pulse rounded-2xl bg-slate-100"></div>
              </div>

              <div *ngIf="!isDetailLoading && selectedDetail" class="mt-5 grid gap-4 lg:grid-cols-2">
                <article *ngFor="let group of detailGroups" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="border-b border-slate-100 pb-3">
                    <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                      {{ group.title }}
                    </h3>
                    <p class="mt-1 text-sm text-slate-500">{{ group.description }}</p>
                  </div>
                  <div class="mt-4 grid gap-3">
                    <div *ngFor="let item of group.items" class="rounded-xl bg-slate-50 px-3 py-3">
                      <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {{ item.label }}
                      </div>
                      <div class="mt-1 text-sm text-slate-900">
                        {{ item.value }}
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <div
                *ngIf="!isDetailLoading && !selectedDetail"
                class="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-16 text-center text-sm text-slate-600"
              >
                Select an application from the left to inspect the full admission record.
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
})
export class AdmissionsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isListLoading = true;
  isDetailLoading = false;
  listErrorMessage = '';
  detailErrorMessage = '';
  searchQuery = '';

  admissions: AdmissionListRow[] = [];
  selectedAdmissionId = '';
  selectedDetail: AdmissionDetailRecord | null = null;
  academicYearMap = new Map<string, string>();
  classMap = new Map<string, string>();

  ngOnInit(): void {
    this.loadData();
  }

  get filteredAdmissions(): AdmissionListRow[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.admissions;
    }

    return this.admissions.filter((admission) =>
      [
        admission.applicationNumber,
        admission.studentName,
        admission.email,
        admission.applicationStatus,
        admission.paymentStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }

  get selectedAdmission(): AdmissionListRow | undefined {
    return this.admissions.find((item) => item.id === this.selectedAdmissionId);
  }

  get stats(): Array<{ label: string; value: string | number; detail: string; tone: string }> {
    const approvedCount = this.admissions.filter(
      (item) => item.applicationStatus.toLowerCase() === 'approved'
    ).length;
    const paidCount = this.admissions.filter(
      (item) => item.paymentStatus.toLowerCase() === 'paid'
    ).length;
    const pendingCount = this.admissions.filter(
      (item) => item.applicationStatus.toLowerCase() === 'pending'
    ).length;
    const latestDate = this.admissions[0]?.applicationDate;

    return [
      {
        label: 'Applications',
        value: this.admissions.length,
        detail: 'Total application records returned by the live API.',
        tone: 'bg-primary-100 text-primary-700',
      },
      {
        label: 'Approved',
        value: approvedCount,
        detail: 'Applications already approved for the current intake.',
        tone: 'bg-emerald-100 text-emerald-700',
      },
      {
        label: 'Paid',
        value: paidCount,
        detail: 'Applications with payment status marked paid.',
        tone: 'bg-amber-100 text-amber-700',
      },
      {
        label: 'Latest Intake Date',
        value: latestDate ? formatDate(latestDate, 'MMM d', 'en-US') : 'N/A',
        detail: 'Most recent application date visible in the dataset.',
        tone: 'bg-rose-100 text-rose-700',
      },
    ];
  }

  get detailGroups(): FieldGroup[] {
    if (!this.selectedDetail) {
      return [];
    }

    return [
      {
        title: 'Application Summary',
        description: 'Core intake, routing, and approval state.',
        items: [
          this.field('Application Number', 'applicationNumber'),
          this.dateField('Application Date', 'applicationDate'),
          {
            label: 'Academic Year',
            value:
              this.resolveAcademicYear(readString(this.selectedDetail, 'academicYearId')) ||
              readString(this.selectedDetail, 'academicYearId'),
          },
          {
            label: 'Applied Class',
            value:
              this.resolveClass(readString(this.selectedDetail, 'appliedClassId')) ||
              readString(this.selectedDetail, 'appliedClassId'),
          },
          this.field('Application Status', 'applicationStatus', this.formatLabel),
          this.field('Confirmation Status', 'confirmationStatus', this.formatLabel),
        ],
      },
      {
        title: 'Student Profile',
        description: 'Identity, contact, and student-specific information.',
        items: [
          { label: 'Full Name', value: this.fullName(this.selectedDetail) },
          this.dateField('Date of Birth', 'dateOfBirth'),
          this.field('Gender', 'gender', this.formatLabel),
          this.field('Blood Type', 'bloodType'),
          this.field('Email', 'email'),
          this.field('Phone Primary', 'phonePrimary'),
          this.field('Phone Secondary', 'phoneSecondary'),
          this.field('Nationality', 'nationality'),
          this.field('Religion', 'religion'),
          this.field('Birth Certificate ID', 'birthCertificateId'),
          this.field('National ID', 'nationalId'),
          this.field('Passport Number', 'passportNumber'),
          this.field('Nick Name', 'nickName'),
        ],
      },
      {
        title: 'Family & Guardian',
        description: 'Father, mother, guardian, and emergency contact details.',
        items: [
          { label: 'Father', value: this.joinNameFields('fatherFirstName', 'fatherMiddleName', 'fatherLastName') },
          this.field('Father Phone', 'fatherPhonePrimary'),
          this.field('Father Email', 'fatherEmail'),
          this.field('Father Profession', 'fatherProfession'),
          { label: 'Mother', value: this.joinNameFields('motherFirstName', 'motherMiddleName', 'motherLastName') },
          this.field('Mother Phone', 'motherPhonePrimary'),
          this.field('Mother Email', 'motherEmail'),
          this.field('Has Separate Guardian', 'hasSeparateGuardian', (value) => (value === 'true' ? 'Yes' : 'No')),
          {
            label: 'Guardian',
            value: this.joinNameFields('guardianFirstName', '', 'guardianLastName'),
          },
          this.field('Guardian Relation', 'guardianRelation'),
          this.field('Guardian Phone', 'guardianPhonePrimary'),
          this.field('Emergency Contact', 'emergencyContactName'),
          this.field('Emergency Relation', 'emergencyContactRelation'),
          this.field('Emergency Phone', 'emergencyContactPhone'),
        ],
      },
      {
        title: 'Addresses & Processing',
        description: 'Address records, exam/payment workflow, and audit metadata.',
        items: [
          this.field('Present Address', 'presentAddress'),
          this.field('Permanent Address', 'permanentAddress'),
          this.field('Last Transfer Certificate', 'lastTransferCertificateNumber'),
          this.field('Payment Status', 'paymentStatus', this.formatLabel),
          this.dateField('Paid Date', 'paidDate'),
          this.field('Exam Status', 'examStatus', this.formatLabel),
          this.dateField('Exam Date', 'examDate'),
          this.dateField('Approval Date', 'applicationApprovalDate'),
          this.field('Is Active', 'isActive', (value) => (value === 'true' ? 'Active' : 'Inactive')),
          this.field('Notes', 'notes'),
          this.dateField('Created At', 'createdAt'),
          this.dateField('Updated At', 'updatedAt'),
        ],
      },
    ];
  }

  loadData(): void {
    this.isListLoading = true;
    this.listErrorMessage = '';

    forkJoin({
      admissions: this.api.listAdmissions(),
      years: this.api.listAcademicYears(),
      classes: this.api.listClasses(),
    }).subscribe({
      next: ({ admissions, years, classes }) => {
        this.academicYearMap = new Map(
          extractList<unknown>(years).map((item) => [
            readString(item, 'id'),
            readString(item, 'label'),
          ])
        );

        this.classMap = new Map(
          extractList<unknown>(classes).map((item) => [
            readString(item, 'id'),
            readString(item, 'name'),
          ])
        );

        this.admissions = extractList<unknown>(admissions).map((item) =>
          this.mapAdmissionListRow(item)
        );

        this.isListLoading = false;

        const nextId =
          this.selectedAdmissionId && this.admissions.some((item) => item.id === this.selectedAdmissionId)
            ? this.selectedAdmissionId
            : this.admissions[0]?.id;

        if (nextId) {
          this.selectAdmission(nextId);
        } else {
          this.selectedAdmissionId = '';
          this.selectedDetail = null;
        }
      },
      error: (error) => {
        this.admissions = [];
        this.selectedAdmissionId = '';
        this.selectedDetail = null;
        this.listErrorMessage = getErrorMessage(
          error,
          'Admissions could not be loaded from the API.'
        );
        this.isListLoading = false;
      },
    });
  }

  selectAdmission(id: string): void {
    this.selectedAdmissionId = id;
    this.isDetailLoading = true;
    this.detailErrorMessage = '';

    this.api.getAdmission(id).subscribe({
      next: (response) => {
        this.selectedDetail = extractItem<AdmissionDetailRecord>(response);
        this.isDetailLoading = false;
      },
      error: (error) => {
        this.selectedDetail = null;
        this.detailErrorMessage = getErrorMessage(
          error,
          'Admission details could not be loaded from the API.'
        );
        this.isDetailLoading = false;
      },
    });
  }

  statusClass(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'approved') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (normalized === 'pending' || normalized === 'under_review') {
      return 'bg-amber-100 text-amber-700';
    }
    if (normalized === 'rejected') {
      return 'bg-rose-100 text-rose-700';
    }

    return 'bg-slate-100 text-slate-700';
  }

  paymentClass(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'paid') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (normalized === 'partial') {
      return 'bg-amber-100 text-amber-700';
    }
    if (normalized === 'unpaid') {
      return 'bg-rose-100 text-rose-700';
    }

    return 'bg-slate-100 text-slate-700';
  }

  formatDateValue(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Not available';
  }

  formatLabel(value: string): string {
    if (!value) {
      return 'Not available';
    }

    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private mapAdmissionListRow(item: unknown): AdmissionListRow {
    return {
      id: readString(item, 'id'),
      applicationNumber: readString(item, 'applicationNumber'),
      applicationDate: readString(item, 'applicationDate'),
      academicYearId: readString(item, 'academicYearId'),
      appliedClassId: readString(item, 'appliedClassId'),
      studentName: this.fullName(item),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary'),
      applicationStatus: readString(item, 'applicationStatus'),
      paymentStatus: readString(item, 'paymentStatus'),
      createdAt: readString(item, 'createdAt'),
    };
  }

  private field(
    label: string,
    key: string,
    formatter?: (value: string) => string
  ): { label: string; value: string } {
    const rawValue =
      this.selectedDetail && key in this.selectedDetail
        ? this.selectedDetail[key]
        : undefined;

    if (typeof rawValue === 'boolean') {
      return { label, value: rawValue ? 'True' : 'False' };
    }

    const value = typeof rawValue === 'string' ? rawValue : '';
    return {
      label,
      value: value ? (formatter ? formatter.call(this, value) : value) : 'Not provided',
    };
  }

  private dateField(label: string, key: string): { label: string; value: string } {
    const value = readString(this.selectedDetail, key);
    return {
      label,
      value: value ? this.formatDateValue(value) : 'Not provided',
    };
  }

  private fullName(source: unknown): string {
    const parts = [
      readString(source, 'firstName'),
      readString(source, 'middleName'),
      readString(source, 'lastName'),
    ].filter(Boolean);

    return parts.join(' ') || 'Unnamed applicant';
  }

  private joinNameFields(firstKey: string, middleKey: string, lastKey: string): string {
    const parts = [
      firstKey ? readString(this.selectedDetail, firstKey) : '',
      middleKey ? readString(this.selectedDetail, middleKey) : '',
      lastKey ? readString(this.selectedDetail, lastKey) : '',
    ].filter(Boolean);

    return parts.join(' ') || 'Not provided';
  }

  private resolveAcademicYear(id: string): string {
    return this.academicYearMap.get(id) ?? '';
  }

  private resolveClass(id: string): string {
    return this.classMap.get(id) ?? '';
  }
}
