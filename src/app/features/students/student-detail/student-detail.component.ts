import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, extractList, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
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

        <!-- Profile Photo Card -->
        <div class="mt-8 rounded-[24px] border border-slate-200 bg-gradient-to-r from-primary-50/50 to-accent-50/30 p-6 shadow-sm">
          <div class="flex flex-col items-center gap-6 sm:flex-row">
            <!-- Photo -->
            <div class="relative shrink-0">
              <div class="h-28 w-28 overflow-hidden rounded-[22px] border-2 border-white shadow-lg"
                   [ngClass]="photoUrl ? '' : 'bg-gradient-to-br from-primary-500 to-primary-700'">
                <img *ngIf="photoUrl" [src]="photoUrl" alt="Student photo" class="h-full w-full object-cover" (error)="photoUrl = ''" />
                <div *ngIf="!photoUrl" class="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                  {{ initials }}
                </div>
              </div>
              <button type="button" (click)="openPhotoModal()"
                class="absolute -bottom-2 -right-2 rounded-full border-2 border-white bg-primary-600 p-2 text-white shadow-md transition hover:bg-primary-700">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <!-- Info -->
            <div class="text-center sm:text-left">
              <h2 class="text-xl font-semibold text-slate-900">{{ title }}</h2>
              <p class="mt-1 text-sm text-slate-500">Student ID: {{ readString(detail, 'studentId') || readString(detail, 'id') }}</p>
              <div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  {{ readString(detail, 'gender') || 'Gender N/A' }}
                </span>
                <span class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {{ readString(detail, 'bloodType') || 'Blood N/A' }}
                </span>
                <span class="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                  {{ readString(detail, 'status') || 'Active' }}
                </span>
              </div>
            </div>
          </div>
        </div>

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

    <!-- Photo URL Modal -->
    <app-form-modal
      [open]="showPhotoModal"
      title="Update Profile Photo"
      subtitle="Enter a photo URL or upload an image"
      [confirmText]="photoUploading ? 'Uploading...' : 'Save Photo'"
      [loading]="photoUploading"
      (close)="showPhotoModal = false"
      (confirm)="savePhoto()"
    >
      <div class="space-y-5">
        <!-- Preview -->
        <div class="flex justify-center">
          <div class="h-32 w-32 overflow-hidden rounded-[22px] border-2 border-slate-200"
               [ngClass]="photoFormUrl ? '' : 'bg-gradient-to-br from-primary-500 to-primary-700'">
            <img *ngIf="photoFormUrl" [src]="photoFormUrl" alt="Preview" class="h-full w-full object-cover" (error)="photoPreviewError = true" />
            <div *ngIf="!photoFormUrl" class="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {{ initials }}
            </div>
          </div>
        </div>

        <!-- File Upload -->
        <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-primary-300 hover:bg-primary-50/30">
          <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span class="text-sm font-medium text-slate-600">Click to upload an image</span>
          <span class="text-xs text-slate-400">JPG, PNG up to 2MB</span>
          <input type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />
        </label>

        <!-- Or URL -->
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-slate-200"></div>
          <span class="text-xs font-medium text-slate-400">OR ENTER URL</span>
          <div class="h-px flex-1 bg-slate-200"></div>
        </div>

        <label class="block">
          <input [(ngModel)]="photoFormUrl" type="url" placeholder="https://example.com/photo.jpg"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>

        <button *ngIf="photoFormUrl" type="button" (click)="photoFormUrl = ''"
          class="text-xs font-medium text-rose-600 hover:text-rose-700">Remove photo</button>
      </div>
    </app-form-modal>
  `,
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  readonly readString = readString;

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Student Profile';
  photoUrl = '';
  studentParents: Array<{ name: string; relationship: string; email: string; phone: string }> = [];
  enrollments: Array<{ academicYear: string; sectionId: string; rollNumber: string; status: string }> = [];
  private academicYearMap = new Map<string, string>();
  private studentId = '';

  showPhotoModal = false;
  photoFormUrl = '';
  photoUploading = false;
  photoPreviewError = false;
  private selectedPhotoFile: File | null = null;

  get initials(): string {
    const first = readString(this.detail, 'firstName')?.charAt(0) || '';
    const last = readString(this.detail, 'lastName')?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.studentId) {
      this.errorMessage = 'Student id is missing from the route.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      detail: this.api.getStudent(this.studentId),
      parents: this.api.listStudentParents(this.studentId),
      enrollments: this.api.listEnrollments(),
      years: this.api.listAcademicYears(),
    }).subscribe({
      next: ({ detail, parents, enrollments, years }) => {
        this.detail = extractItem<Record<string, unknown>>(detail);
        this.title = this.fullName(this.detail);
        this.photoUrl = readString(this.detail, 'profilePhotoUrl', 'profile_photo_url')
          || readString(this.detail, 'profilePhotoBase64')
          || '';
        this.studentParents = extractList<unknown>(parents).map((item) => ({
          name: [readString(item, 'parentFirstName'), readString(item, 'parentLastName')].filter(Boolean).join(' '),
          relationship: readString(item, 'relationshipToStudent'),
          email: readString(item, 'parentEmail'),
          phone: readString(item, 'parentPhonePrimary'),
        }));
        this.academicYearMap = new Map(extractList<unknown>(years).map((item) => [readString(item, 'id'), readString(item, 'label')]));
        this.enrollments = extractList<unknown>(enrollments)
          .filter((item) => readString(item, 'studentId') === this.studentId)
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

  openPhotoModal(): void {
    this.photoFormUrl = this.photoUrl;
    this.photoPreviewError = false;
    this.selectedPhotoFile = null;
    this.showPhotoModal = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.notify.warning('File size must be under 2MB.');
      return;
    }

    this.selectedPhotoFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoFormUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  savePhoto(): void {
    if (!this.selectedPhotoFile && !this.photoFormUrl) {
      this.notify.warning('Please select or upload a photo.');
      return;
    }
    this.photoUploading = true;
    this.api.updateStudent(this.studentId, {}, this.selectedPhotoFile || undefined).subscribe({
      next: (response) => {
        const updated = extractItem<Record<string, unknown>>(response);
        this.photoUrl = readString(updated, 'profilePhotoUrl') || readString(updated, 'profilePhotoBase64') || this.photoFormUrl;
        this.showPhotoModal = false;
        this.photoUploading = false;
        this.selectedPhotoFile = null;
        this.notify.success('Profile photo updated.');
      },
      error: (error) => {
        this.notify.error(getErrorMessage(error, 'Failed to update photo.'));
        this.photoUploading = false;
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
