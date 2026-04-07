import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { SchoolManagementApiService } from '../../core/services/school-management-api.service';
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

interface ParentRow {
  id: string;
  fullName: string;
  gender: string;
  email: string;
  phonePrimary: string;
  nidNumber: string;
  presentAddress: string;
  employerName: string;
  createdAt: string;
}

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [CommonModule, AcademicResourcePageComponent],
  template: `
    <app-academic-resource-page
      title="Parents"
      subtitle="A live guardian directory for contact readiness, identity coverage, and address visibility. This page reads directly from your parents API."
      dataSourceLabel="GET /api/v1/parents"
      tableTitle="Parent & Guardian Directory"
      tableSubtitle="Review parent identity, phone coverage, address footprint, and verification fields from the live backend."
      searchPlaceholder="Search by parent, phone, email, or address"
      emptyTitle="No parents found"
      emptyMessage="Parent and guardian records from the backend will appear here automatically."
      [metrics]="metrics"
      [columns]="columns"
      [rows]="rows"
      [isLoading]="isLoading"
      [errorMessage]="errorMessage"
      [searchIndex]="searchIndex"
      (refresh)="loadData()"
    ></app-academic-resource-page>
  `,
})
export class ParentsComponent implements OnInit {
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  rows: ParentRow[] = [];

  readonly columns: AcademicResourceColumn<ParentRow>[] = [
    {
      label: 'Parent',
      value: (row) => row.fullName,
      secondary: (row) => row.gender ? this.formatGender(row.gender) : row.id,
      badge: (row) => (row.nidNumber ? 'Verified ID' : ''),
    },
    {
      label: 'Contact',
      value: (row) => row.phonePrimary || 'Phone unavailable',
      secondary: (row) => row.email || 'Email unavailable',
    },
    {
      label: 'Address',
      value: (row) => row.presentAddress || 'Address unavailable',
      secondary: (row) => row.employerName || 'Employer not listed',
    },
    {
      label: 'Created',
      value: (row) => this.formatDate(row.createdAt),
      secondary: () => 'Live backend timestamp',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  get metrics(): AcademicResourceMetric[] {
    const withEmail = this.rows.filter((row) => !!row.email).length;
    const withNid = this.rows.filter((row) => !!row.nidNumber).length;
    const femaleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'female').length;
    const maleCount = this.rows.filter((row) => row.gender.toLowerCase() === 'male').length;

    return [
      {
        label: 'Total Guardians',
        value: this.rows.length,
        detail: 'All parent records returned by the live API.',
        tone: 'primary',
      },
      {
        label: 'Email Coverage',
        value: withEmail,
        detail: 'Parents with email addresses available for communication.',
        tone: 'accent',
      },
      {
        label: 'ID Coverage',
        value: withNid,
        detail: 'Parents with a visible NID number in the current dataset.',
        tone: 'amber',
      },
      {
        label: 'Gender Split',
        value: `${maleCount}M / ${femaleCount}F`,
        detail: 'Visible parent gender distribution in the current dataset.',
        tone: 'rose',
      },
    ];
  }

  readonly searchIndex = (row: ParentRow): string =>
    [
      row.fullName,
      row.phonePrimary,
      row.email,
      row.presentAddress,
      row.nidNumber,
      row.employerName,
    ].join(' ');

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.listParents().subscribe({
      next: (response) => {
        this.rows = extractList<unknown>(response).map((item) => this.mapParent(item));
        this.isLoading = false;
      },
      error: (error) => {
        this.rows = [];
        this.errorMessage = getErrorMessage(error, 'Parents could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  private mapParent(item: unknown): ParentRow {
    const fullName = [
      readString(item, 'firstName', 'first_name'),
      readString(item, 'middleName', 'middle_name'),
      readString(item, 'lastName', 'last_name'),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: readString(item, 'id'),
      fullName,
      gender: readString(item, 'gender'),
      email: readString(item, 'email'),
      phonePrimary: readString(item, 'phonePrimary', 'phone_primary'),
      nidNumber: readString(item, 'nidNumber', 'nid_number'),
      presentAddress: readString(item, 'presentAddress', 'present_address'),
      employerName: readString(item, 'employerName', 'employer_name'),
      createdAt: readString(item, 'createdAt', 'created_at'),
    };
  }

  private formatGender(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Gender unavailable';
  }

  private formatDate(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Created date unavailable';
  }
}
