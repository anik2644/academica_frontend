import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
      <svg
        class="h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900">{{ title }}</h3>
      <p class="mt-2 text-center text-sm text-gray-600">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class EmptyStateComponent {
  @Input() title = 'No data found';
  @Input() message = 'There is no data to display at this moment.';
}
