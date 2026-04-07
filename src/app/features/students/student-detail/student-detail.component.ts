import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, extractList, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ShimmerBlockComponent],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/students" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to students</a>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{{ title }}</h1>
        </div>
      </div>

      <div *ngIf="errorMessage" class="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{{ errorMessage }}</div>

      <div *ngIf="isLoading" class="mt-8 space-y-4">
        <app-shimmer-block [height]="120"></app-shimmer-block>
        <div class="grid gap-4 lg:grid-cols-2">
          <app-shimmer-block *ngFor="let block of [1,2,3,4]" [height]="180"></app-shimmer-block>
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
          <article *ngFor="let section of profileSections" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{{ section.title }}</h2>
            <div class="mt-4 grid gap-3">
              <div *ngFor="let item of section.items" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ item.label }}</div>
                <div class="mt-1 text-sm text-slate-900">{{ item.value }}</div>
              </div>
            </div>
          </article>
        </div>

        <div class="mt-8 grid gap-4 lg:grid-cols-2">
          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Parents & Guardians</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let parent of studentParents" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ parent.name }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ parent.relationship }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ parent.email || parent.phone || 'No contact info' }}</div>
              </div>
              <div *ngIf="!studentParents.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No linked parents found.</div>
            </div>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Enrollment History</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let row of enrollments" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ row.academicYear }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ row.sectionId }} • Roll {{ row.rollNumber }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ row.status }}</div>
              </div>
              <div *ngIf="!enrollments.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No enrollments found for this student.</div>
            </div>
          </article>
        </div>
      </ng-container>
    </section>
  `,
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Student Profile';
  studentParents: Array<{ name: string; relationship: string; email: string; phone: string }> = [];
  enrollments: Array<{ academicYear: string; sectionId: string; rollNumber: string; status: string }> = [];
  private academicYearMap = new Map<string, string>();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Student id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getStudent(id),
      parents: this.api.listStudentParents(id),
      enrollments: this.api.listEnrollments(),
      years: this.api.listAcademicYears(),
    }).subscribe({
      next: ({ detail, parents, enrollments, years }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.title = this.fullName(this.detail);
        this.studentParents = extractList<unknown>(parents).map((item) => ({
          name: [readString(item, 'parentFirstName'), readString(item, 'parentLastName')].filter(Boolean).join(' '),
          relationship: readString(item, 'relationshipToStudent'),
          email: readString(item, 'parentEmail'),
          phone: readString(item, 'parentPhonePrimary'),
        }));
        this.academicYearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        this.enrollments = extractList<unknown>(enrollments)
          .filter((item) => readString(item, 'studentId') === id)
          .map((item) => ({
            academicYear: this.academicYearMap.get(readString(item, 'academicYearId')) || readString(item, 'academicYearId'),
            sectionId: readString(item, 'sectionId'),
            rollNumber: readString(item, 'rollNumber'),
            status: readString(item, 'status'),
          }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Student details could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  get stats(): Array<{ label: string; value: string; detail: string }> {
    if (!this.detail) return [];
    return [
      { label: 'Student ID', value: readString(this.detail, 'studentId') || 'N/A', detail: 'Primary student identifier.' },
      { label: 'Birth Date', value: this.date(readString(this.detail, 'dateOfBirth')), detail: 'Student birth date.' },
      { label: 'Blood Type', value: readString(this.detail, 'bloodType') || 'N/A', detail: 'Medical reference field.' },
      { label: 'Guardians', value: String(this.studentParents.length), detail: 'Linked parent or guardian records.' },
    ];
  }

  get profileSections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Identity',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Nick Name', value: this.value('nickName') },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Nationality', value: this.value('nationality') },
          { label: 'Religion', value: this.value('religion') },
        ],
      },
      {
        title: 'Contact',
        items: [
          { label: 'Email', value: this.value('email') },
          { label: 'Phone Primary', value: this.value('phonePrimary') },
          { label: 'Phone Secondary', value: this.value('phoneSecondary') },
          { label: 'Present Address', value: this.value('presentAddress') },
          { label: 'Permanent Address', value: this.value('permanentAddress') },
        ],
      },
      {
        title: 'Verification',
        items: [
          { label: 'National ID', value: this.value('nationalId') },
          { label: 'Birth Certificate ID', value: this.value('birthCertificateId') },
          { label: 'Passport Number', value: this.value('passportNumber') },
          { label: 'Admission Status', value: this.value('admissionStatus') },
        ],
      },
      {
        title: 'Timeline',
        items: [
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
          { label: 'Additional Notes', value: this.value('additionalNotes') },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Student profile';
  }

  private value(key: string): string {
    return readString(this.detail, key) || 'Not provided';
  }

  private date(value: string): string {
    return value ? formatDate(value, 'MMM d, y', 'en-US') : 'Not provided';
  }

  private dateTime(value: string): string {
    return value ? formatDate(value, 'MMM d, y, h:mm a', 'en-US') : 'Not provided';
  }
}
