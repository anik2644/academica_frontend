import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  extractItem,
  extractList,
  getErrorMessage,
  readBoolean,
  readString,
} from '../../../core/utils/api-response.utils';
import { PageLoaderComponent } from '../../../shared/components/page-loader/page-loader.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

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
  imports: [CommonModule, FormsModule, PageLoaderComponent, FormModalComponent, RouterModule],
  templateUrl: './admissions-list.component.html',
  styleUrl: './admissions-list.component.css',
})
export class AdmissionsListComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

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

  showDeleteModal = false;
  isDeleting = false;
  deletingAdmission: AdmissionListRow | null = null;

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

  openDeleteModal(admission: AdmissionListRow): void {
    this.deletingAdmission = admission;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deletingAdmission) return;
    this.isDeleting = true;
    this.api.deleteAdmission(this.deletingAdmission.id).subscribe({
      next: () => {
        this.notify.success('Application deleted successfully.');
        this.showDeleteModal = false;
        this.isDeleting = false;
        if (this.selectedAdmissionId === this.deletingAdmission?.id) {
          this.selectedAdmissionId = '';
          this.selectedDetail = null;
        }
        this.deletingAdmission = null;
        this.loadData();
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to delete application.'));
        this.isDeleting = false;
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
