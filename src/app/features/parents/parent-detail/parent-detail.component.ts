import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { extractItem, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';
import { FormModalComponent } from '../../../shared/components/form-modal/form-modal.component';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerBlockComponent, FormModalComponent],
  template: `
    <section class="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)] sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/parents" class="text-sm font-medium text-primary-700 hover:text-primary-800">Back to parents</a>
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
            <div class="relative shrink-0">
              <div class="h-28 w-28 overflow-hidden rounded-[22px] border-2 border-white shadow-lg"
                   [ngClass]="photoUrl ? '' : 'bg-gradient-to-br from-primary-400 to-accent-600'">
                <img *ngIf="photoUrl" [src]="photoUrl" alt="Parent photo" class="h-full w-full object-cover" (error)="photoUrl = ''" />
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
            <div class="text-center sm:text-left">
              <h2 class="text-xl font-semibold text-slate-900">{{ title }}</h2>
              <p class="mt-1 text-sm text-slate-500">Parent / Guardian</p>
              <div class="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  {{ readString(detail, 'gender') || 'Gender N/A' }}
                </span>
                <span *ngIf="readString(detail, 'maritalStatus')" class="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                  {{ readString(detail, 'maritalStatus') }}
                </span>
                <span *ngIf="readString(detail, 'nationality')" class="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {{ readString(detail, 'nationality') }}
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
          <article *ngFor="let section of sections" class="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{{ section.title }}</h2>
            <div class="mt-4 grid gap-3">
              <div *ngFor="let item of section.items" class="rounded-xl bg-slate-50 px-4 py-3">
                <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{{ item.label }}</div>
                <div class="mt-1 text-sm text-slate-900">{{ item.value }}</div>
              </div>
            </div>
          </article>
        </div>
      </ng-container>
    </section>

    <!-- Photo Upload Modal -->
    <app-form-modal
      [open]="showPhotoModal"
      title="Update Profile Photo"
      subtitle="Upload a photo for this parent"
      [confirmText]="photoUploading ? 'Uploading...' : 'Save Photo'"
      [loading]="photoUploading"
      (close)="showPhotoModal = false"
      (confirm)="savePhoto()"
    >
      <div class="space-y-5">
        <div class="flex justify-center">
          <div class="h-32 w-32 overflow-hidden rounded-[22px] border-2 border-slate-200"
               [ngClass]="photoFormUrl ? '' : 'bg-gradient-to-br from-primary-400 to-accent-600'">
            <img *ngIf="photoFormUrl" [src]="photoFormUrl" alt="Preview" class="h-full w-full object-cover" />
            <div *ngIf="!photoFormUrl" class="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
              {{ initials }}
            </div>
          </div>
        </div>

        <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:border-primary-300 hover:bg-primary-50/30">
          <svg class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span class="text-sm font-medium text-slate-600">Click to upload an image</span>
          <span class="text-xs text-slate-400">JPG, PNG up to 2MB</span>
          <input type="file" accept="image/*" class="hidden" (change)="onFileSelected($event)" />
        </label>

        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-slate-200"></div>
          <span class="text-xs font-medium text-slate-400">OR ENTER URL</span>
          <div class="h-px flex-1 bg-slate-200"></div>
        </div>

        <label class="block">
          <input [(ngModel)]="photoFormUrl" type="url" placeholder="https://example.com/photo.jpg"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>

        <button *ngIf="photoFormUrl" type="button" (click)="photoFormUrl = ''; selectedPhotoFile = null"
          class="text-xs font-medium text-rose-600 hover:text-rose-700">Remove photo</button>
      </div>
    </app-form-modal>
  `,
})
export class ParentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);
  private readonly notify = inject(NotificationService);

  readonly readString = readString;

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Parent Profile';
  photoUrl = '';
  private parentId = '';

  showPhotoModal = false;
  photoFormUrl = '';
  photoUploading = false;
  selectedPhotoFile: File | null = null;

  get initials(): string {
    const first = readString(this.detail, 'firstName')?.charAt(0) || '';
    const last = readString(this.detail, 'lastName')?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  ngOnInit(): void {
    this.parentId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.parentId) {
      this.errorMessage = 'Parent id is missing from the route.';
      this.isLoading = false;
      return;
    }

    this.api.getParent(this.parentId).subscribe({
      next: (response) => {
        this.detail = extractItem<Record<string, unknown>>(response);
        this.title = this.fullName(this.detail);
        this.photoUrl = readString(this.detail, 'photoUrl', 'photo_url')
          || readString(this.detail, 'photoBase64')
          || '';
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Parent details could not be loaded from the API.');
        this.isLoading = false;
      },
    });
  }

  openPhotoModal(): void {
    this.photoFormUrl = this.photoUrl;
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
    this.api.updateParent(this.parentId, {}, this.selectedPhotoFile || undefined).subscribe({
      next: (response) => {
        const updated = extractItem<Record<string, unknown>>(response);
        this.photoUrl = readString(updated, 'photoUrl') || readString(updated, 'photoBase64') || this.photoFormUrl;
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
      { label: 'Primary Phone', value: readString(this.detail, 'phonePrimary') || 'N/A', detail: 'Main guardian contact number.' },
      { label: 'Email', value: readString(this.detail, 'email') || 'N/A', detail: 'Primary guardian email address.' },
      { label: 'NID', value: readString(this.detail, 'nidNumber') || 'N/A', detail: 'Identity reference returned by backend.' },
      { label: 'Created', value: this.date(readString(this.detail, 'createdAt')), detail: 'Record creation date.' },
    ];
  }

  get sections(): Array<{ title: string; items: Array<{ label: string; value: string }> }> {
    if (!this.detail) return [];
    return [
      {
        title: 'Personal Information',
        items: [
          { label: 'Full Name', value: this.fullName(this.detail) },
          { label: 'Gender', value: this.value('gender') },
          { label: 'Date of Birth', value: this.date(readString(this.detail, 'dateOfBirth')) },
          { label: 'Nationality', value: this.value('nationality') },
          { label: 'Religion', value: this.value('religion') },
          { label: 'Marital Status', value: this.value('maritalStatus') },
        ],
      },
      {
        title: 'Contact & Address',
        items: [
          { label: 'Phone Primary', value: this.value('phonePrimary') },
          { label: 'Phone Secondary', value: this.value('phoneSecondary') },
          { label: 'Email', value: this.value('email') },
          { label: 'Present Address', value: this.value('presentAddress') },
          { label: 'Permanent Address', value: this.value('permanentAddress') },
        ],
      },
      {
        title: 'Professional & Identity',
        items: [
          { label: 'Employer Name', value: this.value('employerName') },
          { label: 'Employer Contact', value: this.value('employerContact') },
          { label: 'Monthly Income', value: this.value('monthlyIncome') },
          { label: 'NID Number', value: this.value('nidNumber') },
          { label: 'Passport Number', value: this.value('passportNumber') },
        ],
      },
      {
        title: 'Timeline',
        items: [
          { label: 'Created', value: this.dateTime(readString(this.detail, 'createdAt')) },
          { label: 'Updated', value: this.dateTime(readString(this.detail, 'updatedAt')) },
        ],
      },
    ];
  }

  private fullName(source: unknown): string {
    return [readString(source, 'firstName'), readString(source, 'middleName'), readString(source, 'lastName')].filter(Boolean).join(' ') || 'Parent profile';
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
