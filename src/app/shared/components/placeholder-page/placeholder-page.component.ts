import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
    <div>
      <app-page-header [title]="title" [subtitle]="subtitle"></app-page-header>

      <div class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Coming Soon</h3>
        <p class="mt-2 text-sm text-gray-600">
          This feature is currently under development. Continue prompting to have this page built out with full CRUD functionality.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button class="btn btn-primary" (click)="goBack()">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class PlaceholderPageComponent {
  @Input() title = 'Feature Coming Soon';
  @Input() subtitle = 'This page is under development';

  goBack(): void {
    window.history.back();
  }
}
