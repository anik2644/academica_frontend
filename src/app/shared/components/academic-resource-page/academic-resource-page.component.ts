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
  templateUrl: './academic-resource-page.component.html',
  styleUrl: './academic-resource-page.component.css',
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
  @Input() addLabel = '';
  @Input() canView = false;
  @Input() canEdit = false;
  @Input() canDelete = false;
  @Output() refresh = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() view = new EventEmitter<T>();
  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();

  searchQuery = '';

  get showActions(): boolean {
    return this.canView || this.canEdit || this.canDelete;
  }

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
