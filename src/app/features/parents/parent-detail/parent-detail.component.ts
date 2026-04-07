import { CommonModule, formatDate } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SchoolManagementApiService } from '../../../core/services/school-management-api.service';
import { extractItem, getErrorMessage, readString } from '../../../core/utils/api-response.utils';
import { ShimmerBlockComponent } from '../../../shared/components/shimmer-block/shimmer-block.component';

@Component({
  selector: 'app-parent-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ShimmerBlockComponent],
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
  `,
})
export class ParentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(SchoolManagementApiService);

  isLoading = true;
  errorMessage = '';
  detail: Record<string, unknown> | null = null;
  title = 'Parent Profile';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Parent id is missing from the route.';
      this.isLoading = false;
      return;
    }

    this.api.getParent(id).subscribe({
      next: (response) => {
        this.detail = extractItem<Record<string, unknown>>(response);
        this.title = this.fullName(this.detail);
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = getErrorMessage(error, 'Parent details could not be loaded from the API.');
        this.isLoading = false;
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
