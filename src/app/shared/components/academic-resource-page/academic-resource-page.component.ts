import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { PageLoaderComponent } from '../page-loader/page-loader.component';

export interface AcademicResourceMetric {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'primary' | 'accent' | 'amber' | 'rose';
}

export interface AcademicResourceColumn<T> {
  label: string;
  value: (row: T) => string;
  secondary?: (row: T) => string;
  badge?: (row: T) => string;
}

@Component({
  selector: 'app-academic-resource-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent, PageLoaderComponent],
  template: `
    <section class="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
      <div class="absolute inset-x-0 top-0 h-56 bg-gradient-to-r from-primary-950 via-primary-800 to-accent-700"></div>
      <div class="absolute -left-12 top-12 h-36 w-36 rounded-full bg-white/10 blur-3xl"></div>
      <div class="absolute right-0 top-0 h-52 w-52 rounded-full bg-accent-200/20 blur-3xl"></div>

      <div class="relative p-6 sm:p-8">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {{ title }}
          </h1>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            *ngFor="let metric of metrics"
            class="rounded-2xl border border-slate-200/70 bg-white/95 p-4 backdrop-blur"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {{ metric.label }}
                </div>
                <div class="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {{ metric.value }}
                </div>
              </div>
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl" [ngClass]="metricToneClass(metric.tone)">
                <span class="h-2.5 w-2.5 rounded-full bg-current"></span>
              </span>
            </div>
            <p class="mt-3 text-sm text-slate-600">{{ metric.detail }}</p>
          </div>
        </div>

        <div class="-mx-1 mt-8 rounded-[26px] border border-slate-200 bg-slate-50/85 p-3 shadow-inner shadow-white sm:p-4">
          <div class="rounded-[22px] border border-slate-200 bg-white p-4 sm:p-5">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ tableTitle }}</div>
                <div class="mt-1 text-sm text-slate-600">{{ tableSubtitle }}</div>
              </div>

              <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label class="relative block min-w-[260px]">
                  <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    [(ngModel)]="searchQuery"
                    type="text"
                    [placeholder]="searchPlaceholder"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:bg-white focus:ring-4 focus:ring-primary-100"
                  />
                </label>

                <button
                  type="button"
                  (click)="refresh.emit()"
                  class="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-primary-200 hover:text-primary-700"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h5M20 20v-5h-5M5.64 18.36A9 9 0 1020 12"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div
              *ngIf="errorMessage"
              class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {{ errorMessage }}
            </div>

            <div *ngIf="isLoading" class="mt-5">
              <app-page-loader
                title="Loading records"
                message="Fetching live data for this module."
                [blockHeights]="[72, 72, 72, 72]"
              ></app-page-loader>
            </div>

            <ng-container *ngIf="!isLoading">
              <div *ngIf="filteredRows.length; else emptyBlock" class="mt-5">
                <div class="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
                  <table class="min-w-full divide-y divide-slate-200">
                    <thead class="bg-slate-50">
                      <tr>
                        <th
                          *ngFor="let column of columns"
                          class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          {{ column.label }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 bg-white">
                      <tr *ngFor="let row of filteredRows" class="align-top transition hover:bg-slate-50/80">
                        <td *ngFor="let column of columns; let isFirst = first" class="px-5 py-4">
                          <div [class.font-semibold]="isFirst" class="text-sm text-slate-900">
                            {{ column.value(row) }}
                          </div>
                          <div *ngIf="column.secondary?.(row)" class="mt-1 text-xs leading-5 text-slate-500">
                            {{ column.secondary?.(row) }}
                          </div>
                          <span
                            *ngIf="column.badge?.(row)"
                            class="mt-2 inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700"
                          >
                            {{ column.badge?.(row) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="grid gap-3 lg:hidden">
                  <article
                    *ngFor="let row of filteredRows"
                    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div
                      *ngFor="let column of columns; let isFirst = first"
                      class="flex items-start justify-between gap-4 border-b border-slate-100 py-3 first:pt-0 last:border-b-0 last:pb-0"
                    >
                      <div class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {{ column.label }}
                      </div>
                      <div class="text-right">
                        <div [class.font-semibold]="isFirst" class="text-sm text-slate-900">
                          {{ column.value(row) }}
                        </div>
                        <div *ngIf="column.secondary?.(row)" class="mt-1 text-xs text-slate-500">
                          {{ column.secondary?.(row) }}
                        </div>
                        <span
                          *ngIf="column.badge?.(row)"
                          class="mt-2 inline-flex rounded-full bg-primary-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-700"
                        >
                          {{ column.badge?.(row) }}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </ng-container>

            <ng-template #emptyBlock>
              <div class="mt-5">
                <app-empty-state
                  [title]="emptyTitle"
                  [message]="emptyMessage"
                ></app-empty-state>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AcademicResourcePageComponent<T> {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() dataSourceLabel = 'Connected to API';
  @Input() tableTitle = 'Records';
  @Input() tableSubtitle = '';
  @Input() searchPlaceholder = 'Search records';
  @Input() emptyTitle = 'No records found';
  @Input() emptyMessage = 'No data is available for this view yet.';
  @Input() errorMessage = '';
  @Input() isLoading = false;
  @Input() metrics: AcademicResourceMetric[] = [];
  @Input() columns: AcademicResourceColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() searchIndex: (row: T) => string = () => '';
  @Output() refresh = new EventEmitter<void>();

  searchQuery = '';

  get filteredRows(): T[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.rows;
    }

    return this.rows.filter((row) =>
      this.searchIndex(row).toLowerCase().includes(query)
    );
  }

  metricToneClass(tone: AcademicResourceMetric['tone']): string {
    const toneMap: Record<NonNullable<AcademicResourceMetric['tone']>, string> = {
      primary: 'bg-primary-100 text-primary-700',
      accent: 'bg-teal-100 text-teal-700',
      amber: 'bg-amber-100 text-amber-700',
      rose: 'bg-rose-100 text-rose-700',
    };

    return toneMap[tone ?? 'primary'];
  }
}
