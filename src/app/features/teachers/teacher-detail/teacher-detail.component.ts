import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, extractList, getErrorMessage, readBoolean, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ShimmerBlockComponent],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/teachers" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to teachers</a>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{{ title }}</h1>
        </div>
        <span *ngIf="detail" class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]" [ngClass]="readBoolean(detail, 'isActive') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'">
          {{ readBoolean(detail, 'isActive') ? 'Active' : 'Inactive' }}
        </span>
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
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Academic Qualifications</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let qualification of academicQualifications" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ readString(qualification, 'examName') }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ readString(qualification, 'instituteName') }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ readString(qualification, 'result') || 'Result unavailable' }}</div>
              </div>
              <div *ngIf="!academicQualifications.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No academic qualifications found.</div>
            </div>
          </article>

          <article class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Other Qualifications</h2>
            <div class="mt-4 space-y-3">
              <div *ngFor="let qualification of otherQualifications" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-sm font-semibold text-slate-900">{{ readString(qualification, 'title') }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ readString(qualification, 'issuingOrganization') }}</div>
                <div class="mt-2 text-xs text-slate-600">{{ readString(qualification, 'scoreOrGrade') || 'No score/grade' }}</div>
              </div>
              <div *ngIf="!otherQualifications.length" class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">No other qualifications found.</div>
            </div>
          </article>
        </div>
      </ng-container>
    </section>
  `,
})
export class TeacherDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  academicQualifications: unknown[] = [];
  otherQualifications: unknown[] = [];
  title = 'Teacher Profile';

  readonly readString = readString;
  readonly readBoolean = readBoolean;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Teacher id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getTeacher(id),
      academic: this.api.listTeacherAcademicQualifications(id),
      other: this.api.listTeacherOtherQualifications(id),
    }).subscribe({
      next: ({ detail, academic, other }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.academicQualifications = extractList(academic);
        this.otherQualifications = extractList(other);
        this.title = this.fullName(this.detail);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Teacher details could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  get stats(): Array<{ label: string; value: string; detail: string }> {
    if (!this.detail) return [];
    return [
      { label: 'Teacher ID', value: readString(this.detail, 'teacherId') || 'N/A', detail: 'Unique teacher reference.' },
      { label: 'Department', value: readString(this.detail, 'department') || 'N/A', detail: 'Primary department assignment.' },
      { label: 'Designation', value: readString(this.detail, 'designation') || 'N/A', detail: 'Current role title.' },
      { label: 'Join Date', value: this.date(readString(this.detail, 'joinDate')), detail: 'Employment start date.' },
    ];
  }

  get profileSections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Personal Information',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Date of Birth', value: this.date(readString(this.detail, 'dateOfBirth')) },
          { label: 'Blood Type', value: this.value('bloodType') },
          { label: 'Religion', value: this.value('religion') },
          { label: 'Nationality', value: this.value('nationality') },
        ],
      },
      {
        title: 'Employment',
        items: [
          { label: 'Employment Type', value: this.value('employmentType') },
          { label: 'Specialization', value: this.value('specialization') },
          { label: 'Previous Experience', value: this.value('previousExperienceYears') },
          { label: 'Additional Notes', value: this.value('additionalNotes') },
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
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
          { label: 'NID Number', value: this.value('nidNumber') },
          { label: 'Passport Number', value: this.value('passportNumber') },
          { label: 'Profile Photo', value: this.value('profilePhotoUrl') },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Teacher profile';
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
